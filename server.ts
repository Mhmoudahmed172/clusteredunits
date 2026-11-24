import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  db,
  seedDatabase,
  hashPassword,
  getSettings,
  updateSettings,
  getSectors,
  getClusters,
  getEnterprises,
  getProducts,
  getProductById,
  createRfqOrder,
  getBuyerRfqOrders,
  getRfqOrders,
  mapRfqRow,
  getAdminReports,
  getUsers,
} from './src/server/db.ts';
import type {
  BuyerAccount,
  ContractMode,
  ProductDocument,
  ProductTier,
  RfqStatus,
  UserAccount,
} from './src/types.ts';

// Ensure database is initialized and seeded idempotently on startup
const seedResult = seedDatabase();
console.log(
  `[Database] Ready. Seeded clusters: ${seedResult.insertedClusters}, products: ${seedResult.insertedProducts}, preserved admin edits: ${seedResult.skippedAdminModified}`
);

interface AuthedRequest extends Request {
  user?: UserAccount;
}

interface BuyerAuthedRequest extends Request {
  buyer?: BuyerAccount;
}

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  if (typeof req.query.token === 'string' && req.query.token) {
    return req.query.token;
  }
  return null;
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'يرجى تسجيل الدخول للوصول إلى لوحة الإدارة.' });
    return;
  }

  const session = db
    .prepare(
      `SELECT s.token, s.expires_at, u.id, u.email, u.name, u.role, u.active, u.created_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`
    )
    .get(token) as Record<string, unknown> | undefined;

  if (!session || !session.active) {
    res.status(401).json({ error: 'انتهت صلاحية الجلسة أو الحساب غير مفعل.' });
    return;
  }

  req.user = {
    id: Number(session.id),
    email: String(session.email),
    name: String(session.name),
    role: (session.role as 'admin' | 'editor') || 'editor',
    active: Boolean(session.active),
    createdAt: String(session.created_at),
  };
  next();
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'هذه الصلاحية مخصصة لمدير النظام فقط.' });
    return;
  }
  next();
}

