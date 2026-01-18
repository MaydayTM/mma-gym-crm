import { useState, useEffect, useMemo } from 'react';
import { Monitor, Maximize2, Cake, Image, Award, ShoppingBag, Clock } from 'lucide-react';
import { useSlides } from '../../../hooks/gymscreen/useSlides';
import { useTodaysBirthdays } from '../../../hooks/gymscreen/useBirthdays';
import { useGymScreenSettings } from '../../../hooks/gymscreen/useGymScreenSettings';

type Section = 'slideshow' | 'birthdays' | 'belt_wall' | 'shop';

export function LivePreview() {
  const { data: slides } = useSlides(true); // Only active slides
  const { data: birthdays } = useTodaysBirthdays();
  const { data: settings } = useGymScreenSettings();

  const [currentSection, setCurrentSection] = useState<Section>('slideshow');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Get active sections based on settings - memoized to prevent dependency changes on every render
  const activeSections = useMemo(() => {
    const sections: Section[] = [];
    if (settings?.show_slideshow && slides && slides.length > 0) sections.push('slideshow');
    if (settings?.show_birthdays && birthdays && birthdays.length > 0) sections.push('birthdays');
    if (settings?.show_belt_wall) sections.push('belt_wall');
    if (settings?.show_shop_banners) sections.push('shop');
    return sections;
  }, [settings?.show_slideshow, settings?.show_birthdays, settings?.show_belt_wall, settings?.show_shop_banners, slides, birthdays]);

  // Rotate sections
  useEffect(() => {
    if (activeSections.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSection((prev) => {
        const currentIndex = activeSections.indexOf(prev);
        const nextIndex = (currentIndex + 1) % activeSections.length;
        return activeSections[nextIndex];
      });
    }, (settings?.section_rotation_interval || 30) * 1000);

    return () => clearInterval(interval);
  }, [activeSections, settings?.section_rotation_interval]);

  // Rotate slides within slideshow section
  useEffect(() => {
    if (currentSection !== 'slideshow' || !slides || slides.length <= 1) return;

    const currentSlide = slides[currentSlideIndex];
    const duration = currentSlide?.display_duration || settings?.slideshow_interval || 5;

    const timeout = setTimeout(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, duration * 1000);

    return () => clearTimeout(timeout);
  }, [currentSection, currentSlideIndex, slides, settings?.slideshow_interval]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Live Preview</h2>
          <p className="text-sm text-neutral-400">
            Bekijk hoe de GymScreen er in realtime uitziet
          </p>
        </div>
        <a
          href="/gymscreen/display"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
          Volledig Scherm
        </a>
      </div>

      {/* Preview Container */}
      <div className="bg-neutral-950 border border-white/10 rounded-2xl overflow-hidden">
        {/* TV Frame */}
        <div className="aspect-video relative">
          {/* Current Section */}
          {currentSection === 'slideshow' && slides && slides.length > 0 && (
            <SlideshowPreview
              slides={slides}
              currentIndex={currentSlideIndex}
            />
          )}

          {currentSection === 'birthdays' && birthdays && birthdays.length > 0 && (
            <BirthdaysDisplay birthdays={birthdays} />
          )}

          {currentSection === 'belt_wall' && (
            <BeltWallPlaceholder />
          )}

          {currentSection === 'shop' && (
            <ShopPlaceholder />
          )}

          {/* Clock overlay */}
          {settings?.show_clock && (
            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
              <CurrentTime />
            </div>
          )}

          {/* Section indicator */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            {activeSections.map((section) => (
              <button
                key={section}
                onClick={() => setCurrentSection(section)}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentSection === section
                    ? 'bg-amber-400 w-6'
                    : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Info bar */}
        <div className="bg-white/5 px-4 py-3 flex items-center justify-between border-t border-white/10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <Monitor className="w-4 h-4" />
              <span>1920 x 1080</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <Clock className="w-4 h-4" />
              <span>Sectie: {settings?.section_rotation_interval || 30}s</span>
            </div>
          </div>
          <div className="text-sm text-amber-400 capitalize">
            {currentSection.replace('_', ' ')}
          </div>
        </div>
      </div>

      {/* Section Controls */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { id: 'slideshow', label: 'Slideshow', icon: Image, count: slides?.length || 0 },
          { id: 'birthdays', label: 'Verjaardagen', icon: Cake, count: birthdays?.length || 0 },
          { id: 'belt_wall', label: 'Belt Wall', icon: Award, count: null },
          { id: 'shop', label: 'Shop', icon: ShoppingBag, count: null },
        ].map((section) => {
          const isActive = activeSections.includes(section.id as Section);
          const isCurrent = currentSection === section.id;

          return (
            <button
              key={section.id}
              onClick={() => isActive && setCurrentSection(section.id as Section)}
              disabled={!isActive}
              className={`p-4 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-amber-400/10 border-amber-400/50 text-amber-400'
                  : isActive
                  ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                  : 'bg-white/5 border-white/10 text-neutral-500 opacity-50 cursor-not-allowed'
              }`}
            >
              <section.icon className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">{section.label}</p>
              {section.count !== null && (
                <p className="text-xs text-neutral-500 mt-1">
                  {section.count} items
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CurrentTime() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="text-white font-mono text-lg">
      {time.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}

interface SlideshowPreviewProps {
  slides: Array<{ id: string; image_url: string; title: string | null; caption: string | null }>;
  currentIndex: number;
}

function SlideshowPreview({ slides, currentIndex }: SlideshowPreviewProps) {
  const slide = slides[currentIndex];
  if (!slide) return null;

  return (
    <div className="absolute inset-0">
      <img
        src={slide.image_url}
        alt={slide.title || 'Slide'}
        className="w-full h-full object-cover"
      />
      {(slide.title || slide.caption) && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
          {slide.title && (
            <h3 className="text-2xl font-bold text-white">{slide.title}</h3>
          )}
          {slide.caption && (
            <p className="text-lg text-white/80 mt-1">{slide.caption}</p>
          )}
        </div>
      )}
      {/* Slide indicator */}
      <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-sm text-white">
        {currentIndex + 1} / {slides.length}
      </div>
    </div>
  );
}

interface BirthdaysDisplayProps {
  birthdays: Array<{
    id: string;
    first_name: string;
    last_name: string;
    profile_picture_url: string | null;
    age: number;
  }>;
}

function BirthdaysDisplay({ birthdays }: BirthdaysDisplayProps) {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-green-900/50 to-emerald-900/50 flex flex-col items-center justify-center p-8">
      <div className="text-4xl mb-4">🎂</div>
      <h2 className="text-3xl font-bold text-white mb-8">Gefeliciteerd!</h2>
      <div className="flex flex-wrap justify-center gap-6 max-w-4xl">
        {birthdays.slice(0, 4).map((birthday) => (
          <div
            key={birthday.id}
            className="flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-2xl p-6"
          >
            {birthday.profile_picture_url ? (
              <img
                src={birthday.profile_picture_url}
                alt={`${birthday.first_name} ${birthday.last_name}`}
                className="w-24 h-24 rounded-full object-cover border-4 border-green-400 mb-4"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-green-500/30 flex items-center justify-center border-4 border-green-400 mb-4">
                <span className="text-3xl font-bold text-green-300">
                  {birthday.first_name[0]}{birthday.last_name[0]}
                </span>
              </div>
            )}
            <p className="text-xl font-semibold text-white">
              {birthday.first_name} {birthday.last_name}
            </p>
            <p className="text-green-300 text-lg">
              {birthday.age} jaar
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BeltWallPlaceholder() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-amber-900/30 to-orange-900/30 flex flex-col items-center justify-center">
      <Award className="w-16 h-16 text-amber-400 mb-4" />
      <h2 className="text-2xl font-bold text-white mb-2">Belt Wall</h2>
      <p className="text-neutral-400">
        Wordt automatisch gevuld met gordel promoties
      </p>
    </div>
  );
}

function ShopPlaceholder() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-pink-900/30 flex flex-col items-center justify-center">
      <ShoppingBag className="w-16 h-16 text-purple-400 mb-4" />
      <h2 className="text-2xl font-bold text-white mb-2">Shop Banners</h2>
      <p className="text-neutral-400">
        Wordt automatisch gevuld vanuit de Shop module
      </p>
    </div>
  );
}
