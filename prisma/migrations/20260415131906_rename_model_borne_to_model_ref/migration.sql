/*
  Warnings:

  - You are about to drop the `model_bornes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "model_bornes" DROP CONSTRAINT "model_bornes_gamme_id_fkey";

-- DropForeignKey
ALTER TABLE "ventes" DROP CONSTRAINT "ventes_model_borne_id_fkey";

-- DropTable
DROP TABLE "model_bornes";

-- CreateTable
CREATE TABLE "models_ref" (
    "id" SERIAL NOT NULL,
    "crm_id" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "gamme_ref_id" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "models_ref_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "models_ref_crm_id_key" ON "models_ref"("crm_id");

-- AddForeignKey
ALTER TABLE "models_ref" ADD CONSTRAINT "models_ref_gamme_ref_id_fkey" FOREIGN KEY ("gamme_ref_id") REFERENCES "gammes_ref"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_model_borne_id_fkey" FOREIGN KEY ("model_borne_id") REFERENCES "models_ref"("id") ON DELETE SET NULL ON UPDATE CASCADE;
