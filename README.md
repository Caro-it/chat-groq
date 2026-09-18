# Habla con la Máquina — Chat con la API de Groq

Prototipo de interfaz de chat en Next.js que se comunica con un modelo de
lenguaje real vía la API de **Groq**, mostrando métricas de uso (tokens,
tiempo de respuesta) y persistiendo la conversación en el navegador.

Proyecto del bootcamp de Ingeniería de IA de 4Geeks Academy.

## Stack
- Next.js (App Router) + TypeScript
- React (`useState`, `useEffect`)
- Tailwind CSS
- API de Groq vía `fetch` (sin SDK)

## Requisitos previos
- Node.js instalado
- Una API Key gratuita de Groq → https://console.groq.com/keys

## Configuración
1. Cloná el repo e instalá dependencias:
```bash
   npm install
```
2. Creá un archivo `.env.local` en la raíz con tu clave:

   NEXT_PUBLIC_GROQ_API_KEY=gsk_tu_clave_aqui
   
   > La clave nunca se sube al repo (`.env.local` está en `.gitignore`).
3. Arrancá el servidor:
```bash
   npm run dev
```
4. Abrí http://localhost:3000

## Modelo
El modelo se define en `app/page.tsx` (constante `MODEL`).
Verificá la lista vigente del plan gratuito en
https://console.groq.com/docs/models antes de entregar.

## Entrega
Repositorio en GitHub, según las instrucciones del instructor.