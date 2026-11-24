import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  OFFICIAL_PROJECT_NAME,
  DEFAULT_INTRO_TEXT,
  INITIAL_PARTNERS,
  INITIAL_CLUSTERS_DB,
  INITIAL_PRODUCTS_DB,
} from '../data/referenceData.ts';
import type {
  BuyerAccount,
  Cluster,
  ClusterMember,
  ContentStatus,
  ContractMode,
  Enterprise,
  PlatformSettings,
  Product,
  ProductDocument,
  ProductReview,
  ProductTier,
  RfqLog,
  RfqOrder,
  RfqStatus,
  Sector,
  UserAccount,
  AdminReportsResponse,
} from '../types.ts';

function openDatabase(): DatabaseSync {
  const preferredPath =
    process.env.DATABASE_PATH || path.resolve(process.cwd(), 'data', 'gaza_clusters.db');
  try {
    fs.mkdirSync(path.dirname(preferredPath), { recursive: true });
    return new DatabaseSync(preferredPath);
  } catch (err) {
    console.warn('[Database] Falling back to /tmp/gaza_clusters.db:', err);
    const fallbackPath = path.join('/tmp', 'gaza_clusters.db');
    return new DatabaseSync(fallbackPath);
  }
}

export const db = openDatabase();

// Enable WAL and foreign keys
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function hashPassword(password: string): string {
  const salt = 'pfi_undp_gaza_2025_salt';
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function safeAddColumn(table: string, columnDef: string): void {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${columnDef};`);
  } catch {
    // Column already exists
  }
}

export function initSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_by_admin INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sectors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      union_name TEXT NOT NULL,
      description TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      status TEXT DEFAULT 'published',
      updated_by_admin INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS clusters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sector TEXT NOT NULL,
      union_name TEXT NOT NULL,
      governorate TEXT NOT NULL,
      host_enterprise TEXT NOT NULL,
      host_owner TEXT NOT NULL,
      host_phone TEXT NOT NULL,
      central_stations TEXT NOT NULL,
      status TEXT DEFAULT 'published',
      updated_by_admin INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cluster_members (
      id TEXT PRIMARY KEY,
      cluster_id TEXT NOT NULL,
      name TEXT NOT NULL,
      owner TEXT NOT NULL,
      enterprise_id TEXT,
      FOREIGN KEY (cluster_id) REFERENCES clusters(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS enterprises (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner TEXT NOT NULL,
      phone TEXT DEFAULT '',
      role TEXT DEFAULT 'MEMBER',
      cluster_id TEXT NOT NULL,
      governorate TEXT DEFAULT '',
      status TEXT DEFAULT 'published',
      updated_by_admin INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      sector TEXT NOT NULL,
      prod_scope TEXT NOT NULL DEFAULT 'SINGLE',
      scope_badge TEXT NOT NULL,
      cluster_id TEXT NOT NULL,
      cluster_name TEXT NOT NULL,
      enterprise_name TEXT NOT NULL,
      enterprise_owner TEXT NOT NULL,
      enterprise_phone TEXT NOT NULL,
      union_name TEXT NOT NULL,
      price_usd REAL NOT NULL,
      unit TEXT NOT NULL,
      daily_capacity TEXT NOT NULL,
      sample_available INTEGER NOT NULL DEFAULT 1,
      image TEXT NOT NULL,
      gallery_images TEXT DEFAULT '[]',
      video_url TEXT DEFAULT '',
      video_urls TEXT DEFAULT '[]',
      spec_pdf_url TEXT DEFAULT '',
      documents TEXT DEFAULT '[]',
      price_saving_highlight TEXT DEFAULT '',
      quality_edge_highlight TEXT DEFAULT '',
      description TEXT NOT NULL,
      manufacturing_specs TEXT NOT NULL,
      status TEXT DEFAULT 'published',
      is_featured INTEGER DEFAULT 0,
      updated_by_admin INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_tiers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL,
      tier_index INTEGER NOT NULL,
      label TEXT NOT NULL,
      min_qty INTEGER NOT NULL,
      price_usd REAL NOT NULL,
      discount_tag TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'editor',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS buyers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      organization TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS buyer_sessions (
      token TEXT PRIMARY KEY,
      buyer_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (buyer_id) REFERENCES buyers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS rfq_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ref_number TEXT NOT NULL UNIQUE,
      idempotency_key TEXT UNIQUE,
      buyer_id INTEGER,
      buyer_email TEXT DEFAULT '',
      product_id TEXT NOT NULL,
      product_title TEXT NOT NULL,
      product_sector TEXT NOT NULL,
      cluster_id TEXT NOT NULL,
      cluster_name TEXT NOT NULL,
      attributed_sector TEXT NOT NULL,
      enterprise_name TEXT NOT NULL,
      buyer_org TEXT NOT NULL,
      contact_person TEXT NOT NULL,
      contact_info TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit TEXT NOT NULL,
      contract_mode TEXT NOT NULL,
      applied_tier_label TEXT NOT NULL,
      applied_tier_min_qty INTEGER NOT NULL,
      unit_price_usd REAL NOT NULL,
      total_price_usd REAL NOT NULL,
      currency_at_submit TEXT NOT NULL,
      exchange_rate_at_submit REAL NOT NULL,
      unit_price_display REAL NOT NULL,
      total_price_display REAL NOT NULL,
      notes TEXT DEFAULT '',
      internal_notes TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'جديد',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rfq_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rfq_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      old_status TEXT,
      new_status TEXT,
      note TEXT,
      actor_name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (rfq_id) REFERENCES rfq_orders(id) ON DELETE CASCADE
    );
  `);

  // Safe migrations for existing databases
  safeAddColumn('products', "gallery_images TEXT DEFAULT '[]'");
  safeAddColumn('products', "video_url TEXT DEFAULT ''");
  safeAddColumn('products', "video_urls TEXT DEFAULT '[]'");
  safeAddColumn('products', "spec_pdf_url TEXT DEFAULT ''");
  safeAddColumn('products', "documents TEXT DEFAULT '[]'");
  safeAddColumn('rfq_orders', 'buyer_id INTEGER');
  safeAddColumn('rfq_orders', "buyer_email TEXT DEFAULT ''");
  safeAddColumn('sectors', 'rating REAL DEFAULT 4.8');
  safeAddColumn('sectors', 'ratings_count INTEGER DEFAULT 12');
  safeAddColumn('sectors', "evaluation_note TEXT DEFAULT ''");
  safeAddColumn('products', 'rating REAL DEFAULT 4.8');
  safeAddColumn('products', 'ratings_count INTEGER DEFAULT 8');
  safeAddColumn('products', "reviews TEXT DEFAULT '[]'");
}

