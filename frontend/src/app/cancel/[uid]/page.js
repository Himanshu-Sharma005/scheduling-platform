'use client';

import { useState, useEffect, use } from 'react';
import { getBooking, cancelBooking } from '@/lib/api';
import { formatDate, formatTimeRange } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

export default function CancelBookingPage({ params }) {
  const { uid } = use(params);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const { addToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadBooking();
  }, [uid]);

  async function loadBooking() {
    try {
      const data = await getBooking(uid);
      setBooking(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    setCancelling(true);
    try {
      await cancelBooking(uid, { cancelReason });
      addToast('Booking cancelled');
      router.push(`/booking/${uid}`);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to cancel', 'error');
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="confirmation-page">
        <div className="loading-center"><div className="spinner"></div></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="confirmation-page">
        <div className="confirmation-card">
          <h1>Booking Not Found</h1>
        </div>
      </div>
    );
  }

  if (booking.status === 'cancelled') {
    return (
      <div className="confirmation-page">
        <div className="confirmation-card">
          <h1>Already Cancelled</h1>
          <p className="subtitle">This booking has already been cancelled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-page">
      <div className="confirmation-card" style={{ textAlign: 'left' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Cancel Booking</h1>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem', marginBottom: '2rem' }}>
          Are you sure you want to cancel your booking?
        </p>

        <div className="confirmation-details" style={{ marginBottom: '1.5rem' }}>
          <div className="confirmation-detail-row">
            <span className="confirmation-detail-label" style={{ minWidth: 70 }}>Event</span>
            <span className="confirmation-detail-value">{booking.eventType?.title}</span>
          </div>
          <div className="confirmation-detail-row">
            <span className="confirmation-detail-label" style={{ minWidth: 70 }}>Date</span>
            <span className="confirmation-detail-value">{format(new Date(booking.startTime), 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="confirmation-detail-row">
            <span className="confirmation-detail-label" style={{ minWidth: 70 }}>Time</span>
            <span className="confirmation-detail-value">{formatTimeRange(booking.startTime, booking.endTime)}</span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Reason for cancellation <span className="form-label-optional">(optional)</span></label>
          <textarea
            className="form-textarea"
            rows={3}
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            placeholder="Let us know why you need to cancel..."
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => router.push(`/booking/${uid}`)}>
            Keep Booking
          </button>
          <button className="btn btn-danger" onClick={handleCancel} disabled={cancelling}>
            {cancelling ? 'Cancelling...' : 'Cancel Booking'}
          </button>
        </div>
      </div>
    </div>
  );
}
