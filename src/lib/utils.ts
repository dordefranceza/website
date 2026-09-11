import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Combina clase Tailwind fara dubluri: cn('p-2', conditie && 'p-4') -> 'p-4'. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
