export interface UserData {
  nickname: string;
  destinations: Destination[];
}

export interface Destination {
  id: string;
  name: string;
  address: string;
  placeId?: string;
  latitude: number;
  longitude: number;
  frequency: Frequency;
  createdAt: string;
}

export interface Frequency {
  days: number[]; // 0-6 (日-土)
  time: string; // HH:MM
}

// Legacy types for unused components (LocationTaskCard, AddLocationDialog, TaskHistory)
export interface Location {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number;
  createdAt: string;
}

export interface TaskCompletion {
  id: string;
  locationId: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO 8601
  completedAt: string; // ISO 8601 timestamp for sorting
}
