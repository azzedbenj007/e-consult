'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

interface RegisterForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'PATIENT' | 'DOCTOR';
  consent: boolean;
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const defaultRole = (searchParams.get('role') as 'DOCTOR') || 'PATIENT';

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    defaultValues: { role: defaultRole },
  });

  const onSubmit = async (data: RegisterForm) => {
    if (!data.consent) {
      setError('Vous devez accepter les conditions d\'utilisation');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { consent, ...payload } = data;
      const res = await authApi.register(payload);
      const { user, accessToken, refreshToken } = res.data;
      setAuth(user, accessToken, refreshToken);
      router.push(user.role === 'DOCTOR' ? '/doctor/dashboard' : '/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-lg">EC</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Créer un compte</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3">
            {['PATIENT', 'DOCTOR'].map((role) => (
              <label key={role} className="relative">
                <input type="radio" value={role} {...register('role')} className="sr-only" />
                <div className={`border-2 rounded-lg p-3 text-center cursor-pointer transition-colors ${watch('role') === role ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'}`}>
                  <div className="text-xl mb-1">{role === 'PATIENT' ? '🤒' : '👨‍⚕️'}</div>
                  <div className="text-sm font-medium">{role === 'PATIENT' ? 'Patient' : 'Médecin'}</div>
                </div>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input
                {...register('firstName', { required: true })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="Jean"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                {...register('lastName', { required: true })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="Dupont"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              {...register('email', { required: true })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input
              type="tel"
              {...register('phone')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="+212 6XX XXX XXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              {...register('password', { required: true, minLength: 8 })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Min. 8 caractères"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">Minimum 8 caractères requis</p>}
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('consent', { required: true })}
              className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-600">
              J&apos;accepte les{' '}
              <Link href="#" className="text-blue-600 hover:underline">conditions d&apos;utilisation</Link>
              {' '}et la{' '}
              <Link href="#" className="text-blue-600 hover:underline">politique de confidentialité</Link>
              {' '}(RGPD)
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-blue-600 font-medium hover:text-blue-700">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
