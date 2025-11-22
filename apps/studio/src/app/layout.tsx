import type { Metadata } from 'next'
import Header from '@/components/globals/header';
import Footer from '@/components/globals/footer';
import "./globals.css";
 
export const metadata: Metadata = {
  title: {
    template: '%s | Becker\'s photography',
    default: 'Becker\'s photography',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
