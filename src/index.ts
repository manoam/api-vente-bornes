import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ventesRouter } from "./routes/ventes.js";
import { clientsRouter } from "./routes/clients.js";
import { usersRouter } from "./routes/users.js";
import { referenceRouter } from "./routes/reference.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { parametresRouter } from "./routes/parametres.js";
import { startRabbitMQConsumer } from "./rabbitmq/consumer.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()) ?? "*",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/ventes", ventesRouter);
app.use("/api/clients", clientsRouter);
app.use("/api/users", usersRouter);
app.use("/api/reference", referenceRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/parametres", parametresRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startRabbitMQConsumer().catch((err: unknown) =>
    console.error("Failed to start RabbitMQ consumer:", err)
  );
});
