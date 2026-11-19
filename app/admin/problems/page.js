"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PlatformShell } from "@/components/layout/PlatformShell.js";
import { PageHeader } from "@/components/layout/AppShell.js";
import { Badge } from "@/components/ui/Badge.js";
import { Button } from "@/components/ui/Button.js";
import { Field } from "@/components/ui/Field.js";
import { Modal } from "@/components/ui/Modal.js";
import { SearchInput } from "@/components/ui/SearchInput.js";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable.js";
import { usePlatform } from "@/components/providers/PlatformProvider.js";
import { statusToTone } from "@/lib/status.js";

const EMPTY_PROBLEM = {
  id: null,
  title: "",
  topicId: "dp",
  platform: "codeforces",
  value: "10",
  url: "",
  contestId: "",
  index: "A",
  titleSlug: "",
  status: "published",
};

export default function AdminProblemsPage() {
  const { store, saveProblem, deleteProblem } = usePlatform();
  const [query, setQuery] = useState("");
  const [topicFilter, setTopicFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_PROBLEM);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return store.problems.filter((p) => {
      if (topicFilter !== "all" && p.topicId !== topicFilter) return false;
      if (platformFilter !== "all" && p.platform !== platformFilter) return false;
      if (q && !p.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [store.problems, query, topicFilter, platformFilter]);

  function openCreate() {
    setForm({ ...EMPTY_PROBLEM, topicId: store.topics[0]?.id ?? "dp" });
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(p) {
    setForm({
      id: p.id,
      title: p.title,
      topicId: p.topicId,
      platform: p.platform,
      value: p.value ? String(p.value) : "",
      url: p.url,
      contestId: p.externalRef?.contestId ? String(p.externalRef.contestId) : "",
      index: p.externalRef?.index ?? "A",
      titleSlug: p.externalRef?.titleSlug ?? "",
      status: p.status,
    });
    setFormError("");
    setFormOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.url.trim()) {
      setFormError("Provide a problem title and external URL.");
      return;
    }
    const res = await saveProblem(form);
    if (!res?.ok) {
      setFormError(res?.error ?? "Unable to save problem.");
      return;
    }
    setFormOpen(false);
  }

  return (
    <PlatformShell
      mode="admin"
      breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Problems" }]}
    >
      <PageHeader
        title="Practice Problems"
        description="Manage Codeforces and LeetCode problems assigned to curriculum topics."
        actions={
          <Button onClick={openCreate}>
            <Plus aria-hidden="true" size={16} />
            Add problem
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search problem title..." label="Search problems" />
        <select
          aria-label="Filter by topic"
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          className="h-10 rounded-[2px] border border-border-strong bg-surface px-3 font-mono text-[13px] text-fg"
        >
          <option value="all">All topics</option>
          {store.topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by platform"
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="h-10 rounded-[2px] border border-border-strong bg-surface px-3 font-mono text-[13px] text-fg"
        >
          <option value="all">All platforms</option>
          <option value="codeforces">Codeforces</option>
          <option value="leetcode">LeetCode</option>
        </select>
      </div>

      <ResponsiveTable
        caption="Practice problems"
        rows={filtered}
        empty="No problems match your filters."
        columns={[
          {
            key: "title",
            header: "Problem",
            render: (p) => (
              <div>
                <div className="font-semibold text-fg">{p.title}</div>
                <div className="font-mono text-xs text-muted">
                  {p.externalRef?.contestId ? `CF ${p.externalRef.contestId}${p.externalRef.index}` : p.externalRef?.titleSlug}
                </div>
              </div>
            ),
          },
          {
            key: "topic",
            header: "Topic",
            render: (p) => (
              <span className="text-fg-2">
                {store.topics.find((t) => t.id === p.topicId)?.name ?? p.topicId}
              </span>
            ),
          },
          {
            key: "platform",
            header: "Platform",
            render: (p) => <span className="capitalize text-fg-2">{p.platform}</span>,
          },
          {
            key: "value",
            header: "Points",
            align: "right",
            render: (p) => <span className="font-mono tabular-nums">{p.value ?? "—"}</span>,
          },
          {
            key: "status",
            header: "Status",
            render: (p) => <Badge tone={statusToTone(p.status)}>{p.status}</Badge>,
          },
          {
            key: "actions",
            header: "Actions",
            align: "right",
            render: (p) => (
              <div className="inline-flex flex-wrap justify-end gap-1.5">
                {p.status === "draft" ? (
                  <Button
                    size="sm"
                    onClick={() =>
                      saveProblem({
                        ...p,
                        contestId: p.externalRef?.contestId,
                        index: p.externalRef?.index,
                        titleSlug: p.externalRef?.titleSlug,
                        status: "published",
                      })
                    }
                  >
                    Publish
                  </Button>
                ) : null}
                <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" aria-label={`Delete ${p.title}`} onClick={() => setDeleteTarget(p)}>
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
        title={form.id ? "Edit problem" : "Add problem"}
        maxWidth="max-w-[560px]"
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Field
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            error={formError}
            placeholder="e.g. Binary Search on Monotonic Function"
          />

          <div className="grid gap-3 sm:grid-cols-3">
            <Field
              label="Topic"
              as="select"
              value={form.topicId}
              onChange={(e) => setForm((f) => ({ ...f, topicId: e.target.value }))}
            >
              {store.topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Field>

            <Field
              label="Platform"
              as="select"
              value={form.platform}
              onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
            >
              <option value="codeforces">Codeforces</option>
              <option value="leetcode">LeetCode</option>
            </Field>

            <Field
              label="Weight (points)"
              type="number"
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            />
          </div>

          <Field
            label="Problem URL"
            type="url"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            placeholder="https://codeforces.com/problemset/problem/..."
          />

          {form.platform === "codeforces" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Codeforces Contest ID"
                type="number"
                value={form.contestId}
                onChange={(e) => setForm((f) => ({ ...f, contestId: e.target.value }))}
                placeholder="1324"
              />
              <Field
                label="Problem Index"
                value={form.index}
                onChange={(e) => setForm((f) => ({ ...f, index: e.target.value.toUpperCase() }))}
                placeholder="C"
              />
            </div>
          ) : (
            <Field
              label="LeetCode Title Slug"
              value={form.titleSlug}
              onChange={(e) => setForm((f) => ({ ...f, titleSlug: e.target.value }))}
              placeholder="longest-increasing-subsequence"
            />
          )}

          <Field
            label="Status"
            as="select"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </Field>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{form.id ? "Save changes" : "Add problem"}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.title}"?`}
        description="Removes the problem from practice sets."
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (deleteTarget) await deleteProblem(deleteTarget.id);
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
