/**
 * @combo/shared - Shared code between web CRM and mobile app
 *
 * This package contains:
 * - TypeScript types (re-exported from database.types.ts)
 * - Shared utility functions
 * - Common hooks that work in both React and React Native
 * - Supabase client configuration
 */

// Re-export database types (will be moved here during monorepo migration)
// export * from './types/database.types';

// Shared constants
export const APP_NAME = 'COMBO';
export const DISCIPLINES = [
  'bjj',
  'mma',
  'kickboxing',
  'muay_thai',
  'wrestling',
  'judo',
  'boxing',
] as const;

export type Discipline = (typeof DISCIPLINES)[number];

// Belt colors in order (for BJJ and similar)
export const BELT_COLORS = [
  'white',
  'blue',
  'purple',
  'brown',
  'black',
] as const;

export type BeltColor = (typeof BELT_COLORS)[number];

// Member roles
export const MEMBER_ROLES = [
  'admin',
  'medewerker',
  'coordinator',
  'coach',
  'fighter',
  'fan',
] as const;

export type MemberRole = (typeof MEMBER_ROLES)[number];

// Member status
export const MEMBER_STATUSES = [
  'active',
  'frozen',
  'cancelled',
  'lead',
] as const;

export type MemberStatus = (typeof MEMBER_STATUSES)[number];

// Utility functions that work in both web and mobile
export function formatBeltDisplay(color: BeltColor, stripes: number): string {
  const stripesText = stripes > 0 ? ` (${stripes} ${stripes === 1 ? 'stripe' : 'stripes'})` : '';
  return `${color.charAt(0).toUpperCase() + color.slice(1)} Belt${stripesText}`;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function formatMemberName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}
