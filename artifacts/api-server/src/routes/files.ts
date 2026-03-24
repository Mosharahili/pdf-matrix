import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { eq } from "drizzle-orm";
import { db, filesTable, conversionsTable } from "@workspace/db";
import {
  GetFileParams,
  DeleteFileParams,
  DownloadOriginalFileParams,
  ListFilesResponse,
  GetFileResponse,
  DeleteFileResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.get("/files", async (req, res): Promise<void> => {
  const files = await db.select().from(filesTable).orderBy(filesTable.uploadedAt);
  const filesWithConversions = await Promise.all(
    files.map(async (file) => {
      const convs = await db
        .select()
        .from(conversionsTable)
        .where(eq(conversionsTable.fileId, file.id));
      return { ...file, conversions: convs };
    })
  );
  res.json(ListFilesResponse.parse({ files: filesWithConversions }));
});

router.post("/files/upload", upload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "Bad Request", message: "No file uploaded or invalid file type" });
    return;
  }

  const [record] = await db
    .insert(filesTable)
    .values({
      originalName: req.file.originalname,
      storedPath: req.file.path,
      sizeBytes: req.file.size,
    })
    .returning();

  res.status(201).json(GetFileResponse.parse({ ...record, conversions: [] }));
});

router.get("/files/:fileId", async (req, res): Promise<void> => {
  const params = GetFileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Bad Request", message: params.error.message });
    return;
  }

  const [file] = await db.select().from(filesTable).where(eq(filesTable.id, params.data.fileId));
  if (!file) {
    res.status(404).json({ error: "Not Found", message: "File not found" });
    return;
  }

  const convs = await db
    .select()
    .from(conversionsTable)
    .where(eq(conversionsTable.fileId, file.id));

  res.json(GetFileResponse.parse({ ...file, conversions: convs }));
});

router.delete("/files/:fileId", async (req, res): Promise<void> => {
  const params = DeleteFileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Bad Request", message: params.error.message });
    return;
  }

  const [file] = await db.select().from(filesTable).where(eq(filesTable.id, params.data.fileId));
  if (!file) {
    res.status(404).json({ error: "Not Found", message: "File not found" });
    return;
  }

  const convs = await db
    .select()
    .from(conversionsTable)
    .where(eq(conversionsTable.fileId, file.id));

  for (const conv of convs) {
    if (conv.convertedPath && fs.existsSync(conv.convertedPath)) {
      fs.unlinkSync(conv.convertedPath);
    }
  }

  if (fs.existsSync(file.storedPath)) {
    fs.unlinkSync(file.storedPath);
  }

  await db.delete(filesTable).where(eq(filesTable.id, params.data.fileId));

  res.json(DeleteFileResponse.parse({ success: true }));
});

router.get("/files/:fileId/download", async (req, res): Promise<void> => {
  const params = DownloadOriginalFileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Bad Request", message: params.error.message });
    return;
  }

  const [file] = await db.select().from(filesTable).where(eq(filesTable.id, params.data.fileId));
  if (!file) {
    res.status(404).json({ error: "Not Found", message: "File not found" });
    return;
  }

  if (!fs.existsSync(file.storedPath)) {
    res.status(404).json({ error: "Not Found", message: "File on disk not found" });
    return;
  }

  res.download(file.storedPath, file.originalName);
});

export default router;
