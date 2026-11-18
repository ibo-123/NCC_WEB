"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Button } from "@/components/ui/Button.js";
import { Field } from "@/components/ui/Field.js";
import { Modal } from "@/components/ui/Modal.js";
import { Callout } from "@/components/ui/Callout.js";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";

const EMPTY_TOPIC = { id: null, name: "", slug: "", order: "" };

export default function AdminTopicsPage() {
  const { store, saveTopic, deleteTopic } = usePlatform();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_TOPIC);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  function openCreate() {
    setForm({ id: null, name: "", slug: "", order: String(store.topics.length + 1) });
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(topic) {
    setForm({
      id: topic.id,
      name: topic.name,
      slug: topic.slug,
      order: String(topic.order ?? 1),
    });
    setFormError("");
    setFormOpen(true);
  }

  function handleSave(e) {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      setFormError("Topic name must be at least 2 characters.");
      return;
    }
    const res = saveTopic(form);
    if (!res.ok) {
      setFormError(res.error);
      return;
    }
    setFormOpen(false);
  }

  const sortedTopics = [...store.topics].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <PlatformShell
      mode="admin"
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Topics" }]}
    >
      <PageHeader
        title="Practice Topics"
        description="Organize DSA curriculum topics and display ordering. Topics containing problems cannot be deleted."
        actions={
          <Button onClick={openCreate}>
            <Plus aria-hidden="true" size={16} />
            New topic
          </Button>
        }
      />

      <ResponsiveTable
        caption="Curriculum topics"
        rows={sortedTopics}
        columns={[
          {
            key: "order",
            header: "Order",
            align: "right",
            render: (t) => <span className="font-mono tabular-nums">{t.order}</span>,
          },
          {
            key: "name",
            header: "Topic Name",
            render: (t) => <span className="font-semibold text-fg">{t.name}</span>,
          },
          {
            key: "slug",
            header: "Slug",
            render: (t) => <code className="font-mono text-xs text-fg-2">{t.slug}</code>,
          },
          {
            key: "count",
            header: "Problems",
            align: "right",
            render: (t) => (
              <span className="font-mono tabular-nums">
                {store.problems.filter((p) => p.topicId === t.id).length}
              </span>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            align: "right",
            render: (t) => (
              <div className="inline-flex items-center gap-1.5">
                <Button size="sm" variant="outline" onClick={() => openEdit(t)}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" aria-label={`Delete ${t.name}`} onClick={() => setDeleteTarget(t)}>
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
        title={form.id ? "Edit topic" : "New topic"}
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {formError ? <Callout tone="danger" role="alert">{formError}</Callout> : null}

          <Field
            label="Topic name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Segment Trees"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Slug"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="segment-trees"
              hint="Auto-generated if left blank"
            />
            <Field
              label="Sort order"
              type="number"
              value={form.order}
              onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{form.id ? "Save changes" : "Create topic"}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={`Delete topic "${deleteTarget?.name}"?`}
        description="Topics that still contain problems cannot be deleted until problems are removed or reassigned."
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteTarget) deleteTopic(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Delete topic
            </Button>
          </>
        }
      />
    </PlatformShell>
  );
}
