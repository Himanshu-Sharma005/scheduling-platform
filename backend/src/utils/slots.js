const { parseISO, format, addMinutes, isBefore, isEqual, startOfDay, endOfDay } = require('date-fns');
const { toZonedTime, fromZonedTime } = require('date-fns-tz');

/**
 * Generate available time slots for a given date.
 * 
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @param {Array} availabilityRules - Availability rules for the schedule
 * @param {Array} dateOverrides - Date overrides for the schedule
 * @param {Array} existingBookings - Existing bookings for the event type
 * @param {number} durationMinutes - Duration of the event in minutes
 * @param {number} bufferBefore - Buffer before event in minutes
 * @param {number} bufferAfter - Buffer after event in minutes
 * @param {string} scheduleTimezone - The timezone of the availability schedule
 * @returns {Array} Array of available time slot strings (e.g., ["09:00", "09:30", ...])
 */
function generateSlots(dateStr, availabilityRules, dateOverrides, existingBookings, durationMinutes, bufferBefore = 0, bufferAfter = 0, scheduleTimezone = 'Asia/Kolkata') {
  const date = parseISO(dateStr);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

  // Check for date overrides first
  const override = dateOverrides.find(o => {
    const overrideDate = format(new Date(o.date), 'yyyy-MM-dd');
    return overrideDate === dateStr;
  });

  if (override && override.isBlocked) {
    return [];
  }

  // Get time ranges for this day
  let timeRanges = [];

  if (override && override.startTime && override.endTime) {
    timeRanges.push({ startTime: override.startTime, endTime: override.endTime });
  } else {
    const rulesForDay = availabilityRules.filter(r => r.dayOfWeek === dayOfWeek);
    timeRanges = rulesForDay.map(r => ({ startTime: r.startTime, endTime: r.endTime }));
  }

  if (timeRanges.length === 0) {
    return [];
  }

  const slots = [];
  const slotInterval = 15; // Generate slots every 15 minutes

  for (const range of timeRanges) {
    const [startHour, startMin] = range.startTime.split(':').map(Number);
    const [endHour, endMin] = range.endTime.split(':').map(Number);

    // Create start and end times in the schedule timezone
    const rangeStart = new Date(date);
    rangeStart.setHours(startHour, startMin, 0, 0);

    const rangeEnd = new Date(date);
    rangeEnd.setHours(endHour, endMin, 0, 0);

    let current = new Date(rangeStart);

    while (true) {
      const slotEnd = addMinutes(current, durationMinutes);

      // Slot must end within the availability range
      if (isBefore(rangeEnd, slotEnd) && !isEqual(rangeEnd, slotEnd)) {
        break;
      }

      // Check for conflicts with existing bookings (including buffers)
      const slotStartWithBuffer = addMinutes(current, -bufferBefore);
      const slotEndWithBuffer = addMinutes(slotEnd, bufferAfter);

      const slotStartUTC = fromZonedTime(current, scheduleTimezone);
      const slotEndUTC = fromZonedTime(slotEnd, scheduleTimezone);

      const hasConflict = existingBookings.some(booking => {
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);
        const bookingStartWithBuffer = addMinutes(bookingStart, -bufferBefore);
        const bookingEndWithBuffer = addMinutes(bookingEnd, bufferAfter);

        return slotStartUTC < bookingEndWithBuffer && slotEndUTC > bookingStartWithBuffer;
      });

      // Check if slot is in the past
      const now = new Date();
      const slotTimeUTC = fromZonedTime(current, scheduleTimezone);
      const isInPast = isBefore(slotTimeUTC, now);

      if (!hasConflict && !isInPast) {
        slots.push(format(current, 'HH:mm'));
      }

      current = addMinutes(current, slotInterval);
    }
  }

  return slots;
}

module.exports = { generateSlots };
