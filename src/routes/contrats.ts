import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";

export const contratsRouter = Router();

// ─── Validation ─────────────────────────────────────────────

const contratCreateSchema = z.object({
  typeContrat: z.enum([
    "LOCATION_FINANCIERE",
    "LONGUE_DUREE",
    "ACHAT",
    "ABONNEMENT",
  ]),
  partenaire: z.enum(["GRENKE", "LOCAM", "LEASECOM"]).optional().nullable(),
  clientPartenaire: z.string().optional().nullable(),
  clientCrm: z.string().optional().nullable(),
  clientId: z.number().optional().nullable(),
  contactEmail: z.string().optional().nullable(),
  numeroBorne: z.string().optional().nullable(),
  mois: z.number().optional().nullable(),
  montant: z.number().optional().nullable(),
  loyer: z.number().optional().nullable(),
  dateDebut: z.string().optional().nullable(),
  dateFin: z.string().optional().nullable(),
  abonnementLogiciel: z.boolean().optional(),
  commercial: z.string().optional().nullable(),
  venteId: z.number().optional().nullable(),
});

// ─── GET /api/contrats ──────────────────────────────────────

contratsRouter.get("/", async (req, res) => {
  try {
    const {
      typeContrat,
      partenaire,
      search,
      page = "1",
      limit = "30",
    } = req.query;

    const where: any = {};

    if (typeContrat) where.typeContrat = typeContrat;
    if (partenaire) where.partenaire = partenaire;
    if (search) {
      where.OR = [
        { numero: { contains: String(search), mode: "insensitive" } },
        { clientCrm: { contains: String(search), mode: "insensitive" } },
        {
          clientPartenaire: {
            contains: String(search),
            mode: "insensitive",
          },
        },
        { numeroBorne: { contains: String(search), mode: "insensitive" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [contrats, total] = await Promise.all([
      prisma.contrat.findMany({
        where,
        include: {
          commentaires: { orderBy: { createdAt: "desc" }, take: 1 },
          vente: { select: { id: true, numero: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.contrat.count({ where }),
    ]);

    res.json({
      data: contrats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("GET /contrats error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── GET /api/contrats/stats ────────────────────────────────

contratsRouter.get("/stats", async (_req, res) => {
  try {
    const [byType, byPartenaire, total] = await Promise.all([
      prisma.contrat.groupBy({
        by: ["typeContrat"],
        _count: true,
        _sum: { montant: true, loyer: true },
      }),
      prisma.contrat.groupBy({
        by: ["partenaire"],
        _count: true,
        _sum: { montant: true, loyer: true },
      }),
      prisma.contrat.count(),
    ]);

    res.json({ total, byType, byPartenaire });
  } catch (error) {
    console.error("GET /contrats/stats error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── GET /api/contrats/:id ──────────────────────────────────

contratsRouter.get("/:id", async (req, res) => {
  try {
    const contrat = await prisma.contrat.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        commentaires: { orderBy: { createdAt: "desc" } },
        vente: true,
      },
    });

    if (!contrat) {
      return res.status(404).json({ error: "Contrat non trouvé" });
    }

    res.json(contrat);
  } catch (error) {
    console.error("GET /contrats/:id error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── POST /api/contrats ─────────────────────────────────────

contratsRouter.post("/", async (req, res) => {
  try {
    const data = contratCreateSchema.parse(req.body);

    const count = await prisma.contrat.count();
    const numero = `CTR-${String(count + 1).padStart(6, "0")}`;

    const contrat = await prisma.contrat.create({
      data: {
        ...data,
        numero,
        montant: data.montant ?? undefined,
        loyer: data.loyer ?? undefined,
        dateDebut: data.dateDebut ? new Date(data.dateDebut) : undefined,
        dateFin: data.dateFin ? new Date(data.dateFin) : undefined,
      },
      include: { commentaires: true },
    });

    res.status(201).json(contrat);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Validation", details: error.errors });
    }
    console.error("POST /contrats error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── PUT /api/contrats/:id ──────────────────────────────────

contratsRouter.put("/:id", async (req, res) => {
  try {
    const { commentaires, ...data } = req.body;

    const contrat = await prisma.contrat.update({
      where: { id: Number(req.params.id) },
      data: {
        ...data,
        dateDebut: data.dateDebut ? new Date(data.dateDebut) : undefined,
        dateFin: data.dateFin ? new Date(data.dateFin) : undefined,
      },
      include: { commentaires: true },
    });

    res.json(contrat);
  } catch (error) {
    console.error("PUT /contrats/:id error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── DELETE /api/contrats/:id ───────────────────────────────

contratsRouter.delete("/:id", async (req, res) => {
  try {
    await prisma.contrat.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE /contrats/:id error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── POST /api/contrats/:id/commentaires ────────────────────

contratsRouter.post("/:id/commentaires", async (req, res) => {
  try {
    const { contenu, auteur } = req.body;

    if (!contenu) {
      return res.status(400).json({ error: "Contenu requis" });
    }

    const commentaire = await prisma.contratCommentaire.create({
      data: {
        contratId: Number(req.params.id),
        contenu,
        auteur,
      },
    });

    res.status(201).json(commentaire);
  } catch (error) {
    console.error("POST /contrats/:id/commentaires error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── DELETE /api/contrats/:contratId/commentaires/:id ───────

contratsRouter.delete("/:contratId/commentaires/:id", async (req, res) => {
  try {
    await prisma.contratCommentaire.delete({
      where: { id: Number(req.params.id) },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE commentaire error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
