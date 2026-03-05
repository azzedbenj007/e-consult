'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api';

const patientNav = [
  { href: '/dashboard', icon: '🏠', label: 'Tableau de bord' },
  { href: '/doctors', icon: '👨‍⚕️', label: 'Médecins' },
  { href: '/appointments', icon: '📅', label: 'Rendez-vous' },
  { href: '/medical-records', icon: '📋', label: 'Dossier médical' },
  { href: '/prescriptions', icon: '💊', label: 'Ordonnances' },
  { href: '/messages', icon: '💬', label: 'Messages' },
  { href: '/profile', icon: '👤', label: 'Mon profil' },
];

const doctorNav = [
  { href: '/doctor/dashboard', icon: '🏠', label: 'Tableau de bord' },
  { href: '/doctor/agenda', icon: '📅', label: 'Agenda' },
  { href: '/doctor/patients', icon: '🤒', label: 'Patients' },
  { href: '/doctor/prescriptions', icon: '💊', label: 'Ordonnances' },
  { href: '/doctor/messages', icon: '💬', label: 'Messages' },
  { href: '/doctor/profile', icon: '👤', label: 'Mon profil' },
];

const adminNav = [
  { href: '/admin/dashboard', icon: '📊', label: 'Tableau de bord' },
  { href: '/admin/doctors', icon: '👨‍⚕️', label: 'Médecins' },
  { href: '/admin/patients', icon: '🤒', label: 'Patients' },
  { href: '/admin/payments', icon: '💳', label: 'Paiements' },
  { href: '/admin/specialities', icon: '🏥', label: 'Spécialités' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const nav =
    user?.role === 'DOCTOR'
      ? doctorNav
      : user?.role === 'ADMIN'
      ? adminNav
      : patientNav;

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      logout();
      router.push('/login');
    }
  };

  return (
    <aside className="w-64 min-h-screen bg-white border-r flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">EC</span>
          </div>
          <span className="text-lg font-bold text-gray-900">E-Consult</span>
        </div>
      </div>

      {/* User */}
      <div className="px-4 py-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <span className="text-lg">🚪</span>
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
