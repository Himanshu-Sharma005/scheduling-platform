import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export function formatDate(date, formatStr = 'MMM d, yyyy') {
  return format(new Date(date), formatStr);
}

export function formatTime(date, formatStr = 'h:mm a') {
  return format(new Date(date), formatStr);
}

export function formatDateTime(date) {
  return format(new Date(date), 'EEE, MMM d, yyyy · h:mm a');
}

export function formatTimeRange(start, end) {
  return `${format(new Date(start), 'h:mm a')} - ${format(new Date(end), 'h:mm a')}`;
}

export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getLocationLabel(type) {
  const labels = {
    google_meet: 'Google Meet',
    zoom: 'Zoom',
    phone: 'Phone Call',
    in_person: 'In Person',
    custom: 'Custom',
  };
  return labels[type] || type;
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const EVENT_COLORS = [
  '#2563eb', '#7c3aed', '#059669', '#d97706',
  '#dc2626', '#0891b2', '#4f46e5', '#c026d3',
  '#ea580c', '#0d9488',
];

export const LOCATION_TYPES = [
  { value: 'google_meet', label: 'Google Meet' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'phone', label: 'Phone Call' },
  { value: 'in_person', label: 'In Person' },
  { value: 'custom', label: 'Custom' },
];

export const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export const COMMON_TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern (AET)' },
];
