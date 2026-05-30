import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";

const rubik = Rubik({
  subsets: ["latin", "hebrew"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-rubik",
  display: "swap",
});

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
    <html lang="en" className={rubik.variable}>
      <body>
        {children}
        <footer
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: "0.7rem",
            color: "rgba(120, 53, 15, 0.45)",
            padding: "3px 0 5px",
            pointerEvents: "none",
            zIndex: 1000,
            direction: "ltr",
            letterSpacing: "0.3px",
          }}
        >
          © {new Date().getFullYear()} Daffy Nudel
        </footer>
      </body>
    </html>
  );
}
