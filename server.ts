import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import legislacaoChatHandler from "./api/legislacao-chat";

dotenv.config();

const PORT = 3000;
const IS_PROD = process.env.NODE_ENV === "production";

async function startServer() {
  const app = express();
  app.use(express.json());

  // AI Endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      // 1. Verify token
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
        return res.status(401).json({ error: "Unauthorized: Missing token" });
      }

      const { createClient } = await import("@supabase/supabase-js");
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        return res.status(500).json({ error: "Supabase configuration is missing" });
      }

      const tempSupabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { user }, error: authError } = await tempSupabase.auth.getUser(token);

      if (authError || !user) {
        return res.status(401).json({ error: "Unauthorized: Invalid token" });
      }

      // 2. Validação de entrada (não confiar no front-end)
      const { message, history } = req.body || {};

      if (typeof message !== "string" || message.trim().length === 0) {
        return res.status(400).json({ error: "Mensagem inválida." });
      }
      if (message.length > 8000) {
        return res.status(413).json({ error: "Mensagem muito longa." });
      }
      const safeHistory = Array.isArray(history) ? history.slice(-20) : [];

      // 3. Chat logic
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "Serviço indisponível." });
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const chat = model.startChat({
        history: safeHistory,
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      const text = response.text();

      res.json({ text });
    } catch (error: any) {
      console.error("AI Error:", error);
      res.status(500).json({ error: "Falha ao gerar resposta." });
    }
  });

  // Chat GPATD (assistente normativo baseado nas legislações)
  app.post("/api/legislacao-chat", (req, res) => legislacaoChatHandler(req, res));

  // Vite middleware for development
  if (!IS_PROD) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
