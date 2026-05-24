"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar, ChevronDown } from "lucide-react"

interface LeaderboardFiltersProps {
  timeFilter: string
  setTimeFilter: (filter: string) => void
  categoryFilter: string
  setCategoryFilter: (filter: string) => void
}

export function LeaderboardFilters({
  timeFilter,
  setTimeFilter,
  categoryFilter,
  setCategoryFilter,
}: LeaderboardFiltersProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={timeFilter === "all-time" ? "default" : "outline"}
          size="sm"
          onClick={() => setTimeFilter("all-time")}
        >
          Tout le temps
        </Button>
        <Button
          variant={timeFilter === "monthly" ? "default" : "outline"}
          size="sm"
          onClick={() => setTimeFilter("monthly")}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Mensuel
        </Button>
        <Button
          variant={timeFilter === "weekly" ? "default" : "outline"}
          size="sm"
          onClick={() => setTimeFilter("weekly")}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Hebdomadaire
        </Button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            {categoryFilter === "all" ? "Toutes les catégories" : categoryFilter}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setCategoryFilter("all")}>Toutes les catégories</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCategoryFilter("Sciences")}>Sciences</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCategoryFilter("Histoire")}>Histoire</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCategoryFilter("Mathématiques")}>Mathématiques</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCategoryFilter("Littérature")}>Littérature</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCategoryFilter("Sport")}>Sport</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