/**
 * The 6 approved industrial sectors matching INITIAL_CLUSTERS_DB and INITIAL_PRODUCTS_DB
 */
const SECTOR_METADATA: {
  id: string;
  name: string;
  unionName: string;
  description: string;
  sortOrder: number;
}[] = [
  {
    id: 'SEC-GARMENTS',
    name: 'الخياطة والنسيج',
    unionName: 'اتحاد صناعات الملابس والنسيج',
    description:
      'تجمعات إنتاج الملابس والزي المدرسي والطبي والأطقم الشتوية والفرشات بطاقة إنتاجية عالية ومواصفات قياسية موحدة.',
    sortOrder: 1,
  },
  {
    id: 'SEC-WOMEN',
    name: 'مجلس سيدات الأعمال',
    unionName: 'مجلس سيدات الأعمال',
    description:
      'تجمعات إنتاجية نسائية متخصصة في حقائب الكرامة والملابس التراثية والمشغولات النسيجية عالية الجودة لمشاريع الاستجابة الإنسانية.',
    sortOrder: 2,
  },
  {
    id: 'SEC-WOOD',
    name: 'الصناعات الخشبية والأثاث',
    unionName: 'اتحاد الصناعات الخشبية والأثاث',
    description:
      'تصنيع الأثاث المدرسي والمكتبي والمنزلي ووحدات الإيواء باستخدام محطات CNC وكبس حراري مركزي.',
    sortOrder: 3,
  },
  {
    id: 'SEC-ALUMINUM',
    name: 'صناعات الألمنيوم والزجاج',
    unionName: 'اتحاد الصناعات المعدنية والهندسية',
    description:
      'إنتاج وتجميع شبابيك وأبواب الألمنيوم والواجهات المعمارية وقواطع وحدات الإيواء والمدارس والعيادات الميدانية.',
    sortOrder: 4,
  },
  {
    id: 'SEC-CONSTRUCTION',
    name: 'الصناعات الإنشائية والرخام',
    unionName: 'اتحاد الصناعات الإنشائية والرخام',
    description:
      'إنتاج العناصر الإنشائية والبلوك والانترلوك ووحدات الصرف الصحي والرخام لمشاريع الإغاثة والتعافي وإعادة الإعمار.',
    sortOrder: 5,
  },
  {
    id: 'SEC-METAL',
    name: 'الصناعات المعدنية والهندسية',
    unionName: 'اتحاد الصناعات المعدنية والهندسية',
    description:
      'تشكيل الهياكل المعدنية والكرفانات ووحدات الطاقة الشمسية وخزانات المياه والمنتجات الهندسية المشتركة.',
    sortOrder: 6,
  },
];

export function parseClusterNum(id: string): number {
  const m = String(id).match(/\d+/);
  return m ? parseInt(m[0], 10) : 9999;
}

/**
 * Idempotent seed function:
 * - Inserts missing records from CLUSTERS_DB and PRODUCTS_DB
 * - Never overwrites records that have been edited by an admin (`updated_by_admin = 1`)
 * - Unifies the 6 approved sectors and 52 enterprises
 */
