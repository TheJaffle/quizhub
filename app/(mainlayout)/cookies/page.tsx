export const metadata = {
  title: "Cookies | brainspark",
  description: "Informations sur l'utilisation des cookies par brainspark.",
};

export default function CookiesPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-3xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cookies</h1>
          <p className="mt-3 text-muted-foreground">Dernière mise à jour : 17 mai 2026.</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Utilisation des cookies</h2>
          <p>brainspark peut utiliser des cookies ou technologies similaires nécessaires au fonctionnement du site, notamment pour maintenir une session, sécuriser l'accès et mémoriser certains choix techniques.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Cookies non essentiels</h2>
          <p>À ce jour, le site ne repose pas sur des cookies publicitaires ou des cookies liés à une vente en ligne. Si des cookies de mesure d'audience ou de personnalisation sont ajoutés, cette page sera mise à jour et le consentement sera demandé lorsque nécessaire.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Gestion des cookies</h2>
          <p>Vous pouvez configurer votre navigateur pour bloquer ou supprimer les cookies. Le blocage de certains cookies nécessaires peut toutefois dégrader le fonctionnement du site.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p>
            Pour toute question : <a className="text-primary underline-offset-4 hover:underline" href="mailto:b.dindelli@wildspark.fr">b.dindelli@wildspark.fr</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
