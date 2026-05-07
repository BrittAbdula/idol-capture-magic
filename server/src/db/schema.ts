import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  handle: text("handle").notNull().unique(),
  googleId: text("google_id").unique(),
  biasGroupId: text("bias_group_id"),
  biasMemberId: text("bias_member_id"),
  locale: text("locale").notNull().default("en"),
  plan: text("plan", { enum: ["free", "plus", "pro"] }).notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  planRenewsAt: integer("plan_renews_at"),
  dailyQuotaUsed: integer("daily_quota_used").notNull().default(0),
  dailyQuotaResetAt: integer("daily_quota_reset_at").notNull(),
  createdAt: integer("created_at").notNull()
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: integer("expires_at").notNull()
});

export const groups = sqliteTable("groups", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  nameKo: text("name_ko"),
  nameJa: text("name_ja"),
  agency: text("agency"),
  debutDate: text("debut_date"),
  themeColor: text("theme_color").notNull().default("#FFFFFF"),
  coverImage: text("cover_image"),
  popularityRank: integer("popularity_rank").notNull().default(999)
});

export const members = sqliteTable("members", {
  id: text("id").primaryKey(),
  groupId: text("group_id")
    .notNull()
    .references(() => groups.id),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  nameKo: text("name_ko"),
  nameJa: text("name_ja"),
  position: text("position"),
  birthday: text("birthday"),
  silhouetteImage: text("silhouette_image").notNull(),
  todoLicensedAsset: integer("todo_licensed_asset", { mode: "boolean" }).notNull().default(true),
  facts: text("facts")
});

export const concepts = sqliteTable("concepts", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  format: text("format", { enum: ["selca", "photocard", "strip", "fancall"] }).notNull(),
  category: text("category"),
  campaignId: text("campaign_id"),
  promptTemplate: text("prompt_template").notNull(),
  styleTokens: text("style_tokens").notNull(),
  sampleOutputUrl: text("sample_output_url").notNull(),
  premium: integer("premium", { mode: "boolean" }).notNull().default(false)
});

export const campaigns = sqliteTable("campaigns", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  groupId: text("group_id")
    .notNull()
    .references(() => groups.id),
  title: text("title").notNull(),
  releaseDate: text("release_date").notNull(),
  status: text("status", { enum: ["upcoming", "active", "archived"] }).notNull(),
  conceptKeywords: text("concept_keywords").notNull(),
  conceptPalette: text("concept_palette").notNull(),
  heroImage: text("hero_image"),
  description: text("description")
});

export const generations = sqliteTable("generations", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  conceptId: text("concept_id")
    .notNull()
    .references(() => concepts.id),
  memberId: text("member_id")
    .notNull()
    .references(() => members.id),
  format: text("format").notNull(),
  status: text("status", { enum: ["queued", "running", "succeeded", "failed"] }).notNull(),
  inputImageRef: text("input_image_ref"),
  outputImageRef: text("output_image_ref"),
  errorMessage: text("error_message"),
  cost: real("cost"),
  watermarkLevel: text("watermark_level").notNull(),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at").notNull()
});

export const binderItems = sqliteTable("binder_items", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  generationId: text("generation_id")
    .notNull()
    .references(() => generations.id),
  customCaption: text("custom_caption"),
  position: integer("position").notNull().default(0),
  addedAt: integer("added_at").notNull()
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type Member = typeof members.$inferSelect;
export type Concept = typeof concepts.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type Generation = typeof generations.$inferSelect;
export type BinderItem = typeof binderItems.$inferSelect;
