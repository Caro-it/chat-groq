"use client";

import { useState } from "react";

// Verificado contra /openai/v1/models de la cuenta.
const MODEL = "qwen/qwen3.8-27b";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

type Message = { role: "user" | "assistant"; content: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    const text = input.trim();
    if (!text) return;

    const userMessage: Message = { role: "user", content: text };
    const newHistory = [...messages, userMessage];

    setMessages(newHistory);
    setInput("");
    setLoading(true);

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

      // Si la API responde con un código != 2xx, lo capturamos acá
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

      const reply: Message = {
        role: "assistant",
        content: data.choices[0].message.content,
      };

      setMessages((prev) => [...prev, reply]);
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

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex justify-center p-4">
      <div className="w-full max-w-2xl flex flex-col">
        <h1 className="text-2xl font-bold mb-4">Habla con la Máquina</h1>

        <div className="flex-1 bg-slate-800 rounded-xl p-4 mb-4 min-h-[50vh] overflow-y-auto space-y-2">
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