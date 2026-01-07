import AsyncStorage from "@react-native-async-storage/async-storage";
import { Booking, MealPreference, Availability, Location, Client, AdminNote, StoredUser, UserRole, TrainerMealPlan, Notification } from "@/types";

const KEYS = {
  BOOKINGS: "@fitcoach_bookings",
  MEAL_PREFERENCES: "@fitcoach_meal_prefs",
  AVAILABILITY: "@fitcoach_availability",
  LOCATIONS: "@fitcoach_locations",
  CLIENTS: "@fitcoach_clients",
  ADMIN_NOTES: "@fitcoach_admin_notes",
  USERS: "@fitcoach_users",
  DATA_INITIALIZED: "@fitcoach_initialized_v3",
  TRAINER_MEAL_PLANS: "@fitcoach_trainer_meal_plans",
  NOTIFICATIONS: "@fitcoach_notifications",
};

function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `hash_${Math.abs(hash).toString(16)}`;
}

export function hashPassword(password: string): string {
  return simpleHash(password);
}

export function verifyPassword(password: string, hash: string): boolean {
  return simpleHash(password) === hash;
}

const DEFAULT_ADMIN: StoredUser = {
  id: "admin_andrea",
  email: "Andrea",
  name: "Andrea",
  role: "ADMIN",
  passwordHash: simpleHash("Andrea"),
  onboardingCompleted: false,
  createdAt: new Date().toISOString(),
};

const DEFAULT_LOCATIONS: Location[] = [
  { id: "loc_1", name: "FitZone Centrum", address: "Hlavni 123, Praha 1", isActive: true },
  { id: "loc_2", name: "FitZone Vinohrady", address: "Vinohradska 456, Praha 2", isActive: true },
];

const generateMockAvailability = (): Availability[] => {
  const slots: Availability[] = [];
  const today = new Date();
  
  for (let d = 0; d < 14; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().split("T")[0];
    
    const times = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];
    times.forEach((time, idx) => {
      const allowedLocationIds = idx % 3 === 0 
        ? ["loc_1", "loc_2"] 
        : idx % 3 === 1 
          ? ["loc_1"] 
          : ["loc_2"];
      
      slots.push({
        id: `avail_${dateStr}_${time}`,
        date: dateStr,
        time,
        allowedLocationIds,
        isBooked: false,
      });
    });
  }
  return slots;
};

const MOCK_CLIENTS: Client[] = [
  { id: "client_1", email: "jana@email.cz", name: "Jana Novakova", lastTrainingDate: "2026-01-05", bookingsCount: 12 },
  { id: "client_2", email: "petr@email.cz", name: "Petr Svoboda", lastTrainingDate: "2026-01-03", bookingsCount: 8 },
  { id: "client_3", email: "marie@email.cz", name: "Marie Dvorakova", lastTrainingDate: "2026-01-06", bookingsCount: 5 },
  { id: "client_4", email: "tomas@email.cz", name: "Tomas Horak", lastTrainingDate: "2025-12-28", bookingsCount: 3 },
];

export async function initializeData(): Promise<boolean> {
  const initialized = await AsyncStorage.getItem(KEYS.DATA_INITIALIZED);
  if (initialized === "true") {
    return false;
  }
  
  await AsyncStorage.setItem(KEYS.LOCATIONS, JSON.stringify(DEFAULT_LOCATIONS));
  await AsyncStorage.setItem(KEYS.AVAILABILITY, JSON.stringify(generateMockAvailability()));
  await AsyncStorage.setItem(KEYS.CLIENTS, JSON.stringify(MOCK_CLIENTS));
  await AsyncStorage.setItem(KEYS.BOOKINGS, JSON.stringify([]));
  await AsyncStorage.setItem(KEYS.USERS, JSON.stringify([DEFAULT_ADMIN]));
  
  await AsyncStorage.setItem(KEYS.DATA_INITIALIZED, "true");
  return true;
}

export async function getUsers(): Promise<StoredUser[]> {
  const data = await AsyncStorage.getItem(KEYS.USERS);
  return data ? JSON.parse(data) : [DEFAULT_ADMIN];
}

