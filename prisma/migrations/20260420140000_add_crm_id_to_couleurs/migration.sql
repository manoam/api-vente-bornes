-- AlterTable
ALTER TABLE "couleurs" ADD COLUMN "crm_id" INTEGER;
ALTER TABLE "couleurs" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "couleurs_crm_id_key" ON "couleurs"("crm_id");