export function seedDatabase(): {
  insertedClusters: number;
  insertedProducts: number;
  skippedAdminModified: number;
} {
  initSchema();

  let insertedClusters = 0;
  let insertedProducts = 0;
  let skippedAdminModified = 0;

  db.exec('BEGIN;');
  try {
    // 1. Default Settings
  const defaultSettings: PlatformSettings = {
    officialProjectName: OFFICIAL_PROJECT_NAME,
    heroTitle: 'منتجات محلية من تجمعات الإنتاج في غزة',
    heroSubtitle: 'منصة التوريد والتشبيك الصناعي الموحد للمؤسسات الدولية والمحلية والقطاع الخاص',
    introText: DEFAULT_INTRO_TEXT,
    primaryCtaText: 'استكشف المنتجات',
    secondaryCtaText: 'تعرّف على التجمعات',
    heroImages: [
      '/uploads/extracted/prd-101.jpg',
      '/uploads/extracted/prd-105.jpg',
      '/uploads/extracted/prd-108.jpg',
      '/uploads/extracted/prd-113.jpg',
    ],
    exchangeRate: Number(process.env.INITIAL_EXCHANGE_RATE || 3.1),
    howClustersWorkTitle: 'آلية عمل الوحدات الإنتاجية العنقودية (HCC)',
    howClustersWorkSteps: [
      {
        title: '١. محطات إنتاج مركزية مشتركة',
        description:
          'تستضيف المنشأة القائدة (Host Enterprise) مكائن تخصصية حديثة وخطوط طاقة تخدم كافة المنشآت الأعضاء في التجمع لخفض كلفة التصنيع ورفع الدقة.',
      },
      {
        title: '٢. تشارك الطاقة الإنتاجية والتكامل',
        description:
          'تتوزع أوامر التشغيل الكبيرة بين الورش والمصانع الأعضاء وفق معايير جودة موحدة، أو تتكامل عدة قطاعات لإنتاج منتج مركّب متكامل.',
      },
      {
        title: '٣. تعاقد مباشر وعروض أسعار شفافة',
        description:
          'تستطيع المؤسسات الشريكة طلب عروض أسعار وتعاقد (توريد شامل أو مصنعية فقط) بشرائح سعرية تنافسية مرتبطة بالكميات مع ضمان الفحص المخبري.',
      },
    ],
    partners: INITIAL_PARTNERS,
  };

  const existingSettings = db
    .prepare('SELECT key, value, updated_by_admin FROM settings WHERE key = ?')
    .get('platform_settings') as { key: string; value: string; updated_by_admin: number } | undefined;

  if (!existingSettings) {
    db.prepare('INSERT INTO settings (key, value, updated_by_admin) VALUES (?, ?, 0)').run(
      'platform_settings',
      JSON.stringify(defaultSettings)
    );
  } else {
    // Ensure partner names (especially HCC official name) are unified
    try {
      const parsed = JSON.parse(existingSettings.value) as PlatformSettings;
      parsed.partners = INITIAL_PARTNERS;
      db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(
        JSON.stringify(parsed),
        'platform_settings'
      );
    } catch {
      // ignore
    }
  }

  // 2. Seed and Unify the 6 Approved Sectors (remove legacy leather/plastic/old garment rows if not admin-modified)
  const validSectorIds = SECTOR_METADATA.map((s) => s.id);
  const validSectorNames = SECTOR_METADATA.map((s) => s.name);

  db.prepare(
    `DELETE FROM sectors WHERE updated_by_admin = 0 AND id NOT IN (${validSectorIds
      .map(() => '?')
      .join(',')})`
  ).run(...validSectorIds);

  db.prepare(
    `DELETE FROM sectors WHERE updated_by_admin = 0 AND name NOT IN (${validSectorNames
      .map(() => '?')
      .join(',')})`
  ).run(...validSectorNames);

  const getSectorStmt = db.prepare('SELECT id, updated_by_admin FROM sectors WHERE id = ?');
  const upsertSectorStmt = db.prepare(`
    INSERT INTO sectors (id, name, union_name, description, sort_order, status, updated_by_admin)
    VALUES (?, ?, ?, ?, ?, 'published', 0)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      union_name = excluded.union_name,
      description = excluded.description,
      sort_order = excluded.sort_order
    WHERE sectors.updated_by_admin = 0
  `);

  for (const sec of SECTOR_METADATA) {
    const existing = getSectorStmt.get(sec.id) as { id: string; updated_by_admin: number } | undefined;
    if (existing && existing.updated_by_admin) {
      skippedAdminModified++;
    } else {
      upsertSectorStmt.run(sec.id, sec.name, sec.unionName, sec.description, sec.sortOrder);
    }
  }

  // 3. Seed Clusters & Members & 52 Enterprises (remove duplicate ENT-HOST-* records)
  db.prepare("DELETE FROM enterprises WHERE id LIKE 'ENT-HOST-%' AND updated_by_admin = 0").run();

  const getClusterStmt = db.prepare('SELECT id, updated_by_admin FROM clusters WHERE id = ?');
  const insertClusterStmt = db.prepare(`
    INSERT INTO clusters (
      id, name, sector, union_name, governorate, host_enterprise, host_owner, host_phone, central_stations, status, updated_by_admin
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 0)
  `);
  const insertMemberStmt = db.prepare(`
    INSERT OR IGNORE INTO cluster_members (id, cluster_id, name, owner, enterprise_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  const upsertEnterpriseStmt = db.prepare(`
    INSERT INTO enterprises (id, name, owner, phone, role, cluster_id, governorate, status, updated_by_admin)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'published', 0)
    ON CONFLICT(id) DO UPDATE SET
      phone = excluded.phone,
      role = excluded.role
    WHERE enterprises.updated_by_admin = 0
  `);

  for (const c of INITIAL_CLUSTERS_DB) {
    const existing = getClusterStmt.get(c.id) as { id: string; updated_by_admin: number } | undefined;
    if (!existing) {
      insertClusterStmt.run(
        c.id,
        c.name,
        c.sector,
        c.unionName,
        c.governorate,
        c.hostEnterprise,
        c.hostOwner,
        c.hostPhone,
        c.centralStations
      );
      insertedClusters++;
    } else if (existing.updated_by_admin) {
      skippedAdminModified++;
    }

    // Ensure the 52 enterprises (host + members from c.members) exist without duplication
    for (const m of c.members) {
      const memberRecordId = `${c.id}-${m.id}`;
      const entId = `ENT-${c.id}-${m.id}`;
      const isHost = m.id.startsWith('HOST');
      upsertEnterpriseStmt.run(
        entId,
        m.name,
        m.owner,
        isHost ? c.hostPhone : '',
        isHost ? 'HOST' : 'MEMBER',
        c.id,
        c.governorate
      );
      insertMemberStmt.run(memberRecordId, c.id, m.name, m.owner, entId);
    }
  }

  // 4. Seed Products & Price Tiers
  const getProductStmt = db.prepare(
    'SELECT id, gallery_images, updated_by_admin FROM products WHERE id = ?'
  );
  const insertProductStmt = db.prepare(`
    INSERT INTO products (
      id, title, sector, prod_scope, scope_badge, cluster_id, cluster_name,
      enterprise_name, enterprise_owner, enterprise_phone, union_name,
      price_usd, unit, daily_capacity, sample_available, image, gallery_images,
      video_url, spec_pdf_url,
      price_saving_highlight, quality_edge_highlight, description, manufacturing_specs,
      status, is_featured, updated_by_admin
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', ?, ?, ?, ?, 'published', ?, 0)
  `);
  const insertTierStmt = db.prepare(`
    INSERT INTO product_tiers (product_id, tier_index, label, min_qty, price_usd, discount_tag)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const featuredIds = new Set(['PRD-101', 'PRD-105', 'PRD-106', 'PRD-108', 'PRD-112', 'PRD-113']);

  for (let i = 0; i < INITIAL_PRODUCTS_DB.length; i++) {
    const p = INITIAL_PRODUCTS_DB[i];

    const existing = getProductStmt.get(p.id) as
      | { id: string; gallery_images: string; updated_by_admin: number }
      | undefined;

    if (!existing) {
      insertProductStmt.run(
        p.id,
        p.title,
        p.sector,
        p.prodScope,
        p.scopeBadge,
        p.clusterId,
        p.clusterName,
        p.enterpriseName,
        p.enterpriseOwner,
        p.enterprisePhone,
        p.unionName,
        p.priceUsd,
        p.unit,
        p.dailyCapacity,
        p.sampleAvailable ? 1 : 0,
        p.image,
        '[]',
        p.priceSavingHighlight,
        p.qualityEdgeHighlight,
        p.description,
        p.manufacturingSpecs,
        featuredIds.has(p.id) ? 1 : 0
      );

      p.tiers.forEach((tier, idx) => {
        insertTierStmt.run(p.id, idx, tier.label, tier.minQty, tier.priceUsd, tier.discountTag);
      });

      insertedProducts++;
    } else {
      if (existing.updated_by_admin) {
        skippedAdminModified++;
      } else if (existing.gallery_images && existing.gallery_images !== '[]') {
        // Clear any previously auto-seeded extra gallery images on non-admin-modified products
        db.prepare("UPDATE products SET gallery_images = '[]' WHERE id = ? AND updated_by_admin = 0").run(
          p.id
        );
      }
    }
  }

  // 5. Seed Initial Admin and Editor Accounts
  const testAccounts = getTestAccounts();
  const accountsToEnsure = [
    testAccounts.admin,
    testAccounts.editor,
    {
      email: 'admin@pfi-gaza.ps',
      password: 'Admin@2025',
      name: 'مدير النظام - وحدة التجمعات العنقودية',
      role: 'admin' as const,
    },
    {
      email: 'editor@pfi-gaza.ps',
      password: 'Editor@2025',
      name: 'محرّر المحتوى ومتابعة الطلبات',
      role: 'editor' as const,
    },
  ];

  const seenEmails = new Set<string>();
  for (const acc of accountsToEnsure) {
    const cleanEmail = acc.email.toLowerCase().trim();
    if (seenEmails.has(cleanEmail)) continue;
    seenEmails.add(cleanEmail);

    const existingUser = db
      .prepare('SELECT id, role, active FROM users WHERE email = ?')
      .get(cleanEmail) as { id: number; role: string; active: number } | undefined;

    if (!existingUser) {
      db.prepare(
        'INSERT INTO users (email, name, password_hash, role, active) VALUES (?, ?, ?, ?, 1)'
      ).run(cleanEmail, acc.name, hashPassword(acc.password), acc.role);
    } else if (existingUser.role !== acc.role || !existingUser.active) {
      db.prepare('UPDATE users SET role = ?, active = 1 WHERE id = ?').run(
        acc.role,
        existingUser.id
      );
    }
  }

    db.exec('COMMIT;');
  } catch (err) {
    try {
      db.exec('ROLLBACK;');
    } catch {
      // ignore rollback error
    }
    throw err;
  }

  return { insertedClusters, insertedProducts, skippedAdminModified };
}

export function getTestAccounts() {
  const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'admin@pfi-gaza.ps').toLowerCase().trim();
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Admin@2025';
  const adminName = process.env.INITIAL_ADMIN_NAME || 'مدير النظام - وحدة التجمعات العنقودية';

  const editorEmail = (process.env.INITIAL_EDITOR_EMAIL || 'editor@pfi-gaza.ps').toLowerCase().trim();
  const editorPassword = process.env.INITIAL_EDITOR_PASSWORD || 'Editor@2025';
  const editorName = process.env.INITIAL_EDITOR_NAME || 'محرّر المحتوى ومتابعة الطلبات';

  return {
    admin: {
      email: adminEmail,
      password: adminPassword,
      name: adminName,
      role: 'admin' as const,
    },
    editor: {
      email: editorEmail,
      password: editorPassword,
      name: editorName,
      role: 'editor' as const,
    },
  };
}

// ============================================================================
// DATA ACCESS HELPERS
// ============================================================================

export function getSettings(): PlatformSettings {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('platform_settings') as
    | { value: string }
    | undefined;
  if (!row) {
    seedDatabase();
    const afterSeed = db.prepare('SELECT value FROM settings WHERE key = ?').get('platform_settings') as {
      value: string;
    };
    return JSON.parse(afterSeed.value) as PlatformSettings;
  }
  return JSON.parse(row.value) as PlatformSettings;
}

export function updateSettings(partial: Partial<PlatformSettings>): PlatformSettings {
  const current = getSettings();
  const merged: PlatformSettings = {
    ...current,
    ...partial,
  };
  db.prepare(
    'UPDATE settings SET value = ?, updated_by_admin = 1, updated_at = CURRENT_TIMESTAMP WHERE key = ?'
  ).run(JSON.stringify(merged), 'platform_settings');
  return merged;
}

export function getSectors(onlyPublished = false): Sector[] {
  const query = onlyPublished
    ? "SELECT * FROM sectors WHERE status = 'published' ORDER BY sort_order ASC, name ASC"
    : 'SELECT * FROM sectors ORDER BY sort_order ASC, name ASC';
  const rows = db.prepare(query).all() as Record<string, unknown>[];
  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    unionName: String(r.union_name),
    description: String(r.description),
    sortOrder: Number(r.sort_order),
    status: (r.status as ContentStatus) || 'published',
    rating: r.rating !== undefined && r.rating !== null ? Number(r.rating) : 4.8,
    ratingsCount: r.ratings_count !== undefined && r.ratings_count !== null ? Number(r.ratings_count) : 12,
    evaluationNote: String(r.evaluation_note || ''),
  }));
}

export function getClusters(onlyPublished = false): Cluster[] {
  const query = onlyPublished
    ? "SELECT * FROM clusters WHERE status = 'published'"
    : 'SELECT * FROM clusters';
  const rows = db.prepare(query).all() as Record<string, unknown>[];
  const memberRows = db.prepare('SELECT * FROM cluster_members ORDER BY id ASC').all() as Record<
    string,
    unknown
  >[];

  const membersByCluster = new Map<string, ClusterMember[]>();
  for (const m of memberRows) {
    const cid = String(m.cluster_id);
    if (!membersByCluster.has(cid)) membersByCluster.set(cid, []);
    membersByCluster.get(cid)!.push({
      id: String(m.id),
      clusterId: cid,
      name: String(m.name),
      owner: String(m.owner),
      enterpriseId: m.enterprise_id ? String(m.enterprise_id) : undefined,
    });
  }

  const mapped = rows.map((r) => {
    const id = String(r.id);
    return {
      id,
      name: String(r.name),
      sector: String(r.sector),
      unionName: String(r.union_name),
      governorate: String(r.governorate),
      hostEnterprise: String(r.host_enterprise),
      hostOwner: String(r.host_owner),
      hostPhone: String(r.host_phone),
      centralStations: String(r.central_stations),
      status: (r.status as ContentStatus) || 'published',
      updatedByAdmin: Boolean(r.updated_by_admin),
      members: membersByCluster.get(id) || [],
    };
  });

  // Sort numerically from CL1 to CL15
  return mapped.sort((a, b) => {
    const diff = parseClusterNum(a.id) - parseClusterNum(b.id);
    return diff !== 0 ? diff : a.id.localeCompare(b.id);
  });
}

export function getEnterprises(): Enterprise[] {
  const rows = db.prepare('SELECT * FROM enterprises ORDER BY role ASC, id ASC').all() as Record<
    string,
    unknown
  >[];
  return rows
    .map((r) => ({
      id: String(r.id),
      name: String(r.name),
      owner: String(r.owner),
      phone: String(r.phone || ''),
      role: (r.role as 'HOST' | 'MEMBER' | 'PRODUCER') || 'MEMBER',
      clusterId: String(r.cluster_id),
      governorate: String(r.governorate || ''),
      status: (r.status as ContentStatus) || 'published',
    }))
    .sort((a, b) => {
      const diff = parseClusterNum(a.clusterId) - parseClusterNum(b.clusterId);
      if (diff !== 0) return diff;
      if (a.role === 'HOST' && b.role !== 'HOST') return -1;
      if (a.role !== 'HOST' && b.role === 'HOST') return 1;
      return a.id.localeCompare(b.id);
    });
}

export function getProducts(onlyPublished = false): Product[] {
  const query = onlyPublished
    ? "SELECT * FROM products WHERE status = 'published' ORDER BY id ASC"
    : 'SELECT * FROM products ORDER BY id ASC';
  const rows = db.prepare(query).all() as Record<string, unknown>[];
  const tierRows = db
    .prepare('SELECT * FROM product_tiers ORDER BY product_id ASC, min_qty ASC')
    .all() as Record<string, unknown>[];

  const tiersByProduct = new Map<string, ProductTier[]>();
  for (const t of tierRows) {
    const pid = String(t.product_id);
    if (!tiersByProduct.has(pid)) tiersByProduct.set(pid, []);
    tiersByProduct.get(pid)!.push({
      id: Number(t.id),
      productId: pid,
      tierIndex: Number(t.tier_index),
      label: String(t.label),
      minQty: Number(t.min_qty),
      priceUsd: Number(t.price_usd),
      discountTag: String(t.discount_tag),
    });
  }

  return rows.map((r) => {
    const id = String(r.id);
    const mainImage = String(r.image || '').trim();
    let galleryImages: string[] = [];
    try {
      const parsed = JSON.parse(String(r.gallery_images || '[]'));
      if (Array.isArray(parsed)) {
        galleryImages = parsed
          .map((x) => (typeof x === 'string' ? x.trim() : ''))
          .filter((x) => x.length > 0 && x !== mainImage);
      }
    } catch {
      galleryImages = [];
    }

    const legacyVideoUrl = String(r.video_url || '').trim();
    let videoUrls: string[] = [];
    try {
      const parsedVideos = JSON.parse(String(r.video_urls || '[]'));
      if (Array.isArray(parsedVideos)) {
        videoUrls = parsedVideos
          .map((v) => (typeof v === 'string' ? v.trim() : ''))
          .filter(Boolean);
      }
    } catch {
      videoUrls = [];
    }
    if (legacyVideoUrl && !videoUrls.includes(legacyVideoUrl)) {
      videoUrls = [legacyVideoUrl, ...videoUrls];
    }
    videoUrls = Array.from(new Set(videoUrls));
    const primaryVideoUrl = videoUrls[0] || '';

    const legacySpecPdfUrl = String(r.spec_pdf_url || '').trim();
    let documents: ProductDocument[] = [];
    try {
      const parsedDocs = JSON.parse(String(r.documents || '[]'));
      if (Array.isArray(parsedDocs)) {
        documents = parsedDocs
          .map((d) => {
            if (typeof d === 'string' && d.trim()) {
              const url = d.trim();
              const rawName = url.split('/').pop() || 'ملف المواصفات الفنية';
              return { name: rawName, url };
            }
            if (d && typeof d === 'object' && typeof d.url === 'string' && d.url.trim()) {
              const url = d.url.trim();
              const name =
                typeof d.name === 'string' && d.name.trim()
                  ? d.name.trim()
                  : url.split('/').pop() || 'مستند مرفق';
              const type = typeof d.type === 'string' ? d.type : undefined;
              return { name, url, type };
            }
            return null;
          })
          .filter((d): d is ProductDocument => d !== null);
      }
    } catch {
      documents = [];
    }
    if (legacySpecPdfUrl && !documents.some((d) => d.url === legacySpecPdfUrl)) {
      const rawName = legacySpecPdfUrl.split('/').pop() || 'ملف المواصفات الفنية';
      documents = [{ name: rawName, url: legacySpecPdfUrl }, ...documents];
    }
    const primarySpecPdfUrl = documents[0]?.url || '';

    return {
      id,
      title: String(r.title),
      sector: String(r.sector),
      prodScope: (r.prod_scope as 'SINGLE' | 'INTEGRATED') || 'SINGLE',
      scopeBadge: String(r.scope_badge),
      clusterId: String(r.cluster_id),
      clusterName: String(r.cluster_name),
      enterpriseName: String(r.enterprise_name),
      enterpriseOwner: String(r.enterprise_owner),
      enterprisePhone: String(r.enterprise_phone),
      unionName: String(r.union_name),
      priceUsd: Number(r.price_usd),
      unit: String(r.unit),
      dailyCapacity: String(r.daily_capacity),
      sampleAvailable: Boolean(r.sample_available),
      image: mainImage,
      galleryImages,
      videoUrl: primaryVideoUrl,
      videoUrls,
      specPdfUrl: primarySpecPdfUrl,
      documents,
      priceSavingHighlight: String(r.price_saving_highlight || ''),
      qualityEdgeHighlight: String(r.quality_edge_highlight || ''),
      description: String(r.description),
      manufacturingSpecs: String(r.manufacturing_specs),
      status: (r.status as ContentStatus) || 'published',
      isFeatured: Boolean(r.is_featured),
      updatedByAdmin: Boolean(r.updated_by_admin),
      tiers: tiersByProduct.get(id) || [],
      rating: r.rating !== undefined && r.rating !== null ? Number(r.rating) : 4.8,
      ratingsCount:
        r.ratings_count !== undefined && r.ratings_count !== null ? Number(r.ratings_count) : 8,
      reviews: (() => {
        try {
          const parsed = JSON.parse(String(r.reviews || '[]'));
          return Array.isArray(parsed) ? (parsed as ProductReview[]) : [];
        } catch {
          return [];
        }
      })(),
    };
  });
}

export function getProductById(productId: string): Product | undefined {
  const all = getProducts(false);
  return all.find((p) => p.id === productId);
}

/**
 * Resolves the primary sector for attribution in analytics and reports.
 */
export function resolveAttributedSector(productSector: string, clusterId: string): string {
  if (productSector && productSector !== 'منتج تكاملي مشترك') {
    return productSector;
  }
  const clusterRow = db.prepare('SELECT sector FROM clusters WHERE id = ?').get(clusterId) as
    | { sector: string }
    | undefined;
  if (clusterRow && clusterRow.sector) {
    return clusterRow.sector;
  }
  return productSector || 'الصناعات المعدنية والهندسية';
}

/**
 * Server-side price tier calculation based on product's custom minQty thresholds
 */
export function calculateProductTierForQuantity(
  product: Product,
  quantity: number
): {
  label: string;
  minQty: number;
  unitPriceUsd: number;
  discountTag: string;
  totalPriceUsd: number;
} {
  const safeQty = Math.max(1, Math.floor(Number(quantity) || 1));
  const sortedTiers = [...(product.tiers || [])].sort((a, b) => a.minQty - b.minQty);

  if (sortedTiers.length === 0) {
    const unitPriceUsd = Number(product.priceUsd) || 0;
    return {
      label: 'سعر أساسي',
      minQty: 1,
      unitPriceUsd,
      discountTag: 'سعر أساسي',
      totalPriceUsd: Number((unitPriceUsd * safeQty).toFixed(2)),
    };
  }

  let matched = sortedTiers[0];
  for (const tier of sortedTiers) {
    if (safeQty >= tier.minQty) {
      matched = tier;
    }
  }

  const unitPriceUsd = Number(matched.priceUsd);
  const totalPriceUsd = Number((unitPriceUsd * safeQty).toFixed(2));
  return {
    label: matched.label,
    minQty: matched.minQty,
    unitPriceUsd,
    discountTag: matched.discountTag,
    totalPriceUsd,
  };
}

export function createRfqOrder(input: {
  idempotencyKey?: string;
  buyerId?: number;
  buyerEmail?: string;
  productId: string;
  buyerOrg: string;
  contactPerson: string;
  contactInfo: string;
  quantity: number;
  contractMode: ContractMode;
  currency: 'USD' | 'ILS';
  notes?: string;
}): RfqOrder {
  // Check idempotency key first to prevent duplicate submissions
  if (input.idempotencyKey) {
    const existing = db
      .prepare('SELECT * FROM rfq_orders WHERE idempotency_key = ?')
      .get(input.idempotencyKey) as Record<string, unknown> | undefined;
    if (existing) {
      return mapRfqRow(existing, true);
    }
  }

  // Also check if an identical submission happened within the last 45 seconds
  const recentDuplicate = db
    .prepare(
      `SELECT * FROM rfq_orders
       WHERE product_id = ? AND buyer_org = ? AND contact_person = ? AND contact_info = ?
         AND quantity = ? AND contract_mode = ?
         AND datetime(created_at) >= datetime('now', '-45 seconds')
       ORDER BY id DESC LIMIT 1`
    )
    .get(
      input.productId,
      input.buyerOrg.trim(),
      input.contactPerson.trim(),
      input.contactInfo.trim(),
      input.quantity,
      input.contractMode
    ) as Record<string, unknown> | undefined;

  if (recentDuplicate) {
    return mapRfqRow(recentDuplicate, true);
  }

  const product = getProductById(input.productId);
  if (!product || product.status !== 'published') {
    throw new Error('المنتج المطلوب غير متاح حاليًا للتعاقد.');
  }

  const settings = getSettings();
  const exchangeRate = Number(settings.exchangeRate) || 3.1;
  const tierCalc = calculateProductTierForQuantity(product, input.quantity);
  const attributedSector = resolveAttributedSector(product.sector, product.clusterId);

  const currency = input.currency === 'ILS' ? 'ILS' : 'USD';
  const unitPriceDisplay =
    currency === 'ILS'
      ? Number((tierCalc.unitPriceUsd * exchangeRate).toFixed(2))
      : tierCalc.unitPriceUsd;
  const totalPriceDisplay =
    currency === 'ILS'
      ? Number((tierCalc.totalPriceUsd * exchangeRate).toFixed(2))
      : tierCalc.totalPriceUsd;

  // Generate unique human-readable reference number
  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM rfq_orders').get() as { cnt: number };
  const seq = (Number(countRow?.cnt) || 0) + 1001;
  const randomSuffix = Math.floor(10 + Math.random() * 89);
  const refNumber = `RFQ-GZ-${seq}-${randomSuffix}`;

  const result = db
    .prepare(
      `INSERT INTO rfq_orders (
        ref_number, idempotency_key, buyer_id, buyer_email, product_id, product_title, product_sector,
        cluster_id, cluster_name, attributed_sector, enterprise_name,
        buyer_org, contact_person, contact_info, quantity, unit, contract_mode,
        applied_tier_label, applied_tier_min_qty, unit_price_usd, total_price_usd,
        currency_at_submit, exchange_rate_at_submit, unit_price_display, total_price_display,
        notes, internal_notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', 'جديد')`
    )
    .run(
      refNumber,
      input.idempotencyKey || null,
      input.buyerId ?? null,
      (input.buyerEmail || '').toLowerCase().trim(),
      product.id,
      product.title,
      product.sector,
      product.clusterId,
      product.clusterName,
      attributedSector,
      product.enterpriseName,
      input.buyerOrg.trim(),
      input.contactPerson.trim(),
      input.contactInfo.trim(),
      Math.max(1, Math.floor(Number(input.quantity))),
      product.unit,
      input.contractMode,
      tierCalc.label,
      tierCalc.minQty,
      tierCalc.unitPriceUsd,
      tierCalc.totalPriceUsd,
      currency,
      exchangeRate,
      unitPriceDisplay,
      totalPriceDisplay,
      (input.notes || '').trim()
    );

  const insertedId = Number(result.lastInsertRowid);
  db.prepare(
    `INSERT INTO rfq_logs (rfq_id, action, old_status, new_status, note, actor_name)
     VALUES (?, 'إنشاء طلب عرض سعر جديد من البوابة العامة', NULL, 'جديد', ?, ?)`
  ).run(
    insertedId,
    (input.notes || '').trim() || 'تم استلام الطلب وحساب الشريحة السعرية تلقائيًا.',
    input.buyerOrg.trim()
  );

  const row = db.prepare('SELECT * FROM rfq_orders WHERE id = ?').get(insertedId) as Record<
    string,
    unknown
  >;
  return mapRfqRow(row, true);
}

