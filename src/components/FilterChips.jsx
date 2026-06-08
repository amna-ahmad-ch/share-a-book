export default function FilterChips({ options, value, onChange, allLabel = 'All' }) {
  const items = [{ value: '', label: allLabel }, ...options.map((o) =>
    typeof o === 'string' ? { value: o, label: o } : o,
  )]

  return (
    <div className="flex flex-wrap gap-2 w-full min-w-0">
      {items.map((item) => {
        const active = value === item.value
        return (
          <button
            key={item.value || '__all'}
            type="button"
            onClick={() => onChange(item.value)}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              active
                ? 'bg-filter-soft text-primary font-semibold border border-filter-border'
                : 'bg-white text-primary/55 font-medium border border-primary/10'
            }`}
            >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
