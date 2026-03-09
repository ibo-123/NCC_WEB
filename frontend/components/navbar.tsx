'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut, User, Settings } from 'lucide-react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2 font-bold text-lg">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              NCC
            </div>
            <span className="hidden sm:inline">NCC Portal</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/dashboard" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition">
              Dashboard
            </Link>
            <Link href="/courses" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition">
              Courses
            </Link>
            <Link href="/events" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition">
              Events
            </Link>
            <Link href="/achievements" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition">
              Achievements
            </Link>
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/profile" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
              <User size={20} className="text-slate-600 dark:text-slate-400" />
            </Link>
            {user?.role === 'admin' && (
              <Link href="/admin" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                <Settings size={20} className="text-slate-600 dark:text-slate-400" />
              </Link>
            )}
            <Button onClick={handleLogout} variant="ghost" size="sm" className="gap-2">
              <LogOut size={18} />
              Logout
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/dashboard" className="block px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              Dashboard
            </Link>
            <Link href="/courses" className="block px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              Courses
            </Link>
            <Link href="/events" className="block px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              Events
            </Link>
            <Link href="/achievements" className="block px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              Achievements
            </Link>
            <Link href="/profile" className="block px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              Profile
            </Link>
            {user?.role === 'admin' && (
              <Link href="/admin" className="block px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                Admin
              </Link>
            )}
            <Button onClick={handleLogout} className="w-full mt-2 justify-start gap-2">
              <LogOut size={18} />
              Logout
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
