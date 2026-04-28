import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const clientsRouter = Router();

const CRM_BASE_URL = process.env.CRM_BASE_URL || "https://crmdev.konitys.fr";

// ─── GET /api/clients - Liste locale (clients ayant des ventes) ─

clientsRouter.get("/", async (req, res) => {
  try {
    const { search, page = "1", limit = "20" } = req.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { nom: { contains: String(search), mode: "insensitive" } },
        { prenom: { contains: String(search), mode: "insensitive" } },
        { email: { contains: String(search), mode: "insensitive" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: { contacts: true, groupe: true },
        orderBy: { nom: "asc" },
        skip,
        take: Number(limit),
      }),
      prisma.client.count({ where }),
    ]);

    res.json({
      data: clients,
      pagination: { page: Number(page), limit: Number(limit), total },
    });
  } catch (error) {
    console.error("GET /clients error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── GET /api/clients/search-crm?q=... - Proxy recherche CRM ─

clientsRouter.get("/search-crm", async (req, res) => {
  try {
    const q = String(req.query.q ?? "").trim();
    if (q.length < 2) {
      return res.json([]);
    }

    // Appel POST vers l'API v1 du CRM (pas d'auth requise)
    const response = await fetch(`${CRM_BASE_URL}/api-v1/clients/search.json`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `q=${encodeURIComponent(q)}`,
    });

    if (!response.ok) {
      console.error("CRM search error:", response.status, await response.text().catch(() => ""));
      return res.json([]);
    }

    const results = await response.json();
    console.log(`CRM search q="${q}" → ${results.length} results`);
    res.json(results);
  } catch (error) {
    console.error("GET /clients/search-crm error:", error);
    res.json([]);
  }
});

// ─── GET /api/clients/crm/:crmId - Récupère un client depuis le CRM et l'upsert ─

clientsRouter.get("/crm/:crmId", async (req, res) => {
  try {
    const crmId = Number(req.params.crmId);

    // Chercher dans notre base d'abord
    const existing = await prisma.client.findUnique({ where: { crmId } });
    if (existing) {
      return res.json(existing);
    }

    // Sinon, récupérer depuis l'API v1 du CRM
    const response = await fetch(
      `${CRM_BASE_URL}/api-v1/clients/get-by-id/${crmId}.json`,
    );

    if (!response.ok) {
      return res.status(404).json({ error: "Client non trouvé dans le CRM" });
    }

    const data = await response.json();

    if (!data || data.status === 0 || !data.client) {
      return res.status(404).json({ error: "Client non trouvé dans le CRM" });
    }

    const c = data.client;

    // Upsert dans notre base
    const client = await prisma.client.upsert({
      where: { crmId },
      create: {
        crmId,
        nom: c.nom ?? "",
        prenom: c.prenom ?? null,
        email: c.email ?? null,
        telephone: c.telephone ?? null,
        adresse: c.adresse ?? null,
        ville: c.ville ?? null,
        codePostal: c.cp ?? null,
        pays: c.pays?.nom ?? "France",
      },
      update: {
        nom: c.nom ?? "",
        prenom: c.prenom ?? null,
        email: c.email ?? null,
        telephone: c.telephone ?? null,
        adresse: c.adresse ?? null,
        ville: c.ville ?? null,
        codePostal: c.cp ?? null,
        pays: c.pays?.nom ?? "France",
      },
    });

    res.json(client);
  } catch (error) {
    console.error("GET /clients/crm/:crmId error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── GET /api/clients/crm/:crmId/devis - Liste des devis CRM (avec upsert local) ─

clientsRouter.get("/crm/:crmId/devis", async (req, res) => {
  try {
    const crmId = Number(req.params.crmId);

    // 1. S'assurer que le client local existe (sinon le créer depuis le CRM)
    let client = await prisma.client.findUnique({ where: { crmId } });
    if (!client) {
      const cRes = await fetch(`${CRM_BASE_URL}/api-v1/clients/get-by-id/${crmId}.json`);
      if (!cRes.ok) {
        return res.status(404).json({ error: "Client non trouvé dans le CRM" });
      }
      const cData = await cRes.json();
      if (!cData?.client) {
        return res.status(404).json({ error: "Client non trouvé dans le CRM" });
      }
      const c = cData.client;
      client = await prisma.client.create({
        data: {
          crmId,
          nom: c.nom ?? "",
          prenom: c.prenom ?? null,
          email: c.email ?? null,
          telephone: c.telephone ?? null,
          adresse: c.adresse ?? null,
          ville: c.ville ?? null,
          codePostal: c.cp ?? null,
          pays: c.pays?.nom ?? "France",
        },
      });
    }

    // 2. Fetch les devis du CRM
    const dRes = await fetch(`${CRM_BASE_URL}/api-v1/devis/by-client/${crmId}.json`);
    if (!dRes.ok) {
      console.error("CRM devis error:", dRes.status);
      return res.json([]);
    }
    const devisData: any[] = await dRes.json();

    // 3. Upsert chaque devis
    for (const d of devisData) {
      await prisma.devisRef.upsert({
        where: { crmId: d.id },
        create: {
          crmId: d.id,
          clientId: client.id,
          indent: d.indent ?? null,
          dateCrea: d.date_crea ? new Date(d.date_crea) : null,
          totalHt: d.total_ht ?? null,
          totalTtc: d.total_ttc ?? null,
          status: d.status ?? null,
        },
        update: {
          indent: d.indent ?? null,
          dateCrea: d.date_crea ? new Date(d.date_crea) : null,
          totalHt: d.total_ht ?? null,
          totalTtc: d.total_ttc ?? null,
          status: d.status ?? null,
        },
      });
    }

    // 4. Retourner les devis locaux (avec id local pour les checkboxes)
    const devis = await prisma.devisRef.findMany({
      where: { clientId: client.id },
      orderBy: { dateCrea: "desc" },
    });

    res.json(devis);
  } catch (error) {
    console.error("GET /clients/crm/:crmId/devis error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── GET /api/clients/:id ───────────────────────────────────

clientsRouter.get("/:id", async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: Number(req.params.id) },
      include: { contacts: true, groupe: true, ventes: true },
    });
    if (!client) return res.status(404).json({ error: "Client non trouvé" });
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── POST /api/clients ──────────────────────────────────────

clientsRouter.post("/", async (req, res) => {
  try {
    const client = await prisma.client.create({
      data: req.body,
      include: { contacts: true },
    });
    res.status(201).json(client);
  } catch (error) {
    console.error("POST /clients error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── PUT /api/clients/:id ───────────────────────────────────

clientsRouter.put("/:id", async (req, res) => {
  try {
    const client = await prisma.client.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
