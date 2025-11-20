import { GoogleGenAI, Type } from "@google/genai";
import { DailyReadings, DailyContext, LanguageCode } from "../types";

// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
// We assume this variable is pre-configured, valid, and accessible.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to map our app language codes to full language names for prompts
const getLanguageName = (lang: LanguageCode): string => {
  const map: Record<LanguageCode, string> = {
    'es': 'Español',
    'en': 'Inglés (English)',
    'fr': 'Francés (Français)',
    'it': 'Italiano',
    'de': 'Alemán (Deutsch)',
    'ko': 'Coreano (한국어)',
    'ja': 'Japonés (日本語)',
    'zh': 'Chino Simplificado (简体中文)'
  };
  return map[lang];
};

// Helper to map app language to locale for date formatting
const getLocale = (lang: LanguageCode): string => {
  const map: Record<LanguageCode, string> = {
    'es': 'es-ES',
    'en': 'en-US',
    'fr': 'fr-FR',
    'it': 'it-IT',
    'de': 'de-DE',
    'ko': 'ko-KR',
    'ja': 'ja-JP',
    'zh': 'zh-CN'
  };
  return map[lang];
};

/**
 * Fetches the liturgical readings using strict JSON schema.
 * Does NOT use Google Search to ensure pure text generation from the model's knowledge base of scripture.
 */
export const fetchDailyReadings = async (date: Date, language: LanguageCode): Promise<DailyReadings> => {
  const locale = getLocale(language);
  const dateString = date.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const langName = getLanguageName(language);

  const prompt = `Genera las lecturas de la misa católica para el día: ${dateString}.
  
  IMPORTANTE: Todo el contenido debe estar traducido perfectamente al idioma: ${langName}.
  
  Devuelve estrictamente el título, referencia bíblica y el texto completo de:
  1. Primera Lectura
  2. Salmo Responsorial (incluyendo la respuesta/antífona)
  3. Segunda Lectura (Si aplica para el día, ejemplo Domingos o Solemnidades, si no, null)
  4. Evangelio (Incluyendo aclamación previa si aplica)
  
  ADICIONALMENTE:
  Genera una "Reflexión Pastoral" (Homilía) de aproximadamente 300 palabras.
  Esta reflexión debe conectar las enseñanzas de la Primera Lectura y del Evangelio con la vida cotidiana actual.
  El tono debe ser cálido, esperanzador, pastoral y doctrinalmente correcto dentro de la fe católica.
  
  También incluye el tiempo litúrgico y el color litúrgico del día (Todo en ${langName}).`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: `La fecha formateada en texto en ${langName}` },
          liturgical_season: { type: Type.STRING, description: `Tiempo litúrgico en ${langName}` },
          liturgical_color: { type: Type.STRING, description: `Color litúrgico en ${langName}` },
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
export const fetchDailyContext = async (date: Date, language: LanguageCode): Promise<DailyContext> => {
  const locale = getLocale(language);
  const dateString = date.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const langName = getLanguageName(language);

  // Updated Prompt: We now ask Gemini to WRITE the news article based on search results in the target language.
  const prompt = `Para la fecha ${dateString}, actúa como un periodista católico digital para la app "La Palabra Diaria".
  Idioma de salida: ${langName}.
  
  Tu misión es investigar las 3 noticias más importantes y recientes del ámbito católico global.
  Prioriza fuentes oficiales como "Vatican News" en su edición de idioma ${langName} si existe.

  Genera un JSON válido dentro de un bloque de código con esta estructura exacta:

  {
    "saint": { "name": "...", "description": "Breve biografía en ${langName}", "wikipedia_url": "URL de Wikipedia en ${langName} (ej. es.wikipedia, en.wikipedia, it.wikipedia)" },
    "news": [
      {
        "title": "Título en ${langName}",
        "summary": "Resumen corto en ${langName}",
        "body": "Redacta aquí el ARTÍCULO COMPLETO en ${langName}. Usa la información encontrada para escribir una nota fiel.",
        "url": "URL de la fuente original",
        "source": "Nombre de la fuente (ej. Vatican News ${langName})"
      },
      ... (3 noticias en total)
    ],
    "audio_reflection": { "title": "...", "url": "...", "source_name": "..." }
  }

  Instrucciones:
  1. "saint": Busca el santo de hoy.
  2. "news": CRÍTICO: Redacta el campo "body" en ${langName}.
  3. "audio_reflection": Busca un audio o podcast católico diario relevante en idioma ${langName}. 
     - Si el idioma es Español ('es'), usa prioritariamente "La buena semilla".
     - Si es otro idioma, busca una reflexión diaria equivalente popular en ese idioma (ej. 'Pray as you go' en inglés, etc).
     - Si no encuentras uno específico, usa una fuente general del Vaticano.

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
    // Return fallback structure (localized minimally)
    const fallbackTitle = language === 'es' ? "Santo del Día" : "Saint of the Day";
    const fallbackDesc = language === 'es' ? "Información no disponible." : "Information temporarily unavailable.";
    
    return {
      saint: { name: fallbackTitle, description: fallbackDesc, wikipedia_url: "https://www.vaticannews.va/" },
      news: [],
      audio_reflection: { title: "Daily Reflection", url: "https://www.vaticannews.va/", source_name: "Vatican News" }
    };
  }
};