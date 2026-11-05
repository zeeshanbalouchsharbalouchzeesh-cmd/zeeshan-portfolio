import React, { useState } from 'react';
import { useApp } from '../layout/ThemeContext.tsx';
import { ThemeName, ReceiptFormat } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  Palette,
  Check,
  Moon,
  Sun,
  Printer,
  Sparkles,
  Layout,
  Save,
  CheckCircle2,
} from 'lucide-react';

export const ThemeStudioView: React.FC = () => {
  const { tenant, theme, setTheme, isDarkMode, toggleDarkMode, refreshTenant } = useApp();
  const [selectedFormat, setSelectedFormat] = useState<ReceiptFormat>(tenant?.receiptFormat || 'thermal-80mm');
  const [isSaved, setIsSaved] = useState(false);

  const themePresets: {
    key: ThemeName;
    name: string;
    description: string;
    primaryHex: string;
    bgHex: string;
    accentHex: string;
  }[] = [
    {
      key: 'midnight-teal',
      name: 'Midnight Teal (Default)',
      description: 'Sophisticated deep obsidian with vibrant teal accents and emerald highlights.',
      primaryHex: '#14b8a6',
      bgHex: '#0f172a',
      accentHex: '#10b981',
    },
    {
      key: 'royal-purple',
      name: 'Royal Purple',
      description: 'Regal violet and amethyst palette, ideal for cosmetics and fashion boutiques.',
      primaryHex: '#a855f7',
      bgHex: '#1e1b4b',
      accentHex: '#ec4899',
    },
    {
      key: 'emerald-green',
      name: 'Emerald Green',
      description: 'Organic, fresh botanical theme curated for grocery stores and organic markets.',
      primaryHex: '#10b981',
      bgHex: '#064e3b',
      accentHex: '#34d399',
    },
    {
      key: 'midnight-black',
      name: 'Midnight Black',
      description: 'High-contrast monochrome OLED dark theme designed for electronics and hardware retail.',
      primaryHex: '#38bdf8',
      bgHex: '#020617',
      accentHex: '#64748b',
    },
    {
      key: 'pure-white',
      name: 'Pure White (Clean Minimal)',
      description: 'High-clarity medical and pharmaceutical clean daylight palette.',
      primaryHex: '#0284c7',
      bgHex: '#f8fafc',
      accentHex: '#0ea5e9',
    },
  ];

  const handleSavePreferences = async () => {
    if (!tenant) return;
    try {
      await api.updateTenant(tenant.id, {
        theme,
        receiptFormat: selectedFormat,
      });
      await refreshTenant();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save theme preferences');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md">
        <div className="flex items-center gap-2 text-teal-400 mb-1">
          <Palette className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Visual Customization Studio</span>
        </div>
        <h1 className="text-xl font-extrabold text-white">Theme & Branding Studio</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Personalize ShopMaster for your store. Preferences are saved automatically to your tenant workspace.
        </p>
      </div>

      {/* Preset Palettes */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-200">Color Palette Themes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {themePresets.map((preset) => {
            const isSelected = theme === preset.key;
            return (
              <div
                key={preset.key}
                onClick={() => setTheme(preset.key)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-teal-500 bg-teal-500/10 shadow-lg shadow-teal-500/10'
                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded-full border border-white/20"
                        style={{ backgroundColor: preset.primaryHex }}
                      />
                      <span className="text-xs font-bold text-slate-100">{preset.name}</span>
                    </div>
                    {isSelected && (
                      <span className="h-5 w-5 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">{preset.description}</p>
                </div>

                {/* Color Swatch Preview Bar */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80">
                  <div className="h-4 w-8 rounded" style={{ backgroundColor: preset.bgHex }} title="Background" />
                  <div className="h-4 w-8 rounded" style={{ backgroundColor: preset.primaryHex }} title="Primary" />
                  <div className="h-4 w-8 rounded" style={{ backgroundColor: preset.accentHex }} title="Accent" />
                  <span className="text-[10px] text-slate-500 ml-auto font-mono">{preset.key}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Light vs Dark Mode */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-3">
        <h2 className="text-sm font-bold text-slate-200">Display Mode (Light / Dark)</h2>
        <p className="text-xs text-slate-400">
          Switch between dark mode (optimal for high-traffic retail POS terminals) and daylight mode.
        </p>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => isDarkMode && toggleDarkMode()}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
              !isDarkMode
                ? 'border-teal-500 bg-teal-500/20 text-teal-300'
                : 'border-slate-800 bg-slate-950 text-slate-400'
            }`}
          >
            <Sun className="h-4 w-4 text-amber-400" />
            Light Mode
          </button>

          <button
            onClick={() => !isDarkMode && toggleDarkMode()}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
              isDarkMode
                ? 'border-teal-500 bg-teal-500/20 text-teal-300'
                : 'border-slate-800 bg-slate-950 text-slate-400'
            }`}
          >
            <Moon className="h-4 w-4 text-teal-400" />
            Dark Mode (Midnight)
          </button>
        </div>
      </div>

      {/* Receipt Hardware Layout Format */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-3">
        <h2 className="text-sm font-bold text-slate-200">Default Receipt & Invoice Printer Format</h2>
        <p className="text-xs text-slate-400">
          Select standard thermal receipt roll size or full A4 corporate invoice formatting.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {[
            { key: 'thermal-58mm', name: '58mm Thermal Receipt', desc: 'Compact mini thermal roll (Bluetooth/USB)' },
            { key: 'thermal-80mm', name: '80mm Thermal Receipt', desc: 'Standard commercial high-speed POS printer' },
            { key: 'a4', name: 'A4 Standard Invoice', desc: 'Full-page laser/inkjet sheet with tax details' },
          ].map((fmt) => (
            <div
              key={fmt.key}
              onClick={() => setSelectedFormat(fmt.key as any)}
              className={`p-3.5 rounded-xl border transition cursor-pointer ${
                selectedFormat === fmt.key
                  ? 'border-teal-500 bg-teal-500/10'
                  : 'border-slate-800 bg-slate-950 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">{fmt.name}</span>
                {selectedFormat === fmt.key && <Check className="h-4 w-4 text-teal-400" />}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{fmt.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-2">
        {isSaved ? (
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> Preferences saved successfully to workspace!
          </span>
        ) : (
          <span className="text-xs text-slate-500">Changes apply instantly to current terminal.</span>
        )}

        <button
          onClick={handleSavePreferences}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/25 transition cursor-pointer"
        >
          <Save className="h-4 w-4" />
          Save Workspace Preferences
        </button>
      </div>
    </div>
  );
};
