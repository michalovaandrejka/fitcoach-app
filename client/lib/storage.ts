import AsyncStorage from "@react-native-async-storage/async-storage";
import { Booking, MealPreference, TimeSlot, Location, Client, AdminNote } from "@/types";

const KEYS = {
  BOOKINGS: "@fitcoach_bookings",
  MEAL_PREFERENCES: "@fitcoach_meal_prefs",
  AVAILABILITY: "@fitcoach_availability",
  LOCATIONS: "@fitcoach_locations",
  CLIENTS: "@fitcoach_clients",
  ADMIN_NOTES: "@fitcoach_admin_notes",
  DATA_INITIALIZED: "@fitcoach_initialized",
};

const DEFAULT_LOCATIONS: Location[] = [
  { id: "loc_1", name: "FitZone Centrum", address: "Hlavni 123, Praha 1", isActive: true },
  { id: "loc_2", name: "FitZone Vinohrady", address: "Vinohradska 456, Praha 2", isActive: true },
];

const generateMockAvailability = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const today = new Date();
  
  for (let d = 0; d < 14; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().split("T")[0];
    
    const times = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];
    times.forEach((time, idx) => {
      const locationId = idx % 2 === 0 ? "loc_1" : "loc_2";
      slots.push({
        id: `slot_${dateStr}_${time}_${locationId}`,
        date: dateStr,
        time,
        locationId,
        isAvailable: Math.random() > 0.3,
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
  
  const locations = await AsyncStorage.getItem(KEYS.LOCATIONS);
  if (!locations) {
    await AsyncStorage.setItem(KEYS.LOCATIONS, JSON.stringify(DEFAULT_LOCATIONS));
  }
  
  const availability = await AsyncStorage.getItem(KEYS.AVAILABILITY);
  if (!availability) {
    await AsyncStorage.setItem(KEYS.AVAILABILITY, JSON.stringify(generateMockAvailability()));
  }
  
  const clients = await AsyncStorage.getItem(KEYS.CLIENTS);
  if (!clients) {
    await AsyncStorage.setItem(KEYS.CLIENTS, JSON.stringify(MOCK_CLIENTS));
  }
  
  await AsyncStorage.setItem(KEYS.DATA_INITIALIZED, "true");
  return true;
}

export async function getLocations(): Promise<Location[]> {
  const data = await AsyncStorage.getItem(KEYS.LOCATIONS);
  return data ? JSON.parse(data) : DEFAULT_LOCATIONS;
}

export async function getAvailability(): Promise<TimeSlot[]> {
  const data = await AsyncStorage.getItem(KEYS.AVAILABILITY);
  return data ? JSON.parse(data) : [];
}

export async function setSlotAvailability(slotId: string, isAvailable: boolean): Promise<void> {
  const slots = await getAvailability();
  const updated = slots.map(s => s.id === slotId ? { ...s, isAvailable } : s);
  await AsyncStorage.setItem(KEYS.AVAILABILITY, JSON.stringify(updated));
}

export async function addTimeSlot(slot: TimeSlot): Promise<void> {
  const slots = await getAvailability();
  slots.push(slot);
  await AsyncStorage.setItem(KEYS.AVAILABILITY, JSON.stringify(slots));
}

export async function getBookings(userId?: string): Promise<Booking[]> {
  const data = await AsyncStorage.getItem(KEYS.BOOKINGS);
  const bookings: Booking[] = data ? JSON.parse(data) : [];
  if (userId) {
    return bookings.filter(b => b.userId === userId);
  }
  return bookings;
}

export async function createBooking(booking: Omit<Booking, "id" | "createdAt">): Promise<Booking> {
  const bookings = await getBookings();
  const newBooking: Booking = {
    ...booking,
    id: `booking_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  bookings.push(newBooking);
  await AsyncStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
  
  const slots = await getAvailability();
  const slotId = slots.find(s => s.date === booking.date && s.time === booking.time && s.locationId === booking.locationId)?.id;
  if (slotId) {
    await setSlotAvailability(slotId, false);
  }
  
  return newBooking;
}

export async function cancelBooking(bookingId: string): Promise<void> {
  const bookings = await getBookings();
  const booking = bookings.find(b => b.id === bookingId);
  const updated = bookings.filter(b => b.id !== bookingId);
  await AsyncStorage.setItem(KEYS.BOOKINGS, JSON.stringify(updated));
  
  if (booking) {
    const slots = await getAvailability();
    const slotId = slots.find(s => s.date === booking.date && s.time === booking.time && s.locationId === booking.locationId)?.id;
    if (slotId) {
      await setSlotAvailability(slotId, true);
    }
  }
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

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
