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

const CONVERTED_DIR = process.env.VERCEL
  ? "/tmp/pdf-converted"
  : path.join(process.cwd(), "converted");
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
      await execFileAsync("pdftotext", [inputPath, outputPath]);
      if (fs.existsSync(outputPath)) {
        return outputPath;
      }
      throw new Error("pdftotext produced no output");
    } catch (pdftotextErr) {
      try {
        const { stdout } = await execFileAsync("strings", [inputPath]);
        if (!stdout || stdout.trim().length === 0) {
          throw new Error("No extractable text found in PDF");
        }
        fs.writeFileSync(outputPath, stdout);
        return outputPath;
      } catch (stringsErr) {
        throw new Error(`Text extraction failed: ${String(pdftotextErr)}; strings fallback: ${String(stringsErr)}`);
      }
    }
  }

  if (outputFormat === "png" || outputFormat === "jpg") {
    const density = 150;
    const quality = 90;
    try {
      await execFileAsync("convert", [
        "-density", String(density),
        "-quality", String(quality),
        `${inputPath}[0]`,
        outputPath,
      ]);
      if (fs.existsSync(outputPath)) {
        return outputPath;
      }
      throw new Error("ImageMagick convert produced no output");
    } catch (convertErr) {
      try {
        const prefix = path.join(outputDir, `${baseName}-${Date.now()}`);
        const ext = outputFormat === "jpg" ? "jpeg" : "png";
        await execFileAsync("pdftoppm", [
          "-r", String(density),
          "-f", "1",
          "-l", "1",
          `-${ext}`,
          inputPath,
          prefix,
        ]);
        const dirFiles = fs.readdirSync(outputDir);
        const basePart = path.basename(prefix);
        const match = dirFiles.find(
          (f) => f.startsWith(basePart) && f.endsWith(`.${outputFormat}`)
        );
        if (match) {
          const finalPath = path.join(outputDir, outputName);
          fs.renameSync(path.join(outputDir, match), finalPath);
          return finalPath;
        }
        throw new Error("pdftoppm produced no output file");
      } catch (pdftoppmErr) {
        throw new Error(
          `Image conversion failed. ImageMagick: ${String(convertErr)}; pdftoppm: ${String(pdftoppmErr)}`
        );
      }
    }
  }

  if (outputFormat === "docx" || outputFormat === "xlsx" || outputFormat === "pptx") {
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
      throw new Error("LibreOffice produced no output file");
    } catch (libreOfficeErr) {
      try {
        await execFileAsync("unoconv", ["-f", outputFormat, "-o", outputPath, inputPath]);
        if (fs.existsSync(outputPath)) {
          return outputPath;
        }
        throw new Error("unoconv produced no output file");
      } catch (unoconvErr) {
        throw new Error(
          `Office conversion requires LibreOffice or unoconv. ` +
          `LibreOffice: ${String(libreOfficeErr)}; unoconv: ${String(unoconvErr)}`
        );
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
