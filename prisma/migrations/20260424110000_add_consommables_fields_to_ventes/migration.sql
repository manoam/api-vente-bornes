-- AlterTable
ALTER TABLE "ventes" ADD COLUMN "is_carton_bobine" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ventes" ADD COLUMN "materiel_other_note" TEXT;