export function getBuyerRfqOrders(buyer: BuyerAccount): RfqOrder[] {
  const rows = db
    .prepare(
      `SELECT * FROM rfq_orders
       WHERE buyer_id = ?
          OR LOWER(buyer_email) = LOWER(?)
          OR LOWER(contact_info) LIKE '%' || LOWER(?) || '%'
       ORDER BY id DESC`
    )
    .all(buyer.id, buyer.email, buyer.email) as Record<string, unknown>[];
  return rows.map((r) => mapRfqRow(r, true));
}

export function mapRfqRow(r: Record<string, unknown>, includeLogs = false): RfqOrder {
  const id = Number(r.id);
  let logs: RfqLog[] | undefined;
  if (includeLogs) {
    const logRows = db
      .prepare('SELECT * FROM rfq_logs WHERE rfq_id = ? ORDER BY id DESC')
      .all(id) as Record<string, unknown>[];
    logs = logRows.map((l) => ({
      id: Number(l.id),
      rfqId: Number(l.rfq_id),
      action: String(l.action),
      oldStatus: l.old_status ? String(l.old_status) : undefined,
      newStatus: l.new_status ? String(l.new_status) : undefined,
      note: l.note ? String(l.note) : undefined,
      actorName: String(l.actor_name),
      createdAt: String(l.created_at),
    }));
  }

  return {
    id,
    refNumber: String(r.ref_number),
    idempotencyKey: r.idempotency_key ? String(r.idempotency_key) : undefined,
    buyerId: r.buyer_id ? Number(r.buyer_id) : undefined,
    buyerEmail: r.buyer_email ? String(r.buyer_email) : undefined,
    productId: String(r.product_id),
    productTitle: String(r.product_title),
    productSector: String(r.product_sector),
    clusterId: String(r.cluster_id),
    clusterName: String(r.cluster_name),
    attributedSector: String(r.attributed_sector),
    enterpriseName: String(r.enterprise_name),
    buyerOrg: String(r.buyer_org),
    contactPerson: String(r.contact_person),
    contactInfo: String(r.contact_info),
    quantity: Number(r.quantity),
    unit: String(r.unit),
    contractMode: (r.contract_mode as ContractMode) || 'توريد شامل',
    appliedTierLabel: String(r.applied_tier_label),
    appliedTierMinQty: Number(r.applied_tier_min_qty),
    unitPriceUsd: Number(r.unit_price_usd),
    totalPriceUsd: Number(r.total_price_usd),
    currencyAtSubmit: (r.currency_at_submit as 'USD' | 'ILS') || 'USD',
    exchangeRateAtSubmit: Number(r.exchange_rate_at_submit),
    unitPriceDisplay: Number(r.unit_price_display),
    totalPriceDisplay: Number(r.total_price_display),
    notes: String(r.notes || ''),
    internalNotes: String(r.internal_notes || ''),
    status: (r.status as RfqStatus) || 'جديد',
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
    logs,
  };
}

export function getRfqOrders(filters?: {
  search?: string;
  sector?: string;
  clusterId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}): RfqOrder[] {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filters?.search && filters.search.trim()) {
    const q = `%${filters.search.trim()}%`;
    conditions.push(
      '(ref_number LIKE ? OR buyer_org LIKE ? OR contact_person LIKE ? OR contact_info LIKE ? OR product_title LIKE ? OR product_id LIKE ?)'
    );
    params.push(q, q, q, q, q, q);
  }
  if (filters?.sector && filters.sector !== 'ALL') {
    conditions.push('(attributed_sector = ? OR product_sector = ?)');
    params.push(filters.sector, filters.sector);
  }
  if (filters?.clusterId && filters.clusterId !== 'ALL') {
    conditions.push('cluster_id = ?');
    params.push(filters.clusterId);
  }
  if (filters?.status && filters.status !== 'ALL') {
    conditions.push('status = ?');
    params.push(filters.status);
  }
  if (filters?.dateFrom) {
    conditions.push('date(created_at) >= date(?)');
    params.push(filters.dateFrom);
  }
  if (filters?.dateTo) {
    conditions.push('date(created_at) <= date(?)');
    params.push(filters.dateTo);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = db
    .prepare(`SELECT * FROM rfq_orders ${whereClause} ORDER BY id DESC`)
    .all(...params) as Record<string, unknown>[];

  return rows.map((r) => mapRfqRow(r, true));
}

