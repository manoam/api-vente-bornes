-- CreateTable
CREATE TABLE "devis_ref" (
    "id" SERIAL NOT NULL,
    "crm_id" INTEGER NOT NULL,
    "client_id" INTEGER NOT NULL,
    "indent" TEXT,
    "date_crea" TIMESTAMP(3),
    "total_ht" DECIMAL(10,2),
    "total_ttc" DECIMAL(10,2),
    "status" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devis_ref_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "devis_ref_crm_id_key" ON "devis_ref"("crm_id");

-- AddForeignKey
ALTER TABLE "devis_ref" ADD CONSTRAINT "devis_ref_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "vente_devis" (
    "vente_id" INTEGER NOT NULL,
    "devis_ref_id" INTEGER NOT NULL,

    CONSTRAINT "vente_devis_pkey" PRIMARY KEY ("vente_id", "devis_ref_id")
);

-- AddForeignKey
ALTER TABLE "vente_devis" ADD CONSTRAINT "vente_devis_vente_id_fkey" FOREIGN KEY ("vente_id") REFERENCES "ventes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vente_devis" ADD CONSTRAINT "vente_devis_devis_ref_id_fkey" FOREIGN KEY ("devis_ref_id") REFERENCES "devis_ref"("id") ON DELETE CASCADE ON UPDATE CASCADE;
