import { useEffect, useRef, useState } from "react";
import { Check, Palette, X } from "lucide-react";

const STORAGE_KEY = "workspace-color-theme";

const THEMES = [
  {
    id: "upsilon",
    name: "Upsilon",
    description: "Original workspace green",
    colors: ["#12382D", "#1D5B47", "#328E6B", "#B4DFCC", "#EEF8F3"],
  },
  {
    id: "periwinkle",
    name: "Periwinkle",
    description: "Calm blue and lavender",
    colors: ["#3D52A0", "#7091E6", "#8697C4", "#ADBBDA", "#EDE8F5"],
  },
  {
    id: "kozowood",
    name: "Kozowood",
    description: "Warm walnut and sand",
    colors: ["#3E362E", "#865D36", "#93785B", "#AC8968", "#A69080"],
  },
  {
    id: "moon-phases",
    name: "Moon Phases",
    description: "Deep slate and ocean teal",
    colors: ["#212A31", "#2E3944", "#124E66", "#748D92", "#D3D9D4"],
  },
  {
    id: "bright-media",
    name: "BrightMedia",
    description: "Berry, rose, and blush",
    colors: ["#5D001E", "#E3E2DF", "#E3AFBC", "#9A1750", "#EE4C7C"],
  },
  {
    id: "boro05",
    name: "Boro05",
    description: "Sage and coastal blue",
    colors: ["#687864", "#31708E", "#5085A5", "#8FC1E3", "#F7F9FB"],
  },
  {
    id: "play",
    name: "Play",
    description: "Terracotta and soft steel",
    colors: ["#844D36", "#474853", "#86B3D1", "#AAAAA0", "#8E8268"],
  },
  {
    id: "sea-love",
    name: "Sea Love",
    description: "Teal, mint, and sunlight",
    colors: ["#026670", "#9FEDD7", "#FEF9C7", "#FCE181", "#EDEAE5"],
  },
];

const getStoredTheme = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return THEMES.some((theme) => theme.id === stored) ? stored : "upsilon";
};

const WorkspaceThemePicker = () => {
  const [themeId, setThemeId] = useState(getStoredTheme);
  const [open, setOpen] = useState(false);
  const pickerRef = useRef(null);
  const selectedTheme = THEMES.find((theme) => theme.id === themeId) || THEMES[0];

  useEffect(() => {
    document.documentElement.dataset.workspaceTheme = themeId;
    localStorage.setItem(STORAGE_KEY, themeId);
  }, [themeId]);

  useEffect(() => {
    if (!open) return undefined;

    const closePicker = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.type === "mousedown" && !pickerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", closePicker);
    window.addEventListener("keydown", closePicker);
    return () => {
      document.removeEventListener("mousedown", closePicker);
      window.removeEventListener("keydown", closePicker);
    };
  }, [open]);

  return (
    <div className="workspace-theme-picker" ref={pickerRef}>
      <button
        type="button"
        className="workspace-theme-trigger"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Change workspace theme. Current theme: ${selectedTheme.name}`}
      >
        <Palette size={17} aria-hidden="true" />
        <span className="workspace-theme-trigger-label">{selectedTheme.name}</span>
        <span className="workspace-theme-trigger-swatches" aria-hidden="true">
          {selectedTheme.colors.slice(0, 3).map((color) => (
            <i key={color} style={{ backgroundColor: color }} />
          ))}
        </span>
      </button>

      {open && (
        <section className="workspace-theme-panel" role="dialog" aria-modal="false" aria-labelledby="workspace-theme-title">
          <div className="workspace-theme-panel-header">
            <div>
              <span className="ui-eyebrow">Appearance</span>
              <h2 id="workspace-theme-title">Choose your theme</h2>
              <p>Your selection is saved on this device.</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close theme selector">
              <X size={17} aria-hidden="true" />
            </button>
          </div>

          <div className="workspace-theme-current" aria-label={`Current theme: ${selectedTheme.name}`}>
            <span className="workspace-theme-current-palette" aria-hidden="true">
              {selectedTheme.colors.map((color) => (
                <i key={color} style={{ backgroundColor: color }} />
              ))}
            </span>
            <span className="workspace-theme-current-copy">
              <small>Current theme</small>
              <strong>{selectedTheme.name}</strong>
              <span>{selectedTheme.description}</span>
            </span>
          </div>

          <div className="workspace-theme-grid" role="radiogroup" aria-label="Workspace color themes">
            {THEMES.map((theme) => {
              const selected = theme.id === themeId;
              return (
                <button
                  type="button"
                  key={theme.id}
                  className={`workspace-theme-option${selected ? " is-selected" : ""}`}
                  role="radio"
                  aria-checked={selected}
                  aria-label={`${theme.name}: ${theme.description}. Colors ${theme.colors.join(", ")}`}
                  onClick={() => {
                    setThemeId(theme.id);
                    setOpen(false);
                  }}
                >
                  <span className="workspace-theme-palette" aria-hidden="true">
                    {theme.colors.map((color) => (
                      <i key={color} style={{ backgroundColor: color }} title={color} />
                    ))}
                  </span>
                  <span className="workspace-theme-option-copy">
                    <strong>{theme.name}</strong>
                    <small>{theme.description}</small>
                  </span>
                  {selected && <Check className="workspace-theme-check" size={16} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default WorkspaceThemePicker;
