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
      couleurs: await syncCouleurs(),
      typeEquipements: await syncTypeEquipements(),
      equipements: await syncEquipements(),
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

// POST /api/sync/type-equipements
syncRouter.post("/type-equipements", async (_req, res) => {
  try {
    const result = await syncTypeEquipements();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("POST /sync/type-equipements error:", error);
    res.status(500).json({ error: "Erreur sync types équipements" });
  }
});

// POST /api/sync/equipements
syncRouter.post("/equipements", async (_req, res) => {
  try {
    const result = await syncEquipements();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("POST /sync/equipements error:", error);
    res.status(500).json({ error: "Erreur sync équipements" });
  }
});

// POST /api/sync/couleurs
syncRouter.post("/couleurs", async (_req, res) => {
  try {
    const result = await syncCouleurs();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("POST /sync/couleurs error:", error);
    res.status(500).json({ error: "Erreur sync couleurs" });
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

async function syncCouleurs() {
  const response = await fetch(`${CRM_BASE_URL}/api-v1/sync/couleurs.json`);
  if (!response.ok) throw new Error(`CRM couleurs: ${response.status}`);
  const data: any[] = await response.json();

  let created = 0;
  let updated = 0;

  for (const c of data) {
    const existing = await prisma.couleur.findUnique({ where: { crmId: c.id } });
    if (existing) {
      await prisma.couleur.update({
        where: { crmId: c.id },
        data: { nom: c.couleur },
      });
      updated++;
    } else {
      await prisma.couleur.create({
        data: { crmId: c.id, nom: c.couleur },
      });
      created++;
    }
  }

  return { total: data.length, created, updated };
}

async function syncTypeEquipements() {
  const response = await fetch(`${CRM_BASE_URL}/api-v1/sync/type-equipements.json`);
  if (!response.ok) throw new Error(`CRM type-equipements: ${response.status}`);
  const data: any[] = await response.json();

  let created = 0;
  let updated = 0;

  for (const t of data) {
    const existing = await prisma.typeEquipement.findUnique({ where: { crmId: t.id } });
    if (existing) {
      await prisma.typeEquipement.update({
        where: { crmId: t.id },
        data: {
          nom: t.nom,
          isStructurel: !!t.is_structurel,
          isAccessoire: !!t.is_accessoire,
          isProtection: !!t.is_protection,
          isVente: !!t.is_vente,
        },
      });
      updated++;
    } else {
      await prisma.typeEquipement.create({
        data: {
          crmId: t.id,
          nom: t.nom,
          isStructurel: !!t.is_structurel,
          isAccessoire: !!t.is_accessoire,
          isProtection: !!t.is_protection,
          isVente: !!t.is_vente,
        },
      });
      created++;
    }

    // Sync junction table
    const teLocal = await prisma.typeEquipement.findUnique({ where: { crmId: t.id } });
    if (teLocal && t.gamme_ids && Array.isArray(t.gamme_ids)) {
      await prisma.typeEquipementGamme.deleteMany({
        where: { typeEquipementId: teLocal.id },
      });
      for (const crmGammeId of t.gamme_ids) {
        const gamme = await prisma.gammeRef.findUnique({ where: { crmId: crmGammeId } });
        if (gamme) {
          await prisma.typeEquipementGamme.create({
            data: { typeEquipementId: teLocal.id, gammeRefId: gamme.id },
          }).catch(() => {});
        }
      }
    }
  }

  return { total: data.length, created, updated };
}

async function syncEquipements() {
  const response = await fetch(`${CRM_BASE_URL}/api-v1/sync/equipements.json`);
  if (!response.ok) throw new Error(`CRM equipements: ${response.status}`);
  const data: any[] = await response.json();

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const e of data) {
    const te = await prisma.typeEquipement.findUnique({
      where: { crmId: e.type_equipement_id },
    });
    if (!te) { skipped++; continue; }

    const existing = await prisma.equipement.findUnique({ where: { crmId: e.id } });
    if (existing) {
      await prisma.equipement.update({
        where: { crmId: e.id },
        data: { valeur: e.valeur, typeEquipementId: te.id },
      });
      updated++;
    } else {
      await prisma.equipement.create({
        data: { crmId: e.id, valeur: e.valeur, typeEquipementId: te.id },
      });
      created++;
    }
  }

  return { total: data.length, created, updated, skipped };
}
