import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const usersRouter = Router();

// GET /api/users - Liste des commerciaux (synchro depuis CRM via RabbitMQ)
usersRouter.get("/", async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: { nom: "asc" },
    });
    res.json(users);
  } catch (error) {
    console.error("GET /users error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/users/:id
usersRouter.get("/:id", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
