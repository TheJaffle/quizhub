"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { ArrowRight, CalendarDays, Clock, Trophy, Users } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface TournamentListProps {
  activeCategory: string;
  activeFilter: string;
}

export function TournamentList({ activeCategory, activeFilter }: TournamentListProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  // Mock tournament data - in a real app, this would come from an API
  const tournaments = [
    {
      id: "science-showdown",
      title: "Duel de sciences",
      description: "Testez vos connaissances en physique, chimie, biologie et plus encore.",
      image: "/space-exploration-quiz.png", // Fixed image path to use an existing image
      category: "science",
      status: "registration",
      dates: "1 juin - 15 juin 2023",
      participants: 342,
      prize: "$1,000",
      registrationEnds: "2 jours",
      difficulty: "Moyen",
    },
    {
      id: "history-heroes",
      title: "Héros de l’histoire",
      description: "Voyagez dans le temps et testez vos connaissances sur les événements et personnages historiques.",
      image: "/ancient-civilizations-quiz.png", // Using existing history quiz image
      category: "history",
      status: "upcoming",
      dates: "5 juin - 20 juin 2023",
      participants: 215,
      prize: "$750",
      registrationEnds: "5 jours",
      difficulty: "Difficile",
    },
    {
      id: "pop-culture-party",
      title: "Pop culture party",
      description: "Du cinéma à la musique, testez votre culture divertissement.",
      image: "/space-exploration-quiz.png", // Using existing entertainment quiz image
      category: "entertainment",
      status: "ongoing",
      dates: "20 mai - 5 juin 2023",
      participants: 567,
      prize: "$1,500",
      registrationEnds: "Fermé",
      difficulty: "Facile",
    },
    {
      id: "geography-genius",
      title: "Génie de la géographie",
      description: "Explorez pays, capitales, monuments et merveilles géographiques.",
      image: "/world-map-quiz.png", // Using existing geography quiz image
      category: "geography",
      status: "upcoming",
      dates: "10 juin - 25 juin 2023",
      participants: 189,
      prize: "$800",
      registrationEnds: "8 jours",
      difficulty: "Moyen",
    },
    {
      id: "sports-spectacular",
      title: "Grand quiz sport",
      description: "Du football aux Jeux olympiques, testez vos connaissances sportives.",
      image: "/sports-trivia-quiz.png", // Using existing sports quiz image
      category: "sports",
      status: "registration",
      dates: "15 juin - 1 juillet 2023",
      participants: 412,
      prize: "$1,200",
      registrationEnds: "10 jours",
      difficulty: "Moyen",
    },
    {
      id: "tech-titans",
      title: "Titans de la tech",
      description: "Répondez à des questions sur la technologie, le code et l’innovation numérique.",
      image: "/technology-quiz.png", // Using existing technology quiz image
      category: "technology",
      status: "completed",
      dates: "1 mai - 15 mai 2023",
      participants: 623,
      prize: "$2,000",
      registrationEnds: "Fermé",
      difficulty: "Difficile",
    },
  ];

  // Filter tournaments based on active category and filter
  const filteredTournaments = tournaments.filter((tournament) => {
    const categoryMatch = activeCategory === "all" || tournament.category === activeCategory;
    const filterMatch = activeFilter === "all" || tournament.status === activeFilter;
    return categoryMatch && filterMatch;
  });

  // Status badge color mapping
  const statusColors: Record<string, string> = {
    registration: "bg-green-500 hover:bg-green-600",
    upcoming: "bg-blue-500 hover:bg-blue-600",
    ongoing: "bg-amber-500 hover:bg-amber-600",
    completed: "bg-gray-500 hover:bg-gray-600",
  };

  // Status text mapping
  const statusText: Record<string, string> = {
    registration: "Inscriptions ouvertes",
    upcoming: "À venir",
    ongoing: "En cours",
    completed: "Terminé",
  };

  return (
    <div>
      {filteredTournaments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🏆</div>
          <h3 className="text-xl font-medium mb-2">Aucun tournoi trouvé</h3>
          <p className="text-muted-foreground">Essayez de modifier la catégorie ou le filtre</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTournaments.map((tournament) => (
            <Card key={tournament.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative h-48">
                <Image src={tournament.image || "/placeholder.svg?height=200&width=400&text=Tournament+Image"} alt={tournament.title} fill className="object-cover" />
                <div className="absolute top-2 right-2">
                  <Badge className={`${statusColors[tournament.status]} text-white`}>{statusText[tournament.status]}</Badge>
                </div>
                <div className="absolute bottom-2 left-2">
                  <Badge variant="outline" className="bg-black/50 text-white border-0">
                    {tournament.difficulty}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4 xl:pt-6">
                <h3 className="text-xl font-bold mb-2">{tournament.title}</h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{tournament.description}</p>

                <div className="flex flex-wrap gap-y-2 gap-x-4 mb-4 text-sm">
                  <div className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span>{tournament.dates}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{tournament.participants} participants</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    <span>{tournament.prize} de récompense</span>
                  </div>
                </div>

                {tournament.status !== "completed" && (
                  <div className="flex justify-between items-center">
                    {tournament.status === "registration" && (
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-1 text-amber-500" />
                        <span>Ferme dans {tournament.registrationEnds}</span>
                      </div>
                    )}
                    <Button onClick={() => router.push(`/tournaments/${tournament.id}`)} className="ml-auto" size="sm">
                      Voir le détail <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                )}

                {tournament.status === "completed" && (
                  <Button onClick={() => router.push(`/tournaments/${tournament.id}`)} variant="outline" className="w-full" size="sm">
                    Voir les résultats <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredTournaments.length > 0 && (
        <div className="mt-8 flex justify-center">
          <Pagination currentPage={currentPage} totalPages={3} onChange={setCurrentPage} />
        </div>
      )}
    </div>
  );
}