export async function getUserByEmail(email: string): Promise<StoredUser | null> {
  const users = await getUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function getUserById(id: string): Promise<StoredUser | null> {
  const users = await getUsers();
  return users.find(u => u.id === id) || null;
}

export async function createUser(
  email: string,
  password: string,
  name: string
): Promise<StoredUser> {
  const users = await getUsers();
  
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    throw new Error("Uzivatel s timto emailem jiz existuje");
  }
  
  const newUser: StoredUser = {
    id: `user_${Date.now()}`,
    email,
    name,
    role: "CLIENT",
    passwordHash: hashPassword(password),
    onboardingCompleted: false,
    createdAt: new Date().toISOString(),
  };
  
  users.push(newUser);
  await AsyncStorage.setItem(KEYS.USERS, JSON.stringify(users));
  
  const clients = await getClients();
  const newClient: Client = {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    bookingsCount: 0,
  };
  clients.push(newClient);
  await AsyncStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients));
  
  return newUser;
}

export async function updateUser(userId: string, updates: Partial<Omit<StoredUser, "id">>): Promise<void> {
  const users = await getUsers();
  const updated = users.map(u => u.id === userId ? { ...u, ...updates } : u);
  await AsyncStorage.setItem(KEYS.USERS, JSON.stringify(updated));
}

export async function authenticateUser(
  loginOrEmail: string,
  password: string
): Promise<StoredUser> {
  if (loginOrEmail.toLowerCase() === "andrea") {
    const users = await getUsers();
    const admin = users.find(u => u.id === "admin_andrea");
    if (!admin) {
      throw new Error("Admin ucet neexistuje");
    }
    if (!verifyPassword(password, admin.passwordHash)) {
      throw new Error("Nespravne heslo");
    }
    return admin;
  }
  
  const user = await getUserByEmail(loginOrEmail);
  if (!user) {
    throw new Error("Uzivatel s timto emailem neexistuje");
  }
  
  if (!verifyPassword(password, user.passwordHash)) {
    throw new Error("Nespravne heslo");
  }
  
  return user;
}

export async function getLocations(): Promise<Location[]> {
  const data = await AsyncStorage.getItem(KEYS.LOCATIONS);
  return data ? JSON.parse(data) : DEFAULT_LOCATIONS;
}

export async function updateLocation(locationId: string, updates: Partial<Omit<Location, "id">>): Promise<void> {
  const locations = await getLocations();
  const updated = locations.map(loc => 
    loc.id === locationId ? { ...loc, ...updates } : loc
  );
  await AsyncStorage.setItem(KEYS.LOCATIONS, JSON.stringify(updated));
}

export async function addLocation(name: string, address: string): Promise<Location> {
  const locations = await getLocations();
  const newLocation: Location = {
    id: `loc_${Date.now()}`,
    name,
    address,
    isActive: true,
  };
  locations.push(newLocation);
  await AsyncStorage.setItem(KEYS.LOCATIONS, JSON.stringify(locations));
  return newLocation;
}

export async function getAvailability(): Promise<Availability[]> {
  const data = await AsyncStorage.getItem(KEYS.AVAILABILITY);
  return data ? JSON.parse(data) : [];
}

export async function getAvailableSlots(): Promise<Availability[]> {
  const slots = await getAvailability();
  return slots.filter(s => !s.isBooked);
}

export async function addAvailability(date: string, time: string, allowedLocationIds: string[]): Promise<Availability> {
  const slots = await getAvailability();
  
  const existing = slots.find(s => s.date === date && s.time === time);
  if (existing) {
    throw new Error("Tento cas je jiz v kalendari");
  }
  
  const newSlot: Availability = {
    id: `avail_${date}_${time}`,
    date,
    time,
    allowedLocationIds,
    isBooked: false,
  };
  
  slots.push(newSlot);
  await AsyncStorage.setItem(KEYS.AVAILABILITY, JSON.stringify(slots));
  return newSlot;
}

export async function updateAvailability(slotId: string, updates: Partial<Omit<Availability, "id">>): Promise<void> {
  const slots = await getAvailability();
  const updated = slots.map(s => s.id === slotId ? { ...s, ...updates } : s);
  await AsyncStorage.setItem(KEYS.AVAILABILITY, JSON.stringify(updated));
}

export async function deleteAvailability(slotId: string): Promise<void> {
  const slots = await getAvailability();
  const slot = slots.find(s => s.id === slotId);
  
  if (slot?.isBooked) {
    throw new Error("Nelze smazat rezervovany cas");
  }
  
  const updated = slots.filter(s => s.id !== slotId);
  await AsyncStorage.setItem(KEYS.AVAILABILITY, JSON.stringify(updated));
}

export async function getBookings(userId?: string): Promise<Booking[]> {
  const data = await AsyncStorage.getItem(KEYS.BOOKINGS);
  const bookings: Booking[] = data ? JSON.parse(data) : [];
  if (userId) {
    return bookings.filter(b => b.userId === userId);
  }
  return bookings;
}

export async function createBooking(
  userId: string,
  availabilityId: string,
  locationId: string
): Promise<Booking> {
  const slots = await getAvailability();
  const slot = slots.find(s => s.id === availabilityId);
  
  if (!slot) {
    throw new Error("Casovy slot neexistuje");
  }
  
  if (slot.isBooked) {
    throw new Error("Tento cas je jiz rezervovan");
  }
  
  if (!slot.allowedLocationIds.includes(locationId)) {
    throw new Error("Tato pobocka neni dostupna pro tento cas");
  }
  
  const locations = await getLocations();
  const location = locations.find(l => l.id === locationId);
  
  if (!location) {
    throw new Error("Pobocka neexistuje");
  }
  
  const bookings = await getBookings();
  const newBooking: Booking = {
    id: `booking_${Date.now()}`,
    userId,
    availabilityId,
    locationId,
    locationName: location.name,
    date: slot.date,
    time: slot.time,
    createdAt: new Date().toISOString(),
  };
  
  bookings.push(newBooking);
  await AsyncStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
  
  await updateAvailability(availabilityId, { isBooked: true });
  
  return newBooking;
}

export async function cancelBooking(bookingId: string): Promise<void> {
  const bookings = await getBookings();
  const booking = bookings.find(b => b.id === bookingId);
  
  if (!booking) {
    throw new Error("Rezervace neexistuje");
  }
  
  const updated = bookings.filter(b => b.id !== bookingId);
  await AsyncStorage.setItem(KEYS.BOOKINGS, JSON.stringify(updated));
  
  await updateAvailability(booking.availabilityId, { isBooked: false });
}

export async function getMealPreference(userId: string): Promise<MealPreference | null> {
  const data = await AsyncStorage.getItem(KEYS.MEAL_PREFERENCES);
  const prefs: MealPreference[] = data ? JSON.parse(data) : [];
  return prefs.find(p => p.userId === userId) || null;
}

export async function saveMealPreference(pref: MealPreference): Promise<void> {
  const data = await AsyncStorage.getItem(KEYS.MEAL_PREFERENCES);
  const prefs: MealPreference[] = data ? JSON.parse(data) : [];
  const existing = prefs.findIndex(p => p.userId === pref.userId);
  if (existing >= 0) {
    prefs[existing] = pref;
  } else {
    prefs.push(pref);
  }
  await AsyncStorage.setItem(KEYS.MEAL_PREFERENCES, JSON.stringify(prefs));
}

export async function getClients(): Promise<Client[]> {
  const data = await AsyncStorage.getItem(KEYS.CLIENTS);
  return data ? JSON.parse(data) : MOCK_CLIENTS;
}

export async function getAdminNote(userId: string): Promise<AdminNote | null> {
  const data = await AsyncStorage.getItem(KEYS.ADMIN_NOTES);
  const notes: AdminNote[] = data ? JSON.parse(data) : [];
  return notes.find(n => n.userId === userId) || null;
}

export async function saveAdminNote(note: AdminNote): Promise<void> {
  const data = await AsyncStorage.getItem(KEYS.ADMIN_NOTES);
  const notes: AdminNote[] = data ? JSON.parse(data) : [];
  const existing = notes.findIndex(n => n.userId === note.userId);
  if (existing >= 0) {
    notes[existing] = note;
  } else {
    notes.push(note);
  }
  await AsyncStorage.setItem(KEYS.ADMIN_NOTES, JSON.stringify(notes));
}

export async function getTrainerMealPlan(userId: string): Promise<TrainerMealPlan | null> {
  const data = await AsyncStorage.getItem(KEYS.TRAINER_MEAL_PLANS);
  const plans: TrainerMealPlan[] = data ? JSON.parse(data) : [];
  return plans.find(p => p.userId === userId) || null;
}

export async function saveTrainerMealPlan(plan: TrainerMealPlan): Promise<void> {
  const data = await AsyncStorage.getItem(KEYS.TRAINER_MEAL_PLANS);
  const plans: TrainerMealPlan[] = data ? JSON.parse(data) : [];
  const existing = plans.findIndex(p => p.userId === plan.userId);
  if (existing >= 0) {
    plans[existing] = plan;
  } else {
    plans.push(plan);
  }
  await AsyncStorage.setItem(KEYS.TRAINER_MEAL_PLANS, JSON.stringify(plans));
}

export async function getNotifications(): Promise<Notification[]> {
  const data = await AsyncStorage.getItem(KEYS.NOTIFICATIONS);
  return data ? JSON.parse(data) : [];
}

export async function saveNotification(notification: Notification): Promise<void> {
  const notifications = await getNotifications();
  notifications.unshift(notification);
  await AsyncStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifications));
}

export async function getBookedClientsForFilter(
  dateFilter?: string,
  weekFilter?: boolean,
  locationId?: string
): Promise<Client[]> {
  const bookings = await getBookings();
  const clients = await getClients();
  
  let filteredBookings = bookings;
  
  if (dateFilter) {
    filteredBookings = filteredBookings.filter(b => b.date === dateFilter);
  } else if (weekFilter) {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const startStr = startOfWeek.toISOString().split("T")[0];
    const endStr = endOfWeek.toISOString().split("T")[0];
    
    filteredBookings = filteredBookings.filter(b => b.date >= startStr && b.date <= endStr);
  }
  
  if (locationId) {
    filteredBookings = filteredBookings.filter(b => b.locationId === locationId);
  }
  
  const uniqueClientIds = [...new Set(filteredBookings.map(b => b.userId))];
  return clients.filter(c => uniqueClientIds.includes(c.id));
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}

export async function deleteClient(clientId: string): Promise<void> {
  const users = await getUsers();
  const updatedUsers = users.filter(u => u.id !== clientId);
  await AsyncStorage.setItem(KEYS.USERS, JSON.stringify(updatedUsers));

  const clients = await getClients();
  const updatedClients = clients.filter(c => c.id !== clientId);
  await AsyncStorage.setItem(KEYS.CLIENTS, JSON.stringify(updatedClients));

  const mealPrefsData = await AsyncStorage.getItem(KEYS.MEAL_PREFERENCES);
  const mealPrefs: MealPreference[] = mealPrefsData ? JSON.parse(mealPrefsData) : [];
  const updatedMealPrefs = mealPrefs.filter(p => p.userId !== clientId);
  await AsyncStorage.setItem(KEYS.MEAL_PREFERENCES, JSON.stringify(updatedMealPrefs));

  const mealPlansData = await AsyncStorage.getItem(KEYS.TRAINER_MEAL_PLANS);
  const mealPlans: TrainerMealPlan[] = mealPlansData ? JSON.parse(mealPlansData) : [];
  const updatedMealPlans = mealPlans.filter(p => p.userId !== clientId);
  await AsyncStorage.setItem(KEYS.TRAINER_MEAL_PLANS, JSON.stringify(updatedMealPlans));

  const notesData = await AsyncStorage.getItem(KEYS.ADMIN_NOTES);
  const notes: AdminNote[] = notesData ? JSON.parse(notesData) : [];
  const updatedNotes = notes.filter(n => n.userId !== clientId);
  await AsyncStorage.setItem(KEYS.ADMIN_NOTES, JSON.stringify(updatedNotes));

  const bookings = await getBookings();
  const clientBookings = bookings.filter(b => b.userId === clientId);
  
  for (const booking of clientBookings) {
    await updateAvailability(booking.availabilityId, { isBooked: false });
  }
  
  const updatedBookings = bookings.filter(b => b.userId !== clientId);
  await AsyncStorage.setItem(KEYS.BOOKINGS, JSON.stringify(updatedBookings));
}

export async function getFutureBookings(userId: string): Promise<Booking[]> {
  const bookings = await getBookings(userId);
  const today = new Date().toISOString().split("T")[0];
  return bookings.filter(b => b.date >= today).sort((a, b) => {
    if (a.date === b.date) {
      return a.time.localeCompare(b.time);
    }
    return a.date.localeCompare(b.date);
  });
}

export async function createManualBooking(slotId: string, clientName: string, branchId: string): Promise<void> {
  const slots = await getAvailability();
  const slot = slots.find(s => s.id === slotId);
  
  if (!slot) {
    throw new Error("Casovy slot neexistuje");
  }
  
  if (slot.isBooked) {
    throw new Error("Tento cas je jiz rezervovan");
  }
  
  await updateAvailability(slotId, {
    isBooked: true,
    bookingType: "manual",
    manualClientName: clientName,
    manualBranchId: branchId,
  });
}

export async function releaseManualBooking(slotId: string): Promise<void> {
  const slots = await getAvailability();
  const slot = slots.find(s => s.id === slotId);
  
  if (!slot) {
    throw new Error("Casovy slot neexistuje");
  }
  
  if (!slot.isBooked) {
    throw new Error("Tento cas neni rezervovan");
  }
  
  if (slot.bookingType !== "manual") {
    throw new Error("Nelze uvolnit rezervaci z aplikace. Pouzijte zruseni rezervace.");
  }
  
  await updateAvailability(slotId, {
    isBooked: false,
    bookingType: undefined,
    manualClientName: undefined,
    manualBranchId: undefined,
  });
}
