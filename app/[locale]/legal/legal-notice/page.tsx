export default function LegalNoticePage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Mentions Légales
        </h1>
        
        <div className="prose prose-slate max-w-none text-muted-foreground dark:prose-invert">
          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">1. Éditeur du site</h2>
          <p className="mb-4">
            Le site <strong>TraceLink</strong> est édité par :
          </p>
          <div className="bg-muted p-4 rounded-lg mb-4">
            <p className="mb-2"><strong>Raison sociale :</strong> TraceLink</p>
            <p className="mb-2"><strong>Forme juridique :</strong> Société par Actions Simplifiée (SAS)</p>
            <p className="mb-2"><strong>Siège social :</strong> [Adresse à compléter]</p>
            <p className="mb-2"><strong>SIRET :</strong> [Numéro SIRET à compléter]</p>
            <p className="mb-2"><strong>RCS :</strong> [Numéro RCS à compléter]</p>
            <p className="mb-2"><strong>Email :</strong> contact@tracelink.com</p>
            <p className="mb-2"><strong>Directeur de publication :</strong> [Nom à compléter]</p>
          </div>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">2. Hébergement</h2>
          <p className="mb-4">
            Le site est hébergé par :
          </p>
          <div className="bg-muted p-4 rounded-lg mb-4">
            <p className="mb-2"><strong>Hébergeur :</strong> Vercel Inc.</p>
            <p className="mb-2"><strong>Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis</p>
            <p className="mb-2"><strong>Site web :</strong> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://vercel.com</a></p>
          </div>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. Protection des données</h2>
          <p className="mb-4">
            Conformément à la loi « Informatique et Libertés » du 6 janvier 1978 modifiée et au Règlement Général sur la Protection des Données (RGPD), vous disposez d&apos;un droit d&apos;accès, de rectification, de suppression et d&apos;opposition aux données personnelles vous concernant.
          </p>
          <p className="mb-4">
            Pour exercer ces droits, vous pouvez nous contacter à l&apos;adresse : contact@tracelink.com
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">4. Propriété intellectuelle</h2>
          <p className="mb-4">
            L&apos;ensemble de ce site relève de la législation française et internationale sur le droit d&apos;auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
          </p>
          <p className="mb-4">
            La reproduction de tout ou partie de ce site sur un support électronique quel qu&apos;il soit est formellement interdite sauf autorisation expresse de l&apos;éditeur.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">5. Responsabilité</h2>
          <p className="mb-4">
            Les informations contenues sur ce site sont aussi précises que possible et le site est périodiquement remis à jour, mais peut toutefois contenir des inexactitudes, des omissions ou des lacunes.
          </p>
          <p className="mb-4">
            Si vous constatez une lacune, erreur ou ce qui parait être un dysfonctionnement, merci de bien vouloir le signaler par email à contact@tracelink.com, en décrivant le problème de la façon la plus précise possible.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">6. Liens hypertextes</h2>
          <p className="mb-4">
            Le site peut contenir des liens hypertextes vers d&apos;autres sites présents sur le réseau Internet. Les liens vers ces autres ressources vous font quitter le site TraceLink.
          </p>
          <p className="mb-4">
            Il est possible de créer un lien vers la page de présentation de ce site sans autorisation expresse de l&apos;éditeur. Aucune autorisation ni demande d&apos;information préalable ne peut être exigée par l&apos;éditeur à l&apos;égard d&apos;un site qui souhaite établir un lien vers le site de l&apos;éditeur.
          </p>
        </div>
      </div>
    </div>
  );
}

