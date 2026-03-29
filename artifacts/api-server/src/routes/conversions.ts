import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs";
import { db, filesTable, conversionsTable } from "@workspace/db";
import {
  StartConversionBody,
  GetConversionStatusParams,
  DownloadConvertedFileParams,
  GetConversionStatusResponse,
} from "@workspace/api-zod";

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

async function extractTextFromPdf(pdfData: Buffer): Promise<{ pages: string[]; allText: string }> {
  const mupdf = await import("mupdf");
  const doc = mupdf.Document.openDocument(pdfData, "application/pdf");
  const pageCount = doc.countPages();
  const pages: string[] = [];
  for (let i = 0; i < pageCount; i++) {
    const page = doc.loadPage(i);
    const text = page.toStructuredText("preserve-whitespace").asText();
    pages.push(text.trim());
    page.destroy();
  }
  doc.destroy();
  const allText = pages.join("\n\n--- Page Break ---\n\n");
  return { pages, allText };
}

async function renderPdfPage(pdfData: Buffer, format: "png" | "jpg"): Promise<Buffer> {
  const mupdf = await import("mupdf");
  const doc = mupdf.Document.openDocument(pdfData, "application/pdf");
  const page = doc.loadPage(0);
  const pixmap = page.toPixmap([2, 0, 0, 2, 0, 0], mupdf.ColorSpace.DeviceRGB, false, true);
  let result: Buffer;
  if (format === "jpg") {
    result = Buffer.from(pixmap.asJPEG(85));
  } else {
    result = Buffer.from(pixmap.asPNG());
  }
  pixmap.destroy();
  page.destroy();
  doc.destroy();
  return result;
}

async function convertPdf(inputPath: string, outputFormat: string, outputDir: string): Promise<string> {
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outputName = `${baseName}-${Date.now()}.${outputFormat}`;
  const outputPath = path.join(outputDir, outputName);
  const pdfData = fs.readFileSync(inputPath);

  if (outputFormat === "txt") {
    const { allText } = await extractTextFromPdf(pdfData);
    const text = allText.trim() || "[No extractable text found in this PDF]";
    fs.writeFileSync(outputPath, text, "utf-8");
    return outputPath;
  }

  if (outputFormat === "png" || outputFormat === "jpg") {
    const imgBuf = await renderPdfPage(pdfData, outputFormat);
    fs.writeFileSync(outputPath, imgBuf);
    return outputPath;
  }

  if (outputFormat === "docx") {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import("docx");
    const { allText, pages } = await extractTextFromPdf(pdfData);
    const children = [];
    children.push(
      new Paragraph({
        text: baseName,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.LEFT,
      })
    );
    pages.forEach((pageText, idx) => {
      if (pages.length > 1) {
        children.push(
          new Paragraph({
            text: `Page ${idx + 1}`,
            heading: HeadingLevel.HEADING_2,
          })
        );
      }
      const lines = pageText.split("\n");
      for (const line of lines) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: line, size: 22 })],
          })
        );
      }
      if (idx < pages.length - 1) {
        children.push(new Paragraph({ pageBreakBefore: true, children: [] }));
      }
    });
    const doc = new Document({
      sections: [{ children }],
    });
    const buf = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buf);
    return outputPath;
  }

  if (outputFormat === "xlsx") {
    const ExcelJS = await import("exceljs");
    const WorkbookClass = (ExcelJS as any).default?.Workbook ?? (ExcelJS as any).Workbook;
    const wb = new WorkbookClass();
    const { pages } = await extractTextFromPdf(pdfData);
    pages.forEach((pageText, idx) => {
      const ws = wb.addWorksheet(`Page ${idx + 1}`);
      ws.getColumn(1).width = 80;
      const lines = pageText.split("\n").filter((l: string) => l.trim());
      if (lines.length === 0) {
        ws.addRow(["[No extractable text on this page]"]);
      } else {
        lines.forEach((line: string) => ws.addRow([line]));
      }
    });
    const buf = await wb.xlsx.writeBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buf));
    return outputPath;
  }

  if (outputFormat === "pptx") {
    const PptxGenJS = (await import("pptxgenjs")).default;
    const { pages } = await extractTextFromPdf(pdfData);
    const prs = new PptxGenJS();
    prs.layout = "LAYOUT_WIDE";
    pages.forEach((pageText, idx) => {
      const slide = prs.addSlide();
      slide.addText(`Page ${idx + 1} of ${pages.length}`, {
        x: 0.5, y: 0.1, w: 9, h: 0.5,
        fontSize: 12, color: "888888", italic: true,
      });
      const lines = pageText.split("\n").filter((l: string) => l.trim());
      const content = lines.length > 0 ? lines.join("\n") : "[No extractable text on this page]";
      slide.addText(content, {
        x: 0.5, y: 0.7, w: 9, h: 4.8,
        fontSize: 14, color: "333333",
        valign: "top", wrap: true,
      });
    });
    const buf = await prs.write({ outputType: "nodebuffer" });
    fs.writeFileSync(outputPath, buf as Buffer);
    return outputPath;
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
  const downloadBaseName = file ? path.basename(file.originalName, ".pdf") : "converted";
  const downloadName = `${downloadBaseName}.${conv.outputFormat}`;

  res.setHeader("Content-Type", mime);
  res.download(conv.convertedPath, downloadName);
});

export default router;