export function getAdminReports(filters: {
  dateFrom?: string;
  dateTo?: string;
  sector?: string;
  clusterId?: string;
  status?: string;
  granularity?: 'weekly' | 'monthly';
}): AdminReportsResponse {
  const publishedProducts = (
    db.prepare("SELECT COUNT(*) as cnt FROM products WHERE status = 'published'").get() as {
      cnt: number;
    }
  ).cnt;
  const publishedClusters = (
    db.prepare("SELECT COUNT(*) as cnt FROM clusters WHERE status = 'published'").get() as {
      cnt: number;
    }
  ).cnt;
  const activeSectors = (
    db.prepare("SELECT COUNT(*) as cnt FROM sectors WHERE status = 'published'").get() as {
      cnt: number;
    }
  ).cnt;

  const filteredRfqs = getRfqOrders({
    sector: filters.sector,
    clusterId: filters.clusterId,
    status: filters.status,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });

  const totalRfqsInPeriod = filteredRfqs.length;
  const newRfqsInPeriod = filteredRfqs.filter((r) => r.status === 'جديد').length;
  const inProgressRfqsInPeriod = filteredRfqs.filter(
    (r) => r.status === 'قيد المراجعة' || r.status === 'تم التواصل'
  ).length;
  const completedRfqsInPeriod = filteredRfqs.filter((r) => r.status === 'مغلق').length;
  const estimatedValueUsdInPeriod = Number(
    filteredRfqs.reduce((acc, r) => acc + (r.status !== 'ملغى' ? r.totalPriceUsd : 0), 0).toFixed(2)
  );

  // 1. Time Series (Weekly or Monthly)
  const granularity = filters.granularity || 'weekly';
  const timeMap = new Map<string, { periodLabel: string; dateKey: string; count: number; totalUsd: number }>();

  for (const r of filteredRfqs) {
    const dt = new Date(r.createdAt.replace(' ', 'T') + (r.createdAt.includes('Z') ? '' : 'Z'));
    const validDate = isNaN(dt.getTime()) ? new Date() : dt;
    let dateKey = '';
    let periodLabel = '';

    if (granularity === 'monthly') {
      const year = validDate.getUTCFullYear();
      const month = String(validDate.getUTCMonth() + 1).padStart(2, '0');
      dateKey = `${year}-${month}`;
      periodLabel = `${year}/${month}`;
    } else {
      const d = new Date(Date.UTC(validDate.getUTCFullYear(), validDate.getUTCMonth(), validDate.getUTCDate()));
      const day = d.getUTCDay();
      d.setUTCDate(d.getUTCDate() - day);
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getUTCDate()).padStart(2, '0');
      dateKey = `${y}-${m}-${dayNum}`;
      periodLabel = `أسبوع ${m}/${dayNum}`;
    }

    if (!timeMap.has(dateKey)) {
      timeMap.set(dateKey, { periodLabel, dateKey, count: 0, totalUsd: 0 });
    }
    const entry = timeMap.get(dateKey)!;
    entry.count += 1;
    entry.totalUsd = Number((entry.totalUsd + r.totalPriceUsd).toFixed(2));
  }

  const timeSeries = Array.from(timeMap.values()).sort((a, b) => a.dateKey.localeCompare(b.dateKey));

  // 2. By Sector
  const sectorsList = getSectors(false);
  const sectorMap = new Map<string, { sector: string; count: number; totalUsd: number }>();
  for (const s of sectorsList) {
    sectorMap.set(s.name, { sector: s.name, count: 0, totalUsd: 0 });
  }

  for (const r of filteredRfqs) {
    const primarySector = resolveAttributedSector(r.productSector, r.clusterId);
    if (!sectorMap.has(primarySector)) {
      sectorMap.set(primarySector, { sector: primarySector, count: 0, totalUsd: 0 });
    }
    const item = sectorMap.get(primarySector)!;
    item.count += 1;
    item.totalUsd = Number((item.totalUsd + r.totalPriceUsd).toFixed(2));
  }

  const bySector = Array.from(sectorMap.values()).sort((a, b) => b.count - a.count);

  // 3. By Status
  const allStatuses: RfqStatus[] = ['جديد', 'قيد المراجعة', 'تم التواصل', 'مغلق', 'ملغى'];
  const statusCounts = new Map<RfqStatus, number>();
  for (const st of allStatuses) statusCounts.set(st, 0);
  for (const r of filteredRfqs) {
    statusCounts.set(r.status, (statusCounts.get(r.status) || 0) + 1);
  }
  const byStatus = allStatuses.map((status) => ({
    status,
    count: statusCounts.get(status) || 0,
  }));

  // 4. Top Requested Products
  const prodMap = new Map<
    string,
    {
      productId: string;
      productTitle: string;
      clusterName: string;
      attributedSector: string;
      rfqCount: number;
      totalQuantity: number;
      totalUsd: number;
    }
  >();

  for (const r of filteredRfqs) {
    if (!prodMap.has(r.productId)) {
      prodMap.set(r.productId, {
        productId: r.productId,
        productTitle: r.productTitle,
        clusterName: r.clusterName,
        attributedSector: resolveAttributedSector(r.productSector, r.clusterId),
        rfqCount: 0,
        totalQuantity: 0,
        totalUsd: 0,
      });
    }
    const pEntry = prodMap.get(r.productId)!;
    pEntry.rfqCount += 1;
    pEntry.totalQuantity += r.quantity;
    pEntry.totalUsd = Number((pEntry.totalUsd + r.totalPriceUsd).toFixed(2));
  }

  const topProducts = Array.from(prodMap.values())
    .sort((a, b) => b.rfqCount - a.rfqCount || b.totalUsd - a.totalUsd)
    .slice(0, 10);

  return {
    kpis: {
      publishedProducts,
      publishedClusters,
      activeSectors,
      totalRfqsInPeriod,
      newRfqsInPeriod,
      inProgressRfqsInPeriod,
      completedRfqsInPeriod,
      estimatedValueUsdInPeriod,
    },
    timeSeries,
    bySector,
    byStatus,
    topProducts,
    recentRfqs: filteredRfqs.slice(0, 15),
  };
}

export function getUsers(): UserAccount[] {
  const rows = db
    .prepare('SELECT id, email, name, role, active, created_at FROM users ORDER BY id ASC')
    .all() as Record<string, unknown>[];
  return rows.map((r) => ({
    id: Number(r.id),
    email: String(r.email),
    name: String(r.name),
    role: (r.role as 'admin' | 'editor') || 'editor',
    active: Boolean(r.active),
    createdAt: String(r.created_at),
  }));
}
