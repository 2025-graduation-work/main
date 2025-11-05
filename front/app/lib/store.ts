import { atomWithStorage } from 'jotai/utils';
import { UserData } from './types';

export const userDataAtom = atomWithStorage<UserData | null>(
  'userData',
  null,
  {
    getItem: (key) => {
      if (typeof window === 'undefined') return null;
      const value = sessionStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    },
    setItem: (key, value) => {
      if (typeof window === 'undefined') return;
      sessionStorage.setItem(key, JSON.stringify(value));
    },
    removeItem: (key) => {
      if (typeof window === 'undefined') return;
      sessionStorage.removeItem(key);
    },
  }
);
