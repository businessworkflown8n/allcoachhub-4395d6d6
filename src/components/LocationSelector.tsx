import { useState, useMemo, useEffect } from "react";
import { Globe, ChevronDown, Search, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ALL_COUNTRIES, CountryLocale } from "@/data/countries";
import { useLocale } from "@/hooks/useLocale";
import { useTranslation } from "@/i18n/TranslationProvider";
import { supabase } from "@/integrations/supabase/client";

const LocationSelector = () => {
  const { locale, setLocale } = useLocale();
  const { t, isTranslating } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "locale_selector_enabled")
      .single()
      .then(({ data }) => {
        if (data?.value === "false") setVisible(false);
      });
  }, []);

  const filtered = useMemo(() => {
    if (!search) return ALL_COUNTRIES;
    const q = search.toLowerCase();
    return ALL_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.language.toLowerCase().includes(q) ||
        c.currency.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [search]);

  const handleSelect = (c: CountryLocale) => {
    setLocale(c);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground hover:border-primary">
          {isTranslating && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
          <span className="text-sm">{locale.flag}</span>
          <span className="hidden sm:inline">{locale.name}</span>
          <span className="font-medium text-foreground">{locale.currencySymbol} {locale.currency}</span>
          <ChevronDown className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0 border-border bg-popover" align="end">
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("location.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs bg-secondary border-border"
            />
          </div>
        </div>
        <ScrollArea className="h-64">
          <div className="p-1">
            {filtered.map((c) => (
              <button
                key={c.code}
                onClick={() => handleSelect(c)}
                className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-xs transition-colors hover:bg-secondary ${
                  c.code === locale.code ? "bg-primary/10 text-primary" : "text-foreground"
                }`}
              >
                <span className="text-base">{c.flag}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {c.language} ({c.name})
                  </p>
                </div>
                <span className="shrink-0 text-muted-foreground font-mono">
                  {c.currencySymbol} {c.currency}
                </span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">{t("location.noResults")}</p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default LocationSelector;
