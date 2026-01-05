import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, ArrowLeft, Check, Users, Shield, User, Mail, Phone, Calendar } from 'lucide-react'
import { useCheckoutData, useFamilyDiscounts } from '../../hooks/usePlans'
import { useDisciplines } from '../../hooks/useDisciplines'
import { supabase } from '../../lib/supabase'

export function PlanCheckout() {
  const { ageGroup: ageGroupSlug } = useParams<{ ageGroup: string }>()
  const navigate = useNavigate()
  const {
    planTypes,
    addons,
    selectedAgeGroup,
    pricing,
    isLoading
  } = useCheckoutData(ageGroupSlug)
  const { data: familyDiscounts } = useFamilyDiscounts()
  const { data: disciplines } = useDisciplines()

  // Form state - Plan selection
  const [selectedPlanType, setSelectedPlanType] = useState<string | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null)
  const [selectedDiscipline, setSelectedDiscipline] = useState<string | null>(null)
  const [hasFamilyMember, setHasFamilyMember] = useState(false)
  const [wantsInsurance, setWantsInsurance] = useState(false)

  // Form state - Customer details
  const [showDetailsForm, setShowDetailsForm] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get pricing for selected plan type
  const planPricing = useMemo(() => {
    if (!pricing || !selectedPlanType) return []
    return pricing.filter(p => p.plan_type_id === selectedPlanType)
  }, [pricing, selectedPlanType])

  // Get selected price
  const selectedPrice = useMemo(() => {
    if (!planPricing || !selectedDuration) return null
    return planPricing.find(p => p.duration_months === selectedDuration)
  }, [planPricing, selectedDuration])

  // Calculate total
  const insuranceAddon = addons?.find(a => a.slug === 'insurance')
  const familyDiscount = hasFamilyMember ? (familyDiscounts?.[0]?.discount_amount || 20) : 0
  const monthlyFamilyDiscount = familyDiscount * (selectedDuration || 1)
  const insuranceCost = wantsInsurance && insuranceAddon && !selectedPrice?.includes_insurance
    ? insuranceAddon.price
    : 0

  const subtotal = selectedPrice?.price || 0
  const totalDiscount = monthlyFamilyDiscount
  const total = subtotal - totalDiscount + insuranceCost

  // Check if plan type is basic (needs discipline selection)
  const isBasicPlan = planTypes?.find(pt => pt.id === selectedPlanType)?.slug === 'basic'

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-amber-300" size={32} />
      </div>
    )
  }

  if (!selectedAgeGroup) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="bg-rose-500/10 border border-rose-500/40 rounded-2xl p-6 max-w-md text-center">
          <p className="text-rose-300 mb-4">Categorie niet gevonden</p>
          <button
            onClick={() => navigate('/checkout/plans')}
            className="text-amber-300 hover:underline"
          >
            Terug naar overzicht
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/checkout/plans')}
            className="flex items-center gap-2 text-neutral-400 hover:text-neutral-200 transition mb-6"
          >
            <ArrowLeft size={18} />
            <span>Terug naar overzicht</span>
          </button>

          <h1 className="text-[28px] md:text-[36px] font-bold text-neutral-50 tracking-tight">
            {selectedAgeGroup.name}
          </h1>
          <p className="text-[16px] text-neutral-400 mt-2">
            {selectedAgeGroup.subtitle}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Step 1: Choose Plan Type */}
        <div className="mb-8">
          <h2 className="text-[18px] font-medium text-neutral-200 mb-4">
            1. Kies je formule
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {planTypes?.map((planType) => {
              // Get all pricing for this plan type to show price range
              const planPricingOptions = pricing?.filter(p => p.plan_type_id === planType.id) || []
              const minPrice = planPricingOptions.length > 0
                ? Math.min(...planPricingOptions.map(p => p.price_per_month || 0))
                : null
              const maxPrice = planPricingOptions.length > 0
                ? Math.max(...planPricingOptions.map(p => p.price_per_month || 0))
                : null
              const basePricing = planPricingOptions.find(p => p.duration_months === 1)
              const yearPricing = planPricingOptions.find(p => p.duration_months === 12)
              const isSelected = selectedPlanType === planType.id

              return (
                <button
                  key={planType.id}
                  onClick={() => {
                    setSelectedPlanType(planType.id)
                    setSelectedDuration(null)
                  }}
                  className={`relative p-6 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-amber-300 bg-amber-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  {planType.highlight_text && (
                    <span className="absolute -top-3 right-4 px-3 py-1 bg-amber-300 text-neutral-950 text-[11px] font-bold rounded-full">
                      {planType.highlight_text}
                    </span>
                  )}

                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-[20px] font-bold text-neutral-50">
                        {planType.name}
                      </h3>
                      <p className="text-[14px] text-neutral-400 mt-1">
                        {planType.description}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-amber-300 flex items-center justify-center">
                        <Check size={14} className="text-neutral-950" strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* Price display - show range if available */}
                  <div className="mt-4">
                    {minPrice !== null && maxPrice !== null ? (
                      minPrice === maxPrice ? (
                        <>
                          <span className="text-[28px] font-bold text-amber-300">
                            €{minPrice}
                          </span>
                          <span className="text-neutral-400">/maand</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[28px] font-bold text-amber-300">
                            €{minPrice}
                          </span>
                          <span className="text-neutral-400"> - €{maxPrice}/maand</span>
                        </>
                      )
                    ) : (
                      <span className="text-[16px] text-neutral-500">Prijzen instellen...</span>
                    )}
                  </div>

                  {/* Show year discount if available */}
                  {yearPricing?.price_per_month && basePricing?.price_per_month && yearPricing.price_per_month < basePricing.price_per_month && (
                    <p className="text-[12px] text-emerald-400 mt-1">
                      Vanaf €{yearPricing.price_per_month}/maand bij jaarpas
                    </p>
                  )}

                  {/* Features */}
                  <ul className="mt-4 space-y-2">
                    {(planType.features as string[])?.slice(0, 3).map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-[13px] text-neutral-300">
                        <Check size={14} className="text-emerald-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </button>
              )
            })}
          </div>
        </div>

        {/* Step 1b: Choose Discipline (only for Basic) */}
        {isBasicPlan && selectedPlanType && (
          <div className="mb-8">
            <h2 className="text-[18px] font-medium text-neutral-200 mb-4">
              1b. Kies je discipline
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {disciplines?.map((discipline) => {
                const isSelected = selectedDiscipline === discipline.id

                return (
                  <button
                    key={discipline.id}
                    onClick={() => setSelectedDiscipline(discipline.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-amber-300 bg-amber-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: discipline.color || '#888' }}
                      />
                      <span className="text-[14px] font-medium text-neutral-200">
                        {discipline.name}
                      </span>
                      {isSelected && (
                        <Check size={14} className="text-amber-300 ml-auto" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 2: Choose Duration */}
        {selectedPlanType && (!isBasicPlan || selectedDiscipline) && (
          <div className="mb-8">
            <h2 className="text-[18px] font-medium text-neutral-200 mb-4">
              2. Kies je looptijd
            </h2>

            {planPricing.length > 0 ? (
              <div className="space-y-3">
                {planPricing.map((price) => {
                  const isSelected = selectedDuration === price.duration_months
                  const durationLabel = price.duration_months === 1
                    ? 'Maandelijks'
                    : price.duration_months === 3
                      ? '3 maanden prepaid'
                      : price.duration_months === 12
                        ? 'Jaarpas (12 maanden)'
                        : `${price.duration_months} maanden`

                  return (
                    <button
                      key={price.id}
                      onClick={() => {
                        setSelectedDuration(price.duration_months)
                      }}
                      className={`w-full p-5 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-amber-300 bg-amber-500/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-[16px] font-medium text-neutral-50">
                            {durationLabel}
                          </h3>
                          {(price.savings ?? 0) > 0 && (
                            <p className="text-[13px] text-emerald-400 mt-1">
                              Bespaar €{price.savings}
                            </p>
                          )}
                          {price.includes_insurance && (
                            <p className="text-[12px] text-amber-300 mt-1 flex items-center gap-1">
                              <Shield size={12} />
                              Inclusief verzekering
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-[24px] font-bold text-amber-300">
                            €{price.price_per_month}
                          </span>
                          <span className="text-neutral-400">/maand</span>
                          {price.duration_months > 1 && (
                            <p className="text-[12px] text-neutral-500">
                              €{price.price} totaal
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              /* No pricing data yet - show message */
              <div className="p-6 rounded-2xl border border-amber-500/30 bg-amber-500/5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="text-amber-300" size={20} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium text-amber-300">
                      Prijzen nog niet ingesteld
                    </h3>
                    <p className="text-[13px] text-neutral-400 mt-1">
                      Voor deze leeftijdsgroep en formule zijn nog geen prijzen geconfigureerd.
                      Neem contact op met de gym of kies een andere optie.
                    </p>
                    <a
                      href="/settings"
                      className="inline-flex items-center gap-1 text-[13px] text-amber-300 hover:underline mt-3"
                    >
                      → Prijzen instellen (admin)
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Extra Options */}
        {selectedDuration && (
          <div className="mb-8">
            <h2 className="text-[18px] font-medium text-neutral-200 mb-4">
              3. Extra opties
            </h2>
            <div className="space-y-3">
              {/* Family discount */}
              <button
                onClick={() => setHasFamilyMember(!hasFamilyMember)}
                className={`w-full p-5 rounded-2xl border text-left transition-all ${
                  hasFamilyMember
                    ? 'border-amber-300 bg-amber-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users size={20} className="text-neutral-400" />
                    <div>
                      <h3 className="text-[15px] font-medium text-neutral-50">
                        Gezinslid traint al bij ons
                      </h3>
                      <p className="text-[13px] text-neutral-400">
                        Ontvang €{familyDiscounts?.[0]?.discount_amount || 20} korting per maand
                      </p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                    hasFamilyMember
                      ? 'bg-amber-300 border-amber-300'
                      : 'border-neutral-600'
                  }`}>
                    {hasFamilyMember && <Check size={14} className="text-neutral-950" strokeWidth={3} />}
                  </div>
                </div>
              </button>

              {/* Insurance (only show if not included) */}
              {!selectedPrice?.includes_insurance && insuranceAddon && (
                <button
                  onClick={() => setWantsInsurance(!wantsInsurance)}
                  className={`w-full p-5 rounded-2xl border text-left transition-all ${
                    wantsInsurance
                      ? 'border-amber-300 bg-amber-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield size={20} className="text-neutral-400" />
                      <div>
                        <h3 className="text-[15px] font-medium text-neutral-50">
                          {insuranceAddon.name}
                        </h3>
                        <p className="text-[13px] text-neutral-400">
                          {insuranceAddon.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[14px] text-neutral-300">
                        +€{insuranceAddon.price}/jaar
                      </span>
                      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                        wantsInsurance
                          ? 'bg-amber-300 border-amber-300'
                          : 'border-neutral-600'
                      }`}>
                        {wantsInsurance && <Check size={14} className="text-neutral-950" strokeWidth={3} />}
                      </div>
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Price Summary */}
        {selectedPrice && (
          <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl p-6 border border-white/10 mb-8">
            <h2 className="text-[18px] font-medium text-neutral-200 mb-4">
              Overzicht
            </h2>
            <div className="space-y-3 text-[14px]">
              <div className="flex justify-between">
                <span className="text-neutral-400">
                  {planTypes?.find(pt => pt.id === selectedPlanType)?.name} - {
                    selectedDuration === 1 ? '1 maand' :
                    selectedDuration === 3 ? '3 maanden' : '12 maanden'
                  }
                </span>
                <span className="text-neutral-200">€{subtotal.toFixed(2)}</span>
              </div>

              {hasFamilyMember && (
                <div className="flex justify-between text-emerald-400">
                  <span>Gezinskorting</span>
                  <span>-€{monthlyFamilyDiscount.toFixed(2)}</span>
                </div>
              )}

              {wantsInsurance && insuranceCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-neutral-400">Sportverzekering</span>
                  <span className="text-neutral-200">+€{insuranceCost.toFixed(2)}</span>
                </div>
              )}

              {selectedPrice.includes_insurance && (
                <div className="flex justify-between text-amber-300">
                  <span>Verzekering inbegrepen</span>
                  <span>€0.00</span>
                </div>
              )}

              <div className="border-t border-white/10 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-[16px] font-medium text-neutral-50">Totaal</span>
                  <span className="text-[24px] font-bold text-amber-300">
                    €{total.toFixed(2)}
                  </span>
                </div>
                {selectedDuration && selectedDuration > 1 && (
                  <p className="text-[12px] text-neutral-500 text-right mt-1">
                    €{(total / selectedDuration).toFixed(2)}/maand
                  </p>
                )}
              </div>
            </div>

            {/* CTA Button - Show form or continue */}
            {!showDetailsForm ? (
              <button
                onClick={() => setShowDetailsForm(true)}
                className="w-full mt-6 py-4 rounded-full bg-amber-300 text-neutral-950 font-medium text-[16px] hover:bg-amber-200 transition shadow-[0_20px_45px_rgba(251,191,36,0.3)]"
              >
                Doorgaan
              </button>
            ) : null}
          </div>
        )}

        {/* Step 4: Customer Details Form */}
        {showDetailsForm && selectedPrice && (
          <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl p-6 border border-white/10 mb-8">
            <h2 className="text-[18px] font-medium text-neutral-200 mb-6">
              4. Je gegevens
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="block text-[13px] text-neutral-400 mb-2">
                    Voornaam *
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-amber-300/50 transition"
                      placeholder="Jouw voornaam"
                    />
                  </div>
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-[13px] text-neutral-400 mb-2">
                    Achternaam *
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-amber-300/50 transition"
                      placeholder="Jouw achternaam"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[13px] text-neutral-400 mb-2">
                  E-mailadres *
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-amber-300/50 transition"
                    placeholder="jouw@email.be"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[13px] text-neutral-400 mb-2">
                  Telefoonnummer
                </label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-amber-300/50 transition"
                    placeholder="+32 123 45 67 89"
                  />
                </div>
              </div>

              {/* Birth Date */}
              <div>
                <label className="block text-[13px] text-neutral-400 mb-2">
                  Geboortedatum *
                </label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-amber-300/50 transition"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-6 py-4 rounded-full bg-amber-300 text-neutral-950 font-medium text-[16px] hover:bg-amber-200 transition shadow-[0_20px_45px_rgba(251,191,36,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Bezig met verwerken...
                  </>
                ) : (
                  'Ga naar betaling'
                )}
              </button>

              <p className="text-[12px] text-neutral-500 text-center mt-4">
                Je wordt doorgestuurd naar onze beveiligde betaalpagina.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  )

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedAgeGroup || !selectedPlanType || !selectedDuration || !selectedPrice) return

    setIsSubmitting(true)

    try {
      // Create checkout session in database
      const { data: session, error } = await supabase
        .from('checkout_sessions')
        .insert({
          checkout_type: 'subscription',
          age_group_id: selectedAgeGroup.id,
          plan_type_id: selectedPlanType,
          duration_months: selectedDuration,
          selected_discipline_id: selectedDiscipline,
          email,
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          birth_date: birthDate,
          selected_addons: wantsInsurance ? ['insurance'] : [],
          family_discount: hasFamilyMember ? familyDiscount : 0,
          subtotal,
          discount_total: totalDiscount,
          addon_total: insuranceCost,
          final_total: total,
          payment_status: 'pending',
        })
        .select()
        .single()

      if (error) throw error

      // Call Mollie Edge Function to create payment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      console.log('Supabase URL:', supabaseUrl)
      console.log('Calling:', `${supabaseUrl}/functions/v1/create-mollie-payment`)
      const response = await fetch(`${supabaseUrl}/functions/v1/create-mollie-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkout_session_id: session.id,
          redirect_url: `${window.location.origin}/checkout/success`,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Kon betaling niet aanmaken')
      }

      const { checkout_url } = await response.json()

      // Redirect to Mollie checkout
      window.location.href = checkout_url

    } catch (error) {
      console.error('Checkout error:', error)
      alert('Er ging iets mis. Probeer het opnieuw.')
      setIsSubmitting(false)
    }
  }
}
