"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Badge } from "@/components/ui/Badge.js";
import { Button, ButtonLink } from "@/components/ui/Button.js";
import { Field } from "@/components/ui/Field.js";
import { Modal } from "@/components/ui/Modal.js";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { formatDateTime, statusToTone } from "@/lib/status.js";

const EMPTY_CONTEST = {
  id: null,
  title: "",
  description: "",
  mode: "individual",
  platformContestId: "",
  url: "",
  invitationUrl: "",
  startsAt: "2026-12-22T12:30",
  durationMinutes: "120",
  status: "upcoming",
  publication: "draft",
};

export default function AdminContestsPage() {
  const { store, saveContest, deleteContest } = usePlatform();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_CONTEST);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  function openCreate() {
    setForm(EMPTY_CONTEST);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(c) {
    setForm({
      id: c.id,
      title: c.title,
      description: c.description,
      mode: c.mode,
      platformContestId: c.platformContestId,
      url: c.url,
      invitationUrl: c.invitationUrl ?? "",
      startsAt: c.startsAt ? c.startsAt.slice(0, 16) : "2026-12-22T12:30",
      durationMinutes: String(c.durationMinutes),
      status: c.status,
      publication: c.publication,
    });
    setFormError("");
    setFormOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.platformContestId.trim() || !form.url.trim()) {
      setFormError("Provide a title, Codeforces contest ID, and URL.");
      return;
    }
    const res = await saveContest({
      ...form,
      startsAt: new Date(form.startsAt).toISOString(),
    });
    if (!res?.ok) {
      setFormError(res?.error ?? "Unable to save contest.");
      return;
    }
    setFormOpen(false);
  }

  return (
    <PlatformShell
      mode="admin"
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Contests" }]}
    >
      <PageHeader
        title="Manage Contests"
        description="Configure Individual and week-long Group Codeforces contests."
        actions={
          <Button onClick={openCreate}>
            <Plus aria-hidden="true" size={16} />
            New contest
          </Button>
        }
      />

      <ResponsiveTable
        caption="Contests"
        rows={store.contests}
        columns={[
          {
            key: "title",
            header: "Contest",
            render: (c) => (
              <div>
                <div className="font-semibold text-fg">{c.title}</div>
                <div className="text-xs text-muted">
                  Codeforces #{c.platformContestId} ·{" "}
                  {c.durationMinutes >= 1440
                    ? `${Math.round(c.durationMinutes / 1440)}d`
                    : `${c.durationMinutes}m`}
                </div>
              </div>
            ),
          },
          {
            key: "mode",
            header: "Track",
            render: (c) => <Badge tone={c.mode === "team" ? "info" : "neutral"}>{c.mode}</Badge>,
          },
          {
            key: "startsAt",
            header: "Starts",
            render: (c) => <span className="text-xs text-fg-2 tabular-nums">{formatDateTime(c.startsAt)}</span>,
          },
          {
            key: "publication",
            header: "Status",
            render: (c) => (
              <div className="flex flex-wrap gap-1.5">
                <Badge tone={statusToTone(c.publication)}>{c.publication}</Badge>
                <Badge tone={statusToTone(c.status)}>{c.status}</Badge>
              </div>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            align: "right",
            render: (c) => (
              <div className="inline-flex flex-wrap justify-end gap-1.5">
                {c.publication === "draft" ? (
                  <Button size="sm" onClick={() => saveContest({ ...c, publication: "published" })}>
                    Publish
                  </Button>
                ) : null}
                <ButtonLink href="/admin/results" size="sm" variant="outline">
                  Results
                </ButtonLink>
                <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" aria-label={`Delete ${c.title}`} onClick={() => setDeleteTarget(c)}>
                  <Trash2 aria-hidden="true" size={14} />
                </Button>
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={form.id ? "Edit contest" : "New contest"}
        maxWidth="max-w-[560px]"
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Field
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            error={formError}
            placeholder="e.g. NCC_DSA Weekly Contest #05"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Contest mode"
              as="select"
              value={form.mode}
              onChange={(e) => {
                const nextMode = e.target.value;
                setForm((f) => ({
                  ...f,
                  mode: nextMode,
                  durationMinutes: nextMode === "team" ? "10080" : "120",
                }));
              }}
            >
              <option value="individual">Individual</option>
              <option value="team">Group (Team · default 10080 min)</option>
            </Field>

            <Field
              label="Codeforces contest ID"
              value={form.platformContestId}
              onChange={(e) => setForm((f) => ({ ...f, platformContestId: e.target.value }))}
              placeholder="e.g. 123456"
            />
          </div>

          <Field
            label="Contest URL"
            type="url"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            placeholder="https://codeforces.com/contest/123456"
          />

          <div className="grid gap-3 sm:grid-cols-3">
            <Field
              label="Starts at"
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
            />
            <Field
              label="Duration (minutes)"
              type="number"
              value={form.durationMinutes}
              onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
            />
            <Field
              label="Publication"
              as="select"
              value={form.publication}
              onChange={(e) => setForm((f) => ({ ...f, publication: e.target.value }))}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </Field>
          </div>

          <Field
            label="Description"
            as="textarea"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Contest guidelines and schedule notes..."
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{form.id ? "Save changes" : "Save contest"}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.title}"?`}
        description="Removes the contest from schedules."
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (deleteTarget) await deleteContest(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Delete
            </Button>
          </>
        }
      />
    </PlatformShell>
  );
}
