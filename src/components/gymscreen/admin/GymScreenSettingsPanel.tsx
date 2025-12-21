import { useState } from 'react';
import {
  Settings,
  Clock,
  Eye,
  Key,
  Copy,
  Check,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  useGymScreenSettings,
  useUpdateSettings,
  useRegenerateApiKey,
} from '../../../hooks/gymscreen/useGymScreenSettings';

export function GymScreenSettingsPanel() {
  const { data: settings, isLoading } = useGymScreenSettings();
  const updateSettings = useUpdateSettings();
  const regenerateApiKey = useRegenerateApiKey();
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  const handleToggle = async (key: string, value: boolean) => {
    if (!settings) return;
    await updateSettings.mutateAsync({ [key]: value } as Record<string, boolean>);
  };

  const handleNumberChange = async (key: string, value: number) => {
    if (!settings) return;
    await updateSettings.mutateAsync({ [key]: value } as Record<string, number>);
  };

  const handleCopyApiKey = () => {
    if (settings?.api_key) {
      navigator.clipboard.writeText(settings.api_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerateKey = async () => {
    if (confirm('Weet je zeker dat je een nieuwe API key wilt genereren? De oude key werkt dan niet meer.')) {
      await regenerateApiKey.mutateAsync();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-white">Instellingen</h2>
        <p className="text-sm text-neutral-400">
          Configureer hoe de GymScreen content weergeeft
        </p>
      </div>

      {/* Sections Toggle */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-amber-400" />
          Zichtbare Secties
        </h3>
        <div className="space-y-4">
          <ToggleSetting
            label="Belt Wall"
            description="Toon gordel promoties en nieuwe leden"
            enabled={settings?.show_belt_wall ?? true}
            onChange={(v) => handleToggle('show_belt_wall', v)}
          />
          <ToggleSetting
            label="Slideshow"
            description="Toon community foto's en events"
            enabled={settings?.show_slideshow ?? true}
            onChange={(v) => handleToggle('show_slideshow', v)}
          />
          <ToggleSetting
            label="Verjaardagen"
            description="Toon leden die vandaag jarig zijn"
            enabled={settings?.show_birthdays ?? true}
            onChange={(v) => handleToggle('show_birthdays', v)}
          />
          <ToggleSetting
            label="Shop Banners"
            description="Toon producten en aanbiedingen uit de shop"
            enabled={settings?.show_shop_banners ?? true}
            onChange={(v) => handleToggle('show_shop_banners', v)}
          />
        </div>
      </div>

      {/* Timing Settings */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-400" />
          Timing
        </h3>
        <div className="grid gap-6 sm:grid-cols-2">
          <NumberSetting
            label="Slide interval"
            description="Seconden per slide in de slideshow"
            value={settings?.slideshow_interval ?? 5}
            min={3}
            max={30}
            unit="s"
            onChange={(v) => handleNumberChange('slideshow_interval', v)}
          />
          <NumberSetting
            label="Sectie rotatie"
            description="Seconden voordat naar volgende sectie wordt gewisseld"
            value={settings?.section_rotation_interval ?? 30}
            min={10}
            max={120}
            unit="s"
            onChange={(v) => handleNumberChange('section_rotation_interval', v)}
          />
          <NumberSetting
            label="Verjaardagen vooruit"
            description="Hoeveel dagen vooruit verjaardagen tonen (0 = alleen vandaag)"
            value={settings?.birthday_display_days ?? 0}
            min={0}
            max={7}
            unit=" dagen"
            onChange={(v) => handleNumberChange('birthday_display_days', v)}
          />
        </div>
      </div>

      {/* Display Settings */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-400" />
          Display
        </h3>
        <div className="space-y-4">
          <ToggleSetting
            label="Klok tonen"
            description="Toon de huidige tijd in de rechterbovenhoek"
            enabled={settings?.show_clock ?? true}
            onChange={(v) => handleToggle('show_clock', v)}
          />
          <ToggleSetting
            label="Logo tonen"
            description="Toon het gym logo op het scherm"
            enabled={settings?.show_logo ?? true}
            onChange={(v) => handleToggle('show_logo', v)}
          />
        </div>
      </div>

      {/* API Key */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-amber-400" />
          API Toegang
        </h3>
        <p className="text-sm text-neutral-400 mb-4">
          Gebruik deze key om de GymScreen data op te halen via de API
        </p>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={settings?.api_key || ''}
              readOnly
              className="w-full px-3 py-2 bg-neutral-800 border border-white/10 rounded-lg text-white font-mono text-sm"
            />
          </div>
          <button
            onClick={handleCopyApiKey}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
            title="Kopieer API key"
          >
            {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
          </button>
          <button
            onClick={handleRegenerateKey}
            disabled={regenerateApiKey.isPending}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            title="Genereer nieuwe key"
          >
            <RefreshCw className={`w-5 h-5 ${regenerateApiKey.isPending ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Display URL */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
        <p className="text-sm text-amber-400">
          <strong>Display URL:</strong> Open{' '}
          <a
            href="/gymscreen/display"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
          >
            /gymscreen/display
          </a>{' '}
          in een browser op je TV om de GymScreen te starten. Gebruik F11 voor volledig scherm.
        </p>
      </div>
    </div>
  );
}

interface ToggleSettingProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}

function ToggleSetting({ label, description, enabled, onChange }: ToggleSettingProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-white">{label}</p>
        <p className="text-sm text-neutral-400">{description}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          enabled ? 'bg-amber-400' : 'bg-neutral-600'
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
            enabled ? 'left-7' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}

interface NumberSettingProps {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
}

function NumberSetting({ label, description, value, min, max, unit, onChange }: NumberSettingProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="font-medium text-white">{label}</p>
        <span className="text-amber-400 font-mono">{value}{unit}</span>
      </div>
      <p className="text-sm text-neutral-400 mb-3">{description}</p>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-amber-400"
      />
      <div className="flex justify-between text-xs text-neutral-500 mt-1">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}
