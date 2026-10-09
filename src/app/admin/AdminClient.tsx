'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Bell,
  Layers,
  Wrench,
  User,
  MessageSquare,
  Key,
  BarChart3,
  Sliders,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  LogOut,
  X,
  Filter,
  Lock,
  Mail,
  Phone,
  KeyRound,
} from 'lucide-react';

interface HeroSection {
  is_active: boolean;
  tagline_bn: string;
  tagline_en: string;
  search_placeholder_bn: string;
  search_placeholder_en: string;
}

interface AnnouncementSection {
  is_active: boolean;
  text_bn: string;
  text_en: string;
  type: string;
}

interface CategoryRow {
  slug: string;
  is_active: boolean;
  title_bn: string;
  title_en: string;
  desc_bn: string;
  desc_en: string;
  symbol: string;
  display_order: number;
}

interface ToolRow {
  slug: string;
  category_slug: string;
  is_active: boolean;
  title_bn: string;
  title_en: string;
  desc_bn: string;
  desc_en: string;
  badge: string;
  display_order: number;
}

interface FooterSocialSection {
  is_active: boolean;
  copyright_text_bn: string;
  copyright_text_en: string;
  whatsapp_active: boolean;
  whatsapp_number: string;
  whatsapp_text_bn: string;
  whatsapp_text_en: string;
  facebook_active: boolean;
  facebook_url: string;
  linkedin_active: boolean;
  linkedin_url: string;
  github_active: boolean;
  github_url: string;
}

interface CreatorAboutSection {
  is_active: boolean;
  name: string;
  role_bn: string;
  role_en: string;
  email_active: boolean;
  email: string;
  bio_bn: string;
  bio_en: string;
  social_active: boolean;
  facebook_url: string;
  linkedin_url: string;
  github_url: string;
}

interface ApiKeysSection {
  is_active: boolean;
  gemini_active: boolean;
  gemini_key: string;
  convertapi_active: boolean;
  convertapi_token: string;
  removebg_active: boolean;
  removebg_key: string;
  openai_active: boolean;
  openai_key: string;
}

type MenuTab =
  | 'overview'
  | 'hero'
  | 'announcement'
  | 'categories'
  | 'tools'
  | 'footer'
  | 'creator'
  | 'apis'
  | 'analytics'
  | 'profile';

