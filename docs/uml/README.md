# UML et schéma MyHome

Ces diagrammes décrivent la Phase 1 implémentée. Le backend est une API **FastAPI en Python**, modélisée avec **SQLAlchemy 2**. SQLite est utilisé par défaut; PostgreSQL est sélectionné via la variable d'environnement DATABASE_URL.

## Fichiers

- **myhome.puml** — cas d’utilisation et rôles.
- **schema-er.puml** — tables relationnelles et clés étrangères.
- **architecture.puml** — composants, stockage et bases prises en charge.
- **messaging-sequence.puml** — création de conversation et échange de messages.

## Mapping du modèle métier

Les tables historiques **users**, **apartments** et **favorites** restent les tables physiques utilisées par l’application. Elles correspondent à Users, Logements et Favoris du modèle métier. Les éléments normalisés sont stockés dans **quartiers**, **photos_logement**, **conversations** et **messages**. La colonne JSON apartments.photos reste un cache de compatibilité.

Les rôles persistés sont **tenant**, **landlord** et **admin**; le visiteur est anonyme. Les dépendances RBAC comprennent aussi les alias métier LOCATAIRE, PROPRIETAIRE et ADMIN.
