import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { DEFAULT_THEME, normalizeTheme, THEME_COOKIE } from "@/lib/theme.js";
import "./globals.css";

const sans = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata = {
  title: "NCC_DSA",
  description: "Contest board for NCC DSA — train, contest, climb.",
};

export default async function RootLayout({ children }) {
  // Next 15: cookies() is async.
  const store = await cookies();
  const theme = normalizeTheme(store.get(THEME_COOKIE)?.value ?? DEFAULT_THEME);
  return (
    <html lang="en" data-theme={theme} className={`${sans.variable} ${mono.variable}`}>
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
