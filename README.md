# API Vente Bornes

API Node.js + Express + Prisma + PostgreSQL pour la gestion des ventes (refonte CRM Selfizee).

## Développement local

```bash
# 1. Lancer PostgreSQL
docker compose up -d postgres

# 2. Installer & migrer
npm install
npx prisma migrate dev
npx tsx prisma/seed.ts

# 3. Démarrer
npm run dev              # http://localhost:3002
```

## Déploiement Coolify

**Source** : Public Repository `https://github.com/manoam/api-vente-bornes`
**Build Pack** : Docker Compose
**Compose file** : `docker-compose.yml`

Variables d'environnement :
```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<strong_password>
POSTGRES_DB=ventes_db
API_PORT=3002
CORS_ORIGIN=https://<domaine-du-front>
```

## Endpoints principaux

- `GET /api/health`
- `GET /api/ventes` - liste paginée, filtres `?statut=&search=&page=`
- `GET /api/ventes/:id` - détail complet
- `POST /api/ventes` - création
- `PUT /api/ventes/:id` - mise à jour
- `PATCH /api/ventes/:id/statut` - changement statut
- `PATCH /api/ventes/:id/facturation` - changement état facturation
- `DELETE /api/ventes/:id`
- `GET /api/clients`, `/api/users`, `/api/reference/*`, `/api/dashboard/*`
