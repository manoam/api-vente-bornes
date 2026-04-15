import amqp, { type ChannelModel, type Channel } from "amqplib";
import { prisma } from "../lib/prisma.js";

/**
 * Consumer RabbitMQ pour synchroniser les données du CRM.
 *
 * Format des messages publiés par le CRM (RabbitMQPublisher::buildMessage):
 * {
 *   event: 'created' | 'updated' | 'deleted',
 *   entity_type: 'gamme_borne',
 *   entity_id: number,
 *   timestamp: ISO8601,
 *   source: 'crm-selfizee',
 *   payload: { id, name, ... },
 *   meta?: {}
 * }
 *
 * Routing key: crm.{entity_type}.{event}
 */

interface CrmMessage {
  event: "created" | "updated" | "deleted";
  entity_type: string;
  entity_id: number;
  timestamp: string;
  source: string;
  payload: Record<string, any>;
  meta?: Record<string, any>;
}

const QUEUE_NAME = "ventes-bornes.gamme-ref-sync";
const EXCHANGE = process.env.RABBITMQ_EXCHANGE ?? "konitysevents";
const ROUTING_PATTERNS = ["crm.gamme_borne.*"];

let connection: ChannelModel | null = null;
let channel: Channel | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;

export async function startRabbitMQConsumer(): Promise<void> {
  const url = process.env.RABBITMQ_URL;
  if (!url) {
    console.warn("[RabbitMQ] RABBITMQ_URL not set, consumer disabled");
    return;
  }

  try {
    connection = await amqp.connect(url);
    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE, "topic", { durable: true });
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    for (const pattern of ROUTING_PATTERNS) {
      await channel.bindQueue(QUEUE_NAME, EXCHANGE, pattern);
    }

    await channel.prefetch(10);

    await channel.consume(QUEUE_NAME, async (msg) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString()) as CrmMessage;
        await handleMessage(content);
        channel?.ack(msg);
      } catch (error) {
        console.error("[RabbitMQ] Error handling message:", error);
        // requeue=false pour éviter une boucle infinie sur message invalide
        channel?.nack(msg, false, false);
      }
    });

    connection.on("error", (err) => {
      console.error("[RabbitMQ] Connection error:", err.message);
    });

    connection.on("close", () => {
      console.warn("[RabbitMQ] Connection closed, reconnecting in 5s...");
      scheduleReconnect();
    });

    console.log(
      `[RabbitMQ] Consumer started: queue=${QUEUE_NAME}, exchange=${EXCHANGE}`
    );
  } catch (error) {
    console.error("[RabbitMQ] Failed to start consumer:", error);
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectTimeout) return;
  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    startRabbitMQConsumer();
  }, 5000);
}

async function handleMessage(msg: CrmMessage): Promise<void> {
  console.log(
    `[RabbitMQ] Received: ${msg.entity_type}.${msg.event} id=${msg.entity_id}`
  );

  if (msg.entity_type === "gamme_borne") {
    return handleGammeBorne(msg);
  }

  console.log(`[RabbitMQ] Unhandled entity type: ${msg.entity_type}`);
}

async function handleGammeBorne(msg: CrmMessage): Promise<void> {
  const { event, payload } = msg;
  const crmId = Number(payload.id);
  const nom = String(payload.name ?? "");

  if (!crmId) {
    console.warn("[RabbitMQ] gamme_borne message missing id");
    return;
  }

  switch (event) {
    case "created":
    case "updated":
      await prisma.gammeRef.upsert({
        where: { crmId },
        create: { crmId, nom },
        update: { nom },
      });
      console.log(`[RabbitMQ] gamme_ref upserted: crmId=${crmId} nom=${nom}`);
      break;

    case "deleted":
      await prisma.gammeRef.delete({ where: { crmId } }).catch((err) => {
        if (err.code === "P2025") {
          console.log(`[RabbitMQ] gamme_ref crmId=${crmId} already deleted`);
        } else {
          throw err;
        }
      });
      console.log(`[RabbitMQ] gamme_ref deleted: crmId=${crmId}`);
      break;

    default:
      console.warn(`[RabbitMQ] Unknown event for gamme_borne: ${event}`);
  }
}

export async function stopRabbitMQConsumer(): Promise<void> {
  try {
    await channel?.close();
    await connection?.close();
  } catch (error) {
    console.error("[RabbitMQ] Error closing connection:", error);
  }
}
