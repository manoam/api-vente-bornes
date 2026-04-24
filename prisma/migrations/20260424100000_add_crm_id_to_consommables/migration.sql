-- AlterTable
ALTER TABLE "types_consommables" ADD COLUMN "crm_id" INTEGER;
ALTER TABLE "sous_types_consommables" ADD COLUMN "crm_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "types_consommables_crm_id_key" ON "types_consommables"("crm_id");
CREATE UNIQUE INDEX "sous_types_consommables_crm_id_key" ON "sous_types_consommables"("crm_id");
