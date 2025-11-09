/**
 * Silent Callback Page
 *
 * Note: Silent token renewal is no longer needed with the Backend Token Proxy Pattern.
 * Tokens are automatically refreshed every 14 minutes by the AuthContext.
 * This page is kept for backwards compatibility with existing routes.
 */

export function SilentCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-neutral-600">Token renewal is handled automatically.</p>
      </div>
    </div>
  );
}
