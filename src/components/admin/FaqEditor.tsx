'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Check, AlertTriangle, RefreshCw, Plus, Trash2, Eye, EyeOff, HelpCircle } from 'lucide-react';

export interface FaqItemRow {
  id?: number;
  scope: string;
  sort_order: number;
  enabled: boolean;
  question_en: string;
  question_bn: string;
  answer_en: string;
  answer_bn: string;
}

interface FaqEditorProps {
  faqItems: FaqItemRow[];
  setFaqItems: React.Dispatch<React.SetStateAction<FaqItemRow[]>>;
  selectedScope: string;
  setSelectedScope: (scope: string) => void;
  onSaveScope: (scope: string) => Promise<void>;
  savingScope: boolean;
  saveStatus: 'saved' | 'error' | null;
  toolList?: Array<{ slug: string; title_en?: string; title_bn?: string }>;
}

const KNOWN_SCOPES: Array<{ id: string; label: string }> = [
  { id: 'general', label: 'General FAQ (/faq page)' },
  { id: 'compress-image', label: 'Compress Image' },
  { id: 'resize-image', label: 'Resize Image' },
  { id: 'passport-photo', label: 'Passport Photo' },
  { id: 'remove-ai-label', label: 'Remove AI Label' },
  { id: 'remove-background', label: 'Remove Background' },
  { id: 'merge-pdf', label: 'Merge PDF' },
  { id: 'qr-generator', label: 'QR Generator' },
  { id: 'video-downloader', label: 'Video Downloader' },
];

