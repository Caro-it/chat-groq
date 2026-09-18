"use client";

import { useState } from "react";

// ⚠️ Verificá el id vigente del plan gratuito en https://console.groq.com/docs/models
// "llama-3.3-70b-versatile" lo pude confirmar por búsqueda; "qwen/qwen3.6-27b" NO.
const MODEL = "qwen/qwen3.8-27b";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

type Message = { role: "user" | "assistant"; content: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  // async porque vamos a esperar la respuesta de la API
  async function handleSend() {
    const text = input.trim();
    if (!text) return;

    const userMessage: Message = { role: "user", content: text };
    // OJO: construimos el historial nuevo acá, en una variable local.
    // No podemos confiar en "messages" todavía porque setMessages es asíncrono
    // y aún no incluye este mensaje.
    const newHistory = [...messages, userMessage];

    setMessages(newHistory); // pintamos tu mensaje ya mismo
    setInput("");            // limpiamos el campo

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
          // Enviamos TODO el historial: la API no guarda estado,
          // el contexto lo manda el cliente en cada llamada.
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      // Sacamos el texto de la respuesta de la estructura que devuelve Groq
      const reply: Message = {
        role: "assistant",
        content: data.choices[0].message.content,
      };

      setMessages((prev) => [...prev, reply]);
    } catch (error) {
      // Manejo básico por ahora; en la Fase 3 lo mejoramos
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Hubo un error al llamar a la API." },
      ]);
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
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 rounded-lg"
          >
            Enviar
          </button>
        </div>
      </div>
    </main>
  );
}