import { Button } from "@/components/ui/button";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-xl bg-[url('/hero-bg.jpg')] bg-no-repeat 
      bg-cover p-5 text-white md:px-8 md:py-7 xl:px-10 xl:py-9">
      <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="max-w-lg space-y-4">
          <h2 className="text-3xl font-bold xl:leading-tight tracking-tight md:text-4xl xl:text-4xl">
            Test de logique gratuit : <br /> 50 questions, résultat instantané !
          </h2>
          <p className="text-lg text-white/80">Un parcours de raisonnement indicatif pour évaluer votre logique, votre mémoire et votre rapidité. Le résultat reste informatif et n'a pas valeur d'évaluation psychologique officielle.</p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="bg-indigo-600 text-white duration-300 hover:bg-indigo-700" asChild>
              <Link href="/iq">Je me lance !</Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl"></div>
      <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-purple-400/20 blur-3xl"></div>
    </section>
  );
}
