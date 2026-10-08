'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TOOLS, CATEGORIES } from '@/data/registry';
import { siteConfig } from '@/data/config';
import {
  Shield,
  Lock,
  Key,
  Sliders,
  Settings,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Save,
  Search,
  ArrowLeft,
  Bell,
  Check,
  Server,
  Database,
  BarChart3,
  Loader2,
} from 'lucide-react';

export default function AdminConsole() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'tools' | 'analytics' | 'apis' | 'settings'>('overview');

  // Search & Filter in Tools tab
  const [toolSearch, setToolSearch] = useState('');
  const [toolCatFilter, setToolCatFilter] = useState('all');

  // Database Connection State
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Tool states (enabled/disabled) & analytics
  const [toolStatuses, setToolStatuses] = useState<Record<string, boolean>>({});
  const [analyticsData, setAnalyticsData] = useState<Record<string, number>>({});

  // API Keys state
  const [apiKeys, setApiKeys] = useState({
    convertApiToken: '••••••••••••••••••••••••',
    geminiKey: '••••••••••••••••••••••••',
    openaiKey: '',
    removeBgKey: '',
    ilovepdfPublicKey: siteConfig.apis.ilovepdfPublicKey,
  });

  // Site Announcement
  const [announcement, setAnnouncement] = useState({
    enabled: true,
    textBn: 'ToolGhor এখন Next.js এবং Neon PostgreSQL ক্লাউড ডাটাবেস দ্বারা পরিচালিত!',
    textEn: 'ToolGhor is now fully powered by Next.js and Neon PostgreSQL cloud database!',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Fetch live data from Database via API
  const fetchAdminData = async () => {
    try {
      setLoadingData(true);
      const res = await fetch('/api/admin/data');
      if (res.ok) {
        const data = await res.json();
        setDbConnected(data.dbConnected);
        if (data.toolStatuses) {
          setToolStatuses(data.toolStatuses);
        }
        if (data.analytics) {
          setAnalyticsData(data.analytics);
        }
        if (data.settings?.announcement) {
          setAnnouncement(data.settings.announcement);
        }
      } else {
        setDbConnected(false);
      }
    } catch {
      setDbConnected(false);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    try {
      const isAuth = sessionStorage.getItem('toolghor_admin_auth');
      if (isAuth === 'true') {
        setIsAuthenticated(true);
        fetchAdminData();
      }
    } catch {}
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === 'admin123' || pin === '2026' || pin === 'badhon') {
      setIsAuthenticated(true);
      sessionStorage.setItem('toolghor_admin_auth', 'true');
      setPinError(false);
      fetchAdminData();
    } else {
      setPinError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('toolghor_admin_auth');
  };

  const toggleToolStatus = async (slug: string) => {
    const newStatus = !toolStatuses[slug];
    const updated = {
      ...toolStatuses,
      [slug]: newStatus,
    };
    setToolStatuses(updated);

    try {
      await fetch('/api/admin/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_tool',
          payload: { slug, is_active: newStatus },
        }),
      });
    } catch (err) {
      console.error('Failed to sync tool status with DB:', err);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await fetch('/api/admin/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_setting',
          payload: { key: 'announcement', value: announcement },
        }),
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save settings to DB:', err);
    }
  };

  // If not logged in, show login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 p-4">
        <div className="w-full max-w-md p-8 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">ToolGhor Admin Console</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Enter your master administrative PIN or passcode to manage the website.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Admin Passcode / PIN
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="Enter passcode (e.g. admin123)"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-800/80 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              {pinError && (
                <p className="text-xs text-rose-400 mt-1.5">
                  Incorrect passcode. Hint: Use <code className="bg-zinc-800 px-1 rounded text-emerald-400">admin123</code>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20"
            >
              Sign In to Console
            </button>

            <div className="text-center pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Website</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Filter tools for tool management tab
  const filteredTools = TOOLS.filter((tool) => {
    const matchesCat = toolCatFilter === 'all' || tool.cats.includes(toolCatFilter);
    const matchesSearch =
      tool.en.toLowerCase().includes(toolSearch.toLowerCase()) ||
      tool.bn.toLowerCase().includes(toolSearch.toLowerCase()) ||
      tool.slug.toLowerCase().includes(toolSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const activeCount = Object.values(toolStatuses).filter(Boolean).length;
  const totalToolVisits = Object.values(analyticsData).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                ToolGhor Admin
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                v1.0 (Next.js)
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* Database Live Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-xs">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Neon DB:</span>
            {dbConnected === null ? (
              <span className="text-zinc-400">Connecting...</span>
            ) : dbConnected ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            ) : (
              <span className="text-rose-400 font-semibold">Offline</span>
            )}
          </div>

          <Link
            href="/"
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">View Site</span>
          </Link>

          <button
            onClick={handleLogout}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950 hover:text-rose-400 text-zinc-300 border border-zinc-700 hover:border-rose-900 transition-all"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Admin Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-4 mb-8 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('tools')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'tools'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Tool Management ({activeCount}/{TOOLS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Live Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('apis')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'apis'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>API Keys & Proxies</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'settings'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Global Settings</span>
          </button>
        </div>

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
                <span className="text-xs text-zinc-400 font-medium">Total Tools</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-3xl font-extrabold text-white">{TOOLS.length}</span>
                  <span className="text-xs text-emerald-400 font-medium">{activeCount} Online</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
                <span className="text-xs text-zinc-400 font-medium">Categories</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-3xl font-extrabold text-emerald-400">{CATEGORIES.length}</span>
                  <span className="text-xs text-zinc-500">Categories</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
                <span className="text-xs text-zinc-400 font-medium">Neon Postgres Status</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-xl font-bold text-white flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-emerald-400" />
                    {dbConnected ? 'Connected' : 'Checking'}
                  </span>
                  <span className="text-xs text-emerald-400 font-medium">Serverless</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
                <span className="text-xs text-zinc-400 font-medium">Tool Launches Tracked</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-3xl font-extrabold text-teal-400">{totalToolVisits}</span>
                  <span className="text-xs text-zinc-500">Total Visits</span>
                </div>
              </div>
            </div>

            {/* Platform & DB Highlights */}
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
              <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-500" />
                <span>Neon PostgreSQL + Vercel Integration Active</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400">
                <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                  <h4 className="font-semibold text-zinc-200 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Real-time Sync</span>
                  </h4>
                  <p>Tool statuses and settings save instantly to your Neon PostgreSQL cloud database.</p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                  <h4 className="font-semibold text-zinc-200 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Serverless Connection Pooling</span>
                  </h4>
                  <p>Configured with Neon Connection Pooler for zero cold starts and unlimited scale on Vercel.</p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                  <h4 className="font-semibold text-zinc-200 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Automated Migrations</span>
                  </h4>
                  <p>Database tables and initial settings are created automatically upon first run.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. TOOLS MANAGEMENT TAB */}
        {activeTab === 'tools' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={toolSearch}
                  onChange={(e) => setToolSearch(e.target.value)}
                  placeholder="Filter tools..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                <button
                  onClick={() => setToolCatFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    toolCatFilter === 'all'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setToolCatFilter(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                      toolCatFilter === c.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {c.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Tools Table / List */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
              <div className="divide-y divide-zinc-800/80">
                {filteredTools.map((tool) => {
                  const isEnabled = toolStatuses[tool.slug] !== false;
                  const usageCount = analyticsData[tool.slug] || 0;

                  return (
                    <div
                      key={tool.slug}
                      className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-zinc-900 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-zinc-800 text-emerald-400 flex items-center justify-center text-xs font-bold">
                          {tool.slug.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-zinc-100">{tool.en}</span>
                            <span className="text-xs text-zinc-400">({tool.bn})</span>
                            {tool.badge && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                                {tool.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-zinc-500">
                            /tools/{tool.slug} • Launches: <strong className="text-zinc-300">{usageCount}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          href={`/tools/${tool.slug}`}
                          target="_blank"
                          className="text-xs text-emerald-400 hover:underline hidden sm:inline"
                        >
                          Preview
                        </Link>
                        <button
                          onClick={() => toggleToolStatus(tool.slug)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                            isEnabled
                              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-800 hover:bg-emerald-600/30'
                              : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:bg-zinc-700'
                          }`}
                        >
                          {isEnabled ? 'Active (Live)' : 'Disabled'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 3. ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
              <span>Live tool launch statistics tracked automatically in Neon Postgres.</span>
              <button
                onClick={fetchAdminData}
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
              >
                Refresh Data
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {TOOLS.map((t) => {
                const count = analyticsData[t.slug] || 0;
                return (
                  <div key={t.slug} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100">{t.en}</h4>
                      <span className="text-xs text-zinc-500">{t.bn}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-extrabold text-emerald-400">{count}</span>
                      <span className="block text-[10px] text-zinc-500">opens</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. API KEYS TAB */}
        {activeTab === 'apis' && (
          <div className="max-w-3xl space-y-6">
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-400">
              <p>
                API keys configured here are managed safely. Tokens like <strong className="text-zinc-200">CONVERTAPI_TOKEN</strong> and <strong className="text-zinc-200">DATABASE_URL</strong> are secured strictly in your server-side environment variables and never exposed to the client.
              </p>
            </div>

            <div className="space-y-4">
              {/* Database URL */}
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span>Neon PostgreSQL Connection String</span>
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Encrypted
                  </span>
                </div>
                <input
                  type="password"
                  value="postgresql://neondb_owner:••••••••••••@ep-divine-resonance-azoqq5o4-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb"
                  readOnly
                  className="w-full px-3.5 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-400 outline-none"
                />
              </div>

              {/* ConvertAPI */}
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-zinc-200">
                    ConvertAPI Token (Server-Side Proxy for PDF → DOCX)
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Protected
                  </span>
                </div>
                <input
                  type="password"
                  value={apiKeys.convertApiToken}
                  readOnly
                  className="w-full px-3.5 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-300 outline-none"
                />
              </div>

              {/* iLovePDF */}
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-zinc-200">
                    iLovePDF Public Key
                  </label>
                </div>
                <input
                  type="text"
                  value={apiKeys.ilovepdfPublicKey}
                  onChange={(e) => setApiKeys({ ...apiKeys, ilovepdfPublicKey: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-300 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 5. SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl space-y-6">
            {/* Site Banner Announcement */}
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-zinc-100">Global Announcement Banner (Stored in Neon DB)</h3>
                </div>
                <button
                  onClick={() => setAnnouncement({ ...announcement, enabled: !announcement.enabled })}
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    announcement.enabled
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {announcement.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Bangla Announcement</label>
                <input
                  type="text"
                  value={announcement.textBn}
                  onChange={(e) => setAnnouncement({ ...announcement, textBn: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded-xl text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">English Announcement</label>
                <input
                  type="text"
                  value={announcement.textEn}
                  onChange={(e) => setAnnouncement({ ...announcement, textEn: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded-xl text-white outline-none"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveSettings}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow-md shadow-emerald-600/20 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save to Neon Database</span>
              </button>

              {savedSuccess && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold animate-fade-in">
                  <Check className="w-4 h-4" />
                  <span>Saved directly to Neon PostgreSQL!</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
