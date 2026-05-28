import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "Quiz | QuizHub",
    description: "Choisissez un niveau pour lancer le quiz.",
  };
}

export default async function QuizSlugRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  redirect(`/topics/${encodeURIComponent(slug)}`);
}
