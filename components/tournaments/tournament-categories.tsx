"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

interface TournamentCategoriesProps {
  activeCategory: string
  setActiveCategory: (category: string) => void
}

export function TournamentCategories({ activeCategory, setActiveCategory }: TournamentCategoriesProps) {
  const categories = [
    { id: "all", name: "Toutes les catégories" },
    { id: "general", name: "Culture générale" },
    { id: "science", name: "Sciences" },
    { id: "history", name: "Histoire" },
    { id: "geography", name: "Géographie" },
    { id: "entertainment", name: "Divertissement" },
    { id: "sports", name: "Sport" },
    { id: "literature", name: "Littérature" },
    { id: "technology", name: "Technologie" },
    { id: "art", name: "Art et culture" },
  ]

  return (
    <div className="mb-8">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-2 pb-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              variant={activeCategory === category.id ? "default" : "outline"}
              className="rounded-full"
              size="sm"
            >
              {category.name}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
