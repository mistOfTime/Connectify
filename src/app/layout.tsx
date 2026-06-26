
import type {Metadata} from 'next';
import './globals.css';
import { ConditionalSidebar } from '@/components/layout/ConditionalSidebar';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';

export const metadata: Metadata = {
  title: 'Connectify | Instant Random Chat',
  description: 'Connect with strangers instantly via text or video on the world\'s most modern random chat platform.',
  openGraph: {
    title: 'Connectify | Instant Random Chat',
    description: 'Connect with strangers instantly via text or video chat. Meet new people from around the world.',
    siteName: 'Connectify',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Connectify | Instant Random Chat',
    description: 'Connect with strangers instantly via text or video chat.',
  },
  icons: {
    icon: [{ url: '/favicon.svg?v=4', type: 'image/svg+xml' }],
    shortcut: '/favicon.svg?v=4',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=4" />
        <link rel="shortcut icon" type="image/svg+xml" href="/favicon.svg?v=4" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&family=Inter:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-full bg-background text-foreground overflow-hidden">
        <FirebaseClientProvider>
          <ConditionalSidebar>
            {children}
          </ConditionalSidebar>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
