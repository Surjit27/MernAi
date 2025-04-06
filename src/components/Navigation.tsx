import React from 'react';
import { NavLink } from 'react-router-dom';
import { Brain, BarChart3, Library, Sun, Moon, Play } from 'lucide-react';
import clsx from 'clsx';

interface NavigationProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ isDarkMode, toggleDarkMode }) => {
  const navItems = [
    { to: '/', icon: Brain, label: 'Home' },
    { to: '/benchmark', icon: BarChart3, label: 'Benchmark & Compare' },
    { to: '/model-library', icon: Library, label: 'Model Library' },
    { to: '/model-evaluation', icon: Play, label: 'Model Evaluation' },
  ];

  return (
    <nav className="fixed w-full backdrop-blur-md bg-white/75 dark:bg-gray-900/75 z-50 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              <span className="ml-2 text-xl font-semibold dark:text-white">AI Benchmark</span>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    )
                  }
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5 text-gray-300" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;