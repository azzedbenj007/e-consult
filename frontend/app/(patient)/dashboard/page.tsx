'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { appointmentsApi, medicalRecordsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function PatientDashboard() {
  const { user } = useAuthStore();

  const { data: appointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentsApi.getAll({ limit: 5 }).then((r) => r.data),
  });

  const { data: records } = useQuery({
    queryKey: ['medical-records'],
    queryFn: () => medicalRecordsApi.getAll().then((r) => r.data),
  });

  const upcomingAppointments = appointments?.data?.filter(
    (a: any) => a.status === 'CONFIRMED' && new Date(a.scheduledAt) > new Date(),
  ) ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {user?.firstName} 👋
        </h1>
        <p className="text-gray-500 mt-1">Comment allez-vous aujourd&apos;hui ?</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="bg-white border rounded-xl p-4 flex flex-col items-center gap-2 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <span className="text-3xl">{action.icon}</span>
            <span className="text-sm font-medium text-gray-700 text-center">{action.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming appointments */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Prochains rendez-vous</h2>
            <Link href="/appointments" className="text-sm text-blue-600 hover:text-blue-700">
              Voir tout
            </Link>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">📅</p>
              <p className="text-sm">Aucun rendez-vous à venir</p>
              <Link href="/doctors" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
                Prendre un rendez-vous
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((apt: any) => (
                <div key={apt.id} className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">🩺</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      Dr. {apt.doctor.user.firstName} {apt.doctor.user.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{apt.speciality.name}</p>
                    <p className="text-xs text-blue-600 font-medium mt-0.5">
                      {format(new Date(apt.scheduledAt), 'EEEE d MMMM, HH:mm', { locale: fr })}
                    </p>
                  </div>
                  <Link
                    href={`/appointments/${apt.id}`}
                    className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
                  >
                    Détails
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent medical records */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Dossier médical</h2>
            <Link href="/medical-records" className="text-sm text-blue-600 hover:text-blue-700">
              Voir tout
            </Link>
          </div>

          {!records?.length ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">📋</p>
              <p className="text-sm">Aucun dossier médical</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.slice(0, 3).map((record: any) => (
                <div key={record.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{record.chiefComplaint}</p>
                      <p className="text-xs text-gray-500">
                        Dr. {record.doctor.user.firstName} {record.doctor.user.lastName}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {format(new Date(record.createdAt), 'd MMM', { locale: fr })}
                    </span>
                  </div>
                  {record.diagnosis && (
                    <p className="text-xs text-gray-600 mt-1 bg-gray-50 px-2 py-1 rounded">
                      Diagnostic : {record.diagnosis}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const quickActions = [
  { icon: '👨‍⚕️', label: 'Trouver un médecin', href: '/doctors' },
  { icon: '📅', label: 'Mes rendez-vous', href: '/appointments' },
  { icon: '💊', label: 'Mes ordonnances', href: '/prescriptions' },
  { icon: '💬', label: 'Messagerie', href: '/messages' },
];
