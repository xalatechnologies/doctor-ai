'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FaHome, 
  FaStethoscope, 
  FaComments, 
  FaChartLine, 
  FaFolderOpen, 
  FaCog,
  FaUsers,
  FaCalendarAlt,
  FaFileAlt
} from 'react-icons/fa';

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

interface NavbarProps {
  items: NavItem[];
}

const iconMap = {
  home: FaHome,
  stethoscope: FaStethoscope,
  chat: FaComments,
  chart: FaChartLine,
  folder: FaFolderOpen,
  settings: FaCog,
  users: FaUsers,
  calendar: FaCalendarAlt,
  document: FaFileAlt,
};

export function Navbar({ items = [] }: NavbarProps) {
  const pathname = usePathname();

  if (!items?.length) return null;

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const Icon = iconMap[item.icon as keyof typeof iconMap];
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`nav-link group ${isActive ? 'active' : ''}`}
          >
            <motion.div
              initial={false}
              animate={{ scale: isActive ? 1.1 : 1 }}
              className="relative"
            >
              <Icon className="w-5 h-5" />
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute -inset-1 bg-primary/10 rounded-md -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.div>
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
} 