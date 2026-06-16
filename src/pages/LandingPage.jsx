import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import footerBg from '../assets/bg.png';
import { 
  FiCheckCircle, 
  FiUsers, 
  FiBarChart2,
  FiShield,
  FiTrendingUp,
  FiMaximize,
  FiX,
  FiMail,
  FiLock,
  FiUnlock,
  FiEye,
  FiEyeOff,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiChevronDown,
  FiChevronUp,
  FiHelpCircle,
  FiSearch,
  FiFileText,
  FiPhone,
  FiMapPin,
  FiClipboard,
  FiRefreshCw,
  FiSettings,
  FiArrowUp,
  FiArrowDown,
  FiLinkedin,
  FiTwitter,
  FiGithub,
  FiShoppingBag,
  FiPackage,
} from 'react-icons/fi';
import { FaFilePdf } from 'react-icons/fa';
import ContactSupport from './faq/ContactSupport';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import NavIconDropdown, {
  THEME_OPTIONS_WITH_ICONS,
  FONT_SIZE_OPTIONS_WITH_ICONS,
} from '../components/NavIconDropdown';
import HeaderAccentBar from '../components/HeaderAccentBar';
import { useThemePreference } from '../hooks/useThemePreference';
import { useFontSizePreference } from '../hooks/useFontSizePreference';
import { useLanguagePreference } from '../hooks/useLanguagePreference';

