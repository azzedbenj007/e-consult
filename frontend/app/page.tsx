import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">EC</span>
            </div>
            <span className="text-xl font-bold text-gray-900">E-Consult</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium">
              Connexion
            </Link>
            <Link
              href="/register"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Commencer
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          Médecins disponibles maintenant
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
          Votre santé,{' '}
          <span className="text-blue-600">à portée de clic</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          Consultez un médecin certifié en vidéo depuis chez vous. Ordonnance numérique,
          dossier médical sécurisé, paiement en ligne.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            Consulter un médecin
          </Link>
          <Link
            href="/register?role=DOCTOR"
            className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-colors"
          >
            Je suis médecin
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 text-2xl">
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-600 text-sm">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-4xl font-extrabold mb-1">{s.value}</div>
                <div className="text-blue-200 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">EC</span>
              </div>
              <span className="text-white font-bold">E-Consult</span>
            </div>
            <p className="text-sm">© 2026 E-Consult. Tous droits réservés. Conforme RGPD.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

const features = [
  {
    icon: '🎥',
    title: 'Téléconsultation vidéo',
    description: 'Consultation vidéo HD chiffrée en temps réel. Aussi simple qu\'un appel vidéo.',
  },
  {
    icon: '📋',
    title: 'Ordonnance numérique',
    description: 'Recevez votre ordonnance en PDF directement après la consultation.',
  },
  {
    icon: '🔒',
    title: 'Données 100% sécurisées',
    description: 'Chiffrement de bout en bout, conforme RGPD. Vos données médicales sont protégées.',
  },
  {
    icon: '📅',
    title: 'Prise de RDV en ligne',
    description: 'Choisissez votre médecin, votre spécialité et votre créneau en quelques clics.',
  },
  {
    icon: '💳',
    title: 'Paiement sécurisé',
    description: 'Paiement en ligne par carte bancaire. Reçu envoyé automatiquement.',
  },
  {
    icon: '📁',
    title: 'Dossier médical',
    description: 'Historique complet de vos consultations, analyses et traitements.',
  },
];

const stats = [
  { value: '500+', label: 'Médecins certifiés' },
  { value: '50+', label: 'Spécialités' },
  { value: '10 000+', label: 'Patients satisfaits' },
  { value: '99.9%', label: 'Disponibilité' },
];
