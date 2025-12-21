import { useState } from 'react';
import {
  Monitor,
  Image,
  Cake,
  Settings,
  Eye,
  LayoutGrid,
} from 'lucide-react';
import { useSlides } from '../hooks/gymscreen/useSlides';
import { useTodaysBirthdays, useUpcomingBirthdays } from '../hooks/gymscreen/useBirthdays';
import { useGymScreenSettings } from '../hooks/gymscreen/useGymScreenSettings';
import { SlidesManager } from '../components/gymscreen/admin/SlidesManager';
import { BirthdaysPreview } from '../components/gymscreen/admin/BirthdaysPreview';
import { GymScreenSettingsPanel } from '../components/gymscreen/admin/GymScreenSettingsPanel';
import { LivePreview } from '../components/gymscreen/admin/LivePreview';

type Tab = 'overview' | 'slides' | 'birthdays' | 'preview' | 'settings';

export function GymScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Fetch data for stats
  const { data: slides } = useSlides();
  const { data: todaysBirthdays } = useTodaysBirthdays();
  const { data: upcomingBirthdays } = useUpcomingBirthdays(7);
  const { data: settings } = useGymScreenSettings();

  // Calculate stats
  const totalSlides = slides?.length || 0;
  const activeSlides = slides?.filter(s => s.is_active).length || 0;
  const birthdaysToday = todaysBirthdays?.length || 0;
  const birthdaysWeek = upcomingBirthdays?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">GymScreen</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Beheer de content die op je gym TV-displays wordt getoond
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/gymscreen/display"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-amber-400 text-neutral-950 font-semibold rounded-xl hover:bg-amber-300 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>Open Display</span>
          </a>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={Image}
          label="Slides"
          value={totalSlides.toString()}
          trend={`${activeSlides} actief`}
        />
        <StatCard
          icon={Cake}
          label="Jarigen vandaag"
          value={birthdaysToday.toString()}
          trend={birthdaysToday > 0 ? 'Gefeliciteerd!' : 'Niemand jarig'}
          highlight={birthdaysToday > 0}
        />
        <StatCard
          icon={Cake}
          label="Jarigen deze week"
          value={birthdaysWeek.toString()}
          trend="Komende 7 dagen"
        />
        <StatCard
          icon={LayoutGrid}
          label="Actieve secties"
          value={countActiveSections(settings).toString()}
          trend="van 4 beschikbaar"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <nav className="flex gap-6">
          {[
            { id: 'overview', label: 'Overzicht', icon: Monitor },
            { id: 'slides', label: 'Slideshow', icon: Image },
            { id: 'birthdays', label: 'Verjaardagen', icon: Cake },
            { id: 'preview', label: 'Live Preview', icon: Eye },
            { id: 'settings', label: 'Instellingen', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-amber-400'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'overview' && (
          <GymScreenOverview
            slides={slides || []}
            todaysBirthdays={todaysBirthdays || []}
            settings={settings}
          />
        )}
        {activeTab === 'slides' && <SlidesManager />}
        {activeTab === 'birthdays' && <BirthdaysPreview />}
        {activeTab === 'preview' && <LivePreview />}
        {activeTab === 'settings' && <GymScreenSettingsPanel />}
      </div>
    </div>
  );
}

function countActiveSections(settings: ReturnType<typeof useGymScreenSettings>['data']) {
  if (!settings) return 4; // Default all on
  let count = 0;
  if (settings.show_belt_wall) count++;
  if (settings.show_slideshow) count++;
  if (settings.show_birthdays) count++;
  if (settings.show_shop_banners) count++;
  return count;
}

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  trend: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            highlight ? 'bg-green-500/10' : 'bg-amber-400/10'
          }`}
        >
          <Icon className={`w-5 h-5 ${highlight ? 'text-green-400' : 'text-amber-400'}`} />
        </div>
        <span className="text-sm text-neutral-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className={`text-xs mt-1 ${highlight ? 'text-green-400' : 'text-neutral-500'}`}>
        {trend}
      </p>
    </div>
  );
}

interface GymScreenOverviewProps {
  slides: Array<{ id: string; image_url: string; title: string | null; is_active: boolean }>;
  todaysBirthdays: Array<{ id: string; first_name: string; last_name: string; profile_picture_url: string | null; age: number }>;
  settings: ReturnType<typeof useGymScreenSettings>['data'];
}

function GymScreenOverview({ slides, todaysBirthdays, settings }: GymScreenOverviewProps) {
  const activeSlides = slides.filter(s => s.is_active);

  return (
    <div className="space-y-6">
      {/* Today's Birthdays */}
      {todaysBirthdays.length > 0 && (
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Cake className="w-5 h-5 text-green-400" />
            Jarigen Vandaag
          </h3>
          <div className="flex flex-wrap gap-4">
            {todaysBirthdays.map((birthday) => (
              <div
                key={birthday.id}
                className="flex items-center gap-3 bg-white/5 rounded-xl p-3"
              >
                {birthday.profile_picture_url ? (
                  <img
                    src={birthday.profile_picture_url}
                    alt={`${birthday.first_name} ${birthday.last_name}`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-400 font-bold">
                      {birthday.first_name[0]}{birthday.last_name[0]}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-white">
                    {birthday.first_name} {birthday.last_name}
                  </p>
                  <p className="text-sm text-green-400">
                    Wordt {birthday.age} jaar!
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Slides */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recente Slides</h3>
          {activeSlides.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {activeSlides.slice(0, 6).map((slide) => (
                <div
                  key={slide.id}
                  className="aspect-video rounded-lg overflow-hidden bg-neutral-800"
                >
                  <img
                    src={slide.image_url}
                    alt={slide.title || 'Slide'}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-400">
              <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nog geen slides toegevoegd</p>
              <p className="text-sm mt-1">Ga naar Slideshow om foto's toe te voegen</p>
            </div>
          )}
        </div>

        {/* Display Settings Summary */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Display Configuratie</h3>
          <div className="space-y-3">
            <SettingRow
              label="Belt Wall"
              enabled={settings?.show_belt_wall ?? true}
            />
            <SettingRow
              label="Slideshow"
              enabled={settings?.show_slideshow ?? true}
            />
            <SettingRow
              label="Verjaardagen"
              enabled={settings?.show_birthdays ?? true}
            />
            <SettingRow
              label="Shop Banners"
              enabled={settings?.show_shop_banners ?? true}
            />
            <div className="pt-3 border-t border-white/10">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-400">Slide interval</span>
                <span className="text-white">{settings?.slideshow_interval ?? 5}s</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-neutral-400">Sectie rotatie</span>
                <span className="text-white">{settings?.section_rotation_interval ?? 30}s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-neutral-400">{label}</span>
      <span
        className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
          enabled
            ? 'bg-green-500/20 text-green-400'
            : 'bg-neutral-500/20 text-neutral-400'
        }`}
      >
        {enabled ? 'Aan' : 'Uit'}
      </span>
    </div>
  );
}
