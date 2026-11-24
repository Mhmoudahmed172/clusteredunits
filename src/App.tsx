import React, { useState, useEffect, useCallback } from 'react';
import type { BuyerAccount, Product, PublicBootstrapData, RfqOrder } from './types.ts';
import { PublicHeader, PublicFooter } from './components/PublicHeaderFooter.tsx';
import {
  LandingView,
  CatalogView,
  ProductDetailView,
  ClustersDirectoryView,
  ClusterDetailView,
  MyOrdersView,
} from './components/PublicViews.tsx';
import { BuyerAuthModal, RfqModal, RfqLookupModal } from './components/RfqModal.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';

function getStoredBuyerToken(): string {
  try {
    return localStorage.getItem('gaza_hcc_buyer_token') || '';
  } catch {
    return '';
  }
}

function setStoredBuyerToken(val: string): void {
  try {
    localStorage.setItem('gaza_hcc_buyer_token', val);
  } catch {
    // Ignore storage errors in restricted cross-origin iframes
  }
}

function removeStoredBuyerToken(): void {
  try {
    localStorage.removeItem('gaza_hcc_buyer_token');
  } catch {
    // Ignore storage errors in restricted cross-origin iframes
  }
}

export default function App() {
  const [route, setRoute] = useState<string>(() => window.location.pathname || '/');
  const [bootstrap, setBootstrap] = useState<PublicBootstrapData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currency, setCurrency] = useState<'USD' | 'ILS'>('USD');

  // Buyer Account State
  const [buyerToken, setBuyerToken] = useState<string>(() => getStoredBuyerToken());
  const [buyer, setBuyer] = useState<BuyerAccount | null>(null);
  const [buyerOrders, setBuyerOrders] = useState<RfqOrder[]>([]);
  const [buyerOrdersLoading, setBuyerOrdersLoading] = useState<boolean>(false);
  const [showBuyerAuthModal, setShowBuyerAuthModal] = useState<boolean>(false);
  const [pendingRfq, setPendingRfq] = useState<{ product: Product; qty: number } | null>(null);

  // External catalog filters when navigating from Landing or Cluster pages
  const [catalogSectorFilter, setCatalogSectorFilter] = useState<string>('ALL');
  const [catalogClusterFilter, setCatalogClusterFilter] = useState<string>('ALL');

  // RFQ Modal State
  const [rfqModalProduct, setRfqModalProduct] = useState<Product | null>(null);
  const [rfqInitialQty, setRfqInitialQty] = useState<number>(1);
  const [showRfqLookup, setShowRfqLookup] = useState<boolean>(false);

  const fetchBootstrap = useCallback(async () => {
    try {
      const res = await fetch('/api/public/bootstrap');
      if (res.ok) {
        const data = await res.json();
        setBootstrap(data);
      }
    } catch (err) {
      console.error('Failed to load bootstrap data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBuyerOrders = useCallback(async (tokenToUse: string) => {
    if (!tokenToUse) return;
    setBuyerOrdersLoading(true);
    try {
      const res = await fetch('/api/buyer/rfqs', {
        headers: { Authorization: `Bearer ${tokenToUse}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBuyerOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load buyer orders:', err);
    } finally {
      setBuyerOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBootstrap();
  }, [fetchBootstrap]);

  // Verify buyer session on load or token change
  useEffect(() => {
    if (!buyerToken) {
      setBuyer(null);
      setBuyerOrders([]);
      return;
    }
    fetch('/api/buyer/me', {
      headers: { Authorization: `Bearer ${buyerToken}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.buyer) {
          setBuyer(data.buyer);
          fetchBuyerOrders(buyerToken);
        } else {
          removeStoredBuyerToken();
          setBuyerToken('');
          setBuyer(null);
          setBuyerOrders([]);
        }
      })
      .catch(() => {
        // Keep local state if transient error
      });
  }, [buyerToken, fetchBuyerOrders]);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Ensure scrollTo(0, 0) on every route transition
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  const navigate = (nextRoute: string, resetFilters = true) => {
    if (resetFilters && nextRoute === '/products') {
      setCatalogSectorFilter('ALL');
      setCatalogClusterFilter('ALL');
    }
    window.history.pushState({}, '', nextRoute);
    setRoute(nextRoute);
    window.scrollTo(0, 0);
  };

  const handleSelectSectorInCatalog = (sectorName: string) => {
    setCatalogSectorFilter(sectorName);
    setCatalogClusterFilter('ALL');
    navigate('/products', false);
  };

  const handleFilterCatalogByCluster = (clusterId: string) => {
    setCatalogClusterFilter(clusterId);
    setCatalogSectorFilter('ALL');
    navigate('/products', false);
  };

  const handleOpenRfq = (product: Product, initialQty = 1) => {
    if (!buyer) {
      setPendingRfq({ product, qty: initialQty });
      setShowBuyerAuthModal(true);
      return;
    }
    setRfqModalProduct(product);
    setRfqInitialQty(initialQty);
  };

  const handleBuyerAuthSuccess = (authenticatedBuyer: BuyerAccount, newToken: string) => {
    setStoredBuyerToken(newToken);
    setBuyerToken(newToken);
    setBuyer(authenticatedBuyer);
    setShowBuyerAuthModal(false);
    fetchBuyerOrders(newToken);

    if (pendingRfq) {
      setRfqModalProduct(pendingRfq.product);
      setRfqInitialQty(pendingRfq.qty);
      setPendingRfq(null);
    }
  };

  const handleBuyerLogout = async () => {
    try {
      if (buyerToken) {
        await fetch('/api/buyer/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${buyerToken}` },
        });
      }
    } finally {
      removeStoredBuyerToken();
      setBuyerToken('');
      setBuyer(null);
      setBuyerOrders([]);
    }
  };

  if (loading || !bootstrap) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center p-6" dir="rtl">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[#0F253E] border-t-[#C8A24B] rounded-full animate-spin mx-auto" />
          <p className="text-sm font-black text-[#0F253E]">
            جاري تحميل منصة منتجات الوحدات الإنتاجية العنقودية — قطاع غزة...
          </p>
        </div>
      </div>
    );
  }

  // Admin Dashboard Route (/admin)
  if (route.startsWith('/admin')) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#F4F6F9]">
        <AdminDashboard
          onBackToPublic={() => navigate('/')}
          onDataMutated={fetchBootstrap}
        />
      </div>
    );
  }

  // Resolve Product Detail Route (/products/:id)
  const productDetailMatch = route.match(/^\/products\/([^/]+)$/);
  const activeProductId = productDetailMatch ? decodeURIComponent(productDetailMatch[1]) : null;
  const activeProduct = activeProductId
    ? bootstrap.products.find((p) => p.id === activeProductId)
    : null;

  // Resolve Cluster Detail Route (/clusters/:id)
  const clusterDetailMatch = route.match(/^\/clusters\/([^/]+)$/);
  const activeClusterId = clusterDetailMatch ? decodeURIComponent(clusterDetailMatch[1]) : null;
  const activeCluster = activeClusterId
    ? bootstrap.clusters.find((c) => c.id === activeClusterId)
    : null;

  return (
    <div dir="rtl" className="min-h-screen flex flex-col bg-[#F4F6F9] text-slate-900">
      <PublicHeader
        settings={bootstrap.settings}
        activeRoute={route}
        onNavigate={(r) => navigate(r)}
        currency={currency}
        onToggleCurrency={setCurrency}
        stats={{
          publishedProductsCount: bootstrap.stats.publishedProductsCount,
          publishedClustersCount: bootstrap.stats.publishedClustersCount,
          activeSectorsCount: bootstrap.stats.activeSectorsCount,
        }}
        onOpenRfqLookup={() => setShowRfqLookup(true)}
        buyer={buyer}
        buyerOrdersCount={buyerOrders.length}
        onOpenBuyerAuth={() => {
          setPendingRfq(null);
          setShowBuyerAuthModal(true);
        }}
        onBuyerLogout={handleBuyerLogout}
      />

      <main className="flex-1">
        {activeProduct ? (
          <ProductDetailView
            product={activeProduct}
            cluster={bootstrap.clusters.find((c) => c.id === activeProduct.clusterId)}
            currency={currency}
            exchangeRate={bootstrap.settings.exchangeRate}
            onBackToCatalog={() => navigate('/products', false)}
            onViewCluster={(cid) => navigate(`/clusters/${encodeURIComponent(cid)}`)}
            onOpenRfq={handleOpenRfq}
            onProductRated={fetchBootstrap}
          />
        ) : activeCluster ? (
          <ClusterDetailView
            cluster={activeCluster}
            products={bootstrap.products}
            currency={currency}
            exchangeRate={bootstrap.settings.exchangeRate}
            onBackToClusters={() => navigate('/clusters')}
            onViewProduct={(pid) => navigate(`/products/${encodeURIComponent(pid)}`)}
            onFilterCatalogByCluster={handleFilterCatalogByCluster}
            onOpenRfq={handleOpenRfq}
          />
        ) : route.startsWith('/my-orders') ? (
          <MyOrdersView
            buyer={buyer}
            orders={buyerOrders}
            loading={buyerOrdersLoading}
            onOpenBuyerAuth={() => {
              setPendingRfq(null);
              setShowBuyerAuthModal(true);
            }}
            onNavigateToCatalog={() => navigate('/products')}
            onViewProduct={(pid) => navigate(`/products/${encodeURIComponent(pid)}`)}
            onRefreshOrders={() => fetchBuyerOrders(buyerToken)}
          />
        ) : route.startsWith('/products') ? (
          <CatalogView
            products={bootstrap.products}
            clusters={bootstrap.clusters}
            sectors={bootstrap.sectors}
            currency={currency}
            exchangeRate={bootstrap.settings.exchangeRate}
            initialSectorFilter={catalogSectorFilter}
            initialClusterFilter={catalogClusterFilter}
            onViewProduct={(pid) => navigate(`/products/${encodeURIComponent(pid)}`)}
            onViewCluster={(cid) => navigate(`/clusters/${encodeURIComponent(cid)}`)}
            onOpenRfq={handleOpenRfq}
          />
        ) : route.startsWith('/clusters') ? (
          <ClustersDirectoryView
            clusters={bootstrap.clusters}
            products={bootstrap.products}
            sectors={bootstrap.sectors}
            onViewCluster={(cid) => navigate(`/clusters/${encodeURIComponent(cid)}`)}
            onFilterCatalogByCluster={handleFilterCatalogByCluster}
          />
        ) : (
          <LandingView
            settings={bootstrap.settings}
            sectors={bootstrap.sectors}
            clusters={bootstrap.clusters}
            products={bootstrap.products}
            stats={bootstrap.stats}
            currency={currency}
            onNavigate={(r) => navigate(r)}
            onSelectSectorInCatalog={handleSelectSectorInCatalog}
            onViewProduct={(pid) => navigate(`/products/${encodeURIComponent(pid)}`)}
            onViewCluster={(cid) => navigate(`/clusters/${encodeURIComponent(cid)}`)}
            onOpenRfq={handleOpenRfq}
          />
        )}
      </main>

      <PublicFooter settings={bootstrap.settings} onNavigate={(r) => navigate(r)} />

      {/* Buyer Free Account Login / Registration Modal */}
      {showBuyerAuthModal && (
        <BuyerAuthModal
          pendingProduct={pendingRfq?.product || null}
          onClose={() => {
            setShowBuyerAuthModal(false);
            setPendingRfq(null);
          }}
          onSuccessAuth={handleBuyerAuthSuccess}
        />
      )}

      {/* RFQ Contracting Modal */}
      {rfqModalProduct && (
        <RfqModal
          product={rfqModalProduct}
          initialQuantity={rfqInitialQty}
          currency={currency}
          exchangeRate={bootstrap.settings.exchangeRate}
          buyer={buyer}
          buyerToken={buyerToken}
          onClose={() => setRfqModalProduct(null)}
          onSuccessOrder={() => fetchBuyerOrders(buyerToken)}
          onNavigateToMyOrders={() => navigate('/my-orders')}
        />
      )}

      {/* RFQ Status Lookup Modal */}
      {showRfqLookup && <RfqLookupModal onClose={() => setShowRfqLookup(false)} />}
    </div>
  );
}
