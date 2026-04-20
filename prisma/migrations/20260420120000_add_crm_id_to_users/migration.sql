-- AlterTable
ALTER TABLE "users" ADD COLUMN "crm_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "users_crm_id_key" ON "users"("crm_id");
