/**
 * Admin app — root layout.
 *
 * Notable differences from the main app's layout.tsx:
 * - metadataBase points at admin.blessingcomputers.com
 * - robots.index = false, robots.follow = false (every page)
 * - No marketing OpenGraph/Twitter card data
 * - EmergencyUnblock is mounted app-wide (incl. the login page) so locked-out
 *   staff can recover from a backend IP block (`code: IP_BLOCKED`). The fetch
 *   client dispatches `api:ip-blocked`; the login form re-dispatches it for the
 *   server-action path. TooltipProvider etc. live deeper in (staff)/layout.tsx.
 */

import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "react-hot-toast";
import { EmergencyUnblock } from "@/features/emergency-unblock";
import { Analytics } from "@vercel/analytics/next";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://admin.blessingcomputers.com"),
  title: {
    default: "Admin · Blessing Computers",
    template: "%s · Admin",
  },
  description: "Internal staff dashboard.",
  // The single most important field on this page:
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "none",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={outfit.variable} suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <EmergencyUnblock />
            <Toaster
              position="top-center"
              reverseOrder={false}
              containerStyle={{ top: 40 }}
              toastOptions={{
                duration: 4000,
                // Styled with the app's theme CSS variables (not fixed colors),
                // so toasts track light/dark automatically when `.dark` swaps the
                // tokens — no useTheme/remount needed.
                style: {
                  maxWidth: "500px",
                  background: "var(--popover)",
                  color: "var(--popover-foreground)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.75rem",
                  boxShadow: "var(--shadow-soft-lg)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                },
                success: {
                  iconTheme: {
                    primary: "var(--success)",
                    secondary: "var(--popover)",
                  },
                },
                error: {
                  iconTheme: {
                    primary: "var(--destructive)",
                    secondary: "var(--popover)",
                  },
                },
                loading: {
                  iconTheme: {
                    primary: "var(--primary)",
                    secondary: "var(--popover)",
                  },
                },
              }}
            />
          </QueryProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
