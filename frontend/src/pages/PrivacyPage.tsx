/**
 * Page Politique de confidentialité.
 * Contenu à compléter avec un texte juridique rédigé par un professionnel.
 */
export default function PrivacyPage() {
  return (
    <div className="container-app max-w-3xl mx-auto py-12 space-y-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
        Politique de confidentialité
      </h1>

      <p className="text-xs text-slate-400">Dernière mise à jour : à définir</p>

      <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 space-y-4">
        <section aria-labelledby="privacy-collecte">
          <h2 id="privacy-collecte" className="text-sm font-semibold text-slate-900 dark:text-white mt-6 mb-2">
            1. Données collectées
          </h2>
          <p>
            MyHome collecte les données personnelles que vous fournissez lors de votre inscription
            (nom, prénom, adresse e-mail) et lors de l'utilisation de nos services (annonces consultées,
            candidatures envoyées, créneaux réservés).
          </p>
        </section>

        <section aria-labelledby="privacy-usage">
          <h2 id="privacy-usage" className="text-sm font-semibold text-slate-900 dark:text-white mt-6 mb-2">
            2. Utilisation des données
          </h2>
          <p>
            Ces données sont utilisées pour vous permettre d'accéder aux services de la plateforme,
            de transmettre vos candidatures aux propriétaires et de réserver des créneaux de visite.
            Elles ne sont pas revendues à des tiers.
          </p>
        </section>

        <section aria-labelledby="privacy-droits">
          <h2 id="privacy-droits" className="text-sm font-semibold text-slate-900 dark:text-white mt-6 mb-2">
            3. Vos droits
          </h2>
          <p>
            Conformément au Règlement général sur la protection des données (RGPD), vous disposez
            d'un droit d'accès, de rectification, d'effacement et de portabilité de vos données.
            Pour exercer ces droits, contactez-nous à : <span className="text-slate-700 dark:text-slate-300">contact@myhome.fr</span>
          </p>
        </section>

        <section aria-labelledby="privacy-cookies">
          <h2 id="privacy-cookies" className="text-sm font-semibold text-slate-900 dark:text-white mt-6 mb-2">
            4. Cookies
          </h2>
          <p>
            Nous utilisons uniquement des cookies fonctionnels nécessaires au bon fonctionnement
            du site (session, préférences de thème). Aucun cookie publicitaire ou de traçage tiers
            n'est utilisé.
          </p>
        </section>

        <p className="text-xs text-slate-400 mt-8 pt-4 border-t border-slate-100 dark:border-dark-border">
          Ce document sera complété par un texte juridique définitif rédigé par un professionnel
          avant la mise en ligne de la plateforme.
        </p>
      </div>
    </div>
  )
}
