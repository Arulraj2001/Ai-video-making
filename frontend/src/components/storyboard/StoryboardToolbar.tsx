import React from "react";
import {
  Search,
  X,
  LayoutGrid,
  List,
  CheckSquare,
  Merge,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

interface StoryboardToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  statusFilter: "all" | "completed" | "pending" | "failed";
  onStatusFilterChange: (status: "all" | "completed" | "pending" | "failed") => void;
  counts: {
    total: number;
    completed: number;
    pending: number;
    failed: number;
  };
  selectedCount: number;
  onMergeSelected: () => void;
  onClearSelection: () => void;
  onSelectAllFiltered: () => void;
  mergingInProgress: boolean;
  viewLayout: "cards" | "compact";
  onViewLayoutChange: (layout: "cards" | "compact") => void;
  canMerge: boolean;
}

export const StoryboardToolbar: React.FC<StoryboardToolbarProps> = ({
  searchQuery,
  onSearchChange,
  onClearSearch,
  statusFilter,
  onStatusFilterChange,
  counts,
  selectedCount,
  onMergeSelected,
  onClearSelection,
  onSelectAllFiltered,
  mergingInProgress,
  viewLayout,
  onViewLayoutChange,
  canMerge,
}) => {
  type FilterId = "all" | "completed" | "pending" | "failed";

  const filterTabs: Array<{
    id: FilterId;
    label: string;
    count: number;
    icon: React.ReactNode;
    colorClass: string;
  }> = [
    { id: "all",       label: "All",      count: counts.total,     icon: null,                          colorClass: "" },
    { id: "completed", label: "Ready",    count: counts.completed, icon: <CheckCircle2 size={11} />,   colorClass: "success" },
    { id: "pending",   label: "Pending",  count: counts.pending,   icon: <Clock size={11} />,          colorClass: "" },
    { id: "failed",    label: "Failed",   count: counts.failed,    icon: <AlertCircle size={11} />,    colorClass: "danger" },
  ];

  return (
    <div className="sb-toolbar">
      {/* Search Input */}
      <div className="sb-search-wrap">
        <Search size={14} className="sb-search-icon" />
        <input
          type="text"
          placeholder="Search narration or prompts…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search storyboard scenes"
          className="sb-search-input"
          id="storyboard-search"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={onClearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-opacity hover:opacity-70"
            style={{ color: "var(--sb-text-muted)" }}
            aria-label="Clear search"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Inline Filter Chips */}
      <div className="sb-filter-chips" role="group" aria-label="Filter by status">
        {filterTabs.map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onStatusFilterChange(tab.id)}
              className={`sb-filter-chip ${isActive ? `is-active ${tab.colorClass}` : ""}`}
              aria-pressed={isActive}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className="chip-count">{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* Right cluster: selection actions + layout toggle */}
      <div className="flex items-center gap-2 ml-auto">
        {selectedCount > 0 ? (
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-lg"
              style={{ background: "var(--sb-accent-glow)", color: "var(--sb-accent)", border: "1px solid rgba(255,107,0,0.3)" }}
            >
              {selectedCount} selected
            </span>

            {canMerge && (
              <button
                type="button"
                onClick={onMergeSelected}
                disabled={mergingInProgress}
                className="sb-mini-btn"
                title="Merge selected sequential scenes"
              >
                <Merge size={12} />
                <span>{mergingInProgress ? "Merging…" : `Merge ${selectedCount}`}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClearSelection}
              className="sb-mini-btn"
            >
              <X size={11} />
              <span>Clear</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onSelectAllFiltered}
            className="sb-mini-btn"
            title="Select all visible scenes"
          >
            <CheckSquare size={13} />
            <span className="hidden sm:inline">Select All</span>
          </button>
        )}

        {/* Layout Toggle */}
        <div
          className="flex items-center rounded-lg overflow-hidden"
          style={{ border: "1px solid var(--sb-border-hover)", background: "rgba(255,255,255,0.03)" }}
        >
          <button
            type="button"
            onClick={() => onViewLayoutChange("cards")}
            className="p-1.5 transition-colors"
            style={{
              color: viewLayout === "cards" ? "var(--sb-accent)" : "var(--sb-text-muted)",
              background: viewLayout === "cards" ? "rgba(255,107,0,0.12)" : "transparent",
            }}
            title="Card grid view"
            aria-label="Cards view"
            aria-pressed={viewLayout === "cards"}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            type="button"
            onClick={() => onViewLayoutChange("compact")}
            className="p-1.5 transition-colors"
            style={{
              color: viewLayout === "compact" ? "var(--sb-accent)" : "var(--sb-text-muted)",
              background: viewLayout === "compact" ? "rgba(255,107,0,0.12)" : "transparent",
            }}
            title="Compact list view"
            aria-label="Compact view"
            aria-pressed={viewLayout === "compact"}
          >
            <List size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
