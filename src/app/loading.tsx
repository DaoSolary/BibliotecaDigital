export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-12 animate-pulse space-y-4">
      <div className="h-10 w-48 bg-muted rounded" />
      <div className="h-4 w-72 bg-muted rounded" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  );
}
