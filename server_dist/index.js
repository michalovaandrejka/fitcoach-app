var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express from "express";

// server/routes.ts
import { createServer } from "node:http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminNotes: () => adminNotes,
  adminNotesRelations: () => adminNotesRelations,
  availabilityBlocks: () => availabilityBlocks,
  availabilityBlocksRelations: () => availabilityBlocksRelations,
  bookings: () => bookings,
  bookingsRelations: () => bookingsRelations,
  insertAdminNoteSchema: () => insertAdminNoteSchema,
  insertAvailabilityBlockSchema: () => insertAvailabilityBlockSchema,
  insertBookingSchema: () => insertBookingSchema,
  insertLocationSchema: () => insertLocationSchema,
  insertMealPreferenceSchema: () => insertMealPreferenceSchema,
  insertNotificationSchema: () => insertNotificationSchema,
  insertTrainerMealPlanSchema: () => insertTrainerMealPlanSchema,
  insertUserSchema: () => insertUserSchema,
  locations: () => locations,
  locationsRelations: () => locationsRelations,
  loginSchema: () => loginSchema,
  mealPreferences: () => mealPreferences,
  mealPreferencesRelations: () => mealPreferencesRelations,
  notifications: () => notifications,
  registerSchema: () => registerSchema,
  trainerMealPlans: () => trainerMealPlans,
  trainerMealPlansRelations: () => trainerMealPlansRelations,
  users: () => users,
  usersRelations: () => usersRelations
});
import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["CLIENT", "ADMIN"] }).notNull().default("CLIENT"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var usersRelations = relations(users, ({ many, one }) => ({
  bookings: many(bookings),
  mealPreference: one(mealPreferences),
  adminNote: one(adminNotes),
  trainerMealPlan: one(trainerMealPlans)
}));
var locations = pgTable("locations", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var locationsRelations = relations(locations, ({ many }) => ({
  availabilityBlocks: many(availabilityBlocks),
  bookings: many(bookings)
}));
var availabilityBlocks = pgTable("availability_blocks", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  branchId: varchar("branch_id", { length: 36 }).notNull().references(() => locations.id),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var availabilityBlocksRelations = relations(availabilityBlocks, ({ one }) => ({
  location: one(locations, {
    fields: [availabilityBlocks.branchId],
    references: [locations.id]
  })
}));
var bookings = pgTable("bookings", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
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
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id]
  }),
  location: one(locations, {
    fields: [bookings.branchId],
    references: [locations.id]
  })
}));
var mealPreferences = pgTable("meal_preferences", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).notNull().unique().references(() => users.id),
  likes: text("likes").notNull().default(""),
  dislikes: text("dislikes").notNull().default(""),
  mealsPerDay: integer("meals_per_day").notNull().default(3),
  goals: text("goals").notNull().default("[]"),
  notes: text("notes").notNull().default(""),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var mealPreferencesRelations = relations(mealPreferences, ({ one }) => ({
  user: one(users, {
    fields: [mealPreferences.userId],
    references: [users.id]
  })
}));
var adminNotes = pgTable("admin_notes", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).notNull().unique().references(() => users.id),
  note: text("note").notNull().default(""),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var adminNotesRelations = relations(adminNotes, ({ one }) => ({
  user: one(users, {
    fields: [adminNotes.userId],
    references: [users.id]
  })
}));
var trainerMealPlans = pgTable("trainer_meal_plans", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).notNull().unique().references(() => users.id),
  content: text("content").notNull(),
  fileType: text("file_type", { enum: ["pdf", "text"] }).notNull().default("text"),
  fileName: text("file_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var trainerMealPlansRelations = relations(trainerMealPlans, ({ one }) => ({
  user: one(users, {
    fields: [trainerMealPlans.userId],
    references: [users.id]
  })
}));
var notifications = pgTable("notifications", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  title: text("title"),
  body: text("body").notNull(),
  targetType: text("target_type", { enum: ["all", "booked"] }).notNull().default("all"),
  dateFilter: text("date_filter"),
  weekFilter: boolean("week_filter").default(false),
  locationId: varchar("location_id", { length: 36 }),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  recipientCount: integer("recipient_count").notNull().default(0)
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});
var loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1)
});
var registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(4),
  role: z.enum(["CLIENT", "ADMIN"]).optional()
});
var insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true
});
var insertAvailabilityBlockSchema = createInsertSchema(availabilityBlocks).omit({
  id: true,
  createdAt: true
});
var insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true
});
var insertMealPreferenceSchema = createInsertSchema(mealPreferences).omit({
  id: true,
  updatedAt: true
});
var insertAdminNoteSchema = createInsertSchema(adminNotes).omit({
  id: true,
  updatedAt: true
});
var insertTrainerMealPlanSchema = createInsertSchema(trainerMealPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  sentAt: true
});