export default function FaqEditor({
  faqItems,
  setFaqItems,
  selectedScope,
  setSelectedScope,
  onSaveScope,
  savingScope,
  saveStatus,
}: FaqEditorProps) {
  const [validationError, setValidationError] = useState<string | null>(null);

  // Current scope items
  const currentItems = faqItems
    .filter((f) => f.scope === selectedScope)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  /** Validates the current scope's items; returns an error string or null. */
  const validateCurrentScope = (): string | null => {
    for (let i = 0; i < currentItems.length; i++) {
      const item = currentItems[i];
      if (!item.question_en?.trim()) return `Question ${i + 1}: English question is required.`;
      if (!item.question_bn?.trim()) return `Question ${i + 1}: Bangla question is required.`;
      if (!item.answer_en?.trim()) return `Question ${i + 1}: English answer is required.`;
      if (!item.answer_bn?.trim()) return `Question ${i + 1}: Bangla answer is required.`;
    }
    return null;
  };

  /** Save handler with client-side validation gate. */
  const handleSave = async (scope: string) => {
    const err = validateCurrentScope();
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    await onSaveScope(scope);
  };

  const handleUpdateItem = (indexInScope: number, field: keyof FaqItemRow, value: any) => {
    // Find the actual item in faqItems
    let count = 0;
    setFaqItems((prev) =>
      prev.map((item) => {
        if (item.scope === selectedScope) {
          if (count === indexInScope) {
            count++;
            return { ...item, [field]: value };
          }
          count++;
        }
        return item;
      })
    );
  };

  const handleAddItem = () => {
    const newItem: FaqItemRow = {
      scope: selectedScope,
      sort_order: currentItems.length + 1,
      enabled: true,
      question_en: '',
      question_bn: '',
      answer_en: '',
      answer_bn: '',
    };
    setFaqItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (indexInScope: number) => {
    let count = 0;
    setFaqItems((prev) =>
      prev.filter((item) => {
        if (item.scope === selectedScope) {
          if (count === indexInScope) {
            count++;
            return false;
          }
          count++;
        }
        return true;
      })
    );
  };

  return (
    <div>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: '#f8fafc' }}>
            FAQ Manager
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
            Every question is stored in the <code>content_faq_items</code> database table. Select a scope to edit questions with isolated saves.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            href="/faq"
            target="_blank"
            style={{
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ExternalLink size={14} /> View /faq
          </Link>
        </div>
      </div>

      {/* Scope Selector Pills */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '12px',
          marginBottom: '20px',
        }}
      >
        {KNOWN_SCOPES.map((sc) => {
          const isActive = selectedScope === sc.id;
          const count = faqItems.filter((f) => f.scope === sc.id).length;
          return (
            <button
              key={sc.id}
              type="button"
              onClick={() => setSelectedScope(sc.id)}
              style={{
                background: isActive ? '#38bdf8' : '#1e293b',
                color: isActive ? '#0f172a' : '#94a3b8',
                border: '1px solid ' + (isActive ? '#38bdf8' : '#334155'),
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>{sc.label}</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '999px',
                  background: isActive ? 'rgba(15, 23, 42, 0.25)' : '#334155',
                  color: isActive ? '#0f172a' : '#cbd5e1',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Scope Editor Card */}
      <div
        style={{
          background: '#111827',
          border: '1px solid #1f2937',
          borderRadius: '16px',
          padding: '20px 16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        }}
      >
        {/* Card Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '20px',
            paddingBottom: '14px',
            borderBottom: '1px solid #1f2937',
          }}
        >
          <div style={{ minWidth: 0, flex: '1 1 auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px', color: '#f8fafc', wordBreak: 'break-word' }}>
              Scope: {selectedScope.toUpperCase()} ({currentItems.length} questions)
            </h2>
            <span style={{ fontSize: '13px', color: '#94a3b8', wordBreak: 'break-word' }}>
              {selectedScope === 'general' ? 'Shown on the dedicated /faq page' : `Shown on /tools/${selectedScope} page and FAQPage schema`}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flexShrink: 0 }}>
            {/* Status Indicator */}
            {validationError && (
              <span style={{ color: '#fbbf24', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', maxWidth: '260px', wordBreak: 'break-word' }}>
                <AlertTriangle size={16} /> {validationError}
              </span>
            )}
            {!validationError && saveStatus === 'saved' && (
              <span style={{ color: '#10b981', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={16} /> Scope Saved!
              </span>
            )}
            {!validationError && saveStatus === 'error' && (
              <span style={{ color: '#f87171', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={16} /> Error saving
              </span>
            )}

            {/* Add Question Button */}
            <button
              type="button"
              onClick={handleAddItem}
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              <Plus size={15} /> Add Question
            </button>

            {/* Save Button */}
            <button
              type="button"
              disabled={savingScope}
              onClick={() => handleSave(selectedScope)}
              style={{
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: savingScope ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: savingScope ? 0.7 : 1,
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                whiteSpace: 'normal',
                wordBreak: 'break-word',
              }}
            >
              {savingScope && <RefreshCw size={14} className="animate-spin" />}
              {savingScope ? 'Saving...' : `Save "${selectedScope}" FAQs`}
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {currentItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <p style={{ margin: '0 0 12px' }}>No questions found for scope &ldquo;{selectedScope}&rdquo;.</p>
              <button
                type="button"
                onClick={handleAddItem}
                style={{
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                + Add First Question
              </button>
            </div>
          )}

          {currentItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '18px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      background: '#0f172a',
                      color: '#38bdf8',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    Q{idx + 1}
                  </span>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                    Sort: {item.sort_order || idx + 1}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Enabled Toggle */}
                  <button
                    type="button"
                    onClick={() => handleUpdateItem(idx, 'enabled', !item.enabled)}
                    style={{
                      background: item.enabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid ' + (item.enabled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'),
                      color: item.enabled ? '#10b981' : '#f87171',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {item.enabled ? <Eye size={13} /> : <EyeOff size={13} />}
                    {item.enabled ? 'Active' : 'Hidden'}
                  </button>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Delete question"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Question EN / BN */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '12px', marginBottom: '12px' }}>
                <div style={{ minWidth: 0 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                    Question (English)
                  </label>
                  <input
                    type="text"
                    value={item.question_en || ''}
                    onChange={(e) => handleUpdateItem(idx, 'question_en', e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 12px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '13.5px',
                    }}
                  />
                </div>
                <div style={{ minWidth: 0 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                    Question (বাংলা)
                  </label>
                  <input
                    type="text"
                    value={item.question_bn || ''}
                    onChange={(e) => handleUpdateItem(idx, 'question_bn', e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 12px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '13.5px',
                    }}
                  />
                </div>
              </div>

              {/* Answer EN / BN */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '12px' }}>
                <div style={{ minWidth: 0 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                    Answer (English)
                  </label>
                  <textarea
                    rows={3}
                    value={item.answer_en || ''}
                    onChange={(e) => handleUpdateItem(idx, 'answer_en', e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 12px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      resize: 'vertical',
                    }}
                  />
                </div>
                <div style={{ minWidth: 0 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                    Answer (বাংলা)
                  </label>
                  <textarea
                    rows={3}
                    value={item.answer_bn || ''}
                    onChange={(e) => handleUpdateItem(idx, 'answer_bn', e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 12px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      resize: 'vertical',
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Save Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #1f2937' }}>
          <button
            type="button"
            disabled={savingScope}
            onClick={() => handleSave(selectedScope)}
            style={{
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              padding: '9px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: savingScope ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: savingScope ? 0.7 : 1,
            }}
          >
            {savingScope && <RefreshCw size={14} className="animate-spin" />}
            {savingScope ? 'Saving...' : `Save "${selectedScope}" FAQs`}
          </button>
        </div>
      </div>
    </div>
  );
}
