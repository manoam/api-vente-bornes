import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Users
  const admin = await prisma.user.create({
    data: { email: "admin@selfizee.com", nom: "Admin", prenom: "Super", role: "ADMIN" },
  });
  const commercial = await prisma.user.create({
    data: { email: "commercial@selfizee.com", nom: "Dupont", prenom: "Jean", role: "COMMERCIAL" },
  });

  // Pays
  const france = await prisma.pays.create({ data: { nom: "France", code: "FR" } });
  await prisma.pays.createMany({
    data: [
      { nom: "Belgique", code: "BE" },
      { nom: "Suisse", code: "CH" },
      { nom: "Luxembourg", code: "LU" },
    ],
  });

  // Gammes & Modèles
  const gamme1 = await prisma.gammeBorne.create({ data: { nom: "Borne Photo" } });
  const gamme2 = await prisma.gammeBorne.create({ data: { nom: "Borne Vidéo" } });
  await prisma.modelBorne.createMany({
    data: [
      { nom: "Classic", gammeId: gamme1.id },
      { nom: "Premium", gammeId: gamme1.id },
      { nom: "Mini", gammeId: gamme1.id },
      { nom: "Studio", gammeId: gamme2.id },
      { nom: "360", gammeId: gamme2.id },
    ],
  });

  // Couleurs
  await prisma.couleur.createMany({
    data: [
      { nom: "Blanc", hex: "#FFFFFF" },
      { nom: "Noir", hex: "#000000" },
      { nom: "Rouge", hex: "#FF0000" },
      { nom: "Bleu", hex: "#0000FF" },
    ],
  });

  // Accessoires
  await prisma.accessoire.createMany({
    data: [
      { nom: "Trépied" },
      { nom: "Ring Light" },
      { nom: "Fond vert" },
      { nom: "Props box" },
      { nom: "Câble HDMI 5m" },
    ],
  });

  // Types de vente
  await prisma.typeVente.createMany({
    data: [
      { code: "location", label: "Location", ordre: 1 },
      { code: "vente", label: "Vente", ordre: 2 },
      { code: "pret", label: "Prêt", ordre: 3 },
    ],
  });

  // Consommables
  const typeConso1 = await prisma.typeConsommable.create({ data: { nom: "Papier" } });
  const typeConso2 = await prisma.typeConsommable.create({ data: { nom: "Encre" } });
  await prisma.sousTypeConsommable.createMany({
    data: [
      { nom: "10x15 brillant", typeConsommableId: typeConso1.id },
      { nom: "10x15 mat", typeConsommableId: typeConso1.id },
      { nom: "Cartouche couleur", typeConsommableId: typeConso2.id },
      { nom: "Cartouche noir", typeConsommableId: typeConso2.id },
    ],
  });

  // Parcs & Durées
  const parcLoc = await prisma.parc.create({ data: { nom: "Location" } });
  const parcVente = await prisma.parc.create({ data: { nom: "Vente" } });
  await prisma.parcDuree.createMany({
    data: [
      { parcId: parcLoc.id, label: "12 mois", mois: 12 },
      { parcId: parcLoc.id, label: "24 mois", mois: 24 },
      { parcId: parcLoc.id, label: "36 mois", mois: 36 },
      { parcId: parcVente.id, label: "Achat définitif", mois: 0 },
    ],
  });

  // Bornes
  await prisma.borne.createMany({
    data: [
      { numero: "BRN-001" },
      { numero: "BRN-002" },
      { numero: "BRN-003" },
      { numero: "BRN-004" },
      { numero: "BRN-005" },
    ],
  });

  // Clients
  const client1 = await prisma.client.create({
    data: {
      nom: "Martin",
      prenom: "Sophie",
      email: "sophie.martin@example.com",
      telephone: "06 12 34 56 78",
      adresse: "12 rue de la Paix",
      ville: "Paris",
      codePostal: "75001",
    },
  });

  const client2 = await prisma.client.create({
    data: {
      nom: "Bernard",
      prenom: "Luc",
      email: "luc.bernard@example.com",
      telephone: "06 98 76 54 32",
      ville: "Lyon",
      codePostal: "69001",
    },
  });

  // Ventes de démonstration
  await prisma.vente.create({
    data: {
      numero: "V-000001",
      typeVente: "location",
      userId: commercial.id,
      clientId: client1.id,
      clientNom: "Martin",
      clientPrenom: "Sophie",
      clientEmail: "sophie.martin@example.com",
      gammeBorneId: gamme1.id,
      facturationMontantHt: 2500,
      venteStatut: "EN_PREPA",
      etatFacturation: "FACTURE_ENVOYEE",
      livraisonVille: "Paris",
      livraisonCp: "75001",
      livraisonPaysId: france.id,
    },
  });

  await prisma.vente.create({
    data: {
      numero: "V-000002",
      typeVente: "vente",
      userId: admin.id,
      clientId: client2.id,
      clientNom: "Bernard",
      clientPrenom: "Luc",
      gammeBorneId: gamme2.id,
      facturationMontantHt: 5800,
      venteStatut: "EXPEDIE",
      etatFacturation: "REGLEMENT_OK",
      livraisonVille: "Lyon",
      livraisonPaysId: france.id,
    },
  });

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
