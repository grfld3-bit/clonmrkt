import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import TelegramBot from "node-telegram-bot-api";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf-8"));
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Initialize Google Generative AI (FIXED)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Initialize Telegram Bot
const token = process.env.TELEGRAM_BOT_TOKEN;
let bot: TelegramBot | null = null;

// Helper function to extract product data from URL (Fallback)
function extractProductFromUrl(url: string) {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    
    return {
      name: params.get("name") || "Unknown Product",
      price: parseFloat(params.get("price") || "0"),
      imageUrl: params.get("image") || "https://via.placeholder.com/200",
      number: params.get("id") || params.get("number") || "N/A"
    };
  } catch (error) {
    console.error("URL parsing error:", error);
    return null;
  }
}

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
        // FIXED: Use correct GoogleGenerativeAI API
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        
        const prompt = `Extract product details from this Telegram Marketplace link: ${text}. 
        If you cannot access the link, try to search for the product ID or use general knowledge about MRKT gifts.
        Return ONLY valid JSON (no markdown, no extra text) with these exact fields: name, price (number in USD), imageUrl (high quality URL), number (e.g. #123456).
        Example response: {"name": "Item Name", "price": 9.99, "imageUrl": "https://...", "number": "#123456"}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const responseText = response.text();

        // FIXED: Better JSON parsing with validation
        let data;
        try {
          // Try to extract JSON from response (in case it includes markdown)
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            data = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error("No JSON found in response");
          }
        } catch (parseError) {
          console.warn("JSON parse failed, using fallback extraction:", parseError);
          data = extractProductFromUrl(text);
          
          if (!data) {
            throw new Error("Fallback extraction also failed");
          }
        }

        // Validate required fields
        if (!data.name || data.price === undefined) {
          throw new Error("Missing required fields: name or price");
        }

        // FIXED: Auto-deploy to Firestore
        const docRef = await addDoc(collection(db, "gifts"), {
          name: String(data.name).trim(),
          price: Number(data.price),
          imageUrl: String(data.imageUrl || "https://via.placeholder.com/200"),
          number: String(data.number || "N/A"),
          marketplaceUrl: text,
          createdAt: serverTimestamp(),
          createdBy: 'telegram_bot',
          category: 'Gifts'
        });

        console.log("✅ Document added with ID:", docRef.id);
        bot?.sendMessage(chatId, `✅ Berhasil! Item "${data.name}" telah ditambahkan ke marketplace.\n💰 Price: $${data.price}`);
        
      } catch (error) {
        console.error("🔴 Bot Error:", error);
        bot?.sendMessage(chatId, "❌ Gagal memproses link. Pastikan link valid atau coba lagi nanti.");
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

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
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
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();