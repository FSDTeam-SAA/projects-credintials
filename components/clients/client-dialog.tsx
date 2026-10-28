"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormRow } from "@/components/form-row";
import { api, ApiError, errorMessage } from "@/lib/api";
import type { Client } from "@/lib/types";

export function ClientDialog({ open, onOpenChange, client, initialName = "", onSaved }: {
  open: boolean; onOpenChange: (open: boolean) => void; client?: Client; initialName?: string; onSaved?: (client: Client) => void;
}) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    {open && <ClientDialogContent key={client?.id ?? "new"} client={client} initialName={initialName} onClose={() => onOpenChange(false)} onSaved={onSaved} />}
  </Dialog>;
}

function ClientDialogContent({ client, initialName, onClose, onSaved }: { client?: Client; initialName: string; onClose: () => void; onSaved?: (client: Client) => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(client?.name ?? initialName);
  const [error, setError] = useState("");
  const [existingId, setExistingId] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault(); e.stopPropagation();
    if (!name.trim()) { setError("Client name is required"); return; }
    setBusy(true); setError(""); setExistingId("");
    try {
      const result = client ? await api.patch<{ client: Client }>(`/clients/${client.id}`, { name }) : await api.post<{ client: Client }>("/clients", { name });
      qc.setQueryData(["clients", "detail", result.client.id], result.client);
      await Promise.all([qc.invalidateQueries({ queryKey: ["clients"] }), qc.invalidateQueries({ queryKey: ["projects"] })]);
      onSaved?.(result.client); onClose(); toast.success(client ? "Client updated" : "Client created");
    } catch (err) {
      setError(errorMessage(err));
      if (err instanceof ApiError) setExistingId(err.details?.existingClientId?.[0] ?? "");
    } finally { setBusy(false); }
  }
  async function useExisting() {
    setBusy(true);
    try { const result = await api.get<{ client: Client }>(`/clients/${existingId}`); qc.setQueryData(["clients", "detail", existingId], result.client); onSaved?.(result.client); onClose(); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  return <DialogContent onKeyDown={e => e.stopPropagation()} onInteractOutside={e => { if (busy) e.preventDefault(); }} onEscapeKeyDown={e => { if (busy) e.preventDefault(); }}>
    <DialogHeader><DialogTitle>{client ? "Rename client" : "Add client"}</DialogTitle><DialogDescription>{client ? "The new name will appear across all of this client’s projects." : "Keep all projects for this client together, across profiles."}</DialogDescription></DialogHeader>
    <form onSubmit={save} className="flex flex-col gap-5" noValidate>
      <FormRow label="Client name" htmlFor="client-dialog-name" required error={error}>
        <Input id="client-dialog-name" autoFocus value={name} maxLength={120} aria-invalid={!!error} onChange={e => { setName(e.target.value); setError(""); setExistingId(""); }} placeholder="e.g. giveandtake638" />
      </FormRow>
      {existingId && (onSaved ? <Button type="button" variant="outline" disabled={busy} onClick={useExisting}>Use existing client</Button> : <Button type="button" variant="outline" asChild><Link href={`/clients/${existingId}`}>Open existing client</Link></Button>)}
      <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy && <Loader2Icon className="animate-spin" />}{client ? "Save name" : "Create client"}</Button></DialogFooter>
    </form>
  </DialogContent>;
}
