export const metadata = {
  title: "Mentions légales | brainspark",
  description: "Mentions légales du site brainspark édité par Wildspark.",
};

export default function MentionsLegalesPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-3xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mentions légales</h1>
          <p className="mt-3 text-muted-foreground">Dernière mise à jour : 17 mai 2026.</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Éditeur du site</h2>
          <p>Le site brainspark est édité par la société Wildspark.</p>
          <p>Adresse : 7 Allee des Hormets, 69890 La Tour-de-Salvagny, France.</p>
          <p>
            Contact : <a className="text-primary underline-offset-4 hover:underline" href="mailto:b.dindelli@wildspark.fr">b.dindelli@wildspark.fr</a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Objet du site</h2>
          <p>brainspark propose des quiz et tests gratuits. Aucun achat, abonnement payant, lot financier ou paiement en ligne n'est proposé sur le site.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Hébergement</h2>
          <p>Les informations relatives à l'hébergeur seront complétées selon l'environnement de mise en production retenu.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Propriété intellectuelle</h2>
          <p>Les contenus, textes, interfaces, éléments graphiques et développements du site sont protégés. Toute reproduction non autorisée est interdite.</p>
        </section>
      </div>
    </main>
  );
}
