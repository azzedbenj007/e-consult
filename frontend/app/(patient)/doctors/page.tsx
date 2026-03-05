'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { doctorsApi, specialitiesApi } from '@/lib/api';

export default function DoctorsPage() {
  const [search, setSearch] = useState('');
  const [specialityId, setSpecialityId] = useState('');

  const { data: specialities } = useQuery({
    queryKey: ['specialities'],
    queryFn: () => specialitiesApi.getAll().then((r) => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['doctors', search, specialityId],
    queryFn: () =>
      doctorsApi.getAll({ search: search || undefined, specialityId: specialityId || undefined })
        .then((r) => r.data),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Trouver un médecin</h1>
        <p className="text-gray-500 mt-1">Consultez nos {data?.meta?.total ?? 0} médecins certifiés</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Rechercher un médecin..."
        />
        <select
          value={specialityId}
          onChange={(e) => setSpecialityId(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Toutes les spécialités</option>
          {specialities?.map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Doctors grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.data?.map((doctor: any) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      )}

      {data?.data?.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">🔍</p>
          <p>Aucun médecin trouvé</p>
        </div>
      )}
    </div>
  );
}

function DoctorCard({ doctor }: { doctor: any }) {
  return (
    <div className="bg-white border rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
          {doctor.user.avatarUrl ? (
            <img src={doctor.user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
          ) : '👨‍⚕️'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">
            Dr. {doctor.user.firstName} {doctor.user.lastName}
          </h3>
          <p className="text-sm text-blue-600">{doctor.speciality.name}</p>
          {doctor.yearsOfExperience && (
            <p className="text-xs text-gray-500 mt-0.5">{doctor.yearsOfExperience} ans d&apos;expérience</p>
          )}
        </div>
      </div>

      {doctor.bio && (
        <p className="text-sm text-gray-600 mt-3 line-clamp-2">{doctor.bio}</p>
      )}

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-1">
          <span className="text-yellow-500">⭐</span>
          <span className="text-sm font-medium">{doctor.rating.toFixed(1)}</span>
          <span className="text-xs text-gray-400">({doctor.totalConsultations} consult.)</span>
        </div>
        <span className="text-sm font-semibold text-gray-900">
          {Number(doctor.consultationFee).toFixed(0)} MAD
        </span>
      </div>

      <Link
        href={`/doctors/${doctor.id}`}
        className="mt-3 w-full block text-center bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Prendre rendez-vous
      </Link>
    </div>
  );
}
