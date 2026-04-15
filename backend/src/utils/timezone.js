const { format } = require('date-fns');
const { toZonedTime } = require('date-fns-tz');

/**
 * Format a date to a specific timezone
 */
function formatInTimezone(date, timezone, formatStr = 'yyyy-MM-dd HH:mm:ss') {
  const zonedDate = toZonedTime(date, timezone);
  return format(zonedDate, formatStr);
}

/**
 * Get the display name for a timezone
 */
function getTimezoneLabel(timezone) {
  const labels = {
    'Asia/Kolkata': 'India Standard Time (IST)',
    'America/New_York': 'Eastern Time (ET)',
    'America/Chicago': 'Central Time (CT)',
    'America/Denver': 'Mountain Time (MT)',
    'America/Los_Angeles': 'Pacific Time (PT)',
    'Europe/London': 'Greenwich Mean Time (GMT)',
    'Europe/Paris': 'Central European Time (CET)',
    'Asia/Tokyo': 'Japan Standard Time (JST)',
    'Asia/Shanghai': 'China Standard Time (CST)',
    'Australia/Sydney': 'Australian Eastern Time (AET)',
    'Pacific/Auckland': 'New Zealand Standard Time (NZST)',
    'Asia/Dubai': 'Gulf Standard Time (GST)',
    'Asia/Singapore': 'Singapore Standard Time (SGT)',
  };
  return labels[timezone] || timezone;
}

/**
 * Common timezones list
 */
const COMMON_TIMEZONES = [
  'Asia/Kolkata',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Dubai',
  'Asia/Singapore',
  'Australia/Sydney',
  'Pacific/Auckland',
];

module.exports = { formatInTimezone, getTimezoneLabel, COMMON_TIMEZONES };
