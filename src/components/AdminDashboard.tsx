import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
  Database,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  Factory,
  FileText,
  Home,
  Image as ImageIcon,
  Images,
  KeyRound,
  Layers,
  LogOut,
  Package,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Shield,
  Sparkles,
  Star,
  Trash2,
  Upload,
  UserCheck,
  Users,
  Video,
  X,
} from 'lucide-react';
import type {
  Cluster,
  ClusterMember,
  ContentStatus,
  Enterprise,
  PlatformSettings,
  Product,
  ProductDocument,
  ProductTier,
  RfqOrder,
  RfqStatus,
  Sector,
  UserAccount,
} from '../types.ts';
import { AdminAnalyticsView } from './AdminAnalyticsView.tsx';

interface AdminDashboardProps {
  onBackToPublic: () => void;
  onDataMutated: () => void;
}

type AdminTab =
  | 'analytics'
  | 'rfqs'
  | 'products'
  | 'clusters'
  | 'sectors_enterprises'
  | 'homepage_settings'
  | 'users';

const STATUS_BADGE_MAP: Record<ContentStatus, { label: string; cls: string }> = {
  published: { label: 'منشور', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  draft: { label: 'مسودة', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  archived: { label: 'مؤرشف', cls: 'bg-slate-200 text-slate-700 border-slate-300' },
};

const RFQ_STATUS_OPTIONS: RfqStatus[] = [
  'جديد',
  'قيد المراجعة',
  'تم التواصل',
  'مغلق',
  'ملغى',
];

function getStoredToken(): string {
  try {
    return localStorage.getItem('gaza_hcc_admin_token') || '';
  } catch {
    return '';
  }
}

function setStoredToken(val: string): void {
  try {
    localStorage.setItem('gaza_hcc_admin_token', val);
  } catch {
    // Ignore storage errors in restricted cross-origin iframes
  }
}

function removeStoredToken(): void {
  try {
    localStorage.removeItem('gaza_hcc_admin_token');
  } catch {
    // Ignore storage errors in restricted cross-origin iframes
  }
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBackToPublic,
  onDataMutated,
}) => {
  const [token, setToken] = useState<string>(() => getStoredToken());
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard Active Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');

  // Admin Data State
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [rfqs, setRfqs] = useState<RfqOrder[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters & Modals State
  const [rfqSearch, setRfqSearch] = useState('');
  const [rfqStatusFilter, setRfqStatusFilter] = useState('ALL');
  const [rfqSectorFilter, setRfqSectorFilter] = useState('ALL');
  const [selectedRfq, setSelectedRfq] = useState<RfqOrder | null>(null);
  const [rfqNewStatus, setRfqNewStatus] = useState<RfqStatus>('جديد');
  const [rfqInternalNotes, setRfqInternalNotes] = useState('');
  const [rfqLogNote, setRfqLogNote] = useState('');

  // Product Editor Modal State
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('ALL');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newGalleryImageUrl, setNewGalleryImageUrl] = useState('');
  const [newVideoInputUrl, setNewVideoInputUrl] = useState('');
  const [newDocNameInput, setNewDocNameInput] = useState('');
  const [newDocUrlInput, setNewDocUrlInput] = useState('');

  // Cluster Editor Modal State
  const [editingCluster, setEditingCluster] = useState<Partial<Cluster> | null>(null);
  const [isNewCluster, setIsNewCluster] = useState(false);

  // Sector & Enterprise Editor State
  const [editingSector, setEditingSector] = useState<Partial<Sector> | null>(null);
  const [editingEnterprise, setEditingEnterprise] = useState<Partial<Enterprise> | null>(null);

  // User Management Modal State
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'editor' as 'admin' | 'editor',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadAdminOverview = useCallback(
    async (authToken: string) => {
      try {
        const res = await fetch('/api/admin/overview', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setSettings(data.settings);
        setSectors(data.sectors || []);
        setClusters(data.clusters || []);
        setEnterprises(data.enterprises || []);
        setProducts(data.products || []);
        setRfqs(data.rfqs || []);
      } catch (err) {
        console.error('Error loading overview:', err);
      }
    },
    []
  );

  const loadUsersList = useCallback(async (authToken: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  }, []);


  useEffect(() => {
    const verifySession = async () => {
      if (!token) {
        setAuthChecking(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          removeStoredToken();
          setToken('');
          setCurrentUser(null);
        } else {
          const data = await res.json();
          setCurrentUser(data.user);
          await loadAdminOverview(token);
          if (data.user.role === 'admin') {
            await loadUsersList(token);
          }
        }
      } catch {
        setCurrentUser(null);
      } finally {
        setAuthChecking(false);
      }
    };
    verifySession();
  }, [token, loadAdminOverview, loadUsersList]);

  const performDirectLogin = async (emailToUse: string, passwordToUse: string) => {
    setLoginEmail(emailToUse);
    setLoginPassword(passwordToUse);
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse, password: passwordToUse }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل تسجيل الدخول.');
      }
      setStoredToken(data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      if (data.user.role !== 'admin' && activeTab === 'users') {
        setActiveTab('analytics');
      }
      await loadAdminOverview(data.token);
      if (data.user.role === 'admin') {
        await loadUsersList(data.token);
      }
      showToast(
        `تم تسجيل الدخول بنجاح بحساب: ${
          data.user.role === 'admin' ? 'مدير النظام' : 'محرّر المحتوى'
        }`
      );
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'حدث خطأ أثناء تسجيل الدخول.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await performDirectLogin(loginEmail, loginPassword);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } finally {
      removeStoredToken();
      setToken('');
      setCurrentUser(null);
    }
  };

  // Promise-based Single & Multi-File Upload Helpers (Images, Videos, Documents)
  const uploadSingleFileToServer = async (
    file: File
  ): Promise<{ url: string; filename: string }> => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('تعذّر قراءة الملف من الجهاز.'));
      reader.readAsDataURL(file);
    });

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ dataUrl, filename: file.name }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'فشل رفع الملف إلى الخادم.');
    }
    return {
      url: String(data.url),
      filename: String(data.filename || file.name),
    };
  };

  const handleFileUpload = async (file: File, onUrlReady: (url: string) => void) => {
    setUploadingImage(true);
    try {
      const uploaded = await uploadSingleFileToServer(file);
      onUrlReady(uploaded.url);
      showToast(`تم رفع الملف «${file.name}» بنجاح.`);
    } catch (err) {
      console.error('Upload error:', err);
      showToast(err instanceof Error ? err.message : 'تعذّر رفع الملف.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleMultipleFilesUpload = async (
    files: File[],
    onUploaded: (results: { url: string; filename: string }[]) => void
  ) => {
    if (files.length === 0) return;
    setUploadingImage(true);
    try {
      const results: { url: string; filename: string }[] = [];
      for (const file of files) {
        const res = await uploadSingleFileToServer(file);
        results.push(res);
      }
      onUploaded(results);
      showToast(
        files.length === 1
          ? `تم رفع الملف «${files[0].name}» بنجاح.`
          : `تم رفع ${files.length} ملفات بنجاح وحفظها على الخادم.`
      );
    } catch (err) {
      console.error('Multi-upload error:', err);
      showToast(err instanceof Error ? err.message : 'تعذّر رفع بعض الملفات.');
    } finally {
      setUploadingImage(false);
    }
  };

  // RFQ Update Handler
  const handleSaveRfqUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRfq) return;
    try {
      const res = await fetch(`/api/admin/rfqs/${selectedRfq.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: rfqNewStatus,
          internalNotes: rfqInternalNotes,
          logNote: rfqLogNote,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedRfq(data.order);
        setRfqLogNote('');
        await loadAdminOverview(token);
        showToast(`تم تحديث حالة الطلب ${data.order.refNumber} وحفظ سجل المتابعة.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Product Save Handler
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const url = isNewProduct
        ? '/api/admin/products'
        : `/api/admin/products/${encodeURIComponent(editingProduct.id!)}`;
      const method = isNewProduct ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingProduct),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'تعذّر حفظ المنتج.');
        return;
      }
      setEditingProduct(null);
      await loadAdminOverview(token);
      onDataMutated();
      showToast(isNewProduct ? 'تمت إضافة المنتج الجديد بنجاح.' : 'تم حفظ تعديلات المنتج بنجاح.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickProductStatus = async (productId: string, status?: ContentStatus, isFeatured?: boolean) => {
    try {
      const res = await fetch(`/api/admin/products/${encodeURIComponent(productId)}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, isFeatured }),
      });
      if (res.ok) {
        await loadAdminOverview(token);
        onDataMutated();
        showToast('تم تحديث حالة العرض للمنتج.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Cluster Save Handler
  const handleSaveCluster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCluster) return;
    try {
      const url = isNewCluster
        ? '/api/admin/clusters'
        : `/api/admin/clusters/${encodeURIComponent(editingCluster.id!)}`;
      const method = isNewCluster ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingCluster),
      });
      if (res.ok) {
        setEditingCluster(null);
        await loadAdminOverview(token);
        onDataMutated();
        showToast(isNewCluster ? 'تم إنشاء التجمع بنجاح.' : 'تم تحديث بيانات التجمع والأعضاء بنجاح.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Settings Save Handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        await loadAdminOverview(token);
        onDataMutated();
        showToast('تم حفظ إعدادات الصفحة الرئيسية وسعر الصرف بنجاح.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Idempotent Reseed Handler
  const handleReseed = async () => {
    try {
      const res = await fetch('/api/admin/reseed', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        await loadAdminOverview(token);
        onDataMutated();
        showToast(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-[#0F253E] border-t-[#C8A24B] rounded-full animate-spin mx-auto" />
          <p className="text-xs font-extrabold text-[#0F253E]">جاري التحقق من جلسة الإدارة...</p>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // DEDICATED ADMIN LOGIN VIEW
  // ==========================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-bl from-[#0F253E] via-[#143152] to-[#1C4587] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border-2 border-[#C8A24B] shadow-2xl max-w-md w-full overflow-hidden">
          <div className="bg-[#0F253E] text-white p-5 text-center border-b-2 border-[#C8A24B]">
            <div className="w-11 h-11 rounded-xl bg-[#C8A24B] text-[#0F253E] flex items-center justify-center mx-auto mb-2.5 shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-base sm:text-lg font-black text-white">
              بوابة الإدارة الداخلية — الوحدات العنقودية (HCC)
            </h1>
            <p className="text-xs text-[#E5C168] mt-1">
              مشروع الدعم العاجل لتعافي المنشآت الصناعية في غزة
            </p>
          </div>

          <form onSubmit={handleLogin} className="p-5 sm:p-6 space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-extrabold text-[#0F253E] mb-1">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="name@pfi-gaza.ps"
                dir="ltr"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-xs sm:text-sm focus:outline-none focus:border-[#0F253E]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-extrabold text-[#0F253E]">
                  كلمة المرور
                </label>
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1C4587] hover:text-[#0F253E] cursor-pointer"
                >
                  {showLoginPassword ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>إخفاء كلمة المرور</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>إظهار كلمة المرور</span>
                    </>
                  )}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-xs sm:text-sm focus:outline-none focus:border-[#0F253E]"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  title={showLoginPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  aria-label={showLoginPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500 hover:text-[#0F253E] cursor-pointer"
                >
                  {showLoginPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-xl bg-[#0F253E] hover:bg-[#1C4587] text-[#E5C168] font-black text-sm shadow-md transition-colors cursor-pointer"
            >
              {loginLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول إلى لوحة التحكم'}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={onBackToPublic}
                className="text-xs font-extrabold text-[#1C4587] hover:underline cursor-pointer"
              >
                العودة إلى الموقع العام ←
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Filtered RFQs for RFQ Tab
  const filteredRfqs = rfqs.filter((r) => {
    if (rfqStatusFilter !== 'ALL' && r.status !== rfqStatusFilter) return false;
    if (
      rfqSectorFilter !== 'ALL' &&
      r.attributedSector !== rfqSectorFilter &&
      r.productSector !== rfqSectorFilter
    ) {
      return false;
    }
    if (rfqSearch.trim()) {
      const q = rfqSearch.trim().toLowerCase();
      return (
        r.refNumber.toLowerCase().includes(q) ||
        r.buyerOrg.toLowerCase().includes(q) ||
        r.contactPerson.toLowerCase().includes(q) ||
        r.productTitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered Products for Products Tab
  const filteredProducts = products.filter((p) => {
    if (productStatusFilter !== 'ALL' && p.status !== productStatusFilter) return false;
    if (productSearch.trim()) {
      const q = productSearch.trim().toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.enterpriseName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const sidebarItems: {
    id: AdminTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    adminOnly?: boolean;
    badge?: number;
  }[] = [
    { id: 'analytics', label: 'المؤشرات والتقارير البيانية', icon: BarChart3 },
    {
      id: 'rfqs',
      label: 'طلبات عروض الأسعار (RFQ)',
      icon: ClipboardList,
      badge: rfqs.filter((r) => r.status === 'جديد').length,
    },
    { id: 'products', label: 'إدارة المنتجات والشرائح', icon: Package, badge: products.length },
    { id: 'clusters', label: 'إدارة التجمعات والأعضاء', icon: Building2, badge: clusters.length },
    { id: 'sectors_enterprises', label: 'القطاعات والمنشآت والاستيراد', icon: Layers },
    { id: 'homepage_settings', label: 'محتوى الرئيسية وسعر الصرف', icon: Settings },
    { id: 'users', label: 'إدارة المستخدمين والصلاحيات', icon: Users, adminOnly: true },
  ];

  const openNewProductModal = () => {
    const defaultCluster = clusters[0];
    setIsNewProduct(true);
    setNewGalleryImageUrl('');
    setNewVideoInputUrl('');
    setNewDocNameInput('');
    setNewDocUrlInput('');
    setEditingProduct({
      id: `PRD-${115 + products.length}`,
      title: '',
      sector: defaultCluster?.sector || 'الخياطة والنسيج',
      prodScope: 'SINGLE',
      scopeBadge: 'منتج قطاعي',
      clusterId: defaultCluster?.id || 'CL1',
      clusterName: defaultCluster?.name || '',
      enterpriseName: defaultCluster?.hostEnterprise || '',
      enterpriseOwner: defaultCluster?.hostOwner || '',
      enterprisePhone: defaultCluster?.hostPhone || '',
      unionName: defaultCluster?.unionName || '',
      priceUsd: 15,
      unit: 'قطعة',
      dailyCapacity: '',
      sampleAvailable: true,
      image: '',
      galleryImages: [],
      videoUrl: '',
      videoUrls: [],
      specPdfUrl: '',
      documents: [],
      priceSavingHighlight: '',
      qualityEdgeHighlight: '',
      description: '',
      manufacturingSpecs: '',
      status: 'published',
      isFeatured: false,
      tiers: [
        { tierIndex: 0, label: '١ - ٤٩', minQty: 1, priceUsd: 15, discountTag: 'سعر أساسي' },
        { tierIndex: 1, label: '٥٠ - ١٩٩', minQty: 50, priceUsd: 14, discountTag: 'خصم 7%' },
        { tierIndex: 2, label: '+٢٠٠', minQty: 200, priceUsd: 13, discountTag: 'خصم 13%' },
      ],
    });
  };

  const openNewClusterModal = () => {
    setIsNewCluster(true);
    setEditingCluster({
      id: `CL${clusters.length + 1}`,
      name: '',
      sector: sectors[0]?.name || 'الخياطة والنسيج',
      unionName: sectors[0]?.unionName || 'اتحاد صناعة الملابس والنسيج',
      governorate: 'غزة',
      hostEnterprise: '',
      hostOwner: '',
      hostPhone: '',
      centralStations: '',
      status: 'published',
      members: [{ id: 'M1', clusterId: '', name: '', owner: '' }],
    });
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col lg:flex-row">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 left-5 z-50 bg-[#0F253E] text-white px-4 py-3 rounded-xl border-2 border-[#C8A24B] shadow-xl flex items-center gap-2 text-xs sm:text-sm font-extrabold">
          <CheckCircle2 className="w-4 h-4 text-[#C8A24B]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Right Sidebar Navigation (RTL) */}
      <aside className="w-full lg:w-72 bg-[#0F253E] text-white border-b lg:border-b-0 lg:border-l-4 border-[#C8A24B] shrink-0 flex flex-col justify-between">
        <div>
          <div className="p-5 border-b border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded bg-[#C8A24B] text-[#0F253E] text-[10px] font-black">
                {currentUser.role === 'admin' ? 'صلاحية: مدير النظام' : 'صلاحية: محرّر المحتوى'}
              </span>
              <button
                type="button"
                onClick={onBackToPublic}
                className="text-xs text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>الموقع العام</span>
              </button>
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                لوحة إدارة منصة التجمعات (HCC)
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">{currentUser.name}</p>
            </div>
          </div>

          <nav className="p-3 space-y-1 flex lg:flex-col overflow-x-auto">
            {sidebarItems
              .filter((item) => !item.adminOnly || currentUser.role === 'admin')
              .map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all shrink-0 lg:w-full cursor-pointer ${
                      isActive
                        ? 'bg-[#C8A24B] text-[#0F253E] shadow-xs'
                        : 'text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          isActive ? 'bg-[#0F253E] text-[#E5C168]' : 'bg-white/15 text-amber-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
          </nav>
        </div>

        <div className="p-4 border-t border-white/10 hidden lg:block space-y-2">
          <button
            type="button"
            onClick={onBackToPublic}
            className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Eye className="w-4 h-4 text-[#C8A24B]" />
            <span>معاينة البوابة العامة</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-[1400px]">
        {/* TAB 1: ANALYTICS & REPORTS */}
        {activeTab === 'analytics' && (
          <AdminAnalyticsView
            token={token}
            sectors={sectors}
            clusters={clusters}
            onSelectRfqForDetail={(rfq) => {
              setSelectedRfq(rfq);
              setRfqNewStatus(rfq.status);
              setRfqInternalNotes(rfq.internalNotes || '');
              setActiveTab('rfqs');
            }}
          />
        )}

        {/* TAB 2: RFQ MANAGEMENT */}
        {activeTab === 'rfqs' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-[#0F253E]">
                  إدارة ومتابعة طلبات عروض الأسعار والتعاقد (RFQ)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  حدّث حالات الطلبات، أضف الملاحظات الداخلية، وراجع سجل المتابعة الزمني لكل طلب
                </p>
              </div>
              <a
                href={`/api/admin/reports/csv?token=${encodeURIComponent(token)}`}
                download="gaza-clusters-rfq-report.csv"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold self-start sm:self-auto"
              >
                <Download className="w-4 h-4" />
                <span>تصدير جدول الطلبات CSV</span>
              </a>
            </div>

            {/* Search & Filters */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={rfqSearch}
                  onChange={(e) => setRfqSearch(e.target.value)}
                  placeholder="بحث بالرقم المرجعي، اسم الجهة، أو المنتج..."
                  className="w-full pr-9 pl-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <select
                value={rfqSectorFilter}
                onChange={(e) => setRfqSectorFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold bg-white"
              >
                <option value="ALL">جميع القطاعات</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={rfqStatusFilter}
                onChange={(e) => setRfqStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold bg-white"
              >
                <option value="ALL">جميع الحالات ({rfqs.length})</option>
                {RFQ_STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* RFQs Table */}
            {filteredRfqs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs sm:text-sm text-slate-500">
                لا توجد طلبات عروض أسعار مسجلة تطابق الفلتر الحالي.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#0F253E] text-white">
                    <tr>
                      <th className="p-3 font-extrabold">المرجع والتاريخ</th>
                      <th className="p-3 font-extrabold">الجهة والمسؤول</th>
                      <th className="p-3 font-extrabold">المنتج والتجمع</th>
                      <th className="p-3 font-extrabold">الكمية والنمط</th>
                      <th className="p-3 font-extrabold">الشريحة والإجمالي</th>
                      <th className="p-3 font-extrabold">الحالة</th>
                      <th className="p-3 font-extrabold text-center">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredRfqs.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <div className="font-mono font-black text-[#0F253E]">{r.refNumber}</div>
                          <div className="text-[10px] text-slate-500">{r.createdAt}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-extrabold text-slate-900">{r.buyerOrg}</div>
                          <div className="text-slate-600">
                            {r.contactPerson} — <span dir="ltr">{r.contactInfo}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-[#0F253E]">{r.productTitle}</div>
                          <div className="text-[10px] text-slate-500">
                            {r.clusterName} | {r.attributedSector}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-black">
                            {r.quantity} {r.unit}
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                            {r.contractMode}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-black text-[#0F253E]">
                            ${r.totalPriceUsd.toLocaleString()} (${r.unitPriceUsd} للوحدة)
                          </div>
                          <div className="text-[10px] text-emerald-700 font-bold">
                            شريحة: {r.appliedTierLabel} | عملة العرض: {r.currencyAtSubmit} (صرف{' '}
                            {r.exchangeRateAtSubmit})
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[11px]">
                            {r.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRfq(r);
                              setRfqNewStatus(r.status);
                              setRfqInternalNotes(r.internalNotes || '');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#0F253E] text-[#E5C168] font-extrabold hover:bg-[#1C4587] cursor-pointer"
                          >
                            تفاصيل ومتابعة
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Selected RFQ Detail Modal */}
            {selectedRfq && (
              <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-2xl border-2 border-[#C8A24B] max-w-3xl w-full overflow-hidden my-8 shadow-2xl">
                  <div className="bg-[#0F253E] text-white px-6 py-4 flex items-center justify-between border-b-2 border-[#C8A24B]">
                    <div>
                      <h4 className="text-base font-black">
                        بطاقة متابعة الطلب المرجعي: {selectedRfq.refNumber}
                      </h4>
                      <p className="text-xs text-[#E5C168]">
                        {selectedRfq.buyerOrg} — {selectedRfq.productTitle}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedRfq(null)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-500">الجهة الطالبة:</span>{' '}
                        <strong className="block text-slate-900 mt-0.5">{selectedRfq.buyerOrg}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">الشخص المسؤول:</span>{' '}
                        <strong className="block text-slate-900 mt-0.5">
                          {selectedRfq.contactPerson}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500">الهاتف / البريد:</span>{' '}
                        <strong className="block text-slate-900 mt-0.5" dir="ltr">
                          {selectedRfq.contactInfo}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500">المنتج والمعرّف:</span>{' '}
                        <strong className="block text-slate-900 mt-0.5">
                          {selectedRfq.productTitle} ({selectedRfq.productId})
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500">التجمع والمنشأة:</span>{' '}
                        <strong className="block text-slate-900 mt-0.5">
                          {selectedRfq.clusterName} — {selectedRfq.enterpriseName}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500">الكمية ونمط التعاقد:</span>{' '}
                        <strong className="block text-slate-900 mt-0.5">
                          {selectedRfq.quantity} {selectedRfq.unit} ({selectedRfq.contractMode})
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500">الشريحة وسعر الوحدة:</span>{' '}
                        <strong className="block text-emerald-700 mt-0.5">
                          {selectedRfq.appliedTierLabel} (${selectedRfq.unitPriceUsd})
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500">الإجمالي بالدولار:</span>{' '}
                        <strong className="block text-[#0F253E] text-sm font-black mt-0.5">
                          ${selectedRfq.totalPriceUsd.toLocaleString()}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500">العملة وسعر الصرف وقت الطلب:</span>{' '}
                        <strong className="block text-slate-900 mt-0.5">
                          {selectedRfq.currencyAtSubmit} (سعر الصرف: {selectedRfq.exchangeRateAtSubmit})
                        </strong>
                      </div>
                    </div>

                    {selectedRfq.notes && (
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                        <strong className="text-amber-900 block mb-1">
                          ملاحظات الجهة الطالبة عند الإرسال:
                        </strong>
                        <p className="text-slate-800">{selectedRfq.notes}</p>
                      </div>
                    )}

                    <form onSubmit={handleSaveRfqUpdate} className="space-y-4 border-t border-slate-200 pt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-extrabold text-[#0F253E] mb-1">
                            تحديث حالة الطلب
                          </label>
                          <select
                            value={rfqNewStatus}
                            onChange={(e) => setRfqNewStatus(e.target.value as RfqStatus)}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-extrabold bg-white"
                          >
                            {RFQ_STATUS_OPTIONS.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-extrabold text-[#0F253E] mb-1">
                            إضافة ملاحظة لإدراجها في سجل المتابعة
                          </label>
                          <input
                            type="text"
                            value={rfqLogNote}
                            onChange={(e) => setRfqLogNote(e.target.value)}
                            placeholder="مثال: تم الاتصال بالمسؤول وإرسال عينة الفحص..."
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-[#0F253E] mb-1">
                          الملاحظات الإدارية الداخلية (تظهر للإدارة فقط)
                        </label>
                        <textarea
                          rows={2}
                          value={rfqInternalNotes}
                          onChange={(e) => setRfqInternalNotes(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="submit"
                          className="px-5 py-2.5 rounded-xl bg-[#0F253E] text-[#E5C168] text-xs font-black hover:bg-[#1C4587] cursor-pointer"
                        >
                          حفظ التحديثات وسجل المتابعة
                        </button>
                      </div>
                    </form>

                    {/* Audit Log History */}
                    <div className="border-t border-slate-200 pt-4">
                      <h5 className="text-xs font-black text-[#0F253E] mb-2.5">
                        سجل المتابعة الزمني (Audit Log):
                      </h5>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {(selectedRfq.logs || []).map((log) => (
                          <div
                            key={log.id}
                            className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-start justify-between gap-2"
                          >
                            <div>
                              <div className="font-bold text-[#0F253E]">{log.action}</div>
                              {log.note && <div className="text-slate-600 mt-0.5">{log.note}</div>}
                            </div>
                            <div className="text-left shrink-0 text-[10px] text-slate-500">
                              <div className="font-bold text-slate-700">{log.actorName}</div>
                              <div>{log.createdAt}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PRODUCTS & PRICE TIERS MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-[#0F253E]">
                  إدارة المنتجات والمواصفات والشرائح السعرية
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  أضف أو عدّل المنتجات، ارفع الصور من جهازك، وتحكم بحالة النشر (مسودة، منشور، مؤرشف) والظهور في الرئيسية
                </p>
              </div>
              <button
                type="button"
                onClick={openNewProductModal}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F253E] text-[#E5C168] hover:bg-[#1C4587] text-xs font-black cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة منتج جديد</span>
              </button>
            </div>

            {/* Product Search & Status Filter */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="ابحث باسم المنتج، المعرّف (PRD-101)، أو المنشأة..."
                  className="w-full pr-9 pl-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>
              <select
                value={productStatusFilter}
                onChange={(e) => setProductStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold bg-white"
              >
                <option value="ALL">جميع الحالات ({products.length})</option>
                <option value="published">منشور فقط</option>
                <option value="draft">مسودة فقط</option>
                <option value="archived">مؤرشف فقط</option>
              </select>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#0F253E] text-white">
                  <tr>
                    <th className="p-3 font-extrabold">المنتج</th>
                    <th className="p-3 font-extrabold">القطاع والنوع</th>
                    <th className="p-3 font-extrabold">التجمع والمنشأة</th>
                    <th className="p-3 font-extrabold">شرائح الأسعار ($)</th>
                    <th className="p-3 font-extrabold">في الرئيسية</th>
                    <th className="p-3 font-extrabold">حالة النشر</th>
                    <th className="p-3 font-extrabold text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredProducts.map((p) => {
                    const stBadge = STATUS_BADGE_MAP[p.status] || STATUS_BADGE_MAP.published;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            {p.image ? (
                              <img
                                src={p.image}
                                alt={p.title}
                                className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <span className="font-mono text-[10px] font-bold text-[#1C4587]">
                                {p.id}
                              </span>
                              <div className="font-black text-[#0F253E]">{p.title}</div>
                              <div className="flex items-center gap-1 flex-wrap mt-1">
                                {(p.image || (p.galleryImages && p.galleryImages.length > 0)) && (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[#1C4587] border border-blue-200 text-[10px] font-bold">
                                    صور:{' '}
                                    {Array.from(
                                      new Set(
                                        [p.image, ...(p.galleryImages || [])].filter((u) =>
                                          Boolean(u && u.trim())
                                        )
                                      )
                                    ).length}
                                  </span>
                                )}
                                {(() => {
                                  const vidCount = Array.from(
                                    new Set(
                                      [p.videoUrl, ...(p.videoUrls || [])].filter((v) =>
                                        Boolean(v && v.trim())
                                      )
                                    )
                                  ).length;
                                  return vidCount > 0 ? (
                                    <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold">
                                      فيديو: {vidCount}
                                    </span>
                                  ) : null;
                                })()}
                                {(() => {
                                  const docCount =
                                    p.documents && p.documents.length > 0
                                      ? p.documents.length
                                      : p.specPdfUrl && p.specPdfUrl.trim()
                                      ? 1
                                      : 0;
                                  return docCount > 0 ? (
                                    <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-800 border border-red-200 text-[10px] font-bold">
                                      مستندات: {docCount}
                                    </span>
                                  ) : null;
                                })()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-800">{p.sector}</div>
                          <span className="text-[10px] text-slate-500">{p.scopeBadge}</span>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-800">{p.enterpriseName}</div>
                          <div className="text-[10px] text-slate-500">
                            {p.clusterName} ({p.clusterId})
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {(p.tiers || []).map((t, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold"
                              >
                                {t.label}: ${t.priceUsd}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => handleQuickProductStatus(p.id, undefined, !p.isFeatured)}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold border cursor-pointer ${
                              p.isFeatured
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-slate-50 text-slate-500 border-slate-200'
                            }`}
                          >
                            {p.isFeatured ? '★ مختار بالرئيسية' : 'غير مختار'}
                          </button>
                        </td>
                        <td className="p-3">
                          <select
                            value={p.status}
                            onChange={(e) =>
                              handleQuickProductStatus(p.id, e.target.value as ContentStatus)
                            }
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border ${stBadge.cls}`}
                          >
                            <option value="published">منشور</option>
                            <option value="draft">مسودة</option>
                            <option value="archived">مؤرشف</option>
                          </select>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setIsNewProduct(false);
                              setNewGalleryImageUrl('');
                              setNewVideoInputUrl('');
                              setNewDocNameInput('');
                              setNewDocUrlInput('');
                              const cloned: Product = JSON.parse(JSON.stringify(p));
                              const normVideos = Array.from(
                                new Set(
                                  [cloned.videoUrl, ...(cloned.videoUrls || [])].filter(
                                    (v): v is string => Boolean(v && v.trim())
                                  )
                                )
                              );
                              const normDocs: ProductDocument[] =
                                cloned.documents && cloned.documents.length > 0
                                  ? cloned.documents
                                  : cloned.specPdfUrl && cloned.specPdfUrl.trim()
                                  ? [
                                      {
                                        name:
                                          cloned.specPdfUrl.split('/').pop() ||
                                          'ملف المواصفات الفنية',
                                        url: cloned.specPdfUrl.trim(),
                                      },
                                    ]
                                  : [];
                              setEditingProduct({
                                ...cloned,
                                videoUrls: normVideos,
                                videoUrl: normVideos[0] || '',
                                documents: normDocs,
                                specPdfUrl: normDocs[0]?.url || '',
                              });
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0F253E] text-[#E5C168] font-bold hover:bg-[#1C4587] cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Product Create/Edit Modal */}
            {editingProduct && (
              <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-2xl border-2 border-[#C8A24B] max-w-4xl w-full overflow-hidden my-8 shadow-2xl">
                  <div className="bg-[#0F253E] text-white px-6 py-4 flex items-center justify-between border-b-2 border-[#C8A24B]">
                    <h4 className="text-base font-black">
                      {isNewProduct
                        ? 'إضافة منتج جديد إلى المنصة'
                        : `تعديل المنتج: ${editingProduct.title} (${editingProduct.id})`}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form
                    onSubmit={handleSaveProduct}
                    className="p-6 space-y-5 max-h-[82vh] overflow-y-auto text-xs"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block font-extrabold text-[#0F253E] mb-1">
                          معرّف المنتج (ID)
                        </label>
                        <input
                          type="text"
                          required
                          disabled={!isNewProduct}
                          value={editingProduct.id || ''}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, id: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono disabled:bg-slate-100"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-extrabold text-[#0F253E] mb-1">
                          اسم المنتج <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={editingProduct.title || ''}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, title: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block font-extrabold text-[#0F253E] mb-1">القطاع</label>
                        <select
                          value={editingProduct.sector || ''}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, sector: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold"
                        >
                          {sectors.map((s) => (
                            <option key={s.id} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                          <option value="منتج تكاملي مشترك">منتج تكاملي مشترك</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-extrabold text-[#0F253E] mb-1">
                          التجمع العنقودي الحاضن
                        </label>
                        <select
                          value={editingProduct.clusterId || ''}
                          onChange={(e) => {
                            const cl = clusters.find((c) => c.id === e.target.value);
                            setEditingProduct({
                              ...editingProduct,
                              clusterId: e.target.value,
                              clusterName: cl ? cl.name : editingProduct.clusterName,
                              unionName: cl ? cl.unionName : editingProduct.unionName,
                            });
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold"
                        >
                          {clusters.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.id} - {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-extrabold text-[#0F253E] mb-1">
                          نطاق التصنيع
                        </label>
                        <select
                          value={editingProduct.prodScope || 'SINGLE'}
                          onChange={(e) => {
                            const scope = e.target.value as 'SINGLE' | 'INTEGRATED';
                            setEditingProduct({
                              ...editingProduct,
                              prodScope: scope,
                              scopeBadge:
                                scope === 'INTEGRATED'
                                  ? 'منتج تكاملي (عدة قطاعات)'
                                  : 'منتج قطاعي',
                            });
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold"
                        >
                          <option value="SINGLE">منتج قطاعي (SINGLE)</option>
                          <option value="INTEGRATED">منتج تكاملي مشترك (INTEGRATED)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block font-extrabold text-[#0F253E] mb-1">
                          المنشأة المنتجة
                        </label>
                        <input
                          type="text"
                          required
                          value={editingProduct.enterpriseName || ''}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              enterpriseName: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        />
                      </div>

                      <div>
                        <label className="block font-extrabold text-[#0F253E] mb-1">
                          مدير المنشأة
                        </label>
                        <input
                          type="text"
                          value={editingProduct.enterpriseOwner || ''}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              enterpriseOwner: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        />
                      </div>

                      <div>
                        <label className="block font-extrabold text-[#0F253E] mb-1">
                          هاتف المنشأة
                        </label>
                        <input
                          type="text"
                          value={editingProduct.enterprisePhone || ''}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              enterprisePhone: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block font-extrabold text-[#0F253E] mb-1">
                          وحدة القياس
                        </label>
                        <input
                          type="text"
                          required
                          value={editingProduct.unit || ''}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, unit: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        />
                      </div>

                      <div>
                        <label className="block font-extrabold text-[#0F253E] mb-1">
                          الطاقة الإنتاجية اليومية (اختياري)
                        </label>
                        <input
                          type="text"
                          value={editingProduct.dailyCapacity || ''}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              dailyCapacity: e.target.value,
                            })
                          }
                          placeholder="مثال: 100 قطعة / يوم"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        />
                      </div>

                      <div>
                        <label className="block font-extrabold text-[#0F253E] mb-1">
                          حالة النشر
                        </label>
                        <select
                          value={editingProduct.status || 'published'}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              status: e.target.value as ContentStatus,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold"
                        >
                          <option value="published">منشور (يظهر للزوار)</option>
                          <option value="draft">مسودة</option>
                          <option value="archived">مؤرشف</option>
                        </select>
                      </div>

                      <div className="flex flex-col justify-end gap-2">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(editingProduct.sampleAvailable)}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                sampleAvailable: e.target.checked,
                              })
                            }
                          />
                          <span className="font-bold text-slate-700">عينة متاحة للفحص</span>
                        </label>
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(editingProduct.isFeatured)}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                isFeatured: e.target.checked,
                              })
                            }
                          />
                          <span className="font-bold text-amber-800">عرض في الصفحة الرئيسية</span>
                        </label>
                      </div>
                    </div>

                    {/* Flexible Media & Attachments Section: Images, Videos & Documents */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-5">
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-200">
                        <div>
                          <h5 className="font-black text-[#0F253E] text-xs sm:text-sm flex items-center gap-1.5">
                            <Images className="w-4 h-4 text-[#1C4587]" />
                            <span>
                              وسائط ومرفقات المنتج المتعددة (صور متعددة / ملفات فيديو / مستندات وملفات مواصفات)
                            </span>
                          </h5>
                          <p className="text-[11px] text-emerald-800 font-bold mt-0.5">
                            ملاحظة: يمكنك رفع صورة أو عدة صور، ملف فيديو أو أكثر، ومستند أو أكثر. عند عرض المنتج للزوار يظهر فقط ما تمت إضافته هنا.
                          </p>
                        </div>
                        {uploadingImage && (
                          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-black animate-pulse">
                            جاري رفع الملفات إلى الخادم...
                          </span>
                        )}
                      </div>

                      {/* 1. Primary Image & Multi-Image Gallery */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200/90 space-y-4">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                          {editingProduct.image && editingProduct.image.trim() ? (
                            <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-[#C8A24B] shrink-0 bg-slate-50 shadow-2xs">
                              <img
                                src={editingProduct.image}
                                alt="الصورة الرئيسية"
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute bottom-0 inset-x-0 bg-[#0F253E]/85 text-[#E5C168] text-[9px] font-black text-center py-0.5">
                                الرئيسية
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const remaining = editingProduct.galleryImages || [];
                                  setEditingProduct({
                                    ...editingProduct,
                                    image: remaining[0] || '',
                                    galleryImages: remaining.slice(1),
                                  });
                                }}
                                className="absolute top-1 left-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center cursor-pointer shadow-xs"
                                title="حذف الصورة الرئيسية"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400 shrink-0 text-[10px] font-bold text-center p-2">
                              <ImageIcon className="w-6 h-6 mb-1 text-slate-300" />
                              <span>بدون صورة رئيسية</span>
                            </div>
                          )}

                          <div className="flex-1 space-y-2 w-full">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <label className="block font-extrabold text-[#0F253E]">
                                ١. الصور ومعرض المنتج (إجمالي الصور المضافة:{' '}
                                {
                                  Array.from(
                                    new Set(
                                      [
                                        editingProduct.image,
                                        ...(editingProduct.galleryImages || []),
                                      ].filter((u) => Boolean(u && u.trim()))
                                    )
                                  ).length
                                }
                                )
                              </label>
                              <div className="flex items-center gap-2 flex-wrap">
                                <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0F253E] text-[#E5C168] font-bold cursor-pointer hover:bg-[#1C4587] text-[11px]">
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>رفع صورة رئيسية</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleFileUpload(file, (url) =>
                                          setEditingProduct((prev) =>
                                            prev ? { ...prev, image: url } : prev
                                          )
                                        );
                                      }
                                      e.target.value = '';
                                    }}
                                  />
                                </label>

                                <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1C4587] text-white font-bold cursor-pointer hover:bg-[#0F253E] text-[11px]">
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>رفع عدة صور دفعة واحدة للمعرض</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => {
                                      const files = Array.from(e.target.files || []);
                                      if (files.length > 0) {
                                        handleMultipleFilesUpload(files, (uploadedList) => {
                                          const urls = uploadedList.map((u) => u.url);
                                          setEditingProduct((prev) => {
                                            if (!prev) return prev;
                                            const currentMain = prev.image && prev.image.trim();
                                            if (!currentMain) {
                                              const [first, ...rest] = urls;
                                              return {
                                                ...prev,
                                                image: first || '',
                                                galleryImages: Array.from(
                                                  new Set([...(prev.galleryImages || []), ...rest])
                                                ),
                                              };
                                            }
                                            return {
                                              ...prev,
                                              galleryImages: Array.from(
                                                new Set([
                                                  ...(prev.galleryImages || []),
                                                  ...urls.filter((u) => u !== currentMain),
                                                ])
                                              ),
                                            };
                                          });
                                        });
                                      }
                                      e.target.value = '';
                                    }}
                                  />
                                </label>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                type="text"
                                value={editingProduct.image || ''}
                                onChange={(e) =>
                                  setEditingProduct({ ...editingProduct, image: e.target.value })
                                }
                                placeholder="رابط الصورة الرئيسية https://... أو اتركه فارغًا"
                                dir="ltr"
                                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 font-mono text-[11px] bg-slate-50"
                              />
                              {editingProduct.image && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingProduct({ ...editingProduct, image: '' })
                                  }
                                  className="px-2.5 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 font-bold hover:bg-red-100 cursor-pointer"
                                >
                                  مسح الرئيسية
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Add additional image by direct URL & Gallery Thumbnails Grid */}
                        <div className="border-t border-slate-100 pt-3 space-y-2.5">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={newGalleryImageUrl}
                              onChange={(e) => setNewGalleryImageUrl(e.target.value)}
                              placeholder="أو الصق رابط صورة إضافية هنا ثم اضغط «+ إضافة صورة للمعرض»..."
                              dir="ltr"
                              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 font-mono text-[11px]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const trimmed = newGalleryImageUrl.trim();
                                if (!trimmed) return;
                                if (!editingProduct.image || !editingProduct.image.trim()) {
                                  setEditingProduct({ ...editingProduct, image: trimmed });
                                } else if (trimmed !== editingProduct.image) {
                                  setEditingProduct({
                                    ...editingProduct,
                                    galleryImages: Array.from(
                                      new Set([...(editingProduct.galleryImages || []), trimmed])
                                    ),
                                  });
                                }
                                setNewGalleryImageUrl('');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 text-white font-bold text-[11px] hover:bg-[#0F253E] cursor-pointer shrink-0"
                            >
                              + إضافة صورة للمعرض
                            </button>
                            {(editingProduct.galleryImages || []).length > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingProduct({ ...editingProduct, galleryImages: [] })
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 font-bold text-[11px] hover:bg-red-100 cursor-pointer shrink-0"
                              >
                                مسح الصور الإضافية
                              </button>
                            )}
                          </div>

                          {(editingProduct.galleryImages || []).length > 0 && (
                            <div className="flex items-center gap-2.5 flex-wrap pt-1">
                              {(editingProduct.galleryImages || []).map((gUrl, gIdx) => (
                                <div
                                  key={gIdx}
                                  className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-300 bg-slate-50 group shadow-2xs"
                                >
                                  <img
                                    src={gUrl}
                                    alt={`صورة إضافية ${gIdx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = (editingProduct.galleryImages || []).filter(
                                        (_, i) => i !== gIdx
                                      );
                                      setEditingProduct({ ...editingProduct, galleryImages: next });
                                    }}
                                    className="absolute top-1 left-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] cursor-pointer shadow-xs"
                                    title="حذف الصورة"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const prevMain = editingProduct.image?.trim() || '';
                                      const remaining = (
                                        editingProduct.galleryImages || []
                                      ).filter((_, i) => i !== gIdx);
                                      setEditingProduct({
                                        ...editingProduct,
                                        image: gUrl,
                                        galleryImages: prevMain
                                          ? [prevMain, ...remaining]
                                          : remaining,
                                      });
                                    }}
                                    className="absolute bottom-0 inset-x-0 bg-black/70 hover:bg-[#0F253E] text-white text-[9px] font-bold py-1 text-center cursor-pointer"
                                  >
                                    تعيين كرئيسية
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 2. Multiple Video Files & Links Section */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200/90 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <label className="font-extrabold text-[#0F253E] flex items-center gap-1.5">
                            <Video className="w-4 h-4 text-[#1C4587]" />
                            <span>
                              ٢. ملفات الفيديو التوضيحية ({(editingProduct.videoUrls || []).length}{' '}
                              فيديو مضاف)
                            </span>
                          </label>
                          <div className="flex items-center gap-2">
                            <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 text-[#E5C168] font-bold cursor-pointer hover:bg-[#0F253E] text-[11px]">
                              <Upload className="w-3.5 h-3.5" />
                              <span>رفع ملف أو عدة ملفات فيديو (MP4 / WebM / MOV)</span>
                              <input
                                type="file"
                                accept="video/*"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                  const files = Array.from(e.target.files || []);
                                  if (files.length > 0) {
                                    handleMultipleFilesUpload(files, (uploadedList) => {
                                      const urls = uploadedList.map((u) => u.url);
                                      setEditingProduct((prev) => {
                                        if (!prev) return prev;
                                        const nextVideos = Array.from(
                                          new Set([...(prev.videoUrls || []), ...urls])
                                        );
                                        return {
                                          ...prev,
                                          videoUrls: nextVideos,
                                          videoUrl: nextVideos[0] || '',
                                        };
                                      });
                                    });
                                  }
                                  e.target.value = '';
                                }}
                              />
                            </label>
                            {(editingProduct.videoUrls || []).length > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    videoUrls: [],
                                    videoUrl: '',
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 font-bold text-[11px] hover:bg-red-100 cursor-pointer"
                              >
                                حذف جميع الفيديوهات
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newVideoInputUrl}
                            onChange={(e) => setNewVideoInputUrl(e.target.value)}
                            placeholder="أو الصق رابط فيديو (YouTube / Vimeo / MP4) هنا ثم اضغط «+ إضافة فيديو»..."
                            dir="ltr"
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-[11px] bg-slate-50 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const trimmed = newVideoInputUrl.trim();
                              if (!trimmed) return;
                              const nextVideos = Array.from(
                                new Set([...(editingProduct.videoUrls || []), trimmed])
                              );
                              setEditingProduct({
                                ...editingProduct,
                                videoUrls: nextVideos,
                                videoUrl: nextVideos[0] || '',
                              });
                              setNewVideoInputUrl('');
                            }}
                            className="px-3.5 py-2 rounded-lg bg-[#0F253E] text-[#E5C168] font-bold text-[11px] hover:bg-[#1C4587] cursor-pointer shrink-0"
                          >
                            + إضافة فيديو
                          </button>
                        </div>

                        {(editingProduct.videoUrls || []).length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {(editingProduct.videoUrls || []).map((vUrl, vIdx) => {
                              const isYtOrVimeo =
                                vUrl.includes('youtube.com') ||
                                vUrl.includes('youtu.be') ||
                                vUrl.includes('vimeo.com');
                              return (
                                <div
                                  key={vIdx}
                                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-black text-[#0F253E] text-[11px] flex items-center gap-1">
                                      <Video className="w-3.5 h-3.5 text-[#1C4587]" />
                                      <span>فيديو #{vIdx + 1}</span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextVideos = (
                                          editingProduct.videoUrls || []
                                        ).filter((_, i) => i !== vIdx);
                                        setEditingProduct({
                                          ...editingProduct,
                                          videoUrls: nextVideos,
                                          videoUrl: nextVideos[0] || '',
                                        });
                                      }}
                                      className="px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold hover:bg-red-100 cursor-pointer flex items-center gap-1"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>حذف</span>
                                    </button>
                                  </div>
                                  {!isYtOrVimeo ? (
                                    <video
                                      src={vUrl}
                                      controls
                                      className="w-full h-32 rounded-lg bg-slate-900 object-cover"
                                    />
                                  ) : (
                                    <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 text-[11px] font-mono text-[#1C4587] truncate" dir="ltr">
                                      {vUrl}
                                    </div>
                                  )}
                                  <div
                                    className="text-[10px] text-slate-500 font-mono truncate"
                                    dir="ltr"
                                  >
                                    {vUrl}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* 3. Multiple Documents & Specification Files Section */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200/90 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <label className="font-extrabold text-[#0F253E] flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-red-700" />
                            <span>
                              ٣. المستندات وملفات المواصفات الفنية المرفقة (
                              {(editingProduct.documents || []).length} ملف مرفق)
                            </span>
                          </label>
                          <div className="flex items-center gap-2">
                            <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-800 text-white font-bold cursor-pointer hover:bg-red-900 text-[11px]">
                              <Upload className="w-3.5 h-3.5" />
                              <span>رفع ملف أو عدة مستندات (PDF / Word / Excel / ZIP)</span>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.zip,application/pdf"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                  const files = Array.from(e.target.files || []);
                                  if (files.length > 0) {
                                    handleMultipleFilesUpload(files, (uploadedList) => {
                                      const newDocs: ProductDocument[] = uploadedList.map(
                                        (item) => ({
                                          name: item.filename,
                                          url: item.url,
                                        })
                                      );
                                      setEditingProduct((prev) => {
                                        if (!prev) return prev;
                                        const nextDocs = [...(prev.documents || []), ...newDocs];
                                        return {
                                          ...prev,
                                          documents: nextDocs,
                                          specPdfUrl: nextDocs[0]?.url || '',
                                        };
                                      });
                                    });
                                  }
                                  e.target.value = '';
                                }}
                              />
                            </label>
                            {(editingProduct.documents || []).length > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    documents: [],
                                    specPdfUrl: '',
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 font-bold text-[11px] hover:bg-red-100 cursor-pointer"
                              >
                                حذف جميع المستندات
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Add document by custom title & URL */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                          <input
                            type="text"
                            value={newDocNameInput}
                            onChange={(e) => setNewDocNameInput(e.target.value)}
                            placeholder="اسم المستند (مثال: كراسة المواصفات الفنية المعتمدة)"
                            className="sm:col-span-5 px-3 py-2 rounded-lg border border-slate-300 text-[11px] bg-slate-50"
                          />
                          <input
                            type="text"
                            value={newDocUrlInput}
                            onChange={(e) => setNewDocUrlInput(e.target.value)}
                            placeholder="رابط الملف أو المستند https://... أو /uploads/..."
                            dir="ltr"
                            className="sm:col-span-5 px-3 py-2 rounded-lg border border-slate-300 text-[11px] bg-slate-50 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const trimmedUrl = newDocUrlInput.trim();
                              if (!trimmedUrl) return;
                              const docName =
                                newDocNameInput.trim() ||
                                trimmedUrl.split('/').pop() ||
                                'ملف المواصفات الفنية';
                              const nextDocs: ProductDocument[] = [
                                ...(editingProduct.documents || []),
                                { name: docName, url: trimmedUrl },
                              ];
                              setEditingProduct({
                                ...editingProduct,
                                documents: nextDocs,
                                specPdfUrl: nextDocs[0]?.url || '',
                              });
                              setNewDocNameInput('');
                              setNewDocUrlInput('');
                            }}
                            className="sm:col-span-2 px-3 py-2 rounded-lg bg-[#0F253E] text-[#E5C168] font-bold text-[11px] hover:bg-[#1C4587] cursor-pointer"
                          >
                            + إضافة مستند
                          </button>
                        </div>

                        {(editingProduct.documents || []).length > 0 && (
                          <div className="space-y-2 pt-1">
                            {(editingProduct.documents || []).map((doc, dIdx) => {
                              const ext =
                                doc.url.split('.').pop()?.toUpperCase().slice(0, 4) || 'FILE';
                              return (
                                <div
                                  key={dIdx}
                                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5"
                                >
                                  <div className="flex items-center gap-2.5 flex-1 w-full">
                                    <span className="px-2 py-1 rounded-md bg-red-100 text-red-800 border border-red-200 font-mono font-black text-[10px] shrink-0">
                                      {ext}
                                    </span>
                                    <input
                                      type="text"
                                      value={doc.name}
                                      onChange={(e) => {
                                        const nextDocs = [...(editingProduct.documents || [])];
                                        nextDocs[dIdx] = {
                                          ...nextDocs[dIdx],
                                          name: e.target.value,
                                        };
                                        setEditingProduct({
                                          ...editingProduct,
                                          documents: nextDocs,
                                        });
                                      }}
                                      placeholder="اسم المستند"
                                      className="flex-1 px-2.5 py-1 rounded border border-slate-300 bg-white font-bold text-[#0F253E] text-xs"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                    <a
                                      href={doc.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-[#1C4587] font-bold text-[11px] hover:border-[#1C4587] inline-flex items-center gap-1"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      <span>معاينة</span>
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextDocs = (
                                          editingProduct.documents || []
                                        ).filter((_, i) => i !== dIdx);
                                        setEditingProduct({
                                          ...editingProduct,
                                          documents: nextDocs,
                                          specPdfUrl: nextDocs[0]?.url || '',
                                        });
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 font-bold text-[11px] hover:bg-red-100 cursor-pointer inline-flex items-center gap-1"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>حذف</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Highlight Capsules */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-extrabold text-emerald-800 mb-1">
                          ميزة الوفر السعري (اختياري — يظهر فقط عند تعبئته)
                        </label>
                        <input
                          type="text"
                          value={editingProduct.priceSavingHighlight || ''}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              priceSavingHighlight: e.target.value,
                            })
                          }
                          placeholder="مثال: وفر 15% عبر خطوط الإنتاج المشتركة"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block font-extrabold text-blue-800 mb-1">
                          ميزة الجودة والكفاءة (اختياري — يظهر فقط عند تعبئته)
                        </label>
                        <input
                          type="text"
                          value={editingProduct.qualityEdgeHighlight || ''}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              qualityEdgeHighlight: e.target.value,
                            })
                          }
                          placeholder="مثال: مطابق للمواصفات الفنية ومفحوص مخبريًا"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        />
                      </div>
                    </div>

                    {/* Description & Manufacturing Specs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-extrabold text-[#0F253E] mb-1">
                          الوصف التفصيلي للمنتج (اختياري — يظهر فقط عند تعبئته)
                        </label>
                        <textarea
                          rows={3}
                          value={editingProduct.description || ''}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              description: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block font-extrabold text-[#0F253E] mb-1">
                          المواصفات الفنية والتصنيعية (اختياري — يظهر فقط عند تعبئته)
                        </label>
                        <textarea
                          rows={3}
                          value={editingProduct.manufacturingSpecs || ''}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              manufacturingSpecs: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        />
                      </div>
                    </div>

                    {/* Price Tiers Editor */}
                    <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-3">
                      <h5 className="font-black text-[#0F253E]">
                        شرائح الأسعار التعاقدية (بالدولار الأمريكي $):
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {(editingProduct.tiers || []).map((tier, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg bg-white border border-amber-200 space-y-2"
                          >
                            <div className="font-black text-[#9A7422]">الشريحة #{idx + 1}</div>
                            <div>
                              <label className="block text-[10px] text-slate-500">
                                مسمى الشريحة (مثال: ١ - ٤٩)
                              </label>
                              <input
                                type="text"
                                value={tier.label}
                                onChange={(e) => {
                                  const next = [...(editingProduct.tiers || [])];
                                  next[idx] = { ...next[idx], label: e.target.value };
                                  setEditingProduct({ ...editingProduct, tiers: next });
                                }}
                                className="w-full px-2.5 py-1.5 rounded border border-slate-300"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] text-slate-500">
                                  الحد الأدنى للكمية
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  value={tier.minQty}
                                  onChange={(e) => {
                                    const next = [...(editingProduct.tiers || [])];
                                    next[idx] = {
                                      ...next[idx],
                                      minQty: Math.max(1, Number(e.target.value) || 1),
                                    };
                                    setEditingProduct({ ...editingProduct, tiers: next });
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-bold"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-500">
                                  السعر ($)
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={tier.priceUsd}
                                  onChange={(e) => {
                                    const next = [...(editingProduct.tiers || [])];
                                    next[idx] = {
                                      ...next[idx],
                                      priceUsd: Number(e.target.value) || 0,
                                    };
                                    setEditingProduct({
                                      ...editingProduct,
                                      priceUsd: idx === 0 ? Number(e.target.value) : editingProduct.priceUsd,
                                      tiers: next,
                                    });
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-bold"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-500">
                                وسم الخصم (مثال: خصم 8%)
                              </label>
                              <input
                                type="text"
                                value={tier.discountTag}
                                onChange={(e) => {
                                  const next = [...(editingProduct.tiers || [])];
                                  next[idx] = { ...next[idx], discountTag: e.target.value };
                                  setEditingProduct({ ...editingProduct, tiers: next });
                                }}
                                className="w-full px-2.5 py-1.5 rounded border border-slate-300"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setEditingProduct(null)}
                        className="px-4 py-2 rounded-xl border border-slate-300 font-bold"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 rounded-xl bg-[#0F253E] text-[#E5C168] font-black hover:bg-[#1C4587] cursor-pointer"
                      >
                        حفظ بيانات المنتج والشرائح
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CLUSTERS & MEMBERS MANAGEMENT */}
        {activeTab === 'clusters' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-[#0F253E]">
                  إدارة التجمعات الإنتاجية العنقودية والمنشآت الأعضاء ({clusters.length})
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  عدّل بيانات المنشأة المستضيفة، المحطات المركزية، وأضف أو عدّل المنشآت الأعضاء في كل تجمع
                </p>
              </div>
              <button
                type="button"
                onClick={openNewClusterModal}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F253E] text-[#E5C168] hover:bg-[#1C4587] text-xs font-black cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة تجمع جديد</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clusters.map((c) => {
                const stBadge = STATUS_BADGE_MAP[c.status] || STATUS_BADGE_MAP.published;
                return (
                  <div
                    key={c.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded bg-[#0F253E] text-[#E5C168] font-mono text-xs font-black">
                            {c.id}
                          </span>
                          <span className="text-xs font-bold text-[#1C4587]">{c.sector}</span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${stBadge.cls}`}
                        >
                          {stBadge.label}
                        </span>
                      </div>

                      <h4 className="text-base font-black text-[#0F253E]">{c.name}</h4>
                      <p className="text-xs text-slate-600 mt-1">
                        المنشأة المستضيفة: <strong>{c.hostEnterprise}</strong> ({c.hostOwner}) —{' '}
                        {c.governorate}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        المحطات المركزية: {c.centralStations}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                      <span className="font-bold text-slate-600">
                        المنشآت الأعضاء: <strong>{c.members.length}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewCluster(false);
                          setEditingCluster(JSON.parse(JSON.stringify(c)));
                        }}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#0F253E] text-[#E5C168] font-bold hover:bg-[#1C4587] cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>تعديل التجمع والأعضاء</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cluster Edit Modal */}
            {editingCluster && (
              <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-2xl border-2 border-[#C8A24B] max-w-3xl w-full overflow-hidden my-8 shadow-2xl">
                  <div className="bg-[#0F253E] text-white px-6 py-4 flex items-center justify-between border-b-2 border-[#C8A24B]">
                    <h4 className="text-base font-black">
                      {isNewCluster
                        ? 'إضافة تجمع إنتاجي جديد'
                        : `تعديل التجمع: ${editingCluster.name} (${editingCluster.id})`}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setEditingCluster(null)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form
                    onSubmit={handleSaveCluster}
                    className="p-6 space-y-4 max-h-[82vh] overflow-y-auto text-xs"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-extrabold text-[#0F253E] mb-1">
                          معرّف التجمع
                        </label>
                        <input
                          type="text"
                          required
                          disabled={!isNewCluster}
                          value={editingCluster.id || ''}
                          onChange={(e) =>
                            setEditingCluster({ ...editingCluster, id: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono disabled:bg-slate-100"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-extrabold text-[#0F253E] mb-1">
                          اسم التجمع العنقودي
                        </label>
                        <input
                          type="text"
                          required
                          value={editingCluster.name || ''}
                          onChange={(e) =>
                            setEditingCluster({ ...editingCluster, name: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-extrabold text-[#0F253E] mb-1">القطاع</label>
                        <select
                          value={editingCluster.sector || ''}
                          onChange={(e) =>
                            setEditingCluster({ ...editingCluster, sector: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold"
                        >
                          {sectors.map((s) => (
                            <option key={s.id} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-extrabold text-[#0F253E] mb-1">
                          الاتحاد التخصصي
                        </label>
                        <input
                          type="text"
                          required
                          value={editingCluster.unionName || ''}
                          onChange={(e) =>
                            setEditingCluster({ ...editingCluster, unionName: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block font-extrabold text-[#0F253E] mb-1">
                          المحافظة / الموقع
                        </label>
                        <input
                          type="text"
                          required
                          value={editingCluster.governorate || ''}
                          onChange={(e) =>
                            setEditingCluster({ ...editingCluster, governorate: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-extrabold text-[#0F253E] mb-1">
                          المنشأة المستضيفة (Host)
                        </label>
                        <input
                          type="text"
                          required
                          value={editingCluster.hostEnterprise || ''}
                          onChange={(e) =>
                            setEditingCluster({
                              ...editingCluster,
                              hostEnterprise: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block font-extrabold text-[#0F253E] mb-1">
                          مسؤول المنشأة المستضيفة
                        </label>
                        <input
                          type="text"
                          value={editingCluster.hostOwner || ''}
                          onChange={(e) =>
                            setEditingCluster({ ...editingCluster, hostOwner: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block font-extrabold text-[#0F253E] mb-1">
                          هاتف التواصل
                        </label>
                        <input
                          type="text"
                          value={editingCluster.hostPhone || ''}
                          onChange={(e) =>
                            setEditingCluster({ ...editingCluster, hostPhone: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-3">
                        <label className="block font-extrabold text-[#0F253E] mb-1">
                          المحطات الإنتاجية المركزية المشتركة
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={editingCluster.centralStations || ''}
                          onChange={(e) =>
                            setEditingCluster({
                              ...editingCluster,
                              centralStations: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block font-extrabold text-[#0F253E] mb-1">
                          حالة النشر
                        </label>
                        <select
                          value={editingCluster.status || 'published'}
                          onChange={(e) =>
                            setEditingCluster({
                              ...editingCluster,
                              status: e.target.value as ContentStatus,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold"
                        >
                          <option value="published">منشور</option>
                          <option value="draft">مسودة</option>
                          <option value="archived">مؤرشف</option>
                        </select>
                      </div>
                    </div>

                    {/* Dynamic Members List */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-black text-[#0F253E]">
                          المنشآت الأعضاء في التجمع ({(editingCluster.members || []).length})
                        </h5>
                        <button
                          type="button"
                          onClick={() => {
                            const next: ClusterMember[] = [
                              ...(editingCluster.members || []),
                              {
                                id: `${editingCluster.id || 'CL'}-M${
                                  (editingCluster.members || []).length + 1
                                }`,
                                clusterId: editingCluster.id || '',
                                name: '',
                                owner: '',
                              },
                            ];
                            setEditingCluster({ ...editingCluster, members: next });
                          }}
                          className="px-3 py-1 rounded-lg bg-[#0F253E] text-[#E5C168] font-bold cursor-pointer"
                        >
                          + إضافة عضو
                        </button>
                      </div>

                      <div className="space-y-2">
                        {(editingCluster.members || []).map((m, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="اسم المنشأة العضو"
                              value={m.name}
                              onChange={(e) => {
                                const next = [...(editingCluster.members || [])];
                                next[idx] = { ...next[idx], name: e.target.value };
                                setEditingCluster({ ...editingCluster, members: next });
                              }}
                              className="flex-1 px-3 py-1.5 rounded border border-slate-300 bg-white"
                            />
                            <input
                              type="text"
                              placeholder="اسم المالك / المسؤول"
                              value={m.owner}
                              onChange={(e) => {
                                const next = [...(editingCluster.members || [])];
                                next[idx] = { ...next[idx], owner: e.target.value };
                                setEditingCluster({ ...editingCluster, members: next });
                              }}
                              className="flex-1 px-3 py-1.5 rounded border border-slate-300 bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const next = (editingCluster.members || []).filter(
                                  (_, i) => i !== idx
                                );
                                setEditingCluster({ ...editingCluster, members: next });
                              }}
                              className="p-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setEditingCluster(null)}
                        className="px-4 py-2 rounded-xl border border-slate-300 font-bold"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 rounded-xl bg-[#0F253E] text-[#E5C168] font-black cursor-pointer"
                      >
                        حفظ التجمع والأعضاء
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SECTORS, ENTERPRISES & IDEMPOTENT IMPORT */}
        {activeTab === 'sectors_enterprises' && (
          <div className="space-y-6">
            {/* Idempotent Import Card */}
            <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-black text-[#9A7422] bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                  استيراد البيانات المرجعية القابل لإعادة التشغيل (Idempotent Seed)
                </span>
                <h3 className="text-base sm:text-lg font-black text-[#0F253E] mt-1">
                  مزامنة بيانات CLUSTERS_DB و PRODUCTS_DB
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  يتحقق من وجود الـ 14 منتجًا والـ 15 تجمعًا والـ 6 قطاعات، ويضيف أي سجل ناقص دون تكرار السجلات أو الكتابة فوق تعديلات الإدارة.
                </p>
              </div>
              <button
                type="button"
                onClick={handleReseed}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F253E] text-[#E5C168] hover:bg-[#1C4587] text-xs font-black shrink-0 cursor-pointer self-start sm:self-auto"
              >
                <Database className="w-4 h-4" />
                <span>تشغيل فحص واستيراد البيانات الآمن</span>
              </button>
            </div>

            {/* Sectors Management with Rating & Evaluation */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-base font-black text-[#0F253E]">
                    القطاعات الصناعية المشاركة وتقييماتها ({sectors.length})
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    يمكنك إضافة قطاع جديد أو تعديل تقييم أي قطاع (من 1 إلى 5 نجوم مع ملاحظة التقييم المعتمدة)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditingSector({
                      id: `SEC-${Date.now().toString().slice(-3)}`,
                      name: '',
                      unionName: '',
                      description: '',
                      sortOrder: sectors.length + 1,
                      status: 'published',
                      rating: 5,
                      ratingsCount: 1,
                      evaluationNote: 'قطاع صناعي معتمد ذو جاهزية إنتاجية عالية',
                    })
                  }
                  className="px-3.5 py-2 rounded-xl bg-[#0F253E] text-[#E5C168] text-xs font-black cursor-pointer hover:bg-[#1C4587]"
                >
                  + إضافة قطاع جديد مع تقييم
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sectors.map((s) => {
                  const secRating = Number(s.rating ?? 4.8);
                  const secCount = Number(s.ratingsCount ?? 12);
                  return (
                    <div
                      key={s.id}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-[#1C4587]">{s.unionName}</div>
                          <div className="text-sm font-black text-[#0F253E]">{s.name}</div>
                          <p className="text-xs text-slate-600 mt-1">{s.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingSector(s)}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-[#0F253E] text-xs font-extrabold shrink-0 cursor-pointer"
                        >
                          تعديل وتقييم
                        </button>
                      </div>

                      {/* Sector Star Rating Bar & Quick Rating Action */}
                      <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                title={`تقييم سريع بـ ${star} نجوم`}
                                onClick={async () => {
                                  const updated = {
                                    ...s,
                                    rating: star,
                                    ratingsCount: Math.max(1, secCount),
                                  };
                                  const res = await fetch(
                                    `/api/admin/sectors/${encodeURIComponent(s.id)}`,
                                    {
                                      method: 'PUT',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        Authorization: `Bearer ${token}`,
                                      },
                                      body: JSON.stringify(updated),
                                    }
                                  );
                                  if (res.ok) {
                                    await loadAdminOverview(token);
                                    onDataMutated();
                                    showToast(`تم تحديث تقييم قطاع «${s.name}» إلى ${star} نجوم.`);
                                  }
                                }}
                                className="p-0.5 hover:scale-125 transition-transform cursor-pointer"
                              >
                                <Star
                                  className={`w-4 h-4 ${
                                    star <= Math.round(secRating)
                                      ? 'text-amber-500 fill-amber-400'
                                      : 'text-slate-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                          <span className="text-xs font-black text-[#0F253E] tabular-nums">
                            {secRating.toFixed(1)}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            ({secCount} تقييم)
                          </span>
                        </div>

                        {s.evaluationNote && (
                          <span className="text-[11px] font-bold text-amber-900 bg-amber-100/80 px-2.5 py-0.5 rounded-md border border-amber-200">
                            {s.evaluationNote}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {editingSector && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const exists = sectors.some((sec) => sec.id === editingSector.id);
                    const url = exists
                      ? `/api/admin/sectors/${encodeURIComponent(editingSector.id!)}`
                      : '/api/admin/sectors';
                    const res = await fetch(url, {
                      method: exists ? 'PUT' : 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify(editingSector),
                    });
                    if (res.ok) {
                      setEditingSector(null);
                      await loadAdminOverview(token);
                      onDataMutated();
                      showToast('تم حفظ بيانات القطاع الصناعي وتقييمه بنجاح.');
                    }
                  }}
                  className="p-5 rounded-xl bg-amber-50/90 border-2 border-[#C8A24B] space-y-4 text-xs shadow-md"
                >
                  <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                    <h5 className="font-black text-sm text-[#0F253E]">
                      {sectors.some((sec) => sec.id === editingSector.id)
                        ? `تعديل وتقييم القطاع: ${editingSector.name}`
                        : 'إضافة قطاع صناعي جديد وتحديد تقييمه'}
                    </h5>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-extrabold text-[#0F253E] mb-1">اسم القطاع</label>
                      <input
                        type="text"
                        required
                        value={editingSector.name || ''}
                        onChange={(e) =>
                          setEditingSector({ ...editingSector, name: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-extrabold text-[#0F253E] mb-1">
                        الاتحاد التخصصي
                      </label>
                      <input
                        type="text"
                        required
                        value={editingSector.unionName || ''}
                        onChange={(e) =>
                          setEditingSector({ ...editingSector, unionName: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-extrabold text-[#0F253E] mb-1">وصف القطاع</label>
                    <textarea
                      rows={2}
                      value={editingSector.description || ''}
                      onChange={(e) =>
                        setEditingSector({ ...editingSector, description: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>

                  {/* Interactive Sector Rating & Note Controls */}
                  <div className="p-3.5 rounded-xl bg-white border border-amber-200 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                    <div>
                      <label className="block font-extrabold text-[#0F253E] mb-1.5">
                        تقييم القطاع (من 1 إلى 5 نجوم)
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() =>
                                setEditingSector({ ...editingSector, rating: star })
                              }
                              className="p-1 rounded hover:bg-amber-50 cursor-pointer transition-transform hover:scale-110"
                            >
                              <Star
                                className={`w-5 h-5 ${
                                  star <= Math.round(Number(editingSector.rating ?? 5))
                                    ? 'text-amber-500 fill-amber-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                        <input
                          type="number"
                          step="0.1"
                          min="1"
                          max="5"
                          value={editingSector.rating ?? 4.8}
                          onChange={(e) =>
                            setEditingSector({
                              ...editingSector,
                              rating: Math.min(5, Math.max(1, Number(e.target.value) || 5)),
                            })
                          }
                          className="w-16 px-2 py-1 rounded border border-slate-300 font-black text-center text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-extrabold text-[#0F253E] mb-1">
                        عدد التقييمات المسجلة
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={editingSector.ratingsCount ?? 1}
                        onChange={(e) =>
                          setEditingSector({
                            ...editingSector,
                            ratingsCount: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-extrabold text-[#0F253E] mb-1">
                        ملاحظة / شارة التقييم للقطاع (تظهر تحت القطاع)
                      </label>
                      <input
                        type="text"
                        value={editingSector.evaluationNote || ''}
                        onChange={(e) =>
                          setEditingSector({
                            ...editingSector,
                            evaluationNote: e.target.value,
                          })
                        }
                        placeholder="مثال: جودة تصنيع عالية والتزام بالتوريد"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingSector(null)}
                      className="px-4 py-2 rounded-lg border border-slate-300 bg-white font-bold"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-[#0F253E] text-[#E5C168] font-black cursor-pointer hover:bg-[#1C4587]"
                    >
                      حفظ القطاع والتقييم
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Enterprises Directory Management */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-black text-[#0F253E]">
                  سجل المنشآت الصناعية المستضيفة والأعضاء ({enterprises.length})
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    setEditingEnterprise({
                      id: `ENT-${Date.now().toString().slice(-4)}`,
                      name: '',
                      owner: '',
                      phone: '',
                      role: 'MEMBER',
                      clusterId: clusters[0]?.id || 'CL1',
                      governorate: 'غزة',
                      status: 'published',
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-[#0F253E] text-[#E5C168] text-xs font-bold cursor-pointer"
                >
                  + إضافة منشأة
                </button>
              </div>

              {editingEnterprise && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const exists = enterprises.some((ent) => ent.id === editingEnterprise.id);
                    const url = exists
                      ? `/api/admin/enterprises/${encodeURIComponent(editingEnterprise.id!)}`
                      : '/api/admin/enterprises';
                    const res = await fetch(url, {
                      method: exists ? 'PUT' : 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify(editingEnterprise),
                    });
                    if (res.ok) {
                      setEditingEnterprise(null);
                      await loadAdminOverview(token);
                      onDataMutated();
                      showToast('تم حفظ بيانات المنشأة الصناعية.');
                    }
                  }}
                  className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3 text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block font-bold mb-1">اسم المنشأة</label>
                      <input
                        type="text"
                        required
                        value={editingEnterprise.name || ''}
                        onChange={(e) =>
                          setEditingEnterprise({ ...editingEnterprise, name: e.target.value })
                        }
                        className="w-full px-3 py-1.5 rounded border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">المسؤول / المالك</label>
                      <input
                        type="text"
                        required
                        value={editingEnterprise.owner || ''}
                        onChange={(e) =>
                          setEditingEnterprise({ ...editingEnterprise, owner: e.target.value })
                        }
                        className="w-full px-3 py-1.5 rounded border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">التجمع</label>
                      <select
                        value={editingEnterprise.clusterId || 'CL1'}
                        onChange={(e) =>
                          setEditingEnterprise({
                            ...editingEnterprise,
                            clusterId: e.target.value,
                          })
                        }
                        className="w-full px-3 py-1.5 rounded border border-slate-300 bg-white"
                      >
                        {clusters.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.id} - {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold mb-1">الدور في التجمع</label>
                      <select
                        value={editingEnterprise.role || 'MEMBER'}
                        onChange={(e) =>
                          setEditingEnterprise({
                            ...editingEnterprise,
                            role: e.target.value as 'HOST' | 'MEMBER' | 'PRODUCER',
                          })
                        }
                        className="w-full px-3 py-1.5 rounded border border-slate-300 bg-white"
                      >
                        <option value="HOST">منشأة مستضيفة (HOST)</option>
                        <option value="MEMBER">منشأة عضو (MEMBER)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingEnterprise(null)}
                      className="px-3 py-1.5 rounded border border-slate-300 bg-white font-bold"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded bg-[#0F253E] text-[#E5C168] font-bold cursor-pointer"
                    >
                      حفظ المنشأة
                    </button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0">
                    <tr>
                      <th className="p-2.5 font-extrabold">المنشأة</th>
                      <th className="p-2.5 font-extrabold">المسؤول</th>
                      <th className="p-2.5 font-extrabold">الدور</th>
                      <th className="p-2.5 font-extrabold">التجمع</th>
                      <th className="p-2.5 font-extrabold">المحافظة</th>
                      <th className="p-2.5 font-extrabold">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {enterprises.map((ent) => (
                      <tr key={ent.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-[#0F253E]">{ent.name}</td>
                        <td className="p-2.5">{ent.owner}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ent.role === 'HOST'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {ent.role === 'HOST' ? 'منشأة مستضيفة' : 'عضو تجمع'}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono font-bold text-[#1C4587]">
                          {ent.clusterId}
                        </td>
                        <td className="p-2.5">{ent.governorate}</td>
                        <td className="p-2.5">
                          <button
                            type="button"
                            onClick={() => setEditingEnterprise(ent)}
                            className="text-[#1C4587] font-bold hover:underline cursor-pointer"
                          >
                            تعديل
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: HOMEPAGE CONTENT & EXCHANGE RATE SETTINGS */}
        {activeTab === 'homepage_settings' && settings && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-[#0F253E]">
                    إعدادات الصفحة الرئيسية التعريفية وسعر الصرف
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    عدّل النصوص الافتتاحية، سعر صرف الدولار مقابل الشيكل، وصور المقدمة والشركاء
                  </p>
                </div>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F253E] text-[#E5C168] hover:bg-[#1C4587] text-xs font-black shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ التعديلات</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-extrabold text-[#0F253E] mb-1">
                    الاسم الرسمي للمشروع (في الترويسة والمقدمة)
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.officialProjectName}
                    onChange={(e) =>
                      setSettings({ ...settings, officialProjectName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-bold"
                  />
                </div>

                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                  <label className="block font-black text-[#9A7422] mb-1">
                    سعر صرف الدولار مقابل الشيكل (₪ / $)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="1"
                    required
                    value={settings.exchangeRate}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        exchangeRate: Number(e.target.value) || 3.1,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border-2 border-[#0F253E] bg-white font-black text-sm text-[#0F253E]"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    السعر المرجعي الأولي في الملف: 3.1 شيكل للدولار
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="sm:col-span-1">
                  <label className="block font-extrabold text-[#0F253E] mb-1">
                    العنوان الرئيسي في المقدمة (Hero Title)
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.heroTitle}
                    onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-[#0F253E] mb-1">
                    نص الزر الرئيسي (Primary CTA)
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.primaryCtaText}
                    onChange={(e) =>
                      setSettings({ ...settings, primaryCtaText: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-[#0F253E] mb-1">
                    نص الزر الثانوي (Secondary CTA)
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.secondaryCtaText}
                    onChange={(e) =>
                      setSettings({ ...settings, secondaryCtaText: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block font-extrabold text-[#0F253E] mb-1">
                  النبذة التعريفية في الصفحة الرئيسية (قابلة للتعديل)
                </label>
                <textarea
                  rows={3}
                  required
                  value={settings.introText}
                  onChange={(e) => setSettings({ ...settings, introText: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 leading-relaxed"
                />
              </div>

              {/* Hero Showcase Images */}
              <div className="space-y-2 text-xs">
                <label className="block font-extrabold text-[#0F253E]">
                  صور المنتجات المعروضة في مقدمة الصفحة الرئيسية (4 صور):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(settings.heroImages || []).slice(0, 4).map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                    >
                      <img
                        src={imgUrl}
                        alt={`صورة ${idx + 1}`}
                        className="w-full h-28 object-cover rounded-lg border border-slate-200 bg-white"
                      />
                      <label className="w-full py-1.5 px-2 rounded bg-[#0F253E] text-[#E5C168] font-bold flex items-center justify-center gap-1 cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>تغيير الصورة</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              handleFileUpload(f, (newUrl) => {
                                const next = [...(settings.heroImages || [])];
                                next[idx] = newUrl;
                                setSettings({ ...settings, heroImages: next });
                              });
                            }
                          }}
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </form>
        )}

        {/* TAB 7: USERS & RBAC MANAGEMENT (ADMIN ONLY) */}
        {activeTab === 'users' && currentUser.role === 'admin' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-lg font-black text-[#0F253E]">
                إدارة المستخدمين وصلاحيات النظام (RBAC)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                صلاحية «مدير النظام» تتيح إدارة المستخدمين والإعدادات الكاملة، بينما صلاحية «محرّر» مخصصة لإدارة المحتوى ومتابعة طلبات عروض الأسعار
              </p>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const res = await fetch('/api/admin/users', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(newUserForm),
                  });
                  const data = await res.json();
                  if (res.ok) {
                    setUsers(data.users);
                    setNewUserForm({ name: '', email: '', password: '', role: 'editor' });
                    showToast('تم إنشاء حساب المستخدم الجديد بنجاح.');
                  } else {
                    showToast(data.error || 'تعذّر إنشاء الحساب.');
                  }
                }}
                className="grid grid-cols-1 sm:grid-cols-5 gap-3 mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <input
                  type="text"
                  required
                  placeholder="الاسم الكامل"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-slate-300 bg-white"
                />
                <input
                  type="email"
                  required
                  placeholder="البريد الإلكتروني"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-slate-300 bg-white"
                />
                <div className="relative">
                  <input
                    type={showNewUserPassword ? 'text' : 'password'}
                    required
                    placeholder="كلمة المرور"
                    value={newUserForm.password}
                    onChange={(e) =>
                      setNewUserForm({ ...newUserForm, password: e.target.value })
                    }
                    className="w-full pr-3 pl-9 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewUserPassword((prev) => !prev)}
                    title={showNewUserPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    className="absolute inset-y-0 left-0 px-2.5 flex items-center text-slate-500 hover:text-[#0F253E] cursor-pointer"
                  >
                    {showNewUserPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <select
                  value={newUserForm.role}
                  onChange={(e) =>
                    setNewUserForm({
                      ...newUserForm,
                      role: e.target.value as 'admin' | 'editor',
                    })
                  }
                  className="px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold"
                >
                  <option value="editor">محرّر (إدارة المحتوى والطلبات)</option>
                  <option value="admin">مدير النظام (صلاحيات كاملة)</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0F253E] text-[#E5C168] font-black cursor-pointer"
                >
                  + إضافة مستخدم
                </button>
              </form>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#0F253E] text-white">
                  <tr>
                    <th className="p-3.5 font-extrabold">الاسم</th>
                    <th className="p-3.5 font-extrabold">البريد الإلكتروني</th>
                    <th className="p-3.5 font-extrabold">الدور / الصلاحية</th>
                    <th className="p-3.5 font-extrabold">الحالة</th>
                    <th className="p-3.5 font-extrabold">تاريخ الإنشاء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-black text-[#0F253E]">{u.name}</td>
                      <td className="p-3.5 font-mono">{u.email}</td>
                      <td className="p-3.5">
                        <select
                          value={u.role}
                          onChange={async (e) => {
                            const res = await fetch(`/api/admin/users/${u.id}`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                              },
                              body: JSON.stringify({
                                name: u.name,
                                role: e.target.value,
                                active: u.active,
                              }),
                            });
                            if (res.ok) {
                              const data = await res.json();
                              setUsers(data.users);
                              showToast('تم تحديث صلاحية المستخدم.');
                            }
                          }}
                          className="px-2.5 py-1 rounded border border-slate-300 bg-white font-bold"
                        >
                          <option value="admin">مدير النظام</option>
                          <option value="editor">محرّر</option>
                        </select>
                      </td>
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={async () => {
                            const res = await fetch(`/api/admin/users/${u.id}`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                              },
                              body: JSON.stringify({
                                name: u.name,
                                role: u.role,
                                active: !u.active,
                              }),
                            });
                            if (res.ok) {
                              const data = await res.json();
                              setUsers(data.users);
                              showToast('تم تحديث حالة تفعيل الحساب.');
                            }
                          }}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold cursor-pointer ${
                            u.active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {u.active ? 'مفعّل' : 'موقوف'}
                        </button>
                      </td>
                      <td className="p-3.5 text-slate-500">{u.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
