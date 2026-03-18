import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import GlobalDateRangePicker, { useDateRange } from "@/components/shared/GlobalDateRangePicker";
import {
  LayoutGrid, Download, Save, FileBarChart, Sparkles, Filter,
  BarChart3, ChevronDown, ChevronUp
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from "recharts";

// Metric definitions
const METRIC_GROUPS = [
  {
    label: "Marketing Metrics", id: "marketing",
    metrics: [
      { key: "spend", label: "Spend", format: "currency" },
      { key: "impressions", label: "Impressions", format: "number" },
      { key: "clicks", label: "Clicks", format: "number" },
      { key: "cpc", label: "CPC", format: "currency" },
      { key: "cpm", label: "CPM", format: "currency", derived: true },
      { key: "ctr", label: "CTR", format: "percent" },
    ],
  },
  {
    label: "Conversion Metrics", id: "conversion",
    metrics: [
      { key: "leads", label: "Leads", format: "number" },
      { key: "purchases", label: "Purchases", format: "number" },
      { key: "conversions", label: "Conversion Rate", format: "percent", derived: true },
      { key: "cpl", label: "Cost per Lead", format: "currency", derived: true },
      { key: "cpa", label: "Cost per Acquisition", format: "currency" },
    ],
  },
  {
    label: "Revenue Metrics", id: "revenue",
    metrics: [
      { key: "revenue", label: "Revenue", format: "currency" },
      { key: "net_revenue", label: "Net Revenue", format: "currency" },
      { key: "roas", label: "ROAS", format: "multiplier" },
      { key: "gross_revenue", label: "Gross Revenue", format: "currency" },
      { key: "refunds", label: "Refunds", format: "currency" },
    ],
  },
  {
    label: "E-commerce Metrics", id: "ecommerce",
    metrics: [
      { key: "add_to_cart", label: "Add to Cart", format: "number" },
      { key: "checkouts", label: "Checkout Initiated", format: "number" },
      { key: "purchases_count", label: "Purchases", format: "number" },
      { key: "product_name", label: "Product Name", format: "text" },
      { key: "product_sku", label: "SKU", format: "text" },
    ],
  },
  {
    label: "Funnel Metrics", id: "funnel",
    metrics: [
      { key: "view_to_cart_rate", label: "View → Cart Rate", format: "percent", derived: true },
      { key: "cart_to_checkout_rate", label: "Cart → Checkout Rate", format: "percent", derived: true },
      { key: "checkout_to_purchase_rate", label: "Checkout → Purchase Rate", format: "percent", derived: true },
    ],
  },
];

const DIMENSION_OPTIONS = [
  { key: "platform", label: "Platform" },
  { key: "campaign_name", label: "Campaign" },
  { key: "product_name", label: "Product" },
  { key: "product_category", label: "Category" },
  { key: "country", label: "Country" },
  { key: "device", label: "Device" },
  { key: "date", label: "Date" },
];

const PLATFORMS = [
  { value: "google_ads", label: "Google Ads" },
  { value: "meta_ads", label: "Meta Ads" },
  { value: "tiktok_ads", label: "TikTok Ads" },
  { value: "linkedin_ads", label: "LinkedIn Ads" },
  { value: "bing_ads", label: "Bing Ads" },
];

const PRESETS = [
  {
    name: "Lead Generation Report",
    icon: "🎯",
    metrics: ["spend", "leads", "cpl", "cpa", "clicks", "ctr"],
    dimension: "campaign_name",
  },
  {
    name: "E-commerce Sales Report",
    icon: "🛒",
    metrics: ["spend", "revenue", "roas", "purchases", "add_to_cart", "checkouts"],
    dimension: "product_name",
  },
  {
    name: "ROAS Optimization Report",
    icon: "📈",
    metrics: ["spend", "revenue", "roas", "cpc", "ctr", "cpa"],
    dimension: "platform",
  },
  {
    name: "Funnel Drop-off Report",
    icon: "🔄",
    metrics: ["add_to_cart", "checkouts", "purchases", "view_to_cart_rate", "cart_to_checkout_rate", "checkout_to_purchase_rate"],
    dimension: "campaign_name",
  },
  {
    name: "Product Performance Report",
    icon: "📦",
    metrics: ["revenue", "purchases", "roas", "spend", "product_name", "product_sku"],
    dimension: "product_name",
  },
];

type MetricRow = Record<string, any>;

const CoachReportBuilder = () => {
  const { user } = useAuth();
  const [rawData, setRawData] = useState<MetricRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["spend", "revenue", "roas"]);
  const [selectedDimension, setSelectedDimension] = useState("campaign_name");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const { dateRange, setDateRange, dateFrom, dateTo } = useDateRange("last30");
  const [campaignFilter, setCampaignFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");

  // UI state
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["marketing", "conversion", "revenue"]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [reportName, setReportName] = useState("");
  const [reportGenerated, setReportGenerated] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("campaign_metrics")
        .select("*")
        .eq("coach_id", user.id)
        .order("date", { ascending: false });
      if (data) setRawData(data as MetricRow[]);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const filtered = useMemo(() => {
    let d = rawData;
    if (selectedPlatforms.length > 0) d = d.filter(r => selectedPlatforms.includes(r.platform));
    if (dateFrom) d = d.filter(r => r.date >= dateFrom);
    if (dateTo) d = d.filter(r => r.date <= dateTo);
    if (campaignFilter) d = d.filter(r => r.campaign_name?.toLowerCase().includes(campaignFilter.toLowerCase()));
    if (countryFilter) d = d.filter(r => r.country?.toLowerCase().includes(countryFilter.toLowerCase()));
    return d;
  }, [rawData, selectedPlatforms, dateFrom, dateTo, campaignFilter, countryFilter]);

  // Aggregate by dimension
  const reportData = useMemo(() => {
    if (!reportGenerated) return [];
    const map = new Map<string, MetricRow>();
    filtered.forEach(row => {
      const key = row[selectedDimension] || "Unknown";
      const cur = map.get(key) || { _dimension: key, _count: 0 };
      cur._count += 1;
      // Sum numeric fields
      ["spend", "impressions", "clicks", "conversions", "revenue", "leads",
        "add_to_cart", "checkouts", "purchases", "gross_revenue", "net_revenue", "refunds"
      ].forEach(f => {
        cur[f] = (cur[f] || 0) + Number(row[f] || 0);
      });
      // Keep text fields from first row
      ["product_name", "product_sku", "product_category", "platform", "campaign_name", "country", "device", "date"].forEach(f => {
        if (!cur[f]) cur[f] = row[f];
      });
      map.set(key, cur);
    });

    // Derive calculated metrics
    return Array.from(map.values()).map((r): MetricRow => ({
      ...r,
      cpc: r.clicks > 0 ? r.spend / r.clicks : 0,
      cpm: r.impressions > 0 ? (r.spend / r.impressions) * 1000 : 0,
      ctr: r.impressions > 0 ? (r.clicks / r.impressions) * 100 : 0,
      roas: r.spend > 0 ? r.revenue / r.spend : 0,
      cpa: r.conversions > 0 ? r.spend / r.conversions : 0,
      cpl: r.leads > 0 ? r.spend / r.leads : 0,
      purchases_count: r.purchases,
      view_to_cart_rate: r.impressions > 0 ? (r.add_to_cart / r.impressions) * 100 : 0,
      cart_to_checkout_rate: r.add_to_cart > 0 ? (r.checkouts / r.add_to_cart) * 100 : 0,
      checkout_to_purchase_rate: r.checkouts > 0 ? (r.purchases / r.checkouts) * 100 : 0,
    }));
  }, [filtered, selectedDimension, reportGenerated]);

  const toggleMetric = (key: string) => {
    setSelectedMetrics(prev =>
      prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]
    );
  };

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const togglePlatform = (value: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(value) ? prev.filter(p => p !== value) : [...prev, value]
    );
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setSelectedMetrics(preset.metrics);
    setSelectedDimension(preset.dimension);
    toast.success(`Applied: ${preset.name}`);
  };

  const formatValue = (value: any, fmt: string) => {
    if (value == null) return "—";
    if (fmt === "currency") return `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
    if (fmt === "percent") return `${Number(value).toFixed(2)}%`;
    if (fmt === "multiplier") return `${Number(value).toFixed(1)}x`;
    if (fmt === "number") return Number(value).toLocaleString("en-IN");
    return String(value);
  };

  const allMetricsFlat = METRIC_GROUPS.flatMap(g => g.metrics);

  const activeMetricDefs = selectedMetrics
    .map(key => allMetricsFlat.find(m => m.key === key))
    .filter(Boolean) as typeof allMetricsFlat;

  const exportCSV = () => {
    if (!reportData.length) { toast.error("No data"); return; }
    const dimLabel = DIMENSION_OPTIONS.find(d => d.key === selectedDimension)?.label || selectedDimension;
    const headers = [dimLabel, ...activeMetricDefs.map(m => m.label)];
    const rows = reportData.map(r => [
      r._dimension,
      ...activeMetricDefs.map(m => {
        const v = r[m.key];
        return v != null ? Number(v).toFixed(2) : "";
      }),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `custom-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  if (loading) return <div className="flex justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileBarChart className="h-6 w-6 text-primary" /> Custom Report Builder
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Select metrics, dimensions, and filters to build your custom report</p>
        </div>
        <div className="flex gap-2">
          {reportGenerated && (
            <>
              <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
            </>
          )}
        </div>
      </div>

      {/* Presets */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Quick Presets</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <Button key={p.name} variant="outline" size="sm" className="text-xs gap-1" onClick={() => applyPreset(p)}>
              <span>{p.icon}</span> {p.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Left: Metric & Dimension Selector */}
        <div className="space-y-4">
          {/* Metrics */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-primary" /> Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[400px]">
                <div className="px-4 pb-4 space-y-1">
                  {METRIC_GROUPS.map(group => (
                    <div key={group.id}>
                      <button
                        className="flex items-center justify-between w-full py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                        onClick={() => toggleGroup(group.id)}
                      >
                        {group.label}
                        {expandedGroups.includes(group.id) ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                      {expandedGroups.includes(group.id) && (
                        <div className="space-y-1 pl-1 mb-2">
                          {group.metrics.map(m => (
                            <label key={m.key} className="flex items-center gap-2 cursor-pointer text-sm py-0.5">
                              <Checkbox
                                checked={selectedMetrics.includes(m.key)}
                                onCheckedChange={() => toggleMetric(m.key)}
                              />
                              <span className="text-foreground">{m.label}</span>
                              {m.derived && <Badge variant="secondary" className="text-[9px] px-1">calc</Badge>}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Dimension */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Breakdown By</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedDimension} onValueChange={setSelectedDimension}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIMENSION_OPTIONS.map(d => (
                    <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" /> Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Platforms</label>
                <div className="space-y-1 mt-1">
                  {PLATFORMS.map(p => (
                    <label key={p.value} className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox
                        checked={selectedPlatforms.includes(p.value)}
                        onCheckedChange={() => togglePlatform(p.value)}
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <label className="text-xs text-muted-foreground">Date Range</label>
                <div className="mt-1">
                  <GlobalDateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Campaign</label>
                <Input value={campaignFilter} onChange={e => setCampaignFilter(e.target.value)} placeholder="Search campaign..." className="mt-1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Country</label>
                <Input value={countryFilter} onChange={e => setCountryFilter(e.target.value)} placeholder="Search country..." className="mt-1" />
              </div>
              {(selectedPlatforms.length > 0 || campaignFilter || countryFilter) && (
                <Button variant="ghost" size="sm" className="w-full" onClick={() => {
                  setSelectedPlatforms([]);
                  setCampaignFilter("");
                  setCountryFilter("");
                }}>
                  Clear All Filters
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Generate */}
          <Button className="w-full gap-2" onClick={() => setReportGenerated(true)} disabled={selectedMetrics.length === 0}>
            <BarChart3 className="h-4 w-4" /> Generate Report
          </Button>
        </div>

        {/* Right: Report Output */}
        <div className="space-y-4">
          {!reportGenerated ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <FileBarChart className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">Select metrics & click Generate</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Choose from {allMetricsFlat.length} metrics and {DIMENSION_OPTIONS.length} dimensions</p>
                <p className="text-xs text-muted-foreground/40 mt-4">Or use a preset above to get started quickly</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">{filtered.length} records</Badge>
                <Badge variant="secondary">{selectedMetrics.length} metrics</Badge>
                <Badge variant="secondary">By {DIMENSION_OPTIONS.find(d => d.key === selectedDimension)?.label}</Badge>
                {selectedPlatforms.length > 0 && (
                  <Badge variant="outline">{selectedPlatforms.length} platform(s)</Badge>
                )}
              </div>

              {/* Chart */}
              {reportData.length > 0 && activeMetricDefs.some(m => m.format !== "text") && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Visual Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={reportData.slice(0, 20)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="_dimension" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={0} angle={-30} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                        {activeMetricDefs.filter(m => m.format !== "text").slice(0, 3).map((m, i) => (
                          <Bar key={m.key} dataKey={m.key} fill={`hsl(${72 + i * 60}, 70%, 50%)`} name={m.label} radius={[4, 4, 0, 0]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{DIMENSION_OPTIONS.find(d => d.key === selectedDimension)?.label}</TableHead>
                          {activeMetricDefs.map(m => (
                            <TableHead key={m.key} className="text-right">{m.label}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={activeMetricDefs.length + 1} className="text-center text-muted-foreground py-12">
                              No data matches your filters.
                            </TableCell>
                          </TableRow>
                        ) : (
                          reportData.map((row, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium max-w-[200px] truncate">{row._dimension}</TableCell>
                              {activeMetricDefs.map(m => (
                                <TableCell key={m.key} className="text-right">
                                  {formatValue(row[m.key], m.format)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoachReportBuilder;
