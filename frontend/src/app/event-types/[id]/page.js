'use client';

import { useState, useEffect, use } from 'react';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { getEventType, updateEventType } from '@/lib/api';
import { EVENT_COLORS, LOCATION_TYPES } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';

export default function EditEventTypePage({ params }) {
  const { id } = use(params);
  const [eventType, setEventType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [activeTab, setActiveTab] = useState('general');
  const { addToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadEventType();
  }, [id]);

  async function loadEventType() {
    try {
      const data = await getEventType(id);
      setEventType(data);
      setForm({
        title: data.title,
        slug: data.slug,
        description: data.description || '',
        durationMinutes: data.durationMinutes,
        locationType: data.locationType,
        color: data.color,
        bufferBefore: data.bufferBefore || 0,
        bufferAfter: data.bufferAfter || 0,
        customQuestions: data.customQuestions || [],
      });
    } catch (err) {
      addToast('Failed to load event type', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateEventType(id, form);
      addToast('Event type updated!');
      router.push('/event-types');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to update', 'error');
    } finally {
      setSaving(false);
    }
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
            <button className="btn btn-ghost btn-icon" onClick={() => router.push('/event-types')}>
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1>{eventType?.title}</h1>
              <p>/{eventType?.user?.username}/{eventType?.slug}</p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="tabs">
          <button className={`tab ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>General</button>
          <button className={`tab ${activeTab === 'questions' ? 'active' : ''}`} onClick={() => setActiveTab('questions')}>Questions</button>
          <button className={`tab ${activeTab === 'advanced' ? 'active' : ''}`} onClick={() => setActiveTab('advanced')}>Advanced</button>
        </div>

        {activeTab === 'general' && (
          <div className="card" style={{ maxWidth: 640 }}>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  className="form-input"
                  value={form.title || ''}
                  onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">URL Slug</label>
                <input
                  className="form-input"
                  value={form.slug || ''}
                  onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description <span className="form-label-optional">(optional)</span></label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={form.description || ''}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="A brief description of this event..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Duration</label>
                  <select
                    className="form-select"
                    value={form.durationMinutes}
                    onChange={e => setForm(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) }))}
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                    <option value={120}>2 hours</option>
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
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="card" style={{ maxWidth: 800 }}>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Custom Questions</h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>Ask invitees to provide more information when booking.</p>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setForm(prev => ({
                    ...prev,
                    customQuestions: [
                      ...(prev.customQuestions || []),
                      { label: '', type: 'text', isRequired: false, options: [], position: (prev.customQuestions?.length || 0) + 1 }
                    ]
                  }))}
                >
                  <Plus size={16} /> Add Question
                </button>
              </div>

              {!form.customQuestions || form.customQuestions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#f9fafb', borderRadius: '0.5rem', border: '1px dashed #d1d5db' }}>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No custom questions added yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {form.customQuestions.map((q, i) => (
                    <div key={i} style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-row">
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Question Label</label>
                            <input
                              className="form-input"
                              value={q.label}
                              onChange={e => {
                                const qArr = [...form.customQuestions];
                                qArr[i].label = e.target.value;
                                setForm({ ...form, customQuestions: qArr });
                              }}
                              placeholder="e.g. What is your phone number?"
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Type</label>
                            <select
                              className="form-select"
                              value={q.type}
                              onChange={e => {
                                const qArr = [...form.customQuestions];
                                qArr[i].type = e.target.value;
                                if (qArr[i].type === 'select' && !qArr[i].options) {
                                  qArr[i].options = ['Option 1', 'Option 2'];
                                }
                                setForm({ ...form, customQuestions: qArr });
                              }}
                            >
                              <option value="text">Short Text</option>
                              <option value="textarea">Long Text</option>
                              <option value="checkbox">Checkbox</option>
                              <option value="select">Dropdown</option>
                            </select>
                          </div>
                        </div>

                        {q.type === 'select' && (
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Options (comma separated)</label>
                            <input
                              className="form-input"
                              value={Array.isArray(q.options) ? q.options.join(', ') : ''}
                              onChange={e => {
                                const qArr = [...form.customQuestions];
                                qArr[i].options = e.target.value.split(',').map(opt => opt.trim()).filter(Boolean);
                                setForm({ ...form, customQuestions: qArr });
                              }}
                              placeholder="Option 1, Option 2, Option 3"
                            />
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input
                            type="checkbox"
                            checked={q.isRequired}
                            onChange={e => {
                              const qArr = [...form.customQuestions];
                              qArr[i].isRequired = e.target.checked;
                              setForm({ ...form, customQuestions: qArr });
                            }}
                            id={`req-${i}`}
                            style={{ width: 16, height: 16 }}
                          />
                          <label htmlFor={`req-${i}`} style={{ fontSize: '0.875rem', cursor: 'pointer', margin: 0 }}>Required field</label>
                        </div>
                      </div>
                      <button
                        className="btn btn-ghost btn-icon text-danger"
                        onClick={() => {
                          const qArr = [...form.customQuestions];
                          qArr.splice(i, 1);
                          setForm({ ...form, customQuestions: qArr });
                        }}
                        style={{ marginTop: '1.75rem' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="card" style={{ maxWidth: 640 }}>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Buffer before event</label>
                  <select
                    className="form-select"
                    value={form.bufferBefore}
                    onChange={e => setForm(prev => ({ ...prev, bufferBefore: parseInt(e.target.value) }))}
                  >
                    <option value={0}>No buffer</option>
                    <option value={5}>5 minutes</option>
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                  </select>
                  <p className="form-hint">Time added before the event for preparation.</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Buffer after event</label>
                  <select
                    className="form-select"
                    value={form.bufferAfter}
                    onChange={e => setForm(prev => ({ ...prev, bufferAfter: parseInt(e.target.value) }))}
                  >
                    <option value={0}>No buffer</option>
                    <option value={5}>5 minutes</option>
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                  </select>
                  <p className="form-hint">Time added after the event for follow-up.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
