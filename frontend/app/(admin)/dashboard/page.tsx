'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminDashboard() {
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.getDashboard().then((r) => r.data),
  });

  const { data: pendingDoctors } = useQuery({
    queryKey: ['pending-doctors'],
    queryFn: () => adminApi.getPendingDoctors().then((r) => r.data),
  });

  const verifyMutation = useMutation({
    mutationFn: (doctorId: string) => adminApi.verifyDoctor(doctorId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pending-doctors'] }),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Admin</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          { label: 'Utilisateurs', value: stats?.totalUsers ?? 0, icon: '👥' },
          { label: 'Médecins', value: stats?.totalDoctors ?? 0, icon: '👨‍⚕️' },
          { label: 'Patients', value: stats?.totalPatients ?? 0, icon: '🤒' },
          { label: 'Consultations', value: stats?.totalAppointments ?? 0, icon: '📅' },
          { label: 'Revenus (MAD)', value: Number(stats?.totalRevenue ?? 0).toFixed(0), icon: '💰' },
          { label: 'En attente', value: stats?.pendingDoctors ?? 0, icon: '⏳', alert: true },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`bg-white border rounded-xl p-4 ${stat.alert && Number(stat.value) > 0 ? 'border-orange-300 bg-orange-50' : ''}`}
          >
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Pending doctors */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Médecins en attente de validation ({pendingDoctors?.length ?? 0})
        </h2>

        {!pendingDoctors?.length ? (
          <p className="text-gray-400 text-sm">Aucun médecin en attente</p>
        ) : (
          <div className="space-y-3">
            {pendingDoctors.map((doctor: any) => (
              <div
                key={doctor.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                    👨‍⚕️
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Dr. {doctor.user.firstName} {doctor.user.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{doctor.speciality.name}</p>
                    <p className="text-xs text-gray-400">N° {doctor.licenseNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {format(new Date(doctor.createdAt), 'd MMM yyyy', { locale: fr })}
                  </span>
                  <button
                    onClick={() => verifyMutation.mutate(doctor.id)}
                    disabled={verifyMutation.isPending}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60"
                  >
                    Valider
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
