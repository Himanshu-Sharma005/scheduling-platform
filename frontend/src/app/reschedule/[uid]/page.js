'use client';

import { useState, useEffect, use } from 'react';
import { Clock, MapPin, Globe, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { getBooking, getPublicSlots, rescheduleBooking } from '@/lib/api';
import { getInitials, getLocationLabel, COMMON_TIMEZONES } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
  addMinutes,
} from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';

export default function RescheduleBookingPage({ params }) {
  const { uid } = use(params);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState('Asia/Kolkata');
  const { addToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadBooking();
  }, [uid]);

  useEffect(() => {
    if (selectedDate && booking) {
      loadSlots(format(selectedDate, 'yyyy-MM-dd'));
    }
  }, [selectedDate]);

  async function loadBooking() {
    try {
      const data = await getBooking(uid);
      setBooking(data);
      if (data.timezone) setSelectedTimezone(data.timezone);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadSlots(dateStr) {
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const data = await getPublicSlots(
        booking.eventType.user.username,
        booking.eventType.slug,
        dateStr,
        selectedTimezone
      );
      setSlots(data.slots || []);
    } catch (err) {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleReschedule() {
    setRescheduling(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const localDate = new Date(`${dateStr}T${selectedSlot}:00`);
      const utcStart = fromZonedTime(localDate, selectedTimezone);
      const utcEnd = addMinutes(utcStart, booking.eventType.durationMinutes);

      await rescheduleBooking(uid, {
        startTime: utcStart.toISOString(),
        endTime: utcEnd.toISOString(),
        timezone: selectedTimezone,
      });

      addToast('Booking rescheduled!');
      router.push(`/booking/${uid}`);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to reschedule', 'error');
    } finally {
      setRescheduling(false);
    }
  }

  function renderCalendar() {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);

    const days = [];
    let day = calStart;
    while (day <= calEnd) {
      const d = day;
      const isCurrentMonth = isSameMonth(d, currentMonth);
      const isSelected = selectedDate && isSameDay(d, selectedDate);
      const isPast = isBefore(d, startOfDay(new Date()));
      const isTodayDate = isToday(d);

      let className = 'calendar-day';
      if (!isCurrentMonth) className += ' other-month';
      if (isSelected) className += ' selected';
      if (isTodayDate) className += ' today';
      if (isPast || !isCurrentMonth) className += ' disabled';

      days.push(
        <button
          key={d.toISOString()}
          className={className}
          onClick={() => !isPast && isCurrentMonth && setSelectedDate(d)}
          disabled={isPast || !isCurrentMonth}
        >
          {format(d, 'd')}
        </button>
      );
      day = addDays(day, 1);
    }
    return days;
  }

  if (loading) {
    return <div className="booking-page"><div className="loading-center"><div className="spinner"></div></div></div>;
  }

  if (!booking || booking.status === 'cancelled') {
    return (
      <div className="booking-page">
        <div className="confirmation-card" style={{ textAlign: 'center' }}>
          <h1>Cannot Reschedule</h1>
          <p className="subtitle">This booking cannot be rescheduled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div className="booking-container">
        <div className="booking-sidebar-panel">
          <div className="booking-host-avatar">
            {getInitials(booking.eventType?.user?.name)}
          </div>
          <div className="booking-host-name">{booking.eventType?.user?.name}</div>
          <div className="booking-event-name">Reschedule: {booking.eventType?.title}</div>
          <div className="booking-detail">
            <Clock size={16} />
            <span>{booking.eventType?.durationMinutes} min</span>
          </div>
          <div className="booking-detail">
            <Globe size={16} />
            <select
              value={selectedTimezone}
              onChange={e => setSelectedTimezone(e.target.value)}
              style={{ background: 'none', border: 'none', font: 'inherit', fontSize: '0.875rem', color: '#6b7280', cursor: 'pointer', padding: 0 }}
            >
              {COMMON_TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="booking-main-panel">
          <div className="booking-calendar-section">
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Select a New Date</h3>
            <div className="calendar">
              <div className="calendar-header">
                <h3>{format(currentMonth, 'MMMM yyyy')}</h3>
                <div className="calendar-nav">
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft size={18} /></button>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight size={18} /></button>
                </div>
              </div>
              <div className="calendar-grid">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="calendar-weekday">{d}</div>
                ))}
                {renderCalendar()}
              </div>
            </div>
          </div>

          {selectedDate && (
            <div className="booking-slots-section">
              <div className="booking-slots-date">{format(selectedDate, 'EEE, MMM d')}</div>
              {loadingSlots ? (
                <div className="loading-center" style={{ padding: '2rem 0' }}><div className="spinner"></div></div>
              ) : slots.length === 0 ? (
                <p style={{ fontSize: '0.8125rem', color: '#9ca3af', textAlign: 'center', padding: '2rem 0' }}>No available slots</p>
              ) : (
                <>
                  <div className="time-slots">
                    {slots.map(slot => (
                      <button
                        key={slot}
                        className={`time-slot ${selectedSlot === slot ? 'selected' : ''}`}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                  {selectedSlot && (
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', marginTop: '1rem' }}
                      onClick={handleReschedule}
                      disabled={rescheduling}
                    >
                      {rescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
