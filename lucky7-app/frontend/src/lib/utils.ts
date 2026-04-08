import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Fonctionne en HTTP et HTTPS (crypto.randomUUID n'est dispo qu'en HTTPS)
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}
