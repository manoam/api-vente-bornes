import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const clientsRouter = Router();

// GET /api/clients - Liste avec recherche
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

    res.json({ data: clients, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (error) {
    console.error("GET /clients error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/clients/:id
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

// POST /api/clients
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

// PUT /api/clients/:id
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
