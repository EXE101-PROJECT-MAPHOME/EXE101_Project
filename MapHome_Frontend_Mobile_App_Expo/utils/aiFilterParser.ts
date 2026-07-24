import { AI_URL } from "./api";
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PriceFilter = "all" | "under3" | "3to5" | "over5";
export type AreaFilter = "all" | "under20" | "20to30" | "over30";
export type AmenitiesFilter = Record<"wifi" | "parking" | "ac" | "kitchen" | "refrigerator", boolean>;

export interface MobileAIParsedFilters {
  keyword?: string;
  priceFilter?: PriceFilter;
  areaFilter?: AreaFilter;
  verifyFilter?: boolean;
  amenities?: Partial<AmenitiesFilter>;
}

export const parseFiltersWithAI = async (
  query: string
): Promise<MobileAIParsedFilters> => {
  const token = await AsyncStorage.getItem("token");
  
  const systemPrompt = `You are an AI assistant that extracts real estate search filters from user natural language queries.
Your goal is to parse the user's query and return a strict JSON object that matches the following structure:
{
  "keyword": "string", // Extract any location, street name, district, or specific property name mentioned. Leave empty if none.
  "priceFilter": "under3" | "3to5" | "over5" | "all", // under3 = below 3 million, 3to5 = 3 to 5 million, over5 = above 5 million VND.
  "areaFilter": "under20" | "20to30" | "over30" | "all", // under20 = below 20m2, 20to30 = 20 to 30m2, over30 = above 30m2.
  "amenities": {
    "wifi": boolean,
    "parking": boolean,
    "ac": boolean, // máy lạnh, điều hòa
    "kitchen": boolean, // nhà bếp, bếp
    "refrigerator": boolean // tủ lạnh
  },
  "verifyFilter": boolean // true if user wants safe/verified properties
}

IMPORTANT RULES:
1. ONLY return the JSON object. Do not include any other text or markdown blocks (\`\`\`json).
2. If a specific filter is not mentioned, you MUST OMIT it entirely from the JSON so the current state remains unaffected.
3. If the user asks for "giá dưới 3 triệu ở Quận 1", return {"keyword": "Quận 1", "priceFilter": "under3"}.
4. If the user asks for "có máy lạnh và ban công", return {"amenities": { "ac": true }} (since balcony is not in our amenities list, ignore it).

User Query: "${query}"`;

  try {
    const response = await fetch(`${AI_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-api-key": process.env.EXPO_PUBLIC_MAPHOME_AI_API_KEY || "maphome_secret_key_123",
      },
      body: JSON.stringify({
        message: systemPrompt,
        provider: "auto",
        history: [],
      }),
    });

    const fullText = await response.text();
    const lines = fullText.split("\n");
    let accumulatedText = "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const dataStr = line.slice(6).trim();
        if (dataStr === "[DONE]") break;
        try {
          const data = JSON.parse(dataStr);
          if (data.content) {
            accumulatedText += data.content;
          }
        } catch (err) {}
      }
    }

    let jsonStr = accumulatedText.trim();
    if (jsonStr.startsWith("\`\`\`json")) {
      jsonStr = jsonStr.replace(/^\`\`\`json\n?/, "").replace(/\n?\`\`\`$/, "");
    } else if (jsonStr.startsWith("\`\`\`")) {
      jsonStr = jsonStr.replace(/^\`\`\`\n?/, "").replace(/\n?\`\`\`$/, "");
    }
    
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const parsedData = JSON.parse(jsonStr) as MobileAIParsedFilters;
    return parsedData;
  } catch (error) {
    console.error("AI parsing error:", error);
    return {};
  }
};
