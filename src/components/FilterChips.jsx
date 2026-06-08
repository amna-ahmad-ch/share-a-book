export default function FilterChips({ options, value, onChange, allLabel = 'All' }) {
  const items = [{ value: '', label: allLabel }, ...options.map((o) =>
    typeof o === 'string' ? { value: o, label: o } : o,
  )]

  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
      {items.map((item) => {
        const active = value === item.value
        return (
          <button
            key={item.value || '__all'}
            type="button"
            onClick={() => onChange(item.value)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-primary text-white'
                : 'bg-white text-primary border border-primary/20'
            }`}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
