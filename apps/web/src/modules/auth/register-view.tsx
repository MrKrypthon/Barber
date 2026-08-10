"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { getAuthErrorMessage, useAuth } from "@/hooks/use-auth";

export function RegisterView() {
  const { register, status } = useAuth();
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({ businessName, ownerName, email, password });
      router.replace("/");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold">Crea tu negocio</h1>
        <p className="mb-6 text-sm text-neutral-400">Configura tu cuenta como propietario.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            autoFocus
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Nombre del negocio"
            className="h-12 rounded-xl border border-neutral-200 px-4 outline-none focus:border-primary"
          />
          <input
            required
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="Tu nombre"
            className="h-12 rounded-xl border border-neutral-200 px-4 outline-none focus:border-primary"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo"
            className="h-12 rounded-xl border border-neutral-200 px-4 outline-none focus:border-primary"
          />
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña (mínimo 8 caracteres)"
            className="h-12 rounded-xl border border-neutral-200 px-4 outline-none focus:border-primary"
          />
          {error ? <p className="text-sm text-secondary">{error}</p> : null}
          <Button type="submit" fullWidth disabled={submitting}>
            {submitting ? "Creando..." : "Crear cuenta"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-neutral-400">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-primary">
            Inicia sesión
          </Link>
        </p>
      </Card>
    </div>
  );
}
