'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import { siteConfig } from '@/data/config';

export default function ContactPage() {
  const { lang } = useApp();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) return;
    setSubmitted(true);
  };

  const waNumber = '8801521417284';
  const waText =
    lang === 'bn'
      ? 'আসসালামু আলাইকুম, ToolGhor ওয়েবসাইট নিয়ে যোগাযোগ করছি।'
      : 'Hello! I am contacting you regarding ToolGhor.';
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`;

  return (
    <>
      <Header />
      <main className="wrap" style={{ minHeight: '70vh', padding: '40px 16px 60px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Breadcrumb */}
          <nav className="crumb" aria-label="Breadcrumb">
            <Link href="/">{lang === 'bn' ? 'হোম' : 'Home'}</Link>
            <span className="crumb-sep" aria-hidden="true">/</span>
            <span className="crumb-current" aria-current="page">
              {lang === 'bn' ? 'যোগাযোগ' : 'Contact & Support'}
            </span>
          </nav>

          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 800, marginBottom: '12px' }}>
              {lang === 'bn' ? 'আমাদের সাথে যোগাযোগ করুন' : 'Get in Touch with ToolGhor'}
            </h1>
            <p style={{ color: 'var(--ink-2)', fontSize: '16px', maxWidth: '58ch', margin: '0 auto', lineHeight: 1.6 }}>
              {lang === 'bn'
                ? 'যেকোনো মতামত, নতুন টুলের পরামর্শ, অথবা সহায়তার জন্য সরাসরি আমাদের সাথে যোগাযোগ করতে পারেন।'
                : 'Have feedback, tool suggestions, or need assistance? Reach out to the team directly.'}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
              alignItems: 'start',
            }}
          >
            {/* Contact Channels Card */}
            <div
              style={{
                background: 'var(--paper)',
                border: '1px solid var(--line)',
                borderRadius: '16px',
                padding: '24px',
              }}
            >
              <h2 style={{ fontSize: '19px', fontWeight: 700, marginBottom: '16px' }}>
                {lang === 'bn' ? 'সরাসরি যোগাযোগ মাধ্যম' : 'Direct Channels'}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Email */}
                <a
                  href={`mailto:${siteConfig.creator?.email || 'ashifur.badhon@gmail.com'}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'var(--mist)',
                    border: '1px solid var(--line)',
                    textDecoration: 'none',
                    color: 'var(--ink)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--paddy)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--line)')}
                >
                  <span style={{ fontSize: '24px' }}>✉️</span>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px' }}>
                      {lang === 'bn' ? 'ইমেইল করুন' : 'Email Support'}
                    </strong>
                    <span style={{ fontSize: '13px', color: 'var(--ink-3)' }}>
                      {siteConfig.creator?.email || 'ashifur.badhon@gmail.com'}
                    </span>
                  </div>
                </a>

                {/* WhatsApp */}
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'rgba(37, 211, 102, 0.08)',
                    border: '1px solid rgba(37, 211, 102, 0.3)',
                    textDecoration: 'none',
                    color: 'var(--ink)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#25d366')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(37, 211, 102, 0.3)')}
                >
                  <span style={{ fontSize: '24px' }}>💬</span>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px', color: '#10b981' }}>
                      {lang === 'bn' ? 'হোয়াটসঅ্যাপ চ্যাট' : 'WhatsApp Chat'}
                    </strong>
                    <span style={{ fontSize: '13px', color: 'var(--ink-3)' }}>
                      +880 1521-417284 (Instant support)
                    </span>
                  </div>
                </a>

                {/* Social Profiles */}
                <div style={{ marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-3)', display: 'block', marginBottom: '10px' }}>
                    {lang === 'bn' ? 'সোশ্যাল প্রোফাইল' : 'Founder Profiles'}
                  </span>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <a
                      href="https://www.linkedin.com/in/ashifurrahmanbadhon"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pill"
                    >
                      LinkedIn ↗
                    </a>
                    <a
                      href="https://github.com/ashifurrahmanbadhon"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pill"
                    >
                      GitHub ↗
                    </a>
                  </div>
                </div>

                {/* Privacy Pledge */}
                <div
                  style={{
                    marginTop: '16px',
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'color-mix(in srgb, var(--paddy) 8%, var(--paper))',
                    border: '1px solid color-mix(in srgb, var(--paddy) 25%, transparent)',
                    fontSize: '12.5px',
                    color: 'var(--ink-2)',
                    lineHeight: 1.5,
                  }}
                >
                  🔒 <strong>{lang === 'bn' ? 'গোপনীয়তা প্রতিশ্রুতি:' : 'Privacy First:'}</strong>{' '}
                  {lang === 'bn'
                    ? 'ToolGhor আপনার কোনো ফাইল বা ডকুমেন্ট সার্ভারে আপলোড করে না। ১০০% প্রসেসিং হয় সরাসরি আপনার নিজস্ব ডিভাইসে।'
                    : 'ToolGhor processes 100% of your documents and images client-side. Zero data is stored.'}
                </div>
              </div>
            </div>

            {/* Quick Contact Form */}
            <div
              style={{
                background: 'var(--paper)',
                border: '1px solid var(--line)',
                borderRadius: '16px',
                padding: '24px',
              }}
            >
              <h2 style={{ fontSize: '19px', fontWeight: 700, marginBottom: '16px' }}>
                {lang === 'bn' ? 'বার্তা পাঠান' : 'Send a Message'}
              </h2>

              {submitted ? (
                <div
                  style={{
                    padding: '30px 20px',
                    textAlign: 'center',
                    background: 'color-mix(in srgb, var(--paddy) 10%, var(--paper))',
                    borderRadius: '12px',
                    border: '1px solid var(--paddy)',
                  }}
                >
                  <span style={{ fontSize: '36px', display: 'block', marginBottom: '10px' }}>✅</span>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--paddy-d)', marginBottom: '6px' }}>
                    {lang === 'bn' ? 'ধন্যবাদ! আপনার বার্তাটি পাঠানো হয়েছে।' : 'Thank you! Message sent.'}
                  </h3>
                  <p style={{ fontSize: '13.5px', color: 'var(--ink-2)' }}>
                    {lang === 'bn'
                      ? 'আমরা দ্রুত আপনার ইমেইলে যোগাযোগ করব।'
                      : 'We will get back to you via your email shortly.'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                      {lang === 'bn' ? 'আপনার নাম' : 'Your Name'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={lang === 'bn' ? 'যেমন: আসিফুর রহমান' : 'e.g. John Doe'}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--line)',
                        background: 'var(--mist)',
                        color: 'var(--ink)',
                        fontSize: '14.5px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                      {lang === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your.email@example.com"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--line)',
                        background: 'var(--mist)',
                        color: 'var(--ink)',
                        fontSize: '14.5px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                      {lang === 'bn' ? 'আপনার বার্তা বা পরামর্শ' : 'Your Message / Suggestion'}
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder={
                        lang === 'bn'
                          ? 'কী বিষয়ে জানতে চান বা নতুন কী টুল যুক্ত করতে চান…'
                          : 'Tell us how we can help or suggest a new tool…'
                      }
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--line)',
                        background: 'var(--mist)',
                        color: 'var(--ink)',
                        fontSize: '14.5px',
                        outline: 'none',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  <button type="submit" className="btn" style={{ width: '100%', padding: '12px', marginTop: '6px' }}>
                    {lang === 'bn' ? 'বার্তা পাঠান ✉️' : 'Send Message ✉️'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
