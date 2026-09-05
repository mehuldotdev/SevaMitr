import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'SevaMitr | AI Cognitive Gaming & Memory Platform for NER',
  description:
    'Culturally inclusive, AI-powered cognitive gaming and memory assistance platform tailored for elderly dementia patients in the North Eastern Region (NER). Built for low-connectivity environments with 100% offline functionality.',
  keywords: [
    'Dementia Healthcare',
    'North Eastern Region',
    'Assam',
    'Cognitive Games',
    'Smart India Hackathon',
    'Elderly Care',
    'Offline First Healthcare',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#214935" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <AuthProvider>
          <LanguageProvider>
            <ServiceWorkerRegister />
            <Navbar />
            <main>{children}</main>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
