# Especificación — Habla con la Máquina

## Objetivo
Prototipo de chat que consume la API de Groq y hace visibles y medibles los
datos de la conversación (consumo de tokens y métricas del modelo).

## Requisitos funcionales
- El usuario escribe un mensaje y recibe la respuesta de la IA.
- El historial completo de la conversación se muestra en pantalla,
  con mensajes del usuario y de la IA visualmente diferenciados.
- Panel de métricas de la sesión:
  - Tokens de prompt acumulados.
  - Tokens de completado acumulados.
  - Total de tokens acumulados.
  - Al menos una métrica extra: modelo, tiempo de respuesta o tokens/seg.
- Botón "Borrar conversación" que reinicia la sesión.
- El historial sobrevive a una recarga de página.

## Requisitos técnicos
- Llamada a la API con `fetch` nativo, sin SDK ni wrappers.
- Cabeceras en cada petición: `Authorization: Bearer <clave>` y
  `Content-Type: application/json`.
- La clave se lee de una variable de entorno, nunca escrita en el código.
- En cada llamada se envía el historial completo (la API es stateless;
  el estado lo gestiona el cliente).
- Flujo asíncrono con `async/await` y estado de carga ("pensando…").
- Errores de la API (código != 2xx) capturados y mostrados de forma legible.
- Estado gestionado con `useState`; persistencia con `useEffect` + `localStorage`.

## Criterios de aceptación (qué se evalúa)
- [ ] La API se llama con `fetch` incluyendo ambas cabeceras en cada petición.
- [ ] El historial completo se envía en cada llamada.
- [ ] La promesa se gestiona con `async/await` y se muestra estado de carga.
- [ ] Los errores se muestran al usuario sin fallos silenciosos.
- [ ] `useState` gestiona mensajes, carga y métricas.
- [ ] `useEffect` carga y sincroniza el historial desde `localStorage`.
- [ ] Los tokens del objeto `usage` se acumulan y muestran en toda la sesión.
- [ ] La conversación persiste tras recarga y puede borrarse manualmente.
- [ ] Hay al menos una métrica extra visible además del conteo de tokens.

## Fuera de alcance
- El diseño visual no se evalúa: un layout funcional y legible es suficiente.

## Notas / decisiones abiertas
- **Modelo:** el brief menciona `qwen/qwen3.6-27b`. Se usará un id vigente 
del plan gratuito, verificado en la consola de Groq antes de entregar.
- **Seguridad:** `NEXT_PUBLIC_` expone la clave en el navegador; es lo que
  pide el brief para el prototipo. En producción se movería a un backend.