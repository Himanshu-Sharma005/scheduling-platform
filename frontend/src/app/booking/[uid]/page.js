'use client';

import { useState, useEffect, use } from 'react';
import { CheckCircle, Calendar, Clock, User, Mail, MapPin, FileText } from 'lucide-react';
import { getBooking } from '@/lib/api';
import { formatDate, formatTimeRange, getLocationLabel } from '@/lib/utils';
import { format } from 'date-fns';
import Link from 'next/link';

export default function BookingConfirmationPage({ params }) {
  const { uid } = use(params);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBooking();
  }, [uid]);

  async function loadBooking() {
    try {
      const data = await getBooking(uid);
      setBooking(data);
    } catch (err) {
      console.error('Failed to load booking:', err);
    } finally {
      setLoading(false);
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
          <p className="subtitle">This booking doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const isCancelled = booking.status === 'cancelled';

  return (
    <div className="confirmation-page">
      <div className="confirmation-card">
        <div className="confirmation-icon" style={isCancelled ? { background: '#fef2f2', color: '#ef4444' } : {}}>
          {isCancelled ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
          ) : (
            <CheckCircle size={32} />
          )}
        </div>

        <h1>{isCancelled ? 'Booking Cancelled' : 'Booking Confirmed!'}</h1>
        <p className="subtitle">
          {isCancelled
            ? 'This booking has been cancelled.'
            : `Your booking with ${booking.eventType?.user?.name} has been confirmed.`
          }
        </p>

        <div className="confirmation-details">
          <div className="confirmation-detail-row">
            <FileText size={16} />
            <span className="confirmation-detail-label">What</span>
            <span className="confirmation-detail-value">{booking.eventType?.title}</span>
          </div>
          <div className="confirmation-detail-row">
            <Calendar size={16} />
            <span className="confirmation-detail-label">When</span>
            <span className="confirmation-detail-value">
              {format(new Date(booking.startTime), 'EEEE, MMMM d, yyyy')}
            </span>
          </div>
          <div className="confirmation-detail-row">
            <Clock size={16} />
            <span className="confirmation-detail-label">Time</span>
            <span className="confirmation-detail-value">
              {formatTimeRange(booking.startTime, booking.endTime)}
            </span>
          </div>
          <div className="confirmation-detail-row">
            <MapPin size={16} />
            <span className="confirmation-detail-label">Where</span>
            <span className="confirmation-detail-value">{getLocationLabel(booking.eventType?.locationType)}</span>
          </div>
          <div className="confirmation-detail-row">
            <User size={16} />
            <span className="confirmation-detail-label">Who</span>
            <span className="confirmation-detail-value">{booking.bookerName}</span>
          </div>
          <div className="confirmation-detail-row">
            <Mail size={16} />
            <span className="confirmation-detail-label">Email</span>
            <span className="confirmation-detail-value">{booking.bookerEmail}</span>
          </div>
        </div>

        {!isCancelled && (
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={`/cancel/${booking.uid}`} className="btn btn-secondary">
              Cancel Booking
            </Link>
            <Link href={`/reschedule/${booking.uid}`} className="btn btn-secondary">
              Reschedule
            </Link>
          </div>
        )}

        {isCancelled && booking.cancelReason && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fef2f2', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#dc2626', textAlign: 'left' }}>
            <strong>Reason:</strong> {booking.cancelReason}
          </div>
        )}
      </div>
    </div>
  );
}
