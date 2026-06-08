import { Link } from 'react-router-dom'

export default function ListingCard({ listing }) {
  const isFree = listing.type === 'free'

  return (
    <Link
      to={`/listing/${listing.id}`}
      className="block rounded-xl bg-white shadow-sm border border-primary/5 overflow-hidden active:scale-[0.98] transition-transform"
    >
      <div className="aspect-square bg-white flex items-center justify-center overflow-hidden">
        {listing.imageUrl ? (
          <img src={listing.imageUrl} alt="" className="w-full h-full object-contain" />
        ) : (
          <span className="text-4xl" aria-hidden>📚</span>
        )}
      </div>
      <div className="p-2.5 space-y-1">
        <h3 className="font-semibold text-primary text-sm line-clamp-2 leading-tight">
          {listing.title}
        </h3>
        <p className="text-xs text-primary/60">{listing.grade}</p>
        <p className="text-xs text-primary/50 truncate">{listing.category}</p>
        <div className="flex items-center justify-between gap-1 pt-0.5">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/5 text-primary/70">
            {listing.condition}
          </span>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded ${
              isFree ? 'bg-free text-white' : 'bg-accent text-primary'
            }`}
          >
            {isFree ? 'FREE' : `Rs ${listing.price}`}
          </span>
        </div>
      </div>
    </Link>
  )
}
