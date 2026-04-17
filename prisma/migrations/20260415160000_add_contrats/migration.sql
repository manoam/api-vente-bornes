-- CreateEnum
CREATE TYPE "TypeContrat" AS ENUM ('LOCATION_FINANCIERE', 'LONGUE_DUREE', 'ACHAT', 'ABONNEMENT');

-- CreateEnum
CREATE TYPE "Partenaire" AS ENUM ('GRENKE', 'LOCAM', 'LEASECOM');

-- CreateTable
CREATE TABLE "contrats" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL DEFAULT '',
    "type_contrat" "TypeContrat" NOT NULL,
    "partenaire" "Partenaire",
    "client_partenaire" TEXT,
    "client_crm" TEXT,
    "client_id" INTEGER,
    "contact_email" TEXT,
    "numero_borne" TEXT,
    "mois" INTEGER,
    "montant" DECIMAL(10,2),
    "loyer" DECIMAL(10,2),
    "date_debut" TIMESTAMP(3),
    "date_fin" TIMESTAMP(3),
    "abonnement_logiciel" BOOLEAN NOT NULL DEFAULT false,
    "commercial" TEXT,
    "vente_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contrats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contrat_commentaires" (
    "id" SERIAL NOT NULL,
    "contrat_id" INTEGER NOT NULL,
    "contenu" TEXT NOT NULL,
    "auteur" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contrat_commentaires_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contrats_numero_key" ON "contrats"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "contrats_vente_id_key" ON "contrats"("vente_id");

-- AddForeignKey
ALTER TABLE "contrats" ADD CONSTRAINT "contrats_vente_id_fkey" FOREIGN KEY ("vente_id") REFERENCES "ventes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrat_commentaires" ADD CONSTRAINT "contrat_commentaires_contrat_id_fkey" FOREIGN KEY ("contrat_id") REFERENCES "contrats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
