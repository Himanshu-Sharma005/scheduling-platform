'use client';

import { useState, useEffect, use } from 'react';
import { Clock, MapPin, Globe, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { getPublicEventInfo, getPublicSlots, createPublicBooking } from '@/lib/api';
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
} from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';

export default function PublicBookingPage({ params }) {
  const { username, slug } = use(params);
  const [eventInfo, setEventInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [booking, setBooking] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', notes: '' });
  const [questionAnswers, setQuestionAnswers] = useState({});
  const [selectedTimezone, setSelectedTimezone] = useState('Asia/Kolkata');
  const { addToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadEventInfo();
  }, [username, slug]);

  useEffect(() => {
    if (selectedDate) {
      loadSlots(format(selectedDate, 'yyyy-MM-dd'));
    }
  }, [selectedDate]);

  async function loadEventInfo() {
    try {
      const data = await getPublicEventInfo(username, slug);
      setEventInfo(data);
      if (data.user?.timezone) {
        setSelectedTimezone(data.user.timezone);
      }
      // Initialize custom question answers
      if (data.customQuestions?.length) {
        const initial = {};
        data.customQuestions.forEach(q => {
          initial[q.id] = q.type === 'checkbox' ? false : '';
        });
        setQuestionAnswers(initial);
      }
    } catch (err) {
      setError('Event not found');
    } finally {
      setLoading(false);
    }
  }

  async function loadSlots(dateStr) {
    setLoadingSlots(true);
    setSelectedSlot(null);
    setShowForm(false);
    try {
      const data = await getPublicSlots(username, slug, dateStr, selectedTimezone);
      setSlots(data.slots || []);
    } catch (err) {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  function handleSlotSelect(slot) {
    setSelectedSlot(slot);
    setShowForm(true);
  }

  async function handleBook() {
    if (!form.name.trim() || !form.email.trim()) {
      addToast('Please fill in name and email', 'error');
      return;
    }

    // Validate required custom questions
    if (eventInfo.customQuestions?.length) {
      for (const q of eventInfo.customQuestions) {
        if (q.isRequired && !questionAnswers[q.id] && questionAnswers[q.id] !== false) {
          addToast(`Please fill in: ${q.label}`, 'error');
          return;
        }
      }
    }

    setBooking(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Create the start time in the schedule timezone, then convert to ISO
      const localDate = new Date(`${dateStr}T${selectedSlot}:00`);
      const utcTime = fromZonedTime(localDate, selectedTimezone);

      // Build answers array from custom questions
      const answers = eventInfo.customQuestions?.length
        ? eventInfo.customQuestions
            .filter(q => questionAnswers[q.id] !== '' && questionAnswers[q.id] !== undefined)
            .map(q => ({
              questionId: q.id,
              answer: String(questionAnswers[q.id]),
            }))
        : undefined;

      const result = await createPublicBooking(username, slug, {
        bookerName: form.name,
        bookerEmail: form.email,
        bookerNotes: form.notes || undefined,
        startTime: utcTime.toISOString(),
        timezone: selectedTimezone,
        answers,
      });

      router.push(`/booking/${result.uid}`);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to book', 'error');
    } finally {
      setBooking(false);
    }
  }

  // Calendar rendering
  function renderCalendar() {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);

    const weeks = [];
    let day = calStart;
    while (day <= calEnd) {
      const week = [];
      for (let i = 0; i < 7; i++) {
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

        week.push(
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
      weeks.push(<div key={day.toISOString()} style={{ display: 'contents' }}>{week}</div>);
    }

    return weeks;
  }

  if (loading) {
    return (
      <div className="booking-page">
        <div className="loading-center"><div className="spinner"></div></div>
      </div>
    );
  }

  if (error || !eventInfo) {
    return (
      <div className="booking-page">
        <div className="confirmation-card" style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.25rem' }}>Event Not Found</h1>
          <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>This event type doesn't exist or has been disabled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div className="booking-container">
        {/* Left Panel — Event Info */}
        <div className="booking-sidebar-panel">
          <div className="booking-host-avatar">
            {getInitials(eventInfo.user?.name)}
          </div>
          <div className="booking-host-name">{eventInfo.user?.name}</div>
          <div className="booking-event-name">{eventInfo.title}</div>

          <div className="booking-detail">
            <Clock size={16} />
            <span>{eventInfo.durationMinutes} min</span>
          </div>
          <div className="booking-detail">
            <MapPin size={16} />
            <span>{getLocationLabel(eventInfo.locationType)}</span>
          </div>
          <div className="booking-detail">
            <Globe size={16} />
            <select
              value={selectedTimezone}
              onChange={e => setSelectedTimezone(e.target.value)}
              style={{
                background: 'none',
                border: 'none',
                font: 'inherit',
                fontSize: '0.875rem',
                color: '#6b7280',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {COMMON_TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>

          {eventInfo.description && (
            <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '1rem', lineHeight: 1.6 }}>
              {eventInfo.description}
            </p>
          )}

          {selectedDate && selectedSlot && (
            <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#111827' }}>
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.25rem' }}>
                {selectedSlot}
              </div>
            </div>
          )}
        </div>

        {/* Main Panel */}
        <div className="booking-main-panel">
          {showForm ? (
            /* Booking Form */
            <div style={{ padding: '1.5rem', flex: 1 }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowForm(false)}
                style={{ marginBottom: '1rem' }}
              >
                <ArrowLeft size={14} /> Back
              </button>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Enter your details</h3>

              <div className="form-group">
                <label className="form-label">Your Name *</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Smith"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  className="form-input"
                  type="email"
                  value={form.email}
                  onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Additional Notes <span className="form-label-optional">(optional)</span></label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={form.notes}
                  onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Share anything that will help prepare for our meeting..."
                />
              </div>

              {/* Custom Questions */}
              {eventInfo.customQuestions?.map(q => (
                <div key={q.id} className="form-group">
                  <label className="form-label">
                    {q.label} {q.isRequired ? '*' : <span className="form-label-optional">(optional)</span>}
                  </label>
                  {q.type === 'text' && (
                    <input
                      className="form-input"
                      value={questionAnswers[q.id] || ''}
                      onChange={e => setQuestionAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    />
                  )}
                  {q.type === 'textarea' && (
                    <textarea
                      className="form-textarea"
                      rows={3}
                      value={questionAnswers[q.id] || ''}
                      onChange={e => setQuestionAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    />
                  )}
                  {q.type === 'select' && (
                    <select
                      className="form-select"
                      value={questionAnswers[q.id] || ''}
                      onChange={e => setQuestionAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    >
                      <option value="">Select an option...</option>
                      {(q.options || []).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                  {q.type === 'checkbox' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={!!questionAnswers[q.id]}
                        onChange={e => setQuestionAnswers(prev => ({ ...prev, [q.id]: e.target.checked }))}
                        style={{ width: 16, height: 16 }}
                      />
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Yes</span>
                    </div>
                  )}
                </div>
              ))}

              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: '0.5rem' }}
                onClick={handleBook}
                disabled={booking || !form.name.trim() || !form.email.trim()}
              >
                {booking ? 'Confirming...' : 'Confirm Booking'}
              </button>
            </div>
          ) : (
            <>
              {/* Calendar */}
              <div className="booking-calendar-section">
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Select a Date</h3>
                <div className="calendar">
                  <div className="calendar-header">
                    <h3>{format(currentMonth, 'MMMM yyyy')}</h3>
                    <div className="calendar-nav">
                      <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                        <ChevronLeft size={18} />
                      </button>
                      <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                        <ChevronRight size={18} />
                      </button>
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

              {/* Time Slots */}
              {selectedDate && (
                <div className="booking-slots-section">
                  <div className="booking-slots-date">
                    {format(selectedDate, 'EEE, MMM d')}
                  </div>
                  {loadingSlots ? (
                    <div className="loading-center" style={{ padding: '2rem 0' }}>
                      <div className="spinner"></div>
                    </div>
                  ) : slots.length === 0 ? (
                    <p style={{ fontSize: '0.8125rem', color: '#9ca3af', textAlign: 'center', padding: '2rem 0' }}>
                      No available slots
                    </p>
                  ) : (
                    <div className="time-slots">
                      {slots.map(slot => (
                        <button
                          key={slot}
                          className={`time-slot ${selectedSlot === slot ? 'selected' : ''}`}
                          onClick={() => handleSlotSelect(slot)}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
