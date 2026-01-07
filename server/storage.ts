import {
  users, locations, availabilityBlocks, bookings,
  mealPreferences, adminNotes, trainerMealPlans, notifications,
  type User, type InsertUser, type Location, type InsertLocation,
  type AvailabilityBlock, type InsertAvailabilityBlock,
  type Booking, type InsertBooking, type MealPreference, type InsertMealPreference,
  type AdminNote, type InsertAdminNote, type TrainerMealPlan, type InsertTrainerMealPlan,
  type Notification, type InsertNotification
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, or, desc, asc } from "drizzle-orm";
import { createHash } from "crypto";

const TRAINING_DURATION = 90;

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: { email: string; name: string; password: string; role?: "CLIENT" | "ADMIN"; onboardingCompleted?: boolean }): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;

  getLocations(): Promise<Location[]>;
  getLocation(id: string): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(id: string, data: Partial<Location>): Promise<Location | undefined>;
  deleteLocation(id: string): Promise<void>;

  getAvailabilityBlocks(): Promise<AvailabilityBlock[]>;
  getAvailabilityBlocksByDate(date: string): Promise<AvailabilityBlock[]>;
  getAvailabilityBlock(id: string): Promise<AvailabilityBlock | undefined>;
  createAvailabilityBlock(block: InsertAvailabilityBlock): Promise<AvailabilityBlock>;
  deleteAvailabilityBlock(id: string): Promise<void>;

  getBookings(): Promise<Booking[]>;
  getBookingsByDate(date: string): Promise<Booking[]>;
  getBookingsByUser(userId: string): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  deleteBooking(id: string): Promise<void>;
  checkBookingCollision(date: string, startTime: string, endTime: string, excludeId?: string): Promise<boolean>;

  getMealPreference(userId: string): Promise<MealPreference | undefined>;
  upsertMealPreference(pref: InsertMealPreference): Promise<MealPreference>;

  getAdminNote(userId: string): Promise<AdminNote | undefined>;
  upsertAdminNote(note: InsertAdminNote): Promise<AdminNote>;

  getTrainerMealPlan(userId: string): Promise<TrainerMealPlan | undefined>;
  upsertTrainerMealPlan(plan: InsertTrainerMealPlan): Promise<TrainerMealPlan>;

  getNotifications(): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;

  getAvailableStartTimes(date: string, branchId?: string): Promise<{ startTime: string; endTime: string; branchId: string; branchName: string; blockId: string; }[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(input: { email: string; name: string; password: string; role?: "CLIENT" | "ADMIN"; onboardingCompleted?: boolean }): Promise<User> {
    const { password, ...userData } = input;
    const [user] = await db
      .insert(users)
      .values({ ...userData, passwordHash: hashPassword(password) })
      .returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(bookings).where(eq(bookings.userId, id));
    await db.delete(mealPreferences).where(eq(mealPreferences.userId, id));
    await db.delete(adminNotes).where(eq(adminNotes.userId, id));
    await db.delete(trainerMealPlans).where(eq(trainerMealPlans.userId, id));
    await db.delete(users).where(eq(users.id, id));
  }

  async getLocations(): Promise<Location[]> {
    return db.select().from(locations).where(eq(locations.isActive, true));
  }

  async getLocation(id: string): Promise<Location | undefined> {
    const [location] = await db.select().from(locations).where(eq(locations.id, id));
    return location || undefined;
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const [loc] = await db.insert(locations).values(location).returning();
    return loc;
  }

  async updateLocation(id: string, data: Partial<Location>): Promise<Location | undefined> {
    const [loc] = await db.update(locations).set(data).where(eq(locations.id, id)).returning();
    return loc || undefined;
  }

  async deleteLocation(id: string): Promise<void> {
    await db.update(locations).set({ isActive: false }).where(eq(locations.id, id));
  }

  async getAvailabilityBlocks(): Promise<AvailabilityBlock[]> {
    return db.select().from(availabilityBlocks).orderBy(asc(availabilityBlocks.date), asc(availabilityBlocks.startTime));
  }

  async getAvailabilityBlocksByDate(date: string): Promise<AvailabilityBlock[]> {
    return db.select().from(availabilityBlocks).where(eq(availabilityBlocks.date, date)).orderBy(asc(availabilityBlocks.startTime));
  }

  async getAvailabilityBlock(id: string): Promise<AvailabilityBlock | undefined> {
    const [block] = await db.select().from(availabilityBlocks).where(eq(availabilityBlocks.id, id));
    return block || undefined;
  }

  async createAvailabilityBlock(block: InsertAvailabilityBlock): Promise<AvailabilityBlock> {
    const [created] = await db.insert(availabilityBlocks).values(block).returning();
    return created;
  }

  async deleteAvailabilityBlock(id: string): Promise<void> {
    await db.delete(availabilityBlocks).where(eq(availabilityBlocks.id, id));
  }

  async getBookings(): Promise<Booking[]> {
    return db.select().from(bookings).orderBy(desc(bookings.date), asc(bookings.startTime));
  }

  async getBookingsByDate(date: string): Promise<Booking[]> {
    return db.select().from(bookings).where(eq(bookings.date, date)).orderBy(asc(bookings.startTime));
  }

  async getBookingsByUser(userId: string): Promise<Booking[]> {
    return db.select().from(bookings).where(eq(bookings.userId, userId)).orderBy(desc(bookings.date), asc(bookings.startTime));
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [created] = await db.insert(bookings).values(booking).returning();
    return created;
  }

  async deleteBooking(id: string): Promise<void> {
    await db.delete(bookings).where(eq(bookings.id, id));
  }

  async checkBookingCollision(date: string, startTime: string, endTime: string, excludeId?: string): Promise<boolean> {
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

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }

  async getMealPreference(userId: string): Promise<MealPreference | undefined> {
    const [pref] = await db.select().from(mealPreferences).where(eq(mealPreferences.userId, userId));
    return pref || undefined;
  }

  async upsertMealPreference(pref: InsertMealPreference): Promise<MealPreference> {
    const existing = await this.getMealPreference(pref.userId);
    if (existing) {
      const [updated] = await db.update(mealPreferences).set({ ...pref, updatedAt: new Date() }).where(eq(mealPreferences.userId, pref.userId)).returning();
      return updated;
    }
    const [created] = await db.insert(mealPreferences).values(pref).returning();
    return created;
  }

  async getAdminNote(userId: string): Promise<AdminNote | undefined> {
    const [note] = await db.select().from(adminNotes).where(eq(adminNotes.userId, userId));
    return note || undefined;
  }

  async upsertAdminNote(note: InsertAdminNote): Promise<AdminNote> {
    const existing = await this.getAdminNote(note.userId);
    if (existing) {
      const [updated] = await db.update(adminNotes).set({ ...note, updatedAt: new Date() }).where(eq(adminNotes.userId, note.userId)).returning();
      return updated;
    }
    const [created] = await db.insert(adminNotes).values(note).returning();
    return created;
  }

  async getTrainerMealPlan(userId: string): Promise<TrainerMealPlan | undefined> {
    const [plan] = await db.select().from(trainerMealPlans).where(eq(trainerMealPlans.userId, userId));
    return plan || undefined;
  }

  async upsertTrainerMealPlan(plan: InsertTrainerMealPlan): Promise<TrainerMealPlan> {
    const existing = await this.getTrainerMealPlan(plan.userId);
    if (existing) {
      const [updated] = await db.update(trainerMealPlans).set({ ...plan, updatedAt: new Date() }).where(eq(trainerMealPlans.userId, plan.userId)).returning();
      return updated;
    }
    const [created] = await db.insert(trainerMealPlans).values(plan).returning();
    return created;
  }

  async getNotifications(): Promise<Notification[]> {
    return db.select().from(notifications).orderBy(desc(notifications.sentAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async getAvailableStartTimes(date: string, branchId?: string): Promise<{ startTime: string; endTime: string; branchId: string; branchName: string; blockId: string; }[]> {
    let blocks = await this.getAvailabilityBlocksByDate(date);
    if (branchId) {
      blocks = blocks.filter(b => b.branchId === branchId);
    }

    const existingBookings = await this.getBookingsByDate(date);
    const locs = await this.getLocations();
    const locMap = new Map(locs.map(l => [l.id, l.name]));
    
    const availableSlots: { startTime: string; endTime: string; branchId: string; branchName: string; blockId: string; }[] = [];

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
            blockId: block.id,
          });
        }
      }
    }

    return availableSlots;
  }
}

export const storage = new DatabaseStorage();
