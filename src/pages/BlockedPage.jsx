export default function BlockedPage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center max-w-[430px] mx-auto">
      <span className="text-5xl mb-4">🚫</span>
      <h1 className="text-xl font-bold text-primary mb-2">Account suspended</h1>
      <p className="text-primary/60 text-sm">
        Your account has been suspended. If you believe this is a mistake, please
        contact the app administrator through your school group.
      </p>
    </div>
  )
}
