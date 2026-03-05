"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [service, setService] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (isRegister) {
        await register({ email, password, nom, prenom, service: service || undefined });
      } else {
        await login(email, password);
      }
      router.replace("/chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-nova-600 text-2xl font-bold text-white">
            N
          </div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">
            NOVA-EQP
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Gestion intelligente des equipements biomedicaux
          </p>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-[hsl(var(--card-foreground))]">
            {isRegister ? "Creer un compte" : "Connexion"}
          </h2>

          {error && (
            <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="prenom"
                      className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]"
                    >
                      Prenom
                    </label>
                    <input
                      id="prenom"
                      type="text"
                      required
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      className="w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] outline-none focus:border-nova-500 focus:ring-1 focus:ring-nova-500"
                      placeholder="Jean"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="nom"
                      className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]"
                    >
                      Nom
                    </label>
                    <input
                      id="nom"
                      type="text"
                      required
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      className="w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] outline-none focus:border-nova-500 focus:ring-1 focus:ring-nova-500"
                      placeholder="Dupont"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="service"
                    className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]"
                  >
                    Service (optionnel)
                  </label>
                  <input
                    id="service"
                    type="text"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] outline-none focus:border-nova-500 focus:ring-1 focus:ring-nova-500"
                    placeholder="Radiologie, Cardiologie..."
                  />
                </div>
              </>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]"
              >
                Adresse e-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] outline-none focus:border-nova-500 focus:ring-1 focus:ring-nova-500"
                placeholder="vous@hopital.fr"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]"
              >
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] outline-none focus:border-nova-500 focus:ring-1 focus:ring-nova-500"
                placeholder="Votre mot de passe"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-nova-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-nova-700 focus:outline-none focus:ring-2 focus:ring-nova-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Chargement..."
                : isRegister
                  ? "Creer le compte"
                  : "Se connecter"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
              className="text-sm text-nova-500 hover:text-nova-400 hover:underline"
            >
              {isRegister
                ? "Deja un compte ? Se connecter"
                : "Pas encore de compte ? Creer un compte"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
