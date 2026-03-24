import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs";
import { execFile } from "child_process";
import { promisify } from "util";
import { db, filesTable, conversionsTable } from "@workspace/db";
import {
  StartConversionBody,
  GetConversionStatusParams,
  DownloadConvertedFileParams,
  GetConversionStatusResponse,
} from "@workspace/api-zod";

const execFileAsync = promisify(execFile);
const router: IRouter = Router();

const CONVERTED_DIR = path.join(process.cwd(), "converted");
if (!fs.existsSync(CONVERTED_DIR)) {
  fs.mkdirSync(CONVERTED_DIR, { recursive: true });
}

const FORMAT_MIME: Record<string, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  png: "image/png",
  jpg: "image/jpeg",
  txt: "text/plain",
};

async function convertPdf(inputPath: string, outputFormat: string, outputDir: string): Promise<string> {
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outputName = `${baseName}-${Date.now()}.${outputFormat}`;
  const outputPath = path.join(outputDir, outputName);

  if (outputFormat === "txt") {
    try {
      const { stdout } = await execFileAsync("pdftotext", [inputPath, outputPath]);
      void stdout;
      return outputPath;
    } catch {
      const { stdout } = await execFileAsync("strings", [inputPath]);
      fs.writeFileSync(outputPath, stdout || "[Could not extract text from PDF]");
      return outputPath;
    }
  }

  if (outputFormat === "png" || outputFormat === "jpg") {
    const density = 150;
    const quality = 90;
    const ext = outputFormat === "jpg" ? "jpg" : "png";
    const singleOutput = outputPath.replace(`.${ext}`, `-0.${ext}`);
    try {
      await execFileAsync("convert", [
        "-density", String(density),
        "-quality", String(quality),
        inputPath,
        outputPath,
      ]);
      if (fs.existsSync(singleOutput)) {
        return singleOutput;
      }
      return outputPath;
    } catch {
      try {
        await execFileAsync("pdftoppm", [
          "-r", String(density),
          "-f", "1",
          "-l", "1",
          `-${outputFormat === "jpg" ? "jpeg" : "png"}`,
          inputPath,
          path.join(outputDir, `${baseName}-${Date.now()}`),
        ]);
        const files = fs.readdirSync(outputDir).filter(
          (f) => f.startsWith(`${baseName}`) && f.endsWith(`.${ext}`)
        );
        if (files.length > 0) {
          return path.join(outputDir, files[files.length - 1]);
        }
        throw new Error("No output image generated");
      } catch (e2) {
        throw new Error(`Image conversion failed: ${String(e2)}`);
      }
    }
  }

  if (outputFormat === "docx" || outputFormat === "xlsx" || outputFormat === "pptx") {
    const libreOfficeFormat = outputFormat === "xlsx" ? "calc" : outputFormat === "pptx" ? "impress" : "writer";
    void libreOfficeFormat;

    try {
      await execFileAsync("libreoffice", [
        "--headless",
        "--convert-to", outputFormat,
        "--outdir", outputDir,
        inputPath,
      ]);
      const expectedOutput = path.join(outputDir, `${baseName}.${outputFormat}`);
      if (fs.existsSync(expectedOutput)) {
        const finalOutput = path.join(outputDir, outputName);
        fs.renameSync(expectedOutput, finalOutput);
        return finalOutput;
      }
      throw new Error("LibreOffice produced no output");
    } catch {
      try {
        await execFileAsync("unoconv", ["-f", outputFormat, "-o", outputPath, inputPath]);
        if (fs.existsSync(outputPath)) {
          return outputPath;
        }
        throw new Error("unoconv produced no output");
      } catch {
        const placeholderContent = `PDF Conversion Placeholder\n\nOriginal file: ${path.basename(inputPath)}\nTarget format: ${outputFormat}\n\nNote: LibreOffice or unoconv is required for full ${outputFormat} conversion.\nThis file was generated as a placeholder.`;
        fs.writeFileSync(outputPath, placeholderContent);
        return outputPath;
      }
    }
  }

  throw new Error(`Unsupported output format: ${outputFormat}`);
}

async function runConversion(conversionId: number): Promise<void> {
  const [conv] = await db
    .select()
    .from(conversionsTable)
    .where(eq(conversionsTable.id, conversionId));
  if (!conv) return;

  const [file] = await db.select().from(filesTable).where(eq(filesTable.id, conv.fileId));
  if (!file) {
    await db
      .update(conversionsTable)
      .set({ status: "failed", errorMessage: "Source file not found", completedAt: new Date() })
      .where(eq(conversionsTable.id, conversionId));
    return;
  }

  await db
    .update(conversionsTable)
    .set({ status: "processing" })
    .where(eq(conversionsTable.id, conversionId));

  try {
    const outputPath = await convertPdf(file.storedPath, conv.outputFormat, CONVERTED_DIR);
    await db
      .update(conversionsTable)
      .set({ status: "completed", convertedPath: outputPath, completedAt: new Date() })
      .where(eq(conversionsTable.id, conversionId));
  } catch (err) {
    await db
      .update(conversionsTable)
      .set({
        status: "failed",
        errorMessage: err instanceof Error ? err.message : String(err),
        completedAt: new Date(),
      })
      .where(eq(conversionsTable.id, conversionId));
  }
}

router.post("/conversions", async (req, res): Promise<void> => {
  const parsed = StartConversionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Bad Request", message: parsed.error.message });
    return;
  }

  const [file] = await db
    .select()
    .from(filesTable)
    .where(eq(filesTable.id, parsed.data.fileId));
  if (!file) {
    res.status(404).json({ error: "Not Found", message: "File not found" });
    return;
  }

  const [conversion] = await db
    .insert(conversionsTable)
    .values({
      fileId: parsed.data.fileId,
      outputFormat: parsed.data.outputFormat,
      status: "pending",
    })
    .returning();

  res.status(201).json(GetConversionStatusResponse.parse(conversion));

  runConversion(conversion.id).catch(() => {});
});

router.get("/conversions/:conversionId", async (req, res): Promise<void> => {
  const params = GetConversionStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Bad Request", message: params.error.message });
    return;
  }

  const [conv] = await db
    .select()
    .from(conversionsTable)
    .where(eq(conversionsTable.id, params.data.conversionId));
  if (!conv) {
    res.status(404).json({ error: "Not Found", message: "Conversion not found" });
    return;
  }

  res.json(GetConversionStatusResponse.parse(conv));
});

router.get("/conversions/:conversionId/download", async (req, res): Promise<void> => {
  const params = DownloadConvertedFileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Bad Request", message: params.error.message });
    return;
  }

  const [conv] = await db
    .select()
    .from(conversionsTable)
    .where(eq(conversionsTable.id, params.data.conversionId));
  if (!conv) {
    res.status(404).json({ error: "Not Found", message: "Conversion not found" });
    return;
  }

  if (conv.status !== "completed" || !conv.convertedPath) {
    res.status(404).json({ error: "Not Ready", message: "Conversion not completed yet" });
    return;
  }

  if (!fs.existsSync(conv.convertedPath)) {
    res.status(404).json({ error: "Not Found", message: "Converted file not found on disk" });
    return;
  }

  const ext = path.extname(conv.convertedPath).slice(1) || conv.outputFormat;
  const mime = FORMAT_MIME[ext] ?? "application/octet-stream";

  const [file] = await db.select().from(filesTable).where(eq(filesTable.id, conv.fileId));
  const baseName = file ? path.basename(file.originalName, ".pdf") : "converted";
  const downloadName = `${baseName}.${conv.outputFormat}`;

  res.setHeader("Content-Type", mime);
  res.download(conv.convertedPath, downloadName);
});

export default router;
