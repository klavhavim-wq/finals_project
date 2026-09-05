import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import SiteFooter from "@/components/SiteFooter";
import "./globals.css";

const rubik = Rubik({
  subsets: ["latin", "hebrew"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-rubik",
  display: "swap",
});

// The game is a bright, light game — tell the browser so its "force dark" mode
// doesn't darken and muddy the board colours.
export const viewport: Viewport = {
  colorScheme: "light",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Dogylishios",
  description: "A math board game where you help the dog collect pellets.",
  openGraph: {
    title: "Dogylishios",
    description: "A math board game where you help the dog collect pellets.",
    images: [{ url: "/logo.jpg" }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Dogylishios",
    description: "A math board game where you help the dog collect pellets.",
    images: ["/logo.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={rubik.variable} style={{ colorScheme: "light" }}>
      <body>
        {children}
        <SiteFooter year={new Date().getFullYear()} />
      </body>
    </html>
  );
}
