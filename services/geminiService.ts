import { GoogleGenAI } from "@google/genai";
import { InventoryItem, InventoryStats } from "../types";

const initGenAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateInventoryInsights = async (
  stats: InventoryStats,
  topCriticalItems: InventoryItem[],
  minStore: number,
  minWarehouse: number
): Promise<string> => {
  try {
    const ai = initGenAI();
    
    const prompt = `
      Act as an expert Supply Chain Analyst. Analyze the following inventory situation for a retail business with 2 Bodegas and 1 CEDI (Warehouse).
      
      Configuration:
      - Minimum Stock Target per Bodega: ${minStore} units
      - Minimum Stock Target for CEDI: ${minWarehouse} units
      
      Current Stats:
      - Total SKUs: ${stats.totalItems}
      - Total CEDI Stock: ${stats.totalWhStock}
      - Bodega 1 Total Stock: ${stats.totalS1Stock}
      - Bodega 6 Total Stock: ${stats.totalS2Stock}
      - Items with Bodega Deficits: ${stats.itemsBelowMin}
      - Total Suggested Purchase Order Qty: ${stats.totalPoNeeded}

      Top 5 Critical Items (High PO Needs):
      ${topCriticalItems.map(i => `- ${i.description} (ID: ${i.id}): CEDI=${i.whQty}, B1=${i.s1Qty}, B6=${i.s2Qty}, CEDI Deficit=${i.whDeficit}, Total PO=${i.poQty}`).join('\n')}

      Please provide a concise, bulleted executive summary. 
      1. Highlights of the inventory health.
      2. Specific actionable advice regarding stock balancing between Bodegas and CEDI replenishment.
      3. Assessment of the current minimum stock levels (${minStore} for Bodegas, ${minWarehouse} for CEDI).
      4. Urgency of the suggested purchase orders.
      
      Keep it professional and under 200 words.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate AI insights at this time. Please check your API key configuration.";
  }
};