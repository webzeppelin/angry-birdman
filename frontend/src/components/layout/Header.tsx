/**
 * Header Component
 *
 * Global header with branding, navigation, and authentication status.
 * Includes responsive mobile menu.
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';

export function Header() {
  const { isAuthenticated, user, clanInfo, login, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/clans', label: 'Browse Clans' },
    { path: '/about', label: 'About' },
  ];

  const adminLinks = isAuthenticated
    ? [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/roster', label: 'Roster' },
        { path: '/battles', label: 'Battles' },
      ]
    : [];

  const handleLogin = () => {
    login().catch(console.error);
  };

  const handleLogout = () => {
    logout().catch(console.error);
  };

  return (
    <header className="from-primary to-primary-600 sticky top-0 z-50 bg-gradient-to-r shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">🐦</span>
            <span className="font-display text-2xl text-white">Angry Birdman</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center space-x-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'text-white underline decoration-2 underline-offset-4'
                    : 'text-white/90 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {adminLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'text-white underline decoration-2 underline-offset-4'
                    : 'text-white/90 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="hidden items-center space-x-4 md:flex">
            {isAuthenticated ? (
              <>
                <div className="text-right text-sm text-white/90">
                  <div className="font-medium">{user?.preferred_username}</div>
                  {clanInfo && <div className="text-xs">Clan: {clanInfo.name}</div>}
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded bg-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/30"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={handleLogin}
                className="text-primary rounded bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-white/90"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex items-center justify-center rounded p-2 text-white hover:bg-white/20 md:hidden"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-white/20 py-4 md:hidden">
            <nav className="flex flex-col space-y-3">
              {[...navLinks, ...adminLinks].map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-2 text-sm font-medium ${
                    isActive(link.path)
                      ? 'bg-white/20 text-white'
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 border-t border-white/20 pt-4">
              {isAuthenticated ? (
                <>
                  <div className="mb-3 px-4 text-sm text-white/90">
                    <div className="font-medium">{user?.preferred_username}</div>
                    {clanInfo && <div className="text-xs">Clan: {clanInfo.name}</div>}
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="mx-4 w-[calc(100%-2rem)] rounded bg-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/30"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    handleLogin();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-primary mx-4 w-[calc(100%-2rem)] rounded bg-white px-4 py-2 text-sm font-medium hover:bg-white/90"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
