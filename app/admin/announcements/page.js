"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Badge } from "@/components/ui/Badge.js";
import { Button } from "@/components/ui/Button.js";
import { Field } from "@/components/ui/Field.js";
import { Modal } from "@/components/ui/Modal.js";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { formatShortDate, statusToTone } from "@/lib/status.js";

const EMPTY_FORM = { id: null, title: "", type: "general", status: "draft", body: "" };

export default function AdminAnnouncementsPage() {
  const { store, saveAnnouncement, publishAnnouncement, deleteAnnouncement } = usePlatform();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(item) {
    setForm({
      id: item.id,
      title: item.title,
      type: item.type,
      status: item.status,
      body: item.body,
    });
    setFormError("");
    setFormOpen(true);
  }

  function handleSave(e) {
    e.preventDefault();
    if (form.title.trim().length < 3 || form.body.trim().length < 5) {
      setFormError("Provide a title (at least 3 characters) and announcement body.");
      return;
    }
    saveAnnouncement(form);
    setFormOpen(false);
  }

  return (
    <PlatformShell
      mode="admin"
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Announcements" }]}
    >
      <PageHeader
        title="Manage Announcements"
        description="Draft, publish, edit, or delete cohort-wide announcements."
        actions={
          <Button onClick={openCreate}>
            <Plus aria-hidden="true" size={16} />
            New announcement
          </Button>
        }
      />

      <ResponsiveTable
        caption="Announcements"
        rows={store.announcements}
        empty="No announcements created yet."
        columns={[
          {
            key: "title",
            header: "Title",
            render: (a) => (
              <div>
                <div className="font-semibold text-fg">{a.title}</div>
                <div className="line-clamp-1 max-w-[44ch] text-xs text-muted">{a.body}</div>
              </div>
            ),
          },
          {
            key: "type",
            header: "Type",
            render: (a) => <Badge tone={statusToTone(a.type)}>{a.type}</Badge>,
          },
          {
            key: "status",
            header: "Status",
            render: (a) => <Badge tone={statusToTone(a.status)}>{a.status}</Badge>,
          },
          {
            key: "date",
            header: "Updated",
            render: (a) => <span className="text-xs text-muted tabular-nums">{formatShortDate(a.updatedAt)}</span>,
          },
          {
            key: "actions",
            header: "Actions",
            align: "right",
            render: (a) => (
              <div className="inline-flex flex-wrap justify-end gap-1.5">
                {a.status === "draft" ? (
                  <Button size="sm" onClick={() => publishAnnouncement(a.id)}>
                    Publish
                  </Button>
                ) : null}
                <Button size="sm" variant="outline" onClick={() => openEdit(a)}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" aria-label={`Delete ${a.title}`} onClick={() => setDeleteTarget(a)}>
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
        title={form.id ? "Edit announcement" : "New announcement"}
        maxWidth="max-w-[540px]"
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Field
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Announcement headline"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Type"
              as="select"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            >
              <option value="general">General</option>
              <option value="important">Important</option>
              <option value="contest">Contest</option>
              <option value="lecture">Lecture</option>
              <option value="attendance">Attendance</option>
            </Field>

            <Field
              label="Publication status"
              as="select"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </Field>
          </div>

          <Field
            label="Body"
            as="textarea"
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            error={formError}
            placeholder="Write the full announcement details..."
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{form.id ? "Save changes" : "Save announcement"}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.title}"?`}
        description="This removes the announcement from student and admin views."
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteTarget) deleteAnnouncement(deleteTarget.id);
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
