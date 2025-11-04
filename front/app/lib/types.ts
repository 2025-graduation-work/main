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
