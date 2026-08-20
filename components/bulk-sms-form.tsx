"use client";

import * as React from "react";
import { useActionState } from "react";
import { sendBulkSmsAction, type FormState } from "@/app/actions/resources";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { calculateSmsSegments } from "@/lib/sms_segments";
import { formatNaira, formatPhoneDisplay } from "@/lib/format";
import { estimateCost } from "@/lib/pricing_config";

type ContactOption = { id: string; name: string; phone: string };
type GroupOption = { id: string; name: string; count: number };
type SenderOption = { id: string; name: string };

export function BulkSmsForm({
  contacts,
  groups,
  senderIds,
}: {
  contacts: ContactOption[];
  groups: GroupOption[];
  senderIds: SenderOption[];
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(sendBulkSmsAction, {});
  const [query, setQuery] = React.useState("");
  const [selectedContacts, setSelectedContacts] = React.useState<Set<string>>(new Set());
  const [selectedGroups, setSelectedGroups] = React.useState<Set<string>>(new Set());
  const [message, setMessage] = React.useState("");
  const segmentInfo = calculateSmsSegments(message);
  const selectedGroupRecipientEstimate = groups.filter((group) => selectedGroups.has(group.id)).reduce((sum, group) => sum + group.count, 0);
  const recipientEstimate = selectedContacts.size + selectedGroupRecipientEstimate;
  const totalSegments = recipientEstimate * segmentInfo.segments;
  const estimatedCost = recipientEstimate * estimateCost(segmentInfo.segments);
  const visibleContacts = contacts.filter((contact) => `${contact.name} ${contact.phone}`.toLowerCase().includes(query.toLowerCase()));

  function toggleContact(id: string) {
    setSelectedContacts((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleGroup(id: string) {
    setSelectedGroups((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <form action={formAction} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      {Array.from(selectedContacts).map((id) => <input key={id} type="hidden" name="contactIds" value={id} />)}
      {Array.from(selectedGroups).map((id) => <input key={id} type="hidden" name="groupIds" value={id} />)}

      <div className="space-y-6">
        {(state.error || state.success) && (
          <p className={`rounded-lg border px-3 py-2 text-sm ${state.error ? "border-[var(--error-subtle-border)] bg-[var(--error-subtle)] text-[var(--error-text)]" : "border-[var(--success-subtle-border)] bg-[var(--success-subtle)] text-[var(--success-text)]"}`}>
            {state.error ?? state.success}
          </p>
        )}

        <section className="app-panel rounded-2xl p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Recipients</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Choose real contacts and groups from this workspace.</p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedContacts(new Set(visibleContacts.map((contact) => contact.id)))} disabled={visibleContacts.length === 0}>
              Select visible
            </Button>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <Label htmlFor="contactSearch">Search contacts</Label>
              <Input id="contactSearch" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or phone" />
              <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-[var(--border)]">
                {visibleContacts.length === 0 ? (
                  <p className="p-4 text-sm text-[var(--text-muted)]">No matching contacts.</p>
                ) : visibleContacts.map((contact) => (
                  <label key={contact.id} className="flex min-h-12 cursor-pointer items-center gap-3 border-b border-[var(--border)] px-3 py-2 text-sm last:border-b-0 hover:bg-[var(--surface-hover)]">
                    <input type="checkbox" checked={selectedContacts.has(contact.id)} onChange={() => toggleContact(contact.id)} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{contact.name}</span>
                      <span className="block font-mono text-xs text-[var(--text-muted)]">{formatPhoneDisplay(contact.phone)}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium">Groups</p>
              <div className="rounded-xl border border-[var(--border)]">
                {groups.length === 0 ? (
                  <p className="p-4 text-sm text-[var(--text-muted)]">No groups yet.</p>
                ) : groups.map((group) => (
                  <label key={group.id} className="flex min-h-12 cursor-pointer items-center justify-between gap-3 border-b border-[var(--border)] px-3 py-2 text-sm last:border-b-0 hover:bg-[var(--surface-hover)]">
                    <span className="flex items-center gap-3">
                      <input type="checkbox" checked={selectedGroups.has(group.id)} onChange={() => toggleGroup(group.id)} />
                      <span className="font-medium">{group.name}</span>
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">{group.count} contacts</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="app-panel rounded-2xl p-5">
          <h2 className="font-semibold">Message</h2>
          <div className="mt-4 grid gap-4">
            <div>
              <Label htmlFor="name">Campaign name</Label>
              <Input id="name" name="name" placeholder="August customer update" required />
            </div>
            <div>
              <Label htmlFor="senderId">Sender ID</Label>
              <select id="senderId" name="senderId" required className="h-10 w-full rounded-lg px-3 text-sm">
                <option value="">Select approved sender ID</option>
                {senderIds.map((sender) => <option key={sender.id} value={sender.id}>{sender.name}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="body">SMS body</Label>
              <textarea id="body" name="body" value={message} onChange={(event) => setMessage(event.target.value)} rows={7} required className="w-full rounded-lg px-3 py-2 text-sm" placeholder="Write the message to send to selected recipients." />
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
                <span>{segmentInfo.characterCount} characters</span>
                <span>{segmentInfo.segments} segment{segmentInfo.segments === 1 ? "" : "s"}</span>
                <span>{segmentInfo.encoding}</span>
              </div>
            </div>
            <div>
              <Label htmlFor="scheduledFor">Schedule for</Label>
              <Input id="scheduledFor" name="scheduledFor" type="datetime-local" />
            </div>
          </div>
        </section>
      </div>

      <aside className="app-panel h-fit rounded-2xl p-5 xl:sticky xl:top-28">
        <h2 className="font-semibold">Preview</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <Row label="Recipients" value={recipientEstimate.toLocaleString("en-NG")} />
          <Row label="SMS segments" value={segmentInfo.segments.toLocaleString("en-NG")} />
          <Row label="Estimated credits" value={totalSegments.toLocaleString("en-NG")} />
          <Row label="Estimated cost" value={formatNaira(estimatedCost)} />
        </dl>
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-sunken)] p-4">
          <p className="text-xs text-[var(--text-muted)]">Message preview</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{message || "Your composed SMS will appear here."}</p>
        </div>
        <Button type="submit" loading={pending} className="mt-5 w-full" disabled={pending || recipientEstimate === 0 || senderIds.length === 0 || !message.trim()}>
          Confirm bulk send
        </Button>
        <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">If the SMS provider is not configured, submission will fail clearly without charging the wallet or creating fake delivery success.</p>
      </aside>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-[var(--text-secondary)]">{label}</dt>
      <dd className="tabular font-semibold">{value}</dd>
    </div>
  );
}
