import { Cake, User, Calendar, Loader2 } from 'lucide-react';
import { useTodaysBirthdays, useUpcomingBirthdays } from '../../../hooks/gymscreen/useBirthdays';

export function BirthdaysPreview() {
  const { data: todaysBirthdays, isLoading: loadingToday } = useTodaysBirthdays();
  const { data: upcomingBirthdays, isLoading: loadingUpcoming } = useUpcomingBirthdays(7);

  const isLoading = loadingToday || loadingUpcoming;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  // Filter upcoming to exclude today's birthdays
  const upcomingOnly = upcomingBirthdays?.filter(b => {
    const todayIds = new Set(todaysBirthdays?.map(t => t.id) || []);
    return !todayIds.has(b.id);
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-white">Verjaardagen</h2>
        <p className="text-sm text-neutral-400">
          Overzicht van jarigen die op de GymScreen worden getoond
        </p>
      </div>

      {/* Today's Birthdays */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Cake className="w-4 h-4 text-green-400" />
          </div>
          Vandaag Jarig
        </h3>

        {todaysBirthdays && todaysBirthdays.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {todaysBirthdays.map((birthday) => (
              <BirthdayCard
                key={birthday.id}
                firstName={birthday.first_name}
                lastName={birthday.last_name}
                age={birthday.age}
                profilePictureUrl={birthday.profile_picture_url}
                isToday
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-400">
            <Cake className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>Niemand jarig vandaag</p>
          </div>
        )}
      </div>

      {/* Upcoming Birthdays */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          Komende 7 Dagen
        </h3>

        {upcomingOnly.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingOnly.map((birthday) => (
              <BirthdayCard
                key={birthday.id}
                firstName={birthday.first_name}
                lastName={birthday.last_name}
                age={birthday.age}
                profilePictureUrl={birthday.profile_picture_url}
                birthdayDisplay={birthday.birthday_display}
                daysUntil={birthday.days_until_birthday}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-400">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>Geen verjaardagen de komende week</p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
        <p className="text-sm text-amber-400">
          <strong>Automatisch:</strong> Verjaardagen worden automatisch getoond op basis van de geboortedatum in het ledenprofiel.
          De profielfoto van het lid wordt gebruikt voor de weergave op de GymScreen.
        </p>
      </div>
    </div>
  );
}

interface BirthdayCardProps {
  firstName: string;
  lastName: string;
  age: number;
  profilePictureUrl: string | null;
  isToday?: boolean;
  birthdayDisplay?: string;
  daysUntil?: number;
}

function BirthdayCard({
  firstName,
  lastName,
  age,
  profilePictureUrl,
  isToday,
  birthdayDisplay,
  daysUntil,
}: BirthdayCardProps) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl ${
        isToday
          ? 'bg-green-500/10 border border-green-500/30'
          : 'bg-white/5 border border-white/10'
      }`}
    >
      {profilePictureUrl ? (
        <img
          src={profilePictureUrl}
          alt={`${firstName} ${lastName}`}
          className="w-12 h-12 rounded-full object-cover"
        />
      ) : (
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isToday ? 'bg-green-500/20' : 'bg-amber-400/10'
          }`}
        >
          <User className={`w-6 h-6 ${isToday ? 'text-green-400' : 'text-amber-400'}`} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-white truncate">
          {firstName} {lastName}
        </p>
        <p className={`text-sm ${isToday ? 'text-green-400' : 'text-neutral-400'}`}>
          {isToday ? (
            `Wordt ${age} jaar!`
          ) : (
            <>
              {birthdayDisplay} &middot; Wordt {age + 1} jaar
              {daysUntil && (
                <span className="text-neutral-500"> (over {daysUntil} {daysUntil === 1 ? 'dag' : 'dagen'})</span>
              )}
            </>
          )}
        </p>
      </div>
      {isToday && (
        <div className="text-2xl">🎂</div>
      )}
    </div>
  );
}