function requireBuyerAuth(req: BuyerAuthedRequest, res: Response, next: NextFunction): void {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({
      error: 'يرجى تسجيل الدخول بحساب المشتري لإرسال طلب عرض السعر والتعاقد.',
    });
    return;
  }

  const session = db
    .prepare(
      `SELECT bs.token, bs.expires_at, b.id, b.name, b.organization, b.email, b.phone, b.created_at
       FROM buyer_sessions bs
       JOIN buyers b ON b.id = bs.buyer_id
       WHERE bs.token = ?`
    )
    .get(token) as Record<string, unknown> | undefined;

  if (!session) {
    res.status(401).json({
      error: 'انتهت صلاحية جلسة المشتري، يرجى تسجيل الدخول مجددًا.',
    });
    return;
  }

  req.buyer = {
    id: Number(session.id),
    name: String(session.name),
    organization: String(session.organization),
    email: String(session.email),
    phone: String(session.phone),
    createdAt: String(session.created_at),
  };
  next();
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));

  // Serve static files from /public (including /uploads)
  const publicDir = path.resolve(process.cwd(), 'public');
  app.use(express.static(publicDir));

  // ==========================================================================
  // PUBLIC API ROUTES
  // ==========================================================================

  app.get('/api/public/bootstrap', (_req: Request, res: Response) => {
    try {
      const settings = getSettings();
      const sectors = getSectors(true);
      const clusters = getClusters(true);
      const products = getProducts(true);
      const enterprises = getEnterprises().filter((e) => e.status === 'published');

      res.json({
        settings,
        sectors,
        clusters,
        products,
        stats: {
          publishedProductsCount: products.length,
          integratedProductsCount: products.filter((p) => p.prodScope === 'INTEGRATED').length,
          publishedClustersCount: clusters.length,
          activeSectorsCount: sectors.length,
          enterprisesCount: enterprises.length || 52,
        },
      });
    } catch (err) {
      console.error('Error in /api/public/bootstrap:', err);
      res.status(500).json({ error: 'حدث خطأ أثناء تحميل بيانات المنصة.' });
    }
  });

  // ==========================================================================
  // BUYER ACCOUNT ROUTES (Free Buyer Registration, Login, Profile & Orders)
  // ==========================================================================

  app.post('/api/buyer/register', (req: Request, res: Response) => {
    try {
      const { name, organization, email, phone, password } = req.body || {};
      if (!name || String(name).trim().length < 2) {
        res.status(400).json({ error: 'يرجى إدخال اسم الشخص المسؤول.' });
        return;
      }
      if (!organization || String(organization).trim().length < 2) {
        res.status(400).json({ error: 'يرجى إدخال اسم الجهة / المؤسسة / الشركة.' });
        return;
      }
      if (!email || !String(email).includes('@')) {
        res.status(400).json({ error: 'يرجى إدخال بريد إلكتروني صحيح.' });
        return;
      }
      if (!phone || String(phone).trim().length < 6) {
        res.status(400).json({ error: 'يرجى إدخال رقم الهاتف للتواصل.' });
        return;
      }
      if (!password || String(password).length < 4) {
        res.status(400).json({ error: 'يرجى اختيار كلمة مرور (4 خانات على الأقل).' });
        return;
      }

      const cleanEmail = String(email).toLowerCase().trim();
      const existing = db
        .prepare('SELECT id FROM buyers WHERE email = ?')
        .get(cleanEmail) as { id: number } | undefined;

      if (existing) {
        res.status(400).json({
          error: 'هذا البريد الإلكتروني مسجل مسبقًا. يرجى التبديل إلى تبويب تسجيل الدخول.',
        });
        return;
      }

      const result = db
        .prepare(
          'INSERT INTO buyers (name, organization, email, phone, password_hash) VALUES (?, ?, ?, ?, ?)'
        )
        .run(
          String(name).trim(),
          String(organization).trim(),
          cleanEmail,
          String(phone).trim(),
          hashPassword(String(password))
        );

      const buyerId = Number(result.lastInsertRowid);
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();

      db.prepare('INSERT INTO buyer_sessions (token, buyer_id, expires_at) VALUES (?, ?, ?)').run(
        token,
        buyerId,
        expiresAt
      );

      const buyerRow = db.prepare('SELECT * FROM buyers WHERE id = ?').get(buyerId) as Record<
        string,
        unknown
      >;

      res.status(201).json({
        token,
        buyer: {
          id: Number(buyerRow.id),
          name: String(buyerRow.name),
          organization: String(buyerRow.organization),
          email: String(buyerRow.email),
          phone: String(buyerRow.phone),
          createdAt: String(buyerRow.created_at),
        },
      });
    } catch (err) {
      console.error('Buyer register error:', err);
      res.status(500).json({ error: 'تعذّر إنشاء حساب المشتري. يرجى المحاولة مجددًا.' });
    }
  });

  app.post('/api/buyer/login', (req: Request, res: Response) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' });
        return;
      }

      const cleanEmail = String(email).toLowerCase().trim();
      const buyerRow = db
        .prepare('SELECT * FROM buyers WHERE email = ?')
        .get(cleanEmail) as Record<string, unknown> | undefined;

      if (!buyerRow || hashPassword(String(password)) !== String(buyerRow.password_hash)) {
        res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' });
        return;
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();

      db.prepare('INSERT INTO buyer_sessions (token, buyer_id, expires_at) VALUES (?, ?, ?)').run(
        token,
        Number(buyerRow.id),
        expiresAt
      );

      res.json({
        token,
        buyer: {
          id: Number(buyerRow.id),
          name: String(buyerRow.name),
          organization: String(buyerRow.organization),
          email: String(buyerRow.email),
          phone: String(buyerRow.phone),
          createdAt: String(buyerRow.created_at),
        },
      });
    } catch (err) {
      console.error('Buyer login error:', err);
      res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول.' });
    }
  });

  app.post('/api/buyer/logout', (req: Request, res: Response) => {
    const token = getBearerToken(req);
    if (token) {
      db.prepare('DELETE FROM buyer_sessions WHERE token = ?').run(token);
    }
    res.json({ ok: true });
  });

  app.get('/api/buyer/me', requireBuyerAuth, (req: BuyerAuthedRequest, res: Response) => {
    res.json({ buyer: req.buyer });
  });

  app.get('/api/buyer/rfqs', requireBuyerAuth, (req: BuyerAuthedRequest, res: Response) => {
    try {
      const orders = getBuyerRfqOrders(req.buyer!);
      res.json({ orders });
    } catch (err) {
      console.error('Buyer RFQs error:', err);
      res.status(500).json({ error: 'تعذّر جلب قائمة طلباتك.' });
    }
  });

  // ==========================================================================
  // RFQ SUBMISSION & LOOKUP ROUTES
  // ==========================================================================

  app.post('/api/public/rfq', requireBuyerAuth, (req: BuyerAuthedRequest, res: Response) => {
    try {
      const {
        idempotencyKey,
        productId,
        buyerOrg,
        contactPerson,
        contactInfo,
        quantity,
        contractMode,
        currency,
        notes,
      } = req.body || {};

      if (!productId || typeof productId !== 'string') {
        res.status(400).json({ error: 'يرجى تحديد المنتج المطلوب.' });
        return;
      }

      const finalOrg = String(buyerOrg || req.buyer?.organization || '').trim();
      const finalPerson = String(contactPerson || req.buyer?.name || '').trim();
      const finalContact = String(
        contactInfo || `${req.buyer?.phone || ''} | ${req.buyer?.email || ''}`
      ).trim();

      if (finalOrg.length < 2) {
        res.status(400).json({ error: 'يرجى إدخال اسم الجهة أو المؤسسة الطالبة بشكل صحيح.' });
        return;
      }
      if (finalPerson.length < 2) {
        res.status(400).json({ error: 'يرجى إدخال اسم الشخص المسؤول عن التواصل.' });
        return;
      }
      if (finalContact.length < 5) {
        res.status(400).json({ error: 'يرجى إدخال رقم هاتف أو بريد إلكتروني صحيح للتواصل.' });
        return;
      }

      const parsedQty = Math.floor(Number(quantity));
      if (!Number.isFinite(parsedQty) || parsedQty < 1) {
        res.status(400).json({ error: 'يرجى إدخال كمية صحيحة (1 فأكثر).' });
        return;
      }

      const validMode: ContractMode =
        contractMode === 'مصنعية فقط' ? 'مصنعية فقط' : 'توريد شامل';

      const order = createRfqOrder({
        idempotencyKey: typeof idempotencyKey === 'string' ? idempotencyKey : undefined,
        buyerId: req.buyer?.id,
        buyerEmail: req.buyer?.email,
        productId,
        buyerOrg: finalOrg,
        contactPerson: finalPerson,
        contactInfo: finalContact,
        quantity: parsedQty,
        contractMode: validMode,
        currency: currency === 'ILS' ? 'ILS' : 'USD',
        notes: typeof notes === 'string' ? notes : '',
      });

      res.status(201).json({ order });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'تعذّر حفظ طلب عرض السعر. يرجى المحاولة مرة أخرى.';
      res.status(400).json({ error: message });
    }
  });

  app.get('/api/public/rfq/:refNumber', (req: Request, res: Response) => {
    const row = db
      .prepare('SELECT * FROM rfq_orders WHERE UPPER(ref_number) = UPPER(?)')
      .get(req.params.refNumber) as Record<string, unknown> | undefined;
    if (!row) {
      res.status(404).json({ error: 'لم يتم العثور على طلب بهذا الرقم المرجعي.' });
      return;
    }
    res.json({ order: mapRfqRow(row, true) });
  });

  // ==========================================================================
  // ADMIN AUTHENTICATION ROUTES
  // ==========================================================================

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' });
      return;
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const userRow = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(cleanEmail) as Record<string, unknown> | undefined;

    if (!userRow || !userRow.active) {
      res.status(401).json({ error: 'بيانات الدخول غير صحيحة أو الحساب غير مفعل.' });
      return;
    }

    const hashed = hashPassword(String(password));
    if (hashed !== String(userRow.password_hash)) {
      res.status(401).json({ error: 'بيانات الدخول غير صحيحة.' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

    db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(
      token,
      Number(userRow.id),
      expiresAt
    );

    res.json({
      token,
      user: {
        id: Number(userRow.id),
        email: String(userRow.email),
        name: String(userRow.name),
        role: (userRow.role as 'admin' | 'editor') || 'editor',
        active: Boolean(userRow.active),
        createdAt: String(userRow.created_at),
      },
    });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const token = getBearerToken(req);
    if (token) {
      db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    }
    res.json({ ok: true });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res: Response) => {
    res.json({ user: req.user });
  });

  // ==========================================================================
  // ADMIN API ROUTES
  // ==========================================================================

  app.get('/api/admin/overview', requireAuth, (_req: AuthedRequest, res: Response) => {
    try {
      res.json({
        settings: getSettings(),
        sectors: getSectors(false),
        clusters: getClusters(false),
        enterprises: getEnterprises(),
        products: getProducts(false),
        rfqs: getRfqOrders(),
      });
    } catch (err) {
      console.error('Error in /api/admin/overview:', err);
      res.status(500).json({ error: 'تعذّر جلب بيانات لوحة الإدارة.' });
    }
  });

  app.get('/api/admin/reports', requireAuth, (req: AuthedRequest, res: Response) => {
    try {
      const { dateFrom, dateTo, sector, clusterId, status, granularity } = req.query;
      const reports = getAdminReports({
        dateFrom: typeof dateFrom === 'string' && dateFrom ? dateFrom : undefined,
        dateTo: typeof dateTo === 'string' && dateTo ? dateTo : undefined,
        sector: typeof sector === 'string' ? sector : undefined,
        clusterId: typeof clusterId === 'string' ? clusterId : undefined,
        status: typeof status === 'string' ? status : undefined,
        granularity: granularity === 'monthly' ? 'monthly' : 'weekly',
      });
      res.json(reports);
    } catch (err) {
      console.error('Error in /api/admin/reports:', err);
      res.status(500).json({ error: 'حدث خطأ أثناء حساب المؤشرات والتقارير.' });
    }
  });

  app.get('/api/admin/reports/csv', requireAuth, (req: AuthedRequest, res: Response) => {
    try {
      const { dateFrom, dateTo, sector, clusterId, status, search } = req.query;
      const rfqs = getRfqOrders({
        dateFrom: typeof dateFrom === 'string' && dateFrom ? dateFrom : undefined,
        dateTo: typeof dateTo === 'string' && dateTo ? dateTo : undefined,
        sector: typeof sector === 'string' ? sector : undefined,
        clusterId: typeof clusterId === 'string' ? clusterId : undefined,
        status: typeof status === 'string' ? status : undefined,
        search: typeof search === 'string' ? search : undefined,
      });

      const headers = [
        'الرقم المرجعي',
        'تاريخ الطلب',
        'الحالة',
        'الجهة الطالبة',
        'الشخص المسؤول',
        'بيانات التواصل',
        'معرف المنتج',
        'اسم المنتج',
        'القطاع الأساسي المحتسب',
        'التجمع العنقودي',
        'المنشأة المنتجة',
        'نمط التعاقد',
        'الكمية',
        'الوحدة',
        'الشريحة المطبقة',
        'سعر الوحدة (دولار)',
        'الإجمالي التقديري (دولار)',
        'عملة العرض وقت الطلب',
        'سعر الصرف وقت الطلب',
        'الإجمالي بعملة العرض',
        'ملاحظات الجهة الطالبة',
        'ملاحظات الإدارة الداخلية',
      ];

      const escapeCsv = (val: unknown) => {
        const str = val === null || val === undefined ? '' : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      };

      const rows = rfqs.map((r) =>
        [
          r.refNumber,
          r.createdAt,
          r.status,
          r.buyerOrg,
          r.contactPerson,
          r.contactInfo,
          r.productId,
          r.productTitle,
          r.attributedSector,
          r.clusterName,
          r.enterpriseName,
          r.contractMode,
          r.quantity,
          r.unit,
          r.appliedTierLabel,
          r.unitPriceUsd,
          r.totalPriceUsd,
          r.currencyAtSubmit,
          r.exchangeRateAtSubmit,
          r.totalPriceDisplay,
          r.notes,
          r.internalNotes,
        ]
          .map(escapeCsv)
          .join(',')
      );

      const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="gaza-clusters-rfq-report.csv"');
      res.send(csvContent);
    } catch (err) {
      console.error('Error generating CSV:', err);
      res.status(500).json({ error: 'تعذّر تصدير ملف CSV.' });
    }
  });

  // Media Upload Endpoint (Images, Video, PDF & Document Files)
  app.post('/api/admin/upload', requireAuth, (req: AuthedRequest, res: Response) => {
    try {
      const { dataUrl, filename } = req.body || {};
      if (!dataUrl || typeof dataUrl !== 'string') {
        res.status(400).json({ error: 'بيانات الملف غير صالحة.' });
        return;
      }

      const match = dataUrl.match(/^data:([^;]*)(?:;[^;]*)*;base64,(.+)$/i);
      if (!match) {
        res.status(400).json({
          error: 'صيغة الملف غير صالحة. يرجى رفع صورة أو فيديو أو ملف مواصفات.',
        });
        return;
      }

      const fullMime = (match[1] || 'application/octet-stream').toLowerCase();
      const origExt =
        typeof filename === 'string' && filename.includes('.')
          ? filename.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || ''
          : '';

      let ext = origExt || 'bin';
      if (fullMime === 'application/pdf') {
        ext = 'pdf';
      } else if (fullMime.startsWith('video/')) {
        ext = fullMime === 'video/quicktime' ? 'mov' : origExt || fullMime.split('/')[1] || 'mp4';
      } else if (fullMime.startsWith('image/')) {
        const sub = fullMime.split('/')[1];
        ext = sub === 'jpeg' || sub === 'jpg' ? 'jpg' : sub === 'svg+xml' ? 'svg' : origExt || sub;
      }

      const buffer = Buffer.from(match[2], 'base64');
      const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
      fs.mkdirSync(uploadsDir, { recursive: true });

      const cleanBase =
        typeof filename === 'string'
          ? filename
              .replace(/\.[^/.]+$/, '')
              .replace(/[^a-zA-Z0-9_-]/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '')
              .slice(0, 32)
          : 'file';
      const uniqueName = `${cleanBase || 'upload'}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 6)}.${ext}`;
      const filePath = path.join(uploadsDir, uniqueName);

      fs.writeFileSync(filePath, buffer);
      res.json({
        url: `/uploads/${uniqueName}`,
        filename: typeof filename === 'string' && filename.trim() ? filename.trim() : uniqueName,
      });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ error: 'تعذّر رفع الملف إلى الخادم.' });
    }
  });

  // Idempotent Re-seed Endpoint
  app.post('/api/admin/reseed', requireAuth, (_req: AuthedRequest, res: Response) => {
    try {
      const result = seedDatabase();
      res.json({
        message: 'تمت عملية التحقق والاستيراد الآمن دون المساس بالتعديلات الإدارية أو تكرار السجلات.',
        result,
      });
    } catch (err) {
      console.error('Reseed error:', err);
      res.status(500).json({ error: 'تعذّر تشغيل الاستيراد.' });
    }
  });

  function normalizeProductMediaPayload(
    p: Record<string, unknown>,
    existing?: {
      image: string;
      galleryImages?: string[];
      videoUrl?: string;
      videoUrls?: string[];
      specPdfUrl?: string;
      documents?: ProductDocument[];
    }
  ) {
    // 1. Images (Primary image + additional galleryImages)
    const rawGallery: string[] = Array.isArray(p.galleryImages)
      ? p.galleryImages.map((x: unknown) => String(x || '').trim()).filter(Boolean)
      : existing?.galleryImages || [];
    const providedImage =
      p.image !== undefined ? String(p.image || '').trim() : String(existing?.image || '').trim();
    const mainImage = providedImage || rawGallery[0] || '';
    const galleryImages = Array.from(new Set(rawGallery.filter((u) => u !== mainImage)));

    // 2. Videos (videoUrls array + primary videoUrl)
    let videoUrls: string[] = [];
    if (Array.isArray(p.videoUrls)) {
      videoUrls = p.videoUrls.map((v: unknown) => String(v || '').trim()).filter(Boolean);
    } else if (p.videoUrl !== undefined) {
      const singleVid = String(p.videoUrl || '').trim();
      videoUrls = singleVid ? [singleVid] : [];
    } else if (existing?.videoUrls) {
      videoUrls = existing.videoUrls;
    } else if (existing?.videoUrl) {
      videoUrls = [existing.videoUrl];
    }
    if (typeof p.videoUrl === 'string' && p.videoUrl.trim() && !videoUrls.includes(p.videoUrl.trim())) {
      videoUrls = [p.videoUrl.trim(), ...videoUrls];
    }
    videoUrls = Array.from(new Set(videoUrls));
    const primaryVideoUrl = videoUrls[0] || '';

    // 3. Documents (documents array + primary specPdfUrl)
    let documents: ProductDocument[] = [];
    if (Array.isArray(p.documents)) {
      documents = p.documents
        .map((d: unknown) => {
          if (typeof d === 'string' && d.trim()) {
            const url = d.trim();
            return { name: url.split('/').pop() || 'ملف مرفق', url };
          }
          if (d && typeof d === 'object' && 'url' in d) {
            const obj = d as { name?: unknown; url?: unknown; type?: unknown };
            const url = String(obj.url || '').trim();
            if (!url) return null;
            const name =
              typeof obj.name === 'string' && obj.name.trim()
                ? obj.name.trim()
                : url.split('/').pop() || 'مستند مرفق';
            const type = typeof obj.type === 'string' ? obj.type : undefined;
            return { name, url, type };
          }
          return null;
        })
        .filter((d): d is ProductDocument => d !== null);
    } else if (p.specPdfUrl !== undefined) {
      const singleDoc = String(p.specPdfUrl || '').trim();
      documents = singleDoc
        ? [{ name: singleDoc.split('/').pop() || 'ملف المواصفات الفنية', url: singleDoc }]
        : [];
    } else if (existing?.documents) {
      documents = existing.documents;
    }
    if (
      typeof p.specPdfUrl === 'string' &&
      p.specPdfUrl.trim() &&
      !documents.some((d) => d.url === p.specPdfUrl)
    ) {
      const sUrl = p.specPdfUrl.trim();
      documents = [{ name: sUrl.split('/').pop() || 'ملف المواصفات الفنية', url: sUrl }, ...documents];
    }
    const primarySpecPdfUrl = documents[0]?.url || '';

    return {
      mainImage,
      galleryImages,
      primaryVideoUrl,
      videoUrls,
      primarySpecPdfUrl,
      documents,
    };
  }

  // Products CRUD
  app.post('/api/admin/products', requireAuth, (req: AuthedRequest, res: Response) => {
    try {
      const p = req.body || {};
      const id = (p.id ? String(p.id).trim() : `PRD-${Date.now().toString().slice(-4)}`).toUpperCase();

      const existing = getProductById(id);
      if (existing) {
        res.status(400).json({ error: `معرّف المنتج ${id} مستخدم مسبقًا.` });
        return;
      }

      const tiers: ProductTier[] =
        Array.isArray(p.tiers) && p.tiers.length > 0
          ? p.tiers
          : [
              {
                tierIndex: 0,
                label: '١ - ٤٩',
                minQty: 1,
                priceUsd: Number(p.priceUsd) || 10,
                discountTag: 'سعر أساسي',
              },
              {
                tierIndex: 1,
                label: '٥٠ - ١٩٩',
                minQty: 50,
                priceUsd: Number(((Number(p.priceUsd) || 10) * 0.93).toFixed(2)),
                discountTag: 'خصم 7%',
              },
              {
                tierIndex: 2,
                label: '+٢٠٠',
                minQty: 200,
                priceUsd: Number(((Number(p.priceUsd) || 10) * 0.86).toFixed(2)),
                discountTag: 'خصم 14%',
              },
            ];

      const basePrice = Number(tiers[0]?.priceUsd ?? p.priceUsd ?? 0);
      const media = normalizeProductMediaPayload(p);

      db.prepare(
        `INSERT INTO products (
          id, title, sector, prod_scope, scope_badge, cluster_id, cluster_name,
          enterprise_name, enterprise_owner, enterprise_phone, union_name,
          price_usd, unit, daily_capacity, sample_available, image, gallery_images,
          video_url, video_urls, spec_pdf_url, documents,
          price_saving_highlight, quality_edge_highlight, description, manufacturing_specs,
          status, is_featured, updated_by_admin
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
      ).run(
        id,
        String(p.title || '').trim(),
        String(p.sector || '').trim(),
        p.prodScope === 'INTEGRATED' ? 'INTEGRATED' : 'SINGLE',
        String(
          p.scopeBadge ||
            (p.prodScope === 'INTEGRATED' ? 'منتج تكاملي (عدة قطاعات)' : 'منتج قطاعي')
        ).trim(),
        String(p.clusterId || '').trim(),
        String(p.clusterName || '').trim(),
        String(p.enterpriseName || '').trim(),
        String(p.enterpriseOwner || '').trim(),
        String(p.enterprisePhone || '').trim(),
        String(p.unionName || '').trim(),
        basePrice,
        String(p.unit || 'قطعة').trim(),
        String(p.dailyCapacity || '').trim(),
        p.sampleAvailable ? 1 : 0,
        media.mainImage,
        JSON.stringify(media.galleryImages),
        media.primaryVideoUrl,
        JSON.stringify(media.videoUrls),
        media.primarySpecPdfUrl,
        JSON.stringify(media.documents),
        String(p.priceSavingHighlight || '').trim(),
        String(p.qualityEdgeHighlight || '').trim(),
        String(p.description || '').trim(),
        String(p.manufacturingSpecs || '').trim(),
        p.status || 'published',
        p.isFeatured ? 1 : 0
      );

      const insertTier = db.prepare(
        'INSERT INTO product_tiers (product_id, tier_index, label, min_qty, price_usd, discount_tag) VALUES (?, ?, ?, ?, ?, ?)'
      );
      tiers.forEach((t, idx) => {
        insertTier.run(
          id,
          idx,
          String(t.label || `شريحة ${idx + 1}`),
          Math.max(1, Number(t.minQty) || 1),
          Number(t.priceUsd) || basePrice,
          String(t.discountTag || 'سعر أساسي')
        );
      });

      res.status(201).json({ product: getProductById(id) });
    } catch (err) {
      console.error('Create product error:', err);
      res.status(500).json({ error: 'تعذّر إضافة المنتج.' });
    }
  });

  app.put('/api/admin/products/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    try {
      const id = req.params.id;
      const existing = getProductById(id);
      if (!existing) {
        res.status(404).json({ error: 'المنتج غير موجود.' });
        return;
      }

      const p = req.body || {};
      const tiers: ProductTier[] =
        Array.isArray(p.tiers) && p.tiers.length > 0 ? p.tiers : existing.tiers;
      const basePrice = Number(tiers[0]?.priceUsd ?? p.priceUsd ?? existing.priceUsd);
      const media = normalizeProductMediaPayload(p, existing);

      db.prepare(
        `UPDATE products SET
          title = ?, sector = ?, prod_scope = ?, scope_badge = ?, cluster_id = ?, cluster_name = ?,
          enterprise_name = ?, enterprise_owner = ?, enterprise_phone = ?, union_name = ?,
          price_usd = ?, unit = ?, daily_capacity = ?, sample_available = ?, image = ?,
          gallery_images = ?, video_url = ?, video_urls = ?, spec_pdf_url = ?, documents = ?,
          price_saving_highlight = ?, quality_edge_highlight = ?, description = ?, manufacturing_specs = ?,
          status = ?, is_featured = ?, updated_by_admin = 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).run(
        String(p.title ?? existing.title).trim(),
        String(p.sector ?? existing.sector).trim(),
        p.prodScope === 'INTEGRATED' ? 'INTEGRATED' : 'SINGLE',
        String(p.scopeBadge ?? existing.scopeBadge).trim(),
        String(p.clusterId ?? existing.clusterId).trim(),
        String(p.clusterName ?? existing.clusterName).trim(),
        String(p.enterpriseName ?? existing.enterpriseName).trim(),
        String(p.enterpriseOwner ?? existing.enterpriseOwner).trim(),
        String(p.enterprisePhone ?? existing.enterprisePhone).trim(),
        String(p.unionName ?? existing.unionName).trim(),
        basePrice,
        String(p.unit ?? existing.unit).trim(),
        String(p.dailyCapacity ?? existing.dailyCapacity).trim(),
        p.sampleAvailable !== undefined
          ? p.sampleAvailable
            ? 1
            : 0
          : existing.sampleAvailable
          ? 1
          : 0,
        media.mainImage,
        JSON.stringify(media.galleryImages),
        media.primaryVideoUrl,
        JSON.stringify(media.videoUrls),
        media.primarySpecPdfUrl,
        JSON.stringify(media.documents),
        String(p.priceSavingHighlight ?? existing.priceSavingHighlight).trim(),
        String(p.qualityEdgeHighlight ?? existing.qualityEdgeHighlight).trim(),
        String(p.description ?? existing.description).trim(),
        String(p.manufacturingSpecs ?? existing.manufacturingSpecs).trim(),
        p.status ?? existing.status,
        p.isFeatured !== undefined ? (p.isFeatured ? 1 : 0) : existing.isFeatured ? 1 : 0,
        id
      );

      db.prepare('DELETE FROM product_tiers WHERE product_id = ?').run(id);
      const insertTier = db.prepare(
        'INSERT INTO product_tiers (product_id, tier_index, label, min_qty, price_usd, discount_tag) VALUES (?, ?, ?, ?, ?, ?)'
      );
      tiers.forEach((t, idx) => {
        insertTier.run(
          id,
          idx,
          String(t.label || `شريحة ${idx + 1}`),
          Math.max(1, Number(t.minQty) || 1),
          Number(t.priceUsd) || basePrice,
          String(t.discountTag || 'سعر أساسي')
        );
      });

      res.json({ product: getProductById(id) });
    } catch (err) {
      console.error('Update product error:', err);
      res.status(500).json({ error: 'تعذّر تحديث بيانات المنتج.' });
    }
  });

  app.patch('/api/admin/products/:id/status', requireAuth, (req: AuthedRequest, res: Response) => {
    try {
      const id = req.params.id;
      const { status, isFeatured } = req.body || {};
      const existing = getProductById(id);
      if (!existing) {
        res.status(404).json({ error: 'المنتج غير موجود.' });
        return;
      }

      if (status) {
        db.prepare(
          'UPDATE products SET status = ?, updated_by_admin = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).run(status, id);
      }
      if (isFeatured !== undefined) {
        db.prepare(
          'UPDATE products SET is_featured = ?, updated_by_admin = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).run(isFeatured ? 1 : 0, id);
      }

      res.json({ product: getProductById(id) });
    } catch (err) {
      console.error('Patch product status error:', err);
      res.status(500).json({ error: 'تعذّر تحديث حالة المنتج.' });
    }
  });

  // Clusters CRUD
  app.post('/api/admin/clusters', requireAuth, (req: AuthedRequest, res: Response) => {
    try {
      const c = req.body || {};
      const id = (c.id ? String(c.id).trim() : `CL${Date.now().toString().slice(-3)}`).toUpperCase();

      db.prepare(
        `INSERT INTO clusters (
          id, name, sector, union_name, governorate, host_enterprise, host_owner, host_phone, central_stations, status, updated_by_admin
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
      ).run(
        id,
        String(c.name || '').trim(),
        String(c.sector || '').trim(),
        String(c.unionName || '').trim(),
        String(c.governorate || '').trim(),
        String(c.hostEnterprise || '').trim(),
        String(c.hostOwner || '').trim(),
        String(c.hostPhone || '').trim(),
        String(c.centralStations || '').trim(),
        c.status || 'published'
      );

      if (Array.isArray(c.members)) {
        const insertMember = db.prepare(
          'INSERT INTO cluster_members (id, cluster_id, name, owner) VALUES (?, ?, ?, ?)'
        );
        c.members.forEach((m: { id?: string; name: string; owner: string }, idx: number) => {
          if (m.name && m.name.trim()) {
            insertMember.run(
              m.id || `${id}-M${idx + 1}`,
              id,
              String(m.name).trim(),
              String(m.owner || '').trim()
            );
          }
        });
      }

      const updated = getClusters(false).find((item) => item.id === id);
      res.status(201).json({ cluster: updated });
    } catch (err) {
      console.error('Create cluster error:', err);
      res.status(500).json({ error: 'تعذّر إنشاء التجمع.' });
    }
  });

  app.put('/api/admin/clusters/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    try {
      const id = req.params.id;
      const c = req.body || {};

      db.prepare(
        `UPDATE clusters SET
          name = ?, sector = ?, union_name = ?, governorate = ?,
          host_enterprise = ?, host_owner = ?, host_phone = ?, central_stations = ?,
          status = ?, updated_by_admin = 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).run(
        String(c.name || '').trim(),
        String(c.sector || '').trim(),
        String(c.unionName || '').trim(),
        String(c.governorate || '').trim(),
        String(c.hostEnterprise || '').trim(),
        String(c.hostOwner || '').trim(),
        String(c.hostPhone || '').trim(),
        String(c.centralStations || '').trim(),
        c.status || 'published',
        id
      );

      if (c.name) {
        db.prepare('UPDATE products SET cluster_name = ? WHERE cluster_id = ?').run(
          String(c.name).trim(),
          id
        );
      }

      if (Array.isArray(c.members)) {
        db.prepare('DELETE FROM cluster_members WHERE cluster_id = ?').run(id);
        const insertMember = db.prepare(
          'INSERT INTO cluster_members (id, cluster_id, name, owner) VALUES (?, ?, ?, ?)'
        );
        c.members.forEach((m: { id?: string; name: string; owner: string }, idx: number) => {
          if (m.name && m.name.trim()) {
            insertMember.run(
              m.id || `${id}-M${idx + 1}-${Date.now().toString().slice(-3)}`,
              id,
              String(m.name).trim(),
              String(m.owner || '').trim()
            );
          }
        });
      }

      const updated = getClusters(false).find((item) => item.id === id);
      res.json({ cluster: updated });
    } catch (err) {
      console.error('Update cluster error:', err);
      res.status(500).json({ error: 'تعذّر تحديث التجمع.' });
    }
  });

  // Sectors CRUD & Rating
  app.post('/api/admin/sectors', requireAuth, (req: AuthedRequest, res: Response) => {
    try {
      const { id, name, unionName, description, sortOrder, status, rating, ratingsCount, evaluationNote } =
        req.body || {};
      const secId = (id ? String(id).trim() : `SEC-${Date.now().toString().slice(-4)}`).toUpperCase();
      const cleanRating =
        rating !== undefined && rating !== null && !Number.isNaN(Number(rating))
          ? Math.min(5, Math.max(1, Number(Number(rating).toFixed(1))))
          : 4.8;
      const cleanCount =
        ratingsCount !== undefined && ratingsCount !== null && !Number.isNaN(Number(ratingsCount))
          ? Math.max(1, Math.floor(Number(ratingsCount)))
          : 12;

      db.prepare(
        `INSERT INTO sectors (id, name, union_name, description, sort_order, status, rating, ratings_count, evaluation_note, updated_by_admin)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
      ).run(
        secId,
        String(name || '').trim(),
        String(unionName || '').trim(),
        String(description || '').trim(),
        Number(sortOrder) || 10,
        status || 'published',
        cleanRating,
        cleanCount,
        String(evaluationNote || '').trim()
      );
      res.status(201).json({ sectors: getSectors(false) });
    } catch (err) {
      console.error('Create sector error:', err);
      res.status(500).json({ error: 'تعذّر إضافة القطاع.' });
    }
  });

  app.put('/api/admin/sectors/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    try {
      const secId = req.params.id;
      const { name, unionName, description, sortOrder, status, rating, ratingsCount, evaluationNote } =
        req.body || {};
      const cleanRating =
        rating !== undefined && rating !== null && !Number.isNaN(Number(rating))
          ? Math.min(5, Math.max(1, Number(Number(rating).toFixed(1))))
          : 4.8;
      const cleanCount =
        ratingsCount !== undefined && ratingsCount !== null && !Number.isNaN(Number(ratingsCount))
          ? Math.max(1, Math.floor(Number(ratingsCount)))
          : 12;

      db.prepare(
        `UPDATE sectors SET name = ?, union_name = ?, description = ?, sort_order = ?, status = ?, rating = ?, ratings_count = ?, evaluation_note = ?, updated_by_admin = 1
         WHERE id = ?`
      ).run(
        String(name || '').trim(),
        String(unionName || '').trim(),
        String(description || '').trim(),
        Number(sortOrder) || 1,
        status || 'published',
        cleanRating,
        cleanCount,
        String(evaluationNote || '').trim(),
        secId
      );
      res.json({ sectors: getSectors(false) });
    } catch (err) {
      console.error('Update sector error:', err);
      res.status(500).json({ error: 'تعذّر تحديث القطاع.' });
    }
  });

  // Public Sector Rating Endpoint
  app.post('/api/public/sectors/:id/rate', (req: Request, res: Response) => {
    try {
      const secId = req.params.id;
      const { stars, evaluationNote } = req.body || {};
      const starValue = Math.min(5, Math.max(1, Number(stars) || 5));

      const existing = db
        .prepare('SELECT id, rating, ratings_count, evaluation_note FROM sectors WHERE id = ?')
        .get(secId) as
        | { id: string; rating: number; ratings_count: number; evaluation_note: string }
        | undefined;

      if (!existing) {
        res.status(404).json({ error: 'القطاع غير موجود.' });
        return;
      }

      const prevRating = Number(existing.rating || 4.8);
      const prevCount = Math.max(1, Number(existing.ratings_count || 12));
      const newCount = prevCount + 1;
      const newRating = Number(((prevRating * prevCount + starValue) / newCount).toFixed(1));
      const nextNote =
        evaluationNote && String(evaluationNote).trim()
          ? String(evaluationNote).trim()
          : String(existing.evaluation_note || '');

      db.prepare(
        'UPDATE sectors SET rating = ?, ratings_count = ?, evaluation_note = ?, updated_by_admin = 1 WHERE id = ?'
      ).run(newRating, newCount, nextNote, secId);

      res.json({ sectors: getSectors(true), rating: newRating, ratingsCount: newCount });
    } catch (err) {
      console.error('Rate sector error:', err);
      res.status(500).json({ error: 'تعذّر حفظ تقييم القطاع.' });
    }
  });

  // Public Product Interactive Star Rating & Short Customer Notes Endpoint
  app.post('/api/public/products/:id/rate', (req: Request, res: Response) => {
    try {
      const prodId = req.params.id;
      const { stars, note, authorName } = req.body || {};
      const starValue = Math.min(5, Math.max(1, Math.round(Number(stars) || 5)));

      const existing = db
        .prepare('SELECT id, rating, ratings_count, reviews FROM products WHERE id = ?')
        .get(prodId) as
        | { id: string; rating: number; ratings_count: number; reviews: string }
        | undefined;

      if (!existing) {
        res.status(404).json({ error: 'المنتج غير موجود.' });
        return;
      }

      const prevRating = Number(existing.rating || 4.8);
      const prevCount = Math.max(1, Number(existing.ratings_count || 8));
      const newCount = prevCount + 1;
      const newRating = Number(((prevRating * prevCount + starValue) / newCount).toFixed(1));

      let currentReviews: Array<{
        id: string;
        authorName?: string;
        stars: number;
        note: string;
        createdAt: string;
      }> = [];
      try {
        const parsed = JSON.parse(String(existing.reviews || '[]'));
        if (Array.isArray(parsed)) currentReviews = parsed;
      } catch {
        currentReviews = [];
      }

      const cleanNote = typeof note === 'string' ? note.trim() : '';
      const cleanAuthor =
        typeof authorName === 'string' && authorName.trim()
          ? authorName.trim()
          : 'عميل / جهة مشترية';

      if (cleanNote.length > 0) {
        currentReviews = [
          {
            id: `REV-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            authorName: cleanAuthor,
            stars: starValue,
            note: cleanNote,
            createdAt: new Date().toISOString().slice(0, 10),
          },
          ...currentReviews,
        ].slice(0, 25);
      }

      db.prepare(
        'UPDATE products SET rating = ?, ratings_count = ?, reviews = ? WHERE id = ?'
      ).run(newRating, newCount, JSON.stringify(currentReviews), prodId);

      const updatedProduct = getProductById(prodId);
      res.json({
        product: updatedProduct,
        rating: newRating,
        ratingsCount: newCount,
        reviews: currentReviews,
      });
    } catch (err) {
      console.error('Rate product error:', err);
      res.status(500).json({ error: 'تعذّر حفظ تقييم المنتج.' });
    }
  });

  // Enterprises CRUD
  app.post('/api/admin/enterprises', requireAuth, (req: AuthedRequest, res: Response) => {
    try {
      const { id, name, owner, phone, role, clusterId, governorate, status } = req.body || {};
      const entId = (id ? String(id).trim() : `ENT-${Date.now().toString().slice(-5)}`).toUpperCase();
      db.prepare(
        `INSERT INTO enterprises (id, name, owner, phone, role, cluster_id, governorate, status, updated_by_admin)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`
      ).run(
        entId,
        String(name || '').trim(),
        String(owner || '').trim(),
        String(phone || '').trim(),
        role || 'MEMBER',
        String(clusterId || '').trim(),
        String(governorate || '').trim(),
        status || 'published'
      );
      res.status(201).json({ enterprises: getEnterprises() });
    } catch (err) {
      console.error('Create enterprise error:', err);
      res.status(500).json({ error: 'تعذّر إضافة المنشأة.' });
    }
  });

  app.put('/api/admin/enterprises/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    try {
      const entId = req.params.id;
      const { name, owner, phone, role, clusterId, governorate, status } = req.body || {};
      db.prepare(
        `UPDATE enterprises SET name = ?, owner = ?, phone = ?, role = ?, cluster_id = ?, governorate = ?, status = ?, updated_by_admin = 1
         WHERE id = ?`
      ).run(
        String(name || '').trim(),
        String(owner || '').trim(),
        String(phone || '').trim(),
        role || 'MEMBER',
        String(clusterId || '').trim(),
        String(governorate || '').trim(),
        status || 'published',
        entId
      );
      res.json({ enterprises: getEnterprises() });
    } catch (err) {
      console.error('Update enterprise error:', err);
      res.status(500).json({ error: 'تعذّر تحديث بيانات المنشأة.' });
    }
  });

  // RFQ Admin Management
  app.get('/api/admin/rfqs', requireAuth, (req: AuthedRequest, res: Response) => {
    const { search, sector, clusterId, status, dateFrom, dateTo } = req.query;
    const rfqs = getRfqOrders({
      search: typeof search === 'string' ? search : undefined,
      sector: typeof sector === 'string' ? sector : undefined,
      clusterId: typeof clusterId === 'string' ? clusterId : undefined,
      status: typeof status === 'string' ? status : undefined,
      dateFrom: typeof dateFrom === 'string' ? dateFrom : undefined,
      dateTo: typeof dateTo === 'string' ? dateTo : undefined,
    });
    res.json({ rfqs });
  });

  app.patch('/api/admin/rfqs/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const existingRow = db.prepare('SELECT * FROM rfq_orders WHERE id = ?').get(id) as
        | Record<string, unknown>
        | undefined;
      if (!existingRow) {
        res.status(404).json({ error: 'الطلب غير موجود.' });
        return;
      }

      const oldStatus = String(existingRow.status);
      const { status, internalNotes, logNote } = req.body || {};
      const newStatus: RfqStatus = status || oldStatus;
      const updatedInternalNotes =
        internalNotes !== undefined ? String(internalNotes) : String(existingRow.internal_notes || '');

      db.prepare(
        `UPDATE rfq_orders SET status = ?, internal_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).run(newStatus, updatedInternalNotes, id);

      const actionDesc =
        newStatus !== oldStatus
          ? `تحديث حالة الطلب من «${oldStatus}» إلى «${newStatus}»`
          : 'تحديث الملاحظات الداخلية وسجل المتابعة';

      db.prepare(
        `INSERT INTO rfq_logs (rfq_id, action, old_status, new_status, note, actor_name)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        actionDesc,
        oldStatus,
        newStatus,
        logNote ? String(logNote).trim() : updatedInternalNotes,
        req.user?.name || 'مسؤول النظام'
      );

      const updatedRow = db.prepare('SELECT * FROM rfq_orders WHERE id = ?').get(id) as Record<
        string,
        unknown
      >;
      res.json({ order: mapRfqRow(updatedRow, true) });
    } catch (err) {
      console.error('Update RFQ error:', err);
      res.status(500).json({ error: 'تعذّر تحديث حالة الطلب.' });
    }
  });

  // Settings Update
  app.put('/api/admin/settings', requireAuth, (req: AuthedRequest, res: Response) => {
    try {
      const updated = updateSettings(req.body || {});
      res.json({ settings: updated });
    } catch (err) {
      console.error('Update settings error:', err);
      res.status(500).json({ error: 'تعذّر حفظ إعدادات المنصة.' });
    }
  });

  // Users Management (Admin Only)
  app.get('/api/admin/users', requireAuth, requireAdmin, (_req: AuthedRequest, res: Response) => {
    res.json({ users: getUsers() });
  });

  app.post('/api/admin/users', requireAuth, requireAdmin, (req: AuthedRequest, res: Response) => {
    try {
      const { email, name, password, role } = req.body || {};
      if (!email || !name || !password) {
        res.status(400).json({ error: 'يرجى تعبئة الاسم والبريد الإلكتروني وكلمة المرور.' });
        return;
      }
      const cleanEmail = String(email).toLowerCase().trim();
      db.prepare(
        'INSERT INTO users (email, name, password_hash, role, active) VALUES (?, ?, ?, ?, 1)'
      ).run(
        cleanEmail,
        String(name).trim(),
        hashPassword(String(password)),
        role === 'admin' ? 'admin' : 'editor'
      );
      res.status(201).json({ users: getUsers() });
    } catch (err) {
      console.error('Create user error:', err);
      res.status(400).json({ error: 'تعذّر إنشاء المستخدم (قد يكون البريد الإلكتروني مستخدمًا).' });
    }
  });

  app.put('/api/admin/users/:id', requireAuth, requireAdmin, (req: AuthedRequest, res: Response) => {
    try {
      const userId = Number(req.params.id);
      const { name, role, active, password } = req.body || {};
      const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as
        | Record<string, unknown>
        | undefined;
      if (!existing) {
        res.status(404).json({ error: 'المستخدم غير موجود.' });
        return;
      }

      const newHash =
        password && String(password).trim().length >= 4
          ? hashPassword(String(password).trim())
          : String(existing.password_hash);

      db.prepare('UPDATE users SET name = ?, role = ?, active = ?, password_hash = ? WHERE id = ?').run(
        String(name ?? existing.name).trim(),
        role === 'admin' ? 'admin' : 'editor',
        active !== undefined ? (active ? 1 : 0) : Number(existing.active),
        newHash,
        userId
      );

      res.json({ users: getUsers() });
    } catch (err) {
      console.error('Update user error:', err);
      res.status(500).json({ error: 'تعذّر تحديث بيانات المستخدم.' });
    }
  });

  // ==========================================================================
  // VITE MIDDLEWARE / STATIC ASSETS (Bind port 3000 immediately for fast health check)
  // ==========================================================================

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vitePromise = createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(async (req, res, next) => {
      try {
        const vite = await vitePromise;
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
