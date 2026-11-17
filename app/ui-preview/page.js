import { notFound } from "next/navigation";
import { isProduction } from "@/lib/config/env.js";
import { AppShell, PageHeader } from "@/components/layout/AppShell.js";
import { Badge, BADGE_TONES } from "@/components/ui/Badge.js";
import { Button, ButtonLink } from "@/components/ui/Button.js";
import { Card, Stat } from "@/components/ui/Card.js";
import { Field } from "@/components/ui/Field.js";
import { DataTable, Pager } from "@/components/ui/Table.js";

// Development-only gallery of the shared components, used for the rendering checks. 404 in production.
export const metadata = { title: "UI preview" };

const sections = [
  {
    items: [
      { href: "/ui-preview", label: "Dashboard", icon: "dashboard" },
      { href: "/lectures", label: "Lectures", icon: "lectures" },
      { href: "/problems", label: "Problems", icon: "problems" },
      { href: "/contests", label: "Contests", icon: "contests" },
    ],
  },
  { title: "Admin", items: [{ href: "/admin/users", label: "Users", icon: "users" }] },
];

const rows = [
  { id: "1", rank: 1, name: "Selam Tadesse", rating: 1840, status: "success" },
  { id: "2", rank: 2, name: "Dawit Alemu", rating: 1712, status: "unsolved" },
  { id: "3", rank: 3, name: "Hana Bekele", rating: 1655, status: "completed" },
];

export default function UiPreview() {
  if (isProduction()) notFound();
  const columns = [
    { key: "rank", header: "#", align: "right" },
    { key: "name", header: "Name" },
    { key: "rating", header: "Rating", align: "right" },
    { key: "status", header: "Status", render: (r) => <Badge tone={r.status}>{r.status === "success" ? "solved" : r.status}</Badge> },
  ];
  return (
    <AppShell
      brand={{ name: "NCC DSA", sub: "Student", mark: "N" }}
      sections={sections}
      user={{ name: "Selam Tadesse", detail: "Student" }}
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "UI preview" }]}
    >
      <PageHeader
        title="Shared components"
        description="Every control below has a working handler or link."
        actions={<ButtonLink href="/ui-preview?page=2" variant="outline">Link button</ButtonLink>}
      />
      <div className="grid grid-cols-1 gap-4 min-[800px]:grid-cols-3">
        <Stat label="Rating" value="1840" hint="+24 this month" trend="up" />
        <Stat label="Solved" value="212" hint="of 400" />
        <Stat label="Streak" value="7" hint="days" trend="down" />
      </div>
      <Card>
        <h2 className="m-0 mb-3 text-lg font-semibold">Buttons and badges</h2>
        <div className="flex flex-wrap gap-2">
          {["primary", "secondary", "outline", "ghost", "danger", "success"].map((v) => (
            <Button key={v} variant={v}>{v}</Button>
          ))}
          <Button loading>Saving</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.keys(BADGE_TONES).map((t) => (
            <Badge key={t} tone={t} dot>{t}</Badge>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="m-0 mb-3 text-lg font-semibold">Form fields</h2>
        <form className="grid grid-cols-1 gap-4 min-[800px]:grid-cols-2">
          <Field label="Email" name="email" type="email" defaultValue="selam@example.edu" hint="Used to sign in." />
          <Field label="Handle" name="handle" defaultValue="x" error="Handle must be at least 3 characters." />
          <Field label="Display name" name="display" defaultValue="Selam" success="Looks good." />
          <Field label="Role" name="role" as="select" defaultValue="student">
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </Field>
          <Field label="Bio" name="bio" as="textarea" className="min-[800px]:col-span-2" defaultValue="Hello" />
          <div className="min-[800px]:col-span-2">
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Card>
      <DataTable columns={columns} rows={rows} highlight={(r) => r.rank === 1} caption="Leaderboard" />
      <Pager page={3} totalPages={9} hrefFor={(p) => `/ui-preview?page=${p}`} />
    </AppShell>
  );
}
