'use client';

import { useState, useEffect, use } from 'react';
import { ArrowLeft, Save, Plus, Trash2, CalendarOff, CalendarClock } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import Modal from '@/components/ui/Modal';
import { getAvailabilitySchedule, updateAvailabilitySchedule, addDateOverride, deleteDateOverride } from '@/lib/api';
import { DAYS_OF_WEEK, COMMON_TIMEZONES } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

export default function EditAvailabilityPage({ params }) {
  const { id } = use(params);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [isDefault, setIsDefault] = useState(false);
  const [dayRules, setDayRules] = useState({});
  const [overrides, setOverrides] = useState([]);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideForm, setOverrideForm] = useState({ date: '', isBlocked: true, startTime: '09:00', endTime: '17:00' });
  const { addToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadSchedule();
  }, [id]);

  async function loadSchedule() {
    try {
      const data = await getAvailabilitySchedule(id);
      setSchedule(data);
      setName(data.name);
      setTimezone(data.timezone);
      setIsDefault(data.isDefault);
      setOverrides(data.dateOverrides || []);

      // Build day rules map
      const rules = {};
      for (let i = 0; i < 7; i++) {
        const dayRulesForDay = data.rules.filter(r => r.dayOfWeek === i);
        rules[i] = {
          enabled: dayRulesForDay.length > 0,
          ranges: dayRulesForDay.length > 0
            ? dayRulesForDay.map(r => ({ startTime: r.startTime, endTime: r.endTime }))
            : [{ startTime: '09:00', endTime: '17:00' }],
        };
      }
      setDayRules(rules);
    } catch (err) {
      addToast('Failed to load schedule', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Build rules array from dayRules
      const rules = [];
      for (let day = 0; day < 7; day++) {
        if (dayRules[day]?.enabled) {
          for (const range of dayRules[day].ranges) {
            rules.push({
              dayOfWeek: day,
              startTime: range.startTime,
              endTime: range.endTime,
            });
          }
        }
      }

      await updateAvailabilitySchedule(id, { name, timezone, isDefault, rules });
      addToast('Schedule saved!');
      router.push('/availability');
    } catch (err) {
      addToast('Failed to save schedule', 'error');
    } finally {
      setSaving(false);
    }
  }

  function toggleDay(day) {
    setDayRules(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day]?.enabled,
      },
    }));
  }

  function updateRange(day, index, field, value) {
    setDayRules(prev => {
      const newRanges = [...(prev[day]?.ranges || [])];
      newRanges[index] = { ...newRanges[index], [field]: value };
      return { ...prev, [day]: { ...prev[day], ranges: newRanges } };
    });
  }

  function addRange(day) {
    setDayRules(prev => {
      const ranges = [...(prev[day]?.ranges || []), { startTime: '09:00', endTime: '17:00' }];
      return { ...prev, [day]: { ...prev[day], ranges } };
    });
  }

  async function handleAddOverride() {
    if (!overrideForm.date) {
      addToast('Please select a date', 'error');
      return;
    }
    try {
      const data = {
        date: overrideForm.date,
        isBlocked: overrideForm.isBlocked,
        startTime: overrideForm.isBlocked ? null : overrideForm.startTime,
        endTime: overrideForm.isBlocked ? null : overrideForm.endTime,
      };
      const newOverride = await addDateOverride(id, data);
      setOverrides(prev => [...prev, newOverride]);
      setShowOverrideModal(false);
      setOverrideForm({ date: '', isBlocked: true, startTime: '09:00', endTime: '17:00' });
      addToast('Date override added');
    } catch (err) {
      addToast('Failed to add override', 'error');
    }
  }

  async function handleDeleteOverride(overrideId) {
    try {
      await deleteDateOverride(overrideId);
      setOverrides(prev => prev.filter(o => o.id !== overrideId));
      addToast('Override removed');
    } catch (err) {
      addToast('Failed to remove override', 'error');
    }
  }

  function removeRange(day, index) {
    setDayRules(prev => {
      const ranges = prev[day]?.ranges.filter((_, i) => i !== index);
      return { ...prev, [day]: { ...prev[day], ranges, enabled: ranges.length > 0 } };
    });
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="page-container">
          <div className="loading-center"><div className="spinner"></div></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="page-container">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn btn-ghost btn-icon" onClick={() => router.push('/availability')}>
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1>{name || 'Edit Schedule'}</h1>
              <p>{timezone}</p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="card" style={{ maxWidth: 800 }}>
          <div className="card-body">
            <div className="form-row" style={{ marginBottom: '2rem' }}>
              <div className="form-group">
                <label className="form-label">Schedule Name</label>
                <input className="form-input" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Timezone</label>
                <select className="form-select" value={timezone} onChange={e => setTimezone(e.target.value)}>
                  {COMMON_TIMEZONES.map(tz => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={e => setIsDefault(e.target.checked)}
                  id="isDefault"
                  style={{ width: 16, height: 16 }}
                />
                <label htmlFor="isDefault" className="form-label" style={{ margin: 0 }}>Set as default schedule</label>
              </div>
            </div>

            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Weekly Hours</h3>
            <div className="availability-grid">
              {[0, 1, 2, 3, 4, 5, 6].map(day => (
                <div key={day} className="availability-day">
                  <div className="availability-day-toggle">
                    <button
                      className={`toggle ${dayRules[day]?.enabled ? 'active' : ''}`}
                      onClick={() => toggleDay(day)}
                      style={{ transform: 'scale(0.8)' }}
                    ></button>
                    <span className="availability-day-name">{DAYS_OF_WEEK[day]}</span>
                  </div>
                  <div className="availability-time-ranges">
                    {dayRules[day]?.enabled ? (
                      <>
                        {dayRules[day].ranges.map((range, i) => (
                          <div key={i} className="availability-time-range">
                            <input
                              type="time"
                              value={range.startTime}
                              onChange={e => updateRange(day, i, 'startTime', e.target.value)}
                            />
                            <span style={{ color: '#9ca3af' }}>–</span>
                            <input
                              type="time"
                              value={range.endTime}
                              onChange={e => updateRange(day, i, 'endTime', e.target.value)}
                            />
                            {dayRules[day].ranges.length > 1 && (
                              <button
                                className="btn btn-ghost btn-icon btn-sm"
                                onClick={() => removeRange(day, i)}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => addRange(day)}
                          style={{ fontSize: '0.75rem' }}
                        >
                          <Plus size={12} /> Add
                        </button>
                      </>
                    ) : (
                      <span className="availability-unavailable">Unavailable</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Date Overrides Section */}
        <div className="card" style={{ maxWidth: 800, marginTop: '1.5rem' }}>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Date Overrides</h3>
                <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Block specific dates or set custom hours for individual days.
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowOverrideModal(true)}>
                <Plus size={14} /> Add Override
              </button>
            </div>

            {overrides.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', fontSize: '0.875rem' }}>
                No date overrides set. Add one to block a date or set custom hours.
              </div>
            ) : (
              <div className="override-list">
                {overrides.map(o => (
                  <div key={o.id} className="override-item">
                    <div className="override-icon">
                      {o.isBlocked ? <CalendarOff size={16} /> : <CalendarClock size={16} />}
                    </div>
                    <div className="override-info">
                      <div className="override-date">
                        {format(new Date(o.date), 'EEEE, MMMM d, yyyy')}
                      </div>
                      <div className="override-detail">
                        {o.isBlocked ? (
                          <span style={{ color: '#ef4444' }}>Blocked — No availability</span>
                        ) : (
                          <span>{o.startTime} – {o.endTime}</span>
                        )}
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost btn-icon btn-sm text-danger"
                      onClick={() => handleDeleteOverride(o.id)}
                      title="Remove override"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Override Modal */}
        <Modal
          isOpen={showOverrideModal}
          onClose={() => setShowOverrideModal(false)}
          title="Add Date Override"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowOverrideModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddOverride}>Add Override</button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-input"
              value={overrideForm.date}
              onChange={e => setOverrideForm(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Override Type</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="overrideType"
                  checked={overrideForm.isBlocked}
                  onChange={() => setOverrideForm(prev => ({ ...prev, isBlocked: true }))}
                />
                Block entire day
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="overrideType"
                  checked={!overrideForm.isBlocked}
                  onChange={() => setOverrideForm(prev => ({ ...prev, isBlocked: false }))}
                />
                Custom hours
              </label>
            </div>
          </div>
          {!overrideForm.isBlocked && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={overrideForm.startTime}
                  onChange={e => setOverrideForm(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={overrideForm.endTime}
                  onChange={e => setOverrideForm(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
