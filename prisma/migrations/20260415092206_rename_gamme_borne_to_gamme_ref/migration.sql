/*
  Warnings:

  - You are about to drop the `gammes_bornes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "model_bornes" DROP CONSTRAINT "model_bornes_gamme_id_fkey";

-- DropForeignKey
ALTER TABLE "ventes" DROP CONSTRAINT "ventes_gamme_borne_id_fkey";

-- DropTable
DROP TABLE "gammes_bornes";

-- CreateTable
CREATE TABLE "gammes_ref" (
    "id" SERIAL NOT NULL,
    "crm_id" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gammes_ref_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gammes_ref_crm_id_key" ON "gammes_ref"("crm_id");

-- AddForeignKey
ALTER TABLE "model_bornes" ADD CONSTRAINT "model_bornes_gamme_id_fkey" FOREIGN KEY ("gamme_id") REFERENCES "gammes_ref"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_gamme_borne_id_fkey" FOREIGN KEY ("gamme_borne_id") REFERENCES "gammes_ref"("id") ON DELETE SET NULL ON UPDATE CASCADE;
