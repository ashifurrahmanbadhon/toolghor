'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Menu,
  Filter,
  Lock,
  Mail,
  Phone,
  KeyRound,
  Zap,
  FileText,
  BookOpen,
  HelpCircle,
  Upload,
  Move,
  RotateCcw,
} from 'lucide-react';
import {
  DEFAULT_POLICY_SECTIONS,
  POLICY_SECTIONS_LIST,
  PolicySection,
} from '@/data/policiesDefaults';
import GuidesEditor, { GuideRow } from '@/components/admin/GuidesEditor';
import FaqEditor, { FaqItemRow } from '@/components/admin/FaqEditor';
import { ContentTexts, DEFAULT_CONTENT_TEXTS } from '@/data/contentTexts';
import SectionTextsEditor from '@/components/admin/SectionTextsEditor';
import AccordionSectionCard from '@/components/admin/AccordionSectionCard';

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
  link_url?: string;
  link_text?: string;
  duration_days?: string;
  expires_at?: string | null;
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

interface RemoveAiLabelToolSection {
  name_en: string;
  name_bn: string;
  description_en: string;
  description_bn: string;
  icon?: string;
  enabled: boolean;
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
  photo_url?: string | null;
  photo_position?: string;
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
  ilovepdf_active?: boolean;
  ilovepdf_public_key?: string;
  ilovepdf_secret_key?: string;
}

type MenuTab =
  | 'overview'
  | 'hero'
  | 'announcement'
  | 'categories'
  | 'tools'
  | 'guides'
  | 'faq'
  | 'footer'
  | 'creator'
  | 'apis'
  | 'policies'
  | 'analytics'
  | 'profile';

function formatDhakaDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const datePart = d.toLocaleDateString('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timePart = d.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Dhaka',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${datePart} · ${timePart}`;
}

export default function AdminConsole() {
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinErrorMsg, setPinErrorMsg] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

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

  // Forgot Password Modal State (3-Step Flow: Email Entry -> Code Input -> Password Creation)
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'enter_code' | 'set_password'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotChallengeId, setForgotChallengeId] = useState('');
  const [forgotResetToken, setForgotResetToken] = useState('');
  const [forgotTargetMasked, setForgotTargetMasked] = useState<string>('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [forgotCooldown, setForgotCooldown] = useState(0);

  // Auth Secret Fallback Warning State
  const [isAuthSecretDerived, setIsAuthSecretDerived] = useState(false);
  const [fallbackBannerDismissed, setFallbackBannerDismissed] = useState(false);
  const [forgotAttemptsRemaining, setForgotAttemptsRemaining] = useState<number | null>(null);

  // Resend cooldown timer in admin forgot modal
  useEffect(() => {
    if (forgotCooldown <= 0) return;
    const t = setInterval(() => {
      setForgotCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [forgotCooldown]);

  // Active Menu Tab (Sidebar Navigation)
  const [activeTab, setActiveTab] = useState<MenuTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    text_bn: '📢 স্বাগতম ToolGhor-এ! ২৭টি দরকারি অনলাইন টুল ব্রাউজারে সম্পূর্ণ বিনামূল্যে ব্যবহার করুন।',
    text_en: '📢 Welcome to ToolGhor! 27 fast & secure web tools right inside your browser.',
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
    photo_url: null,
    photo_position: '50% 50%',
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
    ilovepdf_active: true,
    ilovepdf_public_key: '',
    ilovepdf_secret_key: '',
  });

  const [analytics, setAnalytics] = useState<Record<string, number>>({});
  const [periodicAnalytics, setPeriodicAnalytics] = useState<
    Record<string, { this_week: number; last_week: number; this_month: number; last_month: number }>
  >({});
  const [usagePeriod, setUsagePeriod] = useState<'all' | 'this_month' | 'last_month' | 'this_week' | 'last_week'>('all');
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');
  const [hoveredBar, setHoveredBar] = useState<{ name: string; count: number } | null>(null);
  const [policies, setPolicies] = useState<Record<string, PolicySection>>(DEFAULT_POLICY_SECTIONS);
  const [savingPolicies, setSavingPolicies] = useState<Record<string, boolean>>({});
  const [policySaveStatus, setPolicySaveStatus] = useState<Record<string, 'saved' | 'error' | null>>({});

  // Guides Manager State (content_guides table)
  const [guides, setGuides] = useState<GuideRow[]>([]);
  const [savingGuide, setSavingGuide] = useState<Record<string, boolean>>({});
  const [guideSaveStatus, setGuideSaveStatus] = useState<Record<string, 'saved' | 'error' | null>>({});

  // FAQ Manager State (content_faq_items table)
  const [faqItems, setFaqItems] = useState<FaqItemRow[]>([]);
  const [selectedFaqScope, setSelectedFaqScope] = useState<string>('general');
  const [savingFaqScope, setSavingFaqScope] = useState(false);
  const [faqScopeSaveStatus, setFaqScopeSaveStatus] = useState<'saved' | 'error' | null>(null);

  // Remove AI Label Tool (Isolated Table: section_tool_remove_ai_label)
  const [removeAiLabel, setRemoveAiLabel] = useState<RemoveAiLabelToolSection>({
    name_en: 'Remove AI Label',
    name_bn: 'AI লেবেল রিমুভার',
    description_en: 'Remove AI labels & metadata (C2PA, EXIF, XMP) from photos — free, in your browser, no upload.',
    description_bn: 'ছবি থেকে AI লেবেল ও মেটাডেটা (C2PA, EXIF, XMP) মুছে ফেলুন — ফ্রি, ব্রাউজারেই, কোনো আপলোড ছাড়াই।',
    icon: 'ShieldCheck',
    enabled: true,
  });
  const [savingRemoveAiLabel, setSavingRemoveAiLabel] = useState(false);
  const [contentTexts, setContentTexts] = useState<ContentTexts>(DEFAULT_CONTENT_TEXTS);
  const [savingContentTexts, setSavingContentTexts] = useState(false);

  // Accordion Sections State: tracks which subsection cards are open (independent expand/collapse)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [activeGuideSlug, setActiveGuideSlug] = useState<string>('');

  // Entering a tab starts all-collapsed and resets scroll to top
  useEffect(() => {
    setOpenSections({});
    if (typeof window !== 'undefined') {
      const mainViewport = document.querySelector('.admin-main-viewport');
      if (mainViewport) {
        mainViewport.scrollTop = 0;
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [activeTab]);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const isSectionExpanded = (id: string) => Boolean(openSections[id]);

  const expandAllSections = (ids: string[]) => {
    setOpenSections((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        next[id] = true;
      });
      return next;
    });
  };

  const collapseAllSections = (ids: string[]) => {
    setOpenSections((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        next[id] = false;
      });
      return next;
    });
  };

  const renderAccordionControls = (ids: string[]) => {
    const allExpanded = ids.length > 0 && ids.every((id) => openSections[id]);
    return (
      <button
        type="button"
        onClick={() => {
          if (allExpanded) {
            collapseAllSections(ids);
          } else {
            expandAllSections(ids);
          }
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          borderRadius: '8px',
          background: allExpanded ? 'rgba(239, 68, 68, 0.15)' : '#1e293b',
          border: `1px solid ${allExpanded ? 'rgba(239, 68, 68, 0.3)' : '#334155'}`,
          color: allExpanded ? '#f87171' : '#cbd5e1',
          fontSize: '12.5px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          flexShrink: 0,
        }}
      >
        <span>{allExpanded ? 'Collapse All' : 'Expand All'}</span>
      </button>
    );
  };

  // Creator Photo Reposition & Device Upload State (v44)
  const [isRepositionOpen, setIsRepositionOpen] = useState(false);
  const [repositionPan, setRepositionPan] = useState({ x: 50, y: 50 });
  const [repositionZoom, setRepositionZoom] = useState(1);
  const isDraggingPhoto = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0, startPanX: 50, startPanY: 50 });

  const openRepositionEditor = () => {
    const pos = creatorAbout.photo_position || '50% 50%';
    const parts = pos.split(/\s+/).map((p) => parseFloat(p.replace('%', '')));
    setRepositionPan({
      x: !isNaN(parts[0]) ? parts[0] : 50,
      y: !isNaN(parts[1]) ? parts[1] : 50,
    });
    setRepositionZoom(1);
    setIsRepositionOpen(true);
  };

  const handleDevicePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File exceeds 10MB limit. Please select an image under 10MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (readEvent) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 512;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = canvas.toDataURL('image/webp', 0.85);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        }

        const sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
        if (sizeKb > 200) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.65);
          const retryKb = Math.round((dataUrl.length * 3) / 4 / 1024);
          if (retryKb > 200) {
            alert(`Optimized image size (${retryKb} KB) exceeds the 200 KB limit. Please choose a smaller photo.`);
            e.target.value = '';
            return;
          }
        }

        setCreatorAbout((prev) => ({
          ...prev,
          photo_url: dataUrl,
        }));
        e.target.value = '';
      };
      img.src = readEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleResetPhoto = () => {
    setCreatorAbout((prev) => ({
      ...prev,
      photo_url: null,
      photo_position: '50% 50%',
    }));
  };

  // Draft Channel: Mirrored unsaved state assembled in exact public shape
  // Never exposes real API key values — flags only, as already exposed publicly
  const currentDraftData = useMemo(() => {
    return {
      hero,
      announcement,
      categories,
      tools,
      footerSocial,
      creatorAbout,
      apiKeys: {
        is_active: Boolean(apiKeys.is_active),
        gemini_active: Boolean(apiKeys.gemini_active),
        openai_active: Boolean(apiKeys.openai_active),
        convertapi_active: Boolean(apiKeys.convertapi_active),
        removebg_active: Boolean(apiKeys.removebg_active),
      },
      uiSettings: null,
      policies,
      removeAiLabel,
      contentTexts,
    };
  }, [
    hero,
    announcement,
    categories,
    tools,
    footerSocial,
    creatorAbout,
    apiKeys,
    policies,
    removeAiLabel,
    contentTexts,
  ]);

  const currentGuideDraft = useMemo(() => {
    if (!activeGuideSlug) return undefined;
    const found = guides.find((g) => g.slug === activeGuideSlug);
    if (!found) return undefined;
    return { slug: activeGuideSlug, guide: found };
  }, [activeGuideSlug, guides]);

  const currentFaqDraft = useMemo(() => {
    return {
      scope: selectedFaqScope,
      items: faqItems.filter((f) => f.scope === selectedFaqScope),
    };
  }, [selectedFaqScope, faqItems]);

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

  // API Key Visibility, Focus, Testing, and Result States
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [focusedKey, setFocusedKey] = useState<Record<string, boolean>>({});
  const [testingKey, setTestingKey] = useState<Record<string, boolean>>({});
  const [testResult, setTestResult] = useState<
    Record<string, { valid: boolean; message: string } | null>
  >({});

  const formatMaskedKey = (val: string) => {
    if (!val) return '';
    const trimmed = val.trim();
    if (trimmed.length <= 4) return '••••••••';
    return '••••••••' + trimmed.slice(-4);
  };

  const runTestKey = async (provider: string, keyField: string, secondKeyField?: string) => {
    setTestingKey((p) => ({ ...p, [provider]: true }));
    setTestResult((p) => ({ ...p, [provider]: null }));

    try {
      const currentKey = ((apiKeys as any)[keyField] || '').trim();
      const currentSecond = secondKeyField ? ((apiKeys as any)[secondKeyField] || '').trim() : '';
      const payload: any = {
        provider,
        key: currentKey.startsWith('••') ? '' : currentKey,
      };
      if (secondKeyField) {
        payload.publicKey = currentSecond.startsWith('••') ? '' : currentSecond;
      }

      const res = await fetch('/api/admin/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (data && typeof data.valid === 'boolean') {
        setTestResult((p) => ({
          ...p,
          [provider]: {
            valid: data.valid,
            message: data.message || (data.valid ? 'Valid API Key' : 'Invalid API Key'),
          },
        }));
      } else {
        setTestResult((p) => ({
          ...p,
          [provider]: {
            valid: false,
            message: data?.error || data?.message || 'Test request failed',
          },
        }));
      }
    } catch (e: any) {
      setTestResult((p) => ({
        ...p,
        [provider]: {
          valid: false,
          message: e?.message || 'Network error while testing key',
        },
      }));
    } finally {
      setTestingKey((p) => ({ ...p, [provider]: false }));
    }
  };

  const showNotification = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3500);
  };

  // Fetch all database tables
  const fetchAllSections = async () => {
    try {
      setLoadingData(true);
      const res = await fetch('/api/admin/data');
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setDbConnected(data.dbConnected);
        if (typeof data.isAuthSecretDerived === 'boolean') {
          setIsAuthSecretDerived(data.isAuthSecretDerived);
        }
        if (data.sections) {
          if (data.sections.hero) setHero(data.sections.hero);
          if (data.sections.announcement) setAnnouncement(data.sections.announcement);
          if (data.sections.categories) setCategories(data.sections.categories);
          if (data.sections.tools) setTools(data.sections.tools);
          if (data.sections.footerSocial) setFooterSocial(data.sections.footerSocial);
          if (data.sections.creatorAbout) setCreatorAbout(data.sections.creatorAbout);
          if (data.sections.apiKeys) {
            const rawApi = { ...data.sections.apiKeys };
            if (rawApi.gemini_key === '277226@Asif') rawApi.gemini_key = '';
            setApiKeys(rawApi);
          }
          if (data.sections.removeAiLabel) {
            setRemoveAiLabel({
              name_en: data.sections.removeAiLabel.name_en || 'Remove AI Label',
              name_bn: data.sections.removeAiLabel.name_bn || 'AI লেবেল রিমুভার',
              description_en: data.sections.removeAiLabel.description_en || 'Remove AI labels & metadata (C2PA, EXIF, XMP) from photos — free, in your browser, no upload.',
              description_bn: data.sections.removeAiLabel.description_bn || 'ছবি থেকে AI লেবেল ও মেটাডেটা (C2PA, EXIF, XMP) মুছে ফেলুন — ফ্রি, ব্রাউজারেই, কোনো আপলোড ছাড়াই।',
              icon: data.sections.removeAiLabel.icon || 'ShieldCheck',
              enabled: data.sections.removeAiLabel.enabled !== false,
            });
          }
        }
        if (data.policies) setPolicies(data.policies);
        if (data.guides) setGuides(data.guides);
        if (data.faq) setFaqItems(data.faq);
        if (data.contentTexts) setContentTexts(data.contentTexts);
        if (data.analytics) setAnalytics(data.analytics);
        if (data.periodicAnalytics) setPeriodicAnalytics(data.periodicAnalytics);

        try {
          const now = new Date();
          const dStr = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Dhaka',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          }).format(now);
          setLastUpdatedTime(`${dStr} (Asia/Dhaka)`);
        } catch {
          setLastUpdatedTime(new Date().toLocaleTimeString());
        }
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
      const isAuthSession = sessionStorage.getItem('toolghor_admin_auth');
      const isAuthLocal = localStorage.getItem('toolghor_admin_auth');
      if (isAuthSession === 'true' || isAuthLocal === 'true') {
        setIsAuthenticated(true);
        fetchAllSections();
      }
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab') as MenuTab;
        const validTabs: MenuTab[] = ['overview', 'hero', 'announcement', 'categories', 'tools', 'guides', 'faq', 'footer', 'creator', 'apis', 'policies', 'analytics', 'profile'];
        if (tabParam && validTabs.includes(tabParam)) {
          setActiveTab(tabParam);
        }
      }
    } catch {}
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cleanPin = pin.trim();
    if (!cleanPin) {
      setPinError(true);
      setPinErrorMsg('Please enter your passcode.');
      return;
    }
    setLoginLoading(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', passcode: cleanPin, remember: rememberMe }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        try {
          sessionStorage.setItem('toolghor_admin_auth', 'true');
          if (rememberMe) {
            localStorage.setItem('toolghor_admin_auth', 'true');
            localStorage.setItem('toolghor_admin_remember', 'true');
          } else {
            localStorage.removeItem('toolghor_admin_auth');
            localStorage.removeItem('toolghor_admin_remember');
          }
        } catch {}
        setIsAuthenticated(true);
        setPinError(false);
        setPinErrorMsg('');
        if (data.admin) {
          setAdminProfile((prev) => ({ ...prev, ...data.admin }));
        }
        fetchAllSections();
      } else {
        setPinError(true);
        setPinErrorMsg(data?.message || data?.error || 'Incorrect passcode. Please try again or use Forgot Password.');
      }
    } catch {
      setPinError(true);
      setPinErrorMsg('Network connection error. Please try again.');
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

  const handleOpenForgotModal = async () => {
    const targetEmail = 'ashifur.badhon@gmail.com';
    setShowForgotModal(true);
    setForgotStep('enter_code');
    setForgotEmail(targetEmail);
    setForgotTargetMasked(targetEmail);
    setForgotOtp('');
    setForgotNewPass('');
    setForgotConfirmPass('');
    setForgotResetToken('');
    setForgotChallengeId('');
    setForgotAttemptsRemaining(null);
    setForgotCooldown(0);
    setForgotLoading(true);
    setForgotMsg({ type: 'success', text: 'Sending 6-digit verification code to ashifur.badhon@gmail.com...' });

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'forgot_password_send_otp',
          email: targetEmail,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setForgotChallengeId(data.challengeId || '');
        setForgotTargetMasked(data.targetMasked || targetEmail);
        setForgotCooldown(data.resendCooldownSeconds || 60);
        setForgotMsg({ type: 'success', text: 'Verification code sent to ashifur.badhon@gmail.com!' });
      } else {
        setForgotMsg({ type: 'error', text: data.message || 'Failed to dispatch verification code.' });
      }
    } catch {
      setForgotMsg({ type: 'error', text: 'Network error sending verification code.' });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResendForgotOtp = async () => {
    if (forgotCooldown > 0 || forgotLoading) return;
    setForgotLoading(true);
    setForgotMsg(null);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: forgotChallengeId ? 'resend_otp' : 'forgot_password_send_otp',
          challengeId: forgotChallengeId,
          email: 'ashifur.badhon@gmail.com',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.challengeId) setForgotChallengeId(data.challengeId);
        setForgotCooldown(data.resendCooldownSeconds || 60);
        setForgotOtp('');
        setForgotAttemptsRemaining(null);
        setForgotMsg({ type: 'success', text: 'New verification code sent to ashifur.badhon@gmail.com!' });
      } else {
        setForgotMsg({ type: 'error', text: data.message || 'Failed to resend code.' });
        if (data.resendCooldownSeconds) {
          setForgotCooldown(data.resendCooldownSeconds);
        }
      }
    } catch {
      setForgotMsg({ type: 'error', text: 'Network error resending code.' });
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
          challengeId: forgotChallengeId,
          otp: cleanOtp,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.resetToken) {
        setForgotResetToken(data.resetToken);
        setForgotMsg({ type: 'success', text: 'Code verified! Now set your new password.' });
        setForgotStep('set_password');
      } else {
        setForgotMsg({ type: 'error', text: data.message || 'Invalid or expired verification code.' });
        if (typeof data.attemptsRemaining === 'number') {
          setForgotAttemptsRemaining(data.attemptsRemaining);
        }
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
    if (!forgotNewPass || forgotNewPass.length < 8) {
      setForgotMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
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
          challengeId: forgotChallengeId,
          resetToken: forgotResetToken,
          new_passcode: forgotNewPass.trim(),
          confirm_passcode: forgotConfirmPass.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Password has been successfully updated! You can now log in.');
        setShowForgotModal(false);
        setPin('');
        setForgotStep('email');
        setForgotEmail('');
        setForgotOtp('');
        setForgotNewPass('');
        setForgotConfirmPass('');
        setForgotResetToken('');
        setForgotChallengeId('');
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
      fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      }).catch(() => {});
      sessionStorage.removeItem('toolghor_admin_auth');
      localStorage.removeItem('toolghor_admin_auth');
      localStorage.removeItem('toolghor_admin_remember');
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
      if (res.status === 401) {
        handleLogout();
        return false;
      }
      if (res.ok) {
        showNotification(successMessage);
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          try {
            const ch = new BroadcastChannel('toolghor_sync');
            ch.postMessage('refresh');
            setTimeout(() => ch.close(), 200);
          } catch {}
        }
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

  // 4b. Remove AI Label Tool Section Updates (Isolated Table: section_tool_remove_ai_label)
  const saveRemoveAiLabel = async (updatedData: RemoveAiLabelToolSection) => {
    setSavingRemoveAiLabel(true);
    setRemoveAiLabel(updatedData);
    await postApi('update_remove_ai_label', updatedData, 'Remove AI Label tool info updated successfully!');
    setSavingRemoveAiLabel(false);
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

  // 6b. Global Content Texts Updates (FAQ headers, Guides headers, Policy headers, Home labels, etc.)
  const saveContentTexts = async (updated: ContentTexts, label: string = 'Content texts') => {
    setSavingContentTexts(true);
    setContentTexts(updated);
    await postApi('update_content_texts', updated, `${label} saved successfully!`);
    setSavingContentTexts(false);
  };

  // 7. API Keys Updates
  const saveApiKeys = async (updated: ApiKeysSection) => {
    // Safety guard: ensure no masked display strings or admin passcodes are saved into keys
    const safePayload: any = { ...updated };
    ['gemini_key', 'convertapi_token', 'removebg_key', 'openai_key', 'ilovepdf_secret_key', 'ilovepdf_public_key'].forEach((k) => {
      if (typeof safePayload[k] === 'string') {
        if (safePayload[k].startsWith('••') || safePayload[k].includes('••••')) {
          safePayload[k] = undefined;
        } else if (safePayload[k].trim() === '277226@Asif') {
          safePayload[k] = '';
        }
      }
    });
    setApiKeys(safePayload);
    await postApi('update_api_keys', safePayload, 'API Credentials saved!');
  };

  // 8. Policy Sections Updates (Per-section table isolation)
  const savePolicySection = async (sectionKey: string) => {
    const sec = policies[sectionKey];
    if (!sec) return;
    setSavingPolicies((prev) => ({ ...prev, [sectionKey]: true }));
    try {
      const ok = await postApi(
        'update_policy_section',
        {
          section: sectionKey,
          title_en: sec.title_en,
          title_bn: sec.title_bn,
          body_en: sec.body_en,
          body_bn: sec.body_bn,
        },
        `Policy section "${sec.title_en}" saved successfully!`
      );
      if (ok) {
        setPolicySaveStatus((prev) => ({ ...prev, [sectionKey]: 'saved' }));
        setTimeout(() => {
          setPolicySaveStatus((prev) => ({ ...prev, [sectionKey]: null }));
        }, 3500);
      } else {
        setPolicySaveStatus((prev) => ({ ...prev, [sectionKey]: 'error' }));
        setTimeout(() => {
          setPolicySaveStatus((prev) => ({ ...prev, [sectionKey]: null }));
        }, 3500);
      }
    } catch {
      setPolicySaveStatus((prev) => ({ ...prev, [sectionKey]: 'error' }));
      setTimeout(() => {
        setPolicySaveStatus((prev) => ({ ...prev, [sectionKey]: null }));
      }, 3500);
    } finally {
      setSavingPolicies((prev) => ({ ...prev, [sectionKey]: false }));
    }
  };

  // 9. Guides Save Handler (Single-guide row isolation)
  const saveGuide = async (slug: string) => {
    const guide = guides.find((g) => g.slug === slug);
    if (!guide) return;
    setSavingGuide((prev) => ({ ...prev, [slug]: true }));
    try {
      const ok = await postApi('update_guide', guide, `Guide "${guide.title_en}" saved successfully!`);
      if (ok) {
        setGuideSaveStatus((prev) => ({ ...prev, [slug]: 'saved' }));
        setTimeout(() => setGuideSaveStatus((prev) => ({ ...prev, [slug]: null })), 3500);
      } else {
        setGuideSaveStatus((prev) => ({ ...prev, [slug]: 'error' }));
        setTimeout(() => setGuideSaveStatus((prev) => ({ ...prev, [slug]: null })), 3500);
      }
    } catch {
      setGuideSaveStatus((prev) => ({ ...prev, [slug]: 'error' }));
      setTimeout(() => setGuideSaveStatus((prev) => ({ ...prev, [slug]: null })), 3500);
    } finally {
      setSavingGuide((prev) => ({ ...prev, [slug]: false }));
    }
  };

  // 10. FAQ Scope Save Handler (Single-scope isolation)
  const saveFaqScope = async (scope: string) => {
    const items = faqItems.filter((f) => f.scope === scope);
    setSavingFaqScope(true);
    try {
      const ok = await postApi('update_faq_scope', { scope, items }, `FAQ scope "${scope}" (${items.length} questions) saved successfully!`);
      if (ok) {
        setFaqScopeSaveStatus('saved');
        setTimeout(() => setFaqScopeSaveStatus(null), 3500);
      } else {
        setFaqScopeSaveStatus('error');
        setTimeout(() => setFaqScopeSaveStatus(null), 3500);
      }
    } catch {
      setFaqScopeSaveStatus('error');
      setTimeout(() => setFaqScopeSaveStatus(null), 3500);
    } finally {
      setSavingFaqScope(false);
    }
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

  const hasRemoveAiInTools = (tools || []).some((t) => t.slug === 'remove-ai-label');
  const activeToolsCount = (tools || []).filter((t) => t.is_active).length + (!hasRemoveAiInTools && removeAiLabel.enabled ? 1 : 0);
  const totalToolsCount = (tools || []).length + (!hasRemoveAiInTools ? 1 : 0);
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
      <div style={{ minHeight: '100vh', background: 'transparent', display: 'grid', placeItems: 'center', padding: '16px', color: '#f1f5f9', position: 'relative' }}>
        <div
          style={{
            background: 'rgba(19, 24, 36, 0.78)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '36px 22px',
            width: '100%',
            maxWidth: '420px',
            boxSizing: 'border-box',
            boxShadow: '0 25px 60px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(16, 185, 129, 0.15)',
            textAlign: 'center',
            position: 'relative',
            zIndex: 10,
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
          <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em', color: '#f8fafc', wordBreak: 'break-word' }}>
            ToolGhor Admin Console
          </h1>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: '0 0 24px', lineHeight: 1.5, wordBreak: 'break-word' }}>
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
                boxSizing: 'border-box',
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
              <p style={{ color: '#ef4444', fontSize: '12.5px', margin: '-6px 0 12px', textAlign: 'left', wordBreak: 'break-word' }}>
                {pinErrorMsg || 'Incorrect passcode. Please try again or use Forgot Password.'}
              </p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#94a3b8',
                  userSelect: 'none',
                  wordBreak: 'break-word',
                }}
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#10b981', width: '16px', height: '16px', cursor: 'pointer', flexShrink: 0 }}
                />
                <span>Remember me on this browser</span>
              </label>
            </div>

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
              onClick={handleOpenForgotModal}
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
                background: 'rgba(19, 24, 36, 0.88)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '20px',
                padding: '28px 20px',
                width: '100%',
                maxWidth: '440px',
                boxSizing: 'border-box',
                boxShadow: '0 25px 60px rgba(0,0,0,0.75), 0 0 0 1px rgba(16, 185, 129, 0.2)',
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
                  {forgotStep === 'enter_code' ? 'Enter Verification Code' : 'Create New Password'}
                </h2>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                  {forgotStep === 'enter_code'
                    ? 'A 6-digit verification code was sent to ashifur.badhon@gmail.com.'
                    : 'Enter and confirm your new admin password (minimum 8 characters).'}
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

              {/* 2-Step Progress Indicators */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                <div
                  style={{
                    padding: '5px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: forgotStep === 'enter_code' ? '#10b981' : 'rgba(16, 185, 129, 0.2)',
                    color: forgotStep === 'enter_code' ? '#ffffff' : '#34d399',
                  }}
                >
                  1. Verify OTP
                </div>
                <div style={{ width: '16px', height: '1px', background: '#334155' }} />
                <div
                  style={{
                    padding: '5px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: forgotStep === 'set_password' ? '#10b981' : '#1e293b',
                    color: forgotStep === 'set_password' ? '#ffffff' : '#94a3b8',
                  }}
                >
                  2. New Password
                </div>
              </div>

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
                      Verification code sent to registered email:
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>
                      {forgotTargetMasked || forgotEmail || adminProfile.email}
                    </div>
                    {forgotAttemptsRemaining !== null && forgotAttemptsRemaining < 5 && (
                      <div style={{ fontSize: '12px', color: '#f87171', marginTop: '4px', fontWeight: 600 }}>
                        {forgotAttemptsRemaining} attempt{forgotAttemptsRemaining === 1 ? '' : 's'} remaining
                      </div>
                    )}
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
                        boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ fontSize: '11.5px', color: '#94a3b8', textAlign: 'center', marginTop: '6px' }}>
                      Please check your inbox (and spam folder) for the 6-digit code.
                    </div>
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
                      onClick={handleResendForgotOtp}
                      disabled={forgotLoading || forgotCooldown > 0}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: forgotCooldown > 0 ? '#64748b' : '#38bdf8',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: forgotCooldown > 0 ? 'not-allowed' : 'pointer',
                        textDecoration: forgotCooldown > 0 ? 'none' : 'underline',
                      }}
                    >
                      {forgotCooldown > 0
                        ? `Resend code in ${forgotCooldown}s`
                        : "Didn't receive code? Resend OTP"}
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
                      New Admin Password (Min. 8 characters)
                    </label>
                    <input
                      type="password"
                      autoFocus
                      placeholder="Enter minimum 8 characters..."
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
                        boxSizing: 'border-box',
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
                        boxSizing: 'border-box',
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
    <div style={{ minHeight: '100vh', background: 'transparent', color: '#e2e8f0', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar */}
      {/* Top Bar */}
      <header className="admin-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Mobile Hamburger Drawer Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="admin-hamburger-btn"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <picture>
              <source type="image/webp" data-cfg="logoDarkWebp" srcSet="/assets/logo-dark.webp" media="(prefers-color-scheme: dark)" />
              <source data-cfg="logoDark" srcSet="/assets/logo-dark.png" media="(prefers-color-scheme: dark)" />
              <img src="/assets/logo.png" alt="ToolGhor" style={{ height: '30px', width: 'auto' }} />
            </picture>
          </Link>
          <span
            className="admin-header-logo-text"
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
            ADMIN
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Cloud Database Live Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              padding: '5px 10px',
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
                flexShrink: 0,
              }}
            />
            <span className="admin-hide-mobile">{dbConnected ? 'Neon Cloud DB Connected' : 'DB Disconnected'}</span>
            <span className="admin-show-mobile" style={{ fontSize: '11px' }}>{dbConnected ? 'Live' : 'Off'}</span>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchAllSections}
            disabled={loadingData}
            title="Sync live data from database"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#1f2937',
              color: '#e2e8f0',
              border: '1px solid #374151',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <RefreshCw size={14} className={loadingData ? 'animate-spin' : ''} />
            <span className="admin-hide-mobile">{loadingData ? 'Syncing...' : 'Sync'}</span>
          </button>

          {/* View Website Link */}
          <Link
            href="/"
            target="_blank"
            title="Open live website in new tab"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <ExternalLink size={14} />
            <span className="admin-hide-mobile">Live Site</span>
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
              padding: '6px 8px',
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

      {/* Fallback Auth Secret Warning Banner */}
      {isAuthSecretDerived && !fallbackBannerDismissed && (
        <div
          role="alert"
          style={{
            background: 'rgba(234, 179, 8, 0.12)',
            borderBottom: '1px solid rgba(234, 179, 8, 0.35)',
            color: '#fef08a',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            fontSize: '13px',
            lineHeight: 1.4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} style={{ color: '#facc15', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600 }}>
                AUTH_SECRET is not set — admin sessions use a derived fallback. Set AUTH_SECRET in Vercel env vars for full security.
              </div>
              {/* AUTH_SECRET সেট করা নেই — অ্যাডমিন সেশনে ডিরাইভড ফলব্যাক ব্যবহার করা হচ্ছে। পূর্ণ নিরাপত্তার জন্য Vercel env vars-এ AUTH_SECRET সেট করুন। */}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFallbackBannerDismissed(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fef08a',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              opacity: 0.8,
            }}
            title="Dismiss"
            aria-label="Dismiss warning"
          >
            <X size={16} />
          </button>
        </div>
      )}

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
      <div className="admin-workspace-wrap">
        {/* Mobile Backdrop */}
        {mobileMenuOpen && (
          <div
            className="admin-sidebar-backdrop"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* ================= LEFT SIDEBAR ================= */}
        <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
          <div>
            <div style={{ padding: '0 10px 14px', borderBottom: '1px solid #1f2937', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', fontWeight: 700 }}>
                Navigation Menu
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="admin-sidebar-close-btn"
                aria-label="Close menu"
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { id: 'overview', label: 'Dashboard Overview', icon: BarChart3 },
                { id: 'announcement', label: 'Announcement Banner', icon: Bell },
                { id: 'hero', label: 'Hero Section', icon: Sliders },
                { id: 'categories', label: 'Categories Manager', icon: Layers, badge: categories.length },
                { id: 'tools', label: 'Tools Manager', icon: Wrench, badge: tools.length },
                { id: 'creator', label: 'Creator Profile', icon: User },
                { id: 'footer', label: 'Footer & WhatsApp', icon: MessageSquare },
                { id: 'guides', label: 'Guides Manager', icon: BookOpen, badge: guides.length },
                { id: 'faq', label: 'FAQ Manager', icon: HelpCircle, badge: faqItems.length },
                { id: 'policies', label: 'Terms & Policies', icon: FileText, badge: '9' },
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
                    onClick={() => {
                      setActiveTab(item.id as MenuTab);
                      setMobileMenuOpen(false);
                      if (typeof window !== 'undefined') {
                        const vp = document.querySelector('.admin-main-viewport');
                        if (vp) vp.scrollTop = 0;
                        window.scrollTo({ top: 0, behavior: 'instant' });
                      }
                    }}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: '1 1 auto' }}>
                      <Icon size={17} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
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
                          flexShrink: 0,
                          marginLeft: '8px',
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
              marginTop: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#64748b' }}>Active Tools:</span>
              <strong style={{ color: '#10b981' }}>{activeToolsCount} / {totalToolsCount}</strong>
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
        <main className="admin-main-viewport">
          {/* Quick Mobile Horizontal Category / Tab Scroller */}
          <div className="admin-mobile-tab-scroller">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'announcement', label: 'Banner' },
              { id: 'hero', label: 'Hero' },
              { id: 'categories', label: `Categories (${categories.length})` },
              { id: 'tools', label: `Tools (${tools.length})` },
              { id: 'creator', label: 'Creator' },
              { id: 'footer', label: 'Footer & WhatsApp' },
              { id: 'guides', label: `Guides (${guides.length})` },
              { id: 'faq', label: `FAQ (${faqItems.length})` },
              { id: 'policies', label: 'Policies (9)' },
              { id: 'apis', label: 'APIs' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'profile', label: 'Security' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as MenuTab);
                  if (typeof window !== 'undefined') {
                    const vp = document.querySelector('.admin-main-viewport');
                    if (vp) vp.scrollTop = 0;
                    window.scrollTo({ top: 0, behavior: 'instant' });
                  }
                }}
                className={`admin-mobile-pill ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* TAB 1: OVERVIEW (RESTYLED MODERN SAAS ANALYTICS DASHBOARD) */}
          {activeTab === 'overview' && (() => {
            const getToolCount = (slug: string) => {
              if (usagePeriod === 'all') return Number(analytics[slug] || 0);
              const p = periodicAnalytics[slug];
              if (!p) return 0;
              if (usagePeriod === 'this_month') return p.this_month;
              if (usagePeriod === 'last_month') return p.last_month;
              if (usagePeriod === 'this_week') return p.this_week;
              if (usagePeriod === 'last_week') return p.last_week;
              return Number(analytics[slug] || 0);
            };

            const periodNames: Record<string, string> = {
              all: 'All Time',
              this_month: 'This Month',
              last_month: 'Last Month',
              this_week: 'This Week',
              last_week: 'Last Week',
            };

            const totalLifetimeUses = Object.values(analytics).reduce((a, b) => a + Number(b || 0), 0);
            const sortedTools = [...tools]
              .map((t) => ({ ...t, count: getToolCount(t.slug) }))
              .sort((a, b) => b.count - a.count);
            const topTool = sortedTools[0];
            const topToolsList = sortedTools.slice(0, 5);
            const chartTools = sortedTools.slice(0, 10);
            const maxChartCount = Math.max(...chartTools.map((t) => t.count), 1);
            const totalUsesForPeriod = sortedTools.reduce((a, b) => a + b.count, 0);
            const activeToolsLive = tools.filter((t) => t.is_active).length;
            const activeCatsLive = categories.filter((c) => c.is_active).length;

            return (
              <div>
                {/* 1 — Meta Row */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '26px',
                    flexWrap: 'wrap',
                    gap: '12px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid #1f2937',
                  }}
                >
                  <div>
                    <h1
                      style={{
                        fontSize: '24px',
                        fontWeight: 800,
                        margin: '0 0 4px',
                        color: '#f8fafc',
                        letterSpacing: '-0.02em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <BarChart3 size={22} style={{ color: '#10b981' }} />
                      <span>Platform Overview</span>
                    </h1>
                    <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: 0 }}>
                      Live usage analytics, platform tool health, and infrastructure status.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      Last updated:{' '}
                      <strong style={{ color: '#94a3b8', fontWeight: 600 }}>
                        {lastUpdatedTime || 'Just now'}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={fetchAllSections}
                      disabled={loadingData}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        background: '#1f2937',
                        border: '1px solid #374151',
                        color: '#f8fafc',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: loadingData ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <RefreshCw size={14} className={loadingData ? 'animate-spin' : ''} />
                      <span>{loadingData ? 'Refreshing...' : 'Refresh'}</span>
                    </button>
                  </div>
                </div>

                <AccordionSectionCard
                  id="overview-live-home"
                  title="Platform Key Metrics & Platform Overview"
                  badge="Overview"
                  collapsible={true}
                  isExpanded={isSectionExpanded('overview-live-home')}
                  onToggle={() => toggleSection('overview-live-home')}
                >
                {/* 2 — KPI Card Row (3 Cards: Total Tool Uses, Most Used Tool, Active Tools) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '16px',
                    marginBottom: '28px',
                  }}
                >
                  {/* Card 1: Total Tool Uses */}
                  <div
                    style={{
                      background: '#111827',
                      border: '1px solid #1f2937',
                      borderRadius: '16px',
                      padding: '22px',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: '12px',
                          color: '#94a3b8',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        Total Tool Uses
                      </span>
                      <div
                        style={{
                          fontSize: '34px',
                          fontWeight: 900,
                          color: '#f8fafc',
                          margin: '8px 0 4px',
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {totalLifetimeUses.toLocaleString()}
                      </div>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>all time lifetime</span>
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        right: '18px',
                        bottom: '18px',
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#10b981',
                      }}
                    >
                      <Zap size={18} />
                    </div>
                  </div>

                  {/* Card 2: Most Used Tool */}
                  <div
                    style={{
                      background: '#111827',
                      border: '1px solid #1f2937',
                      borderRadius: '16px',
                      padding: '22px',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                    }}
                  >
                    <div style={{ paddingRight: '40px' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          color: '#94a3b8',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        #1 Top Tool ({periodNames[usagePeriod]})
                      </span>
                      <div
                        title={topTool?.title_en || 'None yet'}
                        style={{
                          fontSize: '20px',
                          fontWeight: 800,
                          color: '#38bdf8',
                          margin: '8px 0 4px',
                          letterSpacing: '-0.01em',
                          lineHeight: 1.3,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          wordBreak: 'break-word',
                        }}
                      >
                        {topTool ? topTool.title_en : 'None yet'}
                      </div>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {(topTool?.count || 0).toLocaleString()} uses in {periodNames[usagePeriod]}
                      </span>
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        right: '18px',
                        bottom: '18px',
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#38bdf8',
                      }}
                    >
                      <Sparkles size={18} />
                    </div>
                  </div>

                  {/* Card 3: Active Tools */}
                  <div
                    style={{
                      background: '#111827',
                      border: '1px solid #1f2937',
                      borderRadius: '16px',
                      padding: '22px',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: '12px',
                          color: '#94a3b8',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        Active Tools
                      </span>
                      <div
                        style={{
                          fontSize: '34px',
                          fontWeight: 900,
                          color: '#a855f7',
                          margin: '8px 0 4px',
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {activeToolsLive}
                      </div>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        across {activeCatsLive} categories
                      </span>
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        right: '18px',
                        bottom: '18px',
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: 'rgba(168, 85, 247, 0.12)',
                        border: '1px solid rgba(168, 85, 247, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#a855f7',
                      }}
                    >
                      <Wrench size={18} />
                    </div>
                  </div>
                </div>

                {/* 3 — Chart Card "Usage by Tool" */}
                <div
                  style={{
                    background: '#111827',
                    border: '1px solid #1f2937',
                    borderRadius: '18px',
                    padding: '24px',
                    marginBottom: '28px',
                    boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '20px',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                          Usage by Tool
                        </h2>
                        <span
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                          }}
                        >
                          {periodNames[usagePeriod]}
                        </span>
                      </div>
                      <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '4px 0 0' }}>
                        Top {chartTools.length} tools ranked by {periodNames[usagePeriod].toLowerCase()} launches ({totalUsesForPeriod.toLocaleString()} total)
                      </p>
                    </div>

                    {/* Time Period Filter Tabs */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#0b0f19',
                        border: '1px solid #1f2937',
                        padding: '4px',
                        borderRadius: '10px',
                        flexWrap: 'wrap',
                      }}
                    >
                      {(
                        [
                          { id: 'all', label: 'All Time' },
                          { id: 'this_month', label: 'This Month' },
                          { id: 'last_month', label: 'Last Month' },
                          { id: 'this_week', label: 'This Week' },
                          { id: 'last_week', label: 'Last Week' },
                        ] as const
                      ).map((period) => {
                        const isCurrent = usagePeriod === period.id;
                        return (
                          <button
                            key={period.id}
                            type="button"
                            onClick={() => setUsagePeriod(period.id)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '7px',
                              border: isCurrent ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
                              background: isCurrent ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                              color: isCurrent ? '#10b981' : '#94a3b8',
                              fontWeight: isCurrent ? 700 : 500,
                              fontSize: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {period.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary Callout Banner for Current Selected Period */}
                  <div
                    style={{
                      background: 'rgba(11, 15, 25, 0.65)',
                      border: '1px solid #1e293b',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                      fontSize: '12.5px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px' }}>🏆</span>
                      <span style={{ color: '#94a3b8' }}>
                        Top tool in <strong style={{ color: '#f8fafc' }}>{periodNames[usagePeriod]}</strong>:
                      </span>
                      <strong style={{ color: '#38bdf8' }}>{topTool ? topTool.title_en : 'None'}</strong>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>
                        ({(topTool?.count || 0).toLocaleString()} uses)
                      </span>
                    </div>

                    {hoveredBar && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#cbd5e1' }}>
                        <span>Focused: <strong>{hoveredBar.name}</strong></span>
                        <span style={{ color: '#10b981', fontWeight: 800 }}>{hoveredBar.count.toLocaleString()} uses</span>
                      </div>
                    )}
                  </div>

                  {totalUsesForPeriod === 0 ? (
                    <div
                      style={{
                        padding: '60px 20px',
                        textAlign: 'center',
                        color: '#64748b',
                        fontSize: '14px',
                      }}
                    >
                      No tool usage recorded for {periodNames[usagePeriod]}
                    </div>
                  ) : (
                    <div style={{ position: 'relative', width: '100%', overflowX: 'auto', paddingTop: '10px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-end',
                          justifyContent: 'space-between',
                          gap: '12px',
                          height: '220px',
                          minWidth: '600px',
                          borderBottom: '1px solid #334155',
                          paddingBottom: '2px',
                          position: 'relative',
                        }}
                      >
                        {/* Soft horizontal grid lines */}
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: '25%',
                            borderTop: '1px dashed rgba(51, 65, 85, 0.4)',
                            pointerEvents: 'none',
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: '50%',
                            borderTop: '1px dashed rgba(51, 65, 85, 0.4)',
                            pointerEvents: 'none',
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: '75%',
                            borderTop: '1px dashed rgba(51, 65, 85, 0.4)',
                            pointerEvents: 'none',
                          }}
                        />

                        {chartTools.map((t) => {
                          const heightPct = Math.max((t.count / maxChartCount) * 100, 3);
                          const isHovered = hoveredBar?.name === t.title_en;

                          return (
                            <div
                              key={t.slug}
                              onMouseEnter={() => setHoveredBar({ name: t.title_en, count: t.count })}
                              onMouseLeave={() => setHoveredBar(null)}
                              onTouchStart={() => setHoveredBar({ name: t.title_en, count: t.count })}
                              style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                height: '100%',
                                justifyContent: 'flex-end',
                                cursor: 'pointer',
                                position: 'relative',
                              }}
                            >
                              {/* Animated Bar with emerald->cyan gradient */}
                              <div
                                style={{
                                  width: '100%',
                                  maxWidth: '38px',
                                  height: `${heightPct}%`,
                                  background: isHovered
                                    ? 'linear-gradient(180deg, #38bdf8 0%, #10b981 100%)'
                                    : 'linear-gradient(180deg, #10b981 0%, #06b6d4 100%)',
                                  borderRadius: '6px 6px 0 0',
                                  transition: 'height 0.4s ease, filter 0.15s ease',
                                  filter: isHovered ? 'brightness(1.2)' : 'none',
                                  boxShadow: isHovered
                                    ? '0 0 16px rgba(16, 185, 129, 0.4)'
                                    : '0 2px 8px rgba(0, 0, 0, 0.2)',
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Tool Names Row */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '12px',
                          minWidth: '600px',
                          marginTop: '8px',
                        }}
                      >
                        {chartTools.map((t) => (
                          <div
                            key={t.slug}
                            style={{
                              flex: 1,
                              textAlign: 'center',
                              fontSize: '11px',
                              color: hoveredBar?.name === t.title_en ? '#38bdf8' : '#94a3b8',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '56px',
                              fontWeight: 600,
                            }}
                            title={t.title_en}
                          >
                            {t.title_en.split(' ')[0]}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4 — Bottom Section: Clean Full-Width Quick Status (Top Tools removed as requested) */}
                <div
                  style={{
                    background: '#111827',
                    border: '1px solid #1f2937',
                    borderRadius: '18px',
                    padding: '24px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                      Platform Quick Status
                    </h2>
                    <span style={{ fontSize: '12.5px', color: '#10b981', fontWeight: 600 }}>
                      ● All systems operational
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                    {/* Notice Banner Status */}
                    <div
                      style={{
                        background: '#0b0f19',
                        border: '1px solid #1e293b',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '6px',
                          }}
                        >
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#cbd5e1' }}>
                            Notice Banner
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '999px',
                              background: announcement.is_active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                              color: announcement.is_active ? '#34d399' : '#94a3b8',
                              border: `1px solid ${announcement.is_active ? 'rgba(16, 185, 129, 0.4)' : '#334155'}`,
                            }}
                          >
                            {announcement.is_active ? '✓ Active' : '— Inactive'}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: '12px',
                            color: '#64748b',
                            margin: '0 0 8px',
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            wordBreak: 'break-word',
                          }}
                          title={announcement.text_en || announcement.text_bn}
                        >
                          {announcement.text_en || announcement.text_bn || 'No announcement set'}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #1e293b' }}>
                        <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                          Duration: <strong style={{ color: '#f8fafc' }}>{announcement.duration_days ? (announcement.duration_days === 'unlimited' ? 'Unlimited' : `${announcement.duration_days} Days`) : 'Unlimited'}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveTab('announcement')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#10b981',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                        >
                          Edit Banner →
                        </button>
                      </div>
                    </div>

                    {/* API Integrations Status */}
                    <div
                      style={{
                        background: '#0b0f19',
                        border: '1px solid #1e293b',
                        borderRadius: '12px',
                        padding: '14px 16px',
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px' }}>
                        Cloud API Integrations
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: apiKeys.removebg_active && apiKeys.removebg_key ? '#10b981' : '#64748b', fontWeight: 700 }}>
                            {apiKeys.removebg_active && apiKeys.removebg_key ? '✓' : '—'}
                          </span>
                          <span style={{ color: '#94a3b8' }}>remove.bg</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: apiKeys.convertapi_active && apiKeys.convertapi_token ? '#10b981' : '#64748b', fontWeight: 700 }}>
                            {apiKeys.convertapi_active && apiKeys.convertapi_token ? '✓' : '—'}
                          </span>
                          <span style={{ color: '#94a3b8' }}>ConvertAPI</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: apiKeys.ilovepdf_active && (apiKeys.ilovepdf_public_key || apiKeys.ilovepdf_secret_key) ? '#10b981' : '#64748b', fontWeight: 700 }}>
                            {apiKeys.ilovepdf_active && (apiKeys.ilovepdf_public_key || apiKeys.ilovepdf_secret_key) ? '✓' : '—'}
                          </span>
                          <span style={{ color: '#94a3b8' }}>iLovePDF</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: apiKeys.gemini_active && apiKeys.gemini_key ? '#10b981' : '#64748b', fontWeight: 700 }}>
                            {apiKeys.gemini_active && apiKeys.gemini_key ? '✓' : '—'}
                          </span>
                          <span style={{ color: '#94a3b8' }}>Gemini / OpenAI</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Link Buttons to Existing Editors */}
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                      Quick Management Shortcuts
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setActiveTab('hero')}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          background: '#1f2937',
                          border: '1px solid #374151',
                          color: '#e2e8f0',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Hero Section
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('tools')}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          background: '#1f2937',
                          border: '1px solid #374151',
                          color: '#e2e8f0',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Tools Manager ({tools.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('policies')}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          background: '#1f2937',
                          border: '1px solid #374151',
                          color: '#e2e8f0',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Terms &amp; Policies (9)
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('announcement')}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          background: '#1f2937',
                          border: '1px solid #374151',
                          color: '#e2e8f0',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Announcement Banner
                      </button>
                    </div>
                  </div>
                </div>
                </AccordionSectionCard>
              </div>
            );
          })()}

          {/* TAB 2: HERO SECTION */}
          {activeTab === 'hero' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: '#f8fafc', wordBreak: 'break-word' }}>
                    Hero Section Manager
                  </h1>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, wordBreak: 'break-word' }}>
                    Configure the main website header tagline, search box placeholders, and visibility.
                  </p>
                </div>
                {/* Active / Inactive Toggle Switch & Accordion Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, flexWrap: 'wrap' }}>
                  {renderAccordionControls(['hero-taglines-card', 'hero-controls-card'])}
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

              <AccordionSectionCard
                id="hero-taglines-card"
                title="Hero Taglines & Search Box"
                badge={hero.is_active ? 'Active' : 'Inactive'}
                collapsible={true}
                isExpanded={isSectionExpanded('hero-taglines-card')}
                onToggle={() => toggleSection('hero-taglines-card')}
                previewUrl="/"
                previewAnchor="#hero-section"
                draftData={currentDraftData}
              >
              <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '20px 16px' }}>
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
                        boxSizing: 'border-box',
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
                        boxSizing: 'border-box',
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
                        boxSizing: 'border-box',
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
                        boxSizing: 'border-box',
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
              </AccordionSectionCard>

              <AccordionSectionCard
                id="hero-controls-card"
                title="Homepage Section Controls & Search Labels"
                badge="Homepage Controls"
                collapsible={true}
                isExpanded={isSectionExpanded('hero-controls-card')}
                onToggle={() => toggleSection('hero-controls-card')}
                previewUrl="/"
                previewAnchor="#hero-section"
                draftData={currentDraftData}
              >
              <SectionTextsEditor
                title="Homepage Section Controls & Search Labels"
                description="Edit the filter buttons, category header, expand/collapse toggles, and empty search message on the homepage."
                badge="Homepage Controls"
                saving={savingContentTexts}
                fields={[
                  {
                    key: 'all_tools_chip',
                    label: '"All Tools" Chip Label',
                    valueEn: contentTexts.home?.all_tools_chip_en || '',
                    valueBn: contentTexts.home?.all_tools_chip_bn || '',
                    placeholderEn: 'All (Expand All)',
                    placeholderBn: 'সব টুলস (সব খুলুন)',
                  },
                  {
                    key: 'categories_label',
                    label: 'Categories Section Heading',
                    valueEn: contentTexts.home?.categories_label_en || '',
                    valueBn: contentTexts.home?.categories_label_bn || '',
                    placeholderEn: 'Categories',
                    placeholderBn: 'ক্যাটাগরি',
                  },
                  {
                    key: 'expand_all',
                    label: 'Expand All Button Label',
                    valueEn: contentTexts.home?.expand_all_en || '',
                    valueBn: contentTexts.home?.expand_all_bn || '',
                    placeholderEn: 'Expand All',
                    placeholderBn: 'সব খুলুন',
                  },
                  {
                    key: 'collapse_all',
                    label: 'Collapse All Button Label',
                    valueEn: contentTexts.home?.collapse_all_en || '',
                    valueBn: contentTexts.home?.collapse_all_bn || '',
                    placeholderEn: 'Collapse All',
                    placeholderBn: 'সব বন্ধ করুন',
                  },
                  {
                    key: 'empty_search',
                    label: 'Empty Search Results Message',
                    valueEn: contentTexts.home?.empty_search_en || '',
                    valueBn: contentTexts.home?.empty_search_bn || '',
                    placeholderEn: 'No tool found. Try a different word, or click "Request a Tool" at the top to suggest one.',
                    placeholderBn: 'কোনো টুল পাওয়া যায়নি। অন্য শব্দে চেষ্টা করুন, অথবা ওপরে "টুলের অনুরোধ" বাটনে ক্লিক করে জানান।',
                    isTextarea: true,
                  },
                ]}
                onSave={async (vals) => {
                  const updated: ContentTexts = {
                    ...contentTexts,
                    home: {
                      all_tools_chip_en: vals.all_tools_chip.en,
                      all_tools_chip_bn: vals.all_tools_chip.bn,
                      categories_label_en: vals.categories_label.en,
                      categories_label_bn: vals.categories_label.bn,
                      expand_all_en: vals.expand_all.en,
                      expand_all_bn: vals.expand_all.bn,
                      collapse_all_en: vals.collapse_all.en,
                      collapse_all_bn: vals.collapse_all.bn,
                      empty_search_en: vals.empty_search.en,
                      empty_search_bn: vals.empty_search.bn,
                    },
                  };
                  await saveContentTexts(updated, 'Homepage Section Controls');
                }}
              />
              </AccordionSectionCard>
            </div>
          )}

          {/* TAB 3: ANNOUNCEMENT BANNER */}
          {activeTab === 'announcement' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: '#f8fafc', wordBreak: 'break-word' }}>
                    Announcement Banner
                  </h1>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, wordBreak: 'break-word' }}>
                    Show a top notification banner across the website for important notices or announcements.
                  </p>
                </div>
                {/* Active / Inactive Toggle Switch */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
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

              <AccordionSectionCard
                id="announcement-banner-card"
                title="Announcement Banner Configuration"
                badge={announcement.is_active ? 'Active' : 'Inactive'}
                collapsible={true}
                isExpanded={isSectionExpanded('announcement-banner-card')}
                onToggle={() => toggleSection('announcement-banner-card')}
                previewUrl="/"
                previewAnchor="#announcement-bar"
                draftData={currentDraftData}
              >
              <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '20px 16px' }}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveAnnouncement(announcement);
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                        Banner Type
                      </label>
                      <select
                        value={announcement.type}
                        onChange={(e) => setAnnouncement({ ...announcement, type: e.target.value })}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#cbd5e1' }}>
                          Display Duration (Auto-Off)
                        </label>
                        {announcement.expires_at ? (
                          <span
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 700,
                              color: new Date(announcement.expires_at).getTime() > Date.now() ? '#10b981' : '#ef4444',
                              wordBreak: 'break-word',
                            }}
                          >
                            {new Date(announcement.expires_at).getTime() > Date.now()
                              ? `Auto-off: ${formatDhakaDateTime(announcement.expires_at)}`
                              : `Expired: ${formatDhakaDateTime(announcement.expires_at)}`}
                          </span>
                        ) : (
                          <span style={{ fontSize: '11.5px', color: '#64748b' }}>♾️ Unlimited</span>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(68px, 1fr))', gap: '6px' }}>
                        {[
                          { val: '1', label: '1 Day' },
                          { val: '3', label: '3 Days' },
                          { val: '7', label: '7 Days' },
                          { val: '15', label: '15 Days' },
                          { val: '30', label: '30 Days' },
                          { val: 'unlimited', label: 'Unlimited' },
                        ].map((opt) => {
                          const isSelected = (announcement.duration_days || 'unlimited') === opt.val;
                          return (
                            <button
                              key={opt.val}
                              type="button"
                              onClick={() => setAnnouncement({ ...announcement, duration_days: opt.val })}
                              style={{
                                padding: '10px 4px',
                                borderRadius: '8px',
                                background: isSelected ? 'rgba(16, 185, 129, 0.2)' : '#0b0f19',
                                border: `1px solid ${isSelected ? '#10b981' : '#334155'}`,
                                color: isSelected ? '#10b981' : '#94a3b8',
                                fontWeight: isSelected ? 700 : 500,
                                fontSize: '11px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                textAlign: 'center',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
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
                        boxSizing: 'border-box',
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
                        boxSizing: 'border-box',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: '#0b0f19',
                        border: '1px solid #334155',
                        color: '#f8fafc',
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px' }}>
                    <div style={{ minWidth: 0 }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                        Clickable Link URL (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. /tools/remove-ai-label"
                        value={announcement.link_url || ''}
                        onChange={(e) => setAnnouncement({ ...announcement, link_url: e.target.value })}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          background: '#0b0f19',
                          border: '1px solid #334155',
                          color: '#f8fafc',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>
                        Link Button Text (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Try Tool →"
                        value={announcement.link_text || ''}
                        onChange={(e) => setAnnouncement({ ...announcement, link_text: e.target.value })}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
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
                      <span>
                        {announcement.text_en || announcement.text_bn || 'Your banner notification text preview...'}
                        {announcement.link_url && (
                          <span style={{ marginLeft: '8px', textDecoration: 'underline', fontWeight: 700, color: '#ffffff' }}>
                            {announcement.link_text || 'Try Tool →'}
                          </span>
                        )}
                      </span>
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
              </AccordionSectionCard>
            </div>
          )}

          {/* TAB 4: CATEGORIES MANAGER */}
          {activeTab === 'categories' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '24px', minWidth: 0 }}>
                <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: '#f8fafc', wordBreak: 'break-word' }}>
                    Categories Manager ({categories.length})
                  </h1>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, wordBreak: 'break-word' }}>
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
              <AccordionSectionCard
                id="categories-catalog-card"
                title="Categories Catalog & Reordering"
                badge={`${categories.length} Categories`}
                collapsible={true}
                isExpanded={isSectionExpanded('categories-catalog-card')}
                onToggle={() => toggleSection('categories-catalog-card')}
                previewUrl="/"
                previewAnchor="#main"
                draftData={currentDraftData}
              >
              <div className="admin-table-wrap" style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', overflowX: 'hidden', width: '100%', maxWidth: '100%' }}>
                <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ background: '#1f2937', borderBottom: '1px solid #374151', color: '#94a3b8' }}>
                      <th style={{ width: '7%', padding: '10px 4px', fontWeight: 700, textAlign: 'center' }}>Symbol</th>
                      <th style={{ width: '20%', padding: '10px 6px', fontWeight: 700 }}>Slug</th>
                      <th style={{ width: '31%', padding: '10px 6px', fontWeight: 700 }}>Title (EN / BN)</th>
                      <th style={{ width: '14%', padding: '10px 4px', fontWeight: 700, whiteSpace: 'nowrap' }}>Tools</th>
                      <th style={{ width: '14%', padding: '10px 4px', fontWeight: 700 }}>Status</th>
                      <th style={{ width: '14%', padding: '10px 4px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => {
                      const toolsInCat = tools.filter((t) => t.category_slug === cat.slug).length;
                      return (
                        <tr key={cat.slug} style={{ borderBottom: '1px solid #1f2937' }}>
                          <td style={{ width: '7%', padding: '10px 4px', fontSize: '18px', textAlign: 'center' }}>{cat.symbol}</td>
                          <td style={{ width: '20%', padding: '10px 6px', fontFamily: 'monospace', color: '#38bdf8', fontSize: '12px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{cat.slug}</td>
                          <td style={{ width: '31%', padding: '10px 6px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                            <div style={{ fontWeight: 700, color: '#f8fafc', lineHeight: '1.3' }}>{cat.title_en}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.3', marginTop: '2px' }}>{cat.title_bn}</div>
                          </td>
                          <td style={{ width: '14%', padding: '10px 4px', color: '#cbd5e1', fontSize: '12px', whiteSpace: 'nowrap' }}>{toolsInCat} tools</td>
                          <td style={{ width: '14%', padding: '10px 4px', whiteSpace: 'nowrap' }}>
                            <button
                              type="button"
                              onClick={() => toggleCategoryActive(cat.slug, cat.is_active)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 6px',
                                borderRadius: '999px',
                                fontSize: '11px',
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer',
                                background: cat.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: cat.is_active ? '#34d399' : '#f87171',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <span
                                style={{
                                  width: '5px',
                                  height: '5px',
                                  borderRadius: '50%',
                                  background: cat.is_active ? '#10b981' : '#ef4444',
                                }}
                              />
                              {cat.is_active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td style={{ width: '14%', padding: '10px 4px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', gap: '4px', justifyContent: 'flex-end', alignItems: 'center' }}>
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
                                  width: '28px',
                                  height: '28px',
                                  padding: 0,
                                  borderRadius: '6px',
                                  background: '#1f2937',
                                  color: '#e2e8f0',
                                  border: '1px solid #374151',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                title="Edit Category"
                              >
                                <Edit3 size={13} />
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
                                  width: '28px',
                                  height: '28px',
                                  padding: 0,
                                  borderRadius: '6px',
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  color: '#f87171',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                title="Delete Category"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              </AccordionSectionCard>
            </div>
          )}

          {/* TAB 5: TOOLS MANAGER (FULL EDIT, DELETE, ACTIVE/INACTIVE) */}
          {activeTab === 'tools' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '24px', minWidth: 0 }}>
                <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: '#f8fafc', wordBreak: 'break-word' }}>
                    Tools Manager ({totalToolsCount})
                  </h1>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, wordBreak: 'break-word' }}>
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
                    flexShrink: 0,
                  }}
                >
                  <Plus size={16} /> Add New Tool
                </button>
              </div>

              <AccordionSectionCard
                id="tools-catalog-card"
                title="Tools Catalog & Configuration"
                badge={`${tools.length} Tools`}
                collapsible={true}
                isExpanded={isSectionExpanded('tools-catalog-card')}
                onToggle={() => toggleSection('tools-catalog-card')}
                previewUrl={toolModal.isOpen && toolModal.data?.slug ? `/tools/${toolModal.data.slug}` : '/'}
                previewAnchor={toolModal.isOpen && toolModal.data?.slug ? undefined : '#main'}
                draftData={currentDraftData}
              >
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
                <div style={{ position: 'relative', flex: 1, minWidth: 'min(100%, 220px)' }}>
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
                      boxSizing: 'border-box',
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
                    maxWidth: '100%',
                    flex: '1 1 auto',
                    boxSizing: 'border-box',
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
                    maxWidth: '100%',
                    flex: '1 1 auto',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only ({activeToolsCount})</option>
                  <option value="inactive">Inactive Only ({totalToolsCount - activeToolsCount})</option>
                </select>
              </div>

              {/* Tools Table */}
              <div className="admin-table-wrap" style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', overflowX: 'hidden', width: '100%', maxWidth: '100%' }}>
                <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ background: '#1f2937', borderBottom: '1px solid #374151', color: '#94a3b8' }}>
                      <th style={{ width: '27%', padding: '10px 6px', fontWeight: 700 }}>Tool Name</th>
                      <th style={{ width: '20%', padding: '10px 6px', fontWeight: 700 }}>Slug & Route</th>
                      <th style={{ width: '18%', padding: '10px 4px', fontWeight: 700 }}>Category</th>
                      <th style={{ width: '9%', padding: '10px 4px', fontWeight: 700, whiteSpace: 'nowrap' }}>Badge</th>
                      <th style={{ width: '12%', padding: '10px 4px', fontWeight: 700 }}>Status</th>
                      <th style={{ width: '14%', padding: '10px 4px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTools.map((tool) => {
                      const cat = categories.find((c) => c.slug === tool.category_slug);
                      return (
                        <tr key={tool.slug} style={{ borderBottom: '1px solid #1f2937' }}>
                          <td style={{ width: '27%', padding: '10px 6px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                            <div style={{ fontWeight: 700, color: '#f8fafc', lineHeight: '1.3' }}>{tool.title_en}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.3', marginTop: '2px' }}>{tool.title_bn}</div>
                          </td>
                          <td style={{ width: '20%', padding: '10px 6px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                            <Link
                              href={`/tools/${tool.slug}`}
                              target="_blank"
                              style={{
                                fontFamily: 'monospace',
                                color: '#38bdf8',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '12px',
                                wordBreak: 'break-all',
                              }}
                            >
                              /{tool.slug} <ExternalLink size={10} style={{ flexShrink: 0 }} />
                            </Link>
                          </td>
                          <td style={{ width: '18%', padding: '10px 4px', fontSize: '11.5px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                            <span
                              style={{
                                fontSize: '11.5px',
                                padding: '2px 6px',
                                borderRadius: '6px',
                                background: '#1e293b',
                                color: '#cbd5e1',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                maxWidth: '100%',
                              }}
                            >
                              <span style={{ flexShrink: 0 }}>{cat?.symbol || '📁'}</span>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat?.title_en || tool.category_slug}</span>
                            </span>
                          </td>
                          <td style={{ width: '9%', padding: '10px 4px', whiteSpace: 'nowrap' }}>
                            {tool.badge ? (
                              <span
                                style={{
                                  fontSize: '10.5px',
                                  fontWeight: 700,
                                  padding: '2px 5px',
                                  borderRadius: '5px',
                                  background: 'rgba(245, 158, 11, 0.15)',
                                  color: '#fbbf24',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {tool.badge}
                              </span>
                            ) : (
                              <span style={{ color: '#475569', fontSize: '11px' }}>—</span>
                            )}
                          </td>
                          <td style={{ width: '12%', padding: '10px 4px', whiteSpace: 'nowrap' }}>
                            <button
                              type="button"
                              onClick={() => toggleToolActive(tool.slug, tool.is_active)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 6px',
                                borderRadius: '999px',
                                fontSize: '11px',
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer',
                                background: tool.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: tool.is_active ? '#34d399' : '#f87171',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <span
                                style={{
                                  width: '5px',
                                  height: '5px',
                                  borderRadius: '50%',
                                  background: tool.is_active ? '#10b981' : '#ef4444',
                                }}
                              />
                              {tool.is_active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td style={{ width: '14%', padding: '10px 4px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', gap: '4px', justifyContent: 'flex-end', alignItems: 'center' }}>
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
                                  width: '28px',
                                  height: '28px',
                                  padding: 0,
                                  borderRadius: '6px',
                                  background: '#1f2937',
                                  color: '#e2e8f0',
                                  border: '1px solid #374151',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                title="Edit Tool Details"
                              >
                                <Edit3 size={13} />
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
                                  width: '28px',
                                  height: '28px',
                                  padding: 0,
                                  borderRadius: '6px',
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  color: '#f87171',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                title="Delete Tool"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              </AccordionSectionCard>
            </div>
          )}

          {/* TAB 6: FOOTER & SOCIAL & WHATSAPP FAB */}
          {activeTab === 'footer' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px', minWidth: 0 }}>
                <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: '#f8fafc', wordBreak: 'break-word' }}>
                    Footer & Social Links
                  </h1>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, wordBreak: 'break-word' }}>
                    Granular element controls for floating WhatsApp widget, social profile icons, and footer copyright text.
                  </p>
                </div>
                {/* Master Active / Inactive Toggle Switch & Accordion Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, flexWrap: 'wrap' }}>
                  {renderAccordionControls(['footer-social-card', 'footer-nav-card'])}
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

              <AccordionSectionCard
                id="footer-social-card"
                title="Footer & WhatsApp Floating Action Button"
                badge={footerSocial.is_active ? 'Active' : 'Inactive'}
                collapsible={true}
                isExpanded={isSectionExpanded('footer-social-card')}
                onToggle={() => toggleSection('footer-social-card')}
                previewUrl="/"
                previewAnchor="#footer-section"
                draftData={currentDraftData}
              >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Element 1: WhatsApp Floating Action Button */}
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '20px 16px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid #1f2937', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: '1 1 auto' }}>
                      <span style={{ fontSize: '22px', flexShrink: 0 }}>💬</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '15px', wordBreak: 'break-word' }}>Floating WhatsApp Chat Widget</div>
                        <div style={{ fontSize: '12.5px', color: '#94a3b8', wordBreak: 'break-word' }}>Pulsing action button in the bottom right corner</div>
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
                        flexShrink: 0,
                      }}
                    >
                      {footerSocial.whatsapp_active ? 'Active on Site' : 'Inactive'}
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px' }}>
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
                          boxSizing: 'border-box',
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
                          boxSizing: 'border-box',
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
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Element 2: Facebook Profile Link */}
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '20px 16px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: '1 1 auto' }}>
                      <span style={{ fontSize: '20px', color: '#3b82f6', flexShrink: 0 }}>🌐</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '15px', wordBreak: 'break-word' }}>Facebook Link</div>
                        <div style={{ fontSize: '12.5px', color: '#94a3b8', wordBreak: 'break-word' }}>Footer icon link to Facebook profile or page</div>
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
                        flexShrink: 0,
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
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Element 3: LinkedIn Profile Link */}
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '20px 16px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: '1 1 auto' }}>
                      <span style={{ fontSize: '20px', color: '#0ea5e9', flexShrink: 0 }}>💼</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '15px', wordBreak: 'break-word' }}>LinkedIn Link</div>
                        <div style={{ fontSize: '12.5px', color: '#94a3b8', wordBreak: 'break-word' }}>Footer icon link to LinkedIn professional profile</div>
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
                        flexShrink: 0,
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
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Element 4: GitHub Link */}
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '20px 16px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: '1 1 auto' }}>
                      <span style={{ fontSize: '20px', color: '#cbd5e1', flexShrink: 0 }}>🐙</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '15px', wordBreak: 'break-word' }}>GitHub Link</div>
                        <div style={{ fontSize: '12.5px', color: '#94a3b8', wordBreak: 'break-word' }}>Footer icon link to open-source repository</div>
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
                        flexShrink: 0,
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
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Element 5: Copyright & Privacy Processing Notice */}
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '20px 16px', boxSizing: 'border-box' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '15px', wordBreak: 'break-word' }}>Copyright & Processing Notice</div>
                    <div style={{ fontSize: '12.5px', color: '#94a3b8', wordBreak: 'break-word' }}>Text displayed at the very bottom of the website</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px' }}>
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
                          boxSizing: 'border-box',
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
                          boxSizing: 'border-box',
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
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                    }}
                  >
                    <Check size={16} /> Save All Footer Settings
                  </button>
                </div>
              </div>
              </AccordionSectionCard>

              <AccordionSectionCard
                id="footer-nav-card"
                title="Footer Navigation Links & Micro-copy"
                badge="Footer Copy"
                collapsible={true}
                isExpanded={isSectionExpanded('footer-nav-card')}
                onToggle={() => toggleSection('footer-nav-card')}
                previewUrl="/"
                previewAnchor="#footer-section"
                draftData={currentDraftData}
              >
              <SectionTextsEditor
                title="Footer Navigation Links & Labels"
                description="Edit the labels for the standard navigation links and back-to-top button in the website footer."
                badge="Footer Links"
                saving={savingContentTexts}
                fields={[
                  {
                    key: 'guides',
                    label: 'Guides Link Label',
                    valueEn: contentTexts.footer?.guides_en || '',
                    valueBn: contentTexts.footer?.guides_bn || '',
                    placeholderEn: 'Guides',
                    placeholderBn: 'গাইড',
                  },
                  {
                    key: 'faq',
                    label: 'FAQ Link Label',
                    valueEn: contentTexts.footer?.faq_en || '',
                    valueBn: contentTexts.footer?.faq_bn || '',
                    placeholderEn: 'FAQ',
                    placeholderBn: 'সাধারণ জিজ্ঞাসা',
                  },
                  {
                    key: 'terms',
                    label: 'Terms of Service Link Label',
                    valueEn: contentTexts.footer?.terms_en || '',
                    valueBn: contentTexts.footer?.terms_bn || '',
                    placeholderEn: 'Terms of Service',
                    placeholderBn: 'ব্যবহারের শর্তাবলী',
                  },
                  {
                    key: 'privacy',
                    label: 'Privacy Policy Link Label',
                    valueEn: contentTexts.footer?.privacy_en || '',
                    valueBn: contentTexts.footer?.privacy_bn || '',
                    placeholderEn: 'Privacy Policy',
                    placeholderBn: 'গোপনীয়তা নীতি',
                  },
                  {
                    key: 'admin',
                    label: 'Admin Panel Link Label',
                    valueEn: contentTexts.footer?.admin_en || '',
                    valueBn: contentTexts.footer?.admin_bn || '',
                    placeholderEn: 'Admin',
                    placeholderBn: 'অ্যাডমিন',
                  },
                  {
                    key: 'back_to_top',
                    label: 'Back to Top Button Label',
                    valueEn: contentTexts.footer?.back_to_top_en || '',
                    valueBn: contentTexts.footer?.back_to_top_bn || '',
                    placeholderEn: 'Back to top',
                    placeholderBn: 'উপরে যান',
                  },
                ]}
                onSave={async (vals) => {
                  const updated: ContentTexts = {
                    ...contentTexts,
                    footer: {
                      guides_en: vals.guides.en,
                      guides_bn: vals.guides.bn,
                      faq_en: vals.faq.en,
                      faq_bn: vals.faq.bn,
                      terms_en: vals.terms.en,
                      terms_bn: vals.terms.bn,
                      privacy_en: vals.privacy.en,
                      privacy_bn: vals.privacy.bn,
                      admin_en: vals.admin.en,
                      admin_bn: vals.admin.bn,
                      back_to_top_en: vals.back_to_top.en,
                      back_to_top_bn: vals.back_to_top.bn,
                    },
                  };
                  await saveContentTexts(updated, 'Footer Links & Labels');
                }}
              />
              </AccordionSectionCard>
            </div>
          )}

          {/* TAB 7: CREATOR PROFILE */}
          {activeTab === 'creator' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px', minWidth: 0 }}>
                <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: '#f8fafc', wordBreak: 'break-word' }}>
                    Creator Profile Manager
                  </h1>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, wordBreak: 'break-word' }}>
                    Granular element controls for the creator identity, direct email contact, social links, and bio descriptions.
                  </p>
                </div>
                {/* Master Active / Inactive Toggle Switch & Accordion Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, flexWrap: 'wrap' }}>
                  {renderAccordionControls(['creator-profile-card', 'creator-about-modal-card'])}
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

              <AccordionSectionCard
                id="creator-profile-card"
                title="Creator Profile Settings & Bio"
                badge={creatorAbout.is_active ? 'Active' : 'Disabled'}
                collapsible={true}
                isExpanded={isSectionExpanded('creator-profile-card')}
                onToggle={() => toggleSection('creator-profile-card')}
                previewUrl="/"
                previewAnchor="#creator-section"
                draftData={currentDraftData}
              >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Element 0: Creator Profile Photo Box (v44) */}
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '20px 16px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '20px', alignItems: 'start' }}>
                    {/* Left: Square preview tile with reposition icon overlay */}
                    <div style={{ position: 'relative', width: '100%', maxWidth: '200px', aspectRatio: '1/1', borderRadius: '16px', overflow: 'hidden', border: '2px solid #334155', background: '#090d16' }}>
                      <img
                        src={creatorAbout.photo_url || '/assets/creator.jpg'}
                        alt="Creator Photo Preview"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: creatorAbout.photo_position || '50% 50%',
                          display: 'block',
                        }}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/assets/creator.jpg';
                        }}
                      />
                      {/* Top-right reposition icon button overlay */}
                      <button
                        type="button"
                        onClick={openRepositionEditor}
                        title="Reposition photo"
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(15, 23, 42, 0.85)',
                          border: '1px solid #475569',
                          color: '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          backdropFilter: 'blur(4px)',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <Move size={15} />
                      </button>
                    </div>

                    {/* Right: Controls */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '15px', wordBreak: 'break-word' }}>Creator Profile Photo</div>
                        <div style={{ fontSize: '12.5px', color: '#94a3b8', wordBreak: 'break-word' }}>Custom profile photo displayed in the About modal and public creator card.</div>
                      </div>

                      {/* Buttons: UPLOAD FROM DEVICE & RESET TO DEFAULT */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '9px 18px',
                            borderRadius: '10px',
                            background: '#10b981',
                            color: '#ffffff',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: 'none',
                            transition: 'background 0.15s ease',
                            flexShrink: 0,
                          }}
                        >
                          <Upload size={14} /> UPLOAD FROM DEVICE
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
                            onChange={handleDevicePhotoUpload}
                            style={{ display: 'none' }}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={openRepositionEditor}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '9px 16px',
                            borderRadius: '10px',
                            background: '#1e293b',
                            color: '#e2e8f0',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: '1px solid #334155',
                            flexShrink: 0,
                          }}
                        >
                          <Move size={14} /> Reposition
                        </button>

                        <button
                          type="button"
                          onClick={handleResetPhoto}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '9px 16px',
                            borderRadius: '10px',
                            background: '#090d16',
                            color: '#94a3b8',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: '1px solid #1f2937',
                            flexShrink: 0,
                          }}
                        >
                          <RotateCcw size={13} /> RESET TO DEFAULT
                        </button>
                      </div>

                      {/* URL Entry */}
                      <div style={{ marginTop: '4px' }}>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px', letterSpacing: '0.4px' }}>
                          OR ENTER IMAGE URL (CDN / LOCAL PATH)
                        </label>
                        <input
                          type="text"
                          placeholder="https://... or /assets/..."
                          value={creatorAbout.photo_url || ''}
                          onChange={(e) => setCreatorAbout({ ...creatorAbout, photo_url: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            background: '#0b0f19',
                            border: '1px solid #334155',
                            color: '#f8fafc',
                            fontSize: '13px',
                            fontFamily: 'monospace',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      {/* Limits and Current lines */}
                      <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div>Max 10MB • JPG, PNG, WebP, SVG, GIF</div>
                        <div style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}>
                          <span style={{ color: '#94a3b8', fontWeight: 600 }}>Current: </span>
                          {creatorAbout.photo_url
                            ? (creatorAbout.photo_url.startsWith('data:')
                                ? `Custom uploaded image (data URI: ${creatorAbout.photo_url.substring(0, 42)}...)`
                                : (creatorAbout.photo_url.length > 60 ? `${creatorAbout.photo_url.substring(0, 60)}...` : creatorAbout.photo_url))
                            : 'Default photo (/assets/creator.jpg)'}
                          <span style={{ color: '#10b981', marginLeft: '8px', fontFamily: 'monospace' }}>
                            [{creatorAbout.photo_position || '50% 50%'}]
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Element 1: Creator Identity & Titles */}
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '20px 16px', boxSizing: 'border-box' }}>
                  <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #1f2937' }}>
                    <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '15px', wordBreak: 'break-word' }}>Creator Identity & Titles</div>
                    <div style={{ fontSize: '12.5px', color: '#94a3b8', wordBreak: 'break-word' }}>Displayed in the "About ToolGhor" modal and creator profile</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px' }}>
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
                          boxSizing: 'border-box',
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
                          boxSizing: 'border-box',
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
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Element 2: Direct Email Contact Button */}
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '20px 16px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: '1 1 auto' }}>
                      <span style={{ fontSize: '20px', color: '#10b981', flexShrink: 0 }}>✉️</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '15px', wordBreak: 'break-word' }}>Direct Email Contact</div>
                        <div style={{ fontSize: '12.5px', color: '#94a3b8', wordBreak: 'break-word' }}>Contact button inside the creator card</div>
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
                        flexShrink: 0,
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
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Element 3: Social Media Connections (Facebook & LinkedIn) */}
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '20px 16px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: '1 1 auto' }}>
                      <span style={{ fontSize: '20px', color: '#38bdf8', flexShrink: 0 }}>🔗</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '15px', wordBreak: 'break-word' }}>Creator Social Profiles</div>
                        <div style={{ fontSize: '12.5px', color: '#94a3b8', wordBreak: 'break-word' }}>Facebook and LinkedIn buttons inside the creator card</div>
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
                        flexShrink: 0,
                      }}
                    >
                      {creatorAbout.social_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px' }}>
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
                          boxSizing: 'border-box',
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
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Element 4: Creator Bio Descriptions */}
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '20px 16px', boxSizing: 'border-box' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '15px', wordBreak: 'break-word' }}>Bio & Platform Mission</div>
                    <div style={{ fontSize: '12.5px', color: '#94a3b8', wordBreak: 'break-word' }}>Short mission statement shown in the About dialog</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px' }}>
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
                          boxSizing: 'border-box',
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
                          boxSizing: 'border-box',
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
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                    }}
                  >
                    <Check size={16} /> Save Creator Profile Settings
                  </button>
                </div>
              </div>
              </AccordionSectionCard>

              <AccordionSectionCard
                id="creator-about-modal-card"
                title="About ToolGhor Modal Texts"
                badge="Modal Copy"
                collapsible={true}
                isExpanded={isSectionExpanded('creator-about-modal-card')}
                onToggle={() => toggleSection('creator-about-modal-card')}
                previewUrl="/"
                previewAnchor="#creator-section"
                draftData={currentDraftData}
              >
              <SectionTextsEditor
                title="About ToolGhor Modal Content"
                description="Edit the tagline badge, description, feature highlights, and 'Built by' label shown in the 'About ToolGhor' modal."
                badge="About Modal"
                saving={savingContentTexts}
                fields={[
                  {
                    key: 'tagline_badge',
                    label: 'Tagline Badge Text',
                    valueEn: contentTexts.about?.tagline_badge_en || '',
                    valueBn: contentTexts.about?.tagline_badge_bn || '',
                    placeholderEn: 'Simple tools • Smarter everyday work',
                    placeholderBn: 'সহজ টুলস • স্মার্ট দৈনন্দিন কাজ',
                  },
                  {
                    key: 'desc',
                    label: 'Modal Body Description',
                    valueEn: contentTexts.about?.desc_en || '',
                    valueBn: contentTexts.about?.desc_bn || '',
                    placeholderEn: 'ToolGhor brings together a thoughtfully curated collection...',
                    placeholderBn: 'ToolGhor নিয়ে এসেছে প্রয়োজনীয় সব অনলাইন টুলের...',
                    isTextarea: true,
                  },
                  {
                    key: 'hl1_title',
                    label: 'Highlight 1 Title',
                    valueEn: contentTexts.about?.hl1_title_en || '',
                    valueBn: contentTexts.about?.hl1_title_bn || '',
                    placeholderEn: 'Built for simplicity',
                    placeholderBn: 'সহজ ব্যবহারের নিশ্চয়তা',
                  },
                  {
                    key: 'hl1_sub',
                    label: 'Highlight 1 Subtitle',
                    valueEn: contentTexts.about?.hl1_sub_en || '',
                    valueBn: contentTexts.about?.hl1_sub_bn || '',
                    placeholderEn: 'Clean & distraction-free interface',
                    placeholderBn: 'ঝামেলাহীন ও সাবলীল ইন্টারফেস',
                  },
                  {
                    key: 'hl2_title',
                    label: 'Highlight 2 Title',
                    valueEn: contentTexts.about?.hl2_title_en || '',
                    valueBn: contentTexts.about?.hl2_title_bn || '',
                    placeholderEn: 'Designed for everyday use',
                    placeholderBn: 'দৈনন্দিন কাজের উপযোগী',
                  },
                  {
                    key: 'hl2_sub',
                    label: 'Highlight 2 Subtitle',
                    valueEn: contentTexts.about?.hl2_sub_en || '',
                    valueBn: contentTexts.about?.hl2_sub_bn || '',
                    placeholderEn: 'Fast, reliable and daily-ready',
                    placeholderBn: 'মুহূর্তেই নির্ভুল ও দ্রুত সমাধান',
                  },
                  {
                    key: 'built_by',
                    label: 'Built By Caption Label',
                    valueEn: contentTexts.about?.built_by_en || '',
                    valueBn: contentTexts.about?.built_by_bn || '',
                    placeholderEn: 'BUILT BY',
                    placeholderBn: 'তৈরি করেছেন',
                  },
                ]}
                onSave={async (vals) => {
                  const updated: ContentTexts = {
                    ...contentTexts,
                    about: {
                      tagline_badge_en: vals.tagline_badge.en,
                      tagline_badge_bn: vals.tagline_badge.bn,
                      desc_en: vals.desc.en,
                      desc_bn: vals.desc.bn,
                      hl1_title_en: vals.hl1_title.en,
                      hl1_title_bn: vals.hl1_title.bn,
                      hl1_sub_en: vals.hl1_sub.en,
                      hl1_sub_bn: vals.hl1_sub.bn,
                      hl2_title_en: vals.hl2_title.en,
                      hl2_title_bn: vals.hl2_title.bn,
                      hl2_sub_en: vals.hl2_sub.en,
                      hl2_sub_bn: vals.hl2_sub.bn,
                      built_by_en: vals.built_by.en,
                      built_by_bn: vals.built_by.bn,
                    },
                  };
                  await saveContentTexts(updated, 'About Modal Content');
                }}
              />
              </AccordionSectionCard>

              {/* Creator Photo Reposition Modal (v44) */}
              {isRepositionOpen && (
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9999,
                    background: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(6px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                  }}
                >
                  <div
                    style={{
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '20px',
                      padding: '20px 16px',
                      maxWidth: '420px',
                      width: '100%',
                      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#f8fafc', wordBreak: 'break-word' }}>
                        Reposition Profile Photo
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsRepositionOpen(false)}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Square Reposition Frame with Drag Pan */}
                    <div
                      onMouseDown={(e) => {
                        isDraggingPhoto.current = true;
                        dragStartPos.current = {
                          x: e.clientX,
                          y: e.clientY,
                          startPanX: repositionPan.x,
                          startPanY: repositionPan.y,
                        };
                      }}
                      onMouseMove={(e) => {
                        if (!isDraggingPhoto.current) return;
                        const dx = e.clientX - dragStartPos.current.x;
                        const dy = e.clientY - dragStartPos.current.y;
                        const nextX = Math.max(0, Math.min(100, dragStartPos.current.startPanX - (dx / 2.8)));
                        const nextY = Math.max(0, Math.min(100, dragStartPos.current.startPanY - (dy / 2.8)));
                        setRepositionPan({ x: Math.round(nextX), y: Math.round(nextY) });
                      }}
                      onMouseUp={() => { isDraggingPhoto.current = false; }}
                      onMouseLeave={() => { isDraggingPhoto.current = false; }}
                      onTouchStart={(e) => {
                        if (e.touches.length === 1) {
                          isDraggingPhoto.current = true;
                          dragStartPos.current = {
                            x: e.touches[0].clientX,
                            y: e.touches[0].clientY,
                            startPanX: repositionPan.x,
                            startPanY: repositionPan.y,
                          };
                        }
                      }}
                      onTouchMove={(e) => {
                        if (!isDraggingPhoto.current || e.touches.length !== 1) return;
                        const dx = e.touches[0].clientX - dragStartPos.current.x;
                        const dy = e.touches[0].clientY - dragStartPos.current.y;
                        const nextX = Math.max(0, Math.min(100, dragStartPos.current.startPanX - (dx / 2.8)));
                        const nextY = Math.max(0, Math.min(100, dragStartPos.current.startPanY - (dy / 2.8)));
                        setRepositionPan({ x: Math.round(nextX), y: Math.round(nextY) });
                      }}
                      onTouchEnd={() => { isDraggingPhoto.current = false; }}
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '280px',
                        borderRadius: '16px',
                        border: '2px dashed #475569',
                        overflow: 'hidden',
                        cursor: 'grab',
                        background: '#090d16',
                        userSelect: 'none',
                        touchAction: 'none',
                      }}
                    >
                      <img
                        src={creatorAbout.photo_url || '/assets/creator.jpg'}
                        alt="Reposition Preview"
                        draggable={false}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: `${repositionPan.x}% ${repositionPan.y}%`,
                          transform: `scale(${repositionZoom})`,
                          transformOrigin: `${repositionPan.x}% ${repositionPan.y}%`,
                          pointerEvents: 'none',
                          transition: isDraggingPhoto.current ? 'none' : 'object-position 0.1s ease',
                        }}
                      />
                      {/* Rule of thirds grid overlay */}
                      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', border: '1px solid rgba(255,255,255,0.08)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr 1fr' }}>
                        <div style={{ borderRight: '1px dashed rgba(255,255,255,0.15)', borderBottom: '1px dashed rgba(255,255,255,0.15)' }} />
                        <div style={{ borderRight: '1px dashed rgba(255,255,255,0.15)', borderBottom: '1px dashed rgba(255,255,255,0.15)' }} />
                        <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.15)' }} />
                        <div style={{ borderRight: '1px dashed rgba(255,255,255,0.15)', borderBottom: '1px dashed rgba(255,255,255,0.15)' }} />
                        <div style={{ borderRight: '1px dashed rgba(255,255,255,0.15)', borderBottom: '1px dashed rgba(255,255,255,0.15)' }} />
                        <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.15)' }} />
                      </div>
                    </div>

                    <div style={{ fontSize: '11.5px', color: '#94a3b8', textAlign: 'center', margin: '8px 0 16px', wordBreak: 'break-word' }}>
                      Drag image to pan focus • Current Position: <span style={{ color: '#10b981', fontFamily: 'monospace' }}>{repositionPan.x}% {repositionPan.y}%</span>
                    </div>

                    {/* Zoom Slider */}
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>
                        <span>Zoom Scale</span>
                        <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{repositionZoom.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.05"
                        value={repositionZoom}
                        onChange={(e) => setRepositionZoom(parseFloat(e.target.value))}
                        style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
                      />
                    </div>

                    {/* Modal Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setRepositionPan({ x: 50, y: 50 });
                          setRepositionZoom(1);
                        }}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          color: '#94a3b8',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Reset Position
                      </button>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => setIsRepositionOpen(false)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            background: '#1f2937',
                            border: 'none',
                            color: '#cbd5e1',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCreatorAbout((prev) => ({
                              ...prev,
                              photo_position: `${repositionPan.x}% ${repositionPan.y}%`,
                            }));
                            setIsRepositionOpen(false);
                          }}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            background: '#10b981',
                            border: 'none',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: API INTEGRATIONS */}
          {activeTab === 'apis' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px', minWidth: 0 }}>
                <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: '#f8fafc', wordBreak: 'break-word' }}>
                    API Integrations & Keys
                  </h1>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, wordBreak: 'break-word' }}>
                    Control each individual cloud API provider with independent active toggles and encrypted key storage.
                  </p>
                </div>
                {/* Master Active / Inactive Toggle Switch */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
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

              {/* Browser autofill blocker: dummy hidden fields that absorb browser credential autofill */}
              <div style={{ position: 'absolute', opacity: 0, height: 0, width: 0, overflow: 'hidden', pointerEvents: 'none' }} tabIndex={-1} aria-hidden="true">
                <input type="text" name="decoy_username_prevent_autofill" tabIndex={-1} autoComplete="username" />
                <input type="password" name="decoy_password_prevent_autofill" tabIndex={-1} autoComplete="current-password" />
              </div>

              <AccordionSectionCard
                id="apis-credentials-card"
                title="API Integrations & Cloud Provider Credentials"
                badge={apiKeys.is_active ? 'All APIs Active' : 'Paused'}
                collapsible={true}
                isExpanded={isSectionExpanded('apis-credentials-card')}
                onToggle={() => toggleSection('apis-credentials-card')}
              >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {[
                  {
                    key: 'gemini_key',
                    activeKey: 'gemini_active',
                    provider: 'gemini',
                    label: 'Google Gemini AI API',
                    desc: 'Powers AI text rewriting, summarize, OCR reading, and Bengali-English intelligence',
                    placeholder: 'AIzaSy...',
                    color: '#10b981',
                  },
                  {
                    key: 'ilovepdf_secret_key',
                    secondKey: 'ilovepdf_public_key',
                    activeKey: 'ilovepdf_active',
                    provider: 'ilovepdf',
                    label: 'iLovePDF Cloud Engine',
                    desc: 'High-speed cloud processing for Merge PDF, Split PDF, and Compress PDF',
                    placeholder: 'secret_key_...',
                    secondPlaceholder: 'project_public_... (Project Public Key)',
                    color: '#e11d48',
                  },
                  {
                    key: 'convertapi_token',
                    activeKey: 'convertapi_active',
                    provider: 'convertapi',
                    label: 'ConvertAPI Document Engine',
                    desc: 'Server-side engine for high-fidelity DOCX to PDF, Word conversions, and PDF flattening',
                    placeholder: 'sec_...',
                    color: '#38bdf8',
                  },
                  {
                    key: 'removebg_key',
                    activeKey: 'removebg_active',
                    provider: 'removebg',
                    label: 'Remove.bg API',
                    desc: 'High-precision portrait cutout and passport photo background eraser',
                    placeholder: 'rmbg_...',
                    color: '#f59e0b',
                  },
                  {
                    key: 'openai_key',
                    activeKey: 'openai_active',
                    provider: 'openai',
                    label: 'OpenAI API (GPT-4o & Whisper)',
                    desc: 'Optional fallback engine for OpenAI tasks and speech-to-text transcription',
                    placeholder: 'sk-proj-...',
                    color: '#a855f7',
                  },
                ].map((item) => {
                  const isActive = (apiKeys as any)[item.activeKey];
                  const rawVal = (apiKeys as any)[item.key] || '';
                  const hasKey = item.secondKey
                    ? Boolean(rawVal.trim() || ((apiKeys as any)[item.secondKey] || '').trim())
                    : Boolean(rawVal.trim());
                  const isRevealed = Boolean(showKey[item.key]);
                  const isFocused = Boolean(focusedKey[item.key]);
                  const displayValue = isRevealed || isFocused ? rawVal : formatMaskedKey(rawVal);
                  return (
                    <div key={item.key} style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '20px 16px', boxSizing: 'border-box' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, color: '#f8fafc', fontSize: '15px', wordBreak: 'break-word' }}>{item.label}</span>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '999px',
                                background: isActive && hasKey ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.12)',
                                color: isActive && hasKey ? '#34d399' : '#94a3b8',
                                border: `1px solid ${isActive && hasKey ? 'rgba(16,185,129,0.3)' : 'rgba(148,163,184,0.2)'}`,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {isActive && hasKey ? 'Connected & Ready' : !isActive ? 'Disabled' : 'Key Not Set'}
                            </span>
                          </div>
                          <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '3px', wordBreak: 'break-word' }}>{item.desc}</div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
                          {/* Minimal Test Button */}
                          <button
                            type="button"
                            onClick={() => runTestKey(item.provider, item.key, item.secondKey)}
                            disabled={testingKey[item.provider]}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '8px',
                              border: '1px solid #334155',
                              fontSize: '12.5px',
                              fontWeight: 600,
                              cursor: testingKey[item.provider] ? 'not-allowed' : 'pointer',
                              background: '#1e293b',
                              color: '#f8fafc',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.2s',
                              opacity: testingKey[item.provider] ? 0.7 : 1,
                            }}
                          >
                            {testingKey[item.provider] ? (
                              <RefreshCw size={13} className="animate-spin" />
                            ) : (
                              <Zap size={13} />
                            )}
                            {testingKey[item.provider] ? 'Testing...' : 'Test'}
                          </button>

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
                      </div>

                      {item.secondKey && (() => {
                        const rawSecVal = (apiKeys as any)[item.secondKey] || '';
                        const isSecRevealed = Boolean(showKey[item.secondKey]);
                        const isSecFocused = Boolean(focusedKey[item.secondKey]);
                        const secDisplayValue = isSecRevealed || isSecFocused ? rawSecVal : formatMaskedKey(rawSecVal);
                        return (
                          <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                              Project Public Key (public_key)
                            </label>
                            <div style={{ position: 'relative' }}>
                              <input
                                id={`api_key_token_${item.secondKey}`}
                                name={`api_key_token_${item.secondKey}`}
                                type={isSecRevealed ? 'text' : isSecFocused ? 'password' : 'text'}
                                value={secDisplayValue}
                                onFocus={() => setFocusedKey((p) => ({ ...p, [item.secondKey!]: true }))}
                                onBlur={() => setFocusedKey((p) => ({ ...p, [item.secondKey!]: false }))}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (!isSecRevealed && !isSecFocused && val.startsWith('••••••••')) return;
                                  if (val.trim() === '277226@Asif') return;
                                  setApiKeys({ ...apiKeys, [item.secondKey!]: val });
                                }}
                                placeholder={item.secondPlaceholder || 'project_public_...'}
                                autoComplete="new-password"
                                spellCheck={false}
                                style={{
                                  width: '100%',
                                  padding: '11px 44px 11px 14px',
                                  borderRadius: '10px',
                                  background: '#0b0f19',
                                  border: '1px solid #334155',
                                  color: '#f8fafc',
                                  fontSize: '13.5px',
                                  fontFamily: 'monospace',
                                  boxSizing: 'border-box',
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => setShowKey((p) => ({ ...p, [item.secondKey!]: !p[item.secondKey!] }))}
                                title={showKey[item.secondKey] ? 'Hide Key' : 'Reveal Key'}
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
                                {showKey[item.secondKey] ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {item.secondKey && (
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                          Project Secret Key (secret_key)
                        </label>
                      )}
                      <div style={{ position: 'relative' }}>
                        <input
                          id={`api_key_token_${item.key}`}
                          name={`api_key_token_${item.key}`}
                          type={isRevealed ? 'text' : isFocused ? 'password' : 'text'}
                          value={displayValue}
                          onFocus={() => setFocusedKey((p) => ({ ...p, [item.key]: true }))}
                          onBlur={() => setFocusedKey((p) => ({ ...p, [item.key]: false }))}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!isRevealed && !isFocused && val.startsWith('••••••••')) return;
                            if (val.trim() === '277226@Asif') return;
                            setApiKeys({ ...apiKeys, [item.key]: val });
                          }}
                          placeholder={item.placeholder}
                          autoComplete="new-password"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck={false}
                          data-lpignore="true"
                          data-1p-ignore="true"
                          data-bwignore="true"
                          data-form-type="other"
                          style={{
                            width: '100%',
                            padding: '11px 44px 11px 14px',
                            borderRadius: '10px',
                            background: '#0b0f19',
                            border: '1px solid #334155',
                            color: '#f8fafc',
                            fontSize: '13.5px',
                            fontFamily: 'monospace',
                            boxSizing: 'border-box',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowKey((p) => ({ ...p, [item.key]: !p[item.key] }))}
                          title={showKey[item.key] ? 'Hide Key' : 'Reveal Key'}
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

                      {/* Bilingual Test Feedback */}
                      {testResult[item.provider] && (
                        <div
                          style={{
                            marginTop: '10px',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            fontSize: '12.5px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: testResult[item.provider]!.valid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            border: `1px solid ${testResult[item.provider]!.valid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                            color: testResult[item.provider]!.valid ? '#34d399' : '#f87171',
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {testResult[item.provider]!.valid ? <CheckCircle2 size={16} style={{ flexShrink: 0 }} /> : <AlertTriangle size={16} style={{ flexShrink: 0 }} />}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                            <span style={{ fontWeight: 600 }}>{testResult[item.provider]!.message}</span>
                          </div>
                        </div>
                      )}
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
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                    }}
                  >
                    <Check size={16} /> Save All API Integrations
                  </button>
                </div>
              </div>
              </AccordionSectionCard>
            </div>
          )}

          {/* TAB: TERMS & POLICIES (9 ISOLATED SECTIONS) */}
          {activeTab === 'policies' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                  flexWrap: 'wrap',
                  gap: '14px',
                  minWidth: 0,
                }}
              >
                <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: '#f8fafc', wordBreak: 'break-word' }}>
                    Terms & Policies Manager
                  </h1>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, wordBreak: 'break-word' }}>
                    Every policy section lives in its OWN separate database table. Each section is edited and saved independently without affecting other sections.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flexShrink: 0, alignItems: 'center' }}>
                  {renderAccordionControls([
                    'policy-terms-header-card',
                    'policy-privacy-header-card',
                    ...POLICY_SECTIONS_LIST.map((item) => `policy-sec-${item.id}`),
                  ])}
                  <Link
                    href="/terms"
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
                    <ExternalLink size={14} /> View /terms
                  </Link>
                  <Link
                    href="/privacy"
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
                    <ExternalLink size={14} /> View /privacy
                  </Link>
                </div>
              </div>

              <AccordionSectionCard
                id="policy-terms-header-card"
                title="Terms of Service Page Header & Chrome Labels"
                badge="Terms Chrome"
                collapsible={true}
                isExpanded={isSectionExpanded('policy-terms-header-card')}
                onToggle={() => toggleSection('policy-terms-header-card')}
                previewUrl="/terms"
                draftData={currentDraftData}
              >
              <SectionTextsEditor
                title="Terms of Service Page Header & Intro"
                description="Edit the header texts, last updated badge, and welcome intro on the public /terms page."
                badge="Terms Header"
                saving={savingContentTexts}
                fields={[
                  {
                    key: 'page_title',
                    label: 'Page Title & Top Heading',
                    valueEn: contentTexts.terms?.page_title_en || '',
                    valueBn: contentTexts.terms?.page_title_bn || '',
                    placeholderEn: 'Terms & Policies',
                    placeholderBn: 'ব্যবহারের শর্তাবলী ও নীতিসমূহ',
                  },
                  {
                    key: 'sidebar_title',
                    label: 'Sidebar Navigation Title',
                    valueEn: contentTexts.terms?.sidebar_title_en || '',
                    valueBn: contentTexts.terms?.sidebar_title_bn || '',
                    placeholderEn: 'Terms & Policies',
                    placeholderBn: 'শর্তাবলী ও নীতিমালা',
                  },
                  {
                    key: 'last_updated',
                    label: 'Last Updated Date Label',
                    valueEn: contentTexts.terms?.last_updated_en || '',
                    valueBn: contentTexts.terms?.last_updated_bn || '',
                    placeholderEn: 'Last Updated: 22 October 2026',
                    placeholderBn: 'সর্বশেষ হালনাগাদ: ২২ অক্টোবর ২০২৬',
                  },
                  {
                    key: 'welcome_heading',
                    label: 'Welcome Card Heading',
                    valueEn: contentTexts.terms?.welcome_heading_en || '',
                    valueBn: contentTexts.terms?.welcome_heading_bn || '',
                    placeholderEn: 'Welcome!',
                    placeholderBn: 'স্বাগতম!',
                  },
                  {
                    key: 'welcome_text',
                    label: 'Welcome Card Intro Text',
                    valueEn: contentTexts.terms?.welcome_text_en || '',
                    valueBn: contentTexts.terms?.welcome_text_bn || '',
                    placeholderEn: 'These policies explain how ToolGhor works...',
                    placeholderBn: 'এই নীতিগুলোতে পরিষ্কার ও সৎ ভাষায় ব্যাখ্যা করা হয়েছে...',
                    isTextarea: true,
                  },
                ]}
                onSave={async (vals) => {
                  const updated: ContentTexts = {
                    ...contentTexts,
                    terms: {
                      page_title_en: vals.page_title.en,
                      page_title_bn: vals.page_title.bn,
                      sidebar_title_en: vals.sidebar_title.en,
                      sidebar_title_bn: vals.sidebar_title.bn,
                      last_updated_en: vals.last_updated.en,
                      last_updated_bn: vals.last_updated.bn,
                      welcome_heading_en: vals.welcome_heading.en,
                      welcome_heading_bn: vals.welcome_heading.bn,
                      welcome_text_en: vals.welcome_text.en,
                      welcome_text_bn: vals.welcome_text.bn,
                    },
                  };
                  await saveContentTexts(updated, 'Terms Page Header');
                }}
              />
              </AccordionSectionCard>

              <AccordionSectionCard
                id="policy-privacy-header-card"
                title="Privacy Policy Page Header & Chrome Labels"
                badge="Privacy Chrome"
                collapsible={true}
                isExpanded={isSectionExpanded('policy-privacy-header-card')}
                onToggle={() => toggleSection('policy-privacy-header-card')}
                previewUrl="/privacy"
                draftData={currentDraftData}
              >
              <SectionTextsEditor
                title="Privacy Policy Page Header & Intro"
                description="Edit the header texts, last updated badge, and welcome intro on the public /privacy page."
                badge="Privacy Header"
                saving={savingContentTexts}
                fields={[
                  {
                    key: 'page_title',
                    label: 'Page Title & Top Heading',
                    valueEn: contentTexts.privacy?.page_title_en || '',
                    valueBn: contentTexts.privacy?.page_title_bn || '',
                    placeholderEn: 'Privacy Policy',
                    placeholderBn: 'গোপনীয়তা নীতি',
                  },
                  {
                    key: 'sidebar_title',
                    label: 'Sidebar Navigation Title',
                    valueEn: contentTexts.privacy?.sidebar_title_en || '',
                    valueBn: contentTexts.privacy?.sidebar_title_bn || '',
                    placeholderEn: 'Privacy Policy',
                    placeholderBn: 'গোপনীয়তা নীতি',
                  },
                  {
                    key: 'last_updated',
                    label: 'Last Updated Date Label',
                    valueEn: contentTexts.privacy?.last_updated_en || '',
                    valueBn: contentTexts.privacy?.last_updated_bn || '',
                    placeholderEn: 'Last Updated: 22 October 2026',
                    placeholderBn: 'সর্বশেষ হালনাগাদ: ২২ অক্টোবর ২০২৬',
                  },
                  {
                    key: 'welcome_heading',
                    label: 'Welcome Card Heading',
                    valueEn: contentTexts.privacy?.welcome_heading_en || '',
                    valueBn: contentTexts.privacy?.welcome_heading_bn || '',
                    placeholderEn: 'Welcome!',
                    placeholderBn: 'স্বাগতম!',
                  },
                  {
                    key: 'welcome_text',
                    label: 'Welcome Card Intro Text',
                    valueEn: contentTexts.privacy?.welcome_text_en || '',
                    valueBn: contentTexts.privacy?.welcome_text_bn || '',
                    placeholderEn: 'Your privacy is paramount at ToolGhor...',
                    placeholderBn: 'ToolGhor-এ আপনার তথ্যের গোপনীয়তা রক্ষা করা...',
                    isTextarea: true,
                  },
                ]}
                onSave={async (vals) => {
                  const updated: ContentTexts = {
                    ...contentTexts,
                    privacy: {
                      page_title_en: vals.page_title.en,
                      page_title_bn: vals.page_title.bn,
                      sidebar_title_en: vals.sidebar_title.en,
                      sidebar_title_bn: vals.sidebar_title.bn,
                      last_updated_en: vals.last_updated.en,
                      last_updated_bn: vals.last_updated.bn,
                      welcome_heading_en: vals.welcome_heading.en,
                      welcome_heading_bn: vals.welcome_heading.bn,
                      welcome_text_en: vals.welcome_text.en,
                      welcome_text_bn: vals.welcome_text.bn,
                    },
                  };
                  await saveContentTexts(updated, 'Privacy Page Header');
                }}
              />
              </AccordionSectionCard>

              {/* 9 Separate Editor Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {POLICY_SECTIONS_LIST.map((item, index) => {
                  const sec = policies[item.id] || DEFAULT_POLICY_SECTIONS[item.id];
                  const isSaving = Boolean(savingPolicies[item.id]);
                  const status = policySaveStatus[item.id];
                  const isPrivacy = item.id === 'privacy';

                  return (
                    <AccordionSectionCard
                      key={item.id}
                      id={`policy-sec-${item.id}`}
                      title={`Section ${index + 1}: ${sec.title_en || item.id} (${isPrivacy ? 'Privacy Policy' : 'Terms of Service'})`}
                      badge={isPrivacy ? 'Privacy' : 'Terms'}
                      collapsible={true}
                      isExpanded={isSectionExpanded(`policy-sec-${item.id}`)}
                      onToggle={() => toggleSection(`policy-sec-${item.id}`)}
                      previewUrl={isPrivacy ? '/privacy' : '/terms'}
                      draftData={currentDraftData}
                    >
                    <div
                      key={item.id}
                      id={`editor-${item.id}`}
                      style={{
                        background: '#111827',
                        border: '1px solid #1f2937',
                        borderRadius: '16px',
                        padding: '20px 16px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                        boxSizing: 'border-box',
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: '1 1 auto', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              background: '#1e293b',
                              color: '#38bdf8',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                            }}
                          >
                            Section {index + 1}
                          </span>
                          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#f8fafc', wordBreak: 'break-word' }}>
                            {sec.title_en} ({sec.title_bn})
                          </h2>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                          <span
                            style={{
                              fontSize: '11.5px',
                              fontFamily: 'monospace',
                              background: '#0f172a',
                              border: '1px solid #334155',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              color: '#94a3b8',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Table: {item.table_name}
                          </span>
                        </div>
                      </div>

                      {/* Card Form */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        {/* Titles Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '16px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                              Title (English)
                            </label>
                            <input
                              type="text"
                              value={sec.title_en}
                              onChange={(e) =>
                                setPolicies((prev) => ({
                                  ...prev,
                                  [item.id]: { ...prev[item.id], title_en: e.target.value },
                                }))
                              }
                              style={{
                                width: '100%',
                                background: '#0f172a',
                                border: '1px solid #334155',
                                borderRadius: '10px',
                                color: '#f8fafc',
                                padding: '10px 14px',
                                fontSize: '14px',
                                boxSizing: 'border-box',
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                              Title (বাংলা)
                            </label>
                            <input
                              type="text"
                              value={sec.title_bn}
                              onChange={(e) =>
                                setPolicies((prev) => ({
                                  ...prev,
                                  [item.id]: { ...prev[item.id], title_bn: e.target.value },
                                }))
                              }
                              style={{
                                width: '100%',
                                background: '#0f172a',
                                border: '1px solid #334155',
                                borderRadius: '10px',
                                color: '#f8fafc',
                                padding: '10px 14px',
                                fontSize: '14px',
                                boxSizing: 'border-box',
                              }}
                            />
                          </div>
                        </div>

                        {/* Bodies Row (Raw Markdown) */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '16px' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                              <label style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
                                Body (English — Markdown)
                              </label>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>Supports ## subheads & - bullets</span>
                            </div>
                            <textarea
                              rows={10}
                              value={sec.body_en}
                              onChange={(e) =>
                                setPolicies((prev) => ({
                                  ...prev,
                                  [item.id]: { ...prev[item.id], body_en: e.target.value },
                                }))
                              }
                              style={{
                                width: '100%',
                                background: '#0f172a',
                                border: '1px solid #334155',
                                borderRadius: '10px',
                                color: '#f8fafc',
                                padding: '12px 14px',
                                fontSize: '13.5px',
                                fontFamily: 'monospace',
                                lineHeight: 1.6,
                                resize: 'vertical',
                                boxSizing: 'border-box',
                              }}
                            />
                          </div>

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                              <label style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
                                Body (বাংলা — Markdown)
                              </label>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>Supports ## subheads & - bullets</span>
                            </div>
                            <textarea
                              rows={10}
                              value={sec.body_bn}
                              onChange={(e) =>
                                setPolicies((prev) => ({
                                  ...prev,
                                  [item.id]: { ...prev[item.id], body_bn: e.target.value },
                                }))
                              }
                              style={{
                                width: '100%',
                                background: '#0f172a',
                                border: '1px solid #334155',
                                borderRadius: '10px',
                                color: '#f8fafc',
                                padding: '12px 14px',
                                fontSize: '13.5px',
                                fontFamily: 'monospace',
                                lineHeight: 1.6,
                                resize: 'vertical',
                                boxSizing: 'border-box',
                              }}
                            />
                          </div>
                        </div>

                        {/* Card Action Footer: Dedicated Save Button */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '12px',
                            marginTop: '8px',
                            paddingTop: '16px',
                            borderTop: '1px solid #1f2937',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0 }}>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                              Isolated saving: writes only to <code>{item.table_name}</code>
                            </span>
                            {status === 'saved' && (
                              <span style={{ fontSize: '12px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                <Check size={14} /> Saved successfully!
                              </span>
                            )}
                            {status === 'error' && (
                              <span style={{ fontSize: '12px', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                ✕ Error saving section
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => savePolicySection(item.id)}
                            style={{
                              background: '#10b981',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '10px',
                              padding: '10px 20px',
                              fontSize: '13.5px',
                              fontWeight: 700,
                              cursor: isSaving ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              opacity: isSaving ? 0.7 : 1,
                              transition: 'all 0.15s ease',
                              boxShadow: '0 4px 12px rgba(16,185,129,0.25)',
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                            }}
                          >
                            {isSaving ? (
                              <>
                                <RefreshCw size={15} className="spin" />
                                Saving Section {index + 1}...
                              </>
                            ) : (
                              <>
                                <Check size={15} />
                                Save Section {index + 1} ({sec.title_en})
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    </AccordionSectionCard>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: GUIDES MANAGER */}
          {activeTab === 'guides' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                  flexWrap: 'wrap',
                  gap: '14px',
                  minWidth: 0,
                }}
              >
                <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: '#f8fafc', wordBreak: 'break-word' }}>
                    Guides Manager
                  </h1>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, wordBreak: 'break-word' }}>
                    Manage how-to guides, tutorials, and practical documentation with rich Markdown and live bilingual preview.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flexShrink: 0, alignItems: 'center' }}>
                  {renderAccordionControls(['guides-chrome-card', 'guides-articles-card'])}
                  <Link
                    href="/guides"
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
                    <ExternalLink size={14} /> View /guides
                  </Link>
                </div>
              </div>

              <AccordionSectionCard
                id="guides-chrome-card"
                title="Guides Index & Article Chrome Labels"
                badge="Guides Chrome"
                collapsible={true}
                isExpanded={isSectionExpanded('guides-chrome-card')}
                onToggle={() => toggleSection('guides-chrome-card')}
                previewUrl="/guides"
                draftData={currentDraftData}
              >
              <SectionTextsEditor
                title="Guides Index & Article Chrome Labels"
                description="Edit the header texts on /guides and the recurring chrome labels around guide articles."
                badge="Guides Chrome"
                saving={savingContentTexts}
                fields={[
                  {
                    key: 'idx_pill',
                    label: 'Index Badge / Pill Text',
                    valueEn: contentTexts.guides?.pill_en || '',
                    valueBn: contentTexts.guides?.pill_bn || '',
                    placeholderEn: 'HELPFUL GUIDES',
                    placeholderBn: 'সহায়ক গাইড',
                  },
                  {
                    key: 'idx_title',
                    label: 'Index Main Heading',
                    valueEn: contentTexts.guides?.title_en || '',
                    valueBn: contentTexts.guides?.title_bn || '',
                    placeholderEn: 'Guides',
                    placeholderBn: 'গাইড',
                  },
                  {
                    key: 'idx_sub',
                    label: 'Index Subtitle',
                    valueEn: contentTexts.guides?.sub_en || '',
                    valueBn: contentTexts.guides?.sub_bn || '',
                    placeholderEn: 'Helpful step-by-step guides...',
                    placeholderBn: 'দৈনন্দিন কাজের জন্য প্রয়োজনীয় গাইড...',
                    isTextarea: true,
                  },
                  {
                    key: 'idx_practical_tag',
                    label: 'Index Practical Guide Tag',
                    valueEn: contentTexts.guides?.practical_tag_en || '',
                    valueBn: contentTexts.guides?.practical_tag_bn || '',
                    placeholderEn: 'Practical Guide',
                    placeholderBn: 'ব্যবহারিক নির্দেশিকা',
                  },
                  {
                    key: 'idx_read_guide',
                    label: 'Index Read Guide Button',
                    valueEn: contentTexts.guides?.read_guide_en || '',
                    valueBn: contentTexts.guides?.read_guide_bn || '',
                    placeholderEn: 'Read Guide →',
                    placeholderBn: 'গাইডটি পড়ুন →',
                  },
                  {
                    key: 'art_back',
                    label: 'Article Back Breadcrumb',
                    valueEn: contentTexts.guide_article?.back_all_en || '',
                    valueBn: contentTexts.guide_article?.back_all_bn || '',
                    placeholderEn: 'All Guides',
                    placeholderBn: 'সকল গাইড',
                  },
                  {
                    key: 'art_published',
                    label: 'Article Published Date Chrome',
                    valueEn: contentTexts.guide_article?.published_en || '',
                    valueBn: contentTexts.guide_article?.published_bn || '',
                    placeholderEn: 'Published: October 23, 2026',
                    placeholderBn: 'প্রকাশিত: ২৩ অক্টোবর ২০২৬',
                  },
                  {
                    key: 'art_tag',
                    label: 'Article Practical Guide Tag',
                    valueEn: contentTexts.guide_article?.practical_tag_en || '',
                    valueBn: contentTexts.guide_article?.practical_tag_bn || '',
                    placeholderEn: 'Practical Guide',
                    placeholderBn: 'ব্যবহারিক গাইড',
                  },
                  {
                    key: 'art_cta_title',
                    label: 'Article Final CTA Card Title',
                    valueEn: contentTexts.guide_article?.cta_title_en || '',
                    valueBn: contentTexts.guide_article?.cta_title_bn || '',
                    placeholderEn: 'Try the free tools',
                    placeholderBn: 'ফ্রি টুলগুলো ব্যবহার করে দেখুন',
                  },
                  {
                    key: 'art_cta_desc',
                    label: 'Article Final CTA Card Description',
                    valueEn: contentTexts.guide_article?.cta_desc_en || '',
                    valueBn: contentTexts.guide_article?.cta_desc_bn || '',
                    placeholderEn: 'All tools run 100% free...',
                    placeholderBn: 'ToolGhor-এর এই টুলগুলো সম্পূর্ণ ফ্রি...',
                    isTextarea: true,
                  },
                ]}
                onSave={async (vals) => {
                  const updated: ContentTexts = {
                    ...contentTexts,
                    guides: {
                      ...contentTexts.guides,
                      pill_en: vals.idx_pill.en,
                      pill_bn: vals.idx_pill.bn,
                      title_en: vals.idx_title.en,
                      title_bn: vals.idx_title.bn,
                      sub_en: vals.idx_sub.en,
                      sub_bn: vals.idx_sub.bn,
                      practical_tag_en: vals.idx_practical_tag.en,
                      practical_tag_bn: vals.idx_practical_tag.bn,
                      read_guide_en: vals.idx_read_guide.en,
                      read_guide_bn: vals.idx_read_guide.bn,
                    },
                    guide_article: {
                      ...contentTexts.guide_article,
                      back_all_en: vals.art_back.en,
                      back_all_bn: vals.art_back.bn,
                      practical_tag_en: vals.art_tag.en,
                      practical_tag_bn: vals.art_tag.bn,
                      published_en: vals.art_published.en,
                      published_bn: vals.art_published.bn,
                      cta_title_en: vals.art_cta_title.en,
                      cta_title_bn: vals.art_cta_title.bn,
                      cta_desc_en: vals.art_cta_desc.en,
                      cta_desc_bn: vals.art_cta_desc.bn,
                    },
                  };
                  await saveContentTexts(updated, 'Guides Page Labels');
                }}
              />
              </AccordionSectionCard>

              <AccordionSectionCard
                id="guides-articles-card"
                title="Guides Content & Markdown Editor"
                badge={`${guides.length} Articles`}
                collapsible={true}
                isExpanded={isSectionExpanded('guides-articles-card')}
                onToggle={() => toggleSection('guides-articles-card')}
                previewUrl={activeGuideSlug ? `/guides/${activeGuideSlug}` : '/guides'}
                draftData={currentDraftData}
                guideDraft={currentGuideDraft}
              >
              <GuidesEditor
                onActiveGuideChange={setActiveGuideSlug}
                guides={guides}
                setGuides={setGuides}
                onSaveGuide={saveGuide}
                savingGuide={savingGuide}
                guideSaveStatus={guideSaveStatus}
              />
              </AccordionSectionCard>
            </div>
          )}

          {/* TAB: FAQ MANAGER */}
          {activeTab === 'faq' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                  flexWrap: 'wrap',
                  gap: '14px',
                  minWidth: 0,
                }}
              >
                <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: '#f8fafc', wordBreak: 'break-word' }}>
                    FAQ Manager
                  </h1>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, wordBreak: 'break-word' }}>
                    Manage general frequently asked questions and tool-specific accordion FAQs in English and Bangla.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flexShrink: 0, alignItems: 'center' }}>
                  {renderAccordionControls(['faq-header-card', 'faq-items-card'])}
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

              <AccordionSectionCard
                id="faq-header-card"
                title="FAQ Page Header & Subtitle"
                badge="FAQ Header"
                collapsible={true}
                isExpanded={isSectionExpanded('faq-header-card')}
                onToggle={() => toggleSection('faq-header-card')}
                previewUrl="/faq"
                draftData={currentDraftData}
              >
              <SectionTextsEditor
                title="FAQ Page Header & Subtitle"
                description="Edit the top badge, heading, and description displayed on the public /faq page."
                badge="FAQ Header"
                saving={savingContentTexts}
                fields={[
                  {
                    key: 'pill',
                    label: 'Badge / Pill Text',
                    valueEn: contentTexts.faq?.pill_en || '',
                    valueBn: contentTexts.faq?.pill_bn || '',
                    placeholderEn: 'NEED HELP?',
                    placeholderBn: 'কোনো প্রশ্ন আছে?',
                  },
                  {
                    key: 'title',
                    label: 'Main Heading (H1)',
                    valueEn: contentTexts.faq?.title_en || '',
                    valueBn: contentTexts.faq?.title_bn || '',
                    placeholderEn: 'Frequently Asked Questions',
                    placeholderBn: 'সাধারণ জিজ্ঞাসা',
                  },
                  {
                    key: 'sub',
                    label: 'Subtitle / Description',
                    valueEn: contentTexts.faq?.sub_en || '',
                    valueBn: contentTexts.faq?.sub_bn || '',
                    placeholderEn: 'Everything you need to know about ToolGhor...',
                    placeholderBn: 'ToolGhor সম্পর্কে যা যা জানা দরকার...',
                    isTextarea: true,
                  },
                ]}
                onSave={async (vals) => {
                  const updated: ContentTexts = {
                    ...contentTexts,
                    faq: {
                      pill_en: vals.pill.en,
                      pill_bn: vals.pill.bn,
                      title_en: vals.title.en,
                      title_bn: vals.title.bn,
                      sub_en: vals.sub.en,
                      sub_bn: vals.sub.bn,
                    },
                  };
                  await saveContentTexts(updated, 'FAQ Page Header');
                }}
              />
              </AccordionSectionCard>

              <AccordionSectionCard
                id="faq-items-card"
                title="FAQ Questions & Scopes Manager"
                badge={`${faqItems.length} FAQs`}
                collapsible={true}
                isExpanded={isSectionExpanded('faq-items-card')}
                onToggle={() => toggleSection('faq-items-card')}
                previewUrl={selectedFaqScope && selectedFaqScope !== 'general' ? `/tools/${selectedFaqScope}` : '/faq'}
                draftData={currentDraftData}
                faqDraft={currentFaqDraft}
              >
              <FaqEditor
                faqItems={faqItems}
                setFaqItems={setFaqItems}
                selectedScope={selectedFaqScope}
                setSelectedScope={setSelectedFaqScope}
                onSaveScope={saveFaqScope}
                savingScope={savingFaqScope}
                saveStatus={faqScopeSaveStatus}
                toolList={tools}
              />
              </AccordionSectionCard>
            </div>
          )}

          {/* TAB 9: USAGE ANALYTICS */}
          {activeTab === 'analytics' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px', minWidth: 0 }}>
                <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: '#f8fafc', wordBreak: 'break-word' }}>
                    Usage Analytics & Launch Counts
                  </h1>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, wordBreak: 'break-word' }}>
                    Real-time Postgres database counter tracking every visitor launch with progress visualizers.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flexShrink: 0 }}>
                  {renderAccordionControls(['analytics-charts-card', 'analytics-table-card'])}
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
                      flexShrink: 0,
                    }}
                  >
                    <RefreshCw size={15} className={loadingData ? 'animate-spin' : ''} />
                    <span>{loadingData ? 'Refreshing...' : 'Refresh Analytics'}</span>
                  </button>
                </div>
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
                    <AccordionSectionCard
                      id="analytics-charts-card"
                      title="Usage Analytics & Platform KPIs"
                      badge="Metrics"
                      collapsible={true}
                      isExpanded={isSectionExpanded('analytics-charts-card')}
                      onToggle={() => toggleSection('analytics-charts-card')}
                    >
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
                          <span style={{ flexShrink: 0 }}>🏆</span>
                          <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word', lineHeight: 1.3 }}>{topTool ? topTool.title_en : 'None'}</span>
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

                    </AccordionSectionCard>

                    <AccordionSectionCard
                      id="analytics-table-card"
                      title="Tool Performance Breakdown Table"
                      badge="Usage Table"
                      collapsible={true}
                      isExpanded={isSectionExpanded('analytics-table-card')}
                      onToggle={() => toggleSection('analytics-table-card')}
                    >
                    {/* Table View with Progress Bars */}
                    <div className="admin-table-wrap" style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                      <table style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
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
                                <td style={{ padding: '14px 18px', fontWeight: 700, color: '#f8fafc', wordBreak: 'break-word' }}>
                                  {t.title_en}
                                  <div style={{ fontSize: '11.5px', fontFamily: 'monospace', color: '#64748b', fontWeight: 500, wordBreak: 'break-all', overflowWrap: 'anywhere' }}>/{t.slug}</div>
                                </td>
                                <td style={{ padding: '14px 18px', color: '#94a3b8', wordBreak: 'break-word' }}>
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
                    </AccordionSectionCard>
                  </>
                );
              })()}
            </div>
          )}

          {/* TAB 10: ADMIN PROFILE & SECURITY */}
          {activeTab === 'profile' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px', minWidth: 0 }}>
                <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: '#f8fafc', wordBreak: 'break-word' }}>
                    Admin Profile & Security
                  </h1>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, wordBreak: 'break-word' }}>
                    Manage your administrator credentials, recovery email/phone, and securely change your login passcode.
                  </p>
                </div>
                <div style={{ flexShrink: 0 }}>
                  {renderAccordionControls(['profile-info-card', 'profile-password-card'])}
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
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {profileMsg.type === 'success' ? <CheckCircle2 size={18} style={{ flexShrink: 0 }} /> : <AlertTriangle size={18} style={{ flexShrink: 0 }} />}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Section 1: Account & Contact */}
                <AccordionSectionCard
                  id="profile-info-card"
                  title="Admin Credentials & Contact Info"
                  badge="Profile"
                  collapsible={true}
                  isExpanded={isSectionExpanded('profile-info-card')}
                  onToggle={() => toggleSection('profile-info-card')}
                >
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '20px 16px', boxSizing: 'border-box' }}>
                  <div style={{ marginBottom: '20px', borderBottom: '1px solid #1f2937', paddingBottom: '14px' }}>
                    <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', wordBreak: 'break-word' }}>
                      <User size={18} color="#10b981" style={{ flexShrink: 0 }} /> Administrator Details
                    </div>
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', wordBreak: 'break-word' }}>
                      These details are used for administrator notifications and one-time password (OTP) verification.
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '18px' }}>
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
                          boxSizing: 'border-box',
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
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
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
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                </div>

                </AccordionSectionCard>

                {/* Section 2: Change Password */}
                <AccordionSectionCard
                  id="profile-password-card"
                  title="Change Admin Passcode & Master Password"
                  badge="Security"
                  collapsible={true}
                  isExpanded={isSectionExpanded('profile-password-card')}
                  onToggle={() => toggleSection('profile-password-card')}
                >
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '20px 16px', boxSizing: 'border-box' }}>
                  <div style={{ marginBottom: '20px', borderBottom: '1px solid #1f2937', paddingBottom: '14px' }}>
                    <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', wordBreak: 'break-word' }}>
                      <Lock size={18} color="#10b981" style={{ flexShrink: 0 }} /> Change Admin Passcode
                    </div>
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', wordBreak: 'break-word' }}>
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
                          boxSizing: 'border-box',
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
                          boxSizing: 'border-box',
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
                          boxSizing: 'border-box',
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
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
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
                </AccordionSectionCard>
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
            padding: '16px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              background: '#131824',
              border: '1px solid #1e293b',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '600px',
              padding: '20px 16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#f8fafc', wordBreak: 'break-word' }}>
                {toolModal.mode === 'create' ? 'Add New Tool' : `Edit Tool: ${toolModal.data.title_en}`}
              </h2>
              <button
                type="button"
                onClick={() => setToolModal({ isOpen: false, mode: 'create', data: {} })}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
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
                    boxSizing: 'border-box',
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
                    boxSizing: 'border-box',
                  }}
                >
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.symbol} {c.title_en}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '12px' }}>
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
                      boxSizing: 'border-box',
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
                      boxSizing: 'border-box',
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
                    boxSizing: 'border-box',
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
                    boxSizing: 'border-box',
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
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                <input
                  type="checkbox"
                  id="tool_active_check"
                  checked={toolModal.data.is_active !== false}
                  onChange={(e) => setToolModal((p) => ({ ...p, data: { ...p.data, is_active: e.target.checked } }))}
                  style={{ width: '18px', height: '18px', accentColor: '#10b981', flexShrink: 0 }}
                />
                <label htmlFor="tool_active_check" style={{ fontSize: '13.5px', fontWeight: 600, color: '#f8fafc', cursor: 'pointer', wordBreak: 'break-word' }}>
                  Set Tool as Active immediately
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px', flexWrap: 'wrap' }}>
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
            padding: '16px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              background: '#131824',
              border: '1px solid #1e293b',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '540px',
              padding: '20px 16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#f8fafc', wordBreak: 'break-word' }}>
                {categoryModal.mode === 'create' ? 'Add Category' : `Edit Category: ${categoryModal.data.title_en}`}
              </h2>
              <button
                type="button"
                onClick={() => setCategoryModal({ isOpen: false, mode: 'create', data: {} })}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
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
                    boxSizing: 'border-box',
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
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '12px' }}>
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
                      boxSizing: 'border-box',
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
                      boxSizing: 'border-box',
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
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px', flexWrap: 'wrap' }}>
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
            padding: '16px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              background: '#131824',
              border: '1px solid #ef4444',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '440px',
              padding: '20px 16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
              textAlign: 'center',
              boxSizing: 'border-box',
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
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={24} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: '#f8fafc', wordBreak: 'break-word' }}>
              Delete {deleteConfirm.type === 'tool' ? 'Tool' : 'Category'}?
            </h3>
            <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: '0 0 20px', lineHeight: 1.5, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              Are you sure you want to permanently delete <strong>{deleteConfirm.title}</strong> (<code>{deleteConfirm.slug}</code>) from the database? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
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
