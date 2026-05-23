import type { HomeQuizCategory } from "@/lib/quiz-categories";
import { ArrowRight, Clock3, Flame, Grid2X2, Search, Sparkles, Trophy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type CategoriesSliderProps = {
  categories: HomeQuizCategory[];
  error?: string;
};

const categoryHints = [
  "Culture générale",
  "Animaux",
  "Géographie",
  "Cinéma",
  "Musique",
  "Sport",
  "Histoire",
  "Sciences",
];

const playModes = [
  { label: "Facile", href: "/categories", icon: Sparkles, tone: "bg-emerald-100 text-emerald-700" },
  { label: "Chrono", href: "/daily-challenge", icon: Clock3, tone: "bg-amber-100 text-amber-700" },
  { label: "Challenge", href: "/battle", icon: Flame, tone: "bg-[#ffe0ec] text-[#E91663]" },
  { label: "Concours", href: "/tournaments", icon: Trophy, tone: "bg-indigo-100 text-indigo-700" },
];

export function CategoriesSlider({ categories, error }: CategoriesSliderProps) {
  const featuredCategory = categories[0];
  const visibleCategories = categories.slice(featuredCategory ? 1 : 0, 13);

  return (
    <section id="categories" className="space-y-5 scroll-mt-20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#ffe0ec] px-3 py-1 text-sm font-bold text-[#E91663]">
            <Grid2X2 className="h-4 w-4" />
            Catégories
          </div>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Choisissez votre terrain de jeu</h2>
          <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">Trouvez vite un thème, choisissez un niveau, puis transformez votre score en défi à partager.</p>
        </div>
        <Link href="/categories" className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-[#E91663]">
          Toutes les catégories
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {playModes.map(({ label, href, icon: Icon, tone }) => (
          <Link key={label} href={href} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone}`}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-sm font-black text-slate-950">{label}</span>
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto pb-1 scrollbar-hide">
        <div className="flex min-w-max gap-2">
          {categoryHints.map((hint) => (
            <Link key={hint} href={`/search?q=${encodeURIComponent(hint)}`} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-[#ffe0ec] hover:text-[#E91663]">
              {hint}
            </Link>
          ))}
        </div>
      </div>

      {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 ring-1 ring-red-100">{error}</div> : null}

      {featuredCategory ? (
        <Link href={`/categories/${featuredCategory.slug}`} className="group relative block min-h-[230px] overflow-hidden rounded-2xl bg-slate-950 p-5 text-white shadow-sm sm:min-h-[280px] lg:hidden">
          <Image className="object-cover opacity-70 transition duration-500 group-hover:scale-105" src={featuredCategory.imageUrl || "/browse-category.png"} alt="" fill sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-slate-950/20 to-slate-950/90" />
          <div className="relative z-10 flex h-full min-h-[190px] flex-col justify-end">
            <p className="mb-2 text-sm font-bold uppercase tracking-wide text-white/80">À essayer maintenant</p>
            <h3 className="text-4xl font-black leading-none">{featuredCategory.name}</h3>
            <p className="mt-2 text-sm font-semibold text-white/85">{featuredCategory.count} quiz disponibles</p>
          </div>
        </Link>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {featuredCategory ? <CategoryCard category={featuredCategory} featured className="hidden lg:block" /> : null}
        {visibleCategories.map((category, index) => (
          <CategoryCard key={category.id} category={category} featured={index === 2 || index === 7} />
        ))}
      </div>
    </section>
  );
}

function CategoryCard({ category, featured = false, className = "" }: { category: HomeQuizCategory; featured?: boolean; className?: string }) {
  return (
    <Link href={`/categories/${category.slug}`} className={`group relative min-h-[172px] overflow-hidden rounded-2xl bg-slate-950 p-4 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${featured ? "sm:col-span-2 sm:min-h-[220px]" : ""} ${className}`}>
      <Image className="object-cover opacity-75 transition duration-500 group-hover:scale-105" src={category.imageUrl || "/browse-category.png"} alt="" fill sizes={featured ? "(max-width: 640px) 50vw, 520px" : "(max-width: 640px) 50vw, 320px"} />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/5 via-slate-950/25 to-slate-950/90" />
      <div className="relative z-10 flex h-full min-h-[140px] flex-col justify-end">
        <div className="mb-3 flex w-fit items-center gap-2 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
          <Search className="h-3.5 w-3.5" />
          {category.count} quiz
        </div>
        <h3 className={`${featured ? "text-3xl" : "text-xl"} max-w-full text-balance font-black leading-tight`}>{category.name}</h3>
        <p className="mt-1 text-xs font-semibold text-white/80">Facile, chrono ou challenge</p>
      </div>
    </Link>
  );
}
