import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Copy,
  FileSearch,
  FileSignature,
  AlertCircle,
  X,
  Calculator,
  Building2,
  Factory,
  UserPlus,
  LogIn,
  ClipboardList,
  Printer,
} from 'lucide-react';
import type { BuyerAccount, ContractMode, Product, RfqOrder } from '../types.ts';
import { formatMoney } from './ProductCard.tsx';

// ============================================================================
// 1. FREE BUYER ACCOUNT AUTH MODAL (Login / Register)
// ============================================================================

interface BuyerAuthModalProps {
  pendingProduct?: Product | null;
  onClose: () => void;
  onSuccessAuth: (buyer: BuyerAccount, token: string) => void;
}

export const BuyerAuthModal: React.FC<BuyerAuthModalProps> = ({
  pendingProduct,
  onClose,
  onSuccessAuth,
}) => {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [organizationName, setOrganizationName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErrorMsg(null);
    setLoading(true);

    try {
      const endpoint = mode === 'register' ? '/api/buyer/register' : '/api/buyer/login';
      const payload =
        mode === 'register'
          ? {
              name: contactPerson,
              organization: organizationName,
              phone,
              email,
              password,
            }
          : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'تعذّر إتمام العملية، يرجى التحقق من البيانات.');
      }

      onSuccessAuth(data.buyer, data.token);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'حدث خطأ أثناء الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border-2 border-[#C8A24B] shadow-2xl max-w-lg w-full overflow-hidden my-8 animate-modal-pop">
        {/* Header */}
        <div className="hero-industrial-pattern text-white px-6 py-4 flex items-center justify-between border-b-2 border-[#C8A24B]">
          <div className="flex items-center gap-2.5">
            {mode === 'register' ? (
              <UserPlus className="w-5 h-5 text-[#C8A24B]" />
            ) : (
              <LogIn className="w-5 h-5 text-[#C8A24B]" />
            )}
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                {mode === 'register'
                  ? 'إنشاء حساب مشتري / مؤسسة مجاني'
                  : 'تسجيل دخول المشتري / المؤسسة'}
              </h2>
              <p className="text-xs text-[#E5C168]">
                {pendingProduct
                  ? `لإرسال طلب عرض سعر للمنتج: ${pendingProduct.title}`
                  : 'يتيح لك الحساب إرسال طلبات عروض الأسعار (RFQ) ومتابعتها بسهولة'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switch Tabs */}
        <div className="grid grid-cols-2 bg-slate-100 p-1.5 m-5 mb-0 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-[#0F253E] text-[#E5C168] shadow-xs'
                : 'text-slate-700 hover:text-[#0F253E]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>تسجيل حساب مشتري جديد (مجاني)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-[#0F253E] text-[#E5C168] shadow-xs'
                : 'text-slate-700 hover:text-[#0F253E]'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>لدي حساب مسجل مسبقاً</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {pendingProduct && (
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 font-bold">
              التصفح متاح للجميع، ويتطلب إرسال طلب التعاقد (RFQ) تسجيل الدخول بحساب مشتري لتعبئة بيانات مؤسستكم تلقائياً وحفظ الطلب في صفحة «طلباتي».
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-extrabold text-[#0F253E] mb-1">
                  اسم الجهة / المؤسسة / الشركة المشترية <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="مثال: مؤسسة إغاثة دولية / شركة مقاولات / تاجر جملة..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-[#0F253E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-[#0F253E] mb-1">
                    اسم الشخص المسؤول <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="الاسم الكامل للمسؤول عن المشتريات"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-[#0F253E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#0F253E] mb-1">
                    رقم الهاتف / الجوال للتواصل <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="059xxxxxxx"
                    dir="ltr"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-right focus:outline-none focus:border-[#0F253E]"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-extrabold text-[#0F253E] mb-1">
              البريد الإلكتروني <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="buyer@organization.org"
              dir="ltr"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-right focus:outline-none focus:border-[#0F253E]"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#0F253E] mb-1">
              كلمة المرور {mode === 'register' && '(4 أحرف أو أرقام على الأقل)'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength={4}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              dir="ltr"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-right focus:outline-none focus:border-[#0F253E]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-extrabold hover:bg-slate-100 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0F253E] hover:bg-[#1C4587] text-[#E5C168] text-xs sm:text-sm font-black shadow-md disabled:opacity-60 cursor-pointer"
            >
              {mode === 'register' ? (
                <UserPlus className="w-4 h-4" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              <span>
                {loading
                  ? 'جاري المعالجة...'
                  : mode === 'register'
                  ? 'إنشاء الحساب والمتابعة'
                  : 'تسجيل الدخول والمتابعة'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// 2. RFQ CONTRACTING MODAL (Pre-filled from Buyer Account)
// ============================================================================

interface RfqModalProps {
  product: Product | null;
  initialQuantity: number;
  currency: 'USD' | 'ILS';
  exchangeRate: number;
  buyer: BuyerAccount | null;
  buyerToken: string;
  onClose: () => void;
  onSuccessOrder?: (order: RfqOrder) => void;
  onNavigateToMyOrders?: () => void;
}

export const RfqModal: React.FC<RfqModalProps> = ({
  product,
  initialQuantity,
  currency,
  exchangeRate,
  buyer,
  buyerToken,
  onClose,
  onSuccessOrder,
  onNavigateToMyOrders,
}) => {
  const [buyerOrg, setBuyerOrg] = useState(buyer?.organization || '');
  const [contactPerson, setContactPerson] = useState(buyer?.name || '');
  const [contactInfo, setContactInfo] = useState(
    buyer ? `${buyer.phone} | ${buyer.email}` : ''
  );
  const [quantity, setQuantity] = useState<number>(initialQuantity || 1);
  const [contractMode, setContractMode] = useState<ContractMode>('توريد شامل');
  const [notes, setNotes] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState<string>(
    () => `rfq-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedOrder, setSubmittedOrder] = useState<RfqOrder | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setQuantity(Math.max(1, initialQuantity || 1));
  }, [initialQuantity, product?.id]);

  // Auto-fill buyer account details when buyer prop updates
  useEffect(() => {
    if (buyer) {
      setBuyerOrg(buyer.organization);
      setContactPerson(buyer.name);
      setContactInfo(buyer.phone ? `${buyer.phone} | ${buyer.email}` : buyer.email);
    }
  }, [buyer]);

  const handleQuantityChange = (val: number) => {
    const safe = Math.max(1, Math.floor(Number(val) || 1));
    setQuantity(safe);
    setIdempotencyKey(`rfq-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  };

  const liveCalculation = useMemo(() => {
    if (!product) return null;
    const safeQty = Math.max(1, Math.floor(Number(quantity) || 1));
    const sortedTiers = [...(product.tiers || [])].sort((a, b) => a.minQty - b.minQty);

    if (sortedTiers.length === 0) {
      const unitUsd = Number(product.priceUsd) || 0;
      return {
        label: 'سعر أساسي',
        minQty: 1,
        unitUsd,
        discountTag: 'سعر أساسي',
        totalUsd: Number((unitUsd * safeQty).toFixed(2)),
      };
    }

    let matched = sortedTiers[0];
    for (const tier of sortedTiers) {
      if (safeQty >= tier.minQty) {
        matched = tier;
      }
    }

    const unitUsd = Number(matched.priceUsd);
    return {
      label: matched.label,
      minQty: matched.minQty,
      unitUsd,
      discountTag: matched.discountTag,
      totalUsd: Number((unitUsd * safeQty).toFixed(2)),
    };
  }, [product, quantity]);

  if (!product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/public/rfq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(buyerToken ? { Authorization: `Bearer ${buyerToken}` } : {}),
        },
        body: JSON.stringify({
          idempotencyKey,
          productId: product.id,
          buyerOrg,
          contactPerson,
          contactInfo,
          quantity,
          contractMode,
          currency,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || 'تعذّر إرسال الطلب، يرجى التحقق من البيانات والمحاولة مجددًا.'
        );
      }

      setSubmittedOrder(data.order);
      if (onSuccessOrder) onSuccessOrder(data.order);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'تعذّر الاتصال بالخادم. تم الاحتفاظ ببيانات النموذج للمحاولة مجددًا.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyRef = () => {
    if (!submittedOrder) return;
    navigator.clipboard.writeText(submittedOrder.refNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const sortedTiers = [...(product.tiers || [])].sort((a, b) => a.minQty - b.minQty);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border-2 border-[#C8A24B] shadow-2xl max-w-2xl w-full overflow-hidden my-8 animate-modal-pop">
        {/* Modal Header */}
        <div className="hero-industrial-pattern text-white px-6 py-4 flex items-center justify-between border-b-2 border-[#C8A24B]">
          <div className="flex items-center gap-2.5">
            <FileSignature className="w-5 h-5 text-[#C8A24B]" />
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                نموذج طلب عرض سعر وتعاقد (RFQ)
              </h2>
              <p className="text-xs text-[#E5C168]">
                {product.title} ({product.id})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Confirmation View */}
        {submittedOrder ? (
          <div className="p-6 sm:p-8 text-center space-y-5 animate-fade-in-up">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold mb-2">
                تم تسجيل الطلب بنجاح وحفظه بحالة «{submittedOrder.status}»
              </span>
              <h3 className="text-xl font-black text-[#0F253E]">
                تم استلام طلب عرض السعر والتعاقد وربطه بحسابكم
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                سيقوم فريق وحدة التجمعات الإنتاجية العنقودية (HCC) والمنشأة المنتجة بالتواصل معكم لإتمام إجراءات التعاقد والفحص، ويمكنكم متابعة التحديثات من صفحة «طلباتي».
              </p>
            </div>

            {/* Reference Number Box */}
            <div className="bg-slate-50 border-2 border-dashed border-[#C8A24B] rounded-xl p-4 max-w-md mx-auto">
              <p className="text-xs font-bold text-slate-500 mb-1">الرقم المرجعي لمتابعة الطلب:</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-xl sm:text-2xl font-mono font-black text-[#0F253E] tracking-wider" dir="ltr">
                  {submittedOrder.refNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0F253E] text-[#E5C168] hover:bg-[#1C4587] text-xs font-bold cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
                </button>
              </div>
            </div>

            {/* Order Summary Grid */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-right grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs tabular-nums">
              <div>
                <span className="text-slate-500">الجهة الطالبة:</span>{' '}
                <strong className="text-slate-900">{submittedOrder.buyerOrg}</strong>
              </div>
              <div>
                <span className="text-slate-500">المسؤول:</span>{' '}
                <strong className="text-slate-900">{submittedOrder.contactPerson}</strong>
              </div>
              <div>
                <span className="text-slate-500">المنتج:</span>{' '}
                <strong className="text-slate-900">{submittedOrder.productTitle}</strong>
              </div>
              <div>
                <span className="text-slate-500">التجمع والمنشأة:</span>{' '}
                <strong className="text-slate-900">
                  {submittedOrder.clusterName} - {submittedOrder.enterpriseName}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">الكمية ونمط التعاقد:</span>{' '}
                <strong className="text-slate-900">
                  {submittedOrder.quantity} {submittedOrder.unit} ({submittedOrder.contractMode})
                </strong>
              </div>
              <div>
                <span className="text-slate-500">الشريحة المطبقة:</span>{' '}
                <strong className="text-emerald-700">{submittedOrder.appliedTierLabel}</strong>
              </div>
              <div>
                <span className="text-slate-500">سعر الوحدة المعتمد:</span>{' '}
                <strong className="text-slate-900">
                  ${submittedOrder.unitPriceUsd} (
                  {(submittedOrder.unitPriceUsd * submittedOrder.exchangeRateAtSubmit).toFixed(2)} ₪)
                </strong>
              </div>
              <div>
                <span className="text-slate-500">الإجمالي التقديري:</span>{' '}
                <strong className="text-[#0F253E] text-sm font-black">
                  ${submittedOrder.totalPriceUsd} (
                  {(submittedOrder.totalPriceUsd * submittedOrder.exchangeRateAtSubmit).toFixed(2)} ₪)
                </strong>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F253E] font-extrabold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة إشعار الطلب (PDF)</span>
              </button>
              {onNavigateToMyOrders && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToMyOrders();
                  }}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#C8A24B] text-[#0F253E] font-black text-xs sm:text-sm hover:bg-[#E5C168] transition-colors cursor-pointer"
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>الانتقال إلى صفحة «طلباتي»</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-[#0F253E] text-[#E5C168] font-extrabold text-xs sm:text-sm hover:bg-[#1C4587] transition-colors cursor-pointer"
              >
                إغلاق والعودة للمنصة
              </button>
            </div>
          </div>
        ) : (
          /* RFQ Form View */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {/* Product & Enterprise Summary Banner */}
            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <img
                src={product.image}
                alt={product.title}
                className="w-16 h-16 rounded-lg object-cover border border-slate-200 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#0F253E] text-[#E5C168]" dir="ltr">
                    {product.id}
                  </span>
                  <span className="text-[11px] font-bold text-[#1C4587]">{product.sector}</span>
                </div>
                <h4 className="text-sm font-black text-[#0F253E] mt-0.5">{product.title}</h4>
                <div className="flex items-center gap-3 text-[11px] text-slate-600 mt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Factory className="w-3 h-3 text-[#1C4587]" />
                    {product.enterpriseName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-[#9A7422]" />
                    {product.clusterName}
                  </span>
                </div>
              </div>
            </div>

            {buyer && (
              <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between flex-wrap gap-2">
                <span>
                  تمت تعبئة بيانات حساب المشتري تلقائياً ({buyer.organization})
                </span>
                <span className="text-[11px] text-emerald-700 font-extrabold">
                  سيُحفظ الطلب في صفحة «طلباتي»
                </span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p>{errorMsg}</p>
                  <p className="text-[11px] text-red-600 mt-0.5">
                    تم الاحتفاظ بجميع الحقول المدخلة؛ يمكنك تعديل البيانات وإعادة المحاولة مباشرة.
                  </p>
                </div>
              </div>
            )}

            {/* Organization & Contact Person */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-[#0F253E] mb-1.5">
                  اسم الجهة / المؤسسة الطالبة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={buyerOrg}
                  onChange={(e) => setBuyerOrg(e.target.value)}
                  placeholder="مثال: مؤسسة إغاثة دولية / شركة مقاولات..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-[#0F253E]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#0F253E] mb-1.5">
                  اسم الشخص المسؤول <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="الاسم الكامل للمسؤول عن المشتريات"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-[#0F253E]"
                />
              </div>
            </div>

            {/* Phone/Email & Contract Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-[#0F253E] mb-1.5">
                  رقم الهاتف أو البريد الإلكتروني <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="059xxxxxxx أو name@org.org"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-[#0F253E]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#0F253E] mb-1.5">
                  نمط التعاقد المطلوب <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['توريد شامل', 'مصنعية فقط'] as ContractMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setContractMode(mode)}
                      className={`py-2.5 px-3 rounded-lg border text-xs font-extrabold transition-all cursor-pointer ${
                        contractMode === mode
                          ? 'bg-[#0F253E] text-[#E5C168] border-[#0F253E]'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quantity & Live Tier Calculator Box */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3 tabular-nums">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-extrabold text-[#0F253E] mb-1">
                    الكمية المطلوبة ({product.unit}) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      required
                      value={quantity}
                      onChange={(e) => handleQuantityChange(Number(e.target.value))}
                      className="w-36 px-3.5 py-2 rounded-lg border-2 border-[#0F253E] bg-white text-sm font-black text-[#0F253E] focus:outline-none"
                    />
                    <span className="text-xs font-bold text-slate-600">{product.unit}</span>
                  </div>
                </div>

                {/* Quick Tier Preset Buttons */}
                {sortedTiers.length > 0 && (
                  <div className="flex flex-col items-start sm:items-end">
                    <span className="text-[11px] font-bold text-slate-500 mb-1">
                      اختيار سريع حسب الشرائح السعرية:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {sortedTiers.map((t, i) => {
                        const isCurrentTier = liveCalculation?.minQty === t.minQty;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleQuantityChange(t.minQty)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold border transition-all cursor-pointer ${
                              isCurrentTier
                                ? 'bg-[#0F253E] text-[#E5C168] border-[#0F253E]'
                                : 'bg-white text-slate-700 border-slate-300 hover:border-[#C8A24B]'
                            }`}
                          >
                            شريحة {t.label} ({formatMoney(t.priceUsd, currency, exchangeRate)})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Live Price & Tier Calculation Output */}
              {liveCalculation && (
                <div className="bg-white rounded-lg p-3 border border-amber-200 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-[#9A7422] shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold text-slate-500">الشريحة المطبقة تلقائيًا</div>
                      <div className="text-xs font-black text-emerald-700">
                        {liveCalculation.label} ({liveCalculation.discountTag})
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-slate-500">سعر الوحدة التقديري</div>
                    <div className="text-xs font-black text-[#0F253E]">
                      ${liveCalculation.unitUsd.toFixed(2)} / {(liveCalculation.unitUsd * exchangeRate).toFixed(2)} ₪
                    </div>
                  </div>

                  <div className="sm:text-left bg-[#0F253E] text-white px-3 py-2 rounded-lg">
                    <div className="text-[10px] text-amber-200">الإجمالي التقديري للطلب</div>
                    <div className="text-sm font-black text-[#E5C168]">
                      {currency === 'ILS'
                        ? `${(liveCalculation.totalUsd * exchangeRate).toFixed(2)} ₪ ($${liveCalculation.totalUsd.toFixed(2)})`
                        : `$${liveCalculation.totalUsd.toFixed(2)} (${(liveCalculation.totalUsd * exchangeRate).toFixed(2)} ₪)`}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-extrabold text-[#0F253E] mb-1.5">
                ملاحظات إضافية أو مواصفات فنية مطلوبة (اختياري)
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="اذكر أي متطلبات خاصة بالتغليف، جدول التوريد، أو طلب عينة للفحص المخبري..."
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-[#0F253E]"
              />
            </div>

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-extrabold hover:bg-slate-100 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0F253E] hover:bg-[#1C4587] text-[#E5C168] text-xs sm:text-sm font-black shadow-md disabled:opacity-60 cursor-pointer"
              >
                <FileSignature className="w-4 h-4" />
                <span>{submitting ? 'جاري حفظ الطلب...' : 'إرسال طلب عرض السعر والتعاقد'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 3. RFQ REFERENCE LOOKUP MODAL
// ============================================================================

interface RfqLookupModalProps {
  onClose: () => void;
}

export const RfqLookupModal: React.FC<RfqLookupModalProps> = ({ onClose }) => {
  const [refInput, setRefInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<RfqOrder | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refInput.trim()) return;
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const res = await fetch(`/api/public/rfq/${encodeURIComponent(refInput.trim().toUpperCase())}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'لم يتم العثور على الطلب.');
      }
      setOrder(data.order);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'تعذّر البحث عن الطلب.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border-2 border-[#C8A24B] shadow-2xl max-w-lg w-full overflow-hidden animate-modal-pop">
        <div className="hero-industrial-pattern text-white px-6 py-4 flex items-center justify-between border-b-2 border-[#C8A24B]">
          <div className="flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-[#C8A24B]" />
            <h3 className="text-base font-black">الاستعلام عن حالة طلب عرض سعر (RFQ)</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              required
              value={refInput}
              onChange={(e) => setRefInput(e.target.value)}
              placeholder="أدخل الرقم المرجعي (مثال: RFQ-GZ-1001-45)"
              className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm font-bold focus:outline-none focus:border-[#0F253E]"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg bg-[#0F253E] text-[#E5C168] text-xs font-extrabold hover:bg-[#1C4587] cursor-pointer"
            >
              {loading ? 'بحث...' : 'استعلام'}
            </button>
          </form>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
              {error}
            </div>
          )}

          {order && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5 text-xs animate-fade-in-up tabular-nums">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-black text-sm text-[#0F253E]" dir="ltr">
                  {order.refNumber}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold">
                  الحالة: {order.status}
                </span>
              </div>
              <div>
                <span className="text-slate-500">الجهة الطالبة:</span>{' '}
                <strong className="text-slate-900">{order.buyerOrg}</strong>
              </div>
              <div>
                <span className="text-slate-500">المنتج:</span>{' '}
                <strong className="text-slate-900">{order.productTitle}</strong>
              </div>
              <div>
                <span className="text-slate-500">التجمع والمنشأة:</span>{' '}
                <strong className="text-slate-900">
                  {order.clusterName} ({order.enterpriseName})
                </strong>
              </div>
              <div>
                <span className="text-slate-500">الكمية ونمط التعاقد:</span>{' '}
                <strong className="text-slate-900">
                  {order.quantity} {order.unit} — {order.contractMode}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">الإجمالي التقديري المسجل:</span>{' '}
                <strong className="text-[#0F253E]">
                  ${order.totalPriceUsd} (
                  {(order.totalPriceUsd * order.exchangeRateAtSubmit).toFixed(2)} ₪)
                </strong>
              </div>
              {order.logs && order.logs.length > 0 && (
                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <div className="font-extrabold text-[#0F253E]">سجل المتابعة:</div>
                  {order.logs.map((l) => (
                    <div
                      key={l.id}
                      className="p-2 rounded bg-white border border-slate-200 flex items-center justify-between text-[11px]"
                    >
                      <span>
                        <strong>{l.action}</strong>
                        {l.note ? ` — ${l.note}` : ''}
                      </span>
                      <span className="text-slate-400" dir="ltr">
                        {l.createdAt}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
