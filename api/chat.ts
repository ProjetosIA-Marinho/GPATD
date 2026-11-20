import { GoogleGenerativeAI } from "@google/generative-ai";

// Origens autorizadas a chamar esta API (ajuste se mudar de domínio).
const ALLOWED_ORIGINS = [
  'https://gpatdafa.com',
  'https://www.gpatdafa.com',
  'http://localhost:3000',
];

// Limites de entrada para conter abuso/custo
const MAX_MESSAGE_CHARS = 8000;
const MAX_HISTORY_ITEMS = 20;

export default async function handler(req: any, res: any) {
  // CORS restrito: só reflete a origem se estiver na lista de permitidas.
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    if (message.length > MAX_MESSAGE_CHARS) {
      return res.status(413).json({ error: "Mensagem muito longa." });
    }
    const safeHistory = Array.isArray(history) ? history.slice(-MAX_HISTORY_ITEMS) : [];

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

    return res.status(200).json({ text });
  } catch (error: any) {
    // Loga o detalhe no servidor, mas não expõe ao cliente.
    console.error("AI Error:", error);
    return res.status(500).json({ error: "Falha ao gerar resposta." });
  }
}
