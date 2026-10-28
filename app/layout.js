import { cookies } from "next/headers";
import { DEFAULT_THEME, normalizeTheme, THEME_COOKIE } from "@/lib/theme.js";
import "./globals.css";

export const metadata = {
  title: "NCC DSA",
  description: "NCC DSA Platform",
};

export default async function RootLayout({ children }) {
  // Next 15: cookies() is async.
  const store = await cookies();
  const theme = normalizeTheme(store.get(THEME_COOKIE)?.value ?? DEFAULT_THEME);
  return (
    <html lang="en" data-theme={theme}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
