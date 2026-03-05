import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ALL_COUNTRIES, CountryLocale } from "@/data/countries";
import { toast } from "@/hooks/use-toast";
import { Globe, Search, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";

const SETTING_KEYS = {
  enabledCountries: "enabled_countries", // comma-separated codes or "all"
  defaultCountry: "default_country",     // country code
  localeSelectorEnabled: "locale_selector_enabled", // "true" or "false"
};

const AdminLocaleSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [enabledCodes, setEnabledCodes] = useState<Set<string>>(new Set(ALL_COUNTRIES.map((c) => c.code)));
  const [allEnabled, setAllEnabled] = useState(true);
  const [defaultCountry, setDefaultCountry] = useState("US");
  const [selectorEnabled, setSelectorEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("platform_settings")
      .select("key, value")
      .in("key", [SETTING_KEYS.enabledCountries, SETTING_KEYS.defaultCountry, SETTING_KEYS.localeSelectorEnabled]);

    const settings: Record<string, string> = {};
    (data || []).forEach((r: any) => { settings[r.key] = r.value; });

    if (settings[SETTING_KEYS.enabledCountries] && settings[SETTING_KEYS.enabledCountries] !== "all") {
      const codes = new Set(settings[SETTING_KEYS.enabledCountries].split(",").filter(Boolean));
      setEnabledCodes(codes);
      setAllEnabled(false);
    } else {
      setAllEnabled(true);
      setEnabledCodes(new Set(ALL_COUNTRIES.map((c) => c.code)));
    }

    if (settings[SETTING_KEYS.defaultCountry]) {
      setDefaultCountry(settings[SETTING_KEYS.defaultCountry]);
    }
    if (settings[SETTING_KEYS.localeSelectorEnabled] !== undefined) {
      setSelectorEnabled(settings[SETTING_KEYS.localeSelectorEnabled] !== "false");
    }
    setLoading(false);
  };

  const toggleCountry = (code: string) => {
    setEnabledCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
    setAllEnabled(false);
  };

  const toggleAll = () => {
    if (allEnabled) {
      setEnabledCodes(new Set());
      setAllEnabled(false);
    } else {
      setEnabledCodes(new Set(ALL_COUNTRIES.map((c) => c.code)));
      setAllEnabled(true);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const countryVal = allEnabled ? "all" : Array.from(enabledCodes).join(",");

    // Upsert all settings
    for (const [key, value] of [
      [SETTING_KEYS.enabledCountries, countryVal],
      [SETTING_KEYS.defaultCountry, defaultCountry],
      [SETTING_KEYS.localeSelectorEnabled, selectorEnabled ? "true" : "false"],
    ]) {
      const { data: existing } = await supabase.from("platform_settings").select("id").eq("key", key).single();
      if (existing) {
        await supabase.from("platform_settings").update({ value }).eq("key", key);
      } else {
        await supabase.from("platform_settings").insert({ key, value });
      }
    }

    setSaving(false);
    toast({ title: "Locale settings saved" });
  };

  const filtered = search
    ? ALL_COUNTRIES.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.language.toLowerCase().includes(search.toLowerCase()) ||
        c.currency.toLowerCase().includes(search.toLowerCase())
      )
    : ALL_COUNTRIES;

  if (loading) return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-8" />;

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
        <Globe className="h-5 w-5 text-primary" /> Locale & Currency Settings
      </h2>

      {/* Master toggle */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Location & Currency Selector</h3>
            <p className="text-xs text-muted-foreground">Show or hide the country/currency selector on the website for all visitors.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold ${selectorEnabled ? "text-green-500" : "text-red-500"}`}>
              {selectorEnabled ? "ON" : "OFF"}
            </span>
            <Switch checked={selectorEnabled} onCheckedChange={setSelectorEnabled} />
          </div>
        </div>
      </div>

      {/* Default country */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Default Country & Currency</h3>
        <p className="text-xs text-muted-foreground">Used when geo-detection fails or for new visitors.</p>
        <div className="space-y-2">
          <Label className="text-foreground">Default Country</Label>
          <Select value={defaultCountry} onValueChange={setDefaultCountry}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              {ALL_COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.flag} {c.language} ({c.name}) – {c.currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Enable/disable countries */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Enabled Countries</h3>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Enable All</Label>
            <Switch checked={allEnabled} onCheckedChange={toggleAll} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Only enabled countries appear in the location selector. ({enabledCodes.size} / {ALL_COUNTRIES.length} enabled)
        </p>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search countries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 bg-secondary border-border"
          />
        </div>

        <ScrollArea className="h-72 rounded-lg border border-border">
          <div className="p-1">
            {filtered.map((c) => (
              <button
                key={c.code}
                onClick={() => toggleCountry(c.code)}
                className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-secondary ${
                  enabledCodes.has(c.code) ? "text-foreground" : "text-muted-foreground opacity-50"
                }`}
              >
                <span>{c.flag}</span>
                <span className="flex-1">{c.language} ({c.name})</span>
                <span className="text-xs font-mono text-muted-foreground">{c.currency}</span>
                {enabledCodes.has(c.code) && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Locale Settings"}
      </button>
    </div>
  );
};

export default AdminLocaleSettings;
