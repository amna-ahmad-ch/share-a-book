import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CATEGORIES, GRADES, LISTING_TYPES } from '../constants'
import FilterChips from './FilterChips'

const NAV_CLEARANCE = 'calc(5rem + env(safe-area-inset-bottom, 0px))'

export default function FilterSheet({
  open,
  onClose,
  grade,
  onGradeChange,
  category,
  onCategoryChange,
  type,
  onTypeChange,
  onClearAll,
}) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col justify-end pointer-events-none">
      <button
        type="button"
        aria-label="Close filters"
        className="absolute inset-0 bg-primary/40 pointer-events-auto"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-sheet-title"
        style={{ marginBottom: NAV_CLEARANCE }}
        className="relative w-full max-w-2xl mx-auto px-4 pointer-events-auto h-[calc(100dvh-env(safe-area-inset-bottom,0px)-5.75rem)] md:h-auto md:max-h-[85vh]"
      >
        <div className="h-full bg-cream rounded-2xl border border-primary/10 shadow-[0_-8px_30px_-6px_rgba(26,26,46,0.12)] flex flex-col overflow-hidden md:max-h-[85vh]">
          <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-primary/10 shrink-0">
            <h2 id="filter-sheet-title" className="text-lg font-bold text-primary">
              Filters
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-primary/60 px-2 py-1"
            >
              Done
            </button>
          </div>

          <div className="overflow-y-auto px-4 py-4 space-y-5 flex-1">
            <section className="space-y-2">
              <p className="text-xs font-medium text-primary/50 uppercase tracking-wide">Grade</p>
              <FilterChips options={GRADES} value={grade} onChange={onGradeChange} />
            </section>

            <section className="space-y-2">
              <p className="text-xs font-medium text-primary/50 uppercase tracking-wide">Subject</p>
              <FilterChips options={CATEGORIES} value={category} onChange={onCategoryChange} />
            </section>

            <section className="space-y-2">
              <p className="text-xs font-medium text-primary/50 uppercase tracking-wide">Type</p>
              <FilterChips
                options={LISTING_TYPES.filter((t) => t.value !== 'all').map((t) => ({
                  value: t.value,
                  label: t.label,
                }))}
                value={type === 'all' ? '' : type}
                onChange={(v) => onTypeChange(v || 'all')}
                allLabel="All"
              />
            </section>
          </div>

          <div className="px-4 pb-4 pt-2 border-t border-primary/10 shrink-0">
            <button
              type="button"
              onClick={onClearAll}
              className="w-full py-2.5 rounded-lg border border-primary/20 text-sm font-medium text-primary/70"
            >
              Clear all filters
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
