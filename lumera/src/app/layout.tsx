import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BRAND } from "@/lib/brand";
import SmoothScroll from "@/components/motion/SmoothScroll";
import { EnquiryProvider } from "@/components/enquiry/EnquiryProvider";
import { SoundProvider } from "@/components/system/SoundProvider";
import EnquiryDrawer from "@/components/enquiry/EnquiryDrawer";
import Header from "@/components/layout/Header";
import CustomCursor from "@/components/layout/CustomCursor";
import WhatsAppConcierge from "@/components/layout/WhatsAppConcierge";

const description =
  "A private diamond house in Dubai. Natural and lab-grown diamonds, high jewellery and bespoke commissions — by appointment.";

export const metadata: Metadata = {
  metadataBase: new URL("https://lumera.example"),
  title: {
    default: `${BRAND.name} — Private Diamonds & High Jewellery · Dubai`,
    template: `%s · ${BRAND.name}`,
  },
  description,
  keywords: [
    "Dubai diamonds",
    "high jewellery",
    "private diamond house",
    "lab grown diamonds Dubai",
    "tennis bracelet",
    "bespoke jewellery",
  ],
  openGraph: {
    title: `${BRAND.name} · Dubai`,
    description,
    type: "website",
    locale: "en_AE",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="grain antialiased">
        <SoundProvider>
          <EnquiryProvider>
            <SmoothScroll>
              <CustomCursor />
              <Header />
              <main>{children}</main>
              <EnquiryDrawer />
              <WhatsAppConcierge />
              <div className="vault-vignette" />
            </SmoothScroll>
          </EnquiryProvider>
        </SoundProvider>
      </body>
    </html>
  );
}
