/**
 * Footer Component
 *
 * Global footer with links, legal information, and system info.
 */

import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-200 bg-neutral-50 py-8">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-3">
          {/* About Section */}
          <div>
            <h3 className="mb-4 font-display text-lg text-neutral-800">Angry Birdman</h3>
            <p className="text-sm text-neutral-600">
              Clan management system for Angry Birds 2. Track battles, manage rosters, and analyze
              performance.
            </p>
          </div>

          {/* Links Section */}
          <div>
            <h3 className="mb-4 font-semibold text-neutral-800">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-neutral-600 hover:text-primary">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/clans" className="text-neutral-600 hover:text-primary">
                  Browse Clans
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-neutral-600 hover:text-primary">
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Section */}
          <div>
            <h3 className="mb-4 font-semibold text-neutral-800">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="text-neutral-600 hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-neutral-600 hover:text-primary">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/webzeppelin/angry-birdman"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-600 hover:text-primary"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-neutral-200 pt-8 text-center">
          <p className="text-sm text-neutral-500">
            © {currentYear} Angry Birdman. Made for Angry Birds 2 clan managers.
          </p>
          <p className="mt-2 text-xs text-neutral-400">
            Not affiliated with Rovio Entertainment Corporation.
          </p>
        </div>
      </div>
    </footer>
  );
}
