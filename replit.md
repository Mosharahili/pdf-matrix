# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── pdf-platform/       # React+Vite PDF management frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Application: PDF Manager & Converter

A full-stack bilingual (English + Arabic) PDF management and conversion platform.

### Features
- Upload PDF files via drag-and-drop or file picker
- Convert PDFs to Word (.docx), Excel (.xlsx), PowerPoint (.pptx), PNG, JPG, or TXT
- File manager dashboard with conversion status polling
- Download original or converted files
- Language switcher (English/Arabic) with RTL support
- SEO optimized: meta tags, Open Graph, hreflang, JSON-LD, sitemap.xml, robots.txt

### Key routes (API)
- `GET /api/files` — list all uploaded files with their conversions
- `POST /api/files/upload` — upload a PDF (multipart/form-data)
- `GET /api/files/:fileId` — get file details
- `DELETE /api/files/:fileId` — delete file and its conversions
- `GET /api/files/:fileId/download` — download original PDF
- `POST /api/conversions` — start a conversion (`{ fileId, outputFormat }`)
- `GET /api/conversions/:conversionId` — get conversion status
- `GET /api/conversions/:conversionId/download` — download converted file

### Conversion formats
Supported: `docx`, `xlsx`, `pptx`, `png`, `jpg`, `txt`
- **TXT**: uses `pdftotext` (from poppler) or `strings` fallback
- **Images**: uses ImageMagick `convert` or `pdftoppm` fallback
- **Office formats**: uses LibreOffice `libreoffice --headless` or `unoconv` fallback

### File storage
Files are stored on the server filesystem:
- Uploads: `artifacts/api-server/uploads/`
- Converted: `artifacts/api-server/converted/`

### Frontend (pdf-platform)
- `src/pages/Home.tsx` — main page with hero + upload + file manager
- `src/components/Layout.tsx` — navbar with language switcher, footer
- `src/components/Dropzone.tsx` — drag & drop file upload
- `src/components/FileManager.tsx` — file listing and conversion controls
- `src/components/SEO.tsx` — React Helmet SEO tags
- `src/lib/i18n.tsx` — English/Arabic translations and RTL context
- `public/robots.txt` — search engine crawler rules
- `public/sitemap.xml` — sitemap for all pages (update domain for production)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /healthz`; `src/routes/files.ts` handles file upload/management; `src/routes/conversions.ts` handles PDF conversion
- Depends on: `@workspace/db`, `@workspace/api-zod`, `multer`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.mjs`)

### `artifacts/pdf-platform` (`@workspace/pdf-platform`)

React + Vite frontend for PDF management. Served at `/`.

- Bilingual: English/Arabic with RTL support via `src/lib/i18n.tsx`
- Uses `react-dropzone` for file uploads
- Uses `react-helmet-async` for SEO tags
- Uses `framer-motion` for animations
- Uses `date-fns` for date formatting

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/schema/files.ts` — `filesTable` (id, original_name, stored_path, size_bytes, uploaded_at)
- `src/schema/conversions.ts` — `conversionsTable` (id, file_id, output_format, status, converted_path, error_message, created_at, completed_at)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages.

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec.

### `scripts` (`@workspace/scripts`)

Utility scripts package.
