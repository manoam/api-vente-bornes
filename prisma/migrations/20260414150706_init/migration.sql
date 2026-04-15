-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'COMMERCIAL', 'LOGISTIQUE', 'FINANCE', 'COMPTA', 'PROJET');

-- CreateEnum
CREATE TYPE "VenteStatut" AS ENUM ('EN_ATTENTE', 'EN_PREPA', 'PRET_EXP', 'EXPEDIE', 'RECEPTIONNE');

-- CreateEnum
CREATE TYPE "EtatFacturation" AS ENUM ('ATTENTE_FACTURATION', 'FACTURE_ENVOYEE', 'ACCOMPTE_ATTENTE', 'ACCOMPTE_REGLE', 'REGLEMENT_OK');

-- CreateEnum
CREATE TYPE "LivraisonTypeDate" AS ENUM ('EN_ATTENTE', 'AUSSITOT', 'CLIENT', 'PRECIS');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'COMMERCIAL',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT,
    "email" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "ville" TEXT,
    "code_postal" TEXT,
    "pays" TEXT DEFAULT 'France',
    "is_agence" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "groupe_client_id" INTEGER,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_contacts" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT,
    "email" TEXT,
    "telephone" TEXT,
    "fonction" TEXT,

    CONSTRAINT "client_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groupe_clients" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "groupe_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gammes_bornes" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "gammes_bornes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_bornes" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "gamme_id" INTEGER NOT NULL,
    "thumbnail_url" TEXT,

    CONSTRAINT "model_bornes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "couleurs" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "hex" TEXT,

    CONSTRAINT "couleurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bornes" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bornes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accessoires" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "accessoires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "types_consommables" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "types_consommables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sous_types_consommables" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "type_consommable_id" INTEGER NOT NULL,

    CONSTRAINT "sous_types_consommables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcs" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "parcs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parc_durees" (
    "id" SERIAL NOT NULL,
    "parc_id" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "mois" INTEGER NOT NULL,

    CONSTRAINT "parc_durees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pays" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "pays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventes" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL DEFAULT '',
    "type_vente" TEXT NOT NULL,
    "parc_id" INTEGER,
    "parc_duree_id" INTEGER,
    "user_id" INTEGER NOT NULL,
    "modified_user_id" INTEGER,
    "client_id" INTEGER,
    "client_name_not_sellsy" TEXT,
    "client_nom" TEXT,
    "client_prenom" TEXT,
    "client_email" TEXT,
    "client_telephone" TEXT,
    "client_adresse" TEXT,
    "client_ville" TEXT,
    "client_cp" TEXT,
    "client_pays" TEXT,
    "groupe_client_id" INTEGER,
    "is_client_not_in_sellsy" BOOLEAN NOT NULL DEFAULT false,
    "is_client_belongs_to_group" BOOLEAN NOT NULL DEFAULT false,
    "is_agence" BOOLEAN NOT NULL DEFAULT false,
    "proprietaire" TEXT,
    "contact_client_id" INTEGER,
    "gamme_borne_id" INTEGER,
    "model_borne_id" INTEGER,
    "couleur_borne_id" INTEGER,
    "borne_id" INTEGER,
    "type_equipement_id" INTEGER,
    "is_without_imprimante" BOOLEAN NOT NULL DEFAULT false,
    "is_valise_transport" BOOLEAN NOT NULL DEFAULT false,
    "is_housse_protection" BOOLEAN NOT NULL DEFAULT false,
    "is_marque_blanche" BOOLEAN NOT NULL DEFAULT false,
    "is_custom_gravure" BOOLEAN NOT NULL DEFAULT false,
    "gravure_note" TEXT,
    "logiciel" TEXT,
    "materiel_note" TEXT,
    "facturation_entity_jurid" TEXT,
    "facturation_cp" TEXT,
    "facturation_ville" TEXT,
    "facturation_date_signature" TIMESTAMP(3),
    "facturation_montant_ht" DECIMAL(10,2),
    "facturation_achat_type" TEXT,
    "facturation_other_societe" TEXT,
    "facturation_other_adresse" TEXT,
    "facturation_other_cp" TEXT,
    "facturation_other_ville" TEXT,
    "facturation_other_tel" TEXT,
    "facturation_other_email" TEXT,
    "facturation_signature_file" TEXT,
    "etat_facturation" "EtatFacturation" NOT NULL DEFAULT 'ATTENTE_FACTURATION',
    "date_facturation" TIMESTAMP(3),
    "is_contact_crea_different" BOOLEAN NOT NULL DEFAULT false,
    "contact_crea_fullname" TEXT,
    "contact_crea_lastname" TEXT,
    "contact_crea_fonction" TEXT,
    "contact_crea_email" TEXT,
    "contact_crea_tel_mobile" TEXT,
    "contact_crea_tel_fixe" TEXT,
    "contact_crea_note" TEXT,
    "config_crea_note" TEXT,
    "livraison_type_date" "LivraisonTypeDate" NOT NULL DEFAULT 'EN_ATTENTE',
    "livraison_pays_id" INTEGER,
    "livraison_adresse" TEXT,
    "livraison_adresse_comp" TEXT,
    "livraison_ville" TEXT,
    "livraison_cp" TEXT,
    "livraison_contact_note" TEXT,
    "is_livraison_different" BOOLEAN NOT NULL DEFAULT false,
    "is_livraison_adresse_diff" BOOLEAN NOT NULL DEFAULT false,
    "livraison_as_soon_as_possible" BOOLEAN NOT NULL DEFAULT false,
    "livraison_date" TIMESTAMP(3),
    "livraison_date_first_usage" TIMESTAMP(3),
    "livraison_infos_sup" TEXT,
    "livraison_contact_fullname" TEXT,
    "livraison_contact_lastname" TEXT,
    "livraison_contact_fonction" TEXT,
    "livraison_contact_email" TEXT,
    "livraison_contact_tel_mobile" TEXT,
    "livraison_contact_tel_fixe" TEXT,
    "is_sous_location" BOOLEAN NOT NULL DEFAULT false,
    "contrat_debut" TIMESTAMP(3),
    "contrat_fin" TIMESTAMP(3),
    "nb_mois" INTEGER,
    "is_abonnement_bo" BOOLEAN NOT NULL DEFAULT false,
    "vente_statut" "VenteStatut" NOT NULL DEFAULT 'EN_ATTENTE',
    "date_depart_atelier" TIMESTAMP(3),
    "date_reception_client" TIMESTAMP(3),
    "bon_de_livraison" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ventes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventes_accessoires" (
    "id" SERIAL NOT NULL,
    "vente_id" INTEGER NOT NULL,
    "accessoire_id" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,

    CONSTRAINT "ventes_accessoires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventes_consommables" (
    "id" SERIAL NOT NULL,
    "vente_id" INTEGER NOT NULL,
    "type_consommable_id" INTEGER NOT NULL,
    "sous_type_consommable_id" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ventes_consommables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventes_documents" (
    "id" SERIAL NOT NULL,
    "vente_id" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "type" TEXT,
    "url" TEXT,

    CONSTRAINT "ventes_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "bornes_numero_key" ON "bornes"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "pays_code_key" ON "pays"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ventes_numero_key" ON "ventes"("numero");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_groupe_client_id_fkey" FOREIGN KEY ("groupe_client_id") REFERENCES "groupe_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_bornes" ADD CONSTRAINT "model_bornes_gamme_id_fkey" FOREIGN KEY ("gamme_id") REFERENCES "gammes_bornes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sous_types_consommables" ADD CONSTRAINT "sous_types_consommables_type_consommable_id_fkey" FOREIGN KEY ("type_consommable_id") REFERENCES "types_consommables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parc_durees" ADD CONSTRAINT "parc_durees_parc_id_fkey" FOREIGN KEY ("parc_id") REFERENCES "parcs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_modified_user_id_fkey" FOREIGN KEY ("modified_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_gamme_borne_id_fkey" FOREIGN KEY ("gamme_borne_id") REFERENCES "gammes_bornes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_model_borne_id_fkey" FOREIGN KEY ("model_borne_id") REFERENCES "model_bornes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_couleur_borne_id_fkey" FOREIGN KEY ("couleur_borne_id") REFERENCES "couleurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_borne_id_fkey" FOREIGN KEY ("borne_id") REFERENCES "bornes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_parc_id_fkey" FOREIGN KEY ("parc_id") REFERENCES "parcs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_parc_duree_id_fkey" FOREIGN KEY ("parc_duree_id") REFERENCES "parc_durees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_livraison_pays_id_fkey" FOREIGN KEY ("livraison_pays_id") REFERENCES "pays"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes_accessoires" ADD CONSTRAINT "ventes_accessoires_vente_id_fkey" FOREIGN KEY ("vente_id") REFERENCES "ventes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes_accessoires" ADD CONSTRAINT "ventes_accessoires_accessoire_id_fkey" FOREIGN KEY ("accessoire_id") REFERENCES "accessoires"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes_consommables" ADD CONSTRAINT "ventes_consommables_vente_id_fkey" FOREIGN KEY ("vente_id") REFERENCES "ventes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes_consommables" ADD CONSTRAINT "ventes_consommables_type_consommable_id_fkey" FOREIGN KEY ("type_consommable_id") REFERENCES "types_consommables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes_consommables" ADD CONSTRAINT "ventes_consommables_sous_type_consommable_id_fkey" FOREIGN KEY ("sous_type_consommable_id") REFERENCES "sous_types_consommables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes_documents" ADD CONSTRAINT "ventes_documents_vente_id_fkey" FOREIGN KEY ("vente_id") REFERENCES "ventes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
