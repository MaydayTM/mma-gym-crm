import { useState, useEffect, useMemo } from 'react'
import { X, Loader2, CreditCard, Calendar, Percent, AlertCircle } from 'lucide-react'
import { usePricingMatrix, useAgeGroups, usePlanTypes, useDiscounts } from '../../hooks/useSubscriptionAdmin'
import { useAssignSubscription } from '../../hooks/useAssignSubscription'

interface AssignSubscriptionModalProps {
  memberId: string
  memberName: string
  onClose: () => void
  onSuccess?: () => void
}

export function AssignSubscriptionModal({ memberId, memberName, onClose, onSuccess }: AssignSubscriptionModalProps) {
  const { data: pricing, isLoading: loadingPricing } = usePricingMatrix()
  const { data: ageGroups } = useAgeGroups()
  const { data: planTypes } = usePlanTypes()
  const { data: discounts } = useDiscounts()
  const assignSubscription = useAssignSubscription()

  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('')
  const [selectedPlanType, setSelectedPlanType] = useState<string>('')
  const [selectedPricing, setSelectedPricing] = useState<string>('')
  const [selectedDiscount, setSelectedDiscount] = useState<string>('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'mollie' | 'free'>('cash')
  const [notes, setNotes] = useState('')

  // Filter pricing based on selected age group and plan type
  const filteredPricing = useMemo(() => {
    if (!pricing) return []
    return pricing.filter(p => {
      if (selectedAgeGroup && p.age_group_id !== selectedAgeGroup) return false
      if (selectedPlanType && p.plan_type_id !== selectedPlanType) return false
      return true
    })
  }, [pricing, selectedAgeGroup, selectedPlanType])

  // Get selected pricing details
  const selectedPricingItem = useMemo(() => {
    return pricing?.find(p => p.id === selectedPricing)
  }, [pricing, selectedPricing])

  // Get selected discount details
  const selectedDiscountItem = useMemo(() => {
    return discounts?.find(d => d.id === selectedDiscount)
  }, [discounts, selectedDiscount])

  // Calculate final price
  const priceCalculation = useMemo(() => {
    if (!selectedPricingItem) return null

    const basePrice = selectedPricingItem.price
    let discountAmount = 0
    let discountLabel = ''

    if (selectedDiscountItem) {
      if (selectedDiscountItem.discount_type === 'percentage' && selectedDiscountItem.percentage) {
        discountAmount = basePrice * (selectedDiscountItem.percentage / 100)
        discountLabel = `${selectedDiscountItem.percentage}%`
      } else if (selectedDiscountItem.amount) {
        discountAmount = selectedDiscountItem.amount
        discountLabel = `€${selectedDiscountItem.amount.toFixed(2)}`
      }
    }

    const finalPrice = paymentMethod === 'free' ? 0 : Math.max(0, basePrice - discountAmount)

    return {
      basePrice,
      discountAmount,
      discountLabel,
      finalPrice
    }
  }, [selectedPricingItem, selectedDiscountItem, paymentMethod])

  // Calculate end date based on duration
  const endDate = useMemo(() => {
    if (!selectedPricingItem || !startDate) return null
    const start = new Date(startDate)
    start.setMonth(start.getMonth() + selectedPricingItem.duration_months)
    return start.toISOString().split('T')[0]
  }, [selectedPricingItem, startDate])

  // Auto-select first available pricing when filters change
  useEffect(() => {
    if (filteredPricing.length > 0 && !filteredPricing.find(p => p.id === selectedPricing)) {
      setSelectedPricing(filteredPricing[0].id)
    } else if (filteredPricing.length === 0) {
      setSelectedPricing('')
    }
    // Intentional: Only run when filteredPricing changes, not selectedPricing (to avoid infinite loop)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredPricing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPricingItem || !priceCalculation) return

    try {
      await assignSubscription.mutateAsync({
        memberId,
        pricingId: selectedPricing,
        ageGroupId: selectedPricingItem.age_group_id,
        planTypeId: selectedPricingItem.plan_type_id,
        durationMonths: selectedPricingItem.duration_months,
        basePrice: priceCalculation.basePrice,
        discountId: selectedDiscount || null,
        discountAmount: priceCalculation.discountAmount,
        finalPrice: priceCalculation.finalPrice,
        startDate,
        endDate: endDate!,
        paymentMethod,
        notes
      })
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error assigning subscription:', error)
    }
  }

  const getAgeGroupName = (id: string) => ageGroups?.find(ag => ag.id === id)?.name || ''
  const getPlanTypeName = (id: string) => planTypes?.find(pt => pt.id === id)?.name || ''

  const getDurationLabel = (months: number) => {
    if (months === 1) return '1 maand'
    if (months === 3) return '3 maanden'
    if (months === 12) return '1 jaar'
    return `${months} maanden`
  }

  const isLoading = loadingPricing
  const isSubmitting = assignSubscription.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-neutral-900 rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-[18px] font-semibold text-neutral-50">
              Lidmaatschap toewijzen
            </h2>
            <p className="text-[13px] text-neutral-500 mt-1">
              aan {memberName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-amber-300" size={32} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-neutral-400 mb-2">
                  Leeftijdsgroep
                </label>
                <select
                  value={selectedAgeGroup}
                  onChange={(e) => setSelectedAgeGroup(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition"
                >
                  <option value="">Alle groepen</option>
                  {ageGroups?.map(ag => (
                    <option key={ag.id} value={ag.id}>{ag.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[13px] text-neutral-400 mb-2">
                  Type abonnement
                </label>
                <select
                  value={selectedPlanType}
                  onChange={(e) => setSelectedPlanType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition"
                >
                  <option value="">Alle types</option>
                  {planTypes?.map(pt => (
                    <option key={pt.id} value={pt.id}>{pt.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pricing Selection */}
            <div>
              <label className="block text-[13px] text-neutral-400 mb-2">
                Abonnement *
              </label>
              {filteredPricing.length === 0 ? (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <AlertCircle size={18} className="text-amber-300" />
                  <p className="text-[13px] text-amber-300">
                    Geen abonnementen gevonden met de geselecteerde filters
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {filteredPricing.map(item => (
                    <label
                      key={item.id}
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${
                        selectedPricing === item.id
                          ? 'bg-amber-500/10 border-amber-500/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="pricing"
                          value={item.id}
                          checked={selectedPricing === item.id}
                          onChange={(e) => setSelectedPricing(e.target.value)}
                          className="w-4 h-4 text-amber-300 bg-white/5 border-white/20 focus:ring-amber-300/50"
                        />
                        <div>
                          <p className="text-[14px] font-medium text-neutral-200">
                            {getAgeGroupName(item.age_group_id)} - {getPlanTypeName(item.plan_type_id)}
                          </p>
                          <p className="text-[12px] text-neutral-500">
                            {getDurationLabel(item.duration_months)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] font-medium text-amber-300">
                          €{item.price.toFixed(2)}
                        </p>
                        {item.price_per_month && (
                          <p className="text-[11px] text-neutral-500">
                            €{item.price_per_month.toFixed(2)}/maand
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-[13px] text-neutral-400 mb-2">
                <Calendar size={14} className="inline mr-1" />
                Startdatum *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition"
              />
              {endDate && (
                <p className="text-[12px] text-neutral-500 mt-1">
                  Einddatum: {new Date(endDate).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>

            {/* Discount */}
            <div>
              <label className="block text-[13px] text-neutral-400 mb-2">
                <Percent size={14} className="inline mr-1" />
                Korting (optioneel)
              </label>
              <select
                value={selectedDiscount}
                onChange={(e) => setSelectedDiscount(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition"
              >
                <option value="">Geen korting</option>
                {discounts?.filter(d => d.is_active).map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.discount_type === 'percentage' ? `${d.percentage}%` : `€${d.amount?.toFixed(2)}`})
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-[13px] text-neutral-400 mb-2">
                <CreditCard size={14} className="inline mr-1" />
                Betaalmethode *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { value: 'cash', label: 'Contant' },
                  { value: 'bank_transfer', label: 'Overschrijving' },
                  { value: 'mollie', label: 'Online (Mollie)' },
                  { value: 'free', label: 'Gratis' }
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPaymentMethod(option.value as typeof paymentMethod)}
                    className={`px-3 py-2 rounded-lg text-[13px] font-medium transition ${
                      paymentMethod === option.value
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 border'
                        : 'bg-white/5 border-white/10 text-neutral-400 border hover:bg-white/10'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[13px] text-neutral-400 mb-2">
                Notities (optioneel)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Interne notities over dit abonnement..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-300/50 transition placeholder-neutral-600 resize-none"
              />
            </div>

            {/* Price Summary */}
            {priceCalculation && (
              <div className="bg-white/5 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-[13px]">
                  <span className="text-neutral-400">Basisprijs</span>
                  <span className="text-neutral-200">€{priceCalculation.basePrice.toFixed(2)}</span>
                </div>
                {priceCalculation.discountAmount > 0 && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-neutral-400">Korting ({priceCalculation.discountLabel})</span>
                    <span className="text-emerald-400">-€{priceCalculation.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {paymentMethod === 'free' && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-neutral-400">Gratis abonnement</span>
                    <span className="text-emerald-400">-€{priceCalculation.basePrice.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[15px] font-medium pt-2 border-t border-white/10">
                  <span className="text-neutral-200">Te betalen</span>
                  <span className="text-amber-300">€{priceCalculation.finalPrice.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-neutral-400 text-[14px] font-medium hover:bg-white/5 transition"
              >
                Annuleren
              </button>
              <button
                type="submit"
                disabled={!selectedPricing || isSubmitting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-300 text-neutral-950 text-[14px] font-medium hover:bg-amber-200 transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Toewijzen...
                  </>
                ) : (
                  'Lidmaatschap Toewijzen'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
