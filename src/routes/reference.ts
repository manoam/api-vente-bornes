import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const referenceRouter = Router();

// Données de référence pour les formulaires

referenceRouter.get("/gammes-bornes", async (_req, res) => {
  try {
    const gammes = await prisma.gammeRef.findMany({
      include: { models: true },
      orderBy: { nom: "asc" },
    });
    res.json(gammes);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

referenceRouter.get("/couleurs", async (_req, res) => {
  try {
    const couleurs = await prisma.couleur.findMany({ orderBy: { nom: "asc" } });
    res.json(couleurs);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

referenceRouter.get("/accessoires", async (_req, res) => {
  try {
    const accessoires = await prisma.accessoire.findMany({ orderBy: { nom: "asc" } });
    res.json(accessoires);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

referenceRouter.get("/consommables", async (_req, res) => {
  try {
    const types = await prisma.typeConsommable.findMany({
      include: { sousTypes: true },
      orderBy: { nom: "asc" },
    });
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

referenceRouter.get("/parcs", async (_req, res) => {
  try {
    const parcs = await prisma.parc.findMany({
      include: { durees: true },
      orderBy: { nom: "asc" },
    });
    res.json(parcs);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

referenceRouter.get("/pays", async (_req, res) => {
  try {
    const pays = await prisma.pays.findMany({ orderBy: { nom: "asc" } });
    res.json(pays);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

referenceRouter.get("/types-ventes", async (_req, res) => {
  try {
    const types = await prisma.typeVente.findMany({
      where: { actif: true },
      orderBy: { ordre: "asc" },
    });
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

referenceRouter.get("/bornes", async (_req, res) => {
  try {
    const bornes = await prisma.borne.findMany({
      where: { isActive: true },
      orderBy: { numero: "asc" },
    });
    res.json(bornes);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
