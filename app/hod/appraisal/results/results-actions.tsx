'use client'
import { useState } from 'react'

export default function ResultsActions({ appraisalId }: { appraisalId: number }) {
  const [busy, setBusy] = useState<'approve' | 'appeal' | null>(null)
  const [message, setMessage] = useState('')

  async function act(path: 'approve' | 'appeal') {
    setBusy(path)
    const payload = { appraisalId, ...(path === 'appeal' ? { message } : {}) }
    const res = await fetch(`/api/appraisals/current/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setBusy(null)
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      alert(j.error || 'Action failed')
      return
    }
    window.location.reload()
  }

  return (
    <div className="rounded-2xl border p-4 bg-white">
      <div className="text-sm font-medium mb-2">Actions</div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          disabled={!!busy}
          onClick={() => act('approve')}
          className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-60"
        >
          {busy === 'approve' ? 'Approving…' : 'Approve'}
        </button>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Appeal message (optional)"
            className="border rounded px-3 py-2 w-full"
          />
          <button
            disabled={!!busy}
            onClick={() => act('appeal')}
            className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-60"
          >
            {busy === 'appeal' ? 'Submitting…' : 'Appeal'}
          </button>
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-2">
        Approve will mark this appraisal as COMPLETE. Appeal will return it to the evaluator with your message.
      </div>
    </div>
  )
}
