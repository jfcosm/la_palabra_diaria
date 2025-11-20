import { GoogleGenAI, Type } from "@google/genai";
import { DailyReadings, DailyContext } from "../types";

// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
// We assume this variable is pre-configured, valid, and accessible.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Fetches the liturgical readings using strict JSON schema.
 * Does NOT use Google Search to ensure pure text generation from the model's knowledge base of scripture.
 */
export const fetchDailyReadings = async (date: Date): Promise<DailyReadings> => {
  const dateString = date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const prompt = `Genera las lecturas de la misa católica para el día: ${dateString}. 
  Devuelve estrictamente el título, referencia bíblica y el texto completo de:
  1. Primera Lectura
  2. Salmo Responsorial (incluyendo la respuesta/antífona)
  3. Segunda Lectura (Si aplica para el día, ejemplo Domingos o Solemnidades, si no, null)
  4. Evangelio (Incluyendo aclamación previa si aplica)
  
  ADICIONALMENTE:
  Genera una "Reflexión Pastoral" (Homilía) de aproximadamente 300 palabras.
  Esta reflexión debe conectar las enseñanzas de la Primera Lectura y del Evangelio con la vida cotidiana actual.
  El tono debe ser cálido, esperanzador, pastoral y doctrinalmente correcto dentro de la fe católica.
  
  También incluye el tiempo litúrgico y el color litúrgico del día.
  El texto debe estar en español.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: "La fecha formateada en texto" },
          liturgical_season: { type: Type.STRING, description: "Tiempo litúrgico (ej. Adviento, Ordinario)" },
          liturgical_color: { type: Type.STRING, description: "Color litúrgico (ej. Verde, Morado, Blanco, Rojo)" },
          first_reading: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              reference: { type: Type.STRING },
              text: { type: Type.STRING }
            }
          },
          psalm: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              reference: { type: Type.STRING },
              response: { type: Type.STRING, description: "La antífona o respuesta del salmo" },
              text: { type: Type.STRING }
            }
          },
          second_reading: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              reference: { type: Type.STRING },
              text: { type: Type.STRING }
            },
            nullable: true
          },
          gospel: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              reference: { type: Type.STRING },
              acclamation: { type: Type.STRING, description: "Aclamación antes del evangelio" },
              text: { type: Type.STRING }
            }
          },
          reflection: {
            type: Type.OBJECT,
            description: "Reflexión pastoral u homilía basada en las lecturas",
            properties: {
              title: { type: Type.STRING, description: "Un título inspirador para la reflexión" },
              text: { type: Type.STRING, description: "El cuerpo del texto de la reflexión" }
            }
          }
        },
        required: ["date", "liturgical_season", "liturgical_color", "first_reading", "psalm", "gospel", "reflection"]
      }
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response text from Gemini");
  }

  return JSON.parse(text) as DailyReadings;
};

/**
 * Fetches context (News, Saint, Audio links) using Google Search Grounding.
 * We cannot use responseSchema/JSON mode with Search, so we ask for a Markdown JSON block.
 */
export const fetchDailyContext = async (date: Date): Promise<DailyContext> => {
  const dateString = date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Updated Prompt: We now ask Gemini to WRITE the news article based on search results.
  const prompt = `Para la fecha ${dateString}, actúa como un periodista católico digital para la app "La Palabra Diaria".
  Tu misión es investigar las 3 noticias más importantes y recientes del ámbito católico global, priorizando "Vatican News".

  Genera un JSON válido dentro de un bloque de código con esta estructura exacta:

  {
    "saint": { "name": "...", "description": "...", "wikipedia_url": "..." },
    "news": [
      {
        "title": "Título breve y atractivo",
        "summary": "Resumen corto de 2 líneas para la tarjeta.",
        "body": "Redacta aquí el ARTÍCULO COMPLETO (aprox 3 o 4 párrafos detallados). Usa la información encontrada en la búsqueda para escribir una nota informativa, cálida y fiel a los hechos. NO pongas Lorem Ipsum. Escribe la noticia real.",
        "url": "URL de la fuente original (si la encuentras, sino pon la home)",
        "source": "Vatican News"
      },
      ... (3 noticias en total)
    ],
    "audio_reflection": { "title": "...", "url": "...", "source_name": "La Buena Semilla" }
  }

  Instrucciones:
  1. "saint": Busca el santo de hoy.
  2. "news": CRÍTICO: Debes REDACTAR el campo "body" con contenido sustancial para que el usuario lea la noticia completa en mi app sin salir. 
  3. "audio_reflection": Busca el tema de hoy de "La buena semilla".

  IMPORTANTE: Devuelve SOLO el bloque JSON válido.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text;
  if (!text) throw new Error("No content from Gemini Search");

  // Extract JSON from markdown code block if present
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
  let jsonString = jsonMatch ? jsonMatch[1] : text;

  try {
    return JSON.parse(jsonString) as DailyContext;
  } catch (e) {
    console.error("Failed to parse Daily Context JSON", e, jsonString);
    // Return fallback structure
    return {
      saint: { name: "Santo del Día", description: "Información no disponible momentáneamente.", wikipedia_url: "https://es.wikipedia.org/wiki/Santoral_cat%C3%B3lico" },
      news: [],
      audio_reflection: { title: "La Buena Semilla", url: "https://labuenasemilla.com.ar/", source_name: "La Buena Semilla" }
    };
  }
};