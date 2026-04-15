'use client';

import { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, ArrowLeft } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { getAvailabilitySchedules, createAvailabilitySchedule, deleteAvailabilitySchedule } from '@/lib/api';
import { DAYS_OF_WEEK } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';

export default function AvailabilityPage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('Working Hours');
  const { addToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadSchedules();
  }, []);

  async function loadSchedules() {
    try {
      const data = await getAvailabilitySchedules();
      setSchedules(data);
    } catch (err) {
      addToast('Failed to load schedules', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    try {
      const schedule = await createAvailabilitySchedule({
        name: newName,
        timezone: 'Asia/Kolkata',
        isDefault: schedules.length === 0,
        rules: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
        ],
      });
      addToast('Schedule created!');
      setShowCreateModal(false);
      setNewName('Working Hours');
      loadSchedules();
    } catch (err) {
      addToast('Failed to create schedule', 'error');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this availability schedule?')) return;
    try {
      await deleteAvailabilitySchedule(id);
      addToast('Schedule deleted');
      loadSchedules();
    } catch (err) {
      addToast('Failed to delete', 'error');
    }
  }

  function formatSchedulePreview(schedule) {
    if (!schedule.rules || schedule.rules.length === 0) return 'No hours set';
    const days = schedule.rules.map(r => DAYS_OF_WEEK[r.dayOfWeek]?.slice(0, 3)).filter(Boolean);
    const uniqueDays = [...new Set(days)];
    const times = schedule.rules[0];
    return `${uniqueDays.join(', ')} · ${times.startTime} - ${times.endTime}`;
  }

  return (
    <AdminLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Availability</h1>
            <p>Configure times when you are available for bookings.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            New Schedule
          </button>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner"></div></div>
        ) : schedules.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon"><Clock size={28} /></div>
              <h3>No Availability Schedules</h3>
              <p>Create a schedule to define when you're available for bookings.</p>
              <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                <Plus size={16} /> New Schedule
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {schedules.map(schedule => (
              <div
                key={schedule.id}
                className="card"
                style={{ cursor: 'pointer' }}
                onClick={() => router.push(`/availability/${schedule.id}`)}
              >
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{schedule.name}</h3>
                      {schedule.isDefault && (
                        <span className="badge badge-confirmed">Default</span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                      {formatSchedulePreview(schedule)}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                      {schedule.timezone}
                    </p>
                  </div>
                  <button
                    className="btn btn-ghost btn-icon btn-sm text-danger"
                    onClick={e => { e.stopPropagation(); handleDelete(schedule.id); }}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="New Schedule"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate}>Create</button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Schedule Name</label>
            <input
              className="form-input"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g., Working Hours"
            />
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
