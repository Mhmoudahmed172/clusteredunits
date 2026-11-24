import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Cpu,
  Eye,
  Factory,
  FileSignature,
  Filter,
  Gauge,
  Grid,
  Layers,
  List,
  MapPin,
  Package,
  Phone,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Users,
  Wrench,
  FileText,
  Video,
  Images,
  ClipboardList,
  Clock,
  ChevronRight,
  ChevronLeft,
  Printer,
  ExternalLink,
  Scissors,
  Award,
  Hammer,
  Columns,
  Cog,
  Scale,
  Star,
  X,
  Network,
} from 'lucide-react';
import type {
  BuyerAccount,
  Cluster,
  PlatformSettings,
  Product,
  RfqOrder,
  Sector,
} from '../types.ts';
import { ProductCard, formatMoney } from './ProductCard.tsx';

// Helper to pick a bespoke industrial icon per sector
function getSectorIcon(sectorName: string) {
  if (sectorName.includes('الخياطة') || sectorName.includes('النسيج')) return Scissors;
  if (sectorName.includes('سيدات الأعمال')) return Award;
  if (sectorName.includes('الخشبية') || sectorName.includes('الأثاث')) return Hammer;
  if (sectorName.includes('الألمنيوم') || sectorName.includes('الزجاج')) return Columns;
  if (sectorName.includes('الإنشائية') || sectorName.includes('الرخام')) return Building2;
  if (sectorName.includes('المعدنية') || sectorName.includes('الهندسية')) return Cog;
  return Layers;
}

// Smooth Animated Stat Counter Component
const AnimatedStatCounter: React.FC<{ target: number }> = ({ target }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const end = Math.max(0, Number(target) || 0);
    if (end === 0) {
      setCount(0);
      return;
    }
    const duration = 900;
    const startTime = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target]);

  return <>{count}</>;
};

// ============================================================================
// 1. LANDING PAGE VIEW (/) — REDESIGNED FOR CLARITY & EXECUTIVE RESTRAINT
// ============================================================================

