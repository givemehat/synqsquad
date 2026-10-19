import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SynqSquad | Find Hackathon Teammates & Research Co-Founders",
  description:
    "The 0-friction platform to find complementary hackathon teammates, AI researchers, and project builders. Connect instantly.",
  keywords: [
    "hackathon team finder",
    "research collaborator",
    "hackathon partner",
    "find developers",
    "SIH team finder",
    "ETHGlobal partner",
    "AI research collaboration",
  ],
  openGraph: {
    title: "SynqSquad | Match & Build Winning Teams",
    description:
      "Find hackathon partners & research collaborators in 60 seconds. Zero friction, instant direct outreach.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
