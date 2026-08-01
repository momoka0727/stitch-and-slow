import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const stitchProgress = sqliteTable(
  "stitch_progress",
  {
    id: text("id").primaryKey(),
    userEmail: text("user_email").notNull(),
    patternId: text("pattern_id").notNull(),
    patternJson: text("pattern_json").notNull(),
    stitchedJson: text("stitched_json").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [uniqueIndex("stitch_progress_user_pattern_idx").on(table.userEmail, table.patternId)],
);

export const sharedProjects = sqliteTable("shared_projects", {
  id: text("id").primaryKey(),
  senderName: text("sender_name").notNull(),
  recipientEmail: text("recipient_email").notNull(),
  patternJson: text("pattern_json").notNull(),
  createdAt: integer("created_at").notNull(),
});