interface LandingViewProps {
  settings: PlatformSettings;
  sectors: Sector[];
  clusters: Cluster[];
  products: Product[];
  stats: {
    publishedProductsCount: number;
    integratedProductsCount: number;
    publishedClustersCount: number;
    activeSectorsCount: number;
    enterprisesCount: number;
  };
  currency: 'USD' | 'ILS';
  onNavigate: (route: string) => void;
  onSelectSectorInCatalog: (sectorName: string) => void;
  onViewProduct: (productId: string) => void;
  onViewCluster: (clusterId: string) => void;
  onOpenRfq: (product: Product, qty: number) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  settings,
  sectors,
  clusters,
  products,
  stats,
  currency,
  onNavigate,
  onSelectSectorInCatalog,
  onViewProduct,
  onViewCluster,
  onOpenRfq,
}) => {
  // Micro-interaction states for tactile feedback on click
  const [clickedSectorId, setClickedSectorId] = useState<string | null>(null);
  const [clickedClusterId, setClickedClusterId] = useState<string | null>(null);
  const [clickedKpiId, setClickedKpiId] = useState<string | null>(null);
  const [homeCategoryFilter, setHomeCategoryFilter] = useState<string>('FEATURED');
  const [bouncingCategoryKey, setBouncingCategoryKey] = useState<string | null>(null);

  // Sector Rating State
  const [localSectors, setLocalSectors] = useState<Sector[]>(sectors);
  useEffect(() => {
    setLocalSectors(sectors);
  }, [sectors]);
  const [ratingModalSector, setRatingModalSector] = useState<Sector | null>(null);
  const [selectedStars, setSelectedStars] = useState<number>(5);
  const [hoveredStars, setHoveredStars] = useState<number>(0);
  const [ratingNote, setRatingNote] = useState<string>('');
  const [ratingSubmitting, setRatingSubmitting] = useState<boolean>(false);
  const [ratingSuccess, setRatingSuccess] = useState<string | null>(null);

  const handleSubmitSectorRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingModalSector) return;
    setRatingSubmitting(true);
    try {
      const res = await fetch(
        `/api/public/sectors/${encodeURIComponent(ratingModalSector.id)}/rate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stars: selectedStars, evaluationNote: ratingNote }),
        }
      );
      const data = await res.json();
      if (res.ok && Array.isArray(data.sectors)) {
        setLocalSectors(data.sectors);
        setRatingSuccess(
          `تم تسجيل تقييمك (${selectedStars} نجوم) لقطاع «${ratingModalSector.name}» بنجاح.`
        );
        setTimeout(() => {
          setRatingModalSector(null);
          setRatingSuccess(null);
        }, 1200);
      }
    } catch (err) {
      console.error('Sector rating error:', err);
    } finally {
      setRatingSubmitting(false);
    }
  };

  const featuredProducts = useMemo(() => {
    if (homeCategoryFilter === 'FEATURED') {
      const feat = products.filter((p) => p.isFeatured);
      return feat.length > 0 ? feat.slice(0, 6) : products.slice(0, 6);
    }
    if (homeCategoryFilter === 'INTEGRATED') {
      return products
        .filter((p) => p.prodScope === 'INTEGRATED' || p.sector === 'منتج تكاملي مشترك')
        .slice(0, 6);
    }
    return products
      .filter(
        (p) =>
          p.sector === homeCategoryFilter ||
          (p.sector === 'منتج تكاملي مشترك' &&
            clusters.find((c) => c.id === p.clusterId)?.sector === homeCategoryFilter)
      )
      .slice(0, 6);
  }, [products, clusters, homeCategoryFilter]);

  const homeVisibleClusters = useMemo(() => {
    if (homeCategoryFilter === 'FEATURED' || homeCategoryFilter === 'INTEGRATED') {
      return clusters.slice(0, 6);
    }
    const filtered = clusters.filter((c) => c.sector === homeCategoryFilter);
    return filtered.length > 0 ? filtered : clusters.slice(0, 6);
  }, [clusters, homeCategoryFilter]);

  const handleSectorCardClick = (sectorId: string, sectorName: string) => {
    setClickedSectorId(sectorId);
    setTimeout(() => {
      onSelectSectorInCatalog(sectorName);
    }, 280);
  };

  const handleClusterCardClick = (clusterId: string) => {
    setClickedClusterId(clusterId);
    setTimeout(() => {
      onViewCluster(clusterId);
    }, 280);
  };

  const handleKpiClick = (kpiId: string, action: () => void) => {
    setClickedKpiId(kpiId);
    setTimeout(() => {
      action();
    }, 240);
  };

  const handleHomeCategorySelect = (categoryKey: string) => {
    setHomeCategoryFilter(categoryKey);
    setBouncingCategoryKey(categoryKey);
    setTimeout(() => {
      setBouncingCategoryKey((prev) => (prev === categoryKey ? null : prev));
    }, 340);
  };

  // Generate a random shuffle seed once per page load/refresh so the slider starts randomly on every refresh
  const [refreshSeed] = useState<number>(() => Math.random());
  const [isSliderPaused, setIsSliderPaused] = useState<boolean>(false);

  const heroShowcaseProducts = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) return [];
    const copy = [...products];
    // Deterministic Fisher-Yates shuffle per page load using refreshSeed
    let seed = Math.floor(refreshSeed * 2147483647) || 1;
    for (let i = copy.length - 1; i > 0; i--) {
      seed = (seed * 16807) % 2147483647;
      const j = seed % (i + 1);
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }, [products, refreshSeed]);

  const [activeHeroIdx, setActiveHeroIdx] = useState<number>(() =>
    products.length > 0 ? Math.floor(Math.random() * products.length) : 0
  );

  // Ensure activeHeroIdx stays in bounds if products count changes
  useEffect(() => {
    if (heroShowcaseProducts.length > 0 && activeHeroIdx >= heroShowcaseProducts.length) {
      setActiveHeroIdx(0);
    }
  }, [heroShowcaseProducts.length, activeHeroIdx]);

  // Auto-advance through ALL products (pauses when user hovers over the slider)
  useEffect(() => {
    if (heroShowcaseProducts.length <= 1 || isSliderPaused) return;
    const timer = setInterval(() => {
      setActiveHeroIdx((prev) => (prev + 1) % heroShowcaseProducts.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [heroShowcaseProducts.length, isSliderPaused]);

  const handlePrevHeroSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (heroShowcaseProducts.length <= 1) return;
    setActiveHeroIdx((prev) =>
      prev === 0 ? heroShowcaseProducts.length - 1 : prev - 1
    );
  };

  const handleNextHeroSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (heroShowcaseProducts.length <= 1) return;
    setActiveHeroIdx((prev) => (prev + 1) % heroShowcaseProducts.length);
  };

  // Compute a sliding window of 4 products around activeHeroIdx for the bottom preview strip
  const visibleSliderWindow = useMemo(() => {
    const total = heroShowcaseProducts.length;
    if (total === 0) return [];
    const count = Math.min(4, total);
    const items: { product: Product; index: number }[] = [];
    const startOffset = Math.floor(activeHeroIdx / count) * count;
    for (let i = 0; i < count; i++) {
      const idx = (startOffset + i) % total;
      items.push({ product: heroShowcaseProducts[idx], index: idx });
    }
    return items;
  }, [heroShowcaseProducts, activeHeroIdx]);

  const activeHeroProduct = heroShowcaseProducts[activeHeroIdx] || heroShowcaseProducts[0];

  return (
    <div className="space-y-16 pb-14">
      {/* 1. Executive Hero Section */}
      <section className="relative hero-industrial-pattern text-white border-b border-[#C8A24B]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Right Column: Value Proposition & Primary Actions */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-4">
                <p className="text-[#E5C168] text-xs sm:text-sm font-bold tracking-wide">
                  {settings.officialProjectName}
                </p>

                <h2
                  className="text-2xl sm:text-4xl lg:text-[42px] font-black text-white leading-tight"
                  style={{ textWrap: 'balance' }}
                >
                  {settings.heroTitle || 'منتجات محلية من تجمعات الإنتاج في غزة'}
                </h2>

                <p className="text-sm sm:text-base text-slate-200/95 leading-relaxed max-w-2xl">
                  {settings.introText}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/products')}
                  className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#C8A24B] hover:bg-[#E5C168] text-[#0F253E] font-black text-xs sm:text-sm shadow-md hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  <span>{settings.primaryCtaText || 'استكشف معرض المنتجات'}</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('/clusters')}
                  className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 font-bold text-xs sm:text-sm active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Building2 className="w-4 h-4 text-[#C8A24B]" />
                  <span>{settings.secondaryCtaText || 'دليل التجمعات الإنتاجية'}</span>
                </button>
              </div>

              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-300">
                <span>توريد مؤسسي مباشر وفق شرائح كمية</span>
                <span className="text-white/25" aria-hidden="true">·</span>
                <span>عينات متاحة للفحص المخبري والميداني</span>
                <span className="text-white/25" aria-hidden="true">·</span>
                <span>محطات إنتاج مركزية في 5 محافظات</span>
              </div>
            </div>

            {/* Left Column: Interactive All-Products Randomized Slider with Showroom Spotlight & Progress Bar */}
            <div
              className="lg:col-span-5 relative"
              onMouseEnter={() => setIsSliderPaused(true)}
              onMouseLeave={() => setIsSliderPaused(false)}
            >
              {/* Ambient Showroom Spotlight Glow Behind Slider */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-6 rounded-3xl showroom-spotlight-glow blur-2xl opacity-90"
              />

              {activeHeroProduct && (
                <div className="relative bg-white/[0.04] p-3.5 rounded-2xl border border-white/15 backdrop-blur-xs space-y-3 shadow-xl">
                  {/* Slider Top Bar: Title & Slide Counter + Controls */}
                  <div className="flex items-center justify-between gap-2 px-1 text-xs">
                    <span className="text-slate-300 font-bold">
                      سلايدر منتجات التجمعات
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#E5C168] font-bold tabular-nums" dir="ltr">
                        {activeHeroIdx + 1} / {heroShowcaseProducts.length}
                      </span>
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handlePrevHeroSlide}
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-[#C8A24B] text-white hover:text-[#0F253E] flex items-center justify-center transition-colors cursor-pointer"
                          title="المنتج السابق"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleNextHeroSlide}
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-[#C8A24B] text-white hover:text-[#0F253E] flex items-center justify-center transition-colors cursor-pointer"
                          title="المنتج التالي"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Active Slide Main Card */}
                  <div
                    key={activeHeroProduct.id}
                    onClick={() => onViewProduct(activeHeroProduct.id)}
                    className="relative h-64 sm:h-72 rounded-xl overflow-hidden group cursor-pointer bg-slate-900 animate-fade-in-up"
                  >
                    {activeHeroProduct.image ? (
                      <img
                        src={activeHeroProduct.image}
                        alt={activeHeroProduct.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#0F253E] to-[#1C4587] flex flex-col items-center justify-center text-white/80 p-6 text-center">
                        <Factory className="w-10 h-10 text-[#C8A24B] mb-2" />
                        <span className="text-sm font-bold">{activeHeroProduct.title}</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-[#091728]/95 via-black/30 to-transparent flex flex-col justify-between p-5">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-md bg-[#0F253E]/85 text-[#E5C168] font-bold">
                          {activeHeroProduct.sector}
                        </span>
                        <span
                          className="text-white/90 font-bold tabular-nums"
                          dir="ltr"
                        >
                          {activeHeroProduct.id}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <h3 className="text-base sm:text-lg font-black text-white group-hover:text-[#E5C168] transition-colors leading-snug">
                          {activeHeroProduct.title}
                        </h3>
                        <div className="flex items-center justify-between gap-2 text-xs text-slate-200">
                          <span className="truncate">
                            {activeHeroProduct.enterpriseName} · {activeHeroProduct.clusterId}
                          </span>
                          <span className="text-[#E5C168] font-black tabular-nums shrink-0">
                            يبدأ من{' '}
                            {formatMoney(
                              activeHeroProduct.tiers?.[activeHeroProduct.tiers.length - 1]
                                ?.priceUsd || activeHeroProduct.priceUsd,
                              currency,
                              settings.exchangeRate
                            )}{' '}
                            / {activeHeroProduct.unit}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Animated Progress Bar along the bottom of the slide */}
                    {heroShowcaseProducts.length > 1 && (
                      <div className="absolute bottom-0 inset-x-0 h-1 bg-white/15 overflow-hidden">
                        <div
                          key={`${activeHeroIdx}-${isSliderPaused ? 'paused' : 'play'}`}
                          className={`h-full bg-gradient-to-l from-[#C8A24B] to-[#E5C168] ${
                            isSliderPaused ? 'w-1/2 opacity-50' : 'w-full animate-slider-progress'
                          }`}
                        />
                      </div>
                    )}
                  </div>

                  {/* Sliding 4-Product Preview Strip */}
                  {visibleSliderWindow.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {visibleSliderWindow.map(({ product: prod, index }) => {
                        const isCurrent = index === activeHeroIdx;
                        return (
                          <button
                            key={prod.id + '-' + index}
                            type="button"
                            onClick={() => setActiveHeroIdx(index)}
                            className={`relative h-14 rounded-lg overflow-hidden border transition-all cursor-pointer text-right ${
                              isCurrent
                                ? 'border-[#C8A24B] ring-1 ring-[#C8A24B] opacity-100'
                                : 'border-white/10 opacity-60 hover:opacity-95'
                            }`}
                          >
                            {prod.image ? (
                              <img
                                src={prod.image}
                                alt={prod.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#0F253E]" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex items-end p-1.5">
                              <span className="text-[9px] font-bold text-white truncate w-full">
                                {prod.title}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Unified Architectural Statistics Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-slate-100 overflow-hidden">
          {[
            {
              id: 'kpi-products',
              value: stats.publishedProductsCount,
              label: 'منتجًا محليًا معتمدًا',
              action: () => onNavigate('/products'),
            },
            {
              id: 'kpi-integrated',
              value: stats.integratedProductsCount,
              label: 'منتجات تكاملية مشتركة',
              action: () => onSelectSectorInCatalog('منتج تكاملي مشترك'),
            },
            {
              id: 'kpi-clusters',
              value: stats.publishedClustersCount,
              label: 'تجمعًا إنتاجيًا عنقوديًا',
              action: () => onNavigate('/clusters'),
            },
            {
              id: 'kpi-sectors',
              value: stats.activeSectorsCount,
              label: 'قطاعات صناعية رئيسية',
              action: () => onNavigate('/products'),
            },
            {
              id: 'kpi-enterprises',
              value: stats.enterprisesCount,
              label: 'منشأة صناعية مستضيفة وعضوة',
              action: () => onNavigate('/clusters'),
            },
          ].map((item, idx) => {
            const isClicked = clickedKpiId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleKpiClick(item.id, item.action)}
                className={`p-5 sm:p-6 text-center transition-all cursor-pointer group ${
                  idx === 4 ? 'col-span-2 sm:col-span-1' : ''
                } ${
                  isClicked
                    ? 'bg-amber-50/70'
                    : 'hover:bg-slate-50/80'
                }`}
              >
                <div className="text-2xl sm:text-3xl font-black text-[#0F253E] group-hover:text-[#1C4587] transition-colors tabular-nums">
                  <AnimatedStatCounter target={item.value} />
                </div>
                <div className="text-xs font-bold text-slate-500 mt-1">
                  {item.label}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Participating Industrial Sectors — Clean Architectural Cards with Ratings & Micro-Interaction */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <p className="text-xs font-bold text-[#9A7422] mb-1">
              الاتحادات الصناعية التخصصية الستة المعتمدة
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-[#0F253E]">
              القطاعات الصناعية المشاركة في المنصة
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/products')}
            className="text-xs sm:text-sm font-bold text-[#1C4587] hover:underline flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <span>استعراض كافة المنتجات حسب القطاع</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {localSectors.map((sec) => {
            const secClusters = clusters.filter((c) => c.sector === sec.name).length;
            const secProducts = products.filter(
              (p) =>
                p.sector === sec.name ||
                (p.sector === 'منتج تكاملي مشترك' &&
                  clusters.find((c) => c.id === p.clusterId)?.sector === sec.name)
            ).length;
            const SectorIcon = getSectorIcon(sec.name);
            const isClicked = clickedSectorId === sec.id;
            const secRating = Number(sec.rating ?? 4.8);
            const secRatingsCount = Number(sec.ratingsCount ?? 12);

            return (
              <div
                key={sec.id}
                onClick={() => handleSectorCardClick(sec.id, sec.name)}
                className={`card-hover-lift rounded-2xl p-6 border cursor-pointer flex flex-col justify-between group ${
                  isClicked
                    ? 'animate-card-confirm bg-amber-50/50 border-[#C8A24B] ring-2 ring-[#C8A24B]/25 shadow-md'
                    : 'bg-white border-slate-200/80 hover:border-[#C8A24B]/80'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Row: Icon + Star Rating Action */}
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                        isClicked
                          ? 'bg-[#C8A24B] text-[#0F253E] scale-105'
                          : 'bg-slate-100 text-[#0F253E] group-hover:bg-[#0F253E] group-hover:text-[#E5C168]'
                      }`}
                    >
                      {isClicked ? (
                        <CheckCircle2 className="w-5 h-5 animate-icon-pop" />
                      ) : (
                        <SectorIcon className="w-5 h-5" />
                      )}
                    </div>

                    {/* Clean Uncluttered Rating Control */}
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 tabular-nums">
                        <Star className="w-3.5 h-3.5 text-[#C8A24B] fill-[#C8A24B]" />
                        <span>{secRating.toFixed(1)}</span>
                        <span className="text-slate-400">({secRatingsCount})</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRatingModalSector(sec);
                          setSelectedStars(Math.round(secRating) || 5);
                          setHoveredStars(0);
                          setRatingNote(sec.evaluationNote || '');
                          setRatingSuccess(null);
                        }}
                        className="px-2 py-1 rounded-md bg-slate-100 hover:bg-[#0F253E] text-slate-700 hover:text-[#E5C168] text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap"
                        title="إضافة تقييم لهذا القطاع"
                      >
                        + تقييم
                      </button>
                    </div>
                  </div>

                  {/* Sector Name & Union */}
                  <div>
                    <p className="text-[11px] font-medium text-slate-500 mb-0.5">
                      {sec.unionName}
                    </p>
                    <h4 className="text-base sm:text-lg font-black text-[#0F253E] group-hover:text-[#1C4587] transition-colors">
                      {sec.name}
                    </h4>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {sec.description}
                  </p>

                  {sec.evaluationNote && sec.evaluationNote.trim() && (
                    <p className="text-[11px] text-emerald-800 font-medium pt-0.5">
                      ملاحظة التقييم: {sec.evaluationNote}
                    </p>
                  )}
                </div>

                {/* Clean Hairline Footer */}
                <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                  <div className="text-slate-500 tabular-nums">
                    <span>{secClusters} تجمعات</span>
                    <span className="mx-1.5 text-slate-300" aria-hidden="true">·</span>
                    <span>{secProducts} منتجات</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[#1C4587] group-hover:-translate-x-1 transition-transform">
                    <span>{isClicked ? 'جاري الفتح...' : 'تصفح القطاع'}</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sector Rating Modal */}
        {ratingModalSector && (
          <div
            onClick={() => setRatingModalSector(null)}
            className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl border border-slate-200 max-w-md w-full overflow-hidden shadow-2xl animate-modal-pop"
            >
              <div className="bg-[#0F253E] text-white px-5 py-4 flex items-center justify-between border-b border-[#C8A24B]/50">
                <div>
                  <h4 className="text-sm sm:text-base font-black">
                    تقييم القطاع: {ratingModalSector.name}
                  </h4>
                  <p className="text-[11px] text-slate-300">{ratingModalSector.unionName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setRatingModalSector(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitSectorRating} className="p-5 space-y-4">
                {ratingSuccess ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{ratingSuccess}</span>
                  </div>
                ) : (
                  <>
                    <div className="text-center space-y-2">
                      <label className="block text-xs font-bold text-[#0F253E]">
                        اختر درجة التقييم للقطاع (من 1 إلى 5 نجوم):
                      </label>
                      <div className="flex items-center justify-center gap-2 py-2">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const active = star <= (hoveredStars || selectedStars);
                          return (
                            <button
                              key={star}
                              type="button"
                              onMouseEnter={() => setHoveredStars(star)}
                              onMouseLeave={() => setHoveredStars(0)}
                              onClick={() => setSelectedStars(star)}
                              className="p-1.5 rounded-xl hover:scale-110 transition-transform cursor-pointer"
                            >
                              <Star
                                className={`w-7 h-7 transition-colors ${
                                  active
                                    ? 'text-[#C8A24B] fill-[#C8A24B]'
                                    : 'text-slate-300'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0F253E] mb-1">
                        ملاحظة التقييم أو الانطباع (اختياري):
                      </label>
                      <input
                        type="text"
                        value={ratingNote}
                        onChange={(e) => setRatingNote(e.target.value)}
                        placeholder="مثال: جودة تصنيع ممتازة والتزام بالمواصفات الفنية..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs focus:outline-none focus:border-[#0F253E]"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setRatingModalSector(null)}
                        className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        disabled={ratingSubmitting}
                        className="px-5 py-2 rounded-xl bg-[#0F253E] hover:bg-[#1C4587] text-[#E5C168] text-xs font-bold cursor-pointer"
                      >
                        {ratingSubmitting ? 'جاري الحفظ...' : 'حفظ التقييم'}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        )}
      </section>

      {/* 4. Featured Products Showcase — Segmented Filter Bar & Clean 3-Column Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <p className="text-xs font-bold text-[#9A7422] mb-1">
              نماذج إنتاجية جاهزة للتعاقد والتوريد المؤسسي
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-[#0F253E]">
              منتجات مختارة من التجمعات الإنتاجية
            </h3>
          </div>
          <button
            type="button"
            onClick={() =>
              homeCategoryFilter !== 'FEATURED' && homeCategoryFilter !== 'INTEGRATED'
                ? onSelectSectorInCatalog(homeCategoryFilter)
                : homeCategoryFilter === 'INTEGRATED'
                ? onSelectSectorInCatalog('منتج تكاملي مشترك')
                : onNavigate('/products')
            }
            className="px-4 py-2.5 rounded-xl bg-[#0F253E] text-[#E5C168] hover:bg-[#1C4587] text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto whitespace-nowrap transition-all"
          >
            <span>عرض جميع المنتجات ({products.length})</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Clean Interactive Filter Controls */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[
            { key: 'FEATURED', label: 'المنتجات المميزة', Icon: Sparkles },
            { key: 'INTEGRATED', label: 'منتجات تكاملية مشتركة', Icon: Layers },
            ...sectors.map((s) => ({
              key: s.name,
              label: s.name,
              Icon: getSectorIcon(s.name),
            })),
          ].map((cat) => {
            const isSelected = homeCategoryFilter === cat.key;
            const isBouncing = bouncingCategoryKey === cat.key;
            const CatIcon = cat.Icon;

            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => handleHomeCategorySelect(cat.key)}
                className={`group flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-all ${
                  isBouncing ? 'animate-card-confirm' : ''
                } ${
                  isSelected
                    ? 'bg-[#0F253E] text-[#E5C168] border-[#0F253E] shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200/90 hover:border-[#C8A24B] hover:text-[#0F253E]'
                }`}
              >
                <CatIcon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        <div
          key={homeCategoryFilter}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 animate-fade-in-up"
        >
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              currency={currency}
              exchangeRate={settings.exchangeRate}
              onViewProduct={onViewProduct}
              onViewCluster={onViewCluster}
              onOpenRfq={onOpenRfq}
            />
          ))}
        </div>
      </section>

      {/* 5. Unified Production Clusters & Methodology Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Editorial Methodology Strip (No Cards-Within-Cards) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <p className="text-xs font-bold text-[#9A7422] mb-1">
                منهجية التعافي الصناعي التشاركي
              </p>
              <h3 className="text-lg sm:text-xl font-black text-[#0F253E]">
                {settings.howClustersWorkTitle || 'آلية عمل الوحدات الإنتاجية العنقودية (HCC)'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/clusters')}
              className="text-xs sm:text-sm font-bold text-[#1C4587] hover:underline flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <span>دليل التجمعات الكامل ({clusters.length})</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-100">
            {(settings.howClustersWorkSteps || []).map((step, idx) => (
              <div
                key={idx}
                className={`${idx > 0 ? 'pt-6 md:pt-0 md:pr-8' : ''} space-y-2`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-black text-[#9A7422] tabular-nums">
                    0{idx + 1}.
                  </span>
                  <h4 className="text-sm sm:text-base font-black text-[#0F253E]">
                    {step.title.replace(/^[١٢٣123]\.\s*/, '')}
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Clean 3-Column Clusters Preview Grid */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="text-base sm:text-lg font-black text-[#0F253E]">
              نماذج التجمعات الإنتاجية والمحطات المركزية (CL1 – CL15)
            </h4>
            <button
              type="button"
              onClick={() => onNavigate('/clusters')}
              className="text-xs font-bold text-[#1C4587] hover:underline cursor-pointer"
            >
              عرض جميع التجمعات ←
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {homeVisibleClusters.map((cl) => {
              const isClusterClicked = clickedClusterId === cl.id;
              const clProductsCount = products.filter((p) => p.clusterId === cl.id).length;

              return (
                <div
                  key={cl.id}
                  onClick={() => handleClusterCardClick(cl.id)}
                  className={`relative overflow-hidden card-hover-lift rounded-2xl p-5 border cursor-pointer flex flex-col justify-between group ${
                    isClusterClicked
                      ? 'animate-card-confirm bg-amber-50/50 border-[#C8A24B] ring-2 ring-[#C8A24B]/25'
                      : 'bg-white border-slate-200/80 hover:border-[#C8A24B]/80'
                  }`}
                >
                  {/* Animated Vertical Gold Accent Line on Hover */}
                  <span
                    aria-hidden="true"
                    className="absolute right-0 inset-y-0 w-1 bg-gradient-to-b from-[#C8A24B] to-[#9A7422] scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top"
                  />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-black text-[#1C4587] tabular-nums" dir="ltr">
                        {cl.id}
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#C8A24B]" />
                        <span>{cl.governorate}</span>
                      </span>
                    </div>

                    <h5 className="text-sm sm:text-base font-black text-[#0F253E] group-hover:text-[#1C4587] transition-colors">
                      {cl.name}
                    </h5>

                    <p className="text-xs text-slate-600">
                      المستضيف: <strong className="text-slate-800">{cl.hostEnterprise}</strong>
                    </p>
                  </div>

                  <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500 tabular-nums">
                      {cl.members?.length || 0} منشآت · {clProductsCount} منتجات
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#1C4587] group-hover:-translate-x-1 transition-transform">
                      <span>التفاصيل</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

// ============================================================================
// 2. PRODUCTS CATALOG VIEW (/products) — UNIFIED FILTER HEADER & CLEAN GRID
// ============================================================================

interface CatalogViewProps {
  products: Product[];
  clusters: Cluster[];
  sectors: Sector[];
  currency: 'USD' | 'ILS';
  exchangeRate: number;
  initialSectorFilter: string;
  initialClusterFilter: string;
  onViewProduct: (productId: string) => void;
  onViewCluster: (clusterId: string) => void;
  onOpenRfq: (product: Product, qty: number) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  products,
  clusters,
  sectors,
  currency,
  exchangeRate,
  initialSectorFilter,
  initialClusterFilter,
  onViewProduct,
  onViewCluster,
  onOpenRfq,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState(initialSectorFilter || 'ALL');
  const [selectedCluster, setSelectedCluster] = useState(initialClusterFilter || 'ALL');
  const [selectedScope, setSelectedScope] = useState<'ALL' | 'SINGLE' | 'INTEGRATED'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [comparedIds, setComparedIds] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  React.useEffect(() => {
    setSelectedSector(initialSectorFilter || 'ALL');
  }, [initialSectorFilter]);

  React.useEffect(() => {
    setSelectedCluster(initialClusterFilter || 'ALL');
  }, [initialClusterFilter]);

  const handleToggleCompare = (prod: Product) => {
    setComparedIds((prev) => {
      if (prev.includes(prod.id)) {
        return prev.filter((id) => id !== prod.id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), prod.id];
      }
      return [...prev, prod.id];
    });
  };

  const comparedProducts = useMemo(
    () => products.filter((p) => comparedIds.includes(p.id)),
    [products, comparedIds]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedSector !== 'ALL') {
        if (selectedSector === 'منتج تكاملي مشترك') {
          if (p.sector !== 'منتج تكاملي مشترك' && p.prodScope !== 'INTEGRATED') return false;
        } else {
          const clusterObj = clusters.find((c) => c.id === p.clusterId);
          const matchesDirect = p.sector === selectedSector;
          const matchesClusterSector =
            p.sector === 'منتج تكاملي مشترك' && clusterObj?.sector === selectedSector;
          if (!matchesDirect && !matchesClusterSector) return false;
        }
      }

      if (selectedCluster !== 'ALL' && p.clusterId !== selectedCluster) {
        return false;
      }

      if (selectedScope !== 'ALL' && p.prodScope !== selectedScope) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const inTitle = p.title.toLowerCase().includes(q);
        const inId = p.id.toLowerCase().includes(q);
        const inEnt = p.enterpriseName.toLowerCase().includes(q);
        const inCluster = p.clusterName.toLowerCase().includes(q);
        if (!inTitle && !inId && !inEnt && !inCluster) return false;
      }

      return true;
    });
  }, [products, clusters, selectedSector, selectedCluster, selectedScope, searchQuery]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedSector('ALL');
    setSelectedCluster('ALL');
    setSelectedScope('ALL');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedSector !== 'ALL' ||
    selectedCluster !== 'ALL' ||
    selectedScope !== 'ALL';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-20">
      {/* Unified Catalog Header & Filter Console */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0F253E]">
              معرض منتجات الوحدات الإنتاجية العنقودية
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              تصفح المنتجات المعتمدة، شرائح الأسعار التعاقدية، والمواصفات الفنية أو قارن حتى 3 منتجات.
            </p>
          </div>

          <div className="inline-flex rounded-xl bg-slate-100 p-1 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-[#0F253E] shadow-2xs'
                  : 'text-slate-600 hover:text-[#0F253E]'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>بطاقات</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-[#0F253E] shadow-2xs'
                  : 'text-slate-600 hover:text-[#0F253E]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>جدول مقارن</span>
            </button>
          </div>
        </div>

        {/* Search, Cluster & Scope Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم المنتج، المعرّف (PRD-101)، أو المنشأة..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-xs sm:text-sm focus:outline-none focus:border-[#0F253E]"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={selectedCluster}
              onChange={(e) => setSelectedCluster(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-[#0F253E]"
            >
              <option value="ALL">جميع التجمعات العنقودية ({clusters.length})</option>
              {clusters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} - {c.name} ({c.governorate})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <select
              value={selectedScope}
              onChange={(e) =>
                setSelectedScope(e.target.value as 'ALL' | 'SINGLE' | 'INTEGRATED')
              }
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-[#0F253E]"
            >
              <option value="ALL">النوع: قطاعي وتكاملي</option>
              <option value="SINGLE">منتج قطاعي</option>
              <option value="INTEGRATED">منتج تكاملي مشترك</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                title="مسح الفلاتر"
                className="p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-700 text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Clean Sector Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
          <button
            type="button"
            onClick={() => setSelectedSector('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              selectedSector === 'ALL'
                ? 'bg-[#0F253E] text-[#E5C168]'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            جميع القطاعات ({products.length})
          </button>

          {sectors.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setSelectedSector(sec.name)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                selectedSector === sec.name
                  ? 'bg-[#0F253E] text-[#E5C168]'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {sec.name}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setSelectedSector('منتج تكاملي مشترك')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              selectedSector === 'منتج تكاملي مشترك'
                ? 'bg-[#C8A24B] text-[#0F253E]'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
            }`}
          >
            منتجات تكاملية مشتركة
          </button>
        </div>
      </div>

      {/* Results Count Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span className="tabular-nums">
          عرض <strong className="text-[#0F253E] font-black">{filteredProducts.length}</strong> من
          أصل {products.length} منتج
        </span>
        {selectedCluster !== 'ALL' && (
          <button
            type="button"
            onClick={() => onViewCluster(selectedCluster)}
            className="text-[#1C4587] font-bold hover:underline cursor-pointer"
          >
            عرض تفاصيل التجمع ({selectedCluster}) ←
          </button>
        )}
      </div>

      {/* Empty State or Products Display */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Filter className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#0F253E]">
              لا توجد منتجات مطابقة لمعايير البحث الحالية
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              جرّب البحث بكلمات أخرى أو إعادة ضبط الفلاتر.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F253E] text-[#E5C168] text-xs font-bold hover:bg-[#1C4587] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>إظهار كافة المنتجات</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              currency={currency}
              exchangeRate={exchangeRate}
              onViewProduct={onViewProduct}
              onViewCluster={onViewCluster}
              onOpenRfq={onOpenRfq}
              isCompared={comparedIds.includes(product.id)}
              onToggleCompare={handleToggleCompare}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm tabular-nums">
            <thead className="bg-slate-50 text-[#0F253E] border-b border-slate-200">
              <tr>
                <th className="p-4 font-bold">المعرّف</th>
                <th className="p-4 font-bold">المنتج</th>
                <th className="p-4 font-bold">القطاع</th>
                <th className="p-4 font-bold">المنشأة والتجمع</th>
                <th className="p-4 font-bold">السعر الأساسي</th>
                <th className="p-4 font-bold">أفضل شريحة</th>
                <th className="p-4 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const sorted = [...(p.tiers || [])].sort((a, b) => a.minQty - b.minQty);
                const lowestTier = sorted[sorted.length - 1];
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 font-bold text-[#1C4587]" dir="ltr">
                      {p.id}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image}
                          alt={p.title}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                        <button
                          type="button"
                          onClick={() => onViewProduct(p.id)}
                          className="font-bold text-[#0F253E] hover:text-[#1C4587] text-right cursor-pointer"
                        >
                          {p.title}
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{p.sector}</div>
                      <span className="text-[11px] text-slate-400">{p.scopeBadge}</span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{p.enterpriseName}</div>
                      <button
                        type="button"
                        onClick={() => onViewCluster(p.clusterId)}
                        className="text-xs text-[#1C4587] hover:underline cursor-pointer"
                      >
                        {p.clusterName} ({p.clusterId})
                      </button>
                    </td>
                    <td className="p-4 font-black text-[#0F253E]">
                      {formatMoney(p.priceUsd, currency, exchangeRate)} / {p.unit}
                    </td>
                    <td className="p-4 font-bold text-emerald-700">
                      {lowestTier
                        ? `${formatMoney(lowestTier.priceUsd, currency, exchangeRate)} (${lowestTier.label})`
                        : formatMoney(p.priceUsd, currency, exchangeRate)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onViewProduct(p.id)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold hover:bg-slate-100 cursor-pointer whitespace-nowrap"
                        >
                          التفاصيل
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenRfq(p, 1)}
                          className="px-3 py-1.5 rounded-lg bg-[#0F253E] text-[#E5C168] text-xs font-bold hover:bg-[#1C4587] cursor-pointer whitespace-nowrap"
                        >
                          طلب تعاقد
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Floating Product Comparison Dock */}
      {comparedProducts.length > 0 && (
        <div className="fixed bottom-4 inset-x-4 z-40 max-w-4xl mx-auto bg-[#0F253E] text-white rounded-2xl border border-[#C8A24B] shadow-xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#E5C168]">
              <Scale className="w-4 h-4 text-[#C8A24B]" />
              <span>المقارنة ({comparedProducts.length}/3):</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {comparedProducts.map((cp) => (
                <div
                  key={cp.id}
                  className="inline-flex items-center gap-2 bg-white/10 px-2.5 py-1 rounded-lg text-xs"
                >
                  <span className="font-bold max-w-[140px] truncate">{cp.title}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleCompare(cp)}
                    className="text-slate-300 hover:text-red-300 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setComparedIds([])}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 cursor-pointer"
            >
              إفراغ
            </button>
            <button
              type="button"
              onClick={() => setShowCompareModal(true)}
              className="px-4 py-2 rounded-xl bg-[#C8A24B] hover:bg-[#E5C168] text-[#0F253E] text-xs font-black cursor-pointer"
            >
              مقارنة المنتجات ({comparedProducts.length})
            </button>
          </div>
        </div>
      )}

      {/* Side-by-Side Product Comparison Modal */}
      {showCompareModal && comparedProducts.length > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-5xl w-full overflow-hidden my-8 shadow-2xl">
            <div className="bg-[#0F253E] text-white px-6 py-4 flex items-center justify-between border-b border-[#C8A24B]/50">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#C8A24B]" />
                <h3 className="text-base font-black">
                  المقارنة الفنية والسعرية للمنتجات المختارة
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCompareModal(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="p-3 bg-slate-50 font-bold text-[#0F253E] w-44">وجه المقارنة</th>
                    {comparedProducts.map((cp) => (
                      <th key={cp.id} className="p-3 min-w-[220px] align-top">
                        <div className="space-y-2">
                          <img
                            src={cp.image}
                            alt={cp.title}
                            className="w-full h-32 rounded-xl object-cover border border-slate-200"
                          />
                          <div className="text-xs font-bold text-[#1C4587]" dir="ltr">
                            {cp.id}
                          </div>
                          <div className="font-black text-[#0F253E] text-sm">{cp.title}</div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 bg-slate-50 font-bold text-slate-700">القطاع والنوع</td>
                    {comparedProducts.map((cp) => (
                      <td key={cp.id} className="p-3 font-medium text-slate-800">
                        {cp.sector} · {cp.scopeBadge}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 bg-slate-50 font-bold text-slate-700">المنشأة والتجمع</td>
                    {comparedProducts.map((cp) => (
                      <td key={cp.id} className="p-3">
                        <div className="font-bold text-slate-900">{cp.enterpriseName}</div>
                        <div className="text-xs text-slate-500">
                          {cp.clusterName} ({cp.clusterId})
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 bg-slate-50 font-bold text-slate-700">
                      شرائح الأسعار ({currency})
                    </td>
                    {comparedProducts.map((cp) => (
                      <td key={cp.id} className="p-3 space-y-1.5 tabular-nums">
                        {(cp.tiers || []).map((t, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs border-b border-slate-100 pb-1 last:border-0"
                          >
                            <span className="text-slate-600">{t.label}:</span>
                            <strong className="text-[#0F253E]">
                              {formatMoney(t.priceUsd, currency, exchangeRate)} / {cp.unit}
                            </strong>
                          </div>
                        ))}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 bg-slate-50 font-bold text-slate-700">المواصفات الفنية</td>
                    {comparedProducts.map((cp) => (
                      <td key={cp.id} className="p-3 text-xs text-slate-600 leading-relaxed">
                        {cp.manufacturingSpecs}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 bg-slate-50 font-bold text-slate-700">التعاقد المباشر</td>
                    {comparedProducts.map((cp) => (
                      <td key={cp.id} className="p-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCompareModal(false);
                            onOpenRfq(cp, 1);
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-[#0F253E] hover:bg-[#1C4587] text-[#E5C168] text-xs font-bold cursor-pointer"
                        >
                          طلب عرض سعر (RFQ)
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 3. PRODUCT DETAIL VIEW (/products/:id) — CLEAN CONTIGUOUS ARCHITECTURE
// ============================================================================

interface ProductDetailViewProps {
  product: Product;
  cluster?: Cluster;
  currency: 'USD' | 'ILS';
  exchangeRate: number;
  onBackToCatalog: () => void;
  onViewCluster: (clusterId: string) => void;
  onOpenRfq: (product: Product, qty: number) => void;
  onProductRated?: () => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  cluster,
  currency,
  exchangeRate,
  onBackToCatalog,
  onViewCluster,
  onOpenRfq,
  onProductRated,
}) => {
  const sortedTiers = [...(product.tiers || [])].sort((a, b) => a.minQty - b.minQty);
  const [selectedTierIdx, setSelectedTierIdx] = useState(0);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [showSpecSheetModal, setShowSpecSheetModal] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Interactive Product Star Rating & Short Notes State
  const [localRating, setLocalRating] = useState<number>(() => Number(product.rating ?? 4.8));
  const [localRatingsCount, setLocalRatingsCount] = useState<number>(() =>
    Number(product.ratingsCount ?? 8)
  );
  const [localReviews, setLocalReviews] = useState<
    Array<{ id: string; authorName?: string; stars: number; note: string; createdAt: string }>
  >(() => (Array.isArray(product.reviews) ? product.reviews : []));
  const [selectedProductStars, setSelectedProductStars] = useState<number>(5);
  const [hoveredProductStars, setHoveredProductStars] = useState<number>(0);
  const [reviewerName, setReviewerName] = useState<string>('');
  const [reviewNote, setReviewNote] = useState<string>('');
  const [ratingSubmitting, setRatingSubmitting] = useState<boolean>(false);
  const [ratingFeedbackMsg, setRatingFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    setLocalRating(Number(product.rating ?? 4.8));
    setLocalRatingsCount(Number(product.ratingsCount ?? 8));
    setLocalReviews(Array.isArray(product.reviews) ? product.reviews : []);
    setSelectedProductStars(5);
    setHoveredProductStars(0);
    setReviewNote('');
    setRatingFeedbackMsg(null);
  }, [product.id, product.rating, product.ratingsCount, product.reviews]);

  const handleSubmitProductRating = async (e: React.FormEvent) => {
    e.preventDefault();
    setRatingSubmitting(true);
    setRatingFeedbackMsg(null);
    try {
      const res = await fetch(`/api/public/products/${encodeURIComponent(product.id)}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stars: selectedProductStars,
          note: reviewNote.trim(),
          authorName: reviewerName.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (typeof data.rating === 'number') setLocalRating(data.rating);
        if (typeof data.ratingsCount === 'number') setLocalRatingsCount(data.ratingsCount);
        if (Array.isArray(data.reviews)) setLocalReviews(data.reviews);
        setReviewNote('');
        setRatingFeedbackMsg('تم تسجيل تقييمك وملاحظتك بنجاح. شكراً لمشاركتك!');
        if (onProductRated) onProductRated();
      }
    } catch (err) {
      console.error('Error submitting product rating:', err);
    } finally {
      setRatingSubmitting(false);
    }
  };

  const allImages = useMemo(() => {
    const list = [product.image, ...(product.galleryImages || [])].filter(
      (u): u is string => Boolean(u && u.trim())
    );
    return Array.from(new Set(list));
  }, [product.image, product.galleryImages]);

  const allVideos = useMemo(() => {
    const list = [product.videoUrl, ...(product.videoUrls || [])].filter(
      (u): u is string => Boolean(u && u.trim())
    );
    return Array.from(new Set(list));
  }, [product.videoUrl, product.videoUrls]);

  const allDocuments = useMemo(() => {
    const docs = [...(product.documents || [])].filter(
      (d) => Boolean(d && d.url && d.url.trim())
    );
    if (
      product.specPdfUrl &&
      product.specPdfUrl.trim() &&
      !docs.some((d) => d.url === product.specPdfUrl)
    ) {
      const rawName = product.specPdfUrl.split('/').pop() || 'ملف المواصفات الفنية';
      docs.unshift({ name: rawName, url: product.specPdfUrl.trim() });
    }
    return docs;
  }, [product.documents, product.specPdfUrl]);

  React.useEffect(() => {
    setActiveImageIdx(0);
    setActiveVideoIdx(0);
    setPreviewDocUrl(null);
  }, [product.id]);

  const currentImage = allImages[activeImageIdx] || product.image;
  const currentVideo = allVideos[activeVideoIdx] || allVideos[0] || '';

  const activeTier = sortedTiers[selectedTierIdx] || {
    label: 'سعر أساسي',
    minQty: 1,
    priceUsd: product.priceUsd,
    discountTag: 'سعر أساسي',
  };

  const isEmbedVideo = (url: string) =>
    url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');

  const getEmbedUrl = (url: string) => {
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split(/[?&]/)[0];
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }
    if (url.includes('youtube.com/watch')) {
      const match = url.match(/[?&]v=([^&]+)/);
      return match?.[1] ? `https://www.youtube.com/embed/${match[1]}` : url;
    }
    return url;
  };

  const hasImages = allImages.length > 0;
  const hasVideo = allVideos.length > 0;
  const hasSpecFile = allDocuments.length > 0;
  const hasAnyHighlight = Boolean(
    (product.priceSavingHighlight && product.priceSavingHighlight.trim()) ||
      (product.qualityEdgeHighlight && product.qualityEdgeHighlight.trim()) ||
      (product.dailyCapacity && product.dailyCapacity.trim())
  );
  const showMediaColumn = hasImages || hasVideo || hasSpecFile || hasAnyHighlight;

  return (
    <div className="product-detail-stage-gradient min-h-[calc(100vh-220px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Clean Navigation & Breadcrumb Row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            type="button"
            onClick={onBackToCatalog}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200/90 hover:border-[#C8A24B] text-xs sm:text-sm font-bold text-[#0F253E] transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4 text-[#1C4587]" />
            <span>العودة إلى معرض المنتجات</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
            <span>معرض المنتجات</span>
            <span aria-hidden="true">/</span>
            <span className="text-[#1C4587] font-medium">{product.sector}</span>
            <span aria-hidden="true">/</span>
            <strong className="text-[#0F253E]">{product.title}</strong>
          </div>
        </div>

        {/* Main Product Detail Surface with Soft Ambient Gradient */}
        <div className="relative product-detail-main-gradient rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-l from-[#0F253E] via-[#1C4587] to-[#C8A24B]" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12">
            {/* Right Media Column — Rendered strictly for added media */}
            {showMediaColumn && (
              <div className="lg:col-span-5 p-6 lg:p-8 product-detail-gallery-gradient border-b lg:border-b-0 lg:border-l border-slate-200/70 space-y-5">
                {/* Primary Image Gallery */}
                {hasImages && (
                  <div className="space-y-3">
                    <div
                      onClick={() => setIsLightboxOpen(true)}
                      className="relative rounded-2xl overflow-hidden border border-slate-200/80 bg-white h-72 sm:h-96 group/gallery cursor-zoom-in"
                      title="انقر لتكبير الصورة في وضع العرض الكامل"
                    >
                      <img
                        src={currentImage}
                        alt={product.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover/gallery:scale-105 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />

                      <div className="absolute top-3 left-3 bg-black/55 backdrop-blur-xs text-white px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 opacity-85 group-hover/gallery:opacity-100 transition-opacity">
                        <Eye className="w-3.5 h-3.5 text-[#E5C168]" />
                        <span>تكبير الصورة</span>
                      </div>

                      <div
                        className="absolute bottom-3 left-3 bg-[#0F253E]/85 text-[#E5C168] px-2.5 py-1 rounded-md text-xs font-bold tabular-nums"
                        dir="ltr"
                      >
                        {product.id}
                      </div>

                      {allImages.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveImageIdx((prev) =>
                                prev === 0 ? allImages.length - 1 : prev - 1
                              );
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
                            title="الصورة السابقة"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveImageIdx((prev) =>
                                prev === allImages.length - 1 ? 0 : prev + 1
                              );
                            }}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
                            title="الصورة التالية"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-3 right-3 bg-black/65 text-white px-2.5 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 tabular-nums">
                            <Images className="w-3.5 h-3.5 text-[#E5C168]" />
                            <span>
                              {activeImageIdx + 1} / {allImages.length}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {allImages.length > 1 && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {allImages.map((imgUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveImageIdx(idx)}
                            className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                              idx === activeImageIdx
                                ? 'border-[#C8A24B] scale-105'
                                : 'border-slate-200 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={imgUrl}
                              alt={`${product.title} - ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Video Player — Shown ONLY if added */}
                {hasVideo && (
                  <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F253E]">
                        <Video className="w-4 h-4 text-[#1C4587]" />
                        <span>
                          {allVideos.length > 1
                            ? `فيديوهات المنتج (${allVideos.length})`
                            : 'فيديو توضيحي للمنتج'}
                        </span>
                      </div>

                      {allVideos.length > 1 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {allVideos.map((_, vIdx) => (
                            <button
                              key={vIdx}
                              type="button"
                              onClick={() => setActiveVideoIdx(vIdx)}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                                vIdx === activeVideoIdx
                                  ? 'bg-[#0F253E] text-[#E5C168]'
                                  : 'bg-slate-100 text-slate-600 hover:text-[#0F253E]'
                              }`}
                            >
                              فيديو {vIdx + 1}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {isEmbedVideo(currentVideo) ? (
                      <div className="aspect-video rounded-lg overflow-hidden bg-slate-900">
                        <iframe
                          key={currentVideo}
                          src={getEmbedUrl(currentVideo)}
                          title={`${product.title} - video ${activeVideoIdx + 1}`}
                          className="w-full h-full"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <video
                        key={currentVideo}
                        src={currentVideo}
                        controls
                        className="w-full rounded-lg max-h-64 bg-slate-900"
                      />
                    )}
                  </div>
                )}

                {/* Attached Documents — Shown ONLY if added */}
                {hasSpecFile && (
                  <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F253E]">
                      <FileText className="w-4 h-4 text-[#1C4587]" />
                      <span>
                        {allDocuments.length > 1
                          ? `المستندات وملفات المواصفات (${allDocuments.length})`
                          : 'ملف المواصفات المرفق'}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {allDocuments.map((doc, dIdx) => {
                        const ext =
                          doc.url.split('.').pop()?.toUpperCase().slice(0, 4) || 'FILE';
                        const isPdf = ext === 'PDF' || doc.url.toLowerCase().endsWith('.pdf');
                        const isPreviewOpen = previewDocUrl === doc.url;

                        return (
                          <div key={dIdx} className="py-2.5 first:pt-0 last:pb-0 space-y-2">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                                  [{ext}]
                                </span>
                                <span className="text-xs font-bold text-[#0F253E] truncate">
                                  {doc.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {isPdf && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewDocUrl(isPreviewOpen ? null : doc.url)
                                    }
                                    className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-[#0F253E] text-[11px] font-bold cursor-pointer"
                                  >
                                    {isPreviewOpen ? 'إخفاء' : 'معاينة'}
                                  </button>
                                )}
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  download
                                  className="px-2.5 py-1 rounded-md bg-[#0F253E] text-[#E5C168] text-[11px] font-bold flex items-center gap-1 shrink-0"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>تحميل</span>
                                </a>
                              </div>
                            </div>

                            {isPdf && isPreviewOpen && (
                              <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100 h-72">
                                <iframe
                                  src={doc.url}
                                  title={doc.name}
                                  className="w-full h-full"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Key Industrial Highlights — Uncluttered list */}
                {hasAnyHighlight && (
                  <div className="rounded-xl bg-white/90 border border-slate-200/80 p-4 space-y-2.5 text-xs">
                    {product.priceSavingHighlight && product.priceSavingHighlight.trim() && (
                      <div className="flex items-start gap-2 text-emerald-900 font-bold">
                        <TrendingDown className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <span>{product.priceSavingHighlight}</span>
                      </div>
                    )}
                    {product.qualityEdgeHighlight && product.qualityEdgeHighlight.trim() && (
                      <div className="flex items-start gap-2 text-[#0F253E] font-medium">
                        <Sparkles className="w-4 h-4 text-[#1C4587] shrink-0 mt-0.5" />
                        <span>{product.qualityEdgeHighlight}</span>
                      </div>
                    )}
                    {product.dailyCapacity && product.dailyCapacity.trim() && (
                      <div className="flex items-center justify-between flex-wrap gap-2 text-slate-800 font-bold pt-2 border-t border-slate-100">
                        <span className="flex items-center gap-2">
                          <Gauge className="w-4 h-4 text-[#9A7422] shrink-0" />
                          <span>الطاقة الإنتاجية اليومية: {product.dailyCapacity}</span>
                        </span>
                        {product.sampleAvailable && (
                          <span className="text-emerald-700 text-[11px]">
                            ✓ عينة متاحة للفحص
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Left Column: Clean Contiguous Information & Contracting Module */}
            <div
              className={`${
                showMediaColumn ? 'lg:col-span-7' : 'lg:col-span-12'
              } p-6 lg:p-10 space-y-7`}
            >
              {/* Title, Average Star Rating Summary & Unboxed Metadata Header */}
              <div className="border-b border-slate-200/80 pb-5 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 font-medium">
                    <span className="text-[#1C4587] font-bold">{product.sector}</span>
                    <span aria-hidden="true">·</span>
                    <span>{product.unionName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{product.scopeBadge}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      وحدة القياس: <strong className="text-[#0F253E]">{product.unit}</strong>
                    </span>
                  </div>

                  {/* Live Average Customer Star Rating Pill-Free Summary */}
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F253E] tabular-nums">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= Math.round(localRating)
                              ? 'text-[#C8A24B] fill-[#C8A24B]'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span>{localRating.toFixed(1)}</span>
                    <span className="text-slate-400 font-medium">
                      ({localRatingsCount} تقييمات)
                    </span>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-2xl sm:text-3xl font-black text-[#0F253E] leading-snug">
                    {product.title}
                  </h1>
                  <button
                    type="button"
                    onClick={() => setShowSpecSheetModal(true)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[#0F253E] text-slate-700 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>بطاقة المواصفات</span>
                  </button>
                </div>
              </div>

              {/* Description & Technical Specs — Clean Typography (No Nested Colored Boxes) */}
              {((product.description && product.description.trim()) ||
                (product.manufacturingSpecs && product.manufacturingSpecs.trim())) && (
                <div className="space-y-5 border-b border-slate-200/80 pb-6">
                  {product.description && product.description.trim() && (
                    <div className="space-y-1.5">
                      <h3 className="text-xs font-bold text-slate-500">
                        الوصف العام للمنتج
                      </h3>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  )}

                  {product.manufacturingSpecs && product.manufacturingSpecs.trim() && (
                    <div className="space-y-1.5">
                      <h3 className="text-xs font-bold text-[#1C4587] flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5" />
                        <span>المواصفات الفنية والتصنيعية المعتمدة</span>
                      </h3>
                      <p className="text-sm text-slate-800 leading-relaxed">
                        {product.manufacturingSpecs}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Enterprise & Cluster Attribution — Hairline 2-Column Split */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-slate-200/80 pb-6">
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <Factory className="w-3.5 h-3.5 text-[#1C4587]" />
                    <span>المنشأة الصناعية المنتجة</span>
                  </div>
                  <div className="text-base font-black text-[#0F253E]">
                    {product.enterpriseName}
                  </div>
                  <div className="text-xs text-slate-600">
                    إدارة: <strong>{product.enterpriseOwner}</strong>
                    {product.enterprisePhone && (
                      <>
                        {' · '}
                        <span dir="ltr">{product.enterprisePhone}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#9A7422]" />
                    <span>الوحدة الإنتاجية العنقودية</span>
                  </div>
                  <div className="text-base font-black text-[#0F253E]">
                    {product.clusterName} ({product.clusterId})
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    {cluster && (
                      <span className="text-slate-600">
                        المحافظة: <strong>{cluster.governorate}</strong>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onViewCluster(product.clusterId)}
                      className="font-bold text-[#1C4587] hover:underline cursor-pointer"
                    >
                      تفاصيل التجمع ←
                    </button>
                  </div>
                </div>
              </div>

              {/* Contractual Price Tiers & Contiguous Purchase Module */}
              <div className="space-y-5 border-b border-slate-200/80 pb-7">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm font-black text-[#0F253E]">
                    شرائح الأسعار التعاقدية (حسب الكمية المطلوبة)
                  </h3>
                  <span className="text-xs text-slate-500 tabular-nums">
                    سعر الصرف المرجعي: 1 دولار = {exchangeRate} شيكل
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {sortedTiers.map((tier, idx) => {
                    const isSelected = idx === selectedTierIdx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedTierIdx(idx)}
                        className={`p-4 rounded-xl border text-right transition-all cursor-pointer tabular-nums ${
                          isSelected
                            ? 'bg-[#0F253E] text-white border-[#0F253E] shadow-sm'
                            : 'bg-white text-slate-800 border-slate-200/90 hover:border-[#C8A24B]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-xs font-bold ${
                              isSelected ? 'text-[#E5C168]' : 'text-slate-500'
                            }`}
                          >
                            {tier.label}
                          </span>
                          <span
                            className={`text-[10px] font-bold ${
                              isSelected ? 'text-emerald-300' : 'text-emerald-700'
                            }`}
                          >
                            {tier.discountTag}
                          </span>
                        </div>

                        <div className="text-xl font-black my-1">
                          {formatMoney(tier.priceUsd, currency, exchangeRate)}{' '}
                          <span className="text-xs font-normal opacity-75">/ {product.unit}</span>
                        </div>

                        <div
                          className={`text-[11px] ${
                            isSelected ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          الحد الأدنى: {tier.minQty} {product.unit}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Primary Contracting Bar */}
                <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="tabular-nums text-center sm:text-right">
                    <div className="text-xs text-slate-300">
                      الشريحة المختارة: <strong className="text-[#E5C168]">{activeTier.label}</strong> (حد أدنى {activeTier.minQty} {product.unit})
                    </div>
                    <div className="text-lg font-black mt-0.5">
                      سعر الوحدة: ${activeTier.priceUsd}{' '}
                      <span className="text-sm font-normal text-slate-300">
                        ({(activeTier.priceUsd * exchangeRate).toFixed(2)} ₪)
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenRfq(product, activeTier.minQty)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#C8A24B] hover:bg-[#E5C168] text-[#0F253E] font-black text-sm shadow-md active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <FileSignature className="w-4 h-4" />
                    <span>طلب عرض سعر وتعاقد (RFQ)</span>
                  </button>
                </div>
              </div>

              {/* Interactive Customer Star Rating & Short Notes Section */}
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-[#0F253E] flex items-center gap-2">
                      <Star className="w-4 h-4 text-[#C8A24B] fill-[#C8A24B]" />
                      <span>تقييمات العملاء وملاحظات الجودة</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      شارك تقييمك للمنتج وأضف ملاحظة نصية قصيرة حول المواصفات أو تجربة التوريد
                    </p>
                  </div>

                  {/* Average Customer Rating Display */}
                  <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200/80 tabular-nums self-start sm:self-auto">
                    <div className="text-2xl font-black text-[#0F253E]">
                      {localRating.toFixed(1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= Math.round(localRating)
                                ? 'text-[#C8A24B] fill-[#C8A24B]'
                                : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                        متوسط {localRatingsCount} تقييمات
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interactive Star Rating & Short Note Form */}
                <form
                  onSubmit={handleSubmitProductRating}
                  className="p-4 sm:p-5 rounded-xl bg-white/90 border border-slate-200/80 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-bold text-[#0F253E]">
                        اختر تقييمك:
                      </span>
                      <div className="inline-flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isLit =
                            star <= (hoveredProductStars || selectedProductStars);
                          return (
                            <button
                              key={star}
                              type="button"
                              onMouseEnter={() => setHoveredProductStars(star)}
                              onMouseLeave={() => setHoveredProductStars(0)}
                              onClick={() => setSelectedProductStars(star)}
                              className="p-1 rounded-lg hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                              title={`${star} نجوم`}
                            >
                              <Star
                                className={`w-6 h-6 transition-colors ${
                                  isLit
                                    ? 'text-[#C8A24B] fill-[#C8A24B]'
                                    : 'text-slate-300'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-xs font-bold text-[#9A7422]">
                        {(hoveredProductStars || selectedProductStars) === 5
                          ? '5 نجوم — ممتاز'
                          : (hoveredProductStars || selectedProductStars) === 4
                          ? '4 نجوم — جيد جدًا'
                          : (hoveredProductStars || selectedProductStars) === 3
                          ? '3 نجوم — جيد'
                          : (hoveredProductStars || selectedProductStars) === 2
                          ? 'نجمتان — مقبول'
                          : 'نجمة واحدة — يحتاج تحسين'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        placeholder="الاسم أو الجهة (اختياري)"
                        maxLength={60}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs focus:outline-none focus:border-[#0F253E]"
                      />
                    </div>
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        placeholder="أضف ملاحظة نصية قصيرة مرتبطة بالتقييم..."
                        maxLength={180}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs focus:outline-none focus:border-[#0F253E]"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <button
                        type="submit"
                        disabled={ratingSubmitting}
                        className="w-full h-full py-2.5 px-4 rounded-xl bg-[#0F253E] hover:bg-[#1C4587] text-[#E5C168] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        {ratingSubmitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
                      </button>
                    </div>
                  </div>

                  {ratingFeedbackMsg && (
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 pt-1">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{ratingFeedbackMsg}</span>
                    </div>
                  )}
                </form>

                {/* Short Customer Notes List */}
                {localReviews.length > 0 && (
                  <div className="space-y-2.5 pt-1">
                    <div className="text-xs font-bold text-slate-500">
                      أحدث ملاحظات العملاء ({localReviews.length}):
                    </div>
                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white/80 px-4">
                      {localReviews.slice(0, 6).map((rev) => (
                        <div key={rev.id} className="py-3 space-y-1 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <strong className="text-[#0F253E]">
                                {rev.authorName || 'عميل / جهة مشترية'}
                              </strong>
                              <span className="text-slate-300" aria-hidden="true">·</span>
                              <div className="inline-flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-3 h-3 ${
                                      s <= rev.stars
                                        ? 'text-[#C8A24B] fill-[#C8A24B]'
                                        : 'text-slate-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="text-[11px] text-slate-400 tabular-nums" dir="ltr">
                              {rev.createdAt}
                            </span>
                          </div>
                          <p className="text-slate-700 leading-relaxed">{rev.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Screen Cinematic Lightbox Modal for Product Images */}
      {isLightboxOpen && hasImages && (
        <div
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl w-full flex flex-col items-center gap-4 animate-modal-pop"
          >
            {/* Top Bar */}
            <div className="w-full flex items-center justify-between text-white px-2">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
                <span className="text-[#E5C168]" dir="ltr">
                  {product.id}
                </span>
                <span className="text-white/40">·</span>
                <span>{product.title}</span>
                {allImages.length > 1 && (
                  <span className="text-slate-400 tabular-nums" dir="ltr">
                    ({activeImageIdx + 1} / {allImages.length})
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Lightbox Image Stage */}
            <div className="relative w-full max-h-[75vh] flex items-center justify-center rounded-2xl overflow-hidden bg-slate-900/80 border border-white/15">
              <img
                src={currentImage}
                alt={product.title}
                referrerPolicy="no-referrer"
                className="max-h-[75vh] w-auto max-w-full object-contain"
              />

              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIdx((prev) =>
                        prev === 0 ? allImages.length - 1 : prev - 1
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/65 hover:bg-[#C8A24B] text-white hover:text-[#0F253E] flex items-center justify-center transition-colors cursor-pointer"
                    title="الصورة السابقة"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIdx((prev) =>
                        prev === allImages.length - 1 ? 0 : prev + 1
                      )
                    }
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/65 hover:bg-[#C8A24B] text-white hover:text-[#0F253E] flex items-center justify-center transition-colors cursor-pointer"
                    title="الصورة التالية"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip in Lightbox */}
            {allImages.length > 1 && (
              <div className="flex items-center justify-center gap-2.5 overflow-x-auto py-1 max-w-full">
                {allImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                      idx === activeImageIdx
                        ? 'border-[#C8A24B] scale-105'
                        : 'border-white/20 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${product.title} - ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Printable Official Specification Sheet Modal */}
      {showSpecSheetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full overflow-hidden my-8 shadow-2xl">
            <div className="bg-[#0F253E] text-white px-6 py-4 flex items-center justify-between border-b border-[#C8A24B]/50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#C8A24B]" />
                <h3 className="text-base font-black">
                  بطاقة المواصفات الفنية المعتمدة — {product.id}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-[#C8A24B] text-[#0F253E] text-xs font-black flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSpecSheetModal(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs sm:text-sm">
              <div className="border-b border-slate-200 pb-3 flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-[#1C4587]">
                    مشروع الدعم العاجل لتعافي المنشآت الصناعية في غزة (HCC)
                  </div>
                  <h4 className="text-lg font-black text-[#0F253E] mt-1">{product.title}</h4>
                  <div className="text-xs text-slate-500 mt-0.5">
                    القطاع: {product.sector} · الاتحاد: {product.unionName}
                  </div>
                </div>
                <span className="px-3 py-1 rounded bg-[#0F253E] text-[#E5C168] font-bold text-xs" dir="ltr">
                  {product.id}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500">المنشأة المنتجة:</span>{' '}
                  <strong className="text-slate-900">{product.enterpriseName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">التجمع العنقودي:</span>{' '}
                  <strong className="text-slate-900">
                    {product.clusterName} ({product.clusterId})
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">الطاقة الإنتاجية اليومية:</span>{' '}
                  <strong className="text-slate-900">{product.dailyCapacity}</strong>
                </div>
                <div>
                  <span className="text-slate-500">توفر العينة:</span>{' '}
                  <strong className="text-emerald-700">
                    {product.sampleAvailable ? 'متاحة للفحص' : 'حسب الطلب'}
                  </strong>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="font-bold text-[#0F253E]">الوصف العام:</div>
                <p className="text-slate-700 leading-relaxed">{product.description}</p>
              </div>

              <div className="space-y-1.5">
                <div className="font-bold text-[#1C4587]">المواصفات الفنية والتصنيعية:</div>
                <p className="text-slate-800 leading-relaxed">{product.manufacturingSpecs}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="font-bold text-[#0F253E]">
                  شرائح الأسعار التعاقدية ({product.unit}):
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {sortedTiers.map((t, i) => (
                    <div key={i} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-center">
                      <div className="font-bold text-slate-600 text-xs">{t.label}</div>
                      <div className="font-black text-[#0F253E] text-sm my-0.5">${t.priceUsd}</div>
                      <div className="text-[11px] text-emerald-700 font-bold">{t.discountTag}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 4. CLUSTERS DIRECTORY (/clusters) & CLUSTER DETAIL (/clusters/:id)
// ============================================================================

interface ClustersDirectoryViewProps {
  clusters: Cluster[];
  products: Product[];
  sectors: Sector[];
  onViewCluster: (clusterId: string) => void;
  onFilterCatalogByCluster: (clusterId: string) => void;
}

export const ClustersDirectoryView: React.FC<ClustersDirectoryViewProps> = ({
  clusters,
  products,
  sectors,
  onViewCluster,
  onFilterCatalogByCluster,
}) => {
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [govFilter, setGovFilter] = useState('ALL');

  const governorates = useMemo(() => {
    const set = new Set<string>();
    clusters.forEach((c) => {
      if (c.governorate) set.add(c.governorate);
    });
    return Array.from(set);
  }, [clusters]);

  const filteredClusters = useMemo(() => {
    return clusters.filter((c) => {
      if (sectorFilter !== 'ALL' && c.sector !== sectorFilter) return false;
      if (govFilter !== 'ALL' && c.governorate !== govFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const inName = c.name.toLowerCase().includes(q);
        const inId = c.id.toLowerCase().includes(q);
        const inHost = c.hostEnterprise.toLowerCase().includes(q);
        const inGov = c.governorate.toLowerCase().includes(q);
        if (!inName && !inId && !inHost && !inGov) return false;
      }
      return true;
    });
  }, [clusters, sectorFilter, govFilter, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Unified Header & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
        <div>
          <p className="text-xs font-bold text-[#9A7422] mb-1">
            الهيكل التنظيمي للوحدات الإنتاجية العنقودية (15 تجمعًا في 6 قطاعات)
          </p>
          <h2 className="text-xl sm:text-2xl font-black text-[#0F253E]">
            دليل التجمعات الإنتاجية العنقودية والمحطات المركزية
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            تعرّف على المنشآت المستضيفة، المحطات الإنتاجية المشتركة، والمنشآت الأعضاء في كل تجمع صناعي.
          </p>
        </div>

        {/* Search & Sector Filter */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-7 relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم التجمع، المعرّف (CL1)، المنشأة المستضيفة، أو المحافظة..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-xs sm:text-sm focus:outline-none focus:border-[#0F253E]"
            />
          </div>
          <div className="md:col-span-5">
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-[#0F253E]"
            >
              <option value="ALL">جميع القطاعات الصناعية ({sectors.length})</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clean Governorate Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
          <button
            type="button"
            onClick={() => setGovFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              govFilter === 'ALL'
                ? 'bg-[#0F253E] text-[#E5C168]'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-[#C8A24B]" />
            <span>جميع المحافظات ({clusters.length})</span>
          </button>

          {governorates.map((gov) => {
            const count = clusters.filter((c) => c.governorate === gov).length;
            return (
              <button
                key={gov}
                type="button"
                onClick={() => setGovFilter(gov)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                  govFilter === gov
                    ? 'bg-[#0F253E] text-[#E5C168]'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>محافظة {gov} ({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Clean Architectural Clusters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClusters.map((cluster) => {
          const clusterProducts = products.filter((p) => p.clusterId === cluster.id);
          return (
            <div
              key={cluster.id}
              className="bg-white rounded-2xl border border-slate-200/80 hover:border-[#C8A24B]/80 hover:shadow-md transition-all p-6 flex flex-col justify-between gap-5"
            >
              <div className="space-y-4">
                {/* Clean Unboxed Top Meta */}
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1.5">
                    <span className="font-black text-[#1C4587] tabular-nums" dir="ltr">
                      {cluster.id}
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[#C8A24B]" />
                      <span>{cluster.governorate}</span>
                    </span>
                  </div>

                  <h3
                    onClick={() => onViewCluster(cluster.id)}
                    className="text-base sm:text-lg font-black text-[#0F253E] hover:text-[#1C4587] cursor-pointer leading-snug transition-colors"
                  >
                    {cluster.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {cluster.sector} · {cluster.unionName}
                  </p>
                </div>

                {/* Host Enterprise & Central Stations — Divided by subtle hairline */}
                <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">المنشأة الصناعية المستضيفة:</span>
                    <div className="font-bold text-slate-900">{cluster.hostEnterprise}</div>
                    <div className="text-slate-500 mt-0.5">
                      {cluster.hostOwner} · <span dir="ltr">{cluster.hostPhone}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5">المحطات المركزية المشتركة:</span>
                    <p className="text-slate-700 leading-relaxed line-clamp-2">
                      {cluster.centralStations}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold tabular-nums">
                  <span>{cluster.members.length} منشآت أعضاء</span>
                  <span>{clusterProducts.length} منتجات معتمدة</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onViewCluster(cluster.id)}
                    className="py-2 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>بنية التجمع</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onFilterCatalogByCluster(cluster.id)}
                    className="py-2 px-3 rounded-xl bg-[#0F253E] text-[#E5C168] hover:bg-[#1C4587] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>المنتجات ({clusterProducts.length})</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface ClusterDetailViewProps {
  cluster: Cluster;
  products: Product[];
  currency: 'USD' | 'ILS';
  exchangeRate: number;
  onBackToClusters: () => void;
  onViewProduct: (productId: string) => void;
  onFilterCatalogByCluster: (clusterId: string) => void;
  onOpenRfq: (product: Product, qty: number) => void;
}

export const ClusterDetailView: React.FC<ClusterDetailViewProps> = ({
  cluster,
  products,
  currency,
  exchangeRate,
  onBackToClusters,
  onViewProduct,
  onFilterCatalogByCluster,
  onOpenRfq,
}) => {
  const clusterProducts = products.filter((p) => p.clusterId === cluster.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          type="button"
          onClick={onBackToClusters}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm font-bold text-[#0F253E] hover:bg-slate-50 cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة إلى دليل التجمعات</span>
        </button>

        <button
          type="button"
          onClick={() => onFilterCatalogByCluster(cluster.id)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C8A24B] text-[#0F253E] text-xs sm:text-sm font-black hover:bg-[#E5C168] cursor-pointer"
        >
          <Package className="w-4 h-4" />
          <span>فتح المعرض بمنتجات هذا التجمع ({clusterProducts.length})</span>
        </button>
      </div>

      {/* Cluster Header Banner */}
      <div className="hero-industrial-pattern text-white rounded-2xl border-b-2 border-[#C8A24B] p-6 lg:p-8">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 mb-2">
          <span className="font-black text-[#E5C168]" dir="ltr">
            {cluster.id}
          </span>
          <span aria-hidden="true">·</span>
          <span>{cluster.sector}</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#C8A24B]" />
            <span>محافظة {cluster.governorate}</span>
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white mb-1.5">{cluster.name}</h1>
        <p className="text-xs sm:text-sm text-slate-300">
          الاتحاد التخصصي المشرف: <strong className="text-[#E5C168]">{cluster.unionName}</strong>
        </p>
      </div>

      {/* Clean Cluster Network Architecture */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 lg:p-8 space-y-6">
        <div className="border-b border-slate-100 pb-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#0F253E] flex items-center justify-center">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#0F253E]">
              بنية التجمع والتشبيك الإنتاجي المشترك
            </h3>
            <p className="text-xs text-slate-500">
              المنشأة المستضيفة والمحطات المركزية والمنشآت الأعضاء ({cluster.members.length} منشآت)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="text-xs font-bold text-[#9A7422] block">
              المنشأة الصناعية المستضيفة (Host Enterprise)
            </span>
            <h4 className="text-base sm:text-lg font-black text-[#0F253E]">
              {cluster.hostEnterprise}
            </h4>
            <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-200/70">
              <div>
                المسؤول: <strong>{cluster.hostOwner}</strong>
              </div>
              <div>
                هاتف التواصل: <strong dir="ltr">{cluster.hostPhone}</strong>
              </div>
              <div>
                الموقع: <strong>{cluster.governorate}</strong>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 p-5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-center space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1C4587]">
              <Cpu className="w-4 h-4" />
              <span>المحطات الإنتاجية المركزية المشتركة داخل التجمع</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
              {cluster.centralStations}
            </p>
          </div>
        </div>

        {/* Member Enterprises Grid */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-slate-500">
            المنشآت الصناعية الأعضاء المستفيدة من المحطات المركزية ({cluster.members.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {cluster.members.map((member, idx) => (
              <div
                key={member.id || idx}
                className="p-4 rounded-xl bg-white border border-slate-200/80 flex items-start gap-3"
              >
                <span
                  className="text-xs font-black text-[#9A7422] tabular-nums mt-0.5"
                  dir="ltr"
                >
                  0{idx + 1}.
                </span>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-[#0F253E]">
                    {member.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    إدارة: {member.owner}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Associated Products Section */}
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-lg sm:text-xl font-black text-[#0F253E]">
            المنتجات المعتمدة ضمن هذا التجمع ({clusterProducts.length})
          </h3>
          <button
            type="button"
            onClick={() => onFilterCatalogByCluster(cluster.id)}
            className="text-xs font-bold text-[#1C4587] hover:underline cursor-pointer"
          >
            فتح في المعرض العام ←
          </button>
        </div>

        {clusterProducts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center text-xs sm:text-sm text-slate-500">
            لا توجد منتجات منشورة مرتبطة مباشرة بهذا التجمع حاليًا.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {clusterProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currency={currency}
                exchangeRate={exchangeRate}
                onViewProduct={onViewProduct}
                onViewCluster={() => {}}
                onOpenRfq={onOpenRfq}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 5. BUYER MY ORDERS VIEW (/my-orders)
// ============================================================================

interface MyOrdersViewProps {
  buyer: BuyerAccount | null;
  orders: RfqOrder[];
  loading: boolean;
  onOpenBuyerAuth: () => void;
  onNavigateToCatalog: () => void;
  onViewProduct: (productId: string) => void;
  onRefreshOrders: () => void;
}

const ORDER_STEPS = [
  { key: 'جديد', label: '1. استلام الطلب المرجعي' },
  { key: 'قيد المراجعة', label: '2. المراجعة الفنية والتسعير' },
  { key: 'تم التواصل', label: '3. التواصل وفحص العينات' },
  { key: 'مغلق', label: '4. إتمام التعاقد والتوريد' },
];

function getStepIndex(status: string): number {
  if (status === 'جديد') return 0;
  if (status === 'قيد المراجعة') return 1;
  if (status === 'تم التواصل') return 2;
  if (status === 'مغلق') return 3;
  return -1;
}

export const MyOrdersView: React.FC<MyOrdersViewProps> = ({
  buyer,
  orders,
  loading,
  onOpenBuyerAuth,
  onNavigateToCatalog,
  onViewProduct,
  onRefreshOrders,
}) => {
  const [proformaOrder, setProformaOrder] = useState<RfqOrder | null>(null);

  if (!buyer) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-[#0F253E] flex items-center justify-center mx-auto">
            <ClipboardList className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0F253E]">
            متابعة طلبات عروض الأسعار والتعاقد (RFQ)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            يرجى تسجيل الدخول بحساب المشتري أو إنشاء حساب مجاني لاستعراض سجل طلبات التعاقد الخاصة بمؤسستكم ومتابعة حالتها.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onOpenBuyerAuth}
              className="px-6 py-3 rounded-xl bg-[#0F253E] hover:bg-[#1C4587] text-[#E5C168] font-bold text-xs sm:text-sm cursor-pointer"
            >
              تسجيل دخول / إنشاء حساب مشتري
            </button>
            <button
              type="button"
              onClick={onNavigateToCatalog}
              className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm cursor-pointer"
            >
              تصفح معرض المنتجات
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-emerald-700 text-xs font-bold">
            حساب مشتري معتمد: {buyer.organization}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0F253E]">
            طلباتي وعروض الأسعار المرسلة ({orders.length})
          </h2>
          <p className="text-xs text-slate-500">
            المسؤول: <strong>{buyer.name}</strong> · الهاتف:{' '}
            <span dir="ltr">{buyer.phone}</span> · البريد: <span dir="ltr">{buyer.email}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={onRefreshOrders}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تحديث</span>
          </button>
          <button
            type="button"
            onClick={onNavigateToCatalog}
            className="px-4 py-2 rounded-xl bg-[#0F253E] text-[#E5C168] hover:bg-[#1C4587] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Package className="w-3.5 h-3.5" />
            <span>طلب منتج جديد</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
          <p className="text-sm font-bold text-slate-600">جاري تحميل طلباتكم...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-4">
          <h3 className="text-base sm:text-lg font-black text-[#0F253E]">
            لا توجد طلبات عروض أسعار مرسلة حتى الآن
          </h3>
          <button
            type="button"
            onClick={onNavigateToCatalog}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F253E] text-[#E5C168] text-xs font-bold hover:bg-[#1C4587] cursor-pointer"
          >
            <span>استكشاف معرض المنتجات</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => {
            const currentStep = getStepIndex(order.status);

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className="text-xs font-black text-[#1C4587] tabular-nums"
                      dir="ltr"
                    >
                      {order.refNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => onViewProduct(order.productId)}
                      className="text-base font-black text-[#0F253E] hover:text-[#1C4587] cursor-pointer"
                    >
                      {order.productTitle} ({order.productId})
                    </button>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-slate-400 flex items-center gap-1 tabular-nums" dir="ltr">
                      <Clock className="w-3.5 h-3.5" />
                      {order.createdAt}
                    </span>
                    <button
                      type="button"
                      onClick={() => setProformaOrder(order)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[#0F253E] text-[#0F253E] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>عرض سعر مبدئي (PDF)</span>
                    </button>
                  </div>
                </div>

                {order.status === 'ملغى' ? (
                  <div className="p-3 rounded-xl bg-red-50 text-red-800 text-xs font-bold">
                    حالة الطلب: ملغى
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ORDER_STEPS.map((step, idx) => {
                      const isCompleted = idx <= currentStep;
                      const isCurrent = idx === currentStep;
                      return (
                        <div
                          key={step.key}
                          className={`p-2.5 rounded-xl border text-xs ${
                            isCurrent
                              ? 'bg-[#0F253E] text-[#E5C168] border-[#0F253E] font-bold'
                              : isCompleted
                              ? 'bg-emerald-50/70 text-emerald-900 border-emerald-200 font-bold'
                              : 'bg-slate-50 text-slate-400 border-slate-200/70'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span>{step.label}</span>
                            {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs pt-2 tabular-nums">
                  <div>
                    <span className="text-slate-400 block">التجمع والمنشأة:</span>
                    <strong className="text-slate-800">
                      {order.clusterName} · {order.enterpriseName}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">الكمية ونمط التعاقد:</span>
                    <strong className="text-slate-800">
                      {order.quantity} {order.unit} ({order.contractMode})
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">الشريحة وسعر الوحدة:</span>
                    <strong className="text-emerald-700">
                      {order.appliedTierLabel} (${order.unitPriceUsd})
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">الإجمالي التقديري:</span>
                    <strong className="text-[#0F253E] text-sm font-black">
                      ${order.totalPriceUsd.toLocaleString()} (
                      {(order.totalPriceUsd * order.exchangeRateAtSubmit).toFixed(2)} ₪)
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Printable Official Proforma Quotation Modal */}
      {proformaOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full overflow-hidden my-8 shadow-2xl">
            <div className="bg-[#0F253E] text-white px-6 py-4 flex items-center justify-between border-b border-[#C8A24B]/50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#C8A24B]" />
                <h3 className="text-base font-black">
                  عرض سعر مبدئي رسمي — {proformaOrder.refNumber}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-lg bg-[#C8A24B] text-[#0F253E] text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProformaOrder(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-5 text-xs sm:text-sm">
              <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-[#9A7422]">
                    مشروع الدعم العاجل لتعافي المنشآت الصناعية في غزة من خلال الوحدات الإنتاجية العنقودية
                  </div>
                  <h4 className="text-lg font-black text-[#0F253E] mt-1">
                    وثيقة عرض سعر مبدئي وطلب تعاقد (Proforma RFQ)
                  </h4>
                </div>
                <div className="text-right sm:text-left tabular-nums">
                  <div className="font-black text-[#0F253E] text-xs" dir="ltr">
                    {proformaOrder.refNumber}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5" dir="ltr">
                    {proformaOrder.createdAt}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div className="space-y-1">
                  <div className="text-slate-500">المؤسسة المشترية:</div>
                  <div className="font-bold text-[#0F253E] text-sm">{proformaOrder.buyerOrg}</div>
                  <div>المسؤول: {proformaOrder.contactPerson}</div>
                  <div dir="ltr" className="text-right">{proformaOrder.contactInfo}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-slate-500">الجهة المنتجة:</div>
                  <div className="font-bold text-[#0F253E] text-sm">{proformaOrder.enterpriseName}</div>
                  <div>التجمع: {proformaOrder.clusterName} ({proformaOrder.clusterId})</div>
                  <div>القطاع: {proformaOrder.attributedSector}</div>
                </div>
              </div>

              <table className="w-full text-right text-xs border border-slate-200 rounded-xl overflow-hidden tabular-nums">
                <thead className="bg-slate-100 text-[#0F253E]">
                  <tr>
                    <th className="p-3">المنتج</th>
                    <th className="p-3">نمط التعاقد</th>
                    <th className="p-3">الكمية</th>
                    <th className="p-3">سعر الوحدة</th>
                    <th className="p-3">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-3 font-bold text-[#0F253E]">
                      {proformaOrder.productTitle} ({proformaOrder.productId})
                    </td>
                    <td className="p-3">{proformaOrder.contractMode}</td>
                    <td className="p-3">
                      {proformaOrder.quantity} {proformaOrder.unit}
                    </td>
                    <td className="p-3">${proformaOrder.unitPriceUsd}</td>
                    <td className="p-3 font-black text-[#0F253E]">
                      ${proformaOrder.totalPriceUsd.toLocaleString()} (
                      {(proformaOrder.totalPriceUsd * proformaOrder.exchangeRateAtSubmit).toFixed(2)} ₪)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