export default function AdminConsole() {
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Admin Profile & Security State
  const [adminProfile, setAdminProfile] = useState({
    username: 'admin',
    email: 'ashifur.badhon@gmail.com',
    phone: '+8801521417284',
  });
  const [profilePassCurrent, setProfilePassCurrent] = useState('');
  const [profilePassNew, setProfilePassNew] = useState('');
  const [profilePassConfirm, setProfilePassConfirm] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Forgot Password Modal State (3-Step Flow: Channel Selection -> Code Input -> Password Creation)
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<'channel' | 'enter_code' | 'set_password'>('channel');
  const [forgotChannel, setForgotChannel] = useState<'email' | 'phone'>('email');
  const [forgotTargetMasked, setForgotTargetMasked] = useState<string>('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Active Menu Tab (Sidebar Navigation)
  const [activeTab, setActiveTab] = useState<MenuTab>('overview');

  // Loading & Database Status
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Sections State (backed by isolated PostgreSQL tables)
  const [hero, setHero] = useState<HeroSection>({
    is_active: true,
    tagline_bn: 'দৈনন্দিন কাজের সব টুল, এখন এক প্ল্যাটফর্মে',
    tagline_en: 'Everyday tools, now on one platform',
    search_placeholder_bn: 'কী দরকার? যেমন: পিডিএফ, ছবি, কিউআর, বয়স…',
    search_placeholder_en: 'What do you need? e.g. PDF, image, QR, age…',
  });

  const [announcement, setAnnouncement] = useState<AnnouncementSection>({
    is_active: false,
    text_bn: '📢 স্বাগতম ToolGhor-এ! ২৮+ দরকারি অনলাইন টুল ব্রাউজারে সম্পূর্ণ বিনামূল্যে ব্যবহার করুন।',
    text_en: '📢 Welcome to ToolGhor! 28+ fast & secure web tools right inside your browser.',
    type: 'info',
  });

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [tools, setTools] = useState<ToolRow[]>([]);

  const [footerSocial, setFooterSocial] = useState<FooterSocialSection>({
    is_active: true,
    copyright_text_bn: 'আপনার ফাইল ও তথ্য সরাসরি আপনার ব্রাউজারেই প্রসেস করা হয়।',
    copyright_text_en: 'Your files and data are processed in your browser.',
    whatsapp_active: true,
    whatsapp_number: '8801521417284',
    whatsapp_text_bn: 'আসসালামু আলাইকুম, ToolGhor নিয়ে কিছু জানতে চাই।',
    whatsapp_text_en: 'Hello, I am contacting you from your ToolGhor website.',
    facebook_active: true,
    facebook_url: 'https://www.facebook.com/ashifurrahmanbadhon',
    linkedin_active: true,
    linkedin_url: 'https://www.linkedin.com/in/ashifurrahmanbadhon',
    github_active: true,
    github_url: 'https://github.com/ashifurrahmanbadhon',
  });

  const [creatorAbout, setCreatorAbout] = useState<CreatorAboutSection>({
    is_active: true,
    name: 'Ashifur Rahman',
    role_bn: 'প্রতিষ্ঠাতা ও নির্মাতা, ToolGhor',
    role_en: 'Founder & Creator, ToolGhor',
    email_active: true,
    email: 'ashifur.badhon@gmail.com',
    bio_bn: 'দৈনন্দিন জীবনের সব ডিজিটাল টুলকে সহজ, দ্রুত ও শতভাগ নিরাপদ করার লক্ষ্য নিয়ে কাজ করছি।',
    bio_en: 'Dedicated to making everyday digital tools fast, simple, and 100% private directly in the browser.',
    social_active: true,
    facebook_url: 'https://www.facebook.com/ashifurrahmanbadhon',
    linkedin_url: 'https://www.linkedin.com/in/ashifurrahmanbadhon',
    github_url: 'https://github.com/ashifurrahmanbadhon',
  });

  const [apiKeys, setApiKeys] = useState<ApiKeysSection>({
    is_active: true,
    gemini_active: true,
    gemini_key: '',
    convertapi_active: true,
    convertapi_token: '',
    removebg_active: true,
    removebg_key: '',
    openai_active: true,
    openai_key: '',
  });

  const [analytics, setAnalytics] = useState<Record<string, number>>({});

  // Tool Filters & Search
  const [toolSearch, setToolSearch] = useState('');
  const [toolCatFilter, setToolCatFilter] = useState('all');
  const [toolStatusFilter, setToolStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal Dialogs for Edit / Delete / Create
  const [toolModal, setToolModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    data: Partial<ToolRow>;
  }>({
    isOpen: false,
    mode: 'create',
    data: {},
  });

  const [categoryModal, setCategoryModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    data: Partial<CategoryRow>;
  }>({
    isOpen: false,
    mode: 'create',
    data: {},
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'tool' | 'category';
    slug: string;
    title: string;
  } | null>(null);

  // API Key Visibility Toggles
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  const showNotification = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3500);
  };

  // Fetch all database tables
  const fetchAllSections = async () => {
    try {
      setLoadingData(true);
      const res = await fetch('/api/admin/data');
      if (res.ok) {
        const data = await res.json();
        setDbConnected(data.dbConnected);
        if (data.sections) {
          if (data.sections.hero) setHero(data.sections.hero);
          if (data.sections.announcement) setAnnouncement(data.sections.announcement);
          if (data.sections.categories) setCategories(data.sections.categories);
          if (data.sections.tools) setTools(data.sections.tools);
          if (data.sections.footerSocial) setFooterSocial(data.sections.footerSocial);
          if (data.sections.creatorAbout) setCreatorAbout(data.sections.creatorAbout);
          if (data.sections.apiKeys) setApiKeys(data.sections.apiKeys);
        }
        if (data.analytics) setAnalytics(data.analytics);
      } else {
        setDbConnected(false);
      }
      // Also fetch admin profile
      try {
        const pRes = await fetch('/api/admin/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_profile' }),
        });
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData.success && pData.profile) {
            setAdminProfile(pData.profile);
          }
        }
      } catch {}
    } catch {
      setDbConnected(false);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    try {
      const isAuth = sessionStorage.getItem('toolghor_admin_auth');
      if (isAuth === 'true') {
        setIsAuthenticated(true);
        fetchAllSections();
      }
    } catch {}
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cleanPin = pin.trim();
    if (!cleanPin) {
      setPinError(true);
      return;
    }
    setLoginLoading(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', passcode: cleanPin }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        try {
          sessionStorage.setItem('toolghor_admin_auth', 'true');
        } catch {}
        setIsAuthenticated(true);
        setPinError(false);
        if (data.admin) {
          setAdminProfile((prev) => ({ ...prev, ...data.admin }));
        }
        fetchAllSections();
      } else {
        setPinError(true);
      }
    } catch {
      setPinError(true);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    if (profilePassNew && profilePassNew !== profilePassConfirm) {
      setProfileMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (profilePassNew && profilePassNew.length < 4) {
      setProfileMsg({ type: 'error', text: 'New password must be at least 4 characters.' });
      return;
    }
    if (!profilePassCurrent) {
      setProfileMsg({ type: 'error', text: 'Please enter your current password to save changes.' });
      return;
    }
    setProfileSaving(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          email: adminProfile.email,
          phone: adminProfile.phone,
          current_passcode: profilePassCurrent,
          new_passcode: profilePassNew,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProfileMsg({ type: 'success', text: 'Profile & credentials updated successfully in database!' });
        showNotification('Profile updated in database!');
        setProfilePassCurrent('');
        setProfilePassNew('');
        setProfilePassConfirm('');
      } else {
        setProfileMsg({ type: 'error', text: data.message || 'Failed to update profile.' });
      }
    } catch {
      setProfileMsg({ type: 'error', text: 'Network error updating profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSendForgotOtp = async () => {
    setForgotLoading(true);
    setForgotMsg(null);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'forgot_password_send_otp',
          channel: forgotChannel,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setForgotTargetMasked(data.targetMasked || '');
        setForgotOtp('');
        setForgotStep('enter_code');
        setForgotMsg({ type: 'success', text: data.message });
      } else {
        setForgotMsg({ type: 'error', text: data.message || 'Failed to send verification code.' });
      }
    } catch {
      setForgotMsg({ type: 'error', text: 'Network error sending verification code.' });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyCodeOnly = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg(null);
    const cleanOtp = forgotOtp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setForgotMsg({ type: 'error', text: 'Please enter the 6-digit verification code.' });
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_otp',
          otp: cleanOtp,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setForgotMsg({ type: 'success', text: 'Code verified! Now set your new password.' });
        setForgotStep('set_password');
      } else {
        setForgotMsg({ type: 'error', text: data.message || 'Invalid or expired verification code.' });
      }
    } catch {
      setForgotMsg({ type: 'error', text: 'Network error verifying code.' });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSetNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg(null);
    if (!forgotNewPass || forgotNewPass.length < 4) {
      setForgotMsg({ type: 'error', text: 'New password must be at least 4 characters.' });
      return;
    }
    if (forgotNewPass !== forgotConfirmPass) {
      setForgotMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_password_verify_otp',
          otp: forgotOtp.trim(),
          new_passcode: forgotNewPass.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Password has been successfully updated! You can now log in.');
        setShowForgotModal(false);
        setPin(forgotNewPass);
        setForgotStep('channel');
        setForgotOtp('');
        setForgotNewPass('');
        setForgotConfirmPass('');
        setForgotMsg(null);
      } else {
        setForgotMsg({ type: 'error', text: data.message || 'Password update failed.' });
      }
    } catch {
      setForgotMsg({ type: 'error', text: 'Network error setting new password.' });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem('toolghor_admin_auth');
    } catch {}
  };

  // Generic POST caller
  const postApi = async (action: string, payload: any, successMessage: string) => {
    try {
      const res = await fetch('/api/admin/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      });
      if (res.ok) {
        showNotification(successMessage);
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // 1. Hero Section Updates
  const saveHero = async (updatedHero: HeroSection) => {
    setHero(updatedHero);
    await postApi('update_hero', updatedHero, 'Hero Section updated successfully!');
  };

  // 2. Announcement Section Updates
  const saveAnnouncement = async (updatedAnnouncement: AnnouncementSection) => {
    setAnnouncement(updatedAnnouncement);
    await postApi('update_announcement', updatedAnnouncement, 'Announcement updated successfully!');
  };

  // 3. Category Operations
  const toggleCategoryActive = async (slug: string, current: boolean) => {
    const updated = !current;
    setCategories((prev) => prev.map((c) => (c.slug === slug ? { ...c, is_active: updated } : c)));
    await postApi('update_category', { slug, is_active: updated }, `Category status updated!`);
  };

  const handleSaveCategoryModal = async () => {
    if (!categoryModal.data.slug || !categoryModal.data.title_en) {
      alert('Please provide Category Slug and English Title');
      return;
    }
    const action = categoryModal.mode === 'create' ? 'create_category' : 'update_category';
    const payload = categoryModal.data;
    const ok = await postApi(action, payload, `Category ${payload.slug} saved!`);
    if (ok) {
      setCategoryModal({ isOpen: false, mode: 'create', data: {} });
      fetchAllSections();
    }
  };

  const handleDeleteCategory = async (slug: string) => {
    const ok = await postApi('delete_category', { slug }, `Category ${slug} deleted!`);
    if (ok) {
      setCategories((prev) => prev.filter((c) => c.slug !== slug));
      setDeleteConfirm(null);
    }
  };

  // 4. Tool Operations
  const toggleToolActive = async (slug: string, current: boolean) => {
    const updated = !current;
    setTools((prev) => prev.map((t) => (t.slug === slug ? { ...t, is_active: updated } : t)));
    await postApi('update_tool', { slug, is_active: updated }, `Tool status updated!`);
  };

  const handleSaveToolModal = async () => {
    if (!toolModal.data.slug || !toolModal.data.title_en) {
      alert('Please provide Tool Slug and English Title');
      return;
    }
    const action = toolModal.mode === 'create' ? 'create_tool' : 'update_tool';
    const payload = toolModal.data;
    const ok = await postApi(action, payload, `Tool ${payload.slug} saved successfully!`);
    if (ok) {
      setToolModal({ isOpen: false, mode: 'create', data: {} });
      fetchAllSections();
    }
  };

  const handleDeleteTool = async (slug: string) => {
    const ok = await postApi('delete_tool', { slug }, `Tool ${slug} deleted successfully!`);
    if (ok) {
      setTools((prev) => prev.filter((t) => t.slug !== slug));
      setDeleteConfirm(null);
    }
  };

  // 5. Footer & Social Updates
  const saveFooterSocial = async (updated: FooterSocialSection) => {
    setFooterSocial(updated);
    await postApi('update_footer_social', updated, 'Footer & Social links saved!');
  };

  // 6. Creator & About Updates
  const saveCreatorAbout = async (updated: CreatorAboutSection) => {
    setCreatorAbout(updated);
    await postApi('update_creator_about', updated, 'Creator Profile saved!');
  };

  // 7. API Keys Updates
  const saveApiKeys = async (updated: ApiKeysSection) => {
    setApiKeys(updated);
    await postApi('update_api_keys', updated, 'API Credentials saved!');
  };

  // Tool Filter Logic
  const filteredTools = (tools || []).filter((t) => {
    if (!t) return false;
    const matchesCat = toolCatFilter === 'all' || t.category_slug === toolCatFilter;
    const titleEn = (t.title_en || '').toLowerCase();
    const titleBn = (t.title_bn || '').toLowerCase();
    const slug = (t.slug || '').toLowerCase();
    const search = (toolSearch || '').toLowerCase().trim();
    const matchesSearch = !search || titleEn.includes(search) || slug.includes(search) || titleBn.includes(search);
    const matchesStatus =
      toolStatusFilter === 'all' ||
      (toolStatusFilter === 'active' && t.is_active) ||
      (toolStatusFilter === 'inactive' && !t.is_active);
    return matchesCat && matchesSearch && matchesStatus;
  });

  const activeToolsCount = (tools || []).filter((t) => t.is_active).length;
  const activeCategoriesCount = (categories || []).filter((c) => c.is_active).length;

  // SSR Hydration Guard
  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0d14', display: 'grid', placeItems: 'center', padding: '16px', color: '#94a3b8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <RefreshCw size={20} className="animate-spin" />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Loading Admin Console...</span>
        </div>
      </div>
    );
  }

  // ================= LOGIN SCREEN (100% ENGLISH) =================
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0d14', display: 'grid', placeItems: 'center', padding: '16px', color: '#f1f5f9' }}>
        <div
          style={{
            background: '#131824',
            border: '1px solid #1e293b',
            borderRadius: '20px',
            padding: '40px 32px',
            width: '100%',
            maxWidth: '420px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 8px 20px rgba(16,185,129,0.3)',
            }}
          >
            <Shield size={28} />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em', color: '#f8fafc' }}>
            ToolGhor Admin Console
          </h1>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: '0 0 24px', lineHeight: 1.5 }}>
            Enter your admin passcode to access the central management console.
          </p>

          <form action="#" onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Enter passcode..."
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: pinError ? '1.5px solid #ef4444' : '1.5px solid #334155',
                background: '#0b0f19',
                color: '#f8fafc',
                fontSize: '15px',
                marginBottom: '14px',
                outline: 'none',
              }}
            />
            {pinError && (
              <p style={{ color: '#ef4444', fontSize: '12.5px', margin: '-6px 0 12px', textAlign: 'left' }}>
                Incorrect passcode. Please try again or use Forgot Password.
              </p>
            )}
            <button
              type="submit"
              disabled={loginLoading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: '#10b981',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '15px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {loginLoading ? 'Checking Credentials...' : 'Sign In to Admin'}
            </button>
          </form>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setShowForgotModal(true);
                setForgotStep('channel');
                setForgotMsg(null);
                setForgotOtp('');
                setForgotTargetMasked('');
                setForgotNewPass('');
                setForgotConfirmPass('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#10b981',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '4px',
              }}
            >
              Forgot Password?
            </button>
          </div>

          <div style={{ marginTop: '20px' }}>
            <Link
              href="/"
              style={{
                fontSize: '13px',
                color: '#94a3b8',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ArrowLeft size={14} /> Back to Live Website
            </Link>
          </div>
        </div>

        {/* FORGOT PASSWORD MODAL */}
        {showForgotModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(6px)',
              zIndex: 1000,
              display: 'grid',
              placeItems: 'center',
              padding: '16px',
            }}
          >
            <div
              style={{
                background: '#131824',
                border: '1px solid #1e293b',
                borderRadius: '20px',
                padding: '32px 28px',
                width: '100%',
                maxWidth: '440px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
                position: 'relative',
              }}
            >
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                style={{
                  position: 'absolute',
                  top: '18px',
                  right: '18px',
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                <X size={20} />
              </button>

              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '14px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    display: 'grid',
                    placeItems: 'center',
                    margin: '0 auto 14px',
                  }}
                >
                  <KeyRound size={26} />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px', color: '#f8fafc' }}>
                  {forgotStep === 'channel' && 'Reset Admin Password'}
                  {forgotStep === 'enter_code' && 'Enter Verification Code'}
                  {forgotStep === 'set_password' && 'Create New Password'}
                </h2>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                  {forgotStep === 'channel' && 'Choose whether to receive the 6-digit code via Gmail or Phone.'}
                  {forgotStep === 'enter_code' && 'Enter the 6-digit verification code sent to your account.'}
                  {forgotStep === 'set_password' && 'Enter and confirm your new password to complete the reset.'}
                </p>
              </div>

              {forgotMsg && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    marginBottom: '16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    background: forgotMsg.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: forgotMsg.type === 'success' ? '#34d399' : '#f87171',
                    border: `1px solid ${forgotMsg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  }}
                >
                  {forgotMsg.text}
                </div>
              )}

              {/* 3-Step Progress Indicators */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                <div
                  style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: forgotStep === 'channel' ? '#10b981' : 'rgba(16, 185, 129, 0.2)',
                    color: forgotStep === 'channel' ? '#ffffff' : '#34d399',
                  }}
                >
                  1. Method
                </div>
                <div style={{ width: '12px', height: '1px', background: '#334155' }} />
                <div
                  style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background:
                      forgotStep === 'enter_code'
                        ? '#10b981'
                        : forgotStep === 'set_password'
                        ? 'rgba(16, 185, 129, 0.2)'
                        : '#1e293b',
                    color:
                      forgotStep === 'enter_code'
                        ? '#ffffff'
                        : forgotStep === 'set_password'
                        ? '#34d399'
                        : '#94a3b8',
                  }}
                >
                  2. Verify Code
                </div>
                <div style={{ width: '12px', height: '1px', background: '#334155' }} />
                <div
                  style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: forgotStep === 'set_password' ? '#10b981' : '#1e293b',
                    color: forgotStep === 'set_password' ? '#ffffff' : '#94a3b8',
                  }}
                >
                  3. New Password
                </div>
              </div>

              {/* STEP 1: SELECT CHANNEL */}
              {forgotStep === 'channel' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px',
                      borderRadius: '12px',
                      border: forgotChannel === 'email' ? '1.5px solid #10b981' : '1px solid #334155',
                      background: forgotChannel === 'email' ? 'rgba(16,185,129,0.08)' : '#0b0f19',
                      cursor: 'pointer',
                    }}
                    onClick={() => setForgotChannel('email')}
                  >
                    <input
                      type="radio"
                      name="channel"
                      checked={forgotChannel === 'email'}
                      onChange={() => setForgotChannel('email')}
                      style={{ accentColor: '#10b981' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={16} color="#10b981" /> Send to Gmail
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>
                        {adminProfile.email ? adminProfile.email.replace(/^(.{2})(.*)(@.*)$/, '$1***$3') : 'ashifur.badhon@gmail.com'}
                      </div>
                    </div>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px',
                      borderRadius: '12px',
                      border: forgotChannel === 'phone' ? '1.5px solid #10b981' : '1px solid #334155',
                      background: forgotChannel === 'phone' ? 'rgba(16,185,129,0.08)' : '#0b0f19',
                      cursor: 'pointer',
                    }}
                    onClick={() => setForgotChannel('phone')}
                  >
                    <input
                      type="radio"
                      name="channel"
                      checked={forgotChannel === 'phone'}
                      onChange={() => setForgotChannel('phone')}
                      style={{ accentColor: '#10b981' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={16} color="#10b981" /> Send to Phone / SMS
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>
                        {adminProfile.phone ? adminProfile.phone.slice(0, 4) + '******' + adminProfile.phone.slice(-2) : '+8801521417284'}
                      </div>
                    </div>
                  </label>

                  <button
                    type="button"
                    onClick={handleSendForgotOtp}
                    disabled={forgotLoading}
                    style={{
                      marginTop: '8px',
                      width: '100%',
                      padding: '13px',
                      borderRadius: '12px',
                      background: '#10b981',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '14px',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {forgotLoading ? 'Sending Verification Code...' : 'Send Verification Code'}
                  </button>
                </div>
              )}

              {/* STEP 2: ENTER CODE ONLY (PASSWORD INPUTS ARE HIDDEN) */}
              {forgotStep === 'enter_code' && (
                <form onSubmit={handleVerifyCodeOnly} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div
                    style={{
                      background: '#0b0f19',
                      border: '1px solid #1e293b',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '2px' }}>
                      Verification code sent to {forgotChannel === 'phone' ? 'Phone' : 'Gmail'}:
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>
                      {forgotTargetMasked || (forgotChannel === 'phone' ? adminProfile.phone : adminProfile.email)}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#e2e8f0', textAlign: 'center' }}>
                      Enter 6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoFocus
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '12px',
                        background: '#0b0f19',
                        border: '1.5px solid #10b981',
                        color: '#f8fafc',
                        fontSize: '24px',
                        letterSpacing: '8px',
                        textAlign: 'center',
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        outline: 'none',
                      }}
                    />
                    <div style={{ fontSize: '11.5px', color: '#94a3b8', textAlign: 'center', marginTop: '6px' }}>
                      Please check your inbox/messages and enter the 6-digit code.
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotStep('channel');
                        setForgotMsg(null);
                      }}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '12px',
                        background: '#1f2937',
                        color: '#e2e8f0',
                        fontWeight: 600,
                        fontSize: '13.5px',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading || forgotOtp.trim().length !== 6}
                      style={{
                        flex: 2,
                        padding: '12px',
                        borderRadius: '12px',
                        background: forgotOtp.trim().length === 6 ? '#10b981' : '#334155',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '13.5px',
                        border: 'none',
                        cursor: forgotOtp.trim().length === 6 ? 'pointer' : 'not-allowed',
                        transition: 'background 0.2s',
                      }}
                    >
                      {forgotLoading ? 'Verifying...' : 'Verify Code'}
                    </button>
                  </div>

                  <div style={{ textAlign: 'center', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={handleSendForgotOtp}
                      disabled={forgotLoading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#38bdf8',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      Didn&apos;t receive code? Resend
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: SET NEW PASSWORD (REVEALED ONLY AFTER CODE IS VERIFIED) */}
              {forgotStep === 'set_password' && (
                <form onSubmit={handleSetNewPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div
                    style={{
                      background: 'rgba(16,185,129,0.1)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      fontSize: '12.5px',
                      color: '#34d399',
                      fontWeight: 600,
                      textAlign: 'center',
                    }}
                  >
                    ✓ Code verified successfully! Create your new password now.
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                      New Admin Password
                    </label>
                    <input
                      type="password"
                      autoFocus
                      placeholder="At least 4 characters..."
                      value={forgotNewPass}
                      onChange={(e) => setForgotNewPass(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: '#0b0f19',
                        border: '1px solid #334155',
                        color: '#f8fafc',
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Re-enter new password..."
                      value={forgotConfirmPass}
                      onChange={(e) => setForgotConfirmPass(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: '#0b0f19',
                        border: '1px solid #334155',
                        color: '#f8fafc',
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '12px',
                        background: '#1f2937',
                        color: '#e2e8f0',
                        fontWeight: 600,
                        fontSize: '13.5px',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading || !forgotNewPass}
                      style={{
                        flex: 2,
                        padding: '12px',
                        borderRadius: '12px',
                        background: '#10b981',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '13.5px',
                        border: 'none',
                        cursor: forgotLoading || !forgotNewPass ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {forgotLoading ? 'Updating Password...' : 'Save New Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================= MAIN ADMIN CONSOLE (SIDEBAR + WIDE RIGHT PANEL) =================
  return (
    <div style={{ minHeight: '100vh', background: '#0b0f19', color: '#e2e8f0', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar */}
      <header
        style={{
          height: '64px',
          background: '#111827',
          borderBottom: '1px solid #1f2937',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <picture>
              <source type="image/webp" data-cfg="logoDarkWebp" srcSet="/assets/logo-dark.webp" media="(prefers-color-scheme: dark)" />
              <source data-cfg="logoDark" srcSet="/assets/logo-dark.png" media="(prefers-color-scheme: dark)" />
              <img src="/assets/logo.png" alt="ToolGhor" style={{ height: '32px', width: 'auto' }} />
            </picture>
          </Link>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.05em',
              padding: '3px 8px',
              borderRadius: '6px',
              background: '#10b981',
              color: '#ffffff',
            }}
          >
            ADMIN CONSOLE
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Cloud Database Live Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              padding: '5px 12px',
              borderRadius: '999px',
              background: dbConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: dbConnected ? '#34d399' : '#f87171',
              border: `1px solid ${dbConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: dbConnected ? '#10b981' : '#ef4444',
              }}
            />
            <span>{dbConnected ? 'Neon Cloud DB Connected' : 'Database Disconnected'}</span>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchAllSections}
            disabled={loadingData}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#1f2937',
              color: '#e2e8f0',
              border: '1px solid #374151',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={loadingData ? 'animate-spin' : ''} />
            <span>{loadingData ? 'Syncing...' : 'Sync Data'}</span>
          </button>

          {/* View Website Link */}
          <Link
            href="/"
            target="_blank"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <ExternalLink size={14} />
            <span>Live Site</span>
          </Link>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              color: '#94a3b8',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Save Notification Toast */}
      {saveToast && (
        <div
          style={{
            position: 'fixed',
            top: '76px',
            right: '24px',
            zIndex: 1000,
            background: '#10b981',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: 700,
          }}
        >
          <CheckCircle2 size={18} />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Main Workspace: Left Sidebar + Large Right Screen */}
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 64px)' }}>
        {/* ================= LEFT SIDEBAR ================= */}
        <aside
          style={{
            width: '270px',
            minWidth: '270px',
            background: '#111827',
            borderRight: '1px solid #1f2937',
            padding: '20px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ padding: '0 10px 14px', borderBottom: '1px solid #1f2937', marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', fontWeight: 700 }}>
                Navigation Menu
              </span>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { id: 'overview', label: 'Dashboard Overview', icon: BarChart3 },
                { id: 'hero', label: 'Hero Section', icon: Sliders },
                { id: 'announcement', label: 'Announcement Banner', icon: Bell },
                { id: 'categories', label: 'Categories Manager', icon: Layers, badge: categories.length },
                { id: 'tools', label: 'Tools Manager', icon: Wrench, badge: tools.length },
                { id: 'footer', label: 'Footer & WhatsApp', icon: MessageSquare },
                { id: 'creator', label: 'Creator Profile', icon: User },
                { id: 'apis', label: 'API Integrations', icon: Key },
                { id: 'analytics', label: 'Usage Analytics', icon: BarChart3 },
                { id: 'profile', label: 'Admin Profile & Security', icon: Shield },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id as MenuTab)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '11px 14px',
                      borderRadius: '10px',
                      border: 'none',
                      background: isActive ? '#10b981' : 'transparent',
                      color: isActive ? '#ffffff' : '#94a3b8',
                      fontSize: '13.5px',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Icon size={17} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '999px',
                          background: isActive ? 'rgba(255,255,255,0.25)' : '#1f2937',
                          color: isActive ? '#ffffff' : '#64748b',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer System Info */}
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '14px',
              fontSize: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#64748b' }}>Active Tools:</span>
              <strong style={{ color: '#10b981' }}>{activeToolsCount} / {tools.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#64748b' }}>Categories:</span>
              <strong style={{ color: '#38bdf8' }}>{activeCategoriesCount} / {categories.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Database:</span>
              <strong style={{ color: dbConnected ? '#10b981' : '#ef4444' }}>
                {dbConnected ? 'Online (Neon)' : 'Offline'}
              </strong>
            </div>
          </div>
        </aside>

        {/* ================= RIGHT MAIN SCREEN ================= */}
        <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 6px', color: '#f8fafc', letterSpacing: '-0.02em' }}>
                  Platform Overview
                </h1>
                <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
                  Real-time synchronization status across isolated database tables, active platform tools, and visitors launch analytics.
                </p>
              </div>

              {/* Stat Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '32px' }}>
                {/* Total Tool Launches */}
                <div style={{ background: '#111827', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '16px', padding: '22px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
                  <span style={{ fontSize: '12.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Launches</span>
                  <div style={{ fontSize: '36px', fontWeight: 900, color: '#10b981', margin: '6px 0 2px', letterSpacing: '-0.02em' }}>
                    {Object.values(analytics).reduce((a, b) => a + Number(b || 0), 0).toLocaleString()}
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Live usage hits recorded</span>
                </div>

                {/* Active Tools */}
                <div style={{ background: '#111827', border: '1px solid rgba(56,189,248,0.25)', borderRadius: '16px', padding: '22px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #38bdf8, #60a5fa)' }} />
                  <span style={{ fontSize: '12.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Tools</span>
                  <div style={{ fontSize: '36px', fontWeight: 900, color: '#38bdf8', margin: '6px 0 2px', letterSpacing: '-0.02em' }}>
                    {activeToolsCount} <span style={{ fontSize: '18px', color: '#64748b', fontWeight: 600 }}>/ {tools.length}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Enabled across {categories.length} categories</span>
                </div>

                {/* Active Categories */}
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '22px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                  <span style={{ fontSize: '12.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Categories</span>
                  <div style={{ fontSize: '36px', fontWeight: 900, color: '#a855f7', margin: '6px 0 2px', letterSpacing: '-0.02em' }}>
                    {activeCategoriesCount} <span style={{ fontSize: '18px', color: '#64748b', fontWeight: 600 }}>/ {categories.length}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Homepage accordion groups</span>
                </div>

                {/* Active API Integrations */}
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '22px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                  <span style={{ fontSize: '12.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cloud APIs</span>
                  <div style={{ fontSize: '36px', fontWeight: 900, color: '#f59e0b', margin: '6px 0 2px', letterSpacing: '-0.02em' }}>
                    {[apiKeys.gemini_active, apiKeys.convertapi_active, apiKeys.removebg_active, apiKeys.openai_active].filter(Boolean).length} <span style={{ fontSize: '18px', color: '#64748b', fontWeight: 600 }}>/ 4</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Gemini, ConvertAPI, Remove.bg, OpenAI</span>
                </div>

                {/* Database Connection */}
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '22px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                  <span style={{ fontSize: '12.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Postgres Engine</span>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: dbConnected ? '#10b981' : '#ef4444', margin: '12px 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: dbConnected ? '#10b981' : '#ef4444' }} />
                    {dbConnected ? 'Neon Cloud (Live)' : 'Disconnected'}
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Fast query latency (&lt;250ms)</span>
                </div>

                {/* Notice Banner Status */}
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '22px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                  <span style={{ fontSize: '12.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notice Banner</span>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: announcement.is_active ? '#f59e0b' : '#64748b', margin: '12px 0 4px' }}>
                    {announcement.is_active ? '⚡ Live on Site' : '⚪ Disabled'}
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Top header announcement</span>
                </div>
              </div>

              {/* Quick Actions Shortcuts */}
              <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px', marginBottom: '28px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px', color: '#f8fafc' }}>
                  Management Navigation
                </h2>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setActiveTab('tools')}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '10px',
                      background: '#1f2937',
                      color: '#f8fafc',
                      border: '1px solid #374151',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background 0.2s',
                    }}
                  >
                    <Wrench size={16} /> Manage Tools ({tools.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('categories')}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '10px',
                      background: '#1f2937',
                      color: '#f8fafc',
                      border: '1px solid #374151',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Layers size={16} /> Manage Categories ({categories.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '10px',
                      background: '#1f2937',
                      color: '#f8fafc',
                      border: '1px solid #374151',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <BarChart3 size={16} /> Usage Analytics
                  </button>
                  <button
                    onClick={() => setActiveTab('announcement')}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '10px',
                      background: '#1f2937',
                      color: '#f8fafc',
                      border: '1px solid #374151',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Bell size={16} /> Notice Banner
                  </button>
                  <button
                    onClick={() => setActiveTab('apis')}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '10px',
                      background: '#1f2937',
                      color: '#f8fafc',
                      border: '1px solid #374151',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Key size={16} /> API Credentials
                  </button>
                </div>
              </div>

              {/* Top 5 Most Launched Tools Quick List */}
              <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                    Top Tools by Popularity
                  </h2>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#10b981',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    View All Analytics →
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {tools
                    .map((t) => ({ ...t, count: Number(analytics[t.slug] || 0) }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5)
                    .map((t, idx) => (
                      <div
                        key={t.slug}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          background: '#0b0f19',
                          border: '1px solid #1f2937',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : '#64748b' }}>
                            #{idx + 1}
                          </span>
                          <div>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>{t.title_en}</span>
                            <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>/{t.slug}</span>
                          </div>
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#10b981' }}>
                          {t.count.toLocaleString()} launches
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HERO SECTION */}
          {activeTab === 'hero' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: '#f8fafc' }}>
                    Hero Section Manager
                  </h1>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
                    Configure the main website header tagline, search box placeholders, and visibility.
                  </p>
                </div>
                {/* Active / Inactive Toggle Switch */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: hero.is_active ? '#10b981' : '#64748b' }}>
                    {hero.is_active ? 'Section Active' : 'Section Inactive'}
                  </span>
                  <button
                    type="button"
                    onClick={() => saveHero({ ...hero, is_active: !hero.is_active })}
                    style={{
                      width: '52px',
                      height: '28px',
                      borderRadius: '999px',
                      background: hero.is_active ? '#10b981' : '#334155',
                      border: 'none',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        position: 'absolute',
                        top: '3px',
                        left: hero.is_active ? '27px' : '3px',
                        transition: 'left 0.2s',
                      }}
                    />
                  </button>
                </div>
              </div>

              <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '28px' }}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveHero(hero);
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                      English Tagline
                    </label>
                    <input
                      type="text"
                      value={hero.tagline_en}
                      onChange={(e) => setHero({ ...hero, tagline_en: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: '#0b0f19',
                        border: '1px solid #334155',
                        color: '#f8fafc',
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                      Bengali Tagline
                    </label>
                    <input
                      type="text"
                      value={hero.tagline_bn}
                      onChange={(e) => setHero({ ...hero, tagline_bn: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: '#0b0f19',
                        border: '1px solid #334155',
                        color: '#f8fafc',
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                      English Search Placeholder
                    </label>
                    <input
                      type="text"
                      value={hero.search_placeholder_en}
                      onChange={(e) => setHero({ ...hero, search_placeholder_en: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: '#0b0f19',
                        border: '1px solid #334155',
                        color: '#f8fafc',
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                      Bengali Search Placeholder
                    </label>
                    <input
                      type="text"
                      value={hero.search_placeholder_bn}
                      onChange={(e) => setHero({ ...hero, search_placeholder_bn: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: '#0b0f19',
                        border: '1px solid #334155',
                        color: '#f8fafc',
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <button
                      type="submit"
                      style={{
                        padding: '12px 24px',
                        borderRadius: '10px',
                        background: '#10b981',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '14px',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Save Hero Settings
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: ANNOUNCEMENT BANNER */}
          {activeTab === 'announcement' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: '#f8fafc' }}>
                    Announcement Banner
                  </h1>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
                    Show a top notification banner across the website for important notices or announcements.
                  </p>
                </div>
                {/* Active / Inactive Toggle Switch */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: announcement.is_active ? '#10b981' : '#64748b' }}>
                    {announcement.is_active ? 'Banner Active' : 'Banner Inactive'}
                  </span>
                  <button
                    type="button"
                    onClick={() => saveAnnouncement({ ...announcement, is_active: !announcement.is_active })}
                    style={{
                      width: '52px',
                      height: '28px',
                      borderRadius: '999px',
                      background: announcement.is_active ? '#10b981' : '#334155',
                      border: 'none',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        position: 'absolute',
                        top: '3px',
                        left: announcement.is_active ? '27px' : '3px',
                        transition: 'left 0.2s',
                      }}
                    />
                  </button>
                </div>
              </div>

              <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '28px' }}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveAnnouncement(announcement);
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                      Banner Type
                    </label>
                    <select
                      value={announcement.type}
                      onChange={(e) => setAnnouncement({ ...announcement, type: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: '#0b0f19',
                        border: '1px solid #334155',
                        color: '#f8fafc',
                        fontSize: '14px',
                      }}
                    >
                      <option value="info">Info (Blue)</option>
                      <option value="warning">Warning (Yellow/Amber)</option>
                      <option value="success">Success (Green)</option>
                      <option value="danger">Urgent Alert (Red)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                      English Text
                    </label>
                    <textarea
                      rows={3}
                      value={announcement.text_en}
                      onChange={(e) => setAnnouncement({ ...announcement, text_en: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: '#0b0f19',
                        border: '1px solid #334155',
                        color: '#f8fafc',
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                      Bengali Text
                    </label>
                    <textarea
                      rows={3}
                      value={announcement.text_bn}
                      onChange={(e) => setAnnouncement({ ...announcement, text_bn: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: '#0b0f19',
                        border: '1px solid #334155',
                        color: '#f8fafc',
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  {/* Live Banner Preview */}
                  <div style={{ padding: '16px', background: '#0b0f19', borderRadius: '12px', border: '1px solid #1f2937' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Live Preview &bull; Banner Type: <span style={{ color: '#38bdf8' }}>{announcement.type || 'info'}</span>
                    </div>
                    <div
                      style={{
                        background:
                          announcement.type === 'danger'
                            ? 'linear-gradient(90deg, #dc2626, #991b1b)'
                            : announcement.type === 'warning'
                            ? 'linear-gradient(90deg, #d97706, #b45309)'
                            : announcement.type === 'success'
                            ? 'linear-gradient(90deg, #059669, #047857)'
                            : 'linear-gradient(90deg, #2563eb, #1d4ed8)',
                        color: '#ffffff',
                        padding: '12px 18px',
                        borderRadius: '8px',
                        fontSize: '13.5px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                      }}
                    >
                      <span
                        style={{
                          background: 'rgba(0,0,0,0.25)',
                          padding: '3px 8px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                        }}
                      >
                        {announcement.type === 'danger'
                          ? '🚨 Alert'
                          : announcement.type === 'warning'
                          ? '⚠️ Notice'
                          : announcement.type === 'success'
                          ? '✨ Update'
                          : 'ℹ️ Info'}
                      </span>
                      <span>{announcement.text_en || announcement.text_bn || 'Your banner notification text preview...'}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <button
                      type="submit"
                      style={{
                        padding: '12px 24px',
                        borderRadius: '10px',
                        background: '#10b981',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '14px',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Save Announcement
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: CATEGORIES MANAGER */}
          {activeTab === 'categories' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: '#f8fafc' }}>
                    Categories Manager ({categories.length})
                  </h1>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
                    Manage tool categories, icons, titles, and activate or deactivate individual category groups.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setCategoryModal({
                      isOpen: true,
                      mode: 'create',
                      data: {
                        slug: '',
                        title_en: '',
                        title_bn: '',
                        desc_en: '',
                        desc_bn: '',
                        symbol: '📁',
                        is_active: true,
                      },
                    })
                  }
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    background: '#10b981',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={16} /> Add Category
                </button>
              </div>

              {/* Categories Table */}
              <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ background: '#1f2937', borderBottom: '1px solid #374151', color: '#94a3b8' }}>
                      <th style={{ padding: '14px 18px', fontWeight: 700 }}>Symbol</th>
                      <th style={{ padding: '14px 18px', fontWeight: 700 }}>Slug</th>
                      <th style={{ padding: '14px 18px', fontWeight: 700 }}>Title (EN / BN)</th>
                      <th style={{ padding: '14px 18px', fontWeight: 700 }}>Tools Count</th>
                      <th style={{ padding: '14px 18px', fontWeight: 700 }}>Status</th>
                      <th style={{ padding: '14px 18px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => {
                      const toolsInCat = tools.filter((t) => t.category_slug === cat.slug).length;
                      return (
                        <tr key={cat.slug} style={{ borderBottom: '1px solid #1f2937' }}>
                          <td style={{ padding: '14px 18px', fontSize: '20px' }}>{cat.symbol}</td>
                          <td style={{ padding: '14px 18px', fontFamily: 'monospace', color: '#38bdf8' }}>{cat.slug}</td>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontWeight: 700, color: '#f8fafc' }}>{cat.title_en}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{cat.title_bn}</div>
                          </td>
                          <td style={{ padding: '14px 18px', color: '#cbd5e1' }}>{toolsInCat} tools</td>
                          <td style={{ padding: '14px 18px' }}>
                            <button
                              type="button"
                              onClick={() => toggleCategoryActive(cat.slug, cat.is_active)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 10px',
                                borderRadius: '999px',
                                fontSize: '12px',
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer',
                                background: cat.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: cat.is_active ? '#34d399' : '#f87171',
                              }}
                            >
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: cat.is_active ? '#10b981' : '#ef4444',
                                }}
                              />
                              {cat.is_active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() =>
                                  setCategoryModal({
                                    isOpen: true,
                                    mode: 'edit',
                                    data: { ...cat },
                                  })
                                }
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  background: '#1f2937',
                                  color: '#e2e8f0',
                                  border: '1px solid #374151',
                                  cursor: 'pointer',
                                }}
                                title="Edit Category"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteConfirm({
                                    isOpen: true,
                                    type: 'category',
                                    slug: cat.slug,
                                    title: cat.title_en,
                                  })
                                }
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  color: '#f87171',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  cursor: 'pointer',
                                }}
                                title="Delete Category"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: TOOLS MANAGER (FULL EDIT, DELETE, ACTIVE/INACTIVE) */}
          {activeTab === 'tools' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: '#f8fafc' }}>
                    Tools Manager ({tools.length})
                  </h1>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
                    Control live status, edit titles & descriptions, add new tools, or remove tools from the platform.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setToolModal({
                      isOpen: true,
                      mode: 'create',
                      data: {
                        slug: '',
                        category_slug: categories[0]?.slug || 'text-tools',
                        title_en: '',
                        title_bn: '',
                        desc_en: '',
                        desc_bn: '',
                        badge: '',
                        is_active: true,
                      },
                    })
                  }
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    background: '#10b981',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={16} /> Add New Tool
                </button>
              </div>

              {/* Filters Bar */}
              <div
                style={{
                  background: '#111827',
                  border: '1px solid #1f2937',
                  borderRadius: '14px',
                  padding: '16px',
                  marginBottom: '20px',
                  display: 'flex',
                  gap: '14px',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                {/* Search */}
                <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
                  <input
                    type="text"
                    placeholder="Search by tool title or slug..."
                    value={toolSearch}
                    onChange={(e) => setToolSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 36px',
                      borderRadius: '10px',
                      background: '#0b0f19',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      fontSize: '13.5px',
                    }}
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={toolCatFilter}
                  onChange={(e) => setToolCatFilter(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: '#0b0f19',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '13.5px',
                  }}
                >
                  <option value="all">All Categories ({tools.length})</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.symbol} {c.title_en}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={toolStatusFilter}
                  onChange={(e) => setToolStatusFilter(e.target.value as any)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: '#0b0f19',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '13.5px',
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only ({activeToolsCount})</option>
                  <option value="inactive">Inactive Only ({tools.length - activeToolsCount})</option>
                </select>
              </div>

              {/* Tools Table */}
              <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ background: '#1f2937', borderBottom: '1px solid #374151', color: '#94a3b8' }}>
                      <th style={{ padding: '14px 18px', fontWeight: 700 }}>Tool Name</th>
                      <th style={{ padding: '14px 18px', fontWeight: 700 }}>Slug & Route</th>
                      <th style={{ padding: '14px 18px', fontWeight: 700 }}>Category</th>
                      <th style={{ padding: '14px 18px', fontWeight: 700 }}>Badge</th>
                      <th style={{ padding: '14px 18px', fontWeight: 700 }}>Status</th>
                      <th style={{ padding: '14px 18px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTools.map((tool) => {
                      const cat = categories.find((c) => c.slug === tool.category_slug);
                      return (
                        <tr key={tool.slug} style={{ borderBottom: '1px solid #1f2937' }}>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontWeight: 700, color: '#f8fafc' }}>{tool.title_en}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{tool.title_bn}</div>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <Link
                              href={`/tools/${tool.slug}`}
                              target="_blank"
                              style={{
                                fontFamily: 'monospace',
                                color: '#38bdf8',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              /{tool.slug} <ExternalLink size={11} />
                            </Link>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <span
                              style={{
                                fontSize: '12px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: '#1e293b',
                                color: '#cbd5e1',
                              }}
                            >
                              {cat?.symbol || '📁'} {cat?.title_en || tool.category_slug}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            {tool.badge ? (
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '2px 7px',
                                  borderRadius: '6px',
                                  background: 'rgba(245, 158, 11, 0.15)',
                                  color: '#fbbf24',
                                }}
                              >
                                {tool.badge}
                              </span>
                            ) : (
                              <span style={{ color: '#475569', fontSize: '12px' }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <button
                              type="button"
                              onClick={() => toggleToolActive(tool.slug, tool.is_active)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 10px',
                                borderRadius: '999px',
                                fontSize: '12px',
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer',
                                background: tool.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: tool.is_active ? '#34d399' : '#f87171',
                              }}
                            >
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: tool.is_active ? '#10b981' : '#ef4444',
                                }}
                              />
                              {tool.is_active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() =>
                                  setToolModal({
                                    isOpen: true,
                                    mode: 'edit',
                                    data: { ...tool },
                                  })
                                }
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  background: '#1f2937',
                                  color: '#e2e8f0',
                                  border: '1px solid #374151',
                                  cursor: 'pointer',
                                }}
                                title="Edit Tool Details"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteConfirm({
                                    isOpen: true,
                                    type: 'tool',
                                    slug: tool.slug,
                                    title: tool.title_en,
                                  })
                                }
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  color: '#f87171',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  cursor: 'pointer',
                                }}
                                title="Delete Tool"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: FOOTER & SOCIAL & WHATSAPP FAB */}
          {activeTab === 'footer' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: '#f8fafc' }}>
                    Footer & Social Links
                  </h1>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
                    Granular element controls for floating WhatsApp widget, social profile icons, and footer copyright text.
                  </p>
                </div>
                {/* Master Active / Inactive Toggle Switch */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: footerSocial.is_active ? '#10b981' : '#64748b' }}>
                    {footerSocial.is_active ? 'Master Footer Active' : 'Footer Disabled'}
                  </span>
                  <button
                    type="button"
                    onClick={() => saveFooterSocial({ ...footerSocial, is_active: !footerSocial.is_active })}
                    style={{
                      width: '52px',
                      height: '28px',
                      borderRadius: '999px',
                      background: footerSocial.is_active ? '#10b981' : '#334155',
                      border: 'none',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        position: 'absolute',
                        top: '3px',
                        left: footerSocial.is_active ? '27px' : '3px',
                        transition: 'left 0.2s',
                      }}
                    />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Element 1: WhatsApp Floating Action Button */}
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid #1f2937' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '22px' }}>💬</span>
                      <div>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '15px' }}>Floating WhatsApp Chat Widget</div>
                        <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>Pulsing action button in the bottom right corner</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => saveFooterSocial({ ...footerSocial, whatsapp_active: !footerSocial.whatsapp_active })}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: footerSocial.whatsapp_active ? '#10b981' : '#374151',
                        color: '#ffffff',
                        transition: 'background 0.2s',
                      }}
                    >
                      {footerSocial.whatsapp_active ? 'Active on Site' : 'Inactive'}
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                        WhatsApp Phone Number (with Country Code)
                      </label>
                      <input
                        type="text"
                        value={footerSocial.whatsapp_number}
                        onChange={(e) => setFooterSocial({ ...footerSocial, whatsapp_number: e.target.value })}
                        placeholder="8801521417284"
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '10px',
                          background: '#0b0f19',
                          border: '1px solid #334155',
                          color: '#f8fafc',
                          fontSize: '13.5px',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                        Default Message (English)
                      </label>
                      <input
                        type="text"
                        value={footerSocial.whatsapp_text_en}
                        onChange={(e) => setFooterSocial({ ...footerSocial, whatsapp_text_en: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '10px',
                          background: '#0b0f19',
                          border: '1px solid #334155',
                          color: '#f8fafc',
                          fontSize: '13.5px',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                        Default Message (Bengali)
                      </label>
                      <input
                        type="text"
                        value={footerSocial.whatsapp_text_bn}
                        onChange={(e) => setFooterSocial({ ...footerSocial, whatsapp_text_bn: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '10px',
                          background: '#0b0f19',
                          border: '1px solid #334155',
                          color: '#f8fafc',
                          fontSize: '13.5px',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Element 2: Facebook Profile Link */}
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '20px', color: '#3b82f6' }}>🌐</span>
                      <div>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '15px' }}>Facebook Link</div>
                        <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>Footer icon link to Facebook profile or page</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => saveFooterSocial({ ...footerSocial, facebook_active: !footerSocial.facebook_active })}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: footerSocial.facebook_active ? '#10b981' : '#374151',
                        color: '#ffffff',
                      }}
                    >
                      {footerSocial.facebook_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                      Facebook URL
                    </label>
                    <input
                      type="text"
                      value={footerSocial.facebook_url}
                      onChange={(e) => setFooterSocial({ ...footerSocial, facebook_url: e.target.value })}
                      placeholder="https://www.facebook.com/your-username"
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '10px',
                        background: '#0b0f19',
                        border: '1px solid #334155',
                        color: '#f8fafc',
                        fontSize: '13.5px',
                      }}
                    />
                  </div>
                </div>

                {/* Element 3: LinkedIn Profile Link */}
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '20px', color: '#0ea5e9' }}>💼</span>
                      <div>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '15px' }}>LinkedIn Link</div>
                        <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>Footer icon link to LinkedIn professional profile</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => saveFooterSocial({ ...footerSocial, linkedin_active: !footerSocial.linkedin_active })}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: footerSocial.linkedin_active ? '#10b981' : '#374151',
                        color: '#ffffff',
                      }}
                    >
                      {footerSocial.linkedin_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                      LinkedIn URL
                    </label>
                    <input
                      type="text"
                      value={footerSocial.linkedin_url}
                      onChange={(e) => setFooterSocial({ ...footerSocial, linkedin_url: e.target.value })}
                      placeholder="https://www.linkedin.com/in/your-username"
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '10px',
                        background: '#0b0f19',
                        border: '1px solid #334155',
                        color: '#f8fafc',
                        fontSize: '13.5px',
                      }}
                    />
                  </div>
                </div>

                {/* Element 4: GitHub Link */}
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '20px', color: '#cbd5e1' }}>🐙</span>
                      <div>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '15px' }}>GitHub Link</div>
                        <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>Footer icon link to open-source repository</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => saveFooterSocial({ ...footerSocial, github_active: !footerSocial.github_active })}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: footerSocial.github_active ? '#10b981' : '#374151',
                        color: '#ffffff',
                      }}
                    >
                      {footerSocial.github_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                      GitHub URL
                    </label>
                    <input
                      type="text"
                      value={footerSocial.github_url}
                      onChange={(e) => setFooterSocial({ ...footerSocial, github_url: e.target.value })}
                      placeholder="https://github.com/your-username"
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '10px',
                        background: '#0b0f19',
                        border: '1px solid #334155',
                        color: '#f8fafc',
                        fontSize: '13.5px',
                      }}
                    />
                  </div>
                </div>

                {/* Element 5: Copyright & Privacy Processing Notice */}
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '15px' }}>Copyright & Processing Notice</div>
                    <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>Text displayed at the very bottom of the website</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                        English Notice Text
                      </label>
                      <input
                        type="text"
                        value={footerSocial.copyright_text_en}
                        onChange={(e) => setFooterSocial({ ...footerSocial, copyright_text_en: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '10px',
                          background: '#0b0f19',
                          border: '1px solid #334155',
                          color: '#f8fafc',
                          fontSize: '13.5px',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                        Bengali Notice Text
                      </label>
                      <input
                        type="text"
                        value={footerSocial.copyright_text_bn}
                        onChange={(e) => setFooterSocial({ ...footerSocial, copyright_text_bn: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '10px',
                          background: '#0b0f19',
                          border: '1px solid #334155',
                          color: '#f8fafc',
                          fontSize: '13.5px',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div>
                  <button
                    type="button"
                    onClick={() => saveFooterSocial(footerSocial)}
                    style={{
                      padding: '12px 28px',
                      borderRadius: '10px',
                      background: '#10b981',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '14px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                    }}
                  >
                    <Check size={16} /> Save All Footer Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: CREATOR PROFILE */}
          {activeTab === 'creator' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: '#f8fafc' }}>
                    Creator Profile Manager
                  </h1>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
                    Granular element controls for the creator identity, direct email contact, social links, and bio descriptions.
                  </p>
                </div>
                {/* Master Active / Inactive Toggle Switch */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: creatorAbout.is_active ? '#10b981' : '#64748b' }}>
                    {creatorAbout.is_active ? 'Creator Card Active' : 'Creator Card Disabled'}
                  </span>
                  <button
                    type="button"
                    onClick={() => saveCreatorAbout({ ...creatorAbout, is_active: !creatorAbout.is_active })}
                    style={{
                      width: '52px',
                      height: '28px',
                      borderRadius: '999px',
                      background: creatorAbout.is_active ? '#10b981' : '#334155',
                      border: 'none',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        position: 'absolute',
                        top: '3px',
                        left: creatorAbout.is_active ? '27px' : '3px',
                        transition: 'left 0.2s',
                      }}
                    />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Element 1: Creator Identity & Titles */}
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #1f2937' }}>
                    <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '15px' }}>Creator Identity & Titles</div>
                    <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>Displayed in the "About ToolGhor" modal and creator profile</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                        Creator Full Name
                      </label>
                      <input
                        type="text"
                        value={creatorAbout.name}
                        onChange={(e) => setCreatorAbout({ ...creatorAbout, name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '10px',
                          background: '#0b0f19',
                          border: '1px solid #334155',
                          color: '#f8fafc',
                          fontSize: '13.5px',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                        English Role Title
                      </label>
                      <input
                        type="text"
                        value={creatorAbout.role_en}
                        onChange={(e) => setCreatorAbout({ ...creatorAbout, role_en: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '10px',
                          background: '#0b0f19',
                          border: '1px solid #334155',
                          color: '#f8fafc',
                          fontSize: '13.5px',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                        Bengali Role Title
                      </label>
                      <input
                        type="text"
                        value={creatorAbout.role_bn}
                        onChange={(e) => setCreatorAbout({ ...creatorAbout, role_bn: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '10px',
                          background: '#0b0f19',
                          border: '1px solid #334155',
                          color: '#f8fafc',
                          fontSize: '13.5px',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Element 2: Direct Email Contact Button */}
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '20px', color: '#10b981' }}>✉️</span>
                      <div>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '15px' }}>Direct Email Contact</div>
                        <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>Contact button inside the creator card</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => saveCreatorAbout({ ...creatorAbout, email_active: !creatorAbout.email_active })}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: creatorAbout.email_active ? '#10b981' : '#374151',
                        color: '#ffffff',
                      }}
                    >
                      {creatorAbout.email_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                      Creator Email Address
                    </label>
                    <input
                      type="email"
                      value={creatorAbout.email}
                      onChange={(e) => setCreatorAbout({ ...creatorAbout, email: e.target.value })}
                      placeholder="creator@toolghor.com"
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '10px',
                        background: '#0b0f19',
                        border: '1px solid #334155',
                        color: '#f8fafc',
                        fontSize: '13.5px',
                      }}
                    />
                  </div>
                </div>

                {/* Element 3: Social Media Connections (Facebook & LinkedIn) */}
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '20px', color: '#38bdf8' }}>🔗</span>
                      <div>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '15px' }}>Creator Social Profiles</div>
                        <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>Facebook and LinkedIn buttons inside the creator card</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => saveCreatorAbout({ ...creatorAbout, social_active: !creatorAbout.social_active })}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: creatorAbout.social_active ? '#10b981' : '#374151',
                        color: '#ffffff',
                      }}
                    >
                      {creatorAbout.social_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                        Facebook Profile URL
                      </label>
                      <input
                        type="text"
                        value={creatorAbout.facebook_url}
                        onChange={(e) => setCreatorAbout({ ...creatorAbout, facebook_url: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '10px',
                          background: '#0b0f19',
                          border: '1px solid #334155',
                          color: '#f8fafc',
                          fontSize: '13.5px',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                        GitHub Profile URL
                      </label>
                      <input
                        type="text"
                        value={creatorAbout.github_url || ''}
                        onChange={(e) => setCreatorAbout({ ...creatorAbout, github_url: e.target.value })}
                        placeholder="https://github.com/..."
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '10px',
                          background: '#0b0f19',
                          border: '1px solid #334155',
                          color: '#f8fafc',
                          fontSize: '13.5px',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Element 4: Creator Bio Descriptions */}
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '15px' }}>Bio & Platform Mission</div>
                    <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>Short mission statement shown in the About dialog</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                        English Bio Description
                      </label>
                      <textarea
                        rows={3}
                        value={creatorAbout.bio_en}
                        onChange={(e) => setCreatorAbout({ ...creatorAbout, bio_en: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '10px',
                          background: '#0b0f19',
                          border: '1px solid #334155',
                          color: '#f8fafc',
                          fontSize: '13.5px',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                        Bengali Bio Description
                      </label>
                      <textarea
                        rows={3}
                        value={creatorAbout.bio_bn}
                        onChange={(e) => setCreatorAbout({ ...creatorAbout, bio_bn: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '10px',
                          background: '#0b0f19',
                          border: '1px solid #334155',
                          color: '#f8fafc',
                          fontSize: '13.5px',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div>
                  <button
                    type="button"
                    onClick={() => saveCreatorAbout(creatorAbout)}
                    style={{
                      padding: '12px 28px',
                      borderRadius: '10px',
                      background: '#10b981',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '14px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                    }}
                  >
                    <Check size={16} /> Save Creator Profile Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: API INTEGRATIONS */}
          {activeTab === 'apis' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: '#f8fafc' }}>
                    API Integrations & Keys
                  </h1>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
                    Control each individual cloud API provider with independent active toggles and encrypted key storage.
                  </p>
                </div>
                {/* Master Active / Inactive Toggle Switch */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: apiKeys.is_active ? '#10b981' : '#64748b' }}>
                    {apiKeys.is_active ? 'All APIs Enabled' : 'APIs Globally Paused'}
                  </span>
                  <button
                    type="button"
                    onClick={() => saveApiKeys({ ...apiKeys, is_active: !apiKeys.is_active })}
                    style={{
                      width: '52px',
                      height: '28px',
                      borderRadius: '999px',
                      background: apiKeys.is_active ? '#10b981' : '#334155',
                      border: 'none',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        position: 'absolute',
                        top: '3px',
                        left: apiKeys.is_active ? '27px' : '3px',
                        transition: 'left 0.2s',
                      }}
                    />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {[
                  {
                    key: 'gemini_key',
                    activeKey: 'gemini_active',
                    label: 'Google Gemini AI API',
                    desc: 'Powers AI text rewriting, summarize, OCR reading, and Bengali-English intelligence',
                    placeholder: 'AIzaSy...',
                    color: '#10b981',
                  },
                  {
                    key: 'convertapi_token',
                    activeKey: 'convertapi_active',
                    label: 'ConvertAPI Document Engine',
                    desc: 'Server-side engine for high-fidelity DOCX to PDF, Word conversions, and PDF flattening',
                    placeholder: 'sec_...',
                    color: '#38bdf8',
                  },
                  {
                    key: 'removebg_key',
                    activeKey: 'removebg_active',
                    label: 'Remove.bg API',
                    desc: 'High-precision portrait cutout and passport photo background eraser',
                    placeholder: 'rmbg_...',
                    color: '#f59e0b',
                  },
                  {
                    key: 'openai_key',
                    activeKey: 'openai_active',
                    label: 'OpenAI API (GPT-4o & Whisper)',
                    desc: 'Optional fallback engine for OpenAI tasks and speech-to-text transcription',
                    placeholder: 'sk-proj-...',
                    color: '#a855f7',
                  },
                ].map((item) => {
                  const isActive = (apiKeys as any)[item.activeKey];
                  const hasKey = Boolean(((apiKeys as any)[item.key] || '').trim());
                  return (
                    <div key={item.key} style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontWeight: 800, color: '#f8fafc', fontSize: '15px' }}>{item.label}</span>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '999px',
                                background: isActive && hasKey ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.12)',
                                color: isActive && hasKey ? '#34d399' : '#94a3b8',
                                border: `1px solid ${isActive && hasKey ? 'rgba(16,185,129,0.3)' : 'rgba(148,163,184,0.2)'}`,
                              }}
                            >
                              {isActive && hasKey ? 'Connected & Ready' : !isActive ? 'Disabled' : 'Key Not Set'}
                            </span>
                          </div>
                          <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '3px' }}>{item.desc}</div>
                        </div>

                        {/* Individual Provider Active Toggle */}
                        <button
                          type="button"
                          onClick={() => saveApiKeys({ ...apiKeys, [item.activeKey]: !isActive })}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: isActive ? '#10b981' : '#374151',
                            color: '#ffffff',
                            transition: 'background 0.2s',
                          }}
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </button>
                      </div>

                      <div style={{ position: 'relative' }}>
                        <input
                          type={showKey[item.key] ? 'text' : 'password'}
                          value={(apiKeys as any)[item.key] || ''}
                          onChange={(e) => setApiKeys({ ...apiKeys, [item.key]: e.target.value })}
                          placeholder={item.placeholder}
                          style={{
                            width: '100%',
                            padding: '11px 44px 11px 14px',
                            borderRadius: '10px',
                            background: '#0b0f19',
                            border: '1px solid #334155',
                            color: '#f8fafc',
                            fontSize: '13.5px',
                            fontFamily: 'monospace',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowKey((p) => ({ ...p, [item.key]: !p[item.key] }))}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '11px',
                            background: 'transparent',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                          }}
                        >
                          {showKey[item.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Save Button */}
                <div>
                  <button
                    type="button"
                    onClick={() => saveApiKeys(apiKeys)}
                    style={{
                      padding: '12px 28px',
                      borderRadius: '10px',
                      background: '#10b981',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '14px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                    }}
                  >
                    <Check size={16} /> Save All API Credentials
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: USAGE ANALYTICS */}
          {activeTab === 'analytics' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: '#f8fafc' }}>
                    Usage Analytics & Launch Counts
                  </h1>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
                    Real-time Postgres database counter tracking every visitor launch with progress visualizers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchAllSections}
                  disabled={loadingData}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    background: '#1f2937',
                    border: '1px solid #374151',
                    color: '#f8fafc',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <RefreshCw size={15} className={loadingData ? 'animate-spin' : ''} />
                  <span>{loadingData ? 'Refreshing...' : 'Refresh Analytics'}</span>
                </button>
              </div>

              {/* KPI Cards */}
              {(() => {
                const totalLaunches = Object.values(analytics).reduce((a, b) => a + Number(b || 0), 0);
                const sortedTools = [...tools]
                  .map((t) => ({ ...t, count: Number(analytics[t.slug] || 0) }))
                  .sort((a, b) => b.count - a.count);
                const topTool = sortedTools[0];

                return (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '28px' }}>
                      <div style={{ background: '#111827', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '16px', padding: '22px' }}>
                        <span style={{ fontSize: '12.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Total Platform Launches
                        </span>
                        <div style={{ fontSize: '36px', fontWeight: 900, color: '#10b981', margin: '6px 0 2px' }}>
                          {totalLaunches.toLocaleString()}
                        </div>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>Recorded across all tools</span>
                      </div>

                      <div style={{ background: '#111827', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '16px', padding: '22px' }}>
                        <span style={{ fontSize: '12.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Most Popular Tool
                        </span>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#fbbf24', margin: '10px 0 2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>🏆</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topTool ? topTool.title_en : 'None'}</span>
                        </div>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>{topTool ? `${topTool.count.toLocaleString()} launches` : '0 launches'}</span>
                      </div>

                      <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '22px' }}>
                        <span style={{ fontSize: '12.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Tools Tracked
                        </span>
                        <div style={{ fontSize: '36px', fontWeight: 900, color: '#38bdf8', margin: '6px 0 2px' }}>
                          {tools.length}
                        </div>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>Active & monitored 24/7</span>
                      </div>
                    </div>

                    {/* Table View with Progress Bars */}
                    <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                        <thead>
                          <tr style={{ background: '#1f2937', borderBottom: '1px solid #374151', color: '#94a3b8' }}>
                            <th style={{ padding: '14px 18px', fontWeight: 700, width: '70px' }}>Rank</th>
                            <th style={{ padding: '14px 18px', fontWeight: 700 }}>Tool Name</th>
                            <th style={{ padding: '14px 18px', fontWeight: 700 }}>Category</th>
                            <th style={{ padding: '14px 18px', fontWeight: 700, width: '220px' }}>Popularity Share</th>
                            <th style={{ padding: '14px 18px', fontWeight: 700, textAlign: 'right' }}>Launches</th>
                            <th style={{ padding: '14px 18px', fontWeight: 700, textAlign: 'right', width: '110px' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedTools.map((t, idx) => {
                            const percent = totalLaunches > 0 ? Math.round((t.count / totalLaunches) * 100) : 0;
                            return (
                              <tr key={t.slug} style={{ borderBottom: '1px solid #1f2937' }}>
                                <td style={{ padding: '14px 18px', fontWeight: 800 }}>
                                  {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : <span style={{ color: '#64748b' }}>#{idx + 1}</span>}
                                </td>
                                <td style={{ padding: '14px 18px', fontWeight: 700, color: '#f8fafc' }}>
                                  {t.title_en}
                                  <div style={{ fontSize: '11.5px', fontFamily: 'monospace', color: '#64748b', fontWeight: 500 }}>/{t.slug}</div>
                                </td>
                                <td style={{ padding: '14px 18px', color: '#94a3b8' }}>
                                  {categories.find((c) => c.slug === t.category_slug)?.title_en || t.category_slug}
                                </td>
                                <td style={{ padding: '14px 18px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ flex: 1, height: '8px', background: '#0b0f19', borderRadius: '999px', overflow: 'hidden' }}>
                                      <div
                                        style={{
                                          width: `${percent}%`,
                                          height: '100%',
                                          background: idx === 0 ? 'linear-gradient(90deg, #10b981, #34d399)' : '#10b981',
                                          borderRadius: '999px',
                                        }}
                                      />
                                    </div>
                                    <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 700, width: '32px', textAlign: 'right' }}>
                                      {percent}%
                                    </span>
                                  </div>
                                </td>
                                <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 800, color: '#10b981', fontSize: '15px' }}>
                                  {t.count.toLocaleString()}
                                </td>
                                <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                                  <Link
                                    href={`/${t.slug}`}
                                    target="_blank"
                                    style={{
                                      padding: '5px 10px',
                                      borderRadius: '6px',
                                      background: '#1f2937',
                                      color: '#38bdf8',
                                      fontSize: '12px',
                                      fontWeight: 600,
                                      textDecoration: 'none',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                    }}
                                  >
                                    <ExternalLink size={12} /> Test
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* TAB 10: ADMIN PROFILE & SECURITY */}
          {activeTab === 'profile' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: '#f8fafc' }}>
                    Admin Profile & Security
                  </h1>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
                    Manage your administrator credentials, recovery email/phone, and securely change your login passcode.
                  </p>
                </div>
              </div>

              {profileMsg && (
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    fontSize: '14px',
                    fontWeight: 600,
                    background: profileMsg.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: profileMsg.type === 'success' ? '#34d399' : '#f87171',
                    border: `1px solid ${profileMsg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  {profileMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Section 1: Account & Contact */}
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '28px' }}>
                  <div style={{ marginBottom: '20px', borderBottom: '1px solid #1f2937', paddingBottom: '14px' }}>
                    <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={18} color="#10b981" /> Administrator Details
                    </div>
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                      These details are used for administrator notifications and one-time password (OTP) verification.
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                        Admin Username
                      </label>
                      <input
                        type="text"
                        disabled
                        value={adminProfile.username || 'admin'}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          background: '#0a0d14',
                          border: '1px solid #263345',
                          color: '#94a3b8',
                          fontSize: '14px',
                          cursor: 'not-allowed',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                        Admin Email (Gmail for Recovery OTP)
                      </label>
                      <input
                        type="email"
                        value={adminProfile.email}
                        onChange={(e) => setAdminProfile({ ...adminProfile, email: e.target.value })}
                        placeholder="ashifur.badhon@gmail.com"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          background: '#0b0f19',
                          border: '1px solid #334155',
                          color: '#f8fafc',
                          fontSize: '14px',
                        }}
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                        Admin Mobile Phone (for SMS OTP)
                      </label>
                      <input
                        type="tel"
                        value={adminProfile.phone}
                        onChange={(e) => setAdminProfile({ ...adminProfile, phone: e.target.value })}
                        placeholder="+8801521417284"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          background: '#0b0f19',
                          border: '1px solid #334155',
                          color: '#f8fafc',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Change Password */}
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '28px' }}>
                  <div style={{ marginBottom: '20px', borderBottom: '1px solid #1f2937', paddingBottom: '14px' }}>
                    <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Lock size={18} color="#10b981" /> Change Admin Passcode
                    </div>
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                      To set a new password, enter your current password followed by your desired new passcode.
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', maxWidth: '520px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                        Current Password <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Enter your current password..."
                        value={profilePassCurrent}
                        onChange={(e) => setProfilePassCurrent(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          background: '#0b0f19',
                          border: '1px solid #334155',
                          color: '#f8fafc',
                          fontSize: '14px',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                        New Password (leave blank if keeping current)
                      </label>
                      <input
                        type="password"
                        placeholder="Enter new password..."
                        value={profilePassNew}
                        onChange={(e) => setProfilePassNew(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          background: '#0b0f19',
                          border: '1px solid #334155',
                          color: '#f8fafc',
                          fontSize: '14px',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        placeholder="Re-enter new password..."
                        value={profilePassConfirm}
                        onChange={(e) => setProfilePassConfirm(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          background: '#0b0f19',
                          border: '1px solid #334155',
                          color: '#f8fafc',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '24px' }}>
                    <button
                      type="submit"
                      disabled={profileSaving}
                      style={{
                        padding: '12px 28px',
                        borderRadius: '10px',
                        background: '#10b981',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '14px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      {profileSaving ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" /> Saving Changes...
                        </>
                      ) : (
                        'Save Profile & Credentials'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* ================= MODAL: CREATE / EDIT TOOL ================= */}
      {toolModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 200,
            display: 'grid',
            placeItems: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#131824',
              border: '1px solid #1e293b',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '600px',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                {toolModal.mode === 'create' ? 'Add New Tool' : `Edit Tool: ${toolModal.data.title_en}`}
              </h2>
              <button
                type="button"
                onClick={() => setToolModal({ isOpen: false, mode: 'create', data: {} })}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '70vh', overflowY: 'auto' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px', color: '#cbd5e1' }}>
                  Tool Slug (e.g. word-counter)
                </label>
                <input
                  type="text"
                  disabled={toolModal.mode === 'edit'}
                  value={toolModal.data.slug || ''}
                  onChange={(e) => setToolModal((p) => ({ ...p, data: { ...p.data, slug: e.target.value } }))}
                  placeholder="unique-tool-slug"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#0b0f19',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '13.5px',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px', color: '#cbd5e1' }}>
                  Category
                </label>
                <select
                  value={toolModal.data.category_slug || ''}
                  onChange={(e) => setToolModal((p) => ({ ...p, data: { ...p.data, category_slug: e.target.value } }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#0b0f19',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '13.5px',
                  }}
                >
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.symbol} {c.title_en}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px', color: '#cbd5e1' }}>
                    Title (English)
                  </label>
                  <input
                    type="text"
                    value={toolModal.data.title_en || ''}
                    onChange={(e) => setToolModal((p) => ({ ...p, data: { ...p.data, title_en: e.target.value } }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: '#0b0f19',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      fontSize: '13.5px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px', color: '#cbd5e1' }}>
                    Title (Bengali)
                  </label>
                  <input
                    type="text"
                    value={toolModal.data.title_bn || ''}
                    onChange={(e) => setToolModal((p) => ({ ...p, data: { ...p.data, title_bn: e.target.value } }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: '#0b0f19',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      fontSize: '13.5px',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px', color: '#cbd5e1' }}>
                  Badge Tag (Optional, e.g. 'AI', 'NEW', 'FAST')
                </label>
                <input
                  type="text"
                  value={toolModal.data.badge || ''}
                  onChange={(e) => setToolModal((p) => ({ ...p, data: { ...p.data, badge: e.target.value } }))}
                  placeholder="e.g. AI"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#0b0f19',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '13.5px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px', color: '#cbd5e1' }}>
                  Description (English)
                </label>
                <textarea
                  rows={2}
                  value={toolModal.data.desc_en || ''}
                  onChange={(e) => setToolModal((p) => ({ ...p, data: { ...p.data, desc_en: e.target.value } }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#0b0f19',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '13.5px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px', color: '#cbd5e1' }}>
                  Description (Bengali)
                </label>
                <textarea
                  rows={2}
                  value={toolModal.data.desc_bn || ''}
                  onChange={(e) => setToolModal((p) => ({ ...p, data: { ...p.data, desc_bn: e.target.value } }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#0b0f19',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '13.5px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                <input
                  type="checkbox"
                  id="tool_active_check"
                  checked={toolModal.data.is_active !== false}
                  onChange={(e) => setToolModal((p) => ({ ...p, data: { ...p.data, is_active: e.target.checked } }))}
                  style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
                />
                <label htmlFor="tool_active_check" style={{ fontSize: '13.5px', fontWeight: 600, color: '#f8fafc', cursor: 'pointer' }}>
                  Set Tool as Active immediately
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
              <button
                type="button"
                onClick={() => setToolModal({ isOpen: false, mode: 'create', data: {} })}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  background: '#1f2937',
                  color: '#94a3b8',
                  border: 'none',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveToolModal}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Save Tool
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE / EDIT CATEGORY ================= */}
      {categoryModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 200,
            display: 'grid',
            placeItems: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#131824',
              border: '1px solid #1e293b',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '540px',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                {categoryModal.mode === 'create' ? 'Add Category' : `Edit Category: ${categoryModal.data.title_en}`}
              </h2>
              <button
                type="button"
                onClick={() => setCategoryModal({ isOpen: false, mode: 'create', data: {} })}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px', color: '#cbd5e1' }}>
                  Category Slug
                </label>
                <input
                  type="text"
                  disabled={categoryModal.mode === 'edit'}
                  value={categoryModal.data.slug || ''}
                  onChange={(e) => setCategoryModal((p) => ({ ...p, data: { ...p.data, slug: e.target.value } }))}
                  placeholder="e.g. document-tools"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#0b0f19',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '13.5px',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px', color: '#cbd5e1' }}>
                  Symbol / Emoji
                </label>
                <input
                  type="text"
                  value={categoryModal.data.symbol || ''}
                  onChange={(e) => setCategoryModal((p) => ({ ...p, data: { ...p.data, symbol: e.target.value } }))}
                  placeholder="e.g. 📄"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#0b0f19',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '13.5px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px', color: '#cbd5e1' }}>
                    Title (English)
                  </label>
                  <input
                    type="text"
                    value={categoryModal.data.title_en || ''}
                    onChange={(e) => setCategoryModal((p) => ({ ...p, data: { ...p.data, title_en: e.target.value } }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: '#0b0f19',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      fontSize: '13.5px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px', color: '#cbd5e1' }}>
                    Title (Bengali)
                  </label>
                  <input
                    type="text"
                    value={categoryModal.data.title_bn || ''}
                    onChange={(e) => setCategoryModal((p) => ({ ...p, data: { ...p.data, title_bn: e.target.value } }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: '#0b0f19',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      fontSize: '13.5px',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px', color: '#cbd5e1' }}>
                  Description (English)
                </label>
                <textarea
                  rows={2}
                  value={categoryModal.data.desc_en || ''}
                  onChange={(e) => setCategoryModal((p) => ({ ...p, data: { ...p.data, desc_en: e.target.value } }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#0b0f19',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '13.5px',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
              <button
                type="button"
                onClick={() => setCategoryModal({ isOpen: false, mode: 'create', data: {} })}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  background: '#1f2937',
                  color: '#94a3b8',
                  border: 'none',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCategoryModal}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Save Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE CONFIRMATION ================= */}
      {deleteConfirm && deleteConfirm.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 300,
            display: 'grid',
            placeItems: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#131824',
              border: '1px solid #ef4444',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '440px',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
              }}
            >
              <AlertTriangle size={24} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: '#f8fafc' }}>
              Delete {deleteConfirm.type === 'tool' ? 'Tool' : 'Category'}?
            </h3>
            <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: '0 0 20px', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete <strong>{deleteConfirm.title}</strong> (<code>{deleteConfirm.slug}</code>) from the database? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: '#1f2937',
                  color: '#e2e8f0',
                  border: 'none',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirm.type === 'tool') {
                    handleDeleteTool(deleteConfirm.slug);
                  } else {
                    handleDeleteCategory(deleteConfirm.slug);
                  }
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
