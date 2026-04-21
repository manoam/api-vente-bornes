import { Router } from "express";
import multer from "multer";
import XLSX from "xlsx";
import { prisma } from "../lib/prisma.js";

export const importRouter = Router();

const upload = multer({ storage: multer.memoryStorage() });

// Mapping onglet → type contrat + partenaire
const SHEET_MAP: Record<
  string,
  { typeContrat: "LOCATION_FINANCIERE" | "LONGUE_DUREE" | "ACHAT" | "ABONNEMENT"; partenaire?: "GRENKE" | "LOCAM" | "LEASECOM" }
> = {
  GRENKE:          { typeContrat: "LOCATION_FINANCIERE", partenaire: "GRENKE" },
  LOCAM:           { typeContrat: "LOCATION_FINANCIERE", partenaire: "LOCAM" },
  LEASECOM:        { typeContrat: "LOCATION_FINANCIERE", partenaire: "LEASECOM" },
  "LONGUE DURÉE":  { typeContrat: "LONGUE_DUREE" },
  "LONGUE DUREE":  { typeContrat: "LONGUE_DUREE" },
  ACHAT:           { typeContrat: "ACHAT" },
  ABONNEMENTS:     { typeContrat: "ABONNEMENT" },
};

// POST /api/import/contrats — Upload Excel et importe les contrats
importRouter.post(
  "/contrats",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Fichier requis" });
      }

      const wb = XLSX.read(req.file.buffer, { type: "buffer" });
      const results: Record<string, { total: number; created: number; errors: number }> = {};
      let totalCreated = 0;

      for (const sheetName of wb.SheetNames) {
        const mapping = SHEET_MAP[sheetName.toUpperCase()] ?? SHEET_MAP[sheetName];
        if (!mapping) {
          results[sheetName] = { total: 0, created: 0, errors: 0 };
          continue;
        }

        const ws = wb.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: null });

        let created = 0;
        let errors = 0;

        for (const row of rows) {
          try {
            const contrat = parseRow(row, sheetName, mapping);
            if (!contrat) continue;

            const count = await prisma.contrat.count();
            const numero = `CTR-${String(count + 1).padStart(6, "0")}`;

            await prisma.contrat.create({
              data: { ...contrat, numero },
            });
            created++;
          } catch (err) {
            errors++;
          }
        }

        results[sheetName] = { total: rows.length, created, errors };
        totalCreated += created;
      }

      res.json({ success: true, totalCreated, sheets: results });
    } catch (error) {
      console.error("POST /import/contrats error:", error);
      res.status(500).json({ error: "Erreur lors de l'import" });
    }
  }
);

// ─── Parsing par onglet ─────────────────────────────────────

function parseRow(
  row: any,
  sheetName: string,
  mapping: { typeContrat: string; partenaire?: string }
): any | null {
  const sn = sheetName.toUpperCase();

  if (sn === "GRENKE") {
    return {
      typeContrat: mapping.typeContrat,
      partenaire: mapping.partenaire,
      clientPartenaire: str(row["CLIENT CHEZ GRENKE"]),
      clientCrm: str(row["CLIENT CRM"]),
      contactEmail: str(row["CONTACTS"]),
      numeroBorne: str(row["N° BORNE"]),
      mois: num(row["MOIS"]),
      montant: num(row["MONTANT"]),
      loyer: num(row["LOYER"]),
      dateDebut: excelDate(row["DATE DÉBUT"] ?? row["DATE DEBUT"]),
      dateFin: excelDate(row["DATE FIN"]),
    };
  }

  if (sn === "LOCAM") {
    return {
      typeContrat: mapping.typeContrat,
      partenaire: mapping.partenaire,
      clientPartenaire: str(row["NOM LOCAM"]),
      clientCrm: str(row["NOM CRM"]),
      contactEmail: str(row["MAILS"]),
      numeroBorne: str(row["N°BORNE"] ?? row["N° BORNE"]),
      mois: num(row["MOIS"]),
      montant: num(row["MONTANT"]),
      loyer: num(row["LOYER"]),
      dateDebut: excelDate(row["DATE DÉBUT"] ?? row["DATE DEBUT"]),
      dateFin: excelDate(row["DATE FIN"]),
    };
  }

  if (sn === "LEASECOM") {
    return {
      typeContrat: mapping.typeContrat,
      partenaire: mapping.partenaire,
      clientPartenaire: str(row["NOM LEASECOM"]),
      clientCrm: str(row["NOM CRM"]),
      contactEmail: str(row["MAILS"]),
      numeroBorne: str(row["BORNE"]),
      mois: num(row["NOMBRE DE MOIS"] ?? row["MOIS"]),
      montant: num(row["MONTANT"]),
      loyer: num(row["LOYER"]),
      dateDebut: excelDate(row["DATE DÉBUT"] ?? row["DATE DEBUT"]),
      dateFin: excelDate(row["DATE FIN"]),
    };
  }

  if (sn === "LONGUE DURÉE" || sn === "LONGUE DUREE") {
    return {
      typeContrat: mapping.typeContrat,
      clientCrm: str(row["NOM CRM"]),
      contactEmail: str(row["MAILS"]),
      numeroBorne: str(row["BORNE"]),
      mois: num(row["NBR MOIS"] ?? row["MOIS"]),
      montant: num(row["MONTANT"]),
      loyer: num(row["LOYER"]),
      dateDebut: excelDate(row["DATE DÉBUT"] ?? row["DATE DEBUT"]),
      dateFin: excelDate(row["DATE FIN"]),
      commercial: str(row["Commercial"] ?? row["COMMERCIAL"]),
    };
  }

  if (sn === "ACHAT") {
    const aboLogiciel = str(row["ABONNEMENT LOGICIEL"])?.toUpperCase();
    return {
      typeContrat: mapping.typeContrat,
      clientCrm: str(row["CLIENT"]),
      numeroBorne: str(row["N°BORNE"] ?? row["N° BORNE"]),
      abonnementLogiciel: aboLogiciel === "OUI",
    };
  }

  if (sn === "ABONNEMENTS") {
    return {
      typeContrat: mapping.typeContrat,
      clientPartenaire: str(row["NOM CLIENT"]),
      clientCrm: str(row["NOM CRM"]),
      mois: num(row["MOIS"]),
      montant: num(row["MONTANT"]),
      loyer: num(row["MENSUALITE"] ?? row["MENSUALITÉ"]),
      dateDebut: excelDate(row["DATE DEBUT"] ?? row["DATE DÉBUT"]),
      dateFin: excelDate(row["DATE FIN"]),
    };
  }

  return null;
}

// ─── Helpers ────────────────────────────────────────────────

function str(v: any): string | null {
  if (v === null || v === undefined || v === "") return null;
  return String(v).trim();
}

function num(v: any): number | null {
  if (v === null || v === undefined || v === "" || v === "/") return null;
  const n = typeof v === "string" ? parseFloat(v.replace(/\s/g, "").replace(",", ".")) : Number(v);
  return isNaN(n) ? null : n;
}

function excelDate(v: any): Date | null {
  if (v === null || v === undefined || v === "" || v === "/") return null;

  // Excel serial number (e.g., 43556)
  if (typeof v === "number") {
    const epoch = new Date(1899, 11, 30);
    return new Date(epoch.getTime() + v * 86400000);
  }

  // String date (dd/mm/yyyy or yyyy-mm-dd)
  if (typeof v === "string") {
    const parts = v.split("/");
    if (parts.length === 3) {
      const [d, m, y] = parts;
      return new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
    }
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}
