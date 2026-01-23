/**
 * Email Preview Page
 *
 * Allows viewing and testing email templates before sending.
 * Access at: /email-preview (dev only)
 */

import { useState } from 'react'
import { generateClaimAccountEmail } from '../emails/ClaimAccountEmail'

export function EmailPreview() {
  const [selectedTemplate, setSelectedTemplate] = useState<'claim-account' | 'password-reset'>('claim-account')

  // Sample data for preview
  const sampleData = {
    firstName: 'Mehdi',
    email: 'mehdi@reconnect.academy',
    memberNumber: 2548,
    activationUrl: 'https://creative.mmagym.be/activate?token=abc123',
    expiresInHours: 48,
  }

  const getEmailHtml = () => {
    switch (selectedTemplate) {
      case 'claim-account':
        return generateClaimAccountEmail(sampleData)
      default:
        return generateClaimAccountEmail(sampleData)
    }
  }

  const emailHtml = getEmailHtml()

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Email Template Preview</h1>
            <p className="text-sm text-neutral-500 mt-1">Bekijk en test email templates</p>
          </div>

          {/* Template Selector */}
          <div className="flex items-center gap-4">
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value as typeof selectedTemplate)}
              className="px-4 py-2 bg-neutral-100 border border-neutral-200 rounded-lg text-sm"
            >
              <option value="claim-account">Claim Account</option>
              <option value="password-reset">Password Reset</option>
            </select>

            <button
              onClick={() => {
                const blob = new Blob([emailHtml], { type: 'text/html' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${selectedTemplate}-email.html`
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition"
            >
              Download HTML
            </button>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Desktop Preview */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="text-xs text-neutral-500 ml-2">Desktop Preview</span>
            </div>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <iframe
                srcDoc={emailHtml}
                title="Email Preview Desktop"
                className="w-full h-[700px] border-0"
              />
            </div>
          </div>

          {/* Mobile Preview */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-neutral-500">Mobile Preview (375px)</span>
            </div>
            <div className="mx-auto" style={{ maxWidth: '375px' }}>
              <div className="bg-neutral-900 rounded-[2.5rem] p-3 shadow-xl">
                <div className="bg-neutral-900 rounded-[2rem] overflow-hidden">
                  {/* Notch */}
                  <div className="flex justify-center pt-2 pb-1">
                    <div className="w-20 h-5 bg-neutral-800 rounded-full"></div>
                  </div>
                  {/* Screen */}
                  <div className="bg-white rounded-b-[1.5rem] overflow-hidden">
                    <iframe
                      srcDoc={emailHtml}
                      title="Email Preview Mobile"
                      className="w-full h-[600px] border-0"
                      style={{ transform: 'scale(1)', transformOrigin: 'top left' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* HTML Source */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-neutral-700">HTML Source</h2>
            <button
              onClick={() => {
                navigator.clipboard.writeText(emailHtml)
                alert('HTML gekopieerd naar clipboard!')
              }}
              className="px-3 py-1.5 bg-neutral-200 text-neutral-700 rounded-lg text-xs font-medium hover:bg-neutral-300 transition"
            >
              Copy HTML
            </button>
          </div>
          <pre className="bg-neutral-900 text-neutral-300 p-4 rounded-xl overflow-x-auto text-xs max-h-64">
            {emailHtml}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default EmailPreview
