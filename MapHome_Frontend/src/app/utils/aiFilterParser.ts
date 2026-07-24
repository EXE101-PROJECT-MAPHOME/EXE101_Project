import { AI_URL } from "./api";
import { RentalFilters } from "@/app/components/types";

export const parseFiltersWithAI = async (
  query: string,
  currentFilters: RentalFilters
): Promise<Partial<RentalFilters> & { keyword?: string }> => {
  const token = localStorage.getItem("token");
  
  // System Prompt to instruct the AI to return ONLY JSON
  const systemPrompt = `You are an AI assistant that extracts real estate search filters from user natural language queries.
Your goal is to parse the user's query and return a strict JSON object that matches the following structure:
{
  "keyword": "string", // Extract any location, street name, district, or specific property name mentioned (e.g. "Quận 1", "Đại học Bách Khoa", "Thủ Đức"). Leave empty if none.
  "priceRange": [min, max], // in VND (e.g. 3 triệu = 3000000). If max is not specified, use 99999999. If min is not specified, use 0.
  "areaRange": [min, max], // in square meters (m2).
  "amenities": {
    "wifi": boolean,
    "furniture": boolean, // full nội thất
    "tv": boolean,
    "washingMachine": boolean, // máy giặt
    "kitchen": boolean, // nhà bếp
    "refrigerator": boolean, // tủ lạnh
    "airConditioner": boolean // máy lạnh, điều hòa
  },
  "verificationLevel": "all" | "verified" | "none", // verified if user wants safe/verified properties
  "availability": "all" | "available" | "unavailable"
}

IMPORTANT RULES:
1. ONLY return the JSON object. Do not include any other text, markdown blocks (\`\`\`json), or explanations.
2. If a specific filter is not mentioned in the query, DO NOT include it in the JSON (so we can keep the user's current filter state for those).
3. If the user asks for "giá dưới 3 triệu ở Quận 1", return "keyword": "Quận 1", "priceRange": [0, 3000000].
4. If the user asks for "có máy lạnh và ban công", return "amenities": { "airConditioner": true } (since balcony is not in our amenities list, ignore it).

User Query: "${query}"`;

  try {
    const response = await fetch(`${AI_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-api-key": (import.meta as any).env?.VITE_MAPHOME_AI_API_KEY || "maphome_secret_key_123",
      },
      body: JSON.stringify({
        message: systemPrompt,
        provider: "auto", // or gemini/groq
        history: [],
      }),
    });

    if (!response.body) throw new Error("No response body");

    // Read the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let finished = false;
    let accumulatedText = "";

    while (!finished) {
      const { value, done } = await reader.read();
      finished = done;
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.slice(6).trim();
          if (dataStr === "[DONE]") {
            finished = true;
            break;
          }
          try {
            const data = JSON.parse(dataStr);
            if (data.content) {
              accumulatedText += data.content;
            }
          } catch (err) {}
        }
      }
    }

    // Clean up accumulated text (remove markdown json blocks if AI disobeys rule 1)
    let jsonStr = accumulatedText.trim();
    if (jsonStr.startsWith("\`\`\`json")) {
      jsonStr = jsonStr.replace(/^\`\`\`json\n?/, "").replace(/\n?\`\`\`$/, "");
    } else if (jsonStr.startsWith("\`\`\`")) {
      jsonStr = jsonStr.replace(/^\`\`\`\n?/, "").replace(/\n?\`\`\`$/, "");
    }
    
    // Attempt to extract JSON if there's surrounding text
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const parsedData = JSON.parse(jsonStr) as Partial<RentalFilters>;
    
    // Ensure the amenities object only contains valid boolean keys, if present
    if (parsedData.amenities) {
      const currentAmenities = currentFilters.amenities;
      parsedData.amenities = {
        ...currentAmenities,
        ...parsedData.amenities,
      };
    }
    
    return parsedData;
  } catch (error) {
    console.error("Failed to parse filters with AI:", error);
    return {};
  }
};
