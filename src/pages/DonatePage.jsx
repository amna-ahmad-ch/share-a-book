import { useState } from 'react'

export default function DonatePage() {
  const [showQr, setShowQr] = useState(false)

  return (
    <div className="space-y-6 pb-4">
      <section className="text-center pt-2">
        <span className="text-5xl block mb-2">☕</span>
        <h1 className="text-2xl font-bold text-primary">Support Share a Book</h1>
      </section>

      <section className="rounded-xl bg-white p-4 border border-primary/5">
        <p className="text-sm text-primary/70 leading-relaxed">
          This app is built by a school parent, for school parents. Hosting and upkeep
          take time — if Share a Book helped your family, a small donation is warmly
          appreciated.
        </p>
      </section>

      <div className="rounded-xl bg-free text-white text-center py-3 px-4 font-semibold text-sm">
        100% Free to Use — donations are completely optional
      </div>

      <section className="rounded-xl bg-white p-4 border border-primary/5 text-center space-y-4">
        <p className="text-sm text-primary/70 leading-relaxed">
          Scan the QR code or tap below to send a chai via Jazz Cash / Easypaisa.
        </p>
        <button
          type="button"
          onClick={() => setShowQr(true)}
          className="w-full py-3 rounded-xl bg-accent text-primary font-bold text-sm"
        >
          Show donation QR
        </button>
      </section>

      <p className="text-center text-xs text-primary/40">
        Thank you for supporting school communities 💛
      </p>

      {showQr && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-6"
          onClick={() => setShowQr(false)}
          onKeyDown={(e) => e.key === 'Escape' && setShowQr(false)}
          role="presentation"
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-xs w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-primary mb-3">Donate via QR</h3>
            <img
              src="/easypaisa-qr.png"
              alt="Donation QR code"
              className="w-full rounded-lg border border-primary/10"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling?.classList.remove('hidden')
              }}
            />
            <p className="hidden text-sm text-primary/50 mt-2">
              Add your QR image at public/easypaisa-qr.png
            </p>
            <button
              type="button"
              onClick={() => setShowQr(false)}
              className="mt-4 text-sm text-primary/60"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