// server/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
var { Pool } = pg;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
import { eq, desc, asc } from "drizzle-orm";
import { createHash } from "crypto";
var TRAINING_DURATION = 90;
function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}
function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || void 0;
  }
  async createUser(input) {
    const { password, ...userData } = input;
    const [user] = await db.insert(users).values({ ...userData, passwordHash: hashPassword(password) }).returning();
    return user;
  }
  async getUsers() {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }
  async updateUser(id, data) {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user || void 0;
  }
  async deleteUser(id) {
    await db.delete(bookings).where(eq(bookings.userId, id));
    await db.delete(mealPreferences).where(eq(mealPreferences.userId, id));
    await db.delete(adminNotes).where(eq(adminNotes.userId, id));
    await db.delete(trainerMealPlans).where(eq(trainerMealPlans.userId, id));
    await db.delete(users).where(eq(users.id, id));
  }
  async getLocations() {
    return db.select().from(locations).where(eq(locations.isActive, true));
  }
  async getAllLocations() {
    return db.select().from(locations);
  }
  async getLocation(id) {
    const [location] = await db.select().from(locations).where(eq(locations.id, id));
    return location || void 0;
  }
  async createLocation(location) {
    const [loc] = await db.insert(locations).values(location).returning();
    return loc;
  }
  async updateLocation(id, data) {
    const [loc] = await db.update(locations).set(data).where(eq(locations.id, id)).returning();
    return loc || void 0;
  }
  async deleteLocation(id) {
    await db.update(locations).set({ isActive: false }).where(eq(locations.id, id));
  }
  async getAvailabilityBlocks() {
    return db.select().from(availabilityBlocks).orderBy(asc(availabilityBlocks.date), asc(availabilityBlocks.startTime));
  }
  async getAvailabilityBlocksByDate(date) {
    return db.select().from(availabilityBlocks).where(eq(availabilityBlocks.date, date)).orderBy(asc(availabilityBlocks.startTime));
  }
  async getAvailabilityBlock(id) {
    const [block] = await db.select().from(availabilityBlocks).where(eq(availabilityBlocks.id, id));
    return block || void 0;
  }
  async createAvailabilityBlock(block) {
    const [created] = await db.insert(availabilityBlocks).values(block).returning();
    return created;
  }
  async deleteAvailabilityBlock(id) {
    await db.delete(availabilityBlocks).where(eq(availabilityBlocks.id, id));
  }
  async getBookings() {
    return db.select().from(bookings).orderBy(desc(bookings.date), asc(bookings.startTime));
  }
  async getBookingsByDate(date) {
    return db.select().from(bookings).where(eq(bookings.date, date)).orderBy(asc(bookings.startTime));
  }
  async getBookingsByUser(userId) {
    return db.select().from(bookings).where(eq(bookings.userId, userId)).orderBy(desc(bookings.date), asc(bookings.startTime));
  }
  async getBooking(id) {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || void 0;
  }
  async createBooking(booking) {
    const [created] = await db.insert(bookings).values(booking).returning();
    return created;
  }
  async deleteBooking(id) {
    await db.delete(bookings).where(eq(bookings.id, id));
  }
  async checkBookingCollision(date, startTime, endTime, excludeId) {
    const existingBookings = await this.getBookingsByDate(date);
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    for (const booking of existingBookings) {
      if (excludeId && booking.id === excludeId) continue;
      const bookingStart = this.timeToMinutes(booking.startTime);
      const bookingEnd = this.timeToMinutes(booking.endTime);
      if (start < bookingEnd && end > bookingStart) {
        return true;
      }
    }
    return false;
  }
  timeToMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }
  minutesToTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }
  async getMealPreference(userId) {
    const [pref] = await db.select().from(mealPreferences).where(eq(mealPreferences.userId, userId));
    return pref || void 0;
  }
  async upsertMealPreference(pref) {
    const existing = await this.getMealPreference(pref.userId);
    if (existing) {
      const [updated] = await db.update(mealPreferences).set({ ...pref, updatedAt: /* @__PURE__ */ new Date() }).where(eq(mealPreferences.userId, pref.userId)).returning();
      return updated;
    }
    const [created] = await db.insert(mealPreferences).values(pref).returning();
    return created;
  }
  async getAdminNote(userId) {
    const [note] = await db.select().from(adminNotes).where(eq(adminNotes.userId, userId));
    return note || void 0;
  }
  async upsertAdminNote(note) {
    const existing = await this.getAdminNote(note.userId);
    if (existing) {
      const [updated] = await db.update(adminNotes).set({ ...note, updatedAt: /* @__PURE__ */ new Date() }).where(eq(adminNotes.userId, note.userId)).returning();
      return updated;
    }
    const [created] = await db.insert(adminNotes).values(note).returning();
    return created;
  }
  async getTrainerMealPlan(userId) {
    const [plan] = await db.select().from(trainerMealPlans).where(eq(trainerMealPlans.userId, userId));
    return plan || void 0;
  }
  async upsertTrainerMealPlan(plan) {
    const existing = await this.getTrainerMealPlan(plan.userId);
    if (existing) {
      const [updated] = await db.update(trainerMealPlans).set({ ...plan, updatedAt: /* @__PURE__ */ new Date() }).where(eq(trainerMealPlans.userId, plan.userId)).returning();
      return updated;
    }
    const [created] = await db.insert(trainerMealPlans).values(plan).returning();
    return created;
  }
  async getNotifications() {
    return db.select().from(notifications).orderBy(desc(notifications.sentAt));
  }
  async createNotification(notification) {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }
  async getAvailableStartTimes(date, branchId) {
    let blocks = await this.getAvailabilityBlocksByDate(date);
    if (branchId) {
      blocks = blocks.filter((b) => b.branchId === branchId);
    }
    const existingBookings = await this.getBookingsByDate(date);
    const locs = await this.getLocations();
    const locMap = new Map(locs.map((l) => [l.id, l.name]));
    const availableSlots = [];
    for (const block of blocks) {
      const blockStart = this.timeToMinutes(block.startTime);
      const blockEnd = this.timeToMinutes(block.endTime);
      for (let slotStart = blockStart; slotStart + TRAINING_DURATION <= blockEnd; slotStart += 15) {
        const slotEnd = slotStart + TRAINING_DURATION;
        const startTimeStr = this.minutesToTime(slotStart);
        const endTimeStr = this.minutesToTime(slotEnd);
        let hasCollision = false;
        for (const booking of existingBookings) {
          const bookingStart = this.timeToMinutes(booking.startTime);
          const bookingEnd = this.timeToMinutes(booking.endTime);
          if (slotStart < bookingEnd && slotEnd > bookingStart) {
            hasCollision = true;
            break;
          }
        }
        if (!hasCollision) {
          availableSlots.push({
            startTime: startTimeStr,
            endTime: endTimeStr,
            branchId: block.branchId,
            branchName: locMap.get(block.branchId) || "",
            blockId: block.id
          });
        }
      }
    }
    return availableSlots;
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { z as z2 } from "zod";
import jwt from "jsonwebtoken";
var JWT_SECRET = process.env.SESSION_SECRET || "fitcoach-secret-key";
var JWT_EXPIRES_IN = "7d";
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Token nen\xED p\u0159\xEDtomen" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: "Neplatn\xFD token" });
  }
}
function requireAdmin(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Pouze admin m\xE1 p\u0159\xEDstup" });
  }
  next();
}
async function registerRoutes(app2) {
  app2.get("/status", (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app2.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(400).json({ error: "Email ji\u017E existuje" });
      }
      const user = await storage.createUser({
        email: data.email,
        name: data.name,
        password: data.password,
        role: data.role || "CLIENT",
        onboardingCompleted: false
      });
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      res.json({
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role, onboardingCompleted: user.onboardingCompleted }
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Neplatn\xE1 data", details: error.errors });
      }
      console.error("Register error:", error);
      res.status(500).json({ error: "Chyba p\u0159i registraci" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ error: "Neplatn\xFD email nebo heslo" });
      }
      if (!verifyPassword(data.password, user.passwordHash)) {
        return res.status(401).json({ error: "Neplatn\xFD email nebo heslo" });
      }
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      res.json({
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role, onboardingCompleted: user.onboardingCompleted }
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Neplatn\xE1 data" });
      }
      console.error("Login error:", error);
      res.status(500).json({ error: "Chyba p\u0159i p\u0159ihl\xE1\u0161en\xED" });
    }
  });
  app2.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "U\u017Eivatel nenalezen" });
      }
      res.json({ id: user.id, email: user.email, name: user.name, role: user.role, onboardingCompleted: user.onboardingCompleted });
    } catch (error) {
      console.error("Get me error:", error);
      res.status(500).json({ error: "Chyba" });
    }
  });
  app2.get("/api/users", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const users2 = await storage.getUsers();
      res.json(users2.map((u) => ({ id: u.id, email: u.email, name: u.name, role: u.role, onboardingCompleted: u.onboardingCompleted, createdAt: u.createdAt })));
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Chyba" });
    }
  });
  app2.get("/api/users/:id", authenticateToken, async (req, res) => {
    try {
      if (req.user?.role !== "ADMIN" && req.user?.id !== req.params.id) {
        return res.status(403).json({ error: "P\u0159\xEDstup zam\xEDtnut" });
      }
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "U\u017Eivatel nenalezen" });
      }
      res.json({ id: user.id, email: user.email, name: user.name, role: user.role, onboardingCompleted: user.onboardingCompleted });
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });
  app2.put("/api/users/:id", authenticateToken, async (req, res) => {
    try {
      if (req.user?.role !== "ADMIN" && req.user?.id !== req.params.id) {
        return res.status(403).json({ error: "P\u0159\xEDstup zam\xEDtnut" });
      }
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ error: "U\u017Eivatel nenalezen" });
      }
      res.json({ id: user.id, email: user.email, name: user.name, role: user.role, onboardingCompleted: user.onboardingCompleted });
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });
  app2.delete("/api/users/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });
  app2.get("/api/locations", async (req, res) => {
    try {
      const { includeInactive } = req.query;
      const locs = includeInactive === "true" ? await storage.getAllLocations() : await storage.getLocations();
      res.json(locs);
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });
  app2.post("/api/locations", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const data = insertLocationSchema.parse(req.body);
      const location = await storage.createLocation(data);
      res.json(location);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Neplatn\xE1 data" });
      }
      res.status(500).json({ error: "Chyba" });
    }
  });
  app2.put("/api/locations/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const location = await storage.updateLocation(req.params.id, req.body);
      if (!location) {
        return res.status(404).json({ error: "Pobo\u010Dka nenalezena" });
      }
      res.json(location);
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });
  app2.delete("/api/locations/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      await storage.deleteLocation(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });
  app2.get("/api/availability", async (req, res) => {
    try {
      const { date, branchId } = req.query;
      if (date) {
        const blocks2 = await storage.getAvailabilityBlocksByDate(date);
        return res.json(blocks2);
      }
      const blocks = await storage.getAvailabilityBlocks();
      res.json(blocks);
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });
  app2.post("/api/availability", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const data = insertAvailabilityBlockSchema.parse(req.body);
      const block = await storage.createAvailabilityBlock(data);
      res.json(block);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Neplatn\xE1 data" });
      }
      res.status(500).json({ error: "Chyba" });
    }
  });
  app2.delete("/api/availability/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const block = await storage.getAvailabilityBlock(req.params.id);
      if (!block) {
        return res.status(404).json({ error: "Blok nenalezen" });
      }
      const bookings2 = await storage.getBookingsByDate(block.date);
      const blockStart = timeToMinutes(block.startTime);
      const blockEnd = timeToMinutes(block.endTime);
      const hasBookings = bookings2.some((b) => {
        const bStart = timeToMinutes(b.startTime);
        const bEnd = timeToMinutes(b.endTime);
        return bStart < blockEnd && bEnd > blockStart;
      });
      if (hasBookings) {
        return res.status(400).json({ error: "Blok obsahuje rezervace" });
      }
      await storage.deleteAvailabilityBlock(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });
  app2.get("/api/availability/slots", async (req, res) => {
    try {
      const { date, branchId } = req.query;
      if (!date) {
        return res.status(400).json({ error: "Datum je povinn\xE9" });
      }
      const slots = await storage.getAvailableStartTimes(date, branchId);
      res.json(slots);
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });
  app2.get("/api/availability/dates", async (req, res) => {
    try {
      const { branchId } = req.query;
      const blocks = await storage.getAvailabilityBlocks();
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const futureBlocks = blocks.filter((b) => b.date >= today && (!branchId || b.branchId === branchId));
      const dates = [...new Set(futureBlocks.map((b) => b.date))].sort();
      const availableDates = [];
      for (const date of dates) {
        const slots = await storage.getAvailableStartTimes(date, branchId);
        if (slots.length > 0) {
          availableDates.push(date);
        }
      }
      res.json(availableDates);
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });
  app2.get("/api/bookings", authenticateToken, async (req, res) => {
    try {
      const { date, userId } = req.query;
      if (req.user?.role === "ADMIN") {
        if (date) {
          const bookings4 = await storage.getBookingsByDate(date);
          return res.json(bookings4);
        }
        if (userId) {
          const bookings4 = await storage.getBookingsByUser(userId);
          return res.json(bookings4);
        }
        const bookings3 = await storage.getBookings();
        return res.json(bookings3);
      }
      const bookings2 = await storage.getBookingsByUser(req.user.id);
      res.json(bookings2);
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });
  app2.post("/api/bookings", authenticateToken, async (req, res) => {
    try {
      const { date, startTime, branchId, branchName, manualClientName } = req.body;
      if (!date || !startTime || !branchId) {
        return res.status(400).json({ error: "Datum, \u010Das a pobo\u010Dka jsou povinn\xE9" });
      }
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = startMinutes + 90;
      const endTime = minutesToTime(endMinutes);
      const hasCollision = await storage.checkBookingCollision(date, startTime, endTime);
      if (hasCollision) {
        return res.status(400).json({ error: "Tento term\xEDn je ji\u017E obsazen" });
      }
      const bookingData = {
        date,
        startTime,
        endTime,
        duration: 90,
        bookingType: manualClientName ? "manual" : "app",
        branchId,
        branchName: branchName || "",
        userId: manualClientName ? void 0 : req.user.id,
        userName: manualClientName ? void 0 : req.user.email,
        manualClientName: manualClientName || void 0
      };
      const booking = await storage.createBooking(bookingData);
      res.json(booking);
    } catch (error) {
      console.error("Create booking error:", error);
      res.status(500).json({ error: "Chyba p\u0159i vytv\xE1\u0159en\xED rezervace" });
    }
  });
  app2.delete("/api/bookings/:id", authenticateToken, async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ error: "Rezervace nenalezena" });
      }
      if (req.user?.role !== "ADMIN" && booking.userId !== req.user?.id) {
        return res.status(403).json({ error: "P\u0159\xEDstup zam\xEDtnut" });
      }
      await storage.deleteBooking(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });
  app2.get("/api/meal-preferences/:userId", authenticateToken, async (req, res) => {
    try {
      if (req.user?.role !== "ADMIN" && req.user?.id !== req.params.userId) {
        return res.status(403).json({ error: "P\u0159\xEDstup zam\xEDtnut" });
      }
      const pref = await storage.getMealPreference(req.params.userId);
      res.json(pref || null);
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });
  app2.put("/api/meal-preferences/:userId", authenticateToken, async (req, res) => {
    try {
      if (req.user?.role !== "ADMIN" && req.user?.id !== req.params.userId) {
        return res.status(403).json({ error: "P\u0159\xEDstup zam\xEDtnut" });
      }
      const pref = await storage.upsertMealPreference({ ...req.body, userId: req.params.userId });
      res.json(pref);
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });
  app2.get("/api/admin-notes/:userId", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const note = await storage.getAdminNote(req.params.userId);
      res.json(note || null);
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });
  app2.put("/api/admin-notes/:userId", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const note = await storage.upsertAdminNote({ ...req.body, userId: req.params.userId });
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });
  app2.get("/api/meal-plans/:userId", authenticateToken, async (req, res) => {
    try {
      if (req.user?.role !== "ADMIN" && req.user?.id !== req.params.userId) {
        return res.status(403).json({ error: "P\u0159\xEDstup zam\xEDtnut" });
      }
      const plan = await storage.getTrainerMealPlan(req.params.userId);
      res.json(plan || null);
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });
  app2.put("/api/meal-plans/:userId", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const plan = await storage.upsertTrainerMealPlan({ ...req.body, userId: req.params.userId });
      res.json(plan);
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });
  app2.get("/api/notifications", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const notifs = await storage.getNotifications();
      res.json(notifs);
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });
  app2.post("/api/notifications", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const notification = await storage.createNotification(req.body);
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });
  app2.get("/api/dashboard/stats", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const users2 = await storage.getUsers();
      const clientsCount = users2.filter((u) => u.role === "CLIENT").length;
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const todayBookings = await storage.getBookingsByDate(today);
      const blocks = await storage.getAvailabilityBlocks();
      const futureDates = [...new Set(blocks.filter((b) => b.date >= today).map((b) => b.date))];
      let availableSlots = 0;
      for (const date of futureDates) {
        const slots = await storage.getAvailableStartTimes(date);
        availableSlots += slots.length;
      }
      res.json({
        clientsCount,
        todayBookings: todayBookings.length,
        availableSlots
      });
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}
function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}
function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

