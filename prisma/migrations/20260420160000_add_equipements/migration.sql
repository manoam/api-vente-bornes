-- CreateTable
CREATE TABLE "type_equipements" (
    "id" SERIAL NOT NULL,
    "crm_id" INTEGER,
    "nom" TEXT NOT NULL,
    "is_structurel" BOOLEAN NOT NULL DEFAULT false,
    "is_accessoire" BOOLEAN NOT NULL DEFAULT false,
    "is_protection" BOOLEAN NOT NULL DEFAULT false,
    "is_vente" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "type_equipements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipements" (
    "id" SERIAL NOT NULL,
    "crm_id" INTEGER,
    "type_equipement_id" INTEGER NOT NULL,
    "valeur" TEXT NOT NULL,
    CONSTRAINT "equipements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "type_equipement_gammes" (
    "id" SERIAL NOT NULL,
    "type_equipement_id" INTEGER NOT NULL,
    "gamme_ref_id" INTEGER NOT NULL,
    CONSTRAINT "type_equipement_gammes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipement_ventes" (
    "id" SERIAL NOT NULL,
    "vente_id" INTEGER NOT NULL,
    "type_equipement_id" INTEGER NOT NULL,
    "equipement_id" INTEGER,
    "valeur_definir" BOOLEAN NOT NULL DEFAULT false,
    "aucun" BOOLEAN NOT NULL DEFAULT false,
    "materiel_occasion" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "equipement_ventes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "type_equipements_crm_id_key" ON "type_equipements"("crm_id");
CREATE UNIQUE INDEX "equipements_crm_id_key" ON "equipements"("crm_id");
CREATE UNIQUE INDEX "type_equipement_gammes_type_equipement_id_gamme_ref_id_key" ON "type_equipement_gammes"("type_equipement_id", "gamme_ref_id");

-- AddForeignKey
ALTER TABLE "equipements" ADD CONSTRAINT "equipements_type_equipement_id_fkey" FOREIGN KEY ("type_equipement_id") REFERENCES "type_equipements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "type_equipement_gammes" ADD CONSTRAINT "type_equipement_gammes_type_equipement_id_fkey" FOREIGN KEY ("type_equipement_id") REFERENCES "type_equipements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "type_equipement_gammes" ADD CONSTRAINT "type_equipement_gammes_gamme_ref_id_fkey" FOREIGN KEY ("gamme_ref_id") REFERENCES "gammes_ref"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "equipement_ventes" ADD CONSTRAINT "equipement_ventes_vente_id_fkey" FOREIGN KEY ("vente_id") REFERENCES "ventes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "equipement_ventes" ADD CONSTRAINT "equipement_ventes_type_equipement_id_fkey" FOREIGN KEY ("type_equipement_id") REFERENCES "type_equipements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "equipement_ventes" ADD CONSTRAINT "equipement_ventes_equipement_id_fkey" FOREIGN KEY ("equipement_id") REFERENCES "equipements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
