-- AlterTable
ALTER TABLE "clients" ADD COLUMN "crm_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "clients_crm_id_key" ON "clients"("crm_id");
