/**
 * Email notification utility.
 * Currently a no-op placeholder — emails are logged to console.
 * To enable real emails, set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env
 */

async function sendBookingConfirmation(booking, eventType, user) {
  console.log(`📧 [Email] Booking confirmation for ${booking.bookerEmail}`);
  console.log(`   Event: ${eventType.title}`);
  console.log(`   Time: ${booking.startTime} - ${booking.endTime}`);
  console.log(`   Host: ${user.name}`);
}

async function sendCancellationNotice(booking, eventType, user) {
  console.log(`📧 [Email] Cancellation notice for ${booking.bookerEmail}`);
  console.log(`   Event: ${eventType.title}`);
  console.log(`   Reason: ${booking.cancelReason || 'No reason provided'}`);
}

async function sendRescheduleNotice(booking, eventType, user, oldTime) {
  console.log(`📧 [Email] Reschedule notice for ${booking.bookerEmail}`);
  console.log(`   Event: ${eventType.title}`);
  console.log(`   Old time: ${oldTime}`);
  console.log(`   New time: ${booking.startTime} - ${booking.endTime}`);
}

module.exports = { sendBookingConfirmation, sendCancellationNotice, sendRescheduleNotice };
