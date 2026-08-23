import type { ContentType } from "../types/api";
import "./ContentFilter.css";

interface ContentFilterProps {
  selected: ContentType | "all";
  onChange: (type: ContentType | "all") => void;
}

const FILTER_OPTIONS: { value: ContentType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "article", label: "Articles" },
  { value: "faq", label: "FAQs" },
  { value: "tip", label: "Tips" },
];

const ContentFilter = ({ selected, onChange }: ContentFilterProps) => {
  return (
    <div className="content-filter" role="group" aria-label="Filter by content type">
      {FILTER_OPTIONS.map((option) => (
        <button
          key={option.value}
          className={`content-filter-btn${selected === option.value ? " content-filter-btn--active" : ""}`}
          onClick={() => onChange(option.value)}
          aria-pressed={selected === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default ContentFilter;
