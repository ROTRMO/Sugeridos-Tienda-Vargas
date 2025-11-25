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
  minWarehouse: number,
  maxStore: number,
  maxWarehouse: number
): Promise<string> => {
  try {
    const ai = initGenAI();
    
    const prompt = `
      Act as an expert Supply Chain Analyst. Analyze the following inventory situation for a retail business with 2 Bodegas and 1 CEDI (Warehouse).
      
      Configuration:
      - Minimum Stock Target per Bodega: ${minStore} units
      - Maximum Stock Target per Bodega: ${maxStore} units
      - Minimum Stock Target for CEDI: ${minWarehouse} units
      - Maximum Stock Target for CEDI: ${maxWarehouse} units
      
      Current Stats:
      - Total SKUs: ${stats.totalItems}
      - Total CEDI Stock: ${stats.totalWhStock}
      - Bodega 1 Total Stock: ${stats.totalS1Stock}
      - Bodega 6 Total Stock: ${stats.totalS2Stock}
      - Total PO Suggested (Min/Max based): ${stats.totalPoNeeded}
      - Total PO Suggested (Sales Based): ${stats.totalPoBySales}

      Top 5 Critical Items (Based on High Sales-Based PO Needs):
      ${topCriticalItems.map(i => `- ${i.description} (ID: ${i.id}): Total 3M Sales=${i.total3MonthSales}, System Stock=${i.whQty + i.s1Qty + i.s2Qty}, Sales PO=${i.poBySales}`).join('\n')}

      Please provide a concise, bulleted executive summary. 
      1. Highlights of the inventory health, specifically comparing if the stock is aligning with the 3-month sales history.
      2. Specific actionable advice regarding stock balancing.
      3. Assessment of the discrepancies between the Min/Max PO suggestion and the Sales-Based PO suggestion.
      4. Urgency of the suggested purchase orders for high-selling items.
      
      Keep it professional and under 250 words.
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