import './globals.css';
import './globals-mobile.css';
import type { Metadata, Viewport } from 'next';
import ClientAuthProvider from '../components/ClientAuthProvider';
import { FloatingPixel } from '../components/FloatingPixel';
import { ErrorBoundary } from '@super-son1k/shared-ui';

export const metadata: Metadata = {
  title: 'Son1kvers3 - The Generator',
  description: 'Crea música profesional con IA',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'The Generator',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0A0C10',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="safe-area-top safe-area-bottom">
        <ErrorBoundary>
          <ClientAuthProvider>
            {children}
            <div className="pointer-events-none fixed inset-0 z-50">
              <div className="pointer-events-auto">
                <FloatingPixel />
              </div>
            </div>
          </ClientAuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
