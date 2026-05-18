import { CategoriesHowItWorks } from "@/components/categories/categories-how-it-works";
import { CategoriesSlider } from "@/components/home/categories-slider";
import { FeaturedQuizzes } from "@/components/home/featured-quizzes";
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
import { getRecentQuizPerformanceCards } from "@/lib/quizzes";
import "swiper/swiper-bundle.css";

export const dynamic = "force-dynamic";

const SHOW_HERO = true;
const SHOW_CATEGORIES_SLIDER = true;
const SHOW_LATEST_QUIZZES = true;
const SHOW_TOP_AVERAGE_PLAYERS = true;
const SHOW_FEATURED_QUIZZES = true;
const SHOW_TOP_PLAYERS = false;
const SHOW_QUIZZES_BY_DIFFICULTY = false;
const SHOW_LIVE_WINNERS = false;
const SHOW_CATEGORIES_HOW_IT_WORKS = false;
const SHOW_PLAYER_TESTIMONIALS = false;
const SHOW_RESOURCES_AND_REFERRAL = false;
const SHOW_NEWSLETTER_SECTION = false;

export default async function Home() {
  const [{ categories, error }, { quizzes: recentPerformanceQuizzes }] = await Promise.all([
    SHOW_CATEGORIES_SLIDER ? getHomeQuizCategories() : Promise.resolve({ categories: [], error: undefined }),
    SHOW_FEATURED_QUIZZES ? getRecentQuizPerformanceCards() : Promise.resolve({ quizzes: [] }),
  ]);

  return (
    <div className="space-y-4 xl:space-y-8 pb-8">
      {SHOW_HERO ? <HeroSection /> : null}
      {SHOW_CATEGORIES_SLIDER ? <CategoriesSlider categories={categories} error={error} /> : null}
      {SHOW_LATEST_QUIZZES ? <LatestQuizzes /> : null}
      {SHOW_TOP_AVERAGE_PLAYERS ? <TopAveragePlayers /> : null}
      {SHOW_FEATURED_QUIZZES ? <FeaturedQuizzes quizzes={recentPerformanceQuizzes} /> : null}
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
