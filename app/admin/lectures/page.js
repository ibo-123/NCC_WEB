"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Badge } from "@/components/ui/Badge.js";
import { Button, ButtonLink } from "@/components/ui/Button.js";
import { Field } from "@/components/ui/Field.js";
import { Modal } from "@/components/ui/Modal.js";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { formatDateTime, statusToTone } from "@/lib/status.js";

const EMPTY_LECTURE = {
  id: null,
  title: "",
  description: "",
  scheduledAt: "2026-10-20T13:00",
  liveUrl: "",
  status: "draft",
  resources: [],
};

export default function AdminLecturesPage() {
  const { store, saveLecture, deleteLecture } = usePlatform();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_LECTURE);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  function openCreate() {
    setForm(EMPTY_LECTURE);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(lec) {
    setForm({
      id: lec.id,
      title: lec.title,
      description: lec.description,
      scheduledAt: lec.scheduledAt ? lec.scheduledAt.slice(0, 16) : "2026-10-20T13:00",
      liveUrl: lec.liveUrl ?? "",
      status: lec.status,
      resources: lec.resources ? lec.resources.map((r) => ({ ...r })) : [],
    });
    setFormError("");
    setFormOpen(true);
  }

  function addResource() {
    setForm((f) => ({
      ...f,
      resources: [...f.resources, { title: "", type: "pdf", url: "" }],
    }));
  }

  function updateResource(index, key, val) {
    setForm((f) => ({
      ...f,
      resources: f.resources.map((r, i) => (i === index ? { ...r, [key]: val } : r)),
    }));
  }

  function removeResource(index) {
    setForm((f) => ({
      ...f,
      resources: f.resources.filter((_, i) => i !== index),
    }));
  }

  function handleSave(e) {
    e.preventDefault();
    if (form.title.trim().length < 3) {
      setFormError("Provide a lecture title (at least 3 characters).");
      return;
    }
    const cleanResources = form.resources.filter((r) => r.title.trim() && r.url.trim());
    saveLecture({
      ...form,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      resources: cleanResources,
    });
    setFormOpen(false);
  }

  return (
    <PlatformShell
      mode="admin"
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Lectures" }]}
    >
      <PageHeader
        title="Manage Lectures"
        description="Schedule lectures, attach slides and practice links, and open attendance windows."
        actions={
          <Button onClick={openCreate}>
            <Plus aria-hidden="true" size={16} />
            New lecture
          </Button>
        }
      />

      <ResponsiveTable
        caption="Lectures"
        rows={store.lectures}
        empty="No lectures scheduled yet."
        columns={[
          {
            key: "title",
            header: "Lecture",
            render: (l) => (
              <div>
                <div className="font-semibold text-fg">{l.title}</div>
                <div className="text-xs text-muted">{l.resources?.length ?? 0} resources</div>
              </div>
            ),
          },
          {
            key: "scheduledAt",
            header: "Scheduled",
            render: (l) => <span className="text-xs text-fg-2 tabular-nums">{formatDateTime(l.scheduledAt)}</span>,
          },
          {
            key: "status",
            header: "Status",
            render: (l) => {
              const hasOpen = store.attendanceSessions.some((s) => s.lectureId === l.id && !s.closedAt);
              return (
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone={statusToTone(l.status)}>{l.status}</Badge>
                  {hasOpen ? <Badge tone="danger" dot>Attendance open</Badge> : null}
                </div>
              );
            },
          },
          {
            key: "actions",
            header: "Actions",
            align: "right",
            render: (l) => (
              <div className="inline-flex flex-wrap justify-end gap-1.5">
                {l.status === "draft" ? (
                  <Button size="sm" onClick={() => saveLecture({ ...l, status: "published" })}>
                    Publish
                  </Button>
                ) : null}
                <ButtonLink href="/admin/attendance" size="sm" variant="outline">
                  Attendance
                </ButtonLink>
                <Button size="sm" variant="outline" onClick={() => openEdit(l)}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" aria-label={`Delete ${l.title}`} onClick={() => setDeleteTarget(l)}>
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
        title={form.id ? "Edit lecture" : "New lecture"}
        maxWidth="max-w-[580px]"
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Field
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            error={formError}
            placeholder="e.g. Segment Trees Introduction"
          />

          <Field
            label="Description"
            as="textarea"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Topics covered in this session..."
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Scheduled date & time"
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
            />
            <Field
              label="Status"
              as="select"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </Field>
          </div>

          <Field
            label="Live meeting URL"
            value={form.liveUrl}
            onChange={(e) => setForm((f) => ({ ...f, liveUrl: e.target.value }))}
            placeholder="https://meet.ncc.edu/..."
          />

          <div className="flex flex-col gap-2 rounded-lg border border-border bg-sunken p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold tracking-wider text-muted uppercase">Resources</span>
              <Button size="sm" variant="outline" onClick={addResource}>
                <Plus aria-hidden="true" size={13} />
                Add resource
              </Button>
            </div>
            {form.resources.map((res, idx) => (
              <div key={idx} className="grid items-center gap-2 sm:grid-cols-[1fr_92px_1fr_auto]">
                <input
                  type="text"
                  aria-label="Resource title"
                  placeholder="Title"
                  value={res.title}
                  onChange={(e) => updateResource(idx, "title", e.target.value)}
                  className="h-9 rounded-lg border border-border-strong bg-surface px-2.5 text-sm text-fg"
                />
                <select
                  aria-label="Resource type"
                  value={res.type}
                  onChange={(e) => updateResource(idx, "type", e.target.value)}
                  className="h-9 rounded-lg border border-border-strong bg-surface px-2 text-sm text-fg"
                >
                  <option value="pdf">PDF</option>
                  <option value="link">Link</option>
                  <option value="file">File</option>
                </select>
                <input
                  type="url"
                  aria-label="Resource URL"
                  placeholder="https://..."
                  value={res.url}
                  onChange={(e) => updateResource(idx, "url", e.target.value)}
                  className="h-9 rounded-lg border border-border-strong bg-surface px-2.5 text-sm text-fg"
                />
                <button
                  type="button"
                  onClick={() => removeResource(idx)}
                  aria-label="Remove resource"
                  className="grid size-8 cursor-pointer place-items-center rounded text-muted hover:bg-surface hover:text-fg"
                >
                  <X aria-hidden="true" size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{form.id ? "Save changes" : "Save lecture"}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.title}"?`}
        description="Lectures with an open attendance session cannot be deleted until the session is closed."
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteTarget) deleteLecture(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Delete lecture
            </Button>
          </>
        }
      />
    </PlatformShell>
  );
}
