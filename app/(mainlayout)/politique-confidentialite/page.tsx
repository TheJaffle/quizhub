export const metadata = {
  title: "Politique de confidentialité | QI-FREE",
  description: "Politique de confidentialité du site QI-FREE.",
};

export default function PolitiqueConfidentialitePage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-3xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Politique de confidentialité</h1>
          <p className="mt-3 text-muted-foreground">Dernière mise à jour : 17 mai 2026.</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Responsable du traitement</h2>
          <p>Le responsable du traitement est Wildspark, 7 Allee des Hormets, 69890 La Tour-de-Salvagny, France.</p>
          <p>
            Contact : <a className="text-primary underline-offset-4 hover:underline" href="mailto:b.dindelli@wildspark.fr">b.dindelli@wildspark.fr</a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Données pouvant être traitées</h2>
          <p>Selon votre utilisation du site, QI-FREE peut traiter des données de compte, des réponses aux quiz, des scores, des durées de passage, des préférences et des données techniques nécessaires au fonctionnement du service.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Finalités</h2>
          <p>Ces données sont utilisées pour fournir le service, afficher les quiz, enregistrer les résultats, sécuriser le site, améliorer l'expérience utilisateur et répondre aux demandes de contact.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Base légale</h2>
          <p>Les traitements reposent principalement sur l'exécution du service demandé, l'intérêt légitime de Wildspark à sécuriser et améliorer QI-FREE, et le consentement lorsque celui-ci est requis.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Durée de conservation</h2>
          <p>Les données sont conservées pendant la durée nécessaire aux finalités décrites ci-dessus, sauf obligation légale ou demande de suppression applicable.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Droits des utilisateurs</h2>
          <p>Vous pouvez demander l'accès, la rectification, l'effacement ou la limitation du traitement de vos données, ainsi que vous opposer à certains traitements lorsque la loi le permet.</p>
          <p>
            Pour exercer vos droits, contactez : <a className="text-primary underline-offset-4 hover:underline" href="mailto:b.dindelli@wildspark.fr">b.dindelli@wildspark.fr</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
