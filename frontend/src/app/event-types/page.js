'use client';

import { useState, useEffect } from 'react';
import { Plus, Link2, Clock, ExternalLink, Copy, Edit3, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import Modal from '@/components/ui/Modal';
import { getEventTypes, createEventType, deleteEventType, toggleEventType } from '@/lib/api';
import { getLocationLabel, slugify, EVENT_COLORS, LOCATION_TYPES } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';

export default function EventTypesPage() {
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', duration: 30, slug: '', color: '#2563eb', locationType: 'google_meet' });
  const { addToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadEventTypes();
  }, []);

  async function loadEventTypes() {
    try {
      const data = await getEventTypes();
      setEventTypes(data);
    } catch (err) {
      addToast('Failed to load event types', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!form.title.trim()) return;
    setCreating(true);
    try {
      await createEventType({
        title: form.title,
        slug: form.slug || slugify(form.title),
        durationMinutes: form.duration,
        color: form.color,
        locationType: form.locationType,
      });
      addToast('Event type created!');
      setShowCreateModal(false);
      setForm({ title: '', duration: 30, slug: '', color: '#2563eb', locationType: 'google_meet' });
      loadEventTypes();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to create', 'error');
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(id) {
    try {
      await toggleEventType(id);
      loadEventTypes();
    } catch (err) {
      addToast('Failed to toggle', 'error');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this event type?')) return;
    try {
      await deleteEventType(id);
      addToast('Event type deleted');
      loadEventTypes();
    } catch (err) {
      addToast('Failed to delete', 'error');
    }
  }

  function copyLink(eventType) {
    const url = `${window.location.origin}/${eventType.user.username}/${eventType.slug}`;
    navigator.clipboard.writeText(url);
    addToast('Link copied to clipboard!');
  }

  return (
    <AdminLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Event Types</h1>
            <p>Create events to share for people to book on your calendar.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            New Event Type
          </button>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner"></div></div>
        ) : eventTypes.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon"><Link2 size={28} /></div>
              <h3>No Event Types</h3>
              <p>Create your first event type to start accepting bookings.</p>
              <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                <Plus size={16} /> New Event Type
              </button>
            </div>
          </div>
        ) : (
          <div className="card">
            {eventTypes.map(et => (
              <div key={et.id} className="event-type-card">
                <div className="event-type-color" style={{ background: et.color }}></div>
                <div className="event-type-info">
                  <div className="event-type-title">
                    {et.title}
                    {!et.isActive && <span style={{ opacity: 0.5, marginLeft: 8, fontSize: '0.75rem' }}>(Disabled)</span>}
                  </div>
                  <div className="event-type-meta">
                    <span><Clock size={14} /> {et.durationMinutes}m</span>
                    <span>{getLocationLabel(et.locationType)}</span>
                    <span>/{et.user?.username}/{et.slug}</span>
                  </div>
                </div>
                <div className="event-type-actions">
                  <button
                    className={`toggle ${et.isActive ? 'active' : ''}`}
                    onClick={() => handleToggle(et.id)}
                    title={et.isActive ? 'Disable' : 'Enable'}
                  ></button>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => copyLink(et)} title="Copy link">
                    <Copy size={14} />
                  </button>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => window.open(`/${et.user?.username}/${et.slug}`, '_blank')} title="Preview">
                    <ExternalLink size={14} />
                  </button>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => router.push(`/event-types/${et.id}`)} title="Edit">
                    <Edit3 size={14} />
                  </button>
                  <button className="btn btn-ghost btn-icon btn-sm text-danger" onClick={() => handleDelete(et.id)} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Add a new event type"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={creating || !form.title.trim()}>
                {creating ? 'Creating...' : 'Create'}
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              className="form-input"
              placeholder="Quick Meeting"
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value, slug: slugify(e.target.value) }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">URL <span className="form-label-optional">/{form.slug || 'your-url'}</span></label>
            <input
              className="form-input"
              placeholder="quick-meeting"
              value={form.slug}
              onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Duration (minutes)</label>
              <select
                className="form-select"
                value={form.duration}
                onChange={e => setForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <select
                className="form-select"
                value={form.locationType}
                onChange={e => setForm(prev => ({ ...prev, locationType: e.target.value }))}
              >
                {LOCATION_TYPES.map(lt => (
                  <option key={lt.value} value={lt.value}>{lt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <div className="color-options">
              {EVENT_COLORS.map(color => (
                <button
                  key={color}
                  className={`color-option ${form.color === color ? 'selected' : ''}`}
                  style={{ background: color }}
                  onClick={() => setForm(prev => ({ ...prev, color }))}
                />
              ))}
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
