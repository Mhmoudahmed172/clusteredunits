import React, { useState } from 'react';
import {
  Eye,
  FileSignature,
  Factory,
  Images,
  Video,
  FileText,
  Scale,
} from 'lucide-react';
import type { Product } from '../types.ts';

interface ProductCardProps {
  product: Product;
  currency: 'USD' | 'ILS';
  exchangeRate: number;
  onViewProduct: (productId: string) => void;
  onViewCluster: (clusterId: string) => void;
  onOpenRfq: (product: Product, initialQuantity: number) => void;
  isCompared?: boolean;
  onToggleCompare?: (product: Product) => void;
}

export function formatMoney(
  amountUsd: number,
  currency: 'USD' | 'ILS',
  exchangeRate: number
): string {
  const val = currency === 'ILS' ? amountUsd * exchangeRate : amountUsd;
  const formatted = Number.isInteger(val) ? val.toString() : val.toFixed(2);
  return currency === 'ILS' ? `${formatted} ₪` : `$${formatted}`;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency,
  exchangeRate,
  onViewProduct,
  onViewCluster,
  onOpenRfq,
  isCompared = false,
  onToggleCompare,
}) => {
  const sortedTiers = [...(product.tiers || [])].sort((a, b) => a.minQty - b.minQty);
  const [selectedTierIdx, setSelectedTierIdx] = useState(0);

  const activeTier = sortedTiers[selectedTierIdx] || {
    label: 'سعر أساسي',
    minQty: 1,
    priceUsd: product.priceUsd,
    discountTag: 'سعر أساسي',
  };

  const basePriceUsd = sortedTiers[0]?.priceUsd || product.priceUsd;
  const lowestPriceUsd =
    sortedTiers.length > 1
      ? Math.min(...sortedTiers.map((t) => t.priceUsd))
      : basePriceUsd;
  const maxSavingPct =
    basePriceUsd > 0 && lowestPriceUsd < basePriceUsd
      ? Math.round(((basePriceUsd - lowestPriceUsd) / basePriceUsd) * 100)
      : 0;

  const allUniqueImages = Array.from(
    new Set(
      [product.image, ...(product.galleryImages || [])].filter((u): u is string =>
        Boolean(u && u.trim())
      )
    )
  );
  const totalImagesCount = allUniqueImages.length;
  const primaryDisplayImage = allUniqueImages[0] || '';
  const totalVideosCount = Array.from(
    new Set(
      [product.videoUrl, ...(product.videoUrls || [])].filter((u): u is string =>
        Boolean(u && u.trim())
      )
    )
  ).length;
  const totalDocsCount =
    product.documents && product.documents.length > 0
      ? product.documents.length
      : product.specPdfUrl && product.specPdfUrl.trim()
      ? 1
      : 0;

  return (
    <article
      className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col overflow-hidden group/card ${
        isCompared
          ? 'border-[#C8A24B] ring-2 ring-[#C8A24B]/25 shadow-md'
          : 'border-slate-200/80 hover:border-[#C8A24B]/70 hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      {/* Clean Product Image Container */}
      <div className="relative h-56 bg-slate-100 overflow-hidden">
        {primaryDisplayImage ? (
          <img
            src={primaryDisplayImage}
            alt={product.title}
            referrerPolicy="no-referrer"
            onClick={() => onViewProduct(product.id)}
            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700 ease-out cursor-pointer"
          />
        ) : (
          <div
            onClick={() => onViewProduct(product.id)}
            className="w-full h-full bg-gradient-to-br from-[#0F253E] to-[#1C4587] flex flex-col items-center justify-center text-white/85 p-6 text-center cursor-pointer"
          >
            <Factory className="w-9 h-9 text-[#C8A24B] mb-2" />
            <span className="text-xs font-bold">{product.title}</span>
          </div>
        )}

        {/* Measured Bottom Contrast Scrim */}
        <div
          onClick={() => onViewProduct(product.id)}
          className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 via-black/20 to-transparent cursor-pointer"
        />

        {/* Single Quiet Top-Right Sector Tag */}
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#0F253E]/90 text-white backdrop-blur-xs">
            {product.sector}
          </span>
        </div>

        {/* Optional Compare Toggle Top-Left */}
        {onToggleCompare && (
          <div className="absolute top-3 left-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompare(product);
              }}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                isCompared
                  ? 'bg-[#C8A24B] text-[#0F253E]'
                  : 'bg-black/60 hover:bg-black/80 text-white'
              }`}
              title="إضافة للمقارنة"
            >
              <Scale className="w-3 h-3" />
              <span>{isCompared ? 'في المقارنة ✓' : 'مقارنة'}</span>
            </button>
          </div>
        )}

        {/* Subtle Bottom Media Count (Only for added media) */}
        <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between text-white pointer-events-none text-[11px]">
          <div className="flex items-center gap-2">
            {totalImagesCount > 1 && (
              <span className="inline-flex items-center gap-1 text-white/95 font-bold tabular-nums">
                <Images className="w-3.5 h-3.5 text-[#E5C168]" />
                <span>{totalImagesCount}</span>
              </span>
            )}
            {totalVideosCount > 0 && (
              <span className="inline-flex items-center gap-1 text-white/95 font-bold tabular-nums">
                <Video className="w-3.5 h-3.5 text-[#E5C168]" />
                <span>{totalVideosCount}</span>
              </span>
            )}
            {totalDocsCount > 0 && (
              <span className="inline-flex items-center gap-1 text-white/95 font-bold tabular-nums">
                <FileText className="w-3.5 h-3.5 text-[#E5C168]" />
                <span>{totalDocsCount}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Body — Spacious & Uncluttered */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-2">
          {/* Unboxed Metadata Kicker (Zero-Pill Discipline) */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <span>{product.scopeBadge}</span>
            {product.sampleAvailable && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 font-bold">عينة متاحة للفحص</span>
              </>
            )}
            {product.dailyCapacity && product.dailyCapacity.trim() && (
              <>
                <span aria-hidden="true">·</span>
                <span>طاقة يومية: {product.dailyCapacity}</span>
              </>
            )}
          </div>

          {/* Product Title */}
          <h3
            onClick={() => onViewProduct(product.id)}
            className="text-base sm:text-[17px] font-black text-[#0F253E] hover:text-[#1C4587] cursor-pointer leading-snug transition-colors"
          >
            {product.title}
          </h3>

          {/* Clean Enterprise & Cluster Attribution */}
          <div className="text-xs text-slate-600 leading-relaxed">
            <span className="font-bold text-slate-800">{product.enterpriseName}</span>
            <span className="mx-1.5 text-slate-300" aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => onViewCluster(product.clusterId)}
              className="font-semibold text-[#1C4587] hover:underline cursor-pointer"
            >
              {product.clusterName}
            </button>
          </div>

          {/* Optional Single Concise Highlight Line */}
          {(product.qualityEdgeHighlight?.trim() || product.priceSavingHighlight?.trim()) && (
            <p className="text-xs text-slate-500 line-clamp-2 pt-1 leading-relaxed">
              {product.qualityEdgeHighlight?.trim() || product.priceSavingHighlight?.trim()}
            </p>
          )}
        </div>

        {/* Streamlined Contractual Pricing & Actions */}
        <div className="border-t border-slate-100 pt-4 space-y-3">
          {/* Active Price Row + Bulk Tier Savings Indicator */}
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-slate-500 font-medium">
                السعر التعاقدي ({activeTier.label}):
              </span>
              <div className="text-left tabular-nums">
                <span className="text-base font-black text-[#0F253E]">
                  {formatMoney(activeTier.priceUsd, currency, exchangeRate)}
                </span>
                <span className="text-xs text-slate-500 mr-1">/ {product.unit}</span>
              </div>
            </div>

            {maxSavingPct > 0 && (
              <div className="flex items-center justify-between text-[11px] text-emerald-700 font-bold bg-emerald-50/70 px-2.5 py-1 rounded-lg border border-emerald-200/60 tabular-nums">
                <span>أقل سعر للكميات: {formatMoney(lowestPriceUsd, currency, exchangeRate)}</span>
                <span>توفير حتى {maxSavingPct}%</span>
              </div>
            )}
          </div>

          {/* Compact Segmented Tier Selector */}
          {sortedTiers.length > 1 && (
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
              {sortedTiers.map((tier, idx) => {
                const isSelected = idx === selectedTierIdx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedTierIdx(idx)}
                    className={`py-1.5 px-2 rounded-md text-center transition-colors cursor-pointer tabular-nums ${
                      isSelected
                        ? 'bg-white text-[#0F253E] shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-[#0F253E] font-medium'
                    }`}
                  >
                    <div className="text-[10px] truncate">{tier.label}</div>
                    <div className="text-xs font-black">
                      {formatMoney(tier.priceUsd, currency, exchangeRate)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => onViewProduct(product.id)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#0F253E] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>التفاصيل</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenRfq(product, activeTier.minQty)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#0F253E] hover:bg-[#1C4587] text-[#E5C168] hover:text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <FileSignature className="w-3.5 h-3.5" />
              <span>طلب تعاقد</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
