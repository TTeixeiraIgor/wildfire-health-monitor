import './globals.css';

export const metadata = {
  title: 'Wildfire Health Monitor',
  description: 'Monitoramento de queimadas com autenticacao de usuarios e dashboard operacional.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="light" data-theme="light" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
