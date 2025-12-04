/**
 * Not Found Page
 *
 * 404 error page.
 */

import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-gray-50 py-12">
      <div className="text-center">
        <div className="mb-4 text-8xl">🤷</div>
        <h1 className="font-display mb-4 text-6xl text-neutral-800">404</h1>
        <p className="mb-8 text-xl text-neutral-600">Page not found</p>
        <Link
          to="/"
          className="bg-primary hover:bg-primary-600 inline-block rounded-lg px-8 py-3 text-lg font-semibold text-white transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
