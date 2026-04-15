import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";

export const ventesRouter = Router();

// ─── Schéma de validation ───────────────────────────────────

const venteCreateSchema = z.object({
  typeVente: z.string(),
  parcId: z.number().optional(),
  parcDureeId: z.number().optional(),
  userId: z.number(),

  // Client
  clientId: z.number().optional(),
  clientNom: z.string().optional(),
  clientPrenom: z.string().optional(),
  clientEmail: z.string().email().optional(),
  clientTelephone: z.string().optional(),
  clientAdresse: z.string().optional(),
  clientVille: z.string().optional(),
  clientCp: z.string().optional(),
  clientPays: z.string().optional(),
  isAgence: z.boolean().optional(),

  // Équipement
  gammeBorneId: z.number().optional(),
  modelBorneId: z.number().optional(),
  couleurBorneId: z.number().optional(),
  borneId: z.number().optional(),

  // Options
  isWithoutImprimante: z.boolean().optional(),
  isValiseTransport: z.boolean().optional(),
  isHousseProtection: z.boolean().optional(),
  isMarqueBlanche: z.boolean().optional(),
  isCustomGravure: z.boolean().optional(),
  gravureNote: z.string().optional(),
  logiciel: z.string().optional(),

  // Facturation
  facturationEntityJurid: z.string().optional(),
  facturationMontantHt: z.number().optional(),
  facturationAchatType: z.string().optional(),

  // Livraison
  livraisonTypeDate: z.enum(["EN_ATTENTE", "AUSSITOT", "CLIENT", "PRECIS"]).optional(),
  livraisonAdresse: z.string().optional(),
  livraisonVille: z.string().optional(),
  livraisonCp: z.string().optional(),
  livraisonPaysId: z.number().optional(),
  livraisonDate: z.string().datetime().optional(),

  // Contrat
  contratDebut: z.string().datetime().optional(),
  contratFin: z.string().datetime().optional(),
  nbMois: z.number().optional(),

  // Sous-entités
  accessoires: z.array(z.object({
    accessoireId: z.number(),
    qty: z.number().default(1),
    note: z.string().optional(),
  })).optional(),

  consommables: z.array(z.object({
    typeConsommableId: z.number(),
    sousTypeConsommableId: z.number(),
    qty: z.number().default(1),
  })).optional(),
});

// ─── GET /api/ventes ────────────────────────────────────────

