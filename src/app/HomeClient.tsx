'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ToolCard from '@/components/ToolCard';
import { CATEGORIES as DEFAULT_CATEGORIES, TOOLS as DEFAULT_TOOLS, ToolItem, Category } from '@/data/registry';
import { useApp } from '@/context/AppContext';
import { ASSET_VERSION } from '@/data/config';

interface HomeClientProps {
  initialData: any;
}

export default function HomeClient({ initialData }: HomeClientProps) {
  const { lang, searchQuery, setSearchQuery } = useApp();

  // Dynamic public data from database (pre-populated by server hydration to prevent any layout glitch)
  const [publicData, setPublicData] = useState<any>(initialData || null);

  // Category expansion state: mapping of category id -> boolean
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({
    documents: false,
    images: false,
    calculators: false,
    qr: false,
    media: false,
    resume: false,
  });

  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Debounced search input
  const [searchInput, setSearchInput] = useState(searchQuery);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 150);
    return () => clearTimeout(handler);
  }, [searchInput, setSearchQuery]);

  // Notice Banner dismiss state
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Ensure that returning to Home from any tool starts at the very top (0, 0)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!window.location.hash) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        const timer = setTimeout(() => {
          if (!window.location.hash) {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          }
        }, 30);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Ensure returning to Home or opening always starts with an empty search query
  useEffect(() => {
    setSearchQuery('');
  }, [setSearchQuery]);

  // Sync browser document title with selected language
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = lang === 'bn'
        ? 'ToolGhor – দৈনন্দিন কাজের সব টুল'
        : 'ToolGhor – Everyday tools, now on one platform';
    }
  }, [lang]);

  // Synchronize client globals and background refresh
  useEffect(() => {
    const syncGlobals = (data: any) => {
      if (!data || typeof window === 'undefined') return;
      const w = window as any;
      if (data.creatorAbout) {
        w.CREATOR_CONFIG = data.creatorAbout;
      }
      if (data.apiKeys && data.apiKeys.is_active) {
        w.SITE_CONFIG = w.SITE_CONFIG || {};
        w.SITE_CONFIG.apis = w.SITE_CONFIG.apis || {};
        w.SITE_CONFIG.apis.geminiActive = Boolean(data.apiKeys.gemini_active);
        w.SITE_CONFIG.apis.openaiActive = Boolean(data.apiKeys.openai_active);
        w.SITE_CONFIG.apis.convertApiActive = Boolean(data.apiKeys.convertapi_active);
        w.SITE_CONFIG.apis.removeBgActive = Boolean(data.apiKeys.removebg_active);
        w.SITE_CONFIG.apis.ilovepdfActive = Boolean(data.apiKeys.ilovepdf_active);
        if (data.apiKeys.ilovepdf_public_key) {
          w.SITE_CONFIG.apis.ilovepdfPublicKey = data.apiKeys.ilovepdf_public_key.trim();
        }
      }
      if (data.uiSettings) {
        w.UI_SETTINGS = data.uiSettings;
      }
    };

    const syncData = () => {
      fetch('/api/public/data?t=' + Date.now(), { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success) {
            setPublicData(data);
            syncGlobals(data);
          }
        })
        .catch(() => {});
    };

    if (publicData) {
      syncGlobals(publicData);
    }
    syncData();

    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('toolghor_sync');
        channel.onmessage = (evt) => {
          if (evt.data === 'refresh') {
            syncData();
          }
        };
      } catch {}
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', syncData);
      return () => {
        window.removeEventListener('focus', syncData);
        if (channel) channel.close();
      };
    }
  }, []);

  // Idle prefetch tool scripts and top-6 most-used routes so opening any tool is instantaneous
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefetchUrls = [
      `/assets/tools/calc.js?v=${ASSET_VERSION}`,
      `/assets/tools/image.js?v=${ASSET_VERSION}`,
      `/assets/tools/pdf.js?v=${ASSET_VERSION}`,
      `/assets/tools/qr.js?v=${ASSET_VERSION}`,
      `/assets/tools/media.js?v=${ASSET_VERSION}`,
      `/assets/tools/resume.js?v=${ASSET_VERSION}`,
    ];
    const topRoutes = [
      '/tools/convert-image',
      '/tools/compress-image',
      '/tools/remove-background',
      '/tools/merge-pdf',
      '/tools/compress-pdf',
      '/tools/resume-builder',
    ];
    const idleCallback = (window as any).requestIdleCallback || ((cb: () => void) => setTimeout(cb, 800));
    const handle = idleCallback(() => {
      prefetchUrls.forEach((url) => {
        if (!document.querySelector(`link[href="${url}"]`) && !document.querySelector(`script[src="${url}"]`)) {
          const l = document.createElement('link');
          l.rel = 'prefetch';
          l.as = 'script';
          l.href = url;
          document.head.appendChild(l);
        }
      });
      topRoutes.forEach((route) => {
        try {
          router.prefetch(route);
        } catch {}
      });
    });
    return () => {
      if ((window as any).cancelIdleCallback && typeof handle === 'number') {
        (window as any).cancelIdleCallback(handle);
      }
    };
  }, [router]);

  // Compute active categories list based on database status
  const activeCategories = useMemo(() => {
    if (!publicData || !publicData.categories || publicData.categories.length === 0) {
      return DEFAULT_CATEGORIES;
    }
    const dbCatMap: Record<string, any> = {};
    publicData.categories.forEach((c: any) => {
      dbCatMap[c.slug] = c;
    });

    return DEFAULT_CATEGORIES.filter((c) => {
      const dbCat = dbCatMap[c.id];
      return dbCat ? dbCat.is_active : true;
    }).map((c) => {
      const dbCat = dbCatMap[c.id];
      if (dbCat) {
        return {
          ...c,
          bn: dbCat.title_bn || c.bn,
          en: dbCat.title_en || c.en,
          desc: dbCat.desc_bn || c.desc,
          descEn: dbCat.desc_en || c.descEn,
          symbol: dbCat.symbol || c.symbol,
        };
      }
      return c;
    });
  }, [publicData]);

  // Compute active tools list based on database status and active categories
  const activeTools = useMemo(() => {
    if (!publicData || !publicData.tools || publicData.tools.length === 0) {
      return DEFAULT_TOOLS;
    }
    const dbToolMap: Record<string, any> = {};
    publicData.tools.forEach((t: any) => {
      dbToolMap[t.slug] = t;
    });

    const activeCatIds = new Set(activeCategories.map((c) => c.id));

    return DEFAULT_TOOLS.filter((t) => {
      const dbTool = dbToolMap[t.slug];
      const isToolActive = dbTool ? dbTool.is_active : true;
      if (!isToolActive) return false;
      // Exclude tool if its categories have all been deactivated
      return t.cats.some((cId) => activeCatIds.has(cId));
    }).map((t) => {
      const dbTool = dbToolMap[t.slug];
      if (dbTool) {
        return {
          ...t,
          bn: dbTool.title_bn || t.bn,
          en: dbTool.title_en || t.en,
          desc: dbTool.desc_bn || t.desc,
          descEn: dbTool.desc_en || t.descEn,
          badge: dbTool.badge !== undefined ? dbTool.badge : t.badge,
        };
      }
      return t;
    });
  }, [publicData, activeCategories]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Filter tools by search query
  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    const tokens = q.split(/\s+/).filter(Boolean);

    return activeTools.filter((tool) => {
      const haystack = [
        tool.bn,
        tool.en,
        tool.desc,
        tool.descEn,
        tool.keywords,
      ]
        .join(' ')
        .toLowerCase();
      return tokens.every((token) => haystack.includes(token));
    });
  }, [searchQuery, activeTools]);

  // Suggestions for autocomplete dropdown
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return (filteredTools || []).slice(0, 8);
  }, [searchQuery, filteredTools]);

  // When search query is entered, auto-expand categories that have matching tools
  useEffect(() => {
    if (searchQuery.trim()) {
      setShowSuggestions(true);
      const matches = filteredTools || [];
      const newExpanded: Record<string, boolean> = {};
      activeCategories.forEach((cat) => {
        const catHasMatch = matches.some((t) => t.cats.includes(cat.id));
        newExpanded[cat.id] = catHasMatch;
      });
      setExpandedCats(newExpanded);
    } else {
      setShowSuggestions(false);
    }
  }, [searchQuery, filteredTools, activeCategories]);

  // Check if all active categories are currently expanded
  const allCategoryIds = useMemo(() => activeCategories.map((c) => c.id), [activeCategories]);
  const isAllExpanded = useMemo(() => {
    return allCategoryIds.length > 0 && allCategoryIds.every((id) => !!expandedCats[id]);
  }, [allCategoryIds, expandedCats]);

  const toggleAll = () => {
    if (isAllExpanded) {
      // Collapse all
      const next: Record<string, boolean> = {};
      allCategoryIds.forEach((id) => (next[id] = false));
      setExpandedCats(next);
      setActiveChip(null);
    } else {
      // Expand all
      const next: Record<string, boolean> = {};
      allCategoryIds.forEach((id) => (next[id] = true));
      setExpandedCats(next);
      setActiveChip('all');
    }
  };

  const toggleCategory = (catId: string) => {
    setExpandedCats((prev) => {
      const nextState = !prev[catId];
      return {
        ...prev,
        [catId]: nextState,
      };
    });
  };

  const handleChipClick = (catId: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchQuery('');
      setSearchInput('');
      setShowSuggestions(false);
    }

    if (catId === 'all') {
      toggleAll();
    } else {
      // Expand only the selected category with stable scroll position
      const next: Record<string, boolean> = {};
      allCategoryIds.forEach((id) => (next[id] = id === catId));
      setExpandedCats(next);
      setActiveChip(catId);
    }
  };

  // Helper for Banner Type styling
  const getBannerStyle = (type: string) => {
    switch (type) {
      case 'danger':
        return {
          bg: 'linear-gradient(90deg, rgba(220, 38, 38, 0.32), rgba(153, 27, 27, 0.32))',
          border: 'rgba(239, 68, 68, 0.4)',
          badgeText: '🚨 Alert',
        };
      case 'warning':
      case 'warn':
        return {
          bg: 'linear-gradient(90deg, rgba(217, 119, 6, 0.32), rgba(180, 83, 9, 0.32))',
          border: 'rgba(245, 158, 11, 0.4)',
          badgeText: '⚠️ Notice',
        };
      case 'success':
        return {
          bg: 'linear-gradient(90deg, rgba(5, 150, 105, 0.32), rgba(4, 120, 87, 0.32))',
          border: 'rgba(16, 185, 129, 0.4)',
          badgeText: '✨ Update',
        };
      case 'info':
      default:
        return {
          bg: 'linear-gradient(90deg, rgba(37, 99, 235, 0.32), rgba(29, 78, 216, 0.32))',
          border: 'rgba(59, 130, 246, 0.4)',
          badgeText: 'ℹ️ Info',
        };
    }
  };

  // Section configs from database
  const heroConfig = publicData?.hero;
  const isHeroActive = heroConfig ? heroConfig.is_active : true;
  const heroTagline =
    lang === 'bn'
      ? heroConfig?.tagline_bn || 'দৈনন্দিন কাজের সব টুল, এখন এক প্ল্যাটফর্মে'
      : heroConfig?.tagline_en || 'Everyday tools, now on one platform';

  const searchPlaceholder =
    lang === 'bn'
      ? heroConfig?.search_placeholder_bn || 'কী দরকার? যেমন: পিডিএফ, ছবি, কিউআর, বয়স…'
      : heroConfig?.search_placeholder_en || 'What do you need? e.g. PDF, image, QR, age…';

  const announcementConfig = publicData?.announcement;
  const isAnnouncementActive = announcementConfig ? announcementConfig.is_active : false;
  const announcementText = lang === 'bn' ? announcementConfig?.text_bn : announcementConfig?.text_en;
  const bannerStyle = getBannerStyle(announcementConfig?.type || 'info');

  const totalToolsCount = activeTools.length;

  return (
    <>
      <Header />

      {/* 1. Dynamic Live Announcement Banner (Controllable from Admin with dynamic Banner Type) */}
      {isAnnouncementActive && announcementText && !bannerDismissed && (
        <aside
          role="region"
          aria-label="Notice banner"
          style={{
            background: bannerStyle.bg,
            color: '#ffffff',
            borderBottom: `1px solid ${bannerStyle.border}`,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            padding: '10px 16px',
            fontSize: '13.5px',
            fontWeight: 600,
            boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
            position: 'relative',
            zIndex: 40,
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          <div
            className="wrap"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              position: 'relative',
              paddingRight: '32px',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '999px',
                background: 'rgba(0,0,0,0.22)',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {bannerStyle.badgeText}
            </span>
            <span style={{ letterSpacing: '0.01em' }}>{announcementText}</span>

            <button
              type="button"
              onClick={() => setBannerDismissed(true)}
              aria-label="Dismiss banner"
              title="Dismiss"
              style={{
                position: 'absolute',
                right: '0',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.85)',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                transition: 'color 0.2s, background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.background = 'rgba(255,255,255,0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              ✕
            </button>
          </div>
        </aside>
      )}

      {/* 2. Hero Section (Controllable from Admin) */}
      {isHeroActive && (
        <section className="hero">
          <div className="wrap hero-wrap">
            <h1 className="hero-tag" data-cfg="tagline">
              {heroTagline}
            </h1>

            {/* Search Box */}
            <div className="search big" role="search" ref={searchWrapRef}>
              <div className="search-box">
                <span className="ic" aria-hidden="true">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m21 21-4.34-4.34" />
                    <circle cx="11" cy="11" r="8" />
                  </svg>
                </span>
                <input
                  type="search"
                  id="q"
                  name="site_tool_search_no_autofill"
                  placeholder={searchPlaceholder}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-form-type="other"
                  aria-label="Search tools"
                  aria-controls="sugg"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onFocus={() => {
                    if (searchQuery.trim()) setShowSuggestions(true);
                  }}
                />
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && (
                <ul className="sugg" id="sugg">
                  {suggestions.length === 0 ? (
                    <li className="none">
                      {lang === 'bn'
                        ? 'কোনো টুল পাওয়া যায়নি। অন্য শব্দে চেষ্টা করুন (যেমন: pdf, ছবি, qr)।'
                        : 'No tool found. Try another word (e.g. pdf, image, qr).'}
                    </li>
                  ) : (
                    suggestions.map((tool) => (
                      <li key={tool.slug}>
                        <Link
                          href={`/tools/${tool.slug}`}
                          prefetch={true}
                          className={`c-${tool.cats[0]}`}
                          onClick={() => setShowSuggestions(false)}
                        >
                          <span className="mini-ico">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.9"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 2v20M2 12h20" />
                            </svg>
                          </span>
                          <span>
                            <b>{lang === 'bn' ? tool.bn : tool.en}</b>
                            <small>{lang === 'bn' ? tool.desc : tool.descEn}</small>
                          </span>
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>

            {/* Category Chips (Only active categories) */}
            <nav className="chips" aria-label="Categories">
              <a
                className={`chip chip-all ${activeChip === 'all' || isAllExpanded ? 'on' : ''}`}
                href="#all"
                data-cat="all"
                onClick={(e) => handleChipClick('all', e)}
              >
                <span className="chip-sym">✨</span>
                {lang === 'bn' ? 'সব টুলস (সব খুলুন)' : 'All (Expand All)'}
              </a>

              {activeCategories.map((cat) => (
                <a
                  key={cat.id}
                  className={`chip cat-${cat.id} ${activeChip === cat.id ? 'on' : ''}`}
                  href={`#cat-${cat.id}`}
                  data-cat={cat.id}
                  onClick={(e) => handleChipClick(cat.id, e)}
                >
                  <span className="chip-sym">{cat.symbol}</span>
                  {lang === 'bn' ? cat.bn : cat.en}
                </a>
              ))}
            </nav>
          </div>
        </section>
      )}

      {/* 3. Main Categories Accordion System */}
      <main className="wrap cats" id="main">
        {/* All Expand / Collapse Bar */}
        <div className="all-expand-bar" id="allExpandBar" hidden={!!searchQuery.trim()}>
          <div className="all-expand-info">
            <span className="all-expand-sym" aria-hidden="true">
              📂
            </span>
            <span className="all-expand-text">
              {lang === 'bn'
                ? `ক্যাটাগরি (${activeCategories.length}টি ক্যাটাগরি, ${totalToolsCount}টি টুল)`
                : `Categories (${activeCategories.length} categories, ${totalToolsCount} tools)`}
            </span>
          </div>
          <button
            type="button"
            className="btn-all-toggle"
            id="btnAllToggle"
            aria-expanded={isAllExpanded}
            onClick={toggleAll}
          >
            <span className="all-toggle-ic" aria-hidden="true">
              ↕️
            </span>
            <span className="all-toggle-text">
              {isAllExpanded
                ? lang === 'bn'
                  ? 'সব বন্ধ করুন'
                  : 'Collapse All'
                : lang === 'bn'
                ? 'সব খুলুন'
                : 'Expand All'}
            </span>
          </button>
        </div>

        {/* Categories Sections (Only active categories from DB) */}
        {activeCategories.map((category) => {
          // Filter tools for this category (only active tools from DB)
          const categoryTools = activeTools.filter((t) => t.cats.includes(category.id));
          const visibleTools = filteredTools
            ? categoryTools.filter((t) => filteredTools.some((ft) => ft.slug === t.slug))
            : categoryTools;

          if (filteredTools && visibleTools.length === 0) {
            return null;
          }

          const isExpanded = !!expandedCats[category.id] || !!searchQuery.trim();

          return (
            <section
              key={category.id}
              className={`cat cat-${category.id} in-view ${isExpanded ? 'expanded' : 'collapsed'}`}
              id={`cat-${category.id}`}
              aria-labelledby={`h-${category.id}`}
            >
              <div
                className="cat-head"
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                onClick={() => toggleCategory(category.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleCategory(category.id);
                  }
                }}
              >
                <div className="cat-head-info">
                  <div className="cat-head-title-row">
                    <h2 id={`h-${category.id}`}>
                      <span className="cat-head-sym">{category.symbol}</span>{' '}
                      {lang === 'bn' ? category.bn : category.en}
                    </h2>
                    <span className="cat-badge-count">
                      {lang === 'bn'
                        ? `${categoryTools.length}টি টুল`
                        : `${categoryTools.length} tools`}
                    </span>
                  </div>
                  <p>{lang === 'bn' ? category.desc : category.descEn}</p>
                </div>

                <button
                  type="button"
                  className="btn-cat-toggle"
                  aria-expanded={isExpanded}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCategory(category.id);
                  }}
                >
                  <span className="btn-toggle-text">
                    {isExpanded
                      ? lang === 'bn'
                        ? 'বন্ধ করুন'
                        : 'Collapse'
                      : lang === 'bn'
                      ? 'খুলুন'
                      : 'Expand'}
                  </span>
                  <span className="btn-toggle-arrow" aria-hidden="true">
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </button>
              </div>

              {/* Grid of Tools */}
              <div className="grid">
                {visibleTools.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} category={category.id} />
                ))}
              </div>
            </section>
          );
        })}

        {/* Empty Search State */}
        {filteredTools && filteredTools.length === 0 && (
          <p className="empty" id="emptyMsg">
            {lang === 'bn'
              ? 'কোনো টুল পাওয়া যায়নি। অন্য শব্দে চেষ্টা করুন, অথবা ওপরে "টুলের অনুরোধ" বাটনে ক্লিক করে জানান।'
              : 'No tool found. Try a different word, or click "Request a Tool" at the top to suggest one.'}
          </p>
        )}
      </main>

      <Footer customSettings={publicData?.footerSocial} />
    </>
  );
}
