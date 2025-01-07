'use client';

import { ReactNode } from 'react';
import { DashboardLayout } from './DashboardLayout';

interface RoleBasedLayoutProps {
  children: ReactNode;
  role?: 'patient' | 'doctor';
}

const roleBasedNavigation = {
  patient: [
    { name: 'Home', href: '/dashboard', icon: 'home' },
    { name: 'Symptom Analysis', href: '/symptoms', icon: 'stethoscope' },
    { name: 'Chat', href: '/chat', icon: 'chat' },
    { name: 'Health Metrics', href: '/metrics', icon: 'chart' },
    { name: 'Medical History', href: '/history', icon: 'folder' },
    { name: 'Settings', href: '/settings', icon: 'settings' },
  ],
  doctor: [
    { name: 'Dashboard', href: '/doctor', icon: 'home' },
    { name: 'Patients', href: '/doctor/patients', icon: 'users' },
    { name: 'Appointments', href: '/doctor/appointments', icon: 'calendar' },
    { name: 'Analysis', href: '/doctor/analysis', icon: 'chart' },
    { name: 'Reports', href: '/doctor/reports', icon: 'document' },
    { name: 'Settings', href: '/doctor/settings', icon: 'settings' },
  ],
};

export function RoleBasedLayout({ children, role = 'patient' }: RoleBasedLayoutProps) {
  const navigation = roleBasedNavigation[role] || [];

  return (
    <DashboardLayout navigation={navigation}>
      {children}
    </DashboardLayout>
  );
} 