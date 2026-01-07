export interface Location {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
}

export type BookingType = "app" | "manual";

export const TRAINING_DURATION = 90;

export interface AvailabilityBlock {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  branchId: string;
}

export interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  bookingType: BookingType;
  branchId: string;
  branchName: string;
  userId?: string;
  userName?: string;
  manualClientName?: string;
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

export interface TrainerMealPlan {
  id: string;
  userId: string;
  content: string;
  fileType: "pdf" | "text";
  fileName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  title?: string;
  body: string;
  targetType: "all" | "booked";
  dateFilter?: string;
  weekFilter?: boolean;
  locationId?: string;
  sentAt: string;
  recipientCount: number;
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

export interface AvailableSlot {
  startTime: string;
  endTime: string;
  branchId: string;
  branchName: string;
  blockId: string;
}
