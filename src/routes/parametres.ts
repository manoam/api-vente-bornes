import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";

export const parametresRouter = Router();

// ─── Types de vente ─────────────────────────────────────────

const typeVenteSchema = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
  ordre: z.number().int().default(0),
  actif: z.boolean().default(true),
});

// GET /api/parametres/types-ventes
parametresRouter.get("/types-ventes", async (_req, res) => {
  try {
    const types = await prisma.typeVente.findMany({
      orderBy: { ordre: "asc" },
    });
    res.json(types);
  } catch (error) {
    console.error("GET types-ventes error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/parametres/types-ventes
parametresRouter.post("/types-ventes", async (req, res) => {
  try {
    const data = typeVenteSchema.parse(req.body);
    const type = await prisma.typeVente.create({ data });
    res.status(201).json(type);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation", details: error.errors });
    }
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Ce code existe déjà" });
    }
    console.error("POST types-ventes error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT /api/parametres/types-ventes/:id
parametresRouter.put("/types-ventes/:id", async (req, res) => {
  try {
    const data = typeVenteSchema.parse(req.body);
    const type = await prisma.typeVente.update({
      where: { id: Number(req.params.id) },
      data,
    });
    res.json(type);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation", details: error.errors });
    }
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Ce code existe déjà" });
    }
    console.error("PUT types-ventes error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/parametres/types-ventes/:id
parametresRouter.delete("/types-ventes/:id", async (req, res) => {
  try {
    await prisma.typeVente.delete({
      where: { id: Number(req.params.id) },
    });
    res.json({ success: true });
  } catch (error: any) {
    if (error.code === "P2003") {
      return res.status(400).json({
        error: "Ce type est utilisé par des ventes, désactivez-le plutôt",
      });
    }
    console.error("DELETE types-ventes error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