const BrandMark = ({ className = 'w-20 h-20', darkMode = false }) => (
  <div
    className={`${className} mx-auto flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-green-800 shadow-lg`}
    aria-hidden
  >
    <FiBarChart2 className="h-1/2 w-1/2 text-white" strokeWidth={2.2} />
  </div>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, setAuthUser } = useAuth();
  
  // Use environment variable directly
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
  
  const { themePreference, setThemePreference, darkMode } = useThemePreference();
  const { fontSizePreference, setFontSizePreference } = useFontSizePreference();
  const { language, setLanguage, languageOptions } = useLanguagePreference();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showContactSupportModal, setShowContactSupportModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSliderPaused, setIsSliderPaused] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [showDashboardLoader, setShowDashboardLoader] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [getStartedLoading, setGetStartedLoading] = useState(false);
  const [learnMoreLoading, setLearnMoreLoading] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [landingFaqs, setLandingFaqs] = useState([]);
  const [landingFaqLoading, setLandingFaqLoading] = useState(false);
  const [landingFaqError, setLandingFaqError] = useState('');
  const [landingTroubleshooting, setLandingTroubleshooting] = useState([]);
  const [landingTroubleshootingLoading, setLandingTroubleshootingLoading] = useState(false);
  const [landingTroubleshootingError, setLandingTroubleshootingError] = useState('');
  /** Active question category names from API — same order as FAQ → Question Categories (public). */
  const [faqQuestionCategoryNames, setFaqQuestionCategoryNames] = useState([]);
  const [activeFaqCategory, setActiveFaqCategory] = useState('all');
  const [accordionShowAllFaqs, setAccordionShowAllFaqs] = useState(false);
  const [landingContactInfo, setLandingContactInfo] = useState({
    email: 'support@sitometrics.com',
    phone: '+255 700 000 000',
    address: 'Operations Centre, Dar es Salaam, Tanzania',
  });
  const [landingContactInfoLoading, setLandingContactInfoLoading] = useState(false);
  const [landingContactInfoError, setLandingContactInfoError] = useState('');
  const [landingGuides, setLandingGuides] = useState([]);
  const [landingGuidesLoading, setLandingGuidesLoading] = useState(false);
  const [landingGuidesError, setLandingGuidesError] = useState('');
  const [landingGuideTypes, setLandingGuideTypes] = useState([]);
  const [activeLandingGuideType, setActiveLandingGuideType] = useState('all');
  const [showAllLandingGuides, setShowAllLandingGuides] = useState(false);
  const [docPreview, setDocPreview] = useState({ open: false, title: '', url: '' });
  const [serviceModalId, setServiceModalId] = useState(null);

  useEffect(() => {
    setAccordionShowAllFaqs(false);
  }, [activeFaqCategory]);

  // Load contact info for footer (admin-configured).
  useEffect(() => {
    const controller = new AbortController();
    const loadContactInfo = async () => {
      try {
        setLandingContactInfoLoading(true);
        setLandingContactInfoError('');

        const res = await fetch(`${API_URL}/api/faq/contact-info`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          signal: controller.signal,
        });

        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload?.message || 'Failed to load contact info');

        const data = payload?.data || {};
        setLandingContactInfo({
          email: data.email ?? 'support@sitometrics.com',
          phone: data.phone ?? '+255 700 000 000',
          address: data.address ?? 'Operations Centre, Dar es Salaam, Tanzania',
        });
      } catch (e) {
        setLandingContactInfoError(e?.message || 'Failed to load contact info');
      } finally {
        setLandingContactInfoLoading(false);
      }
    };

    loadContactInfo();
    return () => controller.abort();
  }, [API_URL]);

  // Load user guides for the About resources teaser/expanded section.
  useEffect(() => {
    const controller = new AbortController();

    const loadGuides = async () => {
      try {
        setLandingGuidesLoading(true);
        setLandingGuidesError('');

        const res = await fetch(`${API_URL}/api/faq/guides`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload?.message || 'Failed to load guides');

        setLandingGuides(Array.isArray(payload?.data) ? payload.data : []);
      } catch (e) {
        if (e?.name === 'AbortError') return;
        setLandingGuidesError(e?.message || 'Failed to load guides');
        setLandingGuides([]);
      } finally {
        setLandingGuidesLoading(false);
      }
    };

    loadGuides();
    return () => controller.abort();
  }, [API_URL]);

  // Load active guide types for landing tabs (same source as /faq/guides).
  useEffect(() => {
    const controller = new AbortController();

    const loadGuideTypes = async () => {
      try {
        const res = await fetch(`${API_URL}/api/faq/guide-types`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload?.message || 'Failed to load guide types');

        const rows = Array.isArray(payload?.data) ? payload.data : [];
        const normalized = rows
          .filter((r) => r?.code && r?.name)
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((r) => ({ code: String(r.code).trim(), name: String(r.name).trim() }))
          .filter((r) => r.code && r.name);
        setLandingGuideTypes(normalized);
      } catch (e) {
        if (e?.name === 'AbortError') return;
        setLandingGuideTypes([]);
      }
    };

    loadGuideTypes();
    return () => controller.abort();
  }, [API_URL]);

  const fallbackFaqs = [
    {
      id: 1,
      sort_order: 1,
      question: 'What is SITOMETRICS and who is it for?',
      answer:
        'SITOMETRICS is a food and beverage inventory and procurement ERP. It serves operations teams, store keepers, procurement officers, kitchen and bar managers, and administrators who need accurate stock, costing, and purchase-to-receipt traceability.',
    },
    {
      id: 2,
      sort_order: 2,
      question: 'How does SITOMETRICS improve inventory control?',
      answer:
        'Every receipt, issue, adjustment, and stock count updates store balances in real time. FIFO costing on issues, auditable procurement workflows, and consumption reporting help teams reduce waste and make data-driven replenishment decisions.',
    },
    {
      id: 3,
      sort_order: 3,
      question: 'What modules are included?',
      answer:
        'Core modules include item master and categories, purchase requisitions and LPOs, GRN receiving, store requests and issues, stock adjustments and counts, menu recipes, kitchen and bar transactions, consumption reporting, and user management with role-based access.',
    },
    {
      id: 4,
      sort_order: 4,
      question: 'Is training provided for using SITOMETRICS?',
      answer:
        'Yes. We provide user guides, documentation, and onboarding support for store, procurement, and F&B teams. Administrators can configure roles and permissions to match your organisation structure.',
    },
    {
      id: 5,
      sort_order: 5,
      question: 'How secure is data stored in SITOMETRICS?',
      answer:
        'SITOMETRICS uses secure authentication, role-based access control, encrypted transport, and regular backups. Transaction history is retained for audit and accountability across procurement and inventory operations.',
    },
    {
      id: 6,
      sort_order: 6,
      question: 'Can SITOMETRICS integrate with other systems?',
      answer:
        'The platform exposes APIs for integration with accounting, POS, or supplier systems. Contact support to discuss data exchange requirements for your environment.',
    },
    {
      id: 7,
      sort_order: 7,
      question: 'What kind of reports can SITOMETRICS generate?',
      answer:
        'Reports cover stock on hand, movement history, procurement status, GRN summaries, consumption by outlet, stock count variances, and costing. Exports support operational review and management reporting.',
    },
    {
      id: 8,
      sort_order: 8,
      question: 'How do I get access?',
      answer:
        'Ask your system administrator to provision an account with the appropriate role. Use the Login button on this page once credentials are issued. For support, contact us via the Contact section.',
    },
  ];

  /**
   * Keyword buckets for hardcoded fallback FAQs only (when API returns no questions).
   * API-sourced rows use `category` from the backend only — avoids fake sidebar entries like "Reporting & Exports".
   */
  const getFaqCategory = (faq) => {
    const c = faq?.category != null ? String(faq.category).trim() : '';
    if (c) return c;
    const q = String(faq?.question || '').toLowerCase();

    if (q.includes('password') || q.includes('reset')) return 'Account Management & Login';
    if (q.includes('export') || q.includes('report') || q.includes('consumption')) return 'Reporting & Exports';
    if (q.includes('procurement') || q.includes('lpo') || q.includes('requisition') || q.includes('grn'))
      return 'Procurement & Receiving';
    if (q.includes('stock') || q.includes('inventory') || q.includes('store') || q.includes('count'))
      return 'Inventory Management';
    if (q.includes('kitchen') || q.includes('bar') || q.includes('recipe')) return 'F&B Operations';
    if (q.includes('browser')) return 'Compatibility';
    if (q.includes('secure') || q.includes('encryption') || q.includes('data protection'))
      return 'Security & Privacy';
    if (q.includes('access') || q.includes('role')) return 'Access & Roles';
    if (q.includes('data updated') || q.includes('how often')) return 'Data Management';
    if (q.includes('integrate')) return 'Integrations';
    if (q.includes('training')) return 'Training & Support';
    if (q.includes('what is sitometrics') || q.includes('who is it for')) return 'Getting Started';

    return 'General';
  };

  /** Match admin cleanup: hide "(Admin)" suffix on public landing only (filter still uses full API name). */
  const displayQuestionCategoryLabel = (name) =>
    String(name || '')
      .replace(/\s*\(Admin\)\s*$/i, '')
      .trim();

  const sortFaqAccordionItems = (list) =>
    [...list].sort((a, b) => {
      const so = (a.sort_order ?? 0) - (b.sort_order ?? 0);
      if (so !== 0) return so;
      const kindOrder =
        a.kind === b.kind ? 0 : a.kind === 'general' ? -1 : 1;
      if (kindOrder !== 0) return kindOrder;
      return (Number(a.id) || 0) - (Number(b.id) || 0);
    });

  const stripHtml = (html) =>
    String(html || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  /** Only active categories from GET /api/faq/question-categories (same as admin public list). */
  const faqSidebarCategoryList = faqQuestionCategoryNames;

  const activeCategoryLowerSet = useMemo(() => {
    const s = new Set();
    for (const n of faqQuestionCategoryNames) {
      const t = String(n).trim().toLowerCase();
      if (t) s.add(t);
    }
    return s;
  }, [faqQuestionCategoryNames]);

  const faqsForFaqSection = useMemo(() => {
    const fromApiGeneral = landingFaqs?.length > 0;
    const generalSource = fromApiGeneral ? landingFaqs : fallbackFaqs;
    const generalUnified = generalSource.map((f) => ({
      key: `general-${f.id}`,
      kind: 'general',
      id: f.id,
      question: f.question,
      answer: f.answer,
      category: fromApiGeneral ? String(f.category ?? '').trim() : getFaqCategory(f),
      sort_order: f.sort_order ?? 0,
    }));

    const fromApiTrouble = landingTroubleshooting?.length > 0;
    const troubleshootingUnified = fromApiTrouble
      ? landingTroubleshooting.map((p) => ({
          key: `trouble-${p.id}`,
          kind: 'troubleshooting',
          id: p.id,
          question: p.problem,
          solutions: p.solutions || [],
          category: String(p.category ?? '').trim(),
          sort_order: p.sort_order ?? 0,
        }))
      : [];

    const merged = [...generalUnified, ...troubleshootingUnified];
    const filtered =
      activeCategoryLowerSet.size === 0
        ? merged
        : merged.filter((row) => {
            const c = String(row.category || '').trim();
            if (!c) return true;
            return activeCategoryLowerSet.has(c.toLowerCase());
          });

    return sortFaqAccordionItems(filtered);
  }, [landingFaqs, landingTroubleshooting, activeCategoryLowerSet]);

  const accordionPreviewLimit = 6;
  const accordionFaqsFiltered = useMemo(() => {
    const raw =
      activeFaqCategory === 'all'
        ? faqsForFaqSection
        : faqsForFaqSection.filter((f) => String(f.category || '') === activeFaqCategory);
    return sortFaqAccordionItems(Array.isArray(raw) ? raw : []);
  }, [faqsForFaqSection, activeFaqCategory]);

  const accordionFaqsToShow = accordionShowAllFaqs
    ? accordionFaqsFiltered
    : accordionFaqsFiltered.slice(0, accordionPreviewLimit);

  const landingGuideTypeNameByCode = useMemo(() => {
    const m = new Map();
    landingGuideTypes.forEach((t) => m.set(String(t.code), String(t.name)));
    return m;
  }, [landingGuideTypes]);

  const landingGuideTypeTabs = useMemo(
    () => ['all', ...landingGuideTypes.map((t) => String(t.code))],
    [landingGuideTypes]
  );

  const filteredLandingGuides = useMemo(() => {
    if (activeLandingGuideType === 'all') return landingGuides;
    return landingGuides.filter((g) => String(g.type || '') === activeLandingGuideType);
  }, [landingGuides, activeLandingGuideType]);

  const landingGuideCountByType = useMemo(() => {
    const counts = new Map();
    for (const g of landingGuides) {
      const code = String(g?.type || '').trim();
      if (!code) continue;
      counts.set(code, (counts.get(code) || 0) + 1);
    }
    return counts;
  }, [landingGuides]);

  useEffect(() => {
    if (!landingGuideTypeTabs.includes(activeLandingGuideType)) {
      setActiveLandingGuideType('all');
    }
  }, [landingGuideTypeTabs, activeLandingGuideType]);

  useEffect(() => {
    setShowAllLandingGuides(false);
  }, [activeLandingGuideType]);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [loadedImages, setLoadedImages] = useState({});
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Load FAQ general + troubleshooting + question categories (same sources as /faq/* public pages).
  useEffect(() => {
    const controller = new AbortController();
    const loadLandingFaqBundle = async () => {
      try {
        setLandingFaqLoading(true);
        setLandingTroubleshootingLoading(true);
        setLandingFaqError('');
        setLandingTroubleshootingError('');

        const [genRes, troubRes, catRes] = await Promise.all([
          fetch(`${API_URL}/api/faq/general`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          }),
          fetch(`${API_URL}/api/faq/troubleshooting`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          }),
          fetch(`${API_URL}/api/faq/question-categories`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          }),
        ]);

        const genPayload = await genRes.json().catch(() => ({}));
        if (genRes.ok && Array.isArray(genPayload?.data)) {
          const items = genPayload.data
            .map((it) => ({
              id: it.id,
              question: it.question,
              category: it.category,
              answer: it.answer,
              sort_order: it.sort_order ?? 0,
            }))
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
          setLandingFaqs(items);
        } else {
          if (!genRes.ok) {
            setLandingFaqError(genPayload?.message || 'Failed to load FAQ');
          }
          setLandingFaqs([]);
        }

        const troubPayload = await troubRes.json().catch(() => ({}));
        if (troubRes.ok && Array.isArray(troubPayload?.data)) {
          setLandingTroubleshooting(
            troubPayload.data
              .map((it) => ({
                id: it.id,
                problem: it.problem,
                solutions: (Array.isArray(it.solutions) ? it.solutions : [])
                  .map((s) => {
                    if (typeof s === 'string') return s;
                    return s?.solution ?? '';
                  })
                  .filter(Boolean),
                category: it.category ?? null,
                sort_order: it.sort_order ?? 0,
              }))
              .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          );
        } else {
          if (!troubRes.ok) {
            setLandingTroubleshootingError(troubPayload?.message || 'Failed to load Troubleshooting');
          }
          setLandingTroubleshooting([]);
        }

        const catPayload = await catRes.json().catch(() => ({}));
        if (catRes.ok && Array.isArray(catPayload?.data)) {
          const names = [...catPayload.data]
            .filter((c) => c?.name)
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((c) => String(c.name).trim())
            .filter(Boolean);
          setFaqQuestionCategoryNames(names);
        } else {
          setFaqQuestionCategoryNames([]);
        }
      } catch (e) {
        if (e?.name !== 'AbortError') {
          setLandingFaqError((prev) => prev || e?.message || 'Failed to load FAQ');
          setLandingTroubleshootingError((prev) => prev || e?.message || 'Failed to load data');
        }
      } finally {
        setLandingFaqLoading(false);
        setLandingTroubleshootingLoading(false);
      }
    };

    loadLandingFaqBundle();
    return () => controller.abort();
  }, [API_URL]);

  useEffect(() => {
    if (activeFaqCategory === 'all') return;
    if (faqSidebarCategoryList.length && !faqSidebarCategoryList.includes(activeFaqCategory)) {
      setActiveFaqCategory('all');
    }
  }, [activeFaqCategory, faqSidebarCategoryList]);

  const slides = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1920&h=600&fit=crop',
      title: 'Inventory & Procurement, Unified',
      description: 'Manage purchase requisitions, LPOs, and goods receipt from one modern ERP platform',
      gradient: 'from-stone-950/70 via-stone-900/55 to-stone-800/35',
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&h=600&fit=crop',
      title: 'Food & Beverage Operations',
      description: 'Track kitchen recipes, bar sales, store issues, and consumption with full traceability',
      gradient: 'from-stone-950/70 via-stone-900/55 to-stone-800/35',
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&h=600&fit=crop',
      title: 'Real-Time Stock Intelligence',
      description: 'Stock counts, adjustments, FIFO costing, and dashboards that keep teams aligned',
      gradient: 'from-stone-950/70 via-stone-900/55 to-stone-800/35',
    },
  ];

  const stats = [
    { id: 1, value: '6+', label: 'Core ERP Modules', icon: FiPackage, color: 'blue' },
    { id: 2, value: 'Live', label: 'Stock Visibility', icon: FiBarChart2, color: 'green' },
    { id: 3, value: 'FIFO', label: 'Costing Method', icon: FiTrendingUp, color: 'purple' },
    { id: 4, value: '24/7', label: 'System Support', icon: FiShield, color: 'orange' },
  ];

  const services = [
    {
      id: 1,
      icon: FiClipboard,
      shortLabel: 'PR / LPO',
      title: 'Procurement',
      description:
        'Purchase requisitions through approval, LPO generation, and supplier tracking for auditable buying.',
      items: [
        'Raise and approve purchase requisitions',
        'Convert approved requests to Local Purchase Orders',
        'Track order status and procurement history',
        'Full audit trail from request to purchase order',
      ],
    },
    {
      id: 2,
      icon: FiPackage,
      shortLabel: 'GRN',
      title: 'Goods Receipt (GRN)',
      description:
        'Record incoming deliveries against LPOs and update store balances and costs automatically.',
      items: [
        'Receive goods against approved LPOs',
        'Capture quantities, batch details, and costs',
        'Update on-hand stock on receipt',
        'Link receipts to procurement for traceability',
      ],
    },
    {
      id: 3,
      icon: FiShoppingBag,
      shortLabel: 'Store',
      title: 'Store Operations',
      description:
        'Store requests, issues, adjustments, and stock counts for accurate multi-location inventory.',
      items: [
        'Internal store requests and issues',
        'Stock adjustments with reason codes',
        'Periodic stock counts and variance reporting',
        'Multi-store visibility for operations teams',
      ],
    },
    {
      id: 4,
      icon: FiRefreshCw,
      shortLabel: 'F&B',
      title: 'Kitchen & Bar',
      description:
        'Menu recipes, production transactions, and consumption linked back to central inventory.',
      items: [
        'Recipe definitions with ingredient quantities',
        'Kitchen and bar transaction recording',
        'Consumption driven by production and sales',
        'Tie F&B outlets back to store inventory',
      ],
    },
    {
      id: 5,
      icon: FiSettings,
      shortLabel: 'Master',
      title: 'Item Master',
      description:
        'Categories, units, items, and costing setup—the foundation for all stock movements.',
      items: [
        'Item categories and units of measure',
        'Product catalog with codes and descriptions',
        'Store and location configuration',
        'Master data for procurement and issues',
      ],
    },
    {
      id: 6,
      icon: FiUsers,
      shortLabel: 'Users',
      title: 'User Management',
      description:
        'Role-based access for store keepers, procurement, kitchen managers, and administrators.',
      items: [
        'Role-based permissions by module',
        'Secure authentication and account management',
        'Delegation aligned to operations governance',
        'Audit-friendly activity tied to transactions',
      ],
    },
  ];

  const serviceModalService =
    serviceModalId != null ? services.find((s) => s.id === serviceModalId) ?? null : null;

  useEffect(() => {
    if (serviceModalId == null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setServiceModalId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [serviceModalId]);

  useEffect(() => {
    if (!isSliderPaused) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [slides.length, isSliderPaused]);

  // Keyboard navigation for slider
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Scroll detection for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImageLoad = (slideId) => {
    setLoadedImages(prev => ({ ...prev, [slideId]: true }));
  };

  const tourSteps = [
    {
      title: 'Welcome to SITOMETRICS',
      description: 'Take a quick tour to discover how our F&B inventory and procurement ERP works.',
      position: 'center',
    },
    {
      title: 'Interactive Slider',
      description: 'Browse key capabilities using the image slider. You can also use arrow keys for navigation.',
      target: '.slider-area',
      position: 'right',
    },
    {
      title: 'System Information',
      description: 'Find key information about SITOMETRICS ERP and sign in to your workspace.',
      target: '.info-panel',
      position: 'left',
    },
    {
      title: 'Quick Login',
      description: 'Access your account instantly with our secure login system.',
      target: '.login-btn-nav',
      position: 'bottom',
    },
    {
      title: 'Appearance & preferences',
      description:
        'Choose theme, text size, and language from the dropdowns in the top bar.',
      target: '.nav-preferences',
      position: 'bottom',
    },
  ];

  const nextTourStep = () => {
    if (tourStep < tourSteps.length - 1) {
      setTourStep(tourStep + 1);
    } else {
      setShowTour(false);
      setTourStep(0);
    }
  };

  const prevTourStep = () => {
    if (tourStep > 0) {
      setTourStep(tourStep - 1);
    }
  };

  const skipTour = () => {
    setShowTour(false);
    setTourStep(0);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseData = await response.json();

      // Check for successful response with token (new backend structure)
      if (response.ok && responseData.success && responseData.data) {
        const { user, token, roles, permissions } = responseData.data;
        if (token && user) {
          // Enrich user with formatted permissions (same as AuthContext.login)
          const enrichedUser = {
            ...user,
            role_names: Array.isArray(roles) ? roles : (user.role_names ?? []),
            permissions: permissions ?? user.permissions ?? null,
          };
          // Update AuthContext state immediately
          setAuthUser(enrichedUser, token);
          
          setLoginLoading(false);
          setShowLoginModal(false);
          setShowDashboardLoader(true);
          setTimeout(() => {
            navigate(user.password_change_required ? '/profile?forcePasswordChange=1' : '/');
          }, 2000);
        } else {
          setLoginError('Login failed. Invalid response from server.');
          setLoginLoading(false);
        }
      } else {
        // Handle various error response formats
        const errorMessage = responseData.message || responseData.error || 'Login failed. Please check your credentials.';
        setLoginError(errorMessage);
        setLoginLoading(false);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setLoginError('Request timeout. Backend is not responding. Please check if it\'s running.');
      } else {
        setLoginError(`Network error: ${error.message}. Check if backend is running at ${API_URL}`);
      }
      setLoginLoading(false);
    }
  };

  const openLoginModal = () => {
    setShowLoginModal(true);
    setLoginError('');
    setShowPassword(false);
    setLoginForm({ email: '', password: '' });
  };

  const openResetModal = (e) => {
    e.preventDefault();
    setShowLoginModal(false);
    setShowResetModal(true);
    setResetError('');
    setResetSuccess(false);
    setResetEmail('');
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setResetError('');
    setResetSuccess(false);
    setResetEmail('');
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail)) {
      setResetError('Please enter a valid email address');
      setResetLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/password/forgot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        setResetSuccess(true);
      } else {
        setResetError(data.message || 'Failed to send reset email. Please try again.');
      }
    } catch {
      setResetError('Network error. Please check your connection and try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleGetStarted = () => {
    setGetStartedLoading(true);
    setTimeout(() => {
      setGetStartedLoading(false);
      setShowLoginModal(true);
    }, 500);
  };

  const handleLearnMore = () => {
    setLearnMoreLoading(true);
    setTimeout(() => {
      setLearnMoreLoading(false);
      // Scroll to services section
      const servicesSection = document.getElementById('services');
      if (servicesSection) {
        servicesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 500);
  };

  return (
    <div
      className={`flex min-h-screen flex-col transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-white'}`}
    >
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 1s ease-out;
        }

        .animate-slide-up {
          animation: slideUp 0.8s ease-out forwards;
          opacity: 0;
        }

        .fade-in {
          animation: fadeIn 1.5s ease-out;
        }

        .shadow-3xl {
          box-shadow: 0 35px 60px -15px rgba(0, 0, 0, 0.3);
        }
      `}</style>
      <div className="flex-1">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-colors duration-300 ${
        darkMode ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'
      } backdrop-blur-sm border-b shadow-sm`}>
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <FiBarChart2 className={`w-10 h-10 ${darkMode ? 'text-green-500' : 'text-green-600'}`} strokeWidth={2.5} />
              <div>
                <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  SITOMETRICS
                </h1>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  F&B Inventory & Procurement ERP
                </p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#home" className={`relative font-medium transition-all group ${
                darkMode ? 'text-gray-300 hover:text-primary-400' : 'text-gray-600 hover:text-primary-600'
              }`}>
                <span>Home</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#about" className={`relative font-medium transition-all group ${
                darkMode ? 'text-gray-300 hover:text-primary-400' : 'text-gray-600 hover:text-primary-600'
              }`}>
                <span>About</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-900 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#user-guides" className={`relative font-medium transition-all group ${
                darkMode ? 'text-gray-300 hover:text-primary-400' : 'text-gray-600 hover:text-primary-600'
              }`}>
                <span>User Guides</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#services" className={`relative font-medium transition-all group ${
                darkMode ? 'text-gray-300 hover:text-primary-400' : 'text-gray-600 hover:text-primary-600'
              }`}>
                <span>Modules</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-yellow-400 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#faq" className={`relative font-medium transition-all group ${
                darkMode ? 'text-gray-300 hover:text-primary-400' : 'text-gray-600 hover:text-primary-600'
              }`}>
                <span>FAQs</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#contact" className={`relative font-medium transition-all group ${
                darkMode ? 'text-gray-300 hover:text-primary-400' : 'text-gray-600 hover:text-primary-600'
              }`}>
                <span>Contact Us</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <button
                onClick={() => setShowTour(true)}
                className={`relative font-medium transition-all group ${
                  darkMode ? 'text-gray-300 hover:text-primary-400' : 'text-gray-600 hover:text-primary-600'
                }`}
                aria-label="Start guided tour"
              >
                <span>Tour</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-yellow-500 transition-all duration-300 group-hover:w-full"></span>
              </button>
            </div>

            {/* Right Actions */}
            <div className="nav-preferences flex flex-wrap items-center justify-end gap-2 sm:gap-3">
              <NavIconDropdown
                id="landing-theme"
                value={themePreference}
                onChange={setThemePreference}
                options={THEME_OPTIONS_WITH_ICONS}
                darkMode={darkMode}
                ariaLabel="Theme"
                className="theme-selector"
              />
              <NavIconDropdown
                id="landing-font-size"
                value={fontSizePreference}
                onChange={setFontSizePreference}
                options={FONT_SIZE_OPTIONS_WITH_ICONS}
                darkMode={darkMode}
                ariaLabel="Text size"
                className="font-size-selector"
              />
              <NavIconDropdown
                id="landing-language"
                value={language}
                onChange={setLanguage}
                options={languageOptions}
                darkMode={darkMode}
                ariaLabel="Language"
                showCodeInTrigger
                className="language-selector"
              />

              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullScreen}
                className={`p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 focus:ring-gray-600 focus:ring-offset-gray-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 focus:ring-gray-400 focus:ring-offset-white'
                }`}
                aria-label="Toggle fullscreen"
              >
                <FiMaximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        <HeaderAccentBar />
      </nav>

      {/* Hero Section with Slider and Info Panel */}
      <section id="home" className="relative h-screen overflow-hidden pt-20 bg-white">
        <div className={`flex flex-col lg:flex-row h-full ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
          {/* Left Side - Image Slider (70%) */}
          <div 
            className={`slider-area relative w-full lg:w-[70%] flex-1 lg:flex-none lg:h-[calc(100%-2.5rem)] shadow-xl lg:order-1 mt-5 ml-5 mb-5 rounded-3xl overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-white'}`}
            onMouseEnter={() => setIsSliderPaused(true)}
            onMouseLeave={() => setIsSliderPaused(false)}
            role="region"
            aria-label="Image carousel"
          >
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {/* Loading Skeleton */}
                {!loadedImages[slide.id] && (
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 animate-pulse" />
                )}
                
                {/* Lazy loaded image */}
                <img
                  src={slide.image}
                  alt={slide.title}
                  loading="lazy"
                  onLoad={() => handleImageLoad(slide.id)}
                  className={`absolute inset-0 w-full h-full object-cover transform transition-all duration-1000 hover:scale-105 ${
                    loadedImages[slide.id] ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient}`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="container mx-auto px-6 lg:px-12 text-center">
                    <h2 className="text-3xl md:text-4xl lg:text-6xl font-extrabold text-white mb-6 fade-in drop-shadow-2xl tracking-tight">
                      {slide.title}
                    </h2>
                    <p className="text-base md:text-lg lg:text-xl text-gray-50 mb-8 max-w-2xl mx-auto fade-in drop-shadow-lg font-medium">
                      {slide.description}
                    </p>
                    <div className="flex gap-4 justify-center fade-in flex-wrap">
                      <button 
                        onClick={handleGetStarted}
                        disabled={getStartedLoading}
                        aria-label="Get started with SITOMETRICS"
                        className="btn bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 text-base font-semibold disabled:opacity-70 disabled:cursor-not-allowed shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
                      >
                        {getStartedLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                            Loading...
                          </span>
                        ) : (
                          'Get Started'
                        )}
                      </button>
                      <button 
                        onClick={handleLearnMore}
                        disabled={learnMoreLoading}
                        aria-label="Learn more about SITOMETRICS"
                        className="btn bg-white/10 backdrop-blur-md border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-3 text-base font-semibold disabled:opacity-70 disabled:cursor-not-allowed shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
                      >
                        {learnMoreLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Loading...
                          </span>
                        ) : (
                          'Learn More'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Slider Controls */}
            <button
              onClick={prevSlide}
              aria-label="Previous slide"
              className="absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 p-3 lg:p-4 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md transition-all duration-300 z-10 shadow-xl hover:shadow-2xl transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
            >
              <FiChevronLeft className="w-5 h-5 lg:w-6 lg:h-6 text-white drop-shadow-lg" />
            </button>
            <button
              onClick={nextSlide}
              aria-label="Next slide"
              className="absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 p-3 lg:p-4 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md transition-all duration-300 z-10 shadow-xl hover:shadow-2xl transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
            >
              <FiChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-white drop-shadow-lg" />
            </button>

            {/* Slider Indicators */}
            <div className="absolute bottom-6 lg:bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
              {slides.map((slide, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Go to slide ${index + 1}: ${slide.title}`}
                  title={slide.title}
                  className={`h-2 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 ${
                    index === currentSlide 
                      ? 'w-10 bg-white transform scale-110' 
                      : 'w-2 bg-white/50 hover:bg-white/70 hover:scale-110'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Right Side - System Info Panel (30%) */}
          <div className={`info-panel relative lg:w-[30%] min-h-[500px] lg:min-h-0 lg:h-full flex flex-col items-center justify-center px-6 py-8 lg:px-8 lg:py-0 overflow-hidden lg:order-2 shadow-2xl ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
            {/* Vertical Flag Divider */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-64 flex flex-col rounded-l-lg overflow-hidden shadow-lg">
              <div className={`flex-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-900'}`}></div>
            </div>

            <div className="relative z-10 text-center space-y-5 max-w-sm animate-fade-in">
              <div className="animate-slide-up" style={{ animationDelay: '0s' }}>
                <BrandMark className="w-32 h-32" darkMode={darkMode} />
              </div>

              <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <h3 className={`text-l font-semibold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  SITOMETRICS ERP
                </h3>
              </div>

              <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <p className={`text-xl font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Food & Beverage Operations Platform
                </p>
              </div>

              <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <h2 className={`text-xl font-extrabold ${darkMode ? 'text-green-400' : 'bg-gradient-to-r from-green-600 via-green-600 to-green-600 bg-clip-text text-transparent'} drop-shadow-lg filter hover:drop-shadow-2xl transition-all duration-300 hover:scale-105 cursor-default`}>
                  Inventory · Procurement · Costing
                </h2>
              </div>

              <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <p className={`text-sm leading-relaxed font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  End-to-end control from purchase requisition to store issue, kitchen consumption, and reporting.
                </p>
              </div>

              {/* Login Button */}
              <div className="pt-4 animate-slide-up" style={{ animationDelay: '0.7s' }}>
                <button
                  onClick={() => setShowLoginModal(true)}
                  aria-label="Open login modal"
                  title ="Click to login"
                  className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 mx-auto shadow-lg hover:shadow-2xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 border-2 ${darkMode ? 'text-green-400 border-green-400 hover:bg-green-400 hover:text-gray-900' : 'text-green-700 border-green-700 hover:bg-green-700 hover:text-white'}`}
                >
                  <FiLock className="w-5 h-5" />
                  <span>Login</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* About Section */}
      <section
        id="about"
        className={`relative overflow-hidden py-16 md:py-20 ${
          darkMode ? 'bg-gray-900' : 'bg-gradient-to-b from-primary-50/70 via-gray-50 to-gray-50'
        }`}
        aria-labelledby="about-heading"
      >
        <div
          className={`pointer-events-none absolute inset-0 ${
            darkMode
              ? 'bg-gradient-to-b from-primary-900/25 via-transparent to-transparent'
              : 'bg-gradient-to-b from-primary-100/25 via-transparent to-transparent'
          }`}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.12]"
          style={{
            backgroundImage: darkMode
              ? `linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)`
              : `linear-gradient(rgba(2, 132, 199, 0.07) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(2, 132, 199, 0.07) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
          aria-hidden
        />

        <div className="container relative z-10 mx-auto px-6">
          <div className="w-full max-w-6xl lg:mx-auto">
            {/* About card: badge + two-column intro + stats + features */}
            <div
              className={`w-full min-w-0 rounded-2xl border p-8 shadow-lg md:p-10 lg:p-12 relative overflow-hidden ${
                darkMode ? 'border-gray-700/80 bg-gray-800/60 backdrop-blur-sm' : 'border-gray-200/90 bg-white/80 backdrop-blur-sm'
              }`}
            >
              <div className={`absolute inset-x-0 top-0 h-0.5 ${darkMode ? 'bg-primary-500/70' : 'bg-primary-500'}`} />
              <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-10">
                <div className="hidden md:block shrink-0">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                    darkMode ? 'bg-primary-900/40 border border-primary-700/50' : 'bg-primary-100 border border-primary-200'
                  }`}>
                    <FiPackage className={`w-8 h-8 ${darkMode ? 'text-primary-300' : 'text-primary-700'}`} />
                  </div>
                </div>
                <div className="flex-1 min-w-0 space-y-8">
                  <div
                    className={`mb-2 flex md:hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                      darkMode ? 'bg-primary-900/40 border border-primary-700/50' : 'bg-primary-100 border border-primary-200'
                    }`}
                  >
                    <FiPackage className={`h-6 w-6 ${darkMode ? 'text-primary-300' : 'text-primary-700'}`} />
                  </div>

                  <div className="flex w-full flex-col gap-8 text-left lg:flex-row lg:items-start lg:gap-6 xl:gap-8">
                    <div className="w-full shrink-0 lg:w-auto lg:max-w-[13rem] xl:max-w-[14rem]">
                      <h2
                        id="about-heading"
                        className={`text-2xl font-bold leading-tight tracking-tight md:text-3xl lg:text-[2rem] lg:leading-[1.2] ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        About SITOMETRICS
                      </h2>
                      <div
                        className={`mt-3 h-1 w-10 rounded-full lg:mt-4 lg:w-12 ${
                          darkMode ? 'bg-primary-500/80' : 'bg-primary-500'
                        }`}
                        aria-hidden
                      />
                    </div>
                    <div className="min-w-0 w-full flex-1 basis-0 border-gray-200 lg:border-l lg:pl-6 xl:pl-8 dark:border-gray-600/80">
                      <div className="group w-full space-y-5">
                        <p
                          className={`text-base leading-relaxed transition-colors duration-300 ease-out md:text-lg md:leading-relaxed ${
                            darkMode
                              ? 'text-gray-300 group-hover:text-white'
                              : 'text-gray-600 group-hover:text-gray-900'
                          }`}
                        >
                          The{' '}
                          <span
                            className={`font-semibold transition-colors duration-300 ease-out ${
                              darkMode
                                ? 'text-primary-300 group-hover:text-primary-100'
                                : 'text-primary-600 group-hover:text-primary-700'
                            }`}
                          >
                            SITOMETRICS ERP
                          </span>{' '}
                          brings procurement, receiving, store operations, and F&B consumption into one auditable
                          platform built for hospitality and food-service operations.
                        </p>
                        <p
                          className={`text-base leading-relaxed transition-colors duration-300 ease-out md:text-lg md:leading-relaxed ${
                            darkMode
                              ? 'text-gray-300 group-hover:text-white'
                              : 'text-gray-600 group-hover:text-gray-900'
                          }`}
                        >
                          Teams gain live stock visibility, FIFO costing on issues, and structured workflows from
                          purchase requisition through GRN to kitchen and bar consumption—reducing manual spreadsheets
                          and reconciliation delays.
                        </p>
                        <p
                          className={`rounded-r-lg border-l-[3px] py-2 pl-4 text-sm font-medium leading-snug transition-colors duration-300 ease-out md:text-base md:pl-5 ${
                            darkMode
                              ? 'border-success-500 text-gray-400 group-hover:border-primary-300 group-hover:text-primary-100'
                              : 'border-success-600 text-gray-700 group-hover:border-primary-600 group-hover:text-primary-700'
                          }`}
                        >
                          Explore capabilities below, or open User Guides for step-by-step documentation.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className={`rounded-xl px-4 py-3 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                      <p className={`text-xs uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Scope</p>
                      <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>End-to-end</p>
                    </div>
                    <div className={`rounded-xl px-4 py-3 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                      <p className={`text-xs uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Costing</p>
                      <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>FIFO</p>
                    </div>
                    <div className={`rounded-xl px-4 py-3 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                      <p className={`text-xs uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Stock</p>
                      <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Live</p>
                    </div>
                    <div className={`rounded-xl px-4 py-3 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                      <p className={`text-xs uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Access</p>
                      <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Role-based</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <div
                      className={`group rounded-xl border p-5 transition-colors duration-300 ${
                        darkMode
                          ? 'border-gray-700 bg-gray-800 hover:border-primary-500/55'
                          : 'border-gray-200 bg-white hover:border-primary-400'
                      }`}
                    >
                      <FiCheckCircle className="mb-3 h-8 w-8 text-green-600 transition-[color,transform] duration-300 group-hover:scale-105 group-hover:text-green-500 dark:group-hover:text-green-400" />
                      <h4
                        className={`mb-2 font-semibold transition-colors duration-300 ${
                          darkMode
                            ? 'text-white group-hover:text-primary-200'
                            : 'text-gray-900 group-hover:text-primary-700'
                        }`}
                      >
                        Procurement to Receipt
                      </h4>
                      <p
                        className={`text-sm transition-colors duration-300 ${
                          darkMode
                            ? 'text-gray-400 group-hover:text-gray-200'
                            : 'text-gray-600 group-hover:text-gray-800'
                        }`}
                      >
                        PR, LPO, and GRN workflows with full audit trail
                      </p>
                    </div>

                    <div
                      className={`group rounded-xl border p-5 transition-colors duration-300 ${
                        darkMode
                          ? 'border-gray-700 bg-gray-800 hover:border-primary-500/55'
                          : 'border-gray-200 bg-white hover:border-primary-400'
                      }`}
                    >
                      <FiUsers className="mb-3 h-8 w-8 text-blue-600 transition-[color,transform] duration-300 group-hover:scale-105 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
                      <h4
                        className={`mb-2 font-semibold transition-colors duration-300 ${
                          darkMode
                            ? 'text-white group-hover:text-primary-200'
                            : 'text-gray-900 group-hover:text-primary-700'
                        }`}
                      >
                        Multi-team Operations
                      </h4>
                      <p
                        className={`text-sm transition-colors duration-300 ${
                          darkMode
                            ? 'text-gray-400 group-hover:text-gray-200'
                            : 'text-gray-600 group-hover:text-gray-800'
                        }`}
                      >
                        Store, procurement, kitchen, and bar on one platform
                      </p>
                    </div>

                    <div
                      className={`group rounded-xl border p-5 transition-colors duration-300 ${
                        darkMode
                          ? 'border-gray-700 bg-gray-800 hover:border-primary-500/55'
                          : 'border-gray-200 bg-white hover:border-primary-400'
                      }`}
                    >
                      <FiBarChart2 className="mb-3 h-8 w-8 text-purple-600 transition-[color,transform] duration-300 group-hover:scale-105 group-hover:text-purple-500 dark:group-hover:text-purple-400" />
                      <h4
                        className={`mb-2 font-semibold transition-colors duration-300 ${
                          darkMode
                            ? 'text-white group-hover:text-primary-200'
                            : 'text-gray-900 group-hover:text-primary-700'
                        }`}
                      >
                        Actionable Reporting
                      </h4>
                      <p
                        className={`text-sm transition-colors duration-300 ${
                          darkMode
                            ? 'text-gray-400 group-hover:text-gray-200'
                            : 'text-gray-600 group-hover:text-gray-800'
                        }`}
                      >
                        Stock movement, consumption, and variance insights
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: User guides — sibling of About card in the grid (not nested inside About card) */}
            <div className="hidden lg:col-start-2 lg:col-span-1 min-w-0 w-full flex-shrink-0 flex flex-col gap-6 self-start">
                  {/* Teaser */}
                  <div
                    className={`rounded-2xl p-5 border ${
                      darkMode ? 'bg-gray-900/30 border-gray-700' : 'bg-stone-100 border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${
                          darkMode ? 'border-primary-600/60 bg-gray-900/20' : 'border-primary-600 bg-white'
                        }`}
                      >
                        <FaFilePdf className={`w-6 h-6 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                      </div>
                      <h4
                        className={`text-lg font-bold uppercase tracking-wider ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        User Guides
                      </h4>
                    </div>
                    <div className={`h-px mb-4 ${darkMode ? 'bg-gray-700' : 'bg-primary-600/70'}`} />

                    {landingGuidesLoading ? (
                      <div className="space-y-3">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className={`p-4 rounded-xl border flex items-start gap-4 ${
                              darkMode ? 'bg-gray-800/20 border-gray-700' : 'bg-stone-100 border-stone-300'
                            }`}
                          >
                            <div
                              className={`w-12 h-12 rounded-lg border-2 ${
                                darkMode ? 'border-primary-600/50 bg-gray-800/30' : 'border-primary-600/50 bg-white'
                              }`}
                            />
                            <div className="flex-1 space-y-2">
                              <div className={`h-4 rounded ${darkMode ? 'bg-gray-800/40' : 'bg-gray-100'}`} />
                              <div className={`h-3 w-3/4 rounded ${darkMode ? 'bg-gray-800/40' : 'bg-gray-100'}`} />
                              <div className={`h-3 w-5/6 rounded ${darkMode ? 'bg-gray-800/40' : 'bg-gray-100'}`} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : landingGuidesError ? (
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {landingGuidesError}
                      </p>
                    ) : landingGuides.length ? (
                      <>
                        <div className="space-y-3">
                          {landingGuides.slice(0, 3).map((g) => {
                            const created = g.created_at ? new Date(g.created_at) : null;
                            const dateText =
                              created && !isNaN(created.getTime())
                                ? created.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: '2-digit',
                                    year: 'numeric',
                                  })
                                : '';

                            const locationText = [g.type, g.size || g.duration]
                              .filter(Boolean)
                              .join(' • ')
                              .toUpperCase();

                            const downloadUrl = g.download_url || '';
                            const hasLink = !!downloadUrl;

                            return (
                              <button
                                key={g.id ?? g.code ?? g.title}
                                type="button"
                                onClick={() => {
                                  setDocPreview({ open: true, title: g.title, url: downloadUrl });
                                }}
                                className={`p-4 rounded-xl border block ${
                                  darkMode
                                    ? 'bg-gray-800/30 border-gray-700 hover:bg-gray-800/10'
                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                                } transition-colors w-full text-left cursor-pointer`}
                              >
                                <div className="flex items-start gap-4">
                                  <div
                                    className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${
                                      darkMode ? 'border-red-500/40 bg-red-950/20' : 'border-red-200 bg-red-50'
                                    }`}
                                  >
                                    <FaFilePdf
                                      className={`w-7 h-7 ${darkMode ? 'text-red-400' : 'text-red-600'}`}
                                      aria-hidden
                                    />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <p
                                      className={`text-sm font-semibold uppercase tracking-wide line-clamp-2 ${
                                        darkMode ? 'text-gray-100' : 'text-gray-900'
                                      }`}
                                    >
                                      {g.title}
                                    </p>
                                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                      {dateText}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <FiMapPin
                                        className={`w-4 h-4 flex-shrink-0 ${
                                          darkMode ? 'text-primary-300' : 'text-primary-600'
                                        }`}
                                      />
                                      <span
                                        className={`text-xs font-medium uppercase truncate ${
                                          darkMode ? 'text-gray-200' : 'text-gray-700'
                                        }`}
                                      >
                                        {locationText}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {landingGuides.length > 3 ? (
                          <button
                            type="button"
                            onClick={() => setShowAllLandingGuides((v) => !v)}
                            className={`mt-4 text-sm font-semibold ${
                              darkMode ? 'text-primary-300 hover:underline' : 'text-primary-600 hover:underline'
                            }`}
                          >
                            {showAllLandingGuides ? 'See less' : 'Read more'}
                          </button>
                        ) : null}
                      </>
                    ) : (
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        No resources available.
                      </p>
                    )}
                  </div>

                  {/* Expanded */}
                  {showAllLandingGuides ? (
                    <div
                      className={`rounded-2xl p-5 border ${
                        darkMode ? 'bg-gray-900/30 border-gray-700' : 'bg-stone-100 border-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${
                            darkMode ? 'border-primary-600/60 bg-gray-900/20' : 'border-primary-600 bg-white'
                          }`}
                        >
                          <FaFilePdf className={`w-6 h-6 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                        </div>
                        <h4
                          className={`text-lg font-bold uppercase tracking-wider ${
                            darkMode ? 'text-white' : 'text-gray-900'
                          }`}
                        >
                        All User Guides
                        </h4>
                      </div>
                      <div className={`h-px mb-4 ${darkMode ? 'bg-gray-700' : 'bg-primary-600/70'}`} />

                      {landingGuidesLoading ? (
                        <div className="space-y-3">
                          {[0, 1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className={`p-4 rounded-xl border flex items-start gap-4 ${
                                darkMode ? 'bg-gray-800/20 border-gray-700' : 'bg-stone-100 border-stone-300'
                              }`}
                            >
                              <div
                                className={`w-12 h-12 rounded-lg border-2 ${
                                  darkMode ? 'border-primary-600/50 bg-gray-800/30' : 'border-primary-600/50 bg-white'
                                }`}
                              />
                              <div className="flex-1 space-y-2">
                                <div className={`h-4 rounded ${darkMode ? 'bg-gray-800/40' : 'bg-gray-100'}`} />
                                <div className={`h-3 w-3/4 rounded ${darkMode ? 'bg-gray-800/40' : 'bg-gray-100'}`} />
                                <div className={`h-3 w-5/6 rounded ${darkMode ? 'bg-gray-800/40' : 'bg-gray-100'}`} />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : landingGuidesError ? (
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {landingGuidesError}
                        </p>
                      ) : landingGuides.length ? (
                        <div className="space-y-3">
                          {landingGuides.map((g) => {
                            const created = g.created_at ? new Date(g.created_at) : null;
                            const dateText =
                              created && !isNaN(created.getTime())
                                ? created.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: '2-digit',
                                    year: 'numeric',
                                  })
                                : '';

                            const locationText = [g.type, g.size || g.duration]
                              .filter(Boolean)
                              .join(' • ')
                              .toUpperCase();

                            const downloadUrl = g.download_url || '';
                            const hasLink = !!downloadUrl;

                            return (
                              <button
                                key={g.id ?? g.code ?? g.title}
                                type="button"
                                onClick={() => {
                                  setDocPreview({ open: true, title: g.title, url: downloadUrl });
                                }}
                                className={`p-4 rounded-xl border block ${
                                  darkMode
                                    ? 'bg-gray-800/30 border-gray-700 hover:bg-gray-800/10'
                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                                } transition-colors w-full text-left cursor-pointer`}
                              >
                                <div className="flex items-start gap-4">
                                  <div
                                    className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${
                                      darkMode ? 'border-red-500/40 bg-red-950/20' : 'border-red-200 bg-red-50'
                                    }`}
                                  >
                                    <FaFilePdf
                                      className={`w-7 h-7 ${darkMode ? 'text-red-400' : 'text-red-600'}`}
                                      aria-hidden
                                    />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <p
                                      className={`text-sm font-semibold uppercase tracking-wide line-clamp-2 ${
                                        darkMode ? 'text-gray-100' : 'text-gray-900'
                                      }`}
                                    >
                                      {g.title}
                                    </p>
                                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                      {dateText}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <FiMapPin
                                        className={`w-4 h-4 flex-shrink-0 ${
                                          darkMode ? 'text-primary-300' : 'text-primary-600'
                                        }`}
                                      />
                                      <span
                                        className={`text-xs font-medium uppercase truncate ${
                                          darkMode ? 'text-gray-200' : 'text-gray-700'
                                        }`}
                                      >
                                        {locationText}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          No resources available.
                        </p>
                      )}

                      {landingGuides.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setShowAllLandingGuides(false)}
                          className={`mt-5 text-sm font-semibold ${
                            darkMode ? 'text-primary-300 hover:underline' : 'text-primary-600 hover:underline'
                          }`}
                        >
                          See less
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
      </section>

      {/* Dedicated User Guides Section (below About) */}
      <section id="user-guides" className={`py-20 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                User Guides
              </h2>
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Quick access to manuals and tutorials from FAQ Guides
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[14rem_1fr] gap-6 items-start">
              <aside
                className={`rounded-xl p-4 border ${
                  darkMode ? 'bg-gray-800/70 border-gray-700' : 'bg-primary-900 border-primary-800'
                }`}
              >
                <div className="space-y-2">
                  {landingGuideTypeTabs.map((code) => {
                    const isActive = activeLandingGuideType === code;
                    const label = code === 'all' ? 'All Documents' : landingGuideTypeNameByCode.get(code) || code;
                    const count = code === 'all' ? landingGuides.length : (landingGuideCountByType.get(code) || 0);
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setActiveLandingGuideType(code)}
                        className={`w-full rounded-lg px-3 py-2 text-sm flex items-center justify-between transition-colors ${
                          isActive
                            ? darkMode
                              ? 'bg-gray-700 text-white'
                              : 'bg-white text-primary-900'
                            : darkMode
                              ? 'text-gray-200 hover:bg-gray-700/60'
                              : 'text-white/95 hover:bg-primary-800'
                        }`}
                      >
                        <span className="truncate pr-2 text-left">{label}</span>
                        <span
                          className={`w-7 h-7 rounded-full text-xs grid place-items-center font-semibold ${
                            isActive
                              ? darkMode
                                ? 'bg-primary-600 text-white'
                                : 'bg-primary-900 text-white'
                              : darkMode
                                ? 'bg-gray-600 text-white'
                                : 'bg-white/90 text-primary-900'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </aside>

              <div className="min-w-0">
                {landingGuidesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`rounded-xl border p-4 ${
                          darkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-stone-100 border-stone-300'
                        }`}
                      >
                        <div className={`h-10 rounded mb-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                        <div className={`h-4 rounded w-5/6 mb-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                        <div className={`h-4 rounded w-3/4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                      </div>
                    ))}
                  </div>
                ) : landingGuidesError ? (
                  <p className="text-sm text-red-600 dark:text-red-400">{landingGuidesError}</p>
                ) : filteredLandingGuides.length ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 landing-guides-grid">
                      {(showAllLandingGuides ? filteredLandingGuides : filteredLandingGuides.slice(0, 4)).map((g) => {
                        const created = g.created_at ? new Date(g.created_at) : null;
                        const day = created && !isNaN(created.getTime()) ? created.toLocaleDateString('en-US', { day: '2-digit' }) : '--';
                        const month = created && !isNaN(created.getTime()) ? created.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : '---';
                        const year = created && !isNaN(created.getTime()) ? created.toLocaleDateString('en-US', { year: 'numeric' }) : '----';
                        return (
                          <button
                            key={g.id ?? g.code ?? g.title}
                            type="button"
                            onClick={() => setDocPreview({ open: true, title: g.title, url: g.download_url || '' })}
                            className={`landing-guide-book-card rounded-xl border p-4 text-left transition-all ${
                              darkMode
                                ? 'bg-gray-800/30 border-gray-700 hover:bg-gray-800/10'
                                : 'bg-stone-100 border-stone-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div
                                className={`landing-guide-book-icon-wrap w-14 h-14 rounded-lg border-2 grid place-items-center ${
                                  darkMode ? 'border-red-500/40 bg-red-950/20' : 'border-red-300 bg-white'
                                }`}
                              >
                                <FaFilePdf className={`landing-guide-book-icon w-8 h-8 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                              </div>
                              <div className={`landing-guide-date-badge rounded-lg px-3 py-2 text-center min-w-[4.2rem] ${
                                darkMode ? 'bg-green-700 text-white' : 'bg-green-600 text-white'
                              }`}>
                                <p className="text-lg font-bold leading-none">{day}</p>
                                <p className="text-[11px] leading-tight">{month}</p>
                                <p className="text-[11px] leading-tight">{year}</p>
                              </div>
                            </div>
                            <p className={`text-xs font-semibold uppercase line-clamp-2 min-h-[2.2rem] ${
                              darkMode ? 'text-gray-200' : 'text-gray-800'
                            }`}>
                              {g.title}
                            </p>
                            <div className="mt-3 flex justify-center">
                              <span className={`landing-guide-readmore inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${
                                darkMode
                                  ? 'text-primary-200 border-primary-700 bg-gray-900/40'
                                  : 'text-primary-800 border-primary-200 bg-white'
                              }`}>
                                Read More
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-end gap-4 mt-6">
                      {filteredLandingGuides.length > 4 && (
                        <button
                          type="button"
                          onClick={() => setShowAllLandingGuides((v) => !v)}
                          className={`text-sm font-semibold ${
                            darkMode ? 'text-primary-300 hover:underline' : 'text-primary-600 hover:underline'
                          }`}
                        >
                          {showAllLandingGuides ? 'See less' : 'Read more'}
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>No guides available for this type.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Stats Section */}
      <section className={`py-20 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.id}
                className={`rounded-xl shadow-sm border p-4 transition-all duration-300 hover:scale-105 ${
                  darkMode ? 'bg-gray-900 border-gray-700' : 'bg-stone-100 border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {stat.label}
                    </p>
                    <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center icon-bounce ${
                    stat.color === 'blue' ? 'bg-blue-100' :
                    stat.color === 'green' ? 'bg-green-100' :
                    stat.color === 'purple' ? 'bg-purple-100' :
                    'bg-orange-100'
                  }`}>
                    <stat.icon className={`w-6 h-6 ${
                      stat.color === 'blue' ? 'text-blue-600' :
                      stat.color === 'green' ? 'text-green-600' :
                      stat.color === 'purple' ? 'text-purple-600' :
                      'text-orange-600'
                    }`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section — aligned with page theme; details in modal */}
      <section
        id="services"
        className={`relative overflow-hidden py-16 md:py-24 ${
          darkMode ? 'bg-gray-900' : 'bg-gradient-to-b from-primary-50/70 via-white to-white'
        }`}
        aria-labelledby="services-heading"
      >
        <div
          className={`pointer-events-none absolute inset-0 ${
            darkMode
              ? 'bg-gradient-to-b from-primary-900/25 via-transparent to-transparent'
              : 'bg-gradient-to-b from-primary-100/20 via-transparent to-transparent'
          }`}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.12]"
          style={{
            backgroundImage: darkMode
              ? `linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)`
              : `linear-gradient(rgba(2, 132, 199, 0.07) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(2, 132, 199, 0.07) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
          aria-hidden
        />

        <div className="container relative z-10 mx-auto px-6">
          <div className="mb-12 max-w-6xl md:mb-14 lg:mx-auto">
            <div className="flex w-full flex-col gap-8 text-left lg:flex-row lg:items-start lg:gap-6 xl:gap-8">
              <div className="w-full shrink-0 lg:w-auto lg:max-w-[14rem] xl:max-w-[15rem]">
                <h2
                  id="services-heading"
                  className={`text-3xl font-bold leading-tight tracking-tight md:text-4xl lg:text-[2.5rem] lg:leading-[1.15] ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  Our Modules
                </h2>
                <div
                  className={`mt-3 h-1 w-10 rounded-full lg:mt-4 lg:w-12 ${
                    darkMode ? 'bg-primary-500/80' : 'bg-primary-500'
                  }`}
                  aria-hidden
                />
              </div>
              <div className="min-w-0 w-full flex-1 basis-0 border-gray-200 lg:border-l lg:pl-6 xl:pl-8 dark:border-gray-700/80">
                <div className="group w-full space-y-5">
                  <p
                    className={`text-base leading-relaxed transition-colors duration-300 ease-out md:text-lg md:leading-relaxed ${
                      darkMode
                        ? 'text-gray-300 group-hover:text-white'
                        : 'text-gray-600 group-hover:text-gray-900'
                    }`}
                  >
                    SITOMETRICS unifies procurement, goods receipt, store operations, and F&B consumption in one ERP.
                    Purchase requisitions flow to LPOs and GRNs; store issues feed kitchen and bar; stock counts and
                    adjustments keep balances accurate with FIFO costing on issues.
                  </p>
                  <p
                    className={`rounded-r-lg border-l-[3px] py-2 pl-4 text-sm font-medium leading-snug transition-colors duration-300 ease-out md:text-base md:pl-5 ${
                      darkMode
                        ? 'border-success-500 text-gray-400 group-hover:border-primary-300 group-hover:text-primary-100'
                        : 'border-success-600 text-gray-700 group-hover:border-primary-600 group-hover:text-primary-700'
                    }`}
                  >
                    Click a module icon below to open a short description of what that area covers.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 sm:gap-8 md:gap-10 lg:gap-12">
            {services.map((service) => {
              const isOpen = serviceModalId === service.id;
              const Icon = service.icon;
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => setServiceModalId(service.id)}
                  aria-haspopup="dialog"
                  aria-expanded={isOpen}
                  aria-controls="service-detail-modal"
                  aria-label={`Open ${service.title} details`}
                  className={`group flex flex-col items-center gap-3 rounded-xl p-2 transition-all duration-300 ease-out hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-success-500 focus-visible:ring-offset-2 ${
                    darkMode ? 'focus-visible:ring-offset-gray-900' : 'focus-visible:ring-offset-white'
                  }`}
                >
                  <span
                    className={`flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full border-2 shadow-sm transition-[border-color,transform] duration-300 ease-out will-change-transform group-hover:scale-105 md:h-[5rem] md:w-[5rem] ${
                      darkMode
                        ? isOpen
                          ? 'border-success-400 bg-gray-800 shadow-md shadow-success-900/20 group-hover:border-success-300'
                          : 'border-gray-600 bg-gray-800/80 group-hover:border-primary-400'
                        : isOpen
                          ? 'border-success-500 bg-white shadow-md ring-2 ring-success-500/25 group-hover:border-success-600'
                          : 'border-primary-200 bg-white group-hover:border-primary-600'
                    }`}
                  >
                    <Icon
                      className={`h-7 w-7 transition-[color,transform] duration-300 ease-out will-change-transform group-hover:scale-110 md:h-8 md:w-8 ${
                        darkMode
                          ? 'text-primary-300 group-hover:text-primary-100'
                          : 'text-primary-600 group-hover:text-primary-800'
                      }`}
                      strokeWidth={1.5}
                    />
                  </span>
                  <span
                    className={`max-w-[5.5rem] text-center text-[0.65rem] font-bold uppercase leading-tight tracking-wider transition-colors duration-300 md:text-xs ${
                      darkMode
                        ? 'text-gray-300 group-hover:text-primary-200'
                        : 'text-gray-800 group-hover:text-primary-700'
                    }`}
                  >
                    {service.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Service detail modal — matches landing light/dark palette */}
      {serviceModalService && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fadeIn"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px] dark:bg-black/50"
            aria-label="Close service details"
            onClick={() => setServiceModalId(null)}
          />
          <div
            id="service-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-modal-title"
            onClick={(e) => e.stopPropagation()}
            className={`relative z-10 max-h-[min(90vh,720px)] w-full max-w-2xl overflow-y-auto rounded-2xl border p-6 shadow-xl md:p-8 ${
              darkMode
                ? 'border-gray-700 bg-gray-800'
                : 'border-gray-200 bg-white'
            }`}
          >
            <button
              type="button"
              onClick={() => setServiceModalId(null)}
              className={`absolute right-3 top-3 rounded-lg p-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-success-500 ${
                darkMode
                  ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
              }`}
              aria-label="Close"
            >
              <FiX className="h-6 w-6" />
            </button>
            <div
              className={`mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                darkMode
                  ? 'border-success-500/35 bg-success-500/15 text-success-300'
                  : 'border-success-200 bg-success-50 text-success-800'
              }`}
            >
              SITOMETRICS module
            </div>
            <h3
              id="service-modal-title"
              className={`pr-10 text-2xl font-bold md:text-3xl ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              {serviceModalService.title}
            </h3>
            <p
              className={`mt-4 text-base leading-relaxed md:text-lg ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              {serviceModalService.description}
            </p>
            <p
              className={`mb-4 mt-8 text-sm font-semibold uppercase tracking-wider ${
                darkMode ? 'text-success-400' : 'text-success-700'
              }`}
            >
              What this covers
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {serviceModalService.items.map((item, idx) => (
                <li
                  key={idx}
                  className={`flex gap-3 rounded-xl border px-4 py-3 text-sm leading-snug md:text-[0.9375rem] ${
                    darkMode
                      ? 'border-gray-700 bg-gray-900/50 text-gray-200'
                      : 'border-gray-100 bg-slate-50 text-gray-700'
                  }`}
                >
                  <FiCheckCircle
                    className={`mt-0.5 h-5 w-5 flex-shrink-0 ${darkMode ? 'text-success-400' : 'text-success-600'}`}
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <section id="faq" className={`py-20 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Frequently Asked Questions
              </h2>
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Find answers to common questions about SITOMETRICS
              </p>
            </div>

            {/* Mobile: category filter (sidebar is lg+ only) */}
            <div className="lg:hidden max-w-md mx-auto mb-8">
              <label
                htmlFor="landing-faq-category"
                className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Category
              </label>
              <select
                id="landing-faq-category"
                value={activeFaqCategory}
                onChange={(e) => {
                  setActiveFaqCategory(e.target.value);
                  setExpandedFaq(null);
                }}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm ${
                  darkMode
                    ? 'bg-gray-800 border-gray-600 text-white'
                    : 'bg-white border-stone-300 text-gray-900'
                }`}
              >
                <option value="all">All FAQs</option>
                {faqSidebarCategoryList.map((cat) => (
                  <option key={cat} value={cat}>
                    {displayQuestionCategoryLabel(cat)}
                  </option>
                ))}
              </select>
            </div>

          <div className="flex flex-col lg:flex-row gap-10">
            {/* Sidebar */}
            <aside className={`lg:w-80 ${darkMode ? 'text-gray-200' : 'text-gray-700'} hidden lg:block`}>
              <div
                className={`rounded-2xl border p-5 ${
                  darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-stone-100 border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Categories</h3>
                </div>

                <div className="space-y-2">
                  {/* "All" */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveFaqCategory('all');
                      setExpandedFaq(null);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      activeFaqCategory === 'all'
                        ? 'bg-primary-600 text-white'
                        : darkMode
                          ? 'bg-gray-700/30 hover:bg-gray-700/50 text-gray-200'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    All FAQs
                  </button>

                  {faqSidebarCategoryList.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setActiveFaqCategory(cat);
                        setExpandedFaq(null);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        activeFaqCategory === cat
                          ? 'bg-primary-600 text-white'
                          : darkMode
                            ? 'bg-gray-700/30 hover:bg-gray-700/50 text-gray-200'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      }`}
                    >
                      {displayQuestionCategoryLabel(cat)}
                    </button>
                  ))}
                </div>

              </div>
            </aside>

            {/* FAQ Cards */}
            <div className="flex-1">
              {(landingFaqError || landingTroubleshootingError) && !landingFaqLoading && !landingTroubleshootingLoading && (
                <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                  {landingFaqError || landingTroubleshootingError}
                </p>
              )}

              {landingFaqLoading || landingTroubleshootingLoading ? (
                <div className="space-y-4">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`h-20 rounded-2xl ${darkMode ? 'bg-gray-800/40' : 'bg-gray-100'} animate-pulse`}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {accordionFaqsToShow.map((faq) => {
                    const isOpen = expandedFaq === faq.key;
                    return (
                      <div
                        key={faq.key}
                        id={`faq-${faq.key}`}
                        className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
                          darkMode
                            ? 'bg-gray-800/40 border-gray-700'
                            : 'bg-stone-100 border-stone-300'
                        } ${isOpen ? 'shadow-sm' : 'shadow-sm hover:shadow-md'}`}
                      >
                        <button
                          onClick={() => setExpandedFaq(isOpen ? null : faq.key)}
                          className={`w-full px-6 py-5 flex items-center justify-between text-left transition-colors ${
                            darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                          }`}
                          aria-expanded={isOpen}
                        >
                          <div className="flex items-start gap-3 flex-1">
                            <div
                              className={`w-7 h-7 mt-0.5 rounded-full flex items-center justify-center border ${
                                darkMode
                                  ? 'border-primary-400/50 text-primary-300'
                                  : 'border-primary-600/50 text-primary-600 bg-primary-50/50'
                              }`}
                            >
                              <FiHelpCircle className="w-4 h-4" />
                            </div>
                            <h3
                              className={`font-semibold text-base md:text-lg ${
                                darkMode ? 'text-white' : 'text-gray-900'
                              }`}
                            >
                              {faq.kind === 'troubleshooting' ? stripHtml(faq.question) : faq.question}
                            </h3>
                          </div>
                          <FiChevronDown
                            className={`w-5 h-5 transition-transform duration-300 ${
                              isOpen ? 'rotate-180' : ''
                            } ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                          />
                        </button>

                        <div
                          className={`overflow-hidden transition-all duration-300 ${
                            isOpen ? 'max-h-96' : 'max-h-0'
                          }`}
                        >
                          <div
                            className={`px-6 pb-5 pt-2 border-t ${
                              darkMode ? 'border-gray-700' : 'border-gray-200'
                            }`}
                          >
                            {faq.kind === 'troubleshooting' ? (
                              faq.solutions?.length ? (
                                <ul
                                  className={`leading-relaxed list-disc ml-6 ${
                                    darkMode ? 'text-gray-300' : 'text-gray-700'
                                  }`}
                                >
                                  {faq.solutions.map((s, idx) => (
                                    <li key={`${faq.key}-s-${idx}`} className="mb-1">
                                      <span
                                        dangerouslySetInnerHTML={{
                                          __html: typeof s === 'string' ? s : s?.solution || '',
                                        }}
                                      />
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className={`leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  —
                                </p>
                              )
                            ) : (
                              <div
                                className={`leading-relaxed ${
                                  darkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}
                                // answer is stored HTML from the rich editor
                                dangerouslySetInnerHTML={{ __html: faq.answer || '' }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {accordionFaqsFiltered.length > accordionPreviewLimit && (
                    <button
                      type="button"
                      onClick={() => {
                        setAccordionShowAllFaqs(!accordionShowAllFaqs);
                        if (accordionShowAllFaqs) setExpandedFaq(null); // prevent keeping an expanded card hidden
                      }}
                      className={`w-full mt-2 text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                        darkMode
                          ? 'bg-gray-700/30 hover:bg-gray-700/50 text-gray-200'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      }`}
                    >
                      {accordionShowAllFaqs ? 'See less' : 'Read more'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

            <div className={`mt-12 text-center p-6 rounded-xl ${
              darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
            }`}>
              <p className={`text-lg mb-4 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Still have questions?
              </p>
              <button
                onClick={() => setShowContactSupportModal(true)}
                className="btn bg-primary-600 hover:bg-primary-700 text-white px-6 py-2"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </section>
      </div>

      {/* Footer */}
      <footer
        id="contact"
        className="relative border-t border-gray-800 overflow-hidden pt-6 pb-0"
        style={{
          backgroundImage: `url(${footerBg})`,
          backgroundSize: '100% 40%',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div
          className={`absolute inset-0 ${
            darkMode ? 'bg-gray-900/85' : 'bg-white/85'
          }`}
          aria-hidden
        />
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Stay Connected</h4>
              <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Subscribe to our newsletter for product updates and ERP tips.
              </p>
              <div className="flex gap-3 mb-4">
                <a href="#" className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-200 ${
                  darkMode ? 'bg-gray-800 border-primary-500/40 hover:bg-primary-900/30 hover:border-primary-400' : 'bg-primary-50 border-primary-200 hover:bg-primary-100 hover:border-primary-300'
                }`}>
                  <FiLinkedin className={`w-5 h-5 ${darkMode ? 'text-primary-300' : 'text-primary-700'}`} />
                </a>
                <a href="#" className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-200 ${
                  darkMode ? 'bg-gray-800 border-primary-500/40 hover:bg-primary-900/30 hover:border-primary-400' : 'bg-primary-50 border-primary-200 hover:bg-primary-100 hover:border-primary-300'
                }`}>
                  <FiTwitter className={`w-5 h-5 ${darkMode ? 'text-primary-300' : 'text-primary-700'}`} />
                </a>
                <a href="#" className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-200 ${
                  darkMode ? 'bg-gray-800 border-primary-500/40 hover:bg-primary-900/30 hover:border-primary-400' : 'bg-primary-50 border-primary-200 hover:bg-primary-100 hover:border-primary-300'
                }`}>
                  <FiGithub className={`w-5 h-5 ${darkMode ? 'text-primary-300' : 'text-primary-700'}`} />
                </a>
              </div>
            </div>
            <div>
              <h4 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#home" className={darkMode ? 'text-primary-300 hover:text-green-300' : 'text-primary-700 hover:text-green-600'}>Home</a></li>
                <li><a href="#services" className={darkMode ? 'text-primary-300 hover:text-green-300' : 'text-primary-700 hover:text-green-600'}>Modules</a></li>
                <li><a href="#about" className={darkMode ? 'text-primary-300 hover:text-green-300' : 'text-primary-700 hover:text-green-600'}>About</a></li>
                <li><a href="#faq" className={darkMode ? 'text-primary-300 hover:text-green-300' : 'text-primary-700 hover:text-green-600'}>FAQ</a></li>
                <li><a href="#contact" className={darkMode ? 'text-primary-300 hover:text-green-300' : 'text-primary-700 hover:text-green-600'}>Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Support</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/faq/guides"
                    className={darkMode ? 'text-primary-300 hover:text-green-300' : 'text-primary-700 hover:text-green-600'}
                  >
                    User Guides
                  </Link>
                </li>
                <li><a href="#" className={darkMode ? 'text-primary-300 hover:text-green-300' : 'text-primary-700 hover:text-green-600'}>Help Center</a></li>
                <li><a href="#" className={darkMode ? 'text-primary-300 hover:text-green-300' : 'text-primary-700 hover:text-green-600'}>Privacy Policy</a></li>
                <li><a href="#" className={darkMode ? 'text-primary-300 hover:text-green-300' : 'text-primary-700 hover:text-green-600'}>Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Contact</h4>
              <ul className="space-y-2">
                <li className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Email: {landingContactInfoLoading ? '...' : landingContactInfo.email}
                </li>
                <li className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Phone: {landingContactInfoLoading ? '...' : landingContactInfo.phone}
                </li>
                <li className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Address: {landingContactInfoLoading ? '...' : landingContactInfo.address}
                </li>
              </ul>
            </div>
          </div>
        </div>
        {/* Copyright strip — full width, distinct from main footer */}
        <div
          className={`relative z-10 mt-8 w-full border-t py-4 ${
            darkMode
              ? 'border-gray-800 bg-gray-950 text-gray-300'
              : 'border-primary-700/40 bg-primary-800 text-primary-50'
          }`}
        >
          <div className="container mx-auto px-6 text-center text-sm">
            <p>&copy; 2026 SITOMETRICS — F&B Inventory & Procurement ERP. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Dashboard Loader */}
      {showDashboardLoader && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="text-center">
            <BrandMark className="w-20 h-20 mb-6" darkMode={darkMode} />
            <div className="flex justify-center gap-2 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '450ms' }}></div>
            </div>
            <p className="text-white text-lg font-semibold">Loading Dashboard...</p>
            <p className="text-gray-400 text-sm mt-2">Please wait while we prepare your workspace</p>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className={`relative w-full max-w-md rounded-2xl shadow-2xl ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          } p-8`}>
            {/* Close Button */}
            <button
              onClick={() => setShowLoginModal(false)}
              className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <FiX className="w-5 h-5" />
            </button>

            {/* Logo */}
            <div className="text-center mb-8">
              <BrandMark className="w-20 h-20 mb-4" darkMode={darkMode} />
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-700 via-green-700 to-green-700 bg-clip-text text-transparent">
                SITOMETRICS
              </h2>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                Sign in to your account
              </p>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 fade-in">
                <div className="flex">
                  <FiAlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{loginError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Field */}
              <div className="relative">
                <FiMail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 z-10 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="email"
                  name="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className={`peer w-full pl-11 pr-4 py-3 rounded-lg border transition-all focus:ring-2 focus:ring-primary-500 focus:outline-none placeholder-transparent ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-primary-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-primary-500'
                  }`}
                  placeholder=" "
                  required
                />
                <label 
                  className={`absolute left-11 -top-2.5 px-1 text-xs font-medium transition-all pointer-events-none
                    peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-placeholder-shown:left-11
                    peer-focus:-top-2.5 peer-focus:text-xs peer-focus:left-11 peer-focus:text-primary-600
                    ${darkMode 
                      ? 'bg-gray-800 text-gray-400 peer-placeholder-shown:text-gray-500 peer-focus:bg-gray-800' 
                      : 'bg-white text-gray-600 peer-placeholder-shown:text-gray-400 peer-focus:bg-white'
                    }`}
                >
                  Email Address *
                </label>
              </div>

              {/* Password Field */}
              <div className="relative">
                <FiLock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 z-10 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className={`peer w-full pl-11 pr-12 py-3 rounded-lg border transition-all focus:ring-2 focus:ring-primary-500 focus:outline-none placeholder-transparent ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-primary-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-primary-500'
                  }`}
                  placeholder=" "
                  required
                />
                <label 
                  className={`absolute left-11 -top-2.5 px-1 text-xs font-medium transition-all pointer-events-none
                    peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-placeholder-shown:left-11
                    peer-focus:-top-2.5 peer-focus:text-xs peer-focus:left-11 peer-focus:text-primary-600
                    ${darkMode 
                      ? 'bg-gray-800 text-gray-400 peer-placeholder-shown:text-gray-500 peer-focus:bg-gray-800' 
                      : 'bg-white text-gray-600 peer-placeholder-shown:text-gray-400 peer-focus:bg-white'
                    }`}
                >
                  Password *
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 z-10 ${darkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'} transition-colors focus:outline-none`}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  onClick={openResetModal}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className={`w-full px-8 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 mx-auto border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  darkMode
                    ? 'border-green-400 text-green-300 hover:bg-green-400 hover:text-gray-900 focus:ring-green-400'
                    : 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white focus:ring-green-600'
                }`}
              >
                {loginLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    Signing In...
                  </>
                ) : (
                  <>
                    <FiLock className="w-5 h-5" />
                    Sign In
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Contact Support Modal */}
      {showContactSupportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn"
          onClick={() => setShowContactSupportModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={`relative w-full max-w-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowContactSupportModal(false)}
              className={`absolute -top-3 -right-3 p-2 rounded-lg transition-colors ${
                darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-stone-100 hover:bg-stone-200 text-gray-700'
              }`}
              type="button"
              aria-label="Close"
            >
              <FiX className="w-5 h-5" />
            </button>

            <style>
              {`
                .no-scrollbar {
                  scrollbar-width: none; /* Firefox */
                  -ms-overflow-style: none; /* IE/Edge legacy */
                }
                .no-scrollbar::-webkit-scrollbar {
                  width: 0;
                  height: 0;
                }
              `}
            </style>
            <div className="max-h-[90vh] overflow-y-auto pr-1 no-scrollbar">
              <ContactSupport variant="modal" />
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`relative w-full max-w-md rounded-2xl shadow-2xl ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          } p-8 fade-in`}>
            {/* Close Button */}
            <button
              onClick={closeResetModal}
              className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <FiX className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex flex-col items-center text-center gap-4 mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                darkMode 
                  ? 'bg-blue-900/20 border-2 border-blue-800' 
                  : 'bg-blue-50 border-2 border-blue-100'
              }`}>
                <FiUnlock className={`w-8 h-8 ${
                  darkMode ? 'text-blue-400' : 'text-blue-500'
                }`} />
              </div>
              <div>
                <h2 className={`text-2xl font-bold mb-2 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Reset Password
                </h2>
                <p className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Enter your email address and we'll send you instructions to reset your password.
                </p>
              </div>
            </div>

            {/* Success Message */}
            {resetSuccess && (
              <div className="bg-success-50 border border-success-200 rounded-lg p-4 mb-4 flex items-start gap-3 fade-in">
                <FiCheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-success-800">Check your email!</p>
                  <p className="text-xs text-success-600 mt-1">
                    We've sent password reset instructions to your email address.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {resetError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 fade-in">
                <div className="flex">
                  <FiAlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{resetError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Reset Form */}
            {!resetSuccess && (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                {/* Email Field with Floating Label */}
                <div className="relative">
                  <FiMail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 z-10 ${
                    darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <input
                    type="email"
                    name="resetEmail"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className={`peer w-full pl-11 pr-4 py-3 rounded-lg border transition-all focus:ring-2 focus:ring-primary-500 focus:outline-none placeholder-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700 text-white focus:border-primary-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-primary-500'
                    }`}
                    placeholder=" "
                    required
                    disabled={resetLoading}
                  />
                  <label 
                    className={`absolute left-11 -top-2.5 px-1 text-xs font-medium transition-all pointer-events-none
                      peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-placeholder-shown:left-11
                      peer-focus:-top-2.5 peer-focus:text-xs peer-focus:left-11 peer-focus:text-primary-600
                      ${darkMode 
                        ? 'bg-gray-800 text-gray-400 peer-placeholder-shown:text-gray-500 peer-focus:bg-gray-800' 
                        : 'bg-white text-gray-600 peer-placeholder-shown:text-gray-400 peer-focus:bg-white'
                      }`}
                  >
                    Email Address *
                  </label>
                  {resetError && (
                    <p className="mt-1 text-sm text-red-600">{resetError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full btn btn-primary py-2 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resetLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </span>
                  ) : (
                    'Send Reset Instructions'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    closeResetModal();
                    setShowLoginModal(true);
                  }}
                  className={`w-full py-2 text-sm font-medium rounded-lg transition-colors ${
                    darkMode 
                      ? 'text-gray-400 hover:bg-gray-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Back to Sign In
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Interactive Tour Overlay */}
      {showTour && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />
          
          {/* Tour tooltip */}
          <div className={`relative z-10 max-w-md mx-4 p-6 rounded-2xl shadow-2xl animate-scale-up ${
            darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
            {/* Progress indicator */}
            <div className="flex gap-2 mb-4">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    index === tourStep 
                      ? 'bg-gradient-to-r from-green-500 to-blue-500' 
                      : index < tourStep 
                        ? 'bg-green-500' 
                        : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Step content */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-green-500 via-blue-500 to-green-600 bg-clip-text text-transparent">
                {tourSteps[tourStep].title}
              </h3>
              <p className={`text-base leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {tourSteps[tourStep].description}
              </p>
            </div>

            {/* Step counter */}
            <div className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Step {tourStep + 1} of {tourSteps.length}
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-3">
              {tourStep > 0 && (
                <button
                  onClick={prevTourStep}
                  className={`px-4 py-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    darkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 focus:ring-gray-500' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400'
                  }`}
                >
                  Previous
                </button>
              )}
              <button
                onClick={skipTour}
                className={`px-4 py-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  darkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 focus:ring-gray-500' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400'
                }`}
              >
                Skip Tour
              </button>
              <button
                onClick={nextTourStep}
                className="flex-1 px-4 py-2 rounded-lg font-medium bg-gradient-to-r from-green-500 via-blue-500 to-green-600 text-white hover:from-green-600 hover:via-blue-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                {tourStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          aria-label="Scroll back to top"
          className="fixed bottom-8 right-8 z-50 p-4 rounded-full bg-green-600 text-white shadow-2xl hover:shadow-3xl hover:bg-green-700 transform hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 animate-fade-in"
        >
          <FiArrowUp className="w-6 h-6" />
        </button>
      )}

      {/* Document Preview Modal (Landing) */}
      <DocumentPreviewModal
        isOpen={docPreview.open}
        title={docPreview.title}
        url={docPreview.url}
        onClose={() => setDocPreview({ open: false, title: '', url: '' })}
      />
    </div>
  );
};

export default LandingPage;
