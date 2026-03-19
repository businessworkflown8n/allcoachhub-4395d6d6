import { Filter, ArrowUpDown } from "lucide-react";

interface CategoryFiltersProps {
  levelFilter: string;
  setLevelFilter: (v: string) => void;
  priceFilter: string;
  setPriceFilter: (v: string) => void;
  languageFilter: string;
  setLanguageFilter: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  availableLanguages: string[];
  resultCount: number;
}

const levels = ["All", "Beginner", "Intermediate", "Advanced"];
const priceOptions = ["All", "Free", "Paid"];
const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "popularity", label: "Most Popular" },
  { value: "price-low", label: "Price: Low → High" },
  { value: "price-high", label: "Price: High → Low" },
];

const FilterPill = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
      active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
    }`}
  >
    {label}
  </button>
);

const CategoryFilters = ({
  levelFilter, setLevelFilter,
  priceFilter, setPriceFilter,
  languageFilter, setLanguageFilter,
  sortBy, setSortBy,
  availableLanguages,
  resultCount,
}: CategoryFiltersProps) => (
  <section className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
    <div className="container mx-auto px-4 py-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Level:</span>
          </div>
          <div className="flex gap-1.5">
            {levels.map(l => (
              <FilterPill key={l} label={l} active={levelFilter === l} onClick={() => setLevelFilter(l)} />
            ))}
          </div>

          <span className="hidden text-border lg:inline">|</span>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">Price:</span>
          </div>
          <div className="flex gap-1.5">
            {priceOptions.map(p => (
              <FilterPill key={p} label={p} active={priceFilter === p} onClick={() => setPriceFilter(p)} />
            ))}
          </div>

          {availableLanguages.length > 2 && (
            <>
              <span className="hidden text-border lg:inline">|</span>
              <select
                value={languageFilter}
                onChange={e => setLanguageFilter(e.target.value)}
                className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs text-foreground"
              >
                {availableLanguages.map(l => (
                  <option key={l} value={l}>{l === "All" ? "All Languages" : l}</option>
                ))}
              </select>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{resultCount} result{resultCount !== 1 ? "s" : ""}</span>
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs text-foreground"
            >
              {sortOptions.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default CategoryFilters;
