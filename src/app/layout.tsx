import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9fafb" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0e12" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://synqsquad.vercel.app"),
  title: "RIVQ | Find Hackathon Teammates & Research Co-Authors",
  description:
    "The 0-friction platform to find complementary hackathon teammates and research paper collaborators. One person finds one person, and you talk directly on Gmail.",
  keywords: [
    "hackathon teammate finder",
    "research collaborator",
    "SIH 2026 team finder",
    "ETHGlobal teammate",
    "AI paper co-author",
    "NeurIPS collaborator",
  ],
  authors: [{ name: "RIVQ Team" }],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RIVQ",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "RIVQ | Match & Build Winning Teams",
    description:
      "Find hackathon partners & research collaborators. Zero noise, verified Google accounts, talk directly on Gmail.",
    type: "website",
    url: "https://synqsquad.vercel.app",
    siteName: "RIVQ",
    images: [{ url: "/og-image.png", width: 512, height: 512, alt: "RIVQ" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "RIVQ | Find Hackathon Teammates & Research Co-Authors",
    description:
      "Zero noise, verified Google accounts. One person finds one person and connects directly on Gmail.",
    images: ["/og-image.png"],
  },
  verification: {
    google: "google61d96b399c5e87d8",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)] font-sans selection:bg-blue-600 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
