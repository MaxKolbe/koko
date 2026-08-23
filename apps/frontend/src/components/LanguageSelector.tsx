import type { Language } from "../types/api";
import "./LanguageSelector.css";

interface LanguageSelectorProps {
  languages: Language[];
  selected: string;
  onChange: (code: string) => void;
}

const LanguageSelector = ({ languages, selected, onChange }: LanguageSelectorProps) => {
  if (languages.length === 0) return null;

  return (
    <div className="language-selector">
      <label htmlFor="language-select" className="language-selector-label">
        Language
      </label>
      <select
        id="language-select"
        className="language-selector-select"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
