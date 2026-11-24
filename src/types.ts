export type ContentStatus = 'draft' | 'published' | 'archived';

export interface PartnerLogo {
  id: string;
  name: string;
  role: string;
  title: string;
  logoUrl: string;
  position: 'right' | 'left' | 'footer';
}

export interface Sector {
  id: string;
  name: string;
  unionName: string;
  description: string;
  sortOrder: number;
  status: ContentStatus;
  rating?: number;
  ratingsCount?: number;
  evaluationNote?: string;
}

export interface Enterprise {
  id: string;
  name: string;
  owner: string;
  phone: string;
  role: 'HOST' | 'MEMBER' | 'PRODUCER';
  clusterId: string;
  governorate: string;
  status: ContentStatus;
}

export interface ClusterMember {
  id: string;
  clusterId: string;
  name: string;
  owner: string;
  enterpriseId?: string;
}

export interface Cluster {
  id: string;
  name: string;
  sector: string;
  unionName: string;
  governorate: string;
  hostEnterprise: string;
  hostOwner: string;
  hostPhone: string;
  centralStations: string;
  status: ContentStatus;
  members: ClusterMember[];
  updatedByAdmin?: boolean;
}

export interface ProductTier {
  id?: number;
  productId?: string;
  tierIndex: number;
  label: string;
  minQty: number;
  priceUsd: number;
  discountTag: string;
}

export interface ProductDocument {
  name: string;
  url: string;
  type?: string;
}

export interface ProductReview {
  id: string;
  authorName?: string;
  stars: number;
  note: string;
  createdAt: string;
}

export interface Product {
  id: string;
  title: string;
  sector: string;
  prodScope: 'SINGLE' | 'INTEGRATED';
  scopeBadge: string;
  clusterId: string;
  clusterName: string;
  enterpriseName: string;
  enterpriseOwner: string;
  enterprisePhone: string;
  unionName: string;
  priceUsd: number;
  unit: string;
  dailyCapacity: string;
  sampleAvailable: boolean;
  image: string;
  galleryImages?: string[];
  videoUrl?: string;
  videoUrls?: string[];
  specPdfUrl?: string;
  documents?: ProductDocument[];
  priceSavingHighlight: string;
  qualityEdgeHighlight: string;
  description: string;
  manufacturingSpecs: string;
  status: ContentStatus;
  isFeatured: boolean;
  tiers: ProductTier[];
  rating?: number;
  ratingsCount?: number;
  reviews?: ProductReview[];
  updatedByAdmin?: boolean;
}

export type RfqStatus = 'جديد' | 'قيد المراجعة' | 'تم التواصل' | 'مغلق' | 'ملغى';

export type ContractMode = 'توريد شامل' | 'مصنعية فقط';

export interface RfqLog {
  id: number;
  rfqId: number;
  action: string;
  oldStatus?: string;
  newStatus?: string;
  note?: string;
  actorName: string;
  createdAt: string;
}

export interface RfqOrder {
  id: number;
  refNumber: string;
  idempotencyKey?: string;
  buyerId?: number;
  buyerEmail?: string;
  productId: string;
  productTitle: string;
  productSector: string;
  clusterId: string;
  clusterName: string;
  attributedSector: string;
  enterpriseName: string;
  buyerOrg: string;
  contactPerson: string;
  contactInfo: string;
  quantity: number;
  unit: string;
  contractMode: ContractMode;
  appliedTierLabel: string;
  appliedTierMinQty: number;
  unitPriceUsd: number;
  totalPriceUsd: number;
  currencyAtSubmit: 'USD' | 'ILS';
  exchangeRateAtSubmit: number;
  unitPriceDisplay: number;
  totalPriceDisplay: number;
  notes: string;
  internalNotes: string;
  status: RfqStatus;
  createdAt: string;
  updatedAt: string;
  logs?: RfqLog[];
}

export interface BuyerAccount {
  id: number;
  name: string;
  organization: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface PlatformSettings {
  officialProjectName: string;
  heroTitle: string;
  heroSubtitle: string;
  introText: string;
  primaryCtaText: string;
  secondaryCtaText: string;
  heroImages: string[];
  exchangeRate: number;
  howClustersWorkTitle: string;
  howClustersWorkSteps: {
    title: string;
    description: string;
  }[];
  partners: PartnerLogo[];
}

export interface PublicBootstrapData {
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
}

export interface UserAccount {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'editor';
  active: boolean;
  createdAt: string;
}

export interface AdminReportsResponse {
  kpis: {
    publishedProducts: number;
    publishedClusters: number;
    activeSectors: number;
    totalRfqsInPeriod: number;
    newRfqsInPeriod: number;
    inProgressRfqsInPeriod: number;
    completedRfqsInPeriod: number;
    estimatedValueUsdInPeriod: number;
  };
  timeSeries: {
    periodLabel: string;
    dateKey: string;
    count: number;
    totalUsd: number;
  }[];
  bySector: {
    sector: string;
    count: number;
    totalUsd: number;
  }[];
  byStatus: {
    status: RfqStatus;
    count: number;
  }[];
  topProducts: {
    productId: string;
    productTitle: string;
    clusterName: string;
    attributedSector: string;
    rfqCount: number;
    totalQuantity: number;
    totalUsd: number;
  }[];
  recentRfqs: RfqOrder[];
}
