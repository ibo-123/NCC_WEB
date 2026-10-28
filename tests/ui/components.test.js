import { renderToStaticMarkup } from "react-dom/server";
import { createElement as h } from "react";
import { describe, expect, it } from "vitest";
import { Badge, BADGE_TONES } from "@/components/ui/Badge.js";
import { Button, ButtonLink, buttonClass } from "@/components/ui/Button.js";
import { Card, Stat } from "@/components/ui/Card.js";
import { Field } from "@/components/ui/Field.js";
import { DataTable, Pager, pageWindow } from "@/components/ui/Table.js";
import { DEFAULT_THEME, normalizeTheme } from "@/lib/theme.js";

const html = (el) => renderToStaticMarkup(el);

describe("Button", () => {
  it("renders a typed button; defaults to type=button", () => {
    const out = html(h(Button, null, "Save"));
    expect(out).toContain('type="button"');
    expect(out).toContain("Save");
  });
  it("loading disables the button and marks it busy", () => {
    const out = html(h(Button, { loading: true }, "Save"));
    expect(out).toContain("disabled");
    expect(out).toContain('aria-busy="true"');
  });
  it("rejects unknown variants and sizes", () => {
    expect(() => buttonClass({ variant: "neon" })).toThrow(TypeError);
    expect(() => buttonClass({ size: "xl" })).toThrow(TypeError);
  });
  it("outline keeps a visible border color; solid variants use a transparent border", () => {
    expect(buttonClass({ variant: "outline" })).toContain("border-border-strong");
    expect(buttonClass({ variant: "outline" })).not.toContain("border-transparent");
    expect(buttonClass({ variant: "primary" })).toContain("border-transparent");
  });
  it("ButtonLink renders a link, or a non-interactive span when disabled", () => {
    expect(html(h(ButtonLink, { href: "/x" }, "Go"))).toContain('href="/x"');
    const off = html(h(ButtonLink, { href: "/x", disabled: true }, "Go"));
    expect(off).not.toContain("href");
    expect(off).toContain('aria-disabled="true"');
  });
});

describe("Badge", () => {
  it("covers the prototype tones plus draft, completed, unsolved and neutral", () => {
    for (const tone of ["neutral", "success", "info", "warning", "danger", "draft", "completed", "unsolved"]) {
      expect(BADGE_TONES[tone], tone).toBeTruthy();
      expect(html(h(Badge, { tone }, tone))).toContain(tone);
    }
  });
  it("rejects unknown tones", () => {
    expect(() => html(h(Badge, { tone: "solved" }, "x"))).toThrow(/Unknown badge tone/);
  });
});

describe("Card and Stat", () => {
  it("Card adds the shadow unless flat", () => {
    expect(html(h(Card, null, "a"))).toContain("shadow-card");
    expect(html(h(Card, { flat: true }, "a"))).not.toContain("shadow-card");
  });
  it("Stat renders label, value and hint", () => {
    const out = html(h(Stat, { label: "Rating", value: "1840", hint: "+24", trend: "up" }));
    expect(out).toContain("Rating");
    expect(out).toContain("1840");
    expect(out).toContain("text-up");
  });
});

describe("Field", () => {
  it("associates the label with the control", () => {
    const out = html(h(Field, { label: "Email", name: "email" }));
    const id = /<label for="([^"]+)"/.exec(out)[1];
    expect(out).toContain(`id="${id}"`);
  });
  it("an error sets aria-invalid, is announced, and is linked by aria-describedby", () => {
    const out = html(h(Field, { label: "Handle", name: "handle", error: "Too short", hint: "ignored" }));
    expect(out).toContain('aria-invalid="true"');
    expect(out).toContain('role="alert"');
    expect(out).toContain("Too short");
    expect(out).not.toContain("ignored");
    const msgId = /id="([^"]+-msg)"/.exec(out)[1];
    expect(out).toContain(`aria-describedby="${msgId}"`);
  });
  it("supports textarea and select, and refuses other controls", () => {
    expect(html(h(Field, { label: "Bio", as: "textarea", defaultValue: "hi" }))).toContain("<textarea");
    const select = html(h(Field, { label: "Role", as: "select" }, h("option", { value: "a" }, "A")));
    expect(select).toContain("<select");
    expect(select).toContain("<option");
    expect(() => html(h(Field, { label: "x", as: "div" }))).toThrow(TypeError);
  });
  it("uses distinct ids for separate fields", () => {
    const out = html(h("div", null, h(Field, { label: "A" }), h(Field, { label: "B" })));
    const ids = [...out.matchAll(/<input[^>]*id="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(2);
  });
});

describe("DataTable", () => {
  const columns = [
    { key: "name", header: "Name" },
    { key: "n", header: "N", align: "right", render: (r) => `#${r.n}` },
  ];
  it("renders headers with scope, rows via render, and highlights", () => {
    const rows = [{ id: "1", name: "A", n: 1 }, { id: "2", name: "B", n: 2 }];
    const out = html(h(DataTable, { columns, rows, highlight: (r) => r.id === "2", caption: "Board" }));
    expect(out).toContain('scope="col"');
    expect(out).toContain("#1");
    expect(out).toContain("Board");
    expect(out.match(/bg-highlight/g)).toHaveLength(2);
  });
  it("shows the empty message spanning all columns", () => {
    const out = html(h(DataTable, { columns, rows: [], empty: "No results" }));
    expect(out).toContain("No results");
    expect(out).toContain('colSpan="2"');
  });
});

describe("Pager", () => {
  it("pageWindow keeps first, last and a window with gaps", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(5, 5)).toEqual([1, null, 4, 5]);
    expect(pageWindow(3, 9)).toEqual([1, 2, 3, 4, null, 9]);
    expect(pageWindow(5, 9)).toEqual([1, null, 4, 5, 6, null, 9]);
  });
  it("renders nothing for a single page", () => {
    expect(html(h(Pager, { page: 1, totalPages: 1, hrefFor: () => "/" }))).toBe("");
  });
  it("marks the current page, links neighbours, and disables Previous on page 1", () => {
    const out = html(h(Pager, { page: 1, totalPages: 3, hrefFor: (p) => `/l?page=${p}` }));
    expect(out).toContain('aria-current="page"');
    expect(out).toContain('href="/l?page=2"');
    expect(out).toContain('rel="next"');
    expect(out).not.toContain('rel="prev"');
    expect(out).toContain('aria-disabled="true"');
  });
});

describe("theme", () => {
  it("defaults to dark and rejects tampered values", () => {
    expect(DEFAULT_THEME).toBe("dark");
    expect(normalizeTheme("light")).toBe("light");
    expect(normalizeTheme("dark")).toBe("dark");
    for (const v of [undefined, "", "blue", '"><script>', null]) expect(normalizeTheme(v)).toBe("dark");
  });
});
