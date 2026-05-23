import { Button } from "@/components/ui/button";
import type { HomeQuizCategory } from "@/lib/quiz-categories";
import { ArrowRight, Clock3, Swords, Trophy, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type HeroSectionProps = {
  categories?: HomeQuizCategory[];
};

export function HeroSection({ categories = [] }: HeroSectionProps) {
  const heroCategory = categories[0];

  return (
    <section id="top" className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative min-h-[330px] overflow-hidden bg-slate-950 p-5 text-white sm:p-8 lg:min-h-[470px] lg:p-10">
          <Image src={heroCategory?.imageUrl || "/placeholder.svg"} alt="" fill priority sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/15 via-slate-950/40 to-slate-950/90" />
          <div className="relative z-10 flex h-full max-w-xl flex-col justify-end gap-5">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#E91663] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
              <Trophy className="h-4 w-4" />
              Quiz, défis et classements
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-black leading-[0.98] tracking-tight sm:text-5xl lg:text-6xl">Trouvez votre prochain défi.</h1>
              <p className="max-w-md text-base font-medium leading-7 text-white/90 sm:text-lg">Choisissez une catégorie, jouez en quelques minutes, comparez votre score et envoyez le défi à vos amis.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="h-12 rounded-full bg-[#E91663] px-6 text-base font-bold text-white hover:bg-[#c90f50]" asChild>
                <Link href="#categories">
                  Voir les catégories
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 rounded-full border-white/35 bg-white/15 px-6 text-base font-bold text-white backdrop-blur hover:bg-white/25 hover:text-white" asChild>
                <Link href="/daily-challenge">Défi du jour</Link>
              </Button>
            </div>
            {heroCategory ? <p className="text-sm font-bold text-white/75">Catégorie mise en avant : {heroCategory.name}</p> : null}
          </div>
        </div>

        <div id="challenges" className="bg-[#fff7fb] p-5 sm:p-8 lg:p-10">
          <div className="mb-6">
            <p className="text-sm font-bold uppercase tracking-wide text-[#E91663]">Boucle de jeu</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Jouez, progressez, défiez.</h2>
          </div>

          <div className="grid gap-3">
            <Link href="/daily-challenge" className="group flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E91663] text-white">
                <Clock3 className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-black text-slate-950">Défi rapide</span>
                <span className="block text-sm leading-6 text-slate-600">Une partie courte pour jouer tout de suite.</span>
              </span>
              <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#E91663]" />
            </Link>

            <Link href="/battle" className="group flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Swords className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-black text-slate-950">Défier un ami</span>
                <span className="block text-sm leading-6 text-slate-600">Partagez un score et lancez une revanche.</span>
              </span>
              <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#E91663]" />
            </Link>

            <Link href="/leaderboard" className="group flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-400 text-slate-950">
                <Users className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-black text-slate-950">Classements</span>
                <span className="block text-sm leading-6 text-slate-600">Suivez les meilleurs joueurs de la semaine.</span>
              </span>
              <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#E91663]" />
            </Link>
          </div>

          <div className="mt-6 rounded-xl bg-[#E91663] p-5 text-white shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-white/80">Objectif</p>
            <p className="mt-2 text-2xl font-black leading-tight">Un score, un lien, une revanche.</p>
            <p className="mt-2 text-sm leading-6 text-white/90">Le plus important : rendre chaque quiz facile à partager et donner envie de revenir.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
