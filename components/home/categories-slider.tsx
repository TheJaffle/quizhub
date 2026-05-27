import type { HomeQuizCategory } from "@/lib/quiz-categories";
import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type CategoriesSliderProps = {
  categories: HomeQuizCategory[];
  error?: string;
};

export function CategoriesSlider({ categories, error }: CategoriesSliderProps) {
  const featuredCategory = categories[0];
  const visibleCategories = categories.slice(featuredCategory ? 1 : 0, 13);

  return (
    <section id="categories" className="space-y-5 scroll-mt-20">
      {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 ring-1 ring-red-100">{error}</div> : null}

      {featuredCategory ? (
        <Link href={`/categories/${featuredCategory.slug}`} className="group relative block min-h-[230px] overflow-hidden rounded-2xl bg-slate-950 p-5 text-white shadow-sm sm:min-h-[280px]">
          <Image className="object-cover opacity-70 transition duration-500 group-hover:scale-105" src={featuredCategory.imageUrl || "/browse-category.png"} alt="" fill sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-slate-950/20 to-slate-950/90" />
          <div className="relative z-10 flex h-full min-h-[190px] flex-col justify-end">
            <p className="mb-2 text-sm font-bold uppercase tracking-wide text-white/80">À essayer maintenant</p>
            <h3 className="text-4xl font-black leading-none sm:text-5xl">{featuredCategory.name}</h3>
            <p className="mt-2 text-sm font-semibold text-white/85">{featuredCategory.count} quiz disponibles</p>
          </div>
        </Link>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {visibleCategories.map((category) => (
          <CategoryCard key={category.id} category={category} />
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
        <h3 className="max-w-full overflow-hidden text-balance text-[clamp(1.25rem,8vw,1.75rem)] font-black leading-tight sm:text-2xl">{category.name}</h3>
        <p className="mt-1 text-xs font-semibold text-white/80">Facile, chrono ou challenge</p>
      </div>
    </Link>
  );
}
