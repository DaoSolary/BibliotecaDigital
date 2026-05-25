import Link from "next/link";
import { BookOpen } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <BookOpen className="h-6 w-6 text-primary" />
              KIMA - A sua Biblioteca Digital
            </Link>
            <p className="text-sm text-muted-foreground">
              Plataforma moderna de leitura digital. Acesse milhares de livros de qualquer lugar.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Explorar</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/livros" className="hover:text-foreground">Catálogo</Link></li>
              <li><Link href="/livros?featured=true" className="hover:text-foreground">Destaques</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Conta</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/auth/login" className="hover:text-foreground">Entrar</Link></li>
              <li><Link href="/auth/register" className="hover:text-foreground">Criar conta</Link></li>
              <li><Link href="/perfil" className="hover:text-foreground">Meu perfil</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Recursos</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Leitor PDF integrado</li>
              <li>Listas personalizadas</li>
              <li>Progresso de leitura</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} ADSU - TEC. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
