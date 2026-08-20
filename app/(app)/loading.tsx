export default function AppLoading() {
  return (
    <main className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8" aria-label="Loading page">
      <div className="space-y-3">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="skeleton h-4 w-full max-w-lg rounded-lg" />
      </div>
      <div className="app-panel rounded-2xl p-5">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="skeleton h-12 w-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3 w-24 rounded" />
                <div className="skeleton h-6 w-32 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="skeleton h-80 rounded-2xl" />
        <div className="skeleton h-80 rounded-2xl" />
      </div>
    </main>
  );
}
