import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import venom from "venom-bot";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// ---- Create WhatsApp Session ----
venom
  .create({
    session: "promolinks",
    multidevice: true,
    qrTimeout: 0,
    headless: true,
  })
  .then((client) => startBot(client))
  .catch((err) => console.error(err));

function startBot(client) {
  console.log("🚀 Venom Bot iniciado!");

  // -------- LISTEN TO ALL MESSAGES --------
  client.onMessage(async (message) => {
    console.log("📩 Mensagem recebida:", message.body);

    const isGroup = message.isGroupMsg === true;

    // envia para n8n
    if (WEBHOOK_URL) {
      try {
        await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from: message.from,
            sender: message.sender,
            body: message.body,
            isGroup,
            chatId: message.chatId,
            timestamp: message.timestamp,
          }),
        });
        console.log("➡️ Enviado para webhook n8n");
      } catch (e) {
        console.error("Erro ao enviar para webhook:", e);
      }
    }
  });

  // Endpoint para enviar mensagem manualmente
  app.post("/send", async (req, res) => {
    const { to, message } = req.body;

    try {
      await client.sendText(to, message);
      res.json({ status: "sent" });
    } catch (err) {
      res.status(500).json({ error: err.toString() });
    }
  });
}

// -------- Web server (Render requires it) --------
app.get("/", (req, res) => {
  res.send("Venom WhatsApp API rodando!");
});

app.listen(PORT, () => {
  console.log("🌐 Servidor ativo na porta " + PORT);
});
