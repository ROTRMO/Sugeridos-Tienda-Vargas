import { InventoryItem, InventoryStats } from '../types';

export const calculateBalancing = (
  items: Omit<InventoryItem, 's1Deficit' | 's2Deficit' | 'whDeficit' | 'whToS1' | 'whToS2' | 's1ToS2' | 's2ToS1' | 'poQty' | 'poBySales' | 'status'>[],
  minPerStore: number,
  minPerWarehouse: number,
  maxPerStore: number,
  maxPerWarehouse: number
): { processedItems: InventoryItem[], stats: InventoryStats } => {
  
  let totalPoNeeded = 0;
  let totalPoBySales = 0;
  let itemsBelowMin = 0;
  let totalWhStock = 0;
  let totalS1Stock = 0;
  let totalS2Stock = 0;

  const processedItems: InventoryItem[] = items.map(item => {
    totalWhStock += item.whQty;
    totalS1Stock += item.s1Qty;
    totalS2Stock += item.s2Qty;

    // --- PHASE 1: INITIAL DEFICITS (MIN LEVELS) ---
    // Calculate how much each store is missing to reach MINIMUM
    const s1Deficit = Math.max(0, minPerStore - item.s1Qty);
    const s2Deficit = Math.max(0, minPerStore - item.s2Qty);

    if (s1Deficit > 0 || s2Deficit > 0) {
      itemsBelowMin++;
    }

    // --- PHASE 2: WAREHOUSE REPLENISHMENT (TO MIN) ---
    let currentWh = item.whQty;
    
    // Fulfill S1 MIN from WH
    const whToS1_Min = Math.min(s1Deficit, currentWh);
    currentWh -= whToS1_Min;
    let s1RemainingDeficit = s1Deficit - whToS1_Min;

    // Fulfill S2 MIN from WH
    const whToS2_Min = Math.min(s2Deficit, currentWh);
    currentWh -= whToS2_Min;
    let s2RemainingDeficit = s2Deficit - whToS2_Min;

    // --- PHASE 3: LATERAL TRANSFERS (Store to Store for MIN) ---
    let s1ToS2 = 0;
    let s2ToS1 = 0;

    // Check if S1 can help S2 reach MIN
    if (s2RemainingDeficit > 0) {
      const s1Surplus = Math.max(0, item.s1Qty - minPerStore);
      if (s1Surplus > 0) {
        s1ToS2 = Math.min(s1Surplus, s2RemainingDeficit);
        s2RemainingDeficit -= s1ToS2;
      }
    }

    // Check if S2 can help S1 reach MIN
    if (s1RemainingDeficit > 0) {
      const s2Surplus = Math.max(0, item.s2Qty - minPerStore);
      if (s2Surplus > 0) {
        s2ToS1 = Math.min(s2Surplus, s1RemainingDeficit);
        s1RemainingDeficit -= s2ToS1;
      }
    }

    // --- PHASE 4: FILL TO MAX (If WH still has stock) ---
    // Calculate space available up to MAX
    const s1SpaceToMax = Math.max(0, maxPerStore - (item.s1Qty + whToS1_Min - s1ToS2 + s2ToS1));
    const s2SpaceToMax = Math.max(0, maxPerStore - (item.s2Qty + whToS2_Min - s2ToS1 + s1ToS2));
    
    // Distribute remaining WH stock to fill towards Max
    const whToS1_MaxFill = Math.min(s1SpaceToMax, currentWh);
    currentWh -= whToS1_MaxFill;

    const whToS2_MaxFill = Math.min(s2SpaceToMax, currentWh);
    currentWh -= whToS2_MaxFill;

    // Combine WH transfers
    const whToS1 = whToS1_Min + whToS1_MaxFill;
    const whToS2 = whToS2_Min + whToS2_MaxFill;

    // --- PHASE 5: WAREHOUSE DEFICIT & PO (MIN/MAX LOGIC) ---
    // 1. Ensure Stores reach MAX
    // 2. Ensure WH reaches MAX
    
    // Theoretical Final Stock Levels if we bought nothing:
    const finalS1 = item.s1Qty + whToS1 - s1ToS2 + s2ToS1;
    const finalS2 = item.s2Qty + whToS2 - s2ToS1 + s1ToS2;
    const finalWh = currentWh; // WH Remaining after transfers

    const s1ShortfallToMax = Math.max(0, maxPerStore - finalS1);
    const s2ShortfallToMax = Math.max(0, maxPerStore - finalS2);
    const whShortfallToMax = Math.max(0, maxPerWarehouse - finalWh);

    const poQty = s1ShortfallToMax + s2ShortfallToMax + whShortfallToMax;
    totalPoNeeded += poQty;

    // Wh Deficit just for reporting (Below Min)
    const whDeficit = Math.max(0, minPerWarehouse - item.whQty);

    // --- PHASE 6: PO BASED ON SALES ---
    // Logic: If Total Inventory (WH+S1+S2) < Total 3 Month Sales, Buy difference.
    // This implies aiming for 3 Months of Coverage based on recent history.
    const totalSystemStock = item.whQty + item.s1Qty + item.s2Qty;
    const poBySales = Math.max(0, item.total3MonthSales - totalSystemStock);
    totalPoBySales += poBySales;

    // --- STATUS ---
    let status: InventoryItem['status'] = 'OK';
    if (poQty > 0 || poBySales > 0) status = 'Critical';
    else if (whToS1 > 0 || whToS2 > 0 || s1ToS2 > 0 || s2ToS1 > 0) status = 'Review';

    return {
      ...item,
      s1Deficit, // Reporting original deficit against MIN
      s2Deficit, // Reporting original deficit against MIN
      whDeficit, // Reporting original deficit against MIN
      whToS1,
      whToS2,
      s1ToS2,
      s2ToS1,
      poQty,
      poBySales,
      status
    };
  });

  return {
    processedItems,
    stats: {
      totalItems: items.length,
      totalWhStock,
      totalS1Stock,
      totalS2Stock,
      totalPoNeeded,
      totalPoBySales,
      itemsBelowMin
    }
  };
};