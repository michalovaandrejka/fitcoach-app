export interface Location {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
}

export interface Availability {
  id: string;
  date: string;
  time: string;
  allowedLocationIds: string[];
  isBooked: boolean;
}

export interface Booking {
  id: string;
  userId: string;
  availabilityId: string;
  locationId: string;
  locationName: string;
  date: string;
  time: string;
  createdAt: string;
}

export interface MealPreference {
  userId: string;
  likes: string;
  dislikes: string;
  mealsPerDay: number;
  goals: string[];
  notes: string;
}

export interface Client {
  id: string;
  email: string;
  name: string;
  lastTrainingDate?: string;
  bookingsCount: number;
}

export interface AdminNote {
  userId: string;
  note: string;
  updatedAt: string;
}

export type UserRole = "CLIENT" | "ADMIN";

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  onboardingCompleted: boolean;
  createdAt: string;
}
