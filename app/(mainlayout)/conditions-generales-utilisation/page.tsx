export const metadata = {
  title: "Conditions générales d'utilisation | Free Logic Test",
  description: "Conditions générales d'utilisation du service gratuit Free Logic Test.",
};

export default function ConditionsGeneralesUtilisationPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-3xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conditions générales d'utilisation</h1>
          <p className="mt-3 text-muted-foreground">Dernière mise à jour : 17 mai 2026.</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Service gratuit</h2>
          <p>Free Logic Test est un service entièrement gratuit édité par Wildspark. Le site ne vend aucun quiz, abonnement, option payante ou contenu premium.</p>
          <p>En conséquence, aucune condition générale de vente n'est applicable à ce jour.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Accès au service</h2>
          <p>L'utilisateur peut accéder aux quiz disponibles et, le cas échéant, créer un compte afin de suivre certaines informations liées à son utilisation du service.</p>
          <p>Wildspark peut faire évoluer, suspendre ou retirer temporairement certaines fonctionnalités pour maintenance, amélioration ou sécurité.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Utilisation autorisée</h2>
          <p>L'utilisateur s'engage à utiliser Free Logic Test de manière loyale, sans perturber le fonctionnement du site, contourner ses protections ou porter atteinte aux droits de tiers.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Résultats et scores</h2>
          <p>Les résultats, scores ou indications affichés sont fournis à titre informatif et ludique. Ils ne constituent pas un diagnostic, une certification ou une évaluation professionnelle.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p>
            Pour toute question concernant le service : <a className="text-primary underline-offset-4 hover:underline" href="mailto:b.dindelli@wildspark.fr">b.dindelli@wildspark.fr</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
