import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Texto em Dados | Mineração de Texto e PLN",
  description:
    "Aprenda mineração de texto e processamento de linguagem natural com experimentos didáticos e leitura crítica de informação.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
