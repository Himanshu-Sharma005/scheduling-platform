'use client';

import { useState, useEffect, use } from 'react';
import { Clock, MapPin, ArrowRight } from 'lucide-react';
import { getUserProfile } from '@/lib/api';
import { getInitials, getLocationLabel } from '@/lib/utils';
import Link from 'next/link';

export default function PublicProfilePage({ params }) {
  const { username } = use(params);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProfile();
  }, [username]);

  async function loadProfile() {
    try {
      const data = await getUserProfile(username);
      setProfile(data);
    } catch (err) {
      setError('User not found');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-center"><div className="spinner"></div></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="profile-page">
        <div className="profile-error-card">
          <div className="profile-error-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M16 16s-1.5-2-4-2-4 2-4 2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </div>
          <h1>User Not Found</h1>
          <p>The profile you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const { user, eventTypes } = profile;

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* User Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            {getInitials(user.name)}
          </div>
          <h1 className="profile-name">{user.name}</h1>
          <p className="profile-username">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            {window.location.origin}/{user.username}
          </p>
        </div>

        {/* Event Types */}
        {eventTypes.length === 0 ? (
          <div className="profile-empty">
            <p>No event types available for booking.</p>
          </div>
        ) : (
          <div className="profile-events">
            {eventTypes.map(et => (
              <Link
                key={et.id}
                href={`/${user.username}/${et.slug}`}
                className="profile-event-card"
              >
                <div className="profile-event-accent" style={{ background: et.color }}></div>
                <div className="profile-event-body">
                  <div className="profile-event-header">
                    <h2 className="profile-event-title">{et.title}</h2>
                    <ArrowRight size={18} className="profile-event-arrow" />
                  </div>
                  {et.description && (
                    <p className="profile-event-desc">{et.description}</p>
                  )}
                  <div className="profile-event-meta">
                    <span className="profile-event-tag">
                      <Clock size={13} />
                      {et.durationMinutes} min
                    </span>
                    <span className="profile-event-tag">
                      <MapPin size={13} />
                      {getLocationLabel(et.locationType)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="profile-footer">
          <span>Powered by</span>
          <strong>Cal.com Clone</strong>
        </div>
      </div>
    </div>
  );
}