ventesRouter.get("/", async (req, res) => {
  try {
    const {
      statut,
      clientId,
      userId,
      search,
      page = "1",
      limit = "20",
    } = req.query;

    const where: any = {};

    if (statut) where.venteStatut = statut;
    if (clientId) where.clientId = Number(clientId);
    if (userId) where.userId = Number(userId);
    if (search) {
      where.OR = [
        { numero: { contains: String(search), mode: "insensitive" } },
        { clientNom: { contains: String(search), mode: "insensitive" } },
        { clientEmail: { contains: String(search), mode: "insensitive" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [ventes, total] = await Promise.all([
      prisma.vente.findMany({
        where,
        include: {
          user: { select: { id: true, nom: true, prenom: true } },
          client: { select: { id: true, nom: true, prenom: true, email: true } },
          gammeBorne: { select: { id: true, nom: true } },
          modelBorne: { select: { id: true, nom: true } },
          parc: { select: { id: true, nom: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.vente.count({ where }),
    ]);

    res.json({
      data: ventes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("GET /ventes error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── GET /api/ventes/:id ────────────────────────────────────

ventesRouter.get("/:id", async (req, res) => {
  try {
    const vente = await prisma.vente.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        user: true,
        modifiedUser: true,
        client: { include: { contacts: true } },
        gammeBorne: true,
        modelBorne: true,
        couleur: true,
        borne: true,
        parc: true,
        parcDuree: true,
        livraisonPays: true,
        accessoires: { include: { accessoire: true } },
        consommables: { include: { typeConsommable: true, sousTypeConsommable: true } },
        documents: true,
      },
    });

    if (!vente) {
      return res.status(404).json({ error: "Vente non trouvée" });
    }

    res.json(vente);
  } catch (error) {
    console.error("GET /ventes/:id error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── POST /api/ventes ───────────────────────────────────────

ventesRouter.post("/", async (req, res) => {
  try {
    const data = venteCreateSchema.parse(req.body);
    const { accessoires, consommables, ...venteData } = data;

    // Générer numéro de vente
    const count = await prisma.vente.count();
    const numero = `V-${String(count + 1).padStart(6, "0")}`;

    const vente = await prisma.vente.create({
      data: {
        ...venteData,
        numero,
        facturationMontantHt: venteData.facturationMontantHt
          ? venteData.facturationMontantHt
          : undefined,
        livraisonDate: venteData.livraisonDate
          ? new Date(venteData.livraisonDate)
          : undefined,
        contratDebut: venteData.contratDebut
          ? new Date(venteData.contratDebut)
          : undefined,
        contratFin: venteData.contratFin
          ? new Date(venteData.contratFin)
          : undefined,
        accessoires: accessoires
          ? { create: accessoires }
          : undefined,
        consommables: consommables
          ? { create: consommables }
          : undefined,
      },
      include: {
        user: true,
        client: true,
        accessoires: true,
        consommables: true,
      },
    });

    res.status(201).json(vente);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation", details: error.errors });
    }
    console.error("POST /ventes error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── PUT /api/ventes/:id ────────────────────────────────────

ventesRouter.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { accessoires, consommables, ...venteData } = req.body;

    const vente = await prisma.vente.update({
      where: { id },
      data: {
        ...venteData,
        livraisonDate: venteData.livraisonDate
          ? new Date(venteData.livraisonDate)
          : undefined,
        contratDebut: venteData.contratDebut
          ? new Date(venteData.contratDebut)
          : undefined,
        contratFin: venteData.contratFin
          ? new Date(venteData.contratFin)
          : undefined,
      },
      include: {
        user: true,
        client: true,
        accessoires: true,
        consommables: true,
      },
    });

    // Mettre à jour les accessoires si fournis
    if (accessoires) {
      await prisma.venteAccessoire.deleteMany({ where: { venteId: id } });
      await prisma.venteAccessoire.createMany({
        data: accessoires.map((a: any) => ({ ...a, venteId: id })),
      });
    }

    // Mettre à jour les consommables si fournis
    if (consommables) {
      await prisma.venteConsommable.deleteMany({ where: { venteId: id } });
      await prisma.venteConsommable.createMany({
        data: consommables.map((c: any) => ({ ...c, venteId: id })),
      });
    }

    res.json(vente);
  } catch (error) {
    console.error("PUT /ventes/:id error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── PATCH /api/ventes/:id/statut ───────────────────────────

ventesRouter.patch("/:id/statut", async (req, res) => {
  try {
    const { venteStatut, dateDepartAtelier, dateReceptionClient } = req.body;

    const vente = await prisma.vente.update({
      where: { id: Number(req.params.id) },
      data: {
        venteStatut,
        dateDepartAtelier: dateDepartAtelier ? new Date(dateDepartAtelier) : undefined,
        dateReceptionClient: dateReceptionClient ? new Date(dateReceptionClient) : undefined,
      },
    });

    res.json(vente);
  } catch (error) {
    console.error("PATCH /ventes/:id/statut error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── PATCH /api/ventes/:id/facturation ──────────────────────

ventesRouter.patch("/:id/facturation", async (req, res) => {
  try {
    const { etatFacturation, dateFacturation } = req.body;

    const vente = await prisma.vente.update({
      where: { id: Number(req.params.id) },
      data: {
        etatFacturation,
        dateFacturation: dateFacturation ? new Date(dateFacturation) : undefined,
      },
    });

    res.json(vente);
  } catch (error) {
    console.error("PATCH /ventes/:id/facturation error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── DELETE /api/ventes/:id ─────────────────────────────────

ventesRouter.delete("/:id", async (req, res) => {
  try {
    await prisma.vente.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE /ventes/:id error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
