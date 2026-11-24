import React, { useState, useEffect } from 'react';
import { Coins, Home, ShieldCheck } from 'lucide-react';
import type { BuyerAccount, PlatformSettings } from '../types.ts';

interface PublicHeaderProps {
  settings: PlatformSettings;
  activeRoute: string;
  onNavigate: (route: string) => void;
  currency: 'USD' | 'ILS';
  onToggleCurrency: (currency: 'USD' | 'ILS') => void;
  stats: {
    publishedProductsCount: number;
    publishedClustersCount: number;
    activeSectorsCount: number;
  };
  onOpenRfqLookup: () => void;
  buyer: BuyerAccount | null;
  buyerOrdersCount: number;
  onOpenBuyerAuth: () => void;
  onBuyerLogout: () => void;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({
  settings,
  activeRoute,
  onNavigate,
  currency,
  onToggleCurrency,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const rightPartners = (settings.partners || []).filter((p) => p.position === 'right');
  const leftPartners = (settings.partners || []).filter((p) => p.position === 'left');
  const isHomeActive = activeRoute === '/';

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm'
          : 'bg-white'
      }`}
    >
      {/* 1. الشريط العلوي للشعارات الرسمية واسم المشروع (بدون نصوص تحت الشعارات وبتصميم هادئ غير مزدحم) */}
      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 items-center gap-4 border-b border-slate-100 transition-all duration-200 ${
          isScrolled ? 'py-2' : 'py-3.5'
        }`}
      >
        {/* اليمين: شعارات الشركاء الرسمية بدون نصوص أسفلها */}
        <div className="lg:col-span-4 flex items-center justify-center lg:justify-start">
          <div className="inline-flex items-center gap-4 sm:gap-5 px-3 py-1.5">
            {rightPartners.map((partner, idx) => (
              <React.Fragment key={partner.id}>
                <div
                  className="flex items-center justify-center"
                  title={partner.name}
                >
                  <img
                    src={partner.logoUrl}
                    alt={partner.name}
                    referrerPolicy="no-referrer"
                    className={`${
                      isScrolled ? 'h-7 sm:h-8' : 'h-8 sm:h-9'
                    } w-auto max-w-[90px] sm:max-w-[105px] object-contain shrink-0 transition-transform duration-200 hover:scale-105`}
                  />
                </div>
                {idx < rightPartners.length - 1 && (
                  <span className="h-5 w-px bg-slate-200 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* المنتصف: اسم المشروع الرسمي */}
        <div className="lg:col-span-5 text-center px-2">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="text-center group focus:outline-none cursor-pointer"
          >
            <h1 className="text-xs sm:text-sm md:text-[15px] font-black text-[#0F253E] group-hover:text-[#1C4587] leading-snug transition-colors">
              {settings.officialProjectName}
            </h1>
          </button>
        </div>

        {/* اليسار: شعار الاستشاري المطور HCC بدون نص أسفله */}
        <div className="lg:col-span-3 flex items-center justify-center lg:justify-end">
          {leftPartners.map((partner) => {
            const unifiedHccName =
              'شركة محمد حسن حلاوة وشركائه للاستشارات والتحول المؤسسي - HCC';
            return (
              <div
                key={partner.id}
                title={unifiedHccName}
                className="inline-flex items-center justify-center px-3 py-1"
              >
                <img
                  src={partner.logoUrl}
                  alt={unifiedHccName}
                  referrerPolicy="no-referrer"
                  className={`${
                    isScrolled ? 'h-8 sm:h-9' : 'h-9 sm:h-10'
                  } w-auto max-w-[155px] object-contain transition-transform duration-200 hover:scale-105`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. شريط التنقل الرسمي المختصر (الرئيسية | العملة | لوحة التحكم) — زجاجي متكيّف عند التمرير */}
      <div
        className={`text-white border-b transition-all duration-300 ${
          isScrolled
            ? 'bg-[#0F253E]/95 backdrop-blur-md border-[#C8A24B]/70 shadow-md'
            : 'bg-[#0F253E] border-[#C8A24B]/60'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-4">
          {/* اليمين: الرئيسية */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                isHomeActive
                  ? 'bg-[#C8A24B] text-[#0F253E] font-extrabold shadow-2xs'
                  : 'text-slate-100 hover:bg-white/10'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>الرئيسية</span>
            </button>
          </div>

          {/* اليسار: العملة + لوحة التحكم */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Currency Switcher */}
            <div
              className="flex items-center gap-2"
              title={`سعر الصرف المعتمد: 1 دولار = ${settings.exchangeRate} شيكل`}
            >
              <span className="text-xs text-slate-300 font-medium hidden sm:inline-flex items-center gap-1 whitespace-nowrap">
                <Coins className="w-3.5 h-3.5 text-[#C8A24B]" />
                <span>العملة:</span>
              </span>
              <div className="inline-flex rounded-lg bg-white/10 p-0.5 border border-white/15 text-xs font-bold tabular-nums">
                <button
                  type="button"
                  onClick={() => onToggleCurrency('USD')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    currency === 'USD'
                      ? 'bg-[#C8A24B] text-[#0F253E] font-extrabold'
                      : 'text-slate-200 hover:text-white'
                  }`}
                >
                  دولار ($)
                </button>
                <button
                  type="button"
                  onClick={() => onToggleCurrency('ILS')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    currency === 'ILS'
                      ? 'bg-[#C8A24B] text-[#0F253E] font-extrabold'
                      : 'text-slate-200 hover:text-white'
                  }`}
                >
                  شيكل (₪ {settings.exchangeRate})
                </button>
              </div>
            </div>

            <span className="h-4 w-px bg-white/15 hidden sm:inline-block" />

            {/* لوحة التحكم */}
            <button
              type="button"
              onClick={() => onNavigate('/admin')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeRoute.startsWith('/admin')
                  ? 'bg-white text-[#0F253E] border-white font-extrabold'
                  : 'bg-white/5 text-white border-white/20 hover:bg-[#C8A24B] hover:text-[#0F253E] hover:border-[#C8A24B]'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-[#C8A24B]" />
              <span>لوحة التحكم</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

interface PublicFooterProps {
  settings: PlatformSettings;
  onNavigate: (route: string) => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({ settings, onNavigate }) => {
  const allPartners = (settings.partners || []).filter((p) => p.position !== 'footer');
  const hccUnifiedName =
    'شركة محمد حسن حلاوة وشركائه للاستشارات والتحول المؤسسي - HCC';

  return (
    <footer className="bg-[#0F253E] text-white border-t border-[#C8A24B]/50 mt-20">
      {/* Partners Logos Strip — Only Logos Without Text */}
      <div className="bg-white py-9 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 items-center">
            {allPartners.map((partner) => {
              const displayName =
                partner.id === 'partner-hcc' ? hccUnifiedName : partner.name;

              return (
                <div
                  key={partner.id}
                  title={displayName}
                  className="group flex items-center justify-center h-24 px-5 rounded-2xl bg-slate-50/60 border border-slate-200/70 hover:bg-white hover:border-[#C8A24B]/70 hover:shadow-sm transition-all duration-300"
                >
                  <img
                    src={partner.logoUrl}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                    className="max-h-14 max-w-[150px] w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
          <div className="md:col-span-5 space-y-3">
            <h4 className="text-sm sm:text-base font-black text-[#E5C168]">
              منصة منتجات الوحدات الإنتاجية العنقودية — قطاع غزة
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {settings.introText}
            </p>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h4 className="text-sm sm:text-base font-black text-[#E5C168]">التنقل السريع</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/')}
                  className="text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  الصفحة الرئيسية
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/products')}
                  className="text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  معرض المنتجات والأسعار التعاقدية
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/clusters')}
                  className="text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  دليل التجمعات الإنتاجية العنقودية
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/my-orders')}
                  className="text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  متابعة طلبات عروض الأسعار (طلباتي)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/admin')}
                  className="text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  لوحة التحكم والإدارة
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h4 className="text-sm sm:text-base font-black text-[#E5C168]">آلية التسعير والتعاقد</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              جميع الأسعار المعروضة قابلة للتعاقد وفق نظام الشرائح الكمية (توريد شامل للمواد الخام أو تشغيل ومصنعية فقط). يتم احتساب المعادل بالشيكل وفق سعر الصرف المرجعي ({settings.exchangeRate} ₪ / $).
            </p>
            <div className="pt-2 border-t border-white/10 text-xs">
              <span className="text-slate-400">الاستشاري المطور: </span>
              <strong className="text-white">{hccUnifiedName}</strong>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col lg:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p className="text-center lg:text-right">
            © {new Date().getFullYear()} {settings.officialProjectName} — جميع الحقوق محفوظة.
          </p>
          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-x-3 gap-y-1 text-[11px]">
            <span>تمويل: وزارة الخارجية النرويجية</span>
            <span className="text-white/20">·</span>
            <span>إشراف: وزارة الاقتصاد الوطني</span>
            <span className="text-white/20">·</span>
            <span>تنفيذ: الاتحاد العام للصناعات الفلسطينية (PFI)</span>
            <span className="text-white/20">·</span>
            <span>بالشراكة مع: برنامج الأمم المتحدة الإنمائي (UNDP)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
