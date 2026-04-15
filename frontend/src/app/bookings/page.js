'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Mail, X as XIcon, FileText } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { getBookings, cancelBooking } from '@/lib/api';
import { formatDate, formatTimeRange, formatTime } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import Modal from '@/components/ui/Modal';
import { format } from 'date-fns';
import Link from 'next/link';

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [cancelModal, setCancelModal] = useState({ open: false, uid: null });
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    loadBookings();
  }, [activeTab]);

  async function loadBookings() {
    setLoading(true);
    try {
      const data = await getBookings({ timeframe: activeTab });
      setBookings(data);
    } catch (err) {
      addToast('Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    setCancelling(true);
    try {
      await cancelBooking(cancelModal.uid, { cancelReason });
      addToast('Booking cancelled');
      setCancelModal({ open: false, uid: null });
      setCancelReason('');
      loadBookings();
    } catch (err) {
      addToast('Failed to cancel booking', 'error');
    } finally {
      setCancelling(false);
    }
  }

  const counts = {
    upcoming: activeTab === 'upcoming' ? bookings.length : '—',
    past: activeTab === 'past' ? bookings.length : '—',
    cancelled: activeTab === 'cancelled' ? bookings.length : '—',
  };

  return (
    <AdminLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Bookings</h1>
            <p>See upcoming and past events booked through your event type links.</p>
          </div>
        </div>

        <div className="tabs">
          {['upcoming', 'past', 'cancelled'].map(tab => (
            <button
              key={tab}
              className={`tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className="tab-count">{activeTab === tab ? bookings.length : '·'}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner"></div></div>
        ) : bookings.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon"><Calendar size={28} /></div>
              <h3>No {activeTab} bookings</h3>
              <p>{activeTab === 'upcoming' ? 'When someone books a time with you, it will show here.' : `You have no ${activeTab} bookings.`}</p>
            </div>
          </div>
        ) : (
          <div className="card">
            {bookings.map(booking => (
              <div key={booking.id} className="booking-card">
                <div className="booking-date-col">
                  <div className="booking-date-day">{format(new Date(booking.startTime), 'd')}</div>
                  <div className="booking-date-month">{format(new Date(booking.startTime), 'MMM yyyy')}</div>
                  <div className="booking-date-weekday">{format(new Date(booking.startTime), 'EEEE')}</div>
                </div>
                <div className="booking-info">
                  <div className="booking-time">
                    {formatTimeRange(booking.startTime, booking.endTime)}
                  </div>
                  <div className="booking-event-title">
                    <span style={{ 
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: booking.eventType?.color || '#2563eb',
                      marginRight: 6,
                    }}></span>
                    {booking.eventType?.title}
                  </div>
                  <div className="booking-attendee">
                    <User size={12} />
                    {booking.bookerName} · {booking.bookerEmail}
                  </div>
                  {booking.bookerNotes && (
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FileText size={11} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>{booking.bookerNotes}</span>
                    </div>
                  )}
                  {booking.status === 'cancelled' && (
                    <div style={{ marginTop: 4 }}>
                      <span className="badge badge-cancelled">
                        <span className="badge-dot"></span>
                        Cancelled
                      </span>
                      {booking.cancelReason && (
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: 8 }}>
                          — {booking.cancelReason}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {booking.status === 'confirmed' && activeTab === 'upcoming' && (
                  <div className="booking-actions">
                    <Link href={`/reschedule/${booking.uid}`} className="btn btn-secondary btn-sm">
                      Reschedule
                    </Link>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setCancelModal({ open: true, uid: booking.uid })}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Cancel Modal */}
        <Modal
          isOpen={cancelModal.open}
          onClose={() => setCancelModal({ open: false, uid: null })}
          title="Cancel Booking"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setCancelModal({ open: false, uid: null })}>
                Keep Booking
              </button>
              <button className="btn btn-danger" onClick={handleCancel} disabled={cancelling}>
                {cancelling ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            </>
          }
        >
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
            Are you sure you want to cancel this booking? The attendee will be notified.
          </p>
          <div className="form-group">
            <label className="form-label">Reason for cancellation <span className="form-label-optional">(optional)</span></label>
            <textarea
              className="form-textarea"
              rows={3}
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Let the attendee know why you're cancelling..."
            />
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
