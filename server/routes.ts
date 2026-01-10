import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "node:http";
import { storage, verifyPassword } from "./storage";
import { registerSchema, loginSchema, insertLocationSchema, insertAvailabilityBlockSchema, insertBookingSchema } from "@shared/schema";
import { z } from "zod";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET || "fitcoach-secret-key";
const JWT_EXPIRES_IN = "7d";

interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token není přítomen" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: "Neplatný token" });
  }
}

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Pouze admin má přístup" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/status", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/debug/admin-check", async (req, res) => {
    try {
      const admin = await storage.getUserByEmail("Andrea");
      res.json({ 
        adminExists: !!admin,
        adminId: admin?.id || null,
        adminRole: admin?.role || null,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Admin check error:", error);
      res.status(500).json({ error: "Database error", details: String(error) });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(400).json({ error: "Email již existuje" });
      }

      const user = await storage.createUser({
        email: data.email,
        name: data.name,
        password: data.password,
        role: data.role || "CLIENT",
        onboardingCompleted: false,
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Neplatná data", details: error.errors });
      }
      console.error("Register error:", error);
      res.status(500).json({ error: "Chyba při registraci" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ error: "Neplatný email nebo heslo" });
      }

      if (!verifyPassword(data.password, user.passwordHash)) {
        return res.status(401).json({ error: "Neplatný email nebo heslo" });
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Neplatná data" });
      }
      console.error("Login error:", error);
      res.status(500).json({ error: "Chyba při přihlášení" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "Uživatel nenalezen" });
      }
      res.json({ id: user.id, email: user.email, name: user.name, role: user.role, onboardingCompleted: user.onboardingCompleted });
    } catch (error) {
      console.error("Get me error:", error);
      res.status(500).json({ error: "Chyba" });
    }
  });

  app.get("/api/users", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role, onboardingCompleted: u.onboardingCompleted, createdAt: u.createdAt })));
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Chyba" });
    }
  });

  app.get("/api/users/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (req.user?.role !== "ADMIN" && req.user?.id !== req.params.id) {
        return res.status(403).json({ error: "Přístup zamítnut" });
      }
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "Uživatel nenalezen" });
      }
      res.json({ id: user.id, email: user.email, name: user.name, role: user.role, onboardingCompleted: user.onboardingCompleted });
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });

  app.put("/api/users/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (req.user?.role !== "ADMIN" && req.user?.id !== req.params.id) {
        return res.status(403).json({ error: "Přístup zamítnut" });
      }
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ error: "Uživatel nenalezen" });
      }
      res.json({ id: user.id, email: user.email, name: user.name, role: user.role, onboardingCompleted: user.onboardingCompleted });
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });

  app.delete("/api/users/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });

  app.get("/api/locations", async (req, res) => {
    try {
      const { includeInactive } = req.query;
      const locs = includeInactive === "true" 
        ? await storage.getAllLocations()
        : await storage.getLocations();
      res.json(locs);
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });

  app.post("/api/locations", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const data = insertLocationSchema.parse(req.body);
      const location = await storage.createLocation(data);
      res.json(location);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Neplatná data" });
      }
      res.status(500).json({ error: "Chyba" });
    }
  });

  app.put("/api/locations/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const location = await storage.updateLocation(req.params.id, req.body);
      if (!location) {
        return res.status(404).json({ error: "Pobočka nenalezena" });
      }
      res.json(location);
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });

  app.delete("/api/locations/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      await storage.deleteLocation(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });

  app.get("/api/availability", async (req, res) => {
    try {
      const { date, branchId } = req.query;
      if (date) {
        const blocks = await storage.getAvailabilityBlocksByDate(date as string);
        return res.json(blocks);
      }
      const blocks = await storage.getAvailabilityBlocks();
      res.json(blocks);
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });

  app.post("/api/availability", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const data = insertAvailabilityBlockSchema.parse(req.body);
      const block = await storage.createAvailabilityBlock(data);
      res.json(block);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Neplatná data" });
      }
      res.status(500).json({ error: "Chyba" });
    }
  });

  app.delete("/api/availability/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const block = await storage.getAvailabilityBlock(req.params.id);
      if (!block) {
        return res.status(404).json({ error: "Blok nenalezen" });
      }
      const bookings = await storage.getBookingsByDate(block.date);
      const blockStart = timeToMinutes(block.startTime);
      const blockEnd = timeToMinutes(block.endTime);
      const hasBookings = bookings.some(b => {
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

  app.get("/api/availability/slots", async (req, res) => {
    try {
      const { date, branchId } = req.query;
      if (!date) {
        return res.status(400).json({ error: "Datum je povinné" });
      }
      const slots = await storage.getAvailableStartTimes(date as string, branchId as string | undefined);
      res.json(slots);
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });

  app.get("/api/availability/dates", async (req, res) => {
    try {
      const { branchId } = req.query;
      const blocks = await storage.getAvailabilityBlocks();
      const today = new Date().toISOString().split("T")[0];
      const futureBlocks = blocks.filter(b => b.date >= today && (!branchId || b.branchId === branchId));
      const dates = [...new Set(futureBlocks.map(b => b.date))].sort();
      
      const availableDates: string[] = [];
      for (const date of dates) {
        const slots = await storage.getAvailableStartTimes(date, branchId as string | undefined);
        if (slots.length > 0) {
          availableDates.push(date);
        }
      }
      
      res.json(availableDates);
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });

  app.get("/api/bookings", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { date, userId } = req.query;
      
      if (req.user?.role === "ADMIN") {
        if (date) {
          const bookings = await storage.getBookingsByDate(date as string);
          return res.json(bookings);
        }
        if (userId) {
          const bookings = await storage.getBookingsByUser(userId as string);
          return res.json(bookings);
        }
        const bookings = await storage.getBookings();
        return res.json(bookings);
      }
      
      const bookings = await storage.getBookingsByUser(req.user!.id);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });

  app.post("/api/bookings", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { date, startTime, branchId, branchName, manualClientName } = req.body;
      
      if (!date || !startTime || !branchId) {
        return res.status(400).json({ error: "Datum, čas a pobočka jsou povinné" });
      }

      const startMinutes = timeToMinutes(startTime);
      const endMinutes = startMinutes + 90;
      const endTime = minutesToTime(endMinutes);

      const hasCollision = await storage.checkBookingCollision(date, startTime, endTime);
      if (hasCollision) {
        return res.status(400).json({ error: "Tento termín je již obsazen" });
      }

      const bookingData = {
        date,
        startTime,
        endTime,
        duration: 90,
        bookingType: manualClientName ? "manual" as const : "app" as const,
        branchId,
        branchName: branchName || "",
        userId: manualClientName ? undefined : req.user!.id,
        userName: manualClientName ? undefined : req.user!.email,
        manualClientName: manualClientName || undefined,
      };

      const booking = await storage.createBooking(bookingData);
      res.json(booking);
    } catch (error) {
      console.error("Create booking error:", error);
      res.status(500).json({ error: "Chyba při vytváření rezervace" });
    }
  });

  app.delete("/api/bookings/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ error: "Rezervace nenalezena" });
      }
      
      if (req.user?.role !== "ADMIN" && booking.userId !== req.user?.id) {
        return res.status(403).json({ error: "Přístup zamítnut" });
      }

      await storage.deleteBooking(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });

  app.get("/api/meal-preferences/:userId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (req.user?.role !== "ADMIN" && req.user?.id !== req.params.userId) {
        return res.status(403).json({ error: "Přístup zamítnut" });
      }
      const pref = await storage.getMealPreference(req.params.userId);
      res.json(pref || null);
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });

  app.put("/api/meal-preferences/:userId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (req.user?.role !== "ADMIN" && req.user?.id !== req.params.userId) {
        return res.status(403).json({ error: "Přístup zamítnut" });
      }
      const pref = await storage.upsertMealPreference({ ...req.body, userId: req.params.userId });
      res.json(pref);
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });

  app.get("/api/admin-notes/:userId", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const note = await storage.getAdminNote(req.params.userId);
      res.json(note || null);
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });

  app.put("/api/admin-notes/:userId", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const note = await storage.upsertAdminNote({ ...req.body, userId: req.params.userId });
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });

  app.get("/api/meal-plans/:userId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (req.user?.role !== "ADMIN" && req.user?.id !== req.params.userId) {
        return res.status(403).json({ error: "Přístup zamítnut" });
      }
      const plan = await storage.getTrainerMealPlan(req.params.userId);
      res.json(plan || null);
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });

  app.put("/api/meal-plans/:userId", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const plan = await storage.upsertTrainerMealPlan({ ...req.body, userId: req.params.userId });
      res.json(plan);
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });

  app.get("/api/notifications", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const notifs = await storage.getNotifications();
      res.json(notifs);
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });

  app.post("/api/notifications", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const notification = await storage.createNotification(req.body);
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: "Chyba" });
    }
  });

  app.get("/api/dashboard/stats", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      const clientsCount = users.filter(u => u.role === "CLIENT").length;
      
      const today = new Date().toISOString().split("T")[0];
      const todayBookings = await storage.getBookingsByDate(today);
      
      const blocks = await storage.getAvailabilityBlocks();
      const futureDates = [...new Set(blocks.filter(b => b.date >= today).map(b => b.date))];
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

  const httpServer = createServer(app);
  return httpServer;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}
