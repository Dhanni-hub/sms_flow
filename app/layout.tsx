import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/lib/fonts";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { ToastProvider } from "@/components/shared/toast-provider";
import { NetworkStatusBanner } from "@/components/shared/network-status-banner";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import "./global.css";

export const metadata: Metadata = {
  title: {
    default: "SMSFlow - Send SMS. No SIM. No Airtime.",
    template: "%s | SMSFlow",
  },
  description:
    "Send SMS to any Nigerian number straight from your phone or computer. No SIM card, no airtime - just fund your wallet and send.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SMSFlow",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0d" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontVariables} font-sans antialiased`}>
        <ThemeProvider>
          <ToastProvider>
            <NetworkStatusBanner />
            <ServiceWorkerRegister />
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
