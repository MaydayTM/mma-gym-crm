import { useState, useEffect } from 'react'
import { CreditCard, Check, AlertCircle, Eye, EyeOff, Loader2, ExternalLink } from 'lucide-react'
import { usePaymentSettings } from '../../hooks/usePaymentSettings'
import type { PaymentConfigFormData } from '../../types/shop'

export function PaymentSettings() {
  const {
    config,
    isLoading,
    error,
    saveConfig,
    isSaving,
    saveError,
    getWebhookUrl,
    isShopConfigured,
  } = usePaymentSettings()

  const [showSecrets, setShowSecrets] = useState(false)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState<PaymentConfigFormData>({
    provider: 'stripe',
    stripe_publishable_key: '',
    stripe_secret_key: '',
    stripe_webhook_secret: '',
    mollie_api_key: '',
    mollie_profile_id: '',
    currency: 'EUR',
    is_test_mode: true,
  })

  // Update form when config loads - intentional async data sync
  useEffect(() => {
    if (config) {
      setFormData({
        provider: config.provider,
        stripe_publishable_key: config.stripe_publishable_key || '',
        stripe_secret_key: config.stripe_secret_key || '',
        stripe_webhook_secret: config.stripe_webhook_secret || '',
        mollie_api_key: config.mollie_api_key || '',
        mollie_profile_id: config.mollie_profile_id || '',
        currency: config.currency || 'EUR',
        is_test_mode: config.is_test_mode ?? true,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.provider, config?.is_test_mode]) // Only update when these key values change

  const handleSave = async () => {
    try {
      await saveConfig(formData)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      // Error is handled by the hook
    }
  }

  if (!isShopConfigured) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Shop niet geconfigureerd</h2>
          <p className="text-neutral-400">
            Configureer eerst de shop environment variables om betalingen in te stellen.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header Card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-amber-400/10 rounded-xl flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Betaling Instellingen</h2>
            <p className="text-sm text-neutral-400">Configureer je payment provider voor shop en abonnementen</p>
          </div>
        </div>

        {/* Error Message */}
        {(error || saveError) && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error?.message || saveError?.message}</span>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-2 text-green-400">
            <Check className="w-5 h-5 flex-shrink-0" />
            <span>Instellingen opgeslagen!</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-3">
              Payment Provider
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex-1">
                <input
                  type="radio"
                  name="provider"
                  value="stripe"
                  checked={formData.provider === 'stripe'}
                  onChange={() => setFormData({ ...formData, provider: 'stripe' })}
                  className="w-4 h-4 text-amber-400 focus:ring-amber-400 bg-white/10 border-white/20"
                />
                <div>
                  <span className="font-medium text-white">Stripe</span>
                  <p className="text-xs text-neutral-500">Kaart, iDEAL, Bancontact</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex-1">
                <input
                  type="radio"
                  name="provider"
                  value="mollie"
                  checked={formData.provider === 'mollie'}
                  onChange={() => setFormData({ ...formData, provider: 'mollie' })}
                  className="w-4 h-4 text-amber-400 focus:ring-amber-400 bg-white/10 border-white/20"
                />
                <div>
                  <span className="font-medium text-white">Mollie</span>
                  <p className="text-xs text-neutral-500">Nederlands, eenvoudig</p>
                </div>
              </label>
            </div>
          </div>

          {/* Test Mode Toggle */}
          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
            <div>
              <p className="font-medium text-white">Test Modus</p>
              <p className="text-sm text-neutral-400">
                {formData.is_test_mode
                  ? 'Betalingen worden gesimuleerd'
                  : 'Live betalingen actief'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, is_test_mode: !formData.is_test_mode })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.is_test_mode ? 'bg-amber-400' : 'bg-green-500'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.is_test_mode ? 'translate-x-1' : 'translate-x-6'
                }`}
              />
            </button>
          </div>

          {/* Stripe Configuration */}
          {formData.provider === 'stripe' && (
            <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-white">Stripe Configuratie</h3>
                <button
                  type="button"
                  onClick={() => setShowSecrets(!showSecrets)}
                  className="text-sm text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showSecrets ? 'Verbergen' : 'Tonen'}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  Publishable Key
                </label>
                <input
                  type="text"
                  value={formData.stripe_publishable_key}
                  onChange={(e) => setFormData({ ...formData, stripe_publishable_key: e.target.value })}
                  placeholder="pk_test_..."
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                />
                <p className="mt-1 text-xs text-neutral-500">Veilig om te delen (begint met pk_)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  Secret Key
                </label>
                <input
                  type={showSecrets ? 'text' : 'password'}
                  value={formData.stripe_secret_key}
                  onChange={(e) => setFormData({ ...formData, stripe_secret_key: e.target.value })}
                  placeholder="sk_test_..."
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                />
                <p className="mt-1 text-xs text-red-400">Geheim! Deel dit nooit.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  Webhook Secret
                </label>
                <input
                  type={showSecrets ? 'text' : 'password'}
                  value={formData.stripe_webhook_secret}
                  onChange={(e) => setFormData({ ...formData, stripe_webhook_secret: e.target.value })}
                  placeholder="whsec_..."
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                />
                <p className="mt-1 text-xs text-neutral-500">Nodig voor order updates</p>
              </div>
            </div>
          )}

          {/* Mollie Configuration */}
          {formData.provider === 'mollie' && (
            <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-white">Mollie Configuratie</h3>
                <button
                  type="button"
                  onClick={() => setShowSecrets(!showSecrets)}
                  className="text-sm text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showSecrets ? 'Verbergen' : 'Tonen'}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  API Key
                </label>
                <input
                  type={showSecrets ? 'text' : 'password'}
                  value={formData.mollie_api_key}
                  onChange={(e) => setFormData({ ...formData, mollie_api_key: e.target.value })}
                  placeholder="test_... of live_..."
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">
                  Profile ID (optioneel)
                </label>
                <input
                  type="text"
                  value={formData.mollie_profile_id}
                  onChange={(e) => setFormData({ ...formData, mollie_profile_id: e.target.value })}
                  placeholder="pfl_..."
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              Valuta
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            >
              <option value="EUR" className="bg-neutral-900">EUR - Euro</option>
              <option value="USD" className="bg-neutral-900">USD - US Dollar</option>
              <option value="GBP" className="bg-neutral-900">GBP - British Pound</option>
            </select>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold rounded-xl disabled:opacity-50 transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Opslaan...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Instellingen Opslaan
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Webhook URL Info - Stripe only */}
      {formData.provider === 'stripe' && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <h3 className="font-medium text-blue-300 mb-2 flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Webhook URL
          </h3>
          <p className="text-sm text-blue-200/80 mb-3">
            Voeg deze URL toe aan je Stripe Dashboard onder Developers → Webhooks:
          </p>
          <code className="block p-3 bg-blue-500/10 rounded-lg text-sm text-blue-200 break-all font-mono">
            {getWebhookUrl()}
          </code>
          <p className="text-xs text-blue-300/60 mt-2">
            Events: checkout.session.completed, checkout.session.expired, charge.refunded
          </p>
        </div>
      )}

      {/* Info about shared config */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
        <p className="text-sm text-amber-300">
          <strong>Let op:</strong> Deze instellingen worden gebruikt voor zowel de Shop als voor lidmaatschap betalingen.
          Eén configuratie voor alle betalingen.
        </p>
      </div>
    </div>
  )
}
