'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  LineChart,
  Lightbulb,
  Calculator,
  Scale,
  Bell,
  Newspaper,
  Target,
  TrendingUp,
  FileText,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface NavSection {
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
}

const navigationSections: NavSection[] = [
  {
    label: 'Обзор',
    icon: <LayoutDashboard className="w-5 h-5" />,
    items: [
      {
        href: '/portfolio',
        label: 'Портфель',
        icon: <LayoutDashboard className="w-4 h-4" />,
      },
      {
        href: '/analytics',
        label: 'Аналитика',
        icon: <LineChart className="w-4 h-4" />,
      },
    ],
  },
  {
    label: 'Умные инструменты',
    icon: <Lightbulb className="w-5 h-5" />,
    items: [
      {
        href: '/recommendations',
        label: 'Рекомендации',
        icon: <Lightbulb className="w-4 h-4" />,
      },
      {
        href: '/scenarios',
        label: 'Что-если сценарии',
        icon: <Calculator className="w-4 h-4" />,
      },
      {
        href: '/rebalancing',
        label: 'Ребалансировка',
        icon: <Scale className="w-4 h-4" />,
      },
    ],
  },
  {
    label: 'Инструменты',
    icon: <TrendingUp className="w-5 h-5" />,
    items: [
      {
        href: '/alerts',
        label: 'Алерты',
        icon: <Bell className="w-4 h-4" />,
      },
      {
        href: '/tax',
        label: 'Налоговая оптимизация',
        icon: <FileText className="w-4 h-4" />,
      },
      {
        href: '/goals',
        label: 'Цели',
        icon: <Target className="w-4 h-4" />,
      },
      {
        href: '/news',
        label: 'Новости',
        icon: <Newspaper className="w-4 h-4" />,
      },
    ],
  },
];

export function Navigation() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
          >
            <LayoutDashboard className="w-6 h-6" />
            <span className="hidden sm:inline">Портфель</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigationSections.map((section) => (
              <div key={section.label} className="relative group">
                {/* Section Button */}
                <button
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors flex items-center gap-2"
                >
                  {section.icon}
                  <span>{section.label}</span>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`
                            flex items-center gap-3 px-4 py-2 text-sm transition-colors
                            ${
                              isActive
                                ? 'bg-blue-50 text-blue-600 font-medium'
                                : 'text-gray-700 hover:bg-gray-50'
                            }
                          `}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100"
              aria-expanded={isMobileOpen}
              aria-controls="mobile-menu"
              aria-label={isMobileOpen ? 'Закрыть меню' : 'Открыть меню'}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileOpen && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-gray-200"
        >
        <div className="py-2 space-y-1">
          {navigationSections.map((section) => (
            <div key={section.label} className="px-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {section.label}
              </div>
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                      ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
        </div>
      )}
    </nav>
  );
}
