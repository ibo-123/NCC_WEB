import { cookies } from "next/headers";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { DEFAULT_THEME, normalizeTheme, THEME_COOKIE } from "@/lib/theme.js";
import { PlatformProvider } from "@/components/providers/PlatformProvider.js";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata = {
  title: "NCC_DSA Platform",
  description: "Individual practice and Group competition on one platform.",
  openGraph: {
    title: "NCC_DSA Platform",
    description: "Individual practice and Group competition on one platform.",
  },
};

export default async function RootLayout({ children }) {
  // Next 15: cookies() is async.
  const store = await cookies();
  const theme = normalizeTheme(store.get(THEME_COOKIE)?.value ?? DEFAULT_THEME);
  return (
    <html lang="en" data-theme={theme} className={`${jakarta.variable} ${jetbrains.variable}`}>
      <body className="antialiased">
        <PlatformProvider>{children}</PlatformProvider>
      </body>
    </html>
  );
}
