'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Check, AlertTriangle, RefreshCw, Plus, Trash2, Eye, EyeOff, BookOpen } from 'lucide-react';

interface GuideSectionData {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  steps?: string[];
  paragraphsAfter?: string[];
  cta?: { toolSlug: string; label: string } | null;
}

export interface GuideRow {
  slug: string;
  sort_order: number;
  enabled: boolean;
  category: string;
  read_minutes: number;
  title_en: string;
  title_bn: string;
  description_en: string;
  description_bn: string;
  hero_en: string;
  hero_bn: string;
  sections_en: GuideSectionData[];
  sections_bn: GuideSectionData[];
  faq_en: Array<{ q: string; a: string }>;
  faq_bn: Array<{ q: string; a: string }>;
  tool_slug?: string | null;
  tool_slug_2?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  date_published?: string | null;
}

interface GuidesEditorProps {
  guides: GuideRow[];
  setGuides: React.Dispatch<React.SetStateAction<GuideRow[]>>;
  onSaveGuide: (slug: string) => Promise<void>;
  savingGuide: Record<string, boolean>;
  guideSaveStatus: Record<string, 'saved' | 'error' | null>;
}

export default function GuidesEditor({
  guides,
  setGuides,
  onSaveGuide,
  savingGuide,
  guideSaveStatus,
}: GuidesEditorProps) {
  const [activeGuideSlug, setActiveGuideSlug] = useState<string>(guides[0]?.slug || '');

  const updateGuideField = (slug: string, field: keyof GuideRow, value: any) => {
    setGuides((prev) =>
      prev.map((g) => (g.slug === slug ? { ...g, [field]: value } : g))
    );
  };

  const currentGuide = guides.find((g) => g.slug === activeGuideSlug) || guides[0];

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
            Guides Manager ({guides.length})
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
            Every guide is stored in the <code>content_guides</code> database table. Edit titles, content, sections, and FAQs with isolated saves.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            href="/guides"
            target="_blank"
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
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
            <ExternalLink size={14} /> View /guides
          </Link>
        </div>
      </div>

      {/* Guide Selector Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '12px',
          marginBottom: '20px',
        }}
      >
        {guides.map((g, idx) => {
          const isActive = (currentGuide?.slug === g.slug);
          return (
            <button
              key={g.slug}
              type="button"
              onClick={() => setActiveGuideSlug(g.slug)}
              style={{
                background: isActive ? '#10b981' : '#1e293b',
                color: isActive ? '#ffffff' : '#94a3b8',
                border: '1px solid ' + (isActive ? '#10b981' : '#334155'),
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>#{idx + 1}</span>
              <span>{g.title_en || g.slug}</span>
              {!g.enabled && (
                <span style={{ fontSize: '11px', color: '#f87171', background: 'rgba(239, 68, 68, 0.2)', padding: '1px 6px', borderRadius: '4px' }}>
                  Off
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Current Guide Editor Card */}
      {currentGuide && (
        <div
          style={{
            background: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '16px',
            padding: '24px',
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
              marginBottom: '22px',
              paddingBottom: '16px',
              borderBottom: '1px solid #1f2937',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  background: '#1e293b',
                  color: '#38bdf8',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                Slug: {currentGuide.slug}
              </span>
              <Link
                href={`/guides/${currentGuide.slug}`}
                target="_blank"
                style={{
                  color: '#94a3b8',
                  fontSize: '13px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  textDecoration: 'none',
                }}
              >
                <ExternalLink size={13} /> View Live Article
              </Link>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Enabled Toggle */}
              <button
                type="button"
                onClick={() => updateGuideField(currentGuide.slug, 'enabled', !currentGuide.enabled)}
                style={{
                  background: currentGuide.enabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid ' + (currentGuide.enabled ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'),
                  color: currentGuide.enabled ? '#10b981' : '#f87171',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {currentGuide.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                {currentGuide.enabled ? 'Published' : 'Draft / Disabled'}
              </button>

              {/* Status Indicator */}
              {guideSaveStatus[currentGuide.slug] === 'saved' && (
                <span style={{ color: '#10b981', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={16} /> Saved!
                </span>
              )}
              {guideSaveStatus[currentGuide.slug] === 'error' && (
                <span style={{ color: '#f87171', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={16} /> Error saving
                </span>
              )}

              {/* Save Button */}
              <button
                type="button"
                disabled={Boolean(savingGuide[currentGuide.slug])}
                onClick={() => onSaveGuide(currentGuide.slug)}
                style={{
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: savingGuide[currentGuide.slug] ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: savingGuide[currentGuide.slug] ? 0.7 : 1,
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                }}
              >
                {savingGuide[currentGuide.slug] && <RefreshCw size={14} className="animate-spin" />}
                {savingGuide[currentGuide.slug] ? 'Saving...' : 'Save Guide'}
              </button>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            {/* Sort Order */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                Sort Order
              </label>
              <input
                type="number"
                value={currentGuide.sort_order || 1}
                onChange={(e) => updateGuideField(currentGuide.slug, 'sort_order', Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Read Minutes */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                Read Minutes
              </label>
              <input
                type="number"
                value={currentGuide.read_minutes || 4}
                onChange={(e) => updateGuideField(currentGuide.slug, 'read_minutes', Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Primary Tool Slug CTA */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                Primary Tool Slug (CTA)
              </label>
              <input
                type="text"
                value={currentGuide.tool_slug || ''}
                onChange={(e) => updateGuideField(currentGuide.slug, 'tool_slug', e.target.value)}
                placeholder="e.g. compress-image"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Secondary Tool Slug CTA */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                Secondary Tool Slug (CTA)
              </label>
              <input
                type="text"
                value={currentGuide.tool_slug_2 || ''}
                onChange={(e) => updateGuideField(currentGuide.slug, 'tool_slug_2', e.target.value)}
                placeholder="e.g. resize-image"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>

          {/* Titles EN / BN */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                Title (English)
              </label>
              <input
                type="text"
                value={currentGuide.title_en || ''}
                onChange={(e) => updateGuideField(currentGuide.slug, 'title_en', e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                Title (বাংলা)
              </label>
              <input
                type="text"
                value={currentGuide.title_bn || ''}
                onChange={(e) => updateGuideField(currentGuide.slug, 'title_bn', e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>

          {/* Excerpt / Description EN / BN */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                Card Description / Excerpt (English)
              </label>
              <textarea
                rows={3}
                value={currentGuide.description_en || ''}
                onChange={(e) => updateGuideField(currentGuide.slug, 'description_en', e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '13.5px',
                  resize: 'vertical',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                Card Description / Excerpt (বাংলা)
              </label>
              <textarea
                rows={3}
                value={currentGuide.description_bn || ''}
                onChange={(e) => updateGuideField(currentGuide.slug, 'description_bn', e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '13.5px',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>

          {/* Hero Intro EN / BN */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                Hero Introduction (English - separate paragraphs with blank line)
              </label>
              <textarea
                rows={4}
                value={currentGuide.hero_en || ''}
                onChange={(e) => updateGuideField(currentGuide.slug, 'hero_en', e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '13.5px',
                  resize: 'vertical',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                Hero Introduction (বাংলা - প্যারাগ্রাফগুলো ফাঁকা লাইন দিয়ে আলাদা করুন)
              </label>
              <textarea
                rows={4}
                value={currentGuide.hero_bn || ''}
                onChange={(e) => updateGuideField(currentGuide.slug, 'hero_bn', e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '13.5px',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>

          {/* Bottom Save Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #1f2937' }}>
            <button
              type="button"
              disabled={Boolean(savingGuide[currentGuide.slug])}
              onClick={() => onSaveGuide(currentGuide.slug)}
              style={{
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                padding: '9px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: savingGuide[currentGuide.slug] ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: savingGuide[currentGuide.slug] ? 0.7 : 1,
              }}
            >
              {savingGuide[currentGuide.slug] && <RefreshCw size={14} className="animate-spin" />}
              {savingGuide[currentGuide.slug] ? 'Saving...' : `Save "${currentGuide.title_en}"`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
