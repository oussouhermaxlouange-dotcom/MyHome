/**
 * Page Conditions Générales d'Utilisation.
 * Contenu à compléter avec un texte juridique rédigé par un professionnel.
 */
export default function CguPage() {
  return (
    <div className="container-app max-w-3xl mx-auto py-12 space-y-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
        Conditions générales d'utilisation
      </h1>

      <p className="text-xs text-slate-400">Dernière mise à jour : à définir</p>

      <div className="text-slate-600 dark:text-slate-400 space-y-4 text-sm leading-relaxed">
        <section aria-labelledby="cgu-objet">
          <h2 id="cgu-objet" className="text-sm font-semibold text-slate-900 dark:text-white mt-6 mb-2">
            1. Objet
          </h2>
          <p>
            MyHome est une plateforme de mise en relation entre des personnes cherchant un logement
            à louer (locataires) et des propriétaires ou agences souhaitant proposer des biens à la location.
            MyHome n'est pas partie au contrat de bail conclu entre locataire et propriétaire.
          </p>
        </section>

        <section aria-labelledby="cgu-compte">
          <h2 id="cgu-compte" className="text-sm font-semibold text-slate-900 dark:text-white mt-6 mb-2">
            2. Création de compte
          </h2>
          <p>
            L'accès à certaines fonctionnalités (dépôt d'annonce, candidature, réservation de créneau)
            nécessite la création d'un compte. Vous êtes responsable de la confidentialité de vos
            identifiants de connexion.
          </p>
        </section>

        <section aria-labelledby="cgu-annonces">
          <h2 id="cgu-annonces" className="text-sm font-semibold text-slate-900 dark:text-white mt-6 mb-2">
            3. Annonces
          </h2>
          <p>
            Les annonces publiées doivent correspondre à des biens réels disponibles à la location.
            Toute annonce frauduleuse, mensongère ou discriminatoire est interdite et entraînera
            la suspension du compte concerné.
          </p>
        </section>

        <section aria-labelledby="cgu-responsabilite">
          <h2 id="cgu-responsabilite" className="text-sm font-semibold text-slate-900 dark:text-white mt-6 mb-2">
            4. Responsabilité
          </h2>
          <p>
            MyHome ne saurait être tenue responsable du contenu des annonces publiées par les
            utilisateurs, ni des éventuels litiges survenant entre locataires et propriétaires.
          </p>
        </section>

        <section aria-labelledby="cgu-loi">
          <h2 id="cgu-loi" className="text-sm font-semibold text-slate-900 dark:text-white mt-6 mb-2">
            5. Droit applicable
          </h2>
          <p>
            Les présentes conditions sont soumises au droit français. Tout litige relève
            de la compétence des tribunaux français.
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
