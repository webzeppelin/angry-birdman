/**
 * Dashboard Page
 *
 * Admin dashboard (placeholder, requires authentication).
 */

export function DashboardPage() {
  return (
    <div className="min-h-[60vh] bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="font-display mb-8 text-4xl text-neutral-800">Dashboard</h1>

        <div className="shadow-card rounded-lg bg-white p-12 text-center">
          <div className="mb-4 text-6xl">📊</div>
          <h2 className="mb-4 text-2xl font-semibold text-neutral-800">Admin Dashboard</h2>
          <p className="text-neutral-600">Your clan management dashboard will appear here.</p>
          <p className="mt-2 text-sm text-neutral-500">
            Features will be implemented in Phase 1 of the project.
          </p>
        </div>
      </div>
    </div>
  );
}
