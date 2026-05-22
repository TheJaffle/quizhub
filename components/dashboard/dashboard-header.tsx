interface DashboardHeaderProps {
  activeTab: string;
}

export function DashboardHeader({ activeTab }: DashboardHeaderProps) {
  const getHeaderContent = () => {
    switch (activeTab) {
      case "overview":
        return {
          title: "Mes statistiques",
          description: "Retrouvez vos résultats, votre progression et votre activité.",
          actions: null,
        };
      case "my-quizzes":
        return {
          title: "Mes quiz",
          description: "Consultez vos quiz et leurs performances.",
          actions: null,
        };
      case "wallet":
        return {
          title: "Portefeuille",
          description: "Section masquée tant que brainspark reste entièrement gratuit.",
          actions: null,
        };
      case "affiliate":
        return {
          title: "Programme affilié",
          description: "Section masquée pour le moment.",
          actions: null,
        };
      case "settings":
        return {
          title: "Paramètres des statistiques",
          description: "Personnalisez votre espace.",
          actions: null,
        };
      default:
        return {
          title: "Mes statistiques",
          description: "Retrouvez vos résultats, votre progression et votre activité.",
          actions: null,
        };
    }
  };

  const content = getHeaderContent();

  return (
    <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{content.title}</h1>
        <p className="text-muted-foreground">{content.description}</p>
      </div>
      {content.actions}
    </div>
  );
}
