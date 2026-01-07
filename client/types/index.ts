export interface Location {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
}

export interface TimeSlot {
  id: string;
  date: string;
  time: string;
  locationId: string;
  isAvailable: boolean;
}

export interface Booking {
  id: string;
  userId: string;
  date: string;
  time: string;
  locationId: string;
  locationName: string;
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
