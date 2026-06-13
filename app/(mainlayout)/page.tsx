import { CategoriesHowItWorks } from "@/components/categories/categories-how-it-works";
import { CategoriesSlider } from "@/components/home/categories-slider";
import { HeroSection } from "@/components/home/hero-section";
import { LatestQuizzes } from "@/components/home/latest-quizzes";
import { LiveWinners } from "@/components/home/live-winners";
import { NewsletterSection } from "@/components/home/newsletter-section";
import { PlayerTestimonials } from "@/components/home/player-testimonials";
import { QuizzesByDifficulty } from "@/components/home/quizzes-by-difficulty";
import { ResourcesAndReferral } from "@/components/home/resources-and-referral";
import { TopAveragePlayers } from "@/components/home/top-average-players";
import { TopPlayersCarousel } from "@/components/home/top-players-carousel";
import { Footer } from "@/components/layout/footer";
import { getHomeQuizCategories } from "@/lib/quiz-categories";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Free Logic Test | Quiz, défis et classements",
  description: "Choisissez une catégorie, jouez aux quiz, suivez vos scores et défiez vos amis sur Free Logic Test.",
};

const SHOW_HERO = true;
const SHOW_CATEGORIES_SLIDER = true;
const SHOW_LATEST_QUIZZES = true;
const SHOW_TOP_AVERAGE_PLAYERS = true;
const SHOW_FEATURED_QUIZZES = false;
const SHOW_TOP_PLAYERS = false;
const SHOW_QUIZZES_BY_DIFFICULTY = false;
const SHOW_LIVE_WINNERS = false;
const SHOW_CATEGORIES_HOW_IT_WORKS = false;
const SHOW_PLAYER_TESTIMONIALS = false;
const SHOW_RESOURCES_AND_REFERRAL = false;
const SHOW_NEWSLETTER_SECTION = false;

export default async function Home() {
  const [{ categories, error }] = await Promise.all([
    SHOW_CATEGORIES_SLIDER ? getHomeQuizCategories() : Promise.resolve({ categories: [], error: undefined }),
  ]);

  return (
    <div className="-m-3 space-y-5 bg-slate-50 p-3 pb-28 md:-m-4 md:space-y-8 md:p-4 md:pb-8 xxl:-m-6 xxl:p-6">
      {SHOW_HERO ? <HeroSection categories={categories} /> : null}
      {SHOW_CATEGORIES_SLIDER ? <CategoriesSlider categories={categories} error={error} /> : null}
      {SHOW_LATEST_QUIZZES ? <LatestQuizzes /> : null}
      {SHOW_TOP_AVERAGE_PLAYERS ? <TopAveragePlayers /> : null}
      {SHOW_TOP_PLAYERS ? <TopPlayersCarousel /> : null}
      {SHOW_QUIZZES_BY_DIFFICULTY ? <QuizzesByDifficulty /> : null}
      {SHOW_LIVE_WINNERS ? <LiveWinners /> : null}
      {SHOW_CATEGORIES_HOW_IT_WORKS ? <CategoriesHowItWorks /> : null}
      {SHOW_PLAYER_TESTIMONIALS ? <PlayerTestimonials /> : null}
      {SHOW_RESOURCES_AND_REFERRAL ? <ResourcesAndReferral /> : null}
      {SHOW_NEWSLETTER_SECTION ? <NewsletterSection /> : null}
      <Footer />
    </div>
  );
}
