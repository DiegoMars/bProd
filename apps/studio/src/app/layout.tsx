import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | Studio',
    default: 'Studio',
  },
  description: "Admin studio"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-text">
        <header className="border-b border-white/10 bg-[color:var(--color-background)]">
          <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-primary">Studio</h1>
            <nav className="flex gap-4">
              <a className="hover:text-secondary" href="/collections">Collections</a>
              <a className="hover:text-secondary" href="/settings">Settings</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
