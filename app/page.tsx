"use client";

import { useState, useEffect } from "react";

// Verificado contra /openai/v1/models de la cuenta.
const MODEL = "qwen/qwen3.8-27b";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const LS_MESSAGES = "groq-chat-messages";
const LS_STATS = "groq-chat-stats";

type Message = { role: "user" | "assistant"; content: string };

type Stats = {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  lastModel: string;
  lastResponseMs: number;
  lastTokensPerSec: number;
};

const EMPTY_STATS: Stats = {
  totalPromptTokens: 0,
  totalCompletionTokens: 0,
  totalTokens: 0,
  lastModel: "",
  lastResponseMs: 0,
  lastTokensPerSec: 0,
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [isLoaded, setIsLoaded] = useState(false); // 🔑 interruptor anti-borrado

  // 1) Al montar: cargamos de localStorage y recién ahí activamos el guardado
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(LS_MESSAGES);
      const savedStats = localStorage.getItem(LS_STATS);
      if (savedMessages) setMessages(JSON.parse(savedMessages));
      if (savedStats) setStats(JSON.parse(savedStats));
    } catch (e) {
      console.error("No se pudo leer localStorage:", e);
    } finally {
      setIsLoaded(true); // desde acá sí se puede guardar
    }
  }, []);

  // 2) Guardamos mensajes SOLO después de haber cargado
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(LS_MESSAGES, JSON.stringify(messages));
  }, [messages, isLoaded]);

  // 3) Guardamos métricas SOLO después de haber cargado
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(LS_STATS, JSON.stringify(stats));
  }, [stats, isLoaded]);

  async function handleSend() {
    const text = input.trim();
    if (!text) return;

    const userMessage: Message = { role: "user", content: text };
    const newHistory = [...messages, userMessage];

    setMessages(newHistory);
    setInput("");
    setLoading(true);

    const startedAt = performance.now();

    try {
      const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        let detalle = "";
        try {
          const errorBody = await res.json();
          detalle = errorBody?.error?.message ?? "";
        } catch {
          /* la respuesta de error no era JSON */
        }
        throw new Error(`Error ${res.status}${detalle ? `: ${detalle}` : ""}`);
      }

      const data = await res.json();
      const elapsedMs = performance.now() - startedAt;

      const reply: Message = {
        role: "assistant",
        content: data.choices[0].message.content,
      };
      setMessages((prev) => [...prev, reply]);

      const usage = data.usage ?? {};
      const promptTokens = usage.prompt_tokens ?? 0;
      const completionTokens = usage.completion_tokens ?? 0;
      const totalThisCall = usage.total_tokens ?? promptTokens + completionTokens;

      const completionTime =
        typeof usage.completion_time === "number"
          ? usage.completion_time
          : elapsedMs / 1000;
      const tokensPerSec =
        completionTime > 0 ? completionTokens / completionTime : 0;

      setStats((prev) => ({
        totalPromptTokens: prev.totalPromptTokens + promptTokens,
        totalCompletionTokens: prev.totalCompletionTokens + completionTokens,
        totalTokens: prev.totalTokens + totalThisCall,
        lastModel: data.model ?? MODEL,
        lastResponseMs: Math.round(elapsedMs),
        lastTokensPerSec: Math.round(tokensPerSec * 10) / 10,
      }));
    } catch (error) {
      console.error(error);
      const mensaje =
        error instanceof Error ? error.message : "Error inesperado.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ ${mensaje}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clearConversation() {
    setMessages([]);
    setStats(EMPTY_STATS);
    localStorage.removeItem(LS_MESSAGES);
    localStorage.removeItem(LS_STATS);
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex justify-center p-4">
      <div className="w-full max-w-2xl flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Habla con la Máquina</h1>
          <button
            onClick={clearConversation}
            disabled={loading}
            className="bg-slate-700 hover:bg-slate-600 text-sm px-3 py-2 rounded-lg disabled:opacity-50"
          >
            Borrar conversación
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <Metric label="Tokens prompt" value={stats.totalPromptTokens} />
          <Metric label="Tokens completado" value={stats.totalCompletionTokens} />
          <Metric label="Total tokens" value={stats.totalTokens} />
          <Metric label="Modelo" value={stats.lastModel || MODEL} />
          <Metric
            label="Tiempo resp."
            value={stats.lastResponseMs ? `${stats.lastResponseMs} ms` : "—"}
          />
          <Metric label="Tokens/seg" value={stats.lastTokensPerSec || "—"} />
        </div>

        <div className="flex-1 bg-slate-800 rounded-xl p-4 mb-4 min-h-[45vh] overflow-y-auto space-y-2">
          {messages.length === 0 && (
            <p className="text-slate-500 text-center mt-8">
              Escribí un mensaje para empezar.
            </p>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-3 py-2 ${
                  m.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-100"
                }`}
              >
                <span className="block text-[10px] uppercase opacity-60 mb-1">
                  {m.role === "user" ? "Vos" : "IA"}
                </span>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-xl px-3 py-2 bg-slate-700 text-slate-100">
                <span className="block text-[10px] uppercase opacity-60 mb-1">
                  IA
                </span>
                pensando…
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Escribí tu mensaje…"
            className="flex-1 rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 outline-none"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 rounded-lg disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-800 rounded-lg px-2 py-2 text-center">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[11px] text-slate-400">{label}</div>
    </div>
  );
}