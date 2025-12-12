import { Link } from 'react-router-dom'
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react'

export function CheckoutCancel() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl p-8 border border-white/10 text-center">
          <div className="w-20 h-20 mx-auto bg-rose-500/20 rounded-full flex items-center justify-center mb-6">
            <XCircle className="text-rose-400" size={40} />
          </div>

          <h1 className="text-[28px] font-bold text-neutral-50 mb-2">
            Betaling geannuleerd
          </h1>
          <p className="text-neutral-400 mb-8">
            Je betaling is niet voltooid. Er is niets in rekening gebracht.
          </p>

          <div className="space-y-3">
            <Link
              to="/checkout/plans"
              className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-full bg-amber-300 text-neutral-950 font-medium text-[16px] hover:bg-amber-200 transition"
            >
              <RefreshCw size={18} />
              Opnieuw proberen
            </Link>

            <Link
              to="https://www.mmagym.be"
              className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-full border border-white/20 text-neutral-300 font-medium text-[16px] hover:bg-white/5 transition"
            >
              <ArrowLeft size={18} />
              Terug naar website
            </Link>
          </div>

          <p className="text-neutral-500 text-[13px] mt-8">
            Vragen? Neem contact met ons op via{' '}
            <a href="mailto:info@mmagym.be" className="text-amber-300 hover:underline">
              info@mmagym.be
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
