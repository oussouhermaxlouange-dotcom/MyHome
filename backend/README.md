# Backend MyHome

API REST FastAPI et base SQLite (SQLAlchemy).

## Démarrer

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
```

La base `myhome.db` et les tables sont créées automatiquement au premier démarrage. Documentation interactive: http://localhost:8000/docs.

Pour créer des comptes et une annonce de démonstration, dans un autre terminal: `cd backend && python -m app.seed`. Les comptes sont `bailleur@myhome.bj` et `locataire@myhome.bj`; le mot de passe est `DEMO_PASSWORD` (valeur locale par défaut: `demo123`).

## Configuration

Variables facultatives: `DATABASE_URL` (SQLite par défaut), `JWT_SECRET` (à remplacer hors développement), `JWT_EXPIRE_HOURS`, `CORS_ORIGINS` (origines séparées par des virgules), `DEMO_PASSWORD`.

## Routes

- Authentification: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- Annonces: `GET /api/apartments` (filtres city, type, min_price, max_price, min_rooms, status), `GET/POST /api/apartments`, mise à jour du statut
- Favoris: `GET /api/me/favorites`, `PUT /api/apartments/{id}/favorite`
- Visites: créneaux par annonce et réservation authentifiée
- Candidatures: dépôt locataire, liste locataire/bailleur et changement de statut bailleur
- Dossier: `GET /api/me/pass`; newsletter et alertes de recherche

Les routes privées attendent `Authorization: Bearer <token>`. Les loyers sont en FCFA, comme dans les maquettes du projet.

## Vérifications

Installer les dépendances de développement avec pip install -r requirements-dev.txt, puis lancer pytest depuis backend/. La suite crée une base SQLite temporaire et ne touche pas aux données locales. L’endpoint GET /health vérifie aussi qu’une requête à la base aboutit.

## Vérifications

Depuis `backend/`, lancez `pytest` pour vérifier l’API. Les tests utilisent une base SQLite temporaire et ne modifient pas `myhome.db`. `GET /health` vérifie que la base est joignable.
