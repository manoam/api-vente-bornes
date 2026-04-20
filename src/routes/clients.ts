import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const clientsRouter = Router();

const CRM_BASE_URL = process.env.CRM_BASE_URL || "http://localhost:8080";

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

    // Appel POST vers le CRM
    const response = await fetch(`${CRM_BASE_URL}/fr/ajax-clients/search-client`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `nom=${encodeURIComponent(q)}`,
    });

    if (!response.ok) {
      console.error("CRM search-client error:", response.status);
      return res.json([]);
    }

    const results = await response.json();
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

    // Sinon, récupérer depuis le CRM
    const response = await fetch(
      `${CRM_BASE_URL}/fr/ajax-clients/get-client-by-id/${crmId}`,
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
