import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["CLIENT", "ADMIN"] }).notNull().default("CLIENT"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  bookings: many(bookings),
  mealPreference: one(mealPreferences),
  adminNote: one(adminNotes),
  trainerMealPlan: one(trainerMealPlans),
}));

export const locations = pgTable("locations", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const locationsRelations = relations(locations, ({ many }) => ({
  availabilityBlocks: many(availabilityBlocks),
  bookings: many(bookings),
}));

export const availabilityBlocks = pgTable("availability_blocks", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  branchId: varchar("branch_id", { length: 36 }).notNull().references(() => locations.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const availabilityBlocksRelations = relations(availabilityBlocks, ({ one }) => ({
  location: one(locations, {
    fields: [availabilityBlocks.branchId],
    references: [locations.id],
  }),
}));

export const bookings = pgTable("bookings", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  duration: integer("duration").notNull().default(90),
  bookingType: text("booking_type", { enum: ["app", "manual"] }).notNull().default("app"),
  branchId: varchar("branch_id", { length: 36 }).notNull().references(() => locations.id),
  branchName: text("branch_name").notNull(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  userName: text("user_name"),
  manualClientName: text("manual_client_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  location: one(locations, {
    fields: [bookings.branchId],
    references: [locations.id],
  }),
}));

export const mealPreferences = pgTable("meal_preferences", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).notNull().unique().references(() => users.id),
  likes: text("likes").notNull().default(""),
  dislikes: text("dislikes").notNull().default(""),
  mealsPerDay: integer("meals_per_day").notNull().default(3),
  goals: text("goals").notNull().default("[]"),
  notes: text("notes").notNull().default(""),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const mealPreferencesRelations = relations(mealPreferences, ({ one }) => ({
  user: one(users, {
    fields: [mealPreferences.userId],
    references: [users.id],
  }),
}));

export const adminNotes = pgTable("admin_notes", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).notNull().unique().references(() => users.id),
  note: text("note").notNull().default(""),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const adminNotesRelations = relations(adminNotes, ({ one }) => ({
  user: one(users, {
    fields: [adminNotes.userId],
    references: [users.id],
  }),
}));

export const trainerMealPlans = pgTable("trainer_meal_plans", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).notNull().unique().references(() => users.id),
  content: text("content").notNull(),
  fileType: text("file_type", { enum: ["pdf", "text"] }).notNull().default("text"),
  fileName: text("file_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const trainerMealPlansRelations = relations(trainerMealPlans, ({ one }) => ({
  user: one(users, {
    fields: [trainerMealPlans.userId],
    references: [users.id],
  }),
}));

export const notifications = pgTable("notifications", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("title"),
  body: text("body").notNull(),
  targetType: text("target_type", { enum: ["all", "booked"] }).notNull().default("all"),
  dateFilter: text("date_filter"),
  weekFilter: boolean("week_filter").default(false),
  locationId: varchar("location_id", { length: 36 }),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  recipientCount: integer("recipient_count").notNull().default(0),
});

export const trainerContact = pgTable("trainer_contact", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  phone: text("phone").notNull(),
  email: text("email"),
  whatsapp: text("whatsapp"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(4),
  role: z.enum(["CLIENT", "ADMIN"]).optional(),
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
});

export const insertAvailabilityBlockSchema = createInsertSchema(availabilityBlocks).omit({
  id: true,
  createdAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export const insertMealPreferenceSchema = createInsertSchema(mealPreferences).omit({
  id: true,
  updatedAt: true,
});

export const insertAdminNoteSchema = createInsertSchema(adminNotes).omit({
  id: true,
  updatedAt: true,
});

export const insertTrainerMealPlanSchema = createInsertSchema(trainerMealPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  sentAt: true,
});

export const insertTrainerContactSchema = createInsertSchema(trainerContact).omit({
  id: true,
  updatedAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type AvailabilityBlock = typeof availabilityBlocks.$inferSelect;
export type InsertAvailabilityBlock = z.infer<typeof insertAvailabilityBlockSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type MealPreference = typeof mealPreferences.$inferSelect;
export type InsertMealPreference = z.infer<typeof insertMealPreferenceSchema>;
export type AdminNote = typeof adminNotes.$inferSelect;
export type InsertAdminNote = z.infer<typeof insertAdminNoteSchema>;
export type TrainerMealPlan = typeof trainerMealPlans.$inferSelect;
export type InsertTrainerMealPlan = z.infer<typeof insertTrainerMealPlanSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type TrainerContact = typeof trainerContact.$inferSelect;
export type InsertTrainerContact = z.infer<typeof insertTrainerContactSchema>;
