'use client';

import { ReactNode, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { DarkModeToggle } from '@/components/DarkModeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBars, FaTimes } from 'react-icons/fa';

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

interface DashboardLayoutProps {
  children: ReactNode;
  navigation?: NavItem[];
}

export function DashboardLayout({ 
  children, 
  navigation = [] 
}: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ 
            width: isSidebarOpen ? 280 : 0,
            opacity: isSidebarOpen ? 1 : 0
          }}
          exit={{ width: 0, opacity: 0 }}
          className={`fixed lg:static lg:block z-50 h-screen bg-card border-r border-divider overflow-hidden`}
        >
          <div className="flex h-16 items-center gap-2 px-6 border-b border-divider">
            <span className="text-xl font-semibold text-primary">🏥 Doctor AI</span>
          </div>
          <div className="p-4">
            <Navbar items={navigation} />
          </div>
        </motion.aside>
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="h-16 border-b border-divider bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 sticky top-0 z-40">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSidebarOpen ? (
                <FaTimes className="w-6 h-6" />
              ) : (
                <FaBars className="w-6 h-6" />
              )}
            </button>
            <div className="ml-auto flex items-center gap-4">
              <DarkModeToggle />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 