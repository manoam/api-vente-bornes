-- AlterTable
ALTER TABLE "ventes" ADD COLUMN     "type_vente_id" INTEGER;

-- CreateTable
CREATE TABLE "types_ventes" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "types_ventes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "types_ventes_code_key" ON "types_ventes"("code");

-- AddForeignKey
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_type_vente_id_fkey" FOREIGN KEY ("type_vente_id") REFERENCES "types_ventes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
