"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TournamentFiltersProps {
  activeFilter: string
  setActiveFilter: (filter: string) => void
}

export function TournamentFilters({ activeFilter, setActiveFilter }: TournamentFiltersProps) {
  return (
    <div className="flex items-center space-x-4">
      <Select value={activeFilter} onValueChange={setActiveFilter}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filtrer les tournois" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les tournois</SelectItem>
          <SelectItem value="upcoming">À venir</SelectItem>
          <SelectItem value="ongoing">En cours</SelectItem>
          <SelectItem value="completed">Terminés</SelectItem>
          <SelectItem value="registration">Inscriptions ouvertes</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
