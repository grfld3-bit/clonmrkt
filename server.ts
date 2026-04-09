import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import TelegramBot from "node-telegram-bot-api";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf-8"));
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Initialize AI for parsing fallback
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Initialize Telegram Bot
const token = process.env.TELEGRAM_BOT_TOKEN;
let bot: TelegramBot | null = null;

if (token) {
  bot = new TelegramBot(token, { polling: true });
  console.log("Telegram Bot initialized");

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    const isMarketLink = text?.includes('mrkt.com') || text?.includes('t.me/mrkt');

    if (text === '/start') {
      bot?.sendMessage(chatId, "Halo! Kirimkan link marketplace 'mrkt' (mrkt.com atau t.me/mrkt) untuk menambahkan item ke marketplace.");
      return;
    }

    if (isMarketLink) {
      bot?.sendMessage(chatId, "Link diterima! Sedang memproses item...");
      
      try {
        // Use recommended model and correct API call with Google Search for better parsing
        const response = await (ai.models as any).generateContent({
          model: "gemini-3-flash-preview",
          contents: `Extract product details from this Telegram Marketplace link: ${text}. 
          If you cannot access the link, try to search for the product ID or use general knowledge about MRKT gifts.
          Return JSON: name, price (number in USD), imageUrl (high quality), number (e.g. #123456).`,
          tools: [{ googleSearch: {} }],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                price: { type: Type.NUMBER },
                imageUrl: { type: Type.STRING },
                number: { type: Type.STRING }
              },
              required: ["name", "price", "imageUrl", "number"]
            }
          }
        });

        const data = JSON.parse(response.text);
        
        // Save to Firestore
        await addDoc(collection(db, "gifts"), {
          ...data,
          marketplaceUrl: text,
          createdAt: serverTimestamp(),
          createdBy: 'telegram_bot',
          category: 'Gifts'
        });

        bot?.sendMessage(chatId, `✅ Berhasil! Item "${data.name}" telah ditambahkan ke marketplace.`);
      } catch (error) {
        console.error("Bot Error:", error);
        bot?.sendMessage(chatId, "❌ Gagal memproses link. Pastikan link valid.");
      }
    }
  });
} else {
  console.warn("TELEGRAM_BOT_TOKEN is missing. Telegram Bot features will not work.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Proxy for tgmrkt-api (Python) - Deprecated in favor of Telegram Bot
  app.post("/api/parse-gift", async (req, res) => {
    res.status(410).json({ error: "Use Telegram Bot instead" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
