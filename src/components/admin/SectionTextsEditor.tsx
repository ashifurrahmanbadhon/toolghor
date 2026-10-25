'use client';

import React, { useState, useEffect } from 'react';
import { Save, Check, AlertCircle } from 'lucide-react';

export interface TextEditorField {
  key: string;
  label: string;
  valueEn: string;
  valueBn: string;
  placeholderEn?: string;
  placeholderBn?: string;
  isTextarea?: boolean;
}

interface SectionTextsEditorProps {
  title: string;
  description: string;
  badge?: string;
  fields: TextEditorField[];
  onSave: (values: Record<string, { en: string; bn: string }>) => Promise<void>;
  saving?: boolean;
  onDraftChange?: (values: Record<string, { en: string; bn: string }>) => void;
}

export default function SectionTextsEditor({
  title,
  description,
  badge = 'Section Content',
  fields,
  onSave,
  saving = false,
  onDraftChange,
}: SectionTextsEditorProps) {
  const [formState, setFormState] = useState<Record<string, { en: string; bn: string }>>({});
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  useEffect(() => {
    const init: Record<string, { en: string; bn: string }> = {};
    fields.forEach((f) => {
      init[f.key] = { en: f.valueEn || '', bn: f.valueBn || '' };
    });
    setFormState(init);
  }, [fields]);

  const handleChange = (key: string, lang: 'en' | 'bn', val: string) => {
    setFormState((prev) => {
      const next = {
        ...prev,
        [key]: {
          en: lang === 'en' ? val : prev[key]?.en || '',
          bn: lang === 'bn' ? val : prev[key]?.bn || '',
        },
      };
      if (onDraftChange) {
        onDraftChange(next);
      }
      return next;
    });
  };

  const handleSave = async () => {
    try {
      await onSave(formState);
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 4000);
    }
  };

  return (
    <div
      style={{
        background: '#111827',
        border: '1px solid #1f2937',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      }}
    >
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span
              style={{
                background: '#1e293b',
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '3px 8px',
                borderRadius: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              {badge}
            </span>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0, wordBreak: 'break-word' }}>
              {title}
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, wordBreak: 'break-word' }}>{description}</p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: status === 'saved' ? '#10b981' : '#0ea5e9',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            padding: '8px 18px',
            fontSize: '13.5px',
            fontWeight: 600,
            cursor: saving ? 'wait' : 'pointer',
            opacity: saving ? 0.7 : 1,
            transition: 'all 0.2s',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          {status === 'saved' ? (
            <>
              <Check size={16} /> Saved!
            </>
          ) : status === 'error' ? (
            <>
              <AlertCircle size={16} /> Error
            </>
          ) : (
            <>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Section'}
            </>
          )}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {fields.map((f) => {
          const current = formState[f.key] || { en: f.valueEn || '', bn: f.valueBn || '' };

          return (
            <div key={f.key}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#e2e8f0',
                  marginBottom: '8px',
                  wordBreak: 'break-word',
                }}
              >
                {f.label}
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '12px' }}>
                <div style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                    English (EN)
                  </span>
                  {f.isTextarea ? (
                    <textarea
                      rows={3}
                      value={current.en}
                      placeholder={f.placeholderEn}
                      onChange={(e) => handleChange(f.key, 'en', e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        padding: '10px 12px',
                        fontSize: '13px',
                        resize: 'vertical',
                      }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={current.en}
                      placeholder={f.placeholderEn}
                      onChange={(e) => handleChange(f.key, 'en', e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        padding: '9px 12px',
                        fontSize: '13px',
                      }}
                    />
                  )}
                </div>

                <div style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                    বাংলা (BN)
                  </span>
                  {f.isTextarea ? (
                    <textarea
                      rows={3}
                      value={current.bn}
                      placeholder={f.placeholderBn}
                      onChange={(e) => handleChange(f.key, 'bn', e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        padding: '10px 12px',
                        fontSize: '13px',
                        resize: 'vertical',
                      }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={current.bn}
                      placeholder={f.placeholderBn}
                      onChange={(e) => handleChange(f.key, 'bn', e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        padding: '9px 12px',
                        fontSize: '13px',
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
