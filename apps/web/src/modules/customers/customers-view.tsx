"use client";

import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Modal } from "@/components/modal";
import { PageHeader } from "@/components/page-header";
import { PlusIcon, SearchIcon } from "@/components/icons";
import { useCustomers } from "@/hooks/use-customers";
import { formatRelativeVisit } from "@/lib/format";

export function CustomersView() {
  const { customers, isLoading, isError, addCustomer, isAdding } = useCustomers();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const filtered = customers
    .filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  async function save() {
    if (!name.trim()) return;
    await addCustomer({ name: name.trim(), phone: phone.trim() || undefined, notes: notes.trim() || undefined });
    setModalOpen(false);
    setName("");
    setPhone("");
    setNotes("");
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        action={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            aria-label="Nuevo cliente"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-white active:brightness-95"
          >
            <PlusIcon className="h-6 w-6" />
          </button>
        }
      />

      <label className="mb-4 flex items-center gap-2 rounded-xl bg-white px-4 shadow-card">
        <SearchIcon className="h-5 w-5 text-neutral-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente..."
          className="h-12 w-full bg-transparent outline-none placeholder:text-neutral-400"
        />
      </label>

      <Card className="p-0">
        {isLoading ? (
          <p className="py-6 text-center text-neutral-400">Cargando clientes...</p>
        ) : isError ? (
          <p className="py-6 text-center text-secondary">No se pudieron cargar los clientes.</p>
        ) : (
          <>
            <ul className="grid divide-y divide-neutral-100 md:grid-cols-2 md:divide-y-0">
              {filtered.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-neutral-50 md:border-b md:border-neutral-100"
                >
                  <Avatar name={c.name} />
                  <div className="flex-1">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-neutral-400">{formatRelativeVisit(null)}</p>
                  </div>
                  <span className="h-3 w-3 rounded-full bg-success/30 ring-4 ring-success/10">
                    <span className="sr-only">Activo</span>
                  </span>
                </li>
              ))}
            </ul>
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-neutral-400">Sin resultados.</p>
            ) : null}
          </>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo cliente">
        <div className="flex flex-col gap-3">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre"
            className="h-12 rounded-xl border border-neutral-200 px-4 outline-none focus:border-primary"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Teléfono (opcional)"
            inputMode="tel"
            className="h-12 rounded-xl border border-neutral-200 px-4 outline-none focus:border-primary"
          />
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas (opcional)"
            className="h-12 rounded-xl border border-neutral-200 px-4 outline-none focus:border-primary"
          />
          <Button fullWidth onClick={save} disabled={!name.trim() || isAdding}>
            {isAdding ? "Guardando..." : "Guardar cliente"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
