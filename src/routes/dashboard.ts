import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const dashboardRouter = Router();

// GET /api/dashboard/stats - Statistiques générales
dashboardRouter.get("/stats", async (_req, res) => {
  try {
    const [
      totalVentes,
      ventesParStatut,
      ventesParMois,
      ventesParUser,
    ] = await Promise.all([
      prisma.vente.count(),

      prisma.vente.groupBy({
        by: ["venteStatut"],
        _count: true,
      }),

      prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', created_at) as mois,
          COUNT(*)::int as total,
          COALESCE(SUM(facturation_montant_ht), 0) as ca
        FROM ventes
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY mois ASC
      `,

      prisma.vente.groupBy({
        by: ["userId"],
        _count: true,
        _sum: { facturationMontantHt: true },
      }),
    ]);

    res.json({
      totalVentes,
      ventesParStatut,
      ventesParMois,
      ventesParUser,
    });
  } catch (error) {
    console.error("GET /dashboard/stats error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/dashboard/facturations - Suivi facturation
dashboardRouter.get("/facturations", async (req, res) => {
  try {
    const { isArchive } = req.query;

    const where: any = {};
    if (isArchive === "true") {
      where.etatFacturation = "REGLEMENT_OK";
    } else {
      where.etatFacturation = { not: "REGLEMENT_OK" };
    }

    const ventes = await prisma.vente.findMany({
      where,
      include: {
        user: { select: { nom: true, prenom: true } },
        client: { select: { nom: true, prenom: true } },
        parc: { select: { nom: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(ventes);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
