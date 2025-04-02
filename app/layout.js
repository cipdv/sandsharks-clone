import { Inter } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "@/components/NavbarWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Toronto Sandsharks Beach Volleyball",
  description:
    "Toronto Sandsharks is an LGBTQ+ beach volleyball league at Ashbridges Bay welcoming gay, queer, and allied players of all skill levels.",
  keywords: [
    "lgbt beach volleyball",
    "lgbtq beach volleyball in toronto",
    "lgbtq+ beach volleyball toronto",
    "gay beach volleyball toronto",
    "gay volleyball toronto",
    "queer beach volleyball in toronto",
    "2slgbtq+ beach volleyball toronto",
    "queer sports toronto",
    "lgbt sports toronto",
    "gay sports toronto",
    "gay beach volleyball at ashbridges bay toronto",
    "beach volleyball toronto",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="mt-0 mb-10">
        <NavbarWrapper />
        {children}
      </body>
    </html>
  );
}
