"use client";

import { useState, useEffect, useRef } from "react";
import AppModal from "@/components/ui/modal";
import { useThemeStore, THEME_PRESETS, type ThemePreset } from "@/store/theme";
import { applyThemeColors } from "@/lib/color-utils";

// ==================== Sub-Components ====================

/** Color swatch pair showing up + down colors */
const SwatchPair = ({ up, down, size = "md" }: { up: string; down: string; size?: "sm" | "md" }) => {
  const s = size === "sm" ? "w-4 h-4" : "w-6 h-6";
  return (
    <div className="flex items-center -space-x-1.5">
      <div className={`${s} rounded-full border-2 border-gray-800`} style={{ backgroundColor: up }} />
      <div className={`${s} rounded-full border-2 border-gray-800`} style={{ backgroundColor: down }} />
    </div>
  );
};

/** Preset theme card */
const PresetCard = ({
  preset,
  isActive,
  onClick,
}: {
  preset: ThemePreset;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-3 w-full px-3.5 py-3 rounded-xl transition-all cursor-pointer
      ${isActive
        ? "bg-green-500/8 border border-green-500/25 ring-1 ring-green-500/15"
        : "bg-gray-800/30 border border-gray-800/50 hover:bg-gray-800/50 hover:border-gray-700/60"
      }
    `}
  >
    <SwatchPair up={preset.upColor} down={preset.downColor} />
    <span className={`text-sm ${isActive ? "text-white font-semibold" : "text-gray-300"}`}>
      {preset.name}
    </span>
    {isActive && (
      <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center ml-auto shrink-0">
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    )}
  </button>
);

/** Native color input with styled wrapper */
const ColorInput = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => inputRef.current?.click()}
        className="relative w-9 h-9 rounded-lg border-2 border-gray-700 hover:border-gray-500 transition-colors cursor-pointer overflow-hidden"
        style={{ backgroundColor: value }}
      >
        <input
          ref={inputRef}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
      </button>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs text-gray-500 font-mono uppercase">{value}</span>
      </div>
    </div>
  );
};

// ==================== Preview Bar ====================

const ThemePreview = ({ upColor, downColor }: { upColor: string; downColor: string }) => (
  <div className="rounded-xl bg-gray-800/30 border border-gray-800/50 p-3.5 space-y-2.5">
    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Preview</span>
    <div className="flex items-center gap-2">
      <div
        className="flex-1 h-9 rounded-lg flex items-center justify-center text-xs font-semibold text-white"
        style={{ backgroundColor: upColor }}
      >
        Buy / Long
      </div>
      <div
        className="flex-1 h-9 rounded-lg flex items-center justify-center text-xs font-semibold text-white"
        style={{ backgroundColor: downColor }}
      >
        Sell / Short
      </div>
    </div>
    <div className="flex items-center gap-3 text-xs font-mono">
      <span style={{ color: upColor }}>+2.45%</span>
      <span style={{ color: downColor }}>-1.32%</span>
      <span className="text-gray-700">|</span>
      <span style={{ color: upColor }}>$97,234.50</span>
    </div>
  </div>
);

// ==================== Main Modal ====================

interface ThemePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemePickerModal = ({ isOpen, onClose }: ThemePickerModalProps) => {
  const { upColor, downColor, activePreset, setColors, resetToDefault } = useThemeStore();

  // Local draft state so we can preview before confirming
  const [draftUp, setDraftUp] = useState(upColor);
  const [draftDown, setDraftDown] = useState(downColor);
  const [draftPreset, setDraftPreset] = useState<string | null>(activePreset);
  const [isCustom, setIsCustom] = useState(!activePreset);

  // Sync draft state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDraftUp(upColor);
      setDraftDown(downColor);
      setDraftPreset(activePreset);
      setIsCustom(!activePreset);
    }
  }, [isOpen, upColor, downColor, activePreset]);

  // Live preview: apply draft colors to DOM as user browses
  useEffect(() => {
    if (isOpen) {
      applyThemeColors(draftUp, draftDown);
    }
  }, [isOpen, draftUp, draftDown]);

  const handlePresetSelect = (preset: ThemePreset) => {
    setDraftUp(preset.upColor);
    setDraftDown(preset.downColor);
    setDraftPreset(preset.name);
    setIsCustom(false);
  };

  const handleCustomColorChange = (type: "up" | "down", hex: string) => {
    if (type === "up") setDraftUp(hex);
    else setDraftDown(hex);
    setDraftPreset(null);
    setIsCustom(true);
  };

  const handleSave = () => {
    setColors(draftUp, draftDown, draftPreset);
    onClose();
  };

  const handleCancel = () => {
    // Revert to the committed colors
    applyThemeColors(upColor, downColor);
    onClose();
  };

  const handleReset = () => {
    resetToDefault();
    setDraftUp("#10b981");
    setDraftDown("#ef4444");
    setDraftPreset("Emerald & Red");
    setIsCustom(false);
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Theme Colors"
      className="max-w-sm max-h-[90vh] overflow-y-auto"
      contentClassName="space-y-5"
    >
      {/* Preset Themes */}
      <div className="space-y-2">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Presets</span>
        <div className="grid grid-cols-1 gap-1.5">
          {THEME_PRESETS.map((preset) => (
            <PresetCard
              key={preset.name}
              preset={preset}
              isActive={draftPreset === preset.name && !isCustom}
              onClick={() => handlePresetSelect(preset)}
            />
          ))}
        </div>
      </div>

      {/* Custom Colors */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Custom</span>
          {isCustom && (
            <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Active</span>
          )}
        </div>
        <div className="flex items-center gap-6">
          <ColorInput
            label="Buy / Long"
            value={draftUp}
            onChange={(hex) => handleCustomColorChange("up", hex)}
          />
          <ColorInput
            label="Sell / Short"
            value={draftDown}
            onChange={(hex) => handleCustomColorChange("down", hex)}
          />
        </div>
      </div>

      {/* Preview */}
      <ThemePreview upColor={draftUp} downColor={draftDown} />

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleReset}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-gray-800/50"
        >
          Reset to default
        </button>
        <div className="flex-1" />
        <button
          onClick={handleCancel}
          className="h-9 px-4 text-sm rounded-xl bg-gray-800/60 border border-gray-700/50 text-gray-300 hover:bg-gray-800 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="h-9 px-5 text-sm rounded-xl bg-green-500 text-white hover:bg-green-400 transition-colors font-semibold cursor-pointer"
        >
          Save
        </button>
      </div>
    </AppModal>
  );
};

// ==================== Trigger Button (for Header) ====================

export const ThemePickerButton = ({ onClick }: { onClick: () => void }) => {
  const { upColor, downColor } = useThemeStore();

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-900/60 border border-gray-800/40 hover:bg-gray-800/60 hover:border-gray-700/50 rounded-lg transition-all cursor-pointer"
      title="Theme Colors"
    >
      <SwatchPair up={upColor} down={downColor} size="sm" />
    </button>
  );
};
