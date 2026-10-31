import { MemberPermission, EventType } from '@/types/firestore';

/**
 * Returns human-readable role label based on permission and eventType.
 * Weddings: "Couple"
 * Birthdays: "Host"
 * Community events: "Organiser"
 */
export function getRoleLabel(permission: MemberPermission, eventType?: EventType | string): string {
  switch (permission) {
    case 'couple':
      if (eventType === 'birthday') return 'Host';
      if (eventType === 'community') return 'Organiser';
      return 'Couple';
    case 'voter':
      return 'Voter';
    case 'advisor':
      return 'Advisor';
    case 'viewer':
      return 'Viewer';
    default:
      return permission;
  }
}

/**
 * Returns event title phrasing (e.g., "Wedding Plan", "Birthday Plan", "Celebration Plan")
 */
export function getPlanTitle(eventType?: EventType | string): string {
  if (eventType === 'birthday') return 'Birthday Plan';
  if (eventType === 'community') return 'Event Logistics & Plan';
  return 'Wedding Plan';
}

/**
 * Returns date label phrasing (e.g., "Wedding Date", "Birthday Date", "Event Date")
 */
export function getDateLabel(eventType?: EventType | string): string {
  if (eventType === 'birthday') return 'Birthday Date';
  if (eventType === 'community') return 'Event Date';
  return 'Wedding Date';
}

