import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const syncRouter = Router();

const CRM_BASE_URL = process.env.CRM_BASE_URL || "https://crmdev.konitys.fr";

// POST /api/sync/all — Synchronise toutes les tables depuis le CRM
syncRouter.post("/all", async (_req, res) => {
  try {
    const results = {
      gammes: await syncGammes(),
      modeles: await syncModeles(),
      users: await syncUsers(),
    };

    res.json({ success: true, results });
  } catch (error) {
    console.error("POST /sync/all error:", error);
    res.status(500).json({ error: "Erreur lors de la synchronisation" });
  }
});

// POST /api/sync/gammes
syncRouter.post("/gammes", async (_req, res) => {
  try {
    const result = await syncGammes();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("POST /sync/gammes error:", error);
    res.status(500).json({ error: "Erreur sync gammes" });
  }
});

// POST /api/sync/modeles
syncRouter.post("/modeles", async (_req, res) => {
  try {
    const result = await syncModeles();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("POST /sync/modeles error:", error);
    res.status(500).json({ error: "Erreur sync modèles" });
  }
});

// POST /api/sync/users
syncRouter.post("/users", async (_req, res) => {
  try {
    const result = await syncUsers();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("POST /sync/users error:", error);
    res.status(500).json({ error: "Erreur sync users" });
  }
});

// ─── Fonctions de sync ──────────────────────────────────────

async function syncGammes() {
  const response = await fetch(`${CRM_BASE_URL}/api-v1/sync/gammes-bornes.json`);
  if (!response.ok) throw new Error(`CRM gammes: ${response.status}`);
  const data: any[] = await response.json();

  let created = 0;
  let updated = 0;

  for (const g of data) {
    const existing = await prisma.gammeRef.findUnique({ where: { crmId: g.id } });
    if (existing) {
      await prisma.gammeRef.update({
        where: { crmId: g.id },
        data: { nom: g.name },
      });
      updated++;
    } else {
      await prisma.gammeRef.create({
        data: { crmId: g.id, nom: g.name },
      });
      created++;
    }
  }

  return { total: data.length, created, updated };
}

async function syncModeles() {
  const response = await fetch(`${CRM_BASE_URL}/api-v1/sync/model-bornes.json`);
  if (!response.ok) throw new Error(`CRM modeles: ${response.status}`);
  const data: any[] = await response.json();

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const m of data) {
    // Résoudre la FK gamme
    let gammeRefId: number | null = null;
    if (m.gamme_borne_id) {
      const gamme = await prisma.gammeRef.findUnique({
        where: { crmId: m.gamme_borne_id },
        select: { id: true },
      });
      gammeRefId = gamme?.id ?? null;
    }

    const existing = await prisma.modelRef.findUnique({ where: { crmId: m.id } });
    if (existing) {
      await prisma.modelRef.update({
        where: { crmId: m.id },
        data: { nom: m.nom, gammeRefId },
      });
      updated++;
    } else {
      await prisma.modelRef.create({
        data: { crmId: m.id, nom: m.nom, gammeRefId },
      });
      created++;
    }
  }

  return { total: data.length, created, updated, skipped };
}

async function syncUsers() {
  const response = await fetch(`${CRM_BASE_URL}/api-v1/sync/commerciaux.json`);
  if (!response.ok) throw new Error(`CRM users: ${response.status}`);
  const data: any[] = await response.json();

  let created = 0;
  let updated = 0;

  for (const u of data) {
    const existing = await prisma.user.findUnique({ where: { crmId: u.id } });
    if (existing) {
      await prisma.user.update({
        where: { crmId: u.id },
        data: {
          nom: u.nom ?? "",
          prenom: u.prenom ?? "",
          email: u.email ?? `user-${u.id}@crm.local`,
          isActive: u.etat === "actif",
        },
      });
      updated++;
    } else {
      await prisma.user.create({
        data: {
          crmId: u.id,
          nom: u.nom ?? "",
          prenom: u.prenom ?? "",
          email: u.email ?? `user-${u.id}@crm.local`,
          isActive: u.etat === "actif",
        },
      });
      created++;
    }
  }

  return { total: data.length, created, updated };
}
