import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Summoner's Grid — Pack Store",
  description: 'Tactical grid-based RPG card game. Buy packs, collect cards, build decks.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        backgroundColor: '#0a0a14',
        color: '#e0e0ee',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        minHeight: '100vh',
      }}>
        {children}
      </body>
    </html>
  );
}
