import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { filesTable } from "./files";

export const conversionsTable = pgTable("conversions", {
  id: serial("id").primaryKey(),
  fileId: integer("file_id").notNull().references(() => filesTable.id, { onDelete: "cascade" }),
  outputFormat: text("output_format").notNull(),
  status: text("status").notNull().default("pending"),
  convertedPath: text("converted_path"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const insertConversionSchema = createInsertSchema(conversionsTable).omit({ id: true, createdAt: true, completedAt: true });
export type InsertConversion = z.infer<typeof insertConversionSchema>;
export type Conversion = typeof conversionsTable.$inferSelect;
