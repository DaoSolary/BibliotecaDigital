import Link from "next/link";
import { BookOpen, Search, Heart, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HomeContent } from "@/components/home/home-content";

export default function HomePage() {
  return (
    <div>
      <section className="gradient-hero py-20 md:py-28">
        <div className="container mx-auto px-4 text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto">
            Sua biblioteca digital,{" "}
            <span className="text-primary">sempre com você</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Leia milhares de livros online, salve favoritos, acompanhe seu progresso e organize suas
            listas de leitura.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button size="lg" asChild>
              <Link href="/livros">
                <Search className="mr-2 h-5 w-5" />
                Explorar catálogo
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/register">
                Criar conta grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 border-b">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: BookOpen,
                title: "Leitor integrado",
                desc: "Leia PDFs no navegador com zoom, modo escuro e progresso salvo.",
              },
              {
                icon: Heart,
                title: "Listas personalizadas",
                desc: "Organize em Quero Ler, Lendo e Finalizados.",
              },
              {
                icon: Shield,
                title: "Seguro e escalável",
                desc: "Autenticação Supabase, RLS e painel administrativo completo.",
              },
            ].map((f) => (
              <div key={f.title} className="text-center space-y-3 p-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HomeContent />
    </div>
  );
}