// server/index.ts
import * as fs from "fs";
import * as path from "path";
var app = express();
var log = console.log;
function setupCors(app2) {
  app2.use((req, res, next) => {
    const origins = /* @__PURE__ */ new Set();
    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
      origins.add(`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
    }
    if (process.env.ALLOWED_ORIGINS) {
      process.env.ALLOWED_ORIGINS.split(",").forEach((d) => {
        origins.add(d.trim());
      });
    }
    const origin = req.header("origin");
    if (origin && origins.has(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.header("Access-Control-Allow-Credentials", "true");
    }
    if (!origin && process.env.NODE_ENV === "production") {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(express.urlencoded({ extended: false }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const path2 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!path2.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
function serveExpoManifest(platform, res) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json"
  );
  if (!fs.existsSync(manifestPath)) {
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}
function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
function configureExpoAndLanding(app2) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  log("Serving static Expo files with dynamic manifest routing");
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }
    if (req.path === "/") {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName
      });
    }
    next();
  });
  app2.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app2.use(express.static(path.resolve(process.cwd(), "static-build")));
  log("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, _next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
}
(async () => {
  app.get("/status", (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);
  configureExpoAndLanding(app);
  const server = await registerRoutes(app);
  setupErrorHandler(app);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true
    },
    () => {
      log(`express server serving on port ${port}`);
    }
  );
})();
