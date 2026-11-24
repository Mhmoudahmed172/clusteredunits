import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  FileSpreadsheet,
  Filter,
  Layers,
  PackageCheck,
  PieChart,
  RefreshCw,
  TrendingUp,
  Building2,
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type {
  AdminReportsResponse,
  Cluster,
  RfqOrder,
  RfqStatus,
  Sector,
} from '../types.ts';

interface AdminAnalyticsViewProps {
  token: string;
  sectors: Sector[];
  clusters: Cluster[];
  onSelectRfqForDetail: (rfq: RfqOrder) => void;
}

const STATUS_COLORS: Record<RfqStatus, string> = {
  'جديد': '#C8A24B',
  'قيد المراجعة': '#1C4587',
  'تم التواصل': '#0284C7',
  'مغلق': '#059669',
  'ملغى': '#DC2626',
};

export const AdminAnalyticsView: React.FC<AdminAnalyticsViewProps> = ({
  token,
  sectors,
  clusters,
  onSelectRfqForDetail,
}) => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [clusterFilter, setClusterFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [granularity, setGranularity] = useState<'weekly' | 'monthly'>('weekly');

  const [reports, setReports] = useState<AdminReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Tooltip states for interactive SVG charts
  const [hoveredTimeIdx, setHoveredTimeIdx] = useState<number | null>(null);
  const [hoveredSectorIdx, setHoveredSectorIdx] = useState<number | null>(null);
  const [hoveredStatusIdx, setHoveredStatusIdx] = useState<number | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (sectorFilter !== 'ALL') params.set('sector', sectorFilter);
      if (clusterFilter !== 'ALL') params.set('clusterId', clusterFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      params.set('granularity', granularity);

      const res = await fetch(`/api/admin/reports?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }, [token, dateFrom, dateTo, sectorFilter, clusterFilter, statusFilter, granularity]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleResetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSectorFilter('ALL');
    setClusterFilter('ALL');
    setStatusFilter('ALL');
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (sectorFilter !== 'ALL') params.set('sector', sectorFilter);
    if (clusterFilter !== 'ALL') params.set('clusterId', clusterFilter);
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    params.set('token', token);

    const link = document.createElement('a');
    link.href = `/api/admin/reports/csv?${params.toString()}`;
    link.setAttribute('download', 'gaza-clusters-rfq-report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const kpis = reports?.kpis || {
    publishedProducts: 0,
    publishedClusters: 0,
    activeSectors: 0,
    totalRfqsInPeriod: 0,
    newRfqsInPeriod: 0,
    inProgressRfqsInPeriod: 0,
    completedRfqsInPeriod: 0,
    estimatedValueUsdInPeriod: 0,
  };

  const hasAnyRfqs = (reports?.kpis.totalRfqsInPeriod || 0) > 0;

  // Prepare Donut Chart Geometry
  const statusItems = reports?.byStatus || [];
  const totalStatusCount = statusItems.reduce((acc, s) => acc + s.count, 0);
  let cumulativeAngle = 0;
  const donutSegments = statusItems.map((item) => {
    const fraction = totalStatusCount > 0 ? item.count / totalStatusCount : 0;
    const startAngle = cumulativeAngle;
    const sweepAngle = fraction * 360;
    cumulativeAngle += sweepAngle;
    return {
      ...item,
      fraction,
      percentage: totalStatusCount > 0 ? Math.round(fraction * 100) : 0,
      startAngle,
      sweepAngle,
      color: STATUS_COLORS[item.status] || '#64748B',
    };
  });

  // Helper for SVG Donut Arc
  const describeDonutArc = (
    cx: number,
    cy: number,
    r: number,
    startAngleDeg: number,
    sweepAngleDeg: number
  ) => {
    if (sweepAngleDeg >= 359.99) {
      return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}`;
    }
    const startRad = ((startAngleDeg - 90) * Math.PI) / 180;
    const endRad = ((startAngleDeg + sweepAngleDeg - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArcFlag = sweepAngleDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
  };

  // Prepare Line Chart Geometry
  const timeSeries = reports?.timeSeries || [];
  const maxTimeCount = Math.max(1, ...timeSeries.map((t) => t.count));

  // Prepare Sector Bar Chart Geometry
  const sectorSeries = reports?.bySector || [];
  const maxSectorCount = Math.max(1, ...sectorSeries.map((s) => s.count));

  return (
    <div className="space-y-6">
      {/* Unified Filter & Export Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#C8A24B]" />
            <div>
              <h3 className="text-base font-black text-[#0F253E]">
                فلاتر التقارير والمؤشرات التحليلية
              </h3>
              <p className="text-xs text-slate-500">
                ترتبط جميع المؤشرات والرسوم البيانية والجداول وملف التصدير بالفلاتر المحددة أدناه
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={fetchReports}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-xs font-extrabold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>تحديث</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير CSV (UTF-8)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">من تاريخ</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold focus:outline-none focus:border-[#0F253E]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">إلى تاريخ</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold focus:outline-none focus:border-[#0F253E]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">القطاع الصناعي</label>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold bg-white focus:outline-none focus:border-[#0F253E]"
            >
              <option value="ALL">جميع القطاعات</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">التجمع العنقودي</label>
            <select
              value={clusterFilter}
              onChange={(e) => setClusterFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold bg-white focus:outline-none focus:border-[#0F253E]"
            >
              <option value="ALL">جميع التجمعات</option>
              {clusters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} - {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">حالة الطلب</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold bg-white focus:outline-none focus:border-[#0F253E]"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="جديد">جديد</option>
              <option value="قيد المراجعة">قيد المراجعة</option>
              <option value="تم التواصل">تم التواصل</option>
              <option value="مغلق">مغلق</option>
              <option value="ملغى">ملغى</option>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold cursor-pointer"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>المنتجات المنشورة</span>
            <PackageCheck className="w-4 h-4 text-[#0F253E]" />
          </div>
          <div className="text-2xl font-black text-[#0F253E]">{kpis.publishedProducts}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">في المعرض العام</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>التجمعات والقطاعات</span>
            <Building2 className="w-4 h-4 text-[#1C4587]" />
          </div>
          <div className="text-2xl font-black text-[#1C4587]">
            {kpis.publishedClusters}{' '}
            <span className="text-xs font-bold text-slate-500">/ {kpis.activeSectors} قطاعات</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">وحدات إنتاجية نشطة</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-amber-200 bg-amber-50/40 shadow-2xs">
          <div className="flex items-center justify-between text-amber-900 text-xs font-bold mb-1">
            <span>إجمالي الطلبات (RFQ)</span>
            <ClipboardList className="w-4 h-4 text-[#9A7422]" />
          </div>
          <div className="text-2xl font-black text-[#0F253E]">{kpis.totalRfqsInPeriod}</div>
          <div className="text-[11px] text-amber-800 mt-0.5">خلال الفترة المحددة</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>طلبات جديدة</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">{kpis.newRfqsInPeriod}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">بانتظار المراجعة</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>قيد المتابعة والتواصل</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700">{kpis.inProgressRfqsInPeriod}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">قيد المراجعة / تم التواصل</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-emerald-200 bg-emerald-50/40 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-900 text-xs font-bold mb-1">
            <span>القيمة التقديرية للطلبات</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-xl font-black text-emerald-800">
            ${kpis.estimatedValueUsdInPeriod.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700 mt-0.5">إجمالي عروض الأسعار</div>
        </div>
      </div>

      {/* Empty State Banner when no RFQs exist */}
      {!hasAnyRfqs ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 text-[#9A7422] flex items-center justify-center mx-auto">
            <BarChart3 className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-[#0F253E]">
            لا توجد طلبات عروض أسعار (RFQ) مسجلة ضمن الفترة أو الفلاتر المحددة حاليًا
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            تبدأ قاعدة البيانات بـ 0 طلبات افتراضية لضمان دقة التقارير الفعلية. بمجرد إرسال أي طلب عرض سعر وتعاقد من صفحة المعرض أو تفاصيل المنتج، ستظهر الرسوم البيانية التفاعلية (الخطي، الأعمدة، الدائري) وجداول المنتجات الأكثر طلبًا هنا تلقائيًا.
          </p>
        </div>
      ) : (
        /* Interactive Charts Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 1. Line Chart: Weekly/Monthly RFQ Trend */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#1C4587]" />
                <div>
                  <h4 className="text-sm sm:text-base font-black text-[#0F253E]">
                    تطور طلبات عروض الأسعار عبر الزمن
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    مرّر المؤشر فوق النقاط لعرض عدد الطلبات والقيمة التقديرية لكل فترة
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setGranularity('weekly')}
                  className={`px-2.5 py-1 rounded-md text-xs font-extrabold cursor-pointer ${
                    granularity === 'weekly'
                      ? 'bg-[#0F253E] text-[#E5C168]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  أسبوعي
                </button>
                <button
                  type="button"
                  onClick={() => setGranularity('monthly')}
                  className={`px-2.5 py-1 rounded-md text-xs font-extrabold cursor-pointer ${
                    granularity === 'monthly'
                      ? 'bg-[#0F253E] text-[#E5C168]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  شهري
                </button>
              </div>
            </div>

            <div className="relative h-64 w-full pt-4">
              {hoveredTimeIdx !== null && timeSeries[hoveredTimeIdx] && (
                <div className="absolute top-0 left-4 z-10 bg-[#0F253E] text-white px-3.5 py-2 rounded-xl shadow-lg border border-[#C8A24B] text-xs">
                  <div className="font-black text-[#E5C168]">
                    {timeSeries[hoveredTimeIdx].periodLabel}
                  </div>
                  <div>
                    عدد الطلبات: <strong>{timeSeries[hoveredTimeIdx].count} طلب</strong>
                  </div>
                  <div>
                    القيمة التقديرية: <strong>${timeSeries[hoveredTimeIdx].totalUsd.toLocaleString()}</strong>
                  </div>
                </div>
              )}

              <svg viewBox="0 0 600 220" className="w-full h-full overflow-visible">
                {/* Horizontal Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((step, i) => {
                  const y = 180 - step * 140;
                  const val = Math.round(step * maxTimeCount);
                  return (
                    <g key={i}>
                      <line
                        x1={45}
                        y1={y}
                        x2={570}
                        y2={y}
                        stroke="#E2E8F0"
                        strokeDasharray="4 4"
                      />
                      <text x={35} y={y + 4} textAnchor="end" className="fill-slate-400 text-[10px]">
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Line & Area Path */}
                {(() => {
                  const pts = timeSeries.map((item, idx) => {
                    const x =
                      timeSeries.length === 1
                        ? 300
                        : 65 + (idx / (timeSeries.length - 1)) * 485;
                    const y = 180 - (item.count / maxTimeCount) * 140;
                    return { x, y, item, idx };
                  });

                  const linePath = pts
                    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                    .join(' ');
                  const areaPath =
                    pts.length > 1
                      ? `${linePath} L ${pts[pts.length - 1].x} 180 L ${pts[0].x} 180 Z`
                      : '';

                  return (
                    <>
                      {areaPath && (
                        <path d={areaPath} fill="rgba(28, 69, 135, 0.12)" />
                      )}
                      {pts.length > 1 && (
                        <path
                          d={linePath}
                          fill="none"
                          stroke="#1C4587"
                          strokeWidth={3}
                          strokeLinecap="round"
                        />
                      )}
                      {pts.map((p) => (
                        <g
                          key={p.idx}
                          onMouseEnter={() => setHoveredTimeIdx(p.idx)}
                          onMouseLeave={() => setHoveredTimeIdx(null)}
                          className="cursor-pointer"
                        >
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={hoveredTimeIdx === p.idx ? 8 : 5.5}
                            fill={hoveredTimeIdx === p.idx ? '#C8A24B' : '#0F253E'}
                            stroke="#FFFFFF"
                            strokeWidth={2}
                          />
                          <text
                            x={p.x}
                            y={202}
                            textAnchor="middle"
                            className="fill-slate-600 text-[10px] font-bold"
                          >
                            {p.item.periodLabel}
                          </text>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>

          {/* 2. Donut Chart: RFQ Status Distribution */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <PieChart className="w-5 h-5 text-[#C8A24B]" />
              <div>
                <h4 className="text-sm sm:text-base font-black text-[#0F253E]">
                  توزيع حالات الطلبات (RFQ Status)
                </h4>
                <p className="text-[11px] text-slate-500">
                  نسبة كل حالة من إجمالي الطلبات المسجلة ({totalStatusCount})
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center my-auto">
              <div className="relative flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-44 h-44">
                  <circle
                    cx={100}
                    cy={100}
                    r={68}
                    fill="none"
                    stroke="#F1F5F9"
                    strokeWidth={26}
                  />
                  {donutSegments.map((seg, idx) =>
                    seg.count > 0 ? (
                      <path
                        key={seg.status}
                        d={describeDonutArc(100, 100, 68, seg.startAngle, seg.sweepAngle)}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth={hoveredStatusIdx === idx ? 30 : 26}
                        onMouseEnter={() => setHoveredStatusIdx(idx)}
                        onMouseLeave={() => setHoveredStatusIdx(null)}
                        className="transition-all cursor-pointer"
                      />
                    ) : null
                  )}
                  <text
                    x={100}
                    y={95}
                    textAnchor="middle"
                    className="fill-[#0F253E] text-2xl font-black"
                  >
                    {hoveredStatusIdx !== null && donutSegments[hoveredStatusIdx]
                      ? donutSegments[hoveredStatusIdx].count
                      : totalStatusCount}
                  </text>
                  <text
                    x={100}
                    y={115}
                    textAnchor="middle"
                    className="fill-slate-500 text-[11px] font-bold"
                  >
                    {hoveredStatusIdx !== null && donutSegments[hoveredStatusIdx]
                      ? `${donutSegments[hoveredStatusIdx].status} (${donutSegments[hoveredStatusIdx].percentage}%)`
                      : 'إجمالي الطلبات'}
                  </text>
                </svg>
              </div>

              <div className="space-y-2">
                {donutSegments.map((seg, idx) => (
                  <div
                    key={seg.status}
                    onMouseEnter={() => setHoveredStatusIdx(idx)}
                    onMouseLeave={() => setHoveredStatusIdx(null)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                      hoveredStatusIdx === idx
                        ? 'bg-slate-100 border-slate-300'
                        : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ backgroundColor: seg.color }}
                      />
                      <span className="font-bold text-slate-800">{seg.status}</span>
                    </div>
                    <div className="font-black text-[#0F253E]">
                      {seg.count}{' '}
                      <span className="text-[10px] text-slate-500 font-normal">
                        ({seg.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Bar Chart: RFQs by Primary Attributed Sector */}
          <div className="lg:col-span-12 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#0F253E]" />
                <div>
                  <h4 className="text-sm sm:text-base font-black text-[#0F253E]">
                    توزيع الطلبات حسب القطاعات الصناعية الأساسية (رسم أعمدة تفاعلي)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    يُحتسب كل طلب مرة واحدة ضمن قطاعه الأساسي، وترتبط المنتجات التكاملية المشتركة بقطاع التجمع الحاضن لها
                  </p>
                </div>
              </div>

              {hoveredSectorIdx !== null && sectorSeries[hoveredSectorIdx] && (
                <div className="bg-[#0F253E] text-white px-3.5 py-1.5 rounded-xl text-xs border border-[#C8A24B]">
                  <strong className="text-[#E5C168]">
                    {sectorSeries[hoveredSectorIdx].sector}:
                  </strong>{' '}
                  {sectorSeries[hoveredSectorIdx].count} طلب — إجمالي تقديري $
                  {sectorSeries[hoveredSectorIdx].totalUsd.toLocaleString()}
                </div>
              )}
            </div>

            <div className="space-y-3 pt-2">
              {sectorSeries.map((secItem, idx) => {
                const widthPct = Math.max(4, Math.round((secItem.count / maxSectorCount) * 100));
                const isHovered = hoveredSectorIdx === idx;
                return (
                  <div
                    key={secItem.sector}
                    onMouseEnter={() => setHoveredSectorIdx(idx)}
                    onMouseLeave={() => setHoveredSectorIdx(null)}
                    className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-black text-[#0F253E]">{secItem.sector}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-[#1C4587]">
                          {secItem.count} طلب
                        </span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          (${secItem.totalUsd.toLocaleString()})
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-5 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                      <div
                        className="h-full transition-all duration-300 rounded-lg"
                        style={{
                          width: `${secItem.count === 0 ? 0 : widthPct}%`,
                          backgroundColor: isHovered ? '#C8A24B' : '#0F253E',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Top Requested Products & Recent RFQs Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Products Table */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h4 className="text-base font-black text-[#0F253E] mb-3 border-b border-slate-100 pb-2.5">
            أكثر المنتجات طلبًا (Top Products)
          </h4>

          {(reports?.topProducts || []).length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">
              لا توجد بيانات منتجات مطلوبة ضمن الفلاتر الحالية.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="p-2.5 font-extrabold">المنتج</th>
                    <th className="p-2.5 font-extrabold">القطاع المحتسب</th>
                    <th className="p-2.5 font-extrabold">الطلبات</th>
                    <th className="p-2.5 font-extrabold">الكمية</th>
                    <th className="p-2.5 font-extrabold">القيمة ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports!.topProducts.map((tp) => (
                    <tr key={tp.productId} className="hover:bg-slate-50">
                      <td className="p-2.5">
                        <div className="font-mono text-[10px] text-[#1C4587] font-bold">
                          {tp.productId}
                        </div>
                        <div className="font-extrabold text-[#0F253E]">{tp.productTitle}</div>
                      </td>
                      <td className="p-2.5 text-slate-600">{tp.attributedSector}</td>
                      <td className="p-2.5 font-black text-[#0F253E]">{tp.rfqCount}</td>
                      <td className="p-2.5 font-bold text-slate-700">{tp.totalQuantity}</td>
                      <td className="p-2.5 font-black text-emerald-700">
                        ${tp.totalUsd.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Latest RFQs Table */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h4 className="text-base font-black text-[#0F253E] mb-3 border-b border-slate-100 pb-2.5">
            أحدث طلبات عروض الأسعار والتعاقد
          </h4>

          {(reports?.recentRfqs || []).length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">
              لا توجد طلبات مسجلة ضمن الفلاتر الحالية.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="p-2.5 font-extrabold">المرجع</th>
                    <th className="p-2.5 font-extrabold">الجهة الطالبة</th>
                    <th className="p-2.5 font-extrabold">المنتج</th>
                    <th className="p-2.5 font-extrabold">الكمية</th>
                    <th className="p-2.5 font-extrabold">الإجمالي ($)</th>
                    <th className="p-2.5 font-extrabold">الحالة</th>
                    <th className="p-2.5 font-extrabold">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports!.recentRfqs.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-[#0F253E]">{r.refNumber}</td>
                      <td className="p-2.5">
                        <div className="font-bold text-slate-900">{r.buyerOrg}</div>
                        <div className="text-[10px] text-slate-500">{r.contactPerson}</div>
                      </td>
                      <td className="p-2.5 font-bold text-slate-800">{r.productTitle}</td>
                      <td className="p-2.5">
                        {r.quantity} {r.unit}
                      </td>
                      <td className="p-2.5 font-black text-[#0F253E]">
                        ${r.totalPriceUsd.toLocaleString()}
                      </td>
                      <td className="p-2.5">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white"
                          style={{ backgroundColor: STATUS_COLORS[r.status] || '#64748B' }}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <button
                          type="button"
                          onClick={() => onSelectRfqForDetail(r)}
                          className="px-2.5 py-1 rounded bg-[#0F253E] text-[#E5C168] font-bold hover:bg-[#1C4587] cursor-pointer"
                        >
                          متابعة
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
