import { InventoryItem, InventoryStats } from '../types';

export const calculateBalancing = (
  items: Omit<InventoryItem, 's1Deficit' | 's2Deficit' | 'whDeficit' | 'whToS1' | 'whToS2' | 's1ToS2' | 's2ToS1' | 'poQty' | 'status'>[],
  minPerStore: number,
  minPerWarehouse: number
): { processedItems: InventoryItem[], stats: InventoryStats } => {
  
  let totalPoNeeded = 0;
  let itemsBelowMin = 0;
  let totalWhStock = 0;
  let totalS1Stock = 0;
  let totalS2Stock = 0;

  const processedItems: InventoryItem[] = items.map(item => {
    totalWhStock += item.whQty;
    totalS1Stock += item.s1Qty;
    totalS2Stock += item.s2Qty;

    // 1. Calculate Initial Store Deficits
    const s1Deficit = Math.max(0, minPerStore - item.s1Qty);
    const s2Deficit = Math.max(0, minPerStore - item.s2Qty);

    // Note: We don't count WH deficit in "itemsBelowMin" necessarily, or do we? 
    // Usually "Below Min" refers to availability at sales point (stores). 
    // Let's keep it as store-focused for the "Below Min" KPI, but could expand.
    if (s1Deficit > 0 || s2Deficit > 0) {
      itemsBelowMin++;
    }

    // 2. Warehouse Replenishment Logic (Distribute existing WH stock to stores)
    let currentWh = item.whQty;
    
    // Fulfill S1 from WH
    const whToS1 = Math.min(s1Deficit, currentWh);
    currentWh -= whToS1;
    let s1RemainingDeficit = s1Deficit - whToS1;

    // Fulfill S2 from WH
    const whToS2 = Math.min(s2Deficit, currentWh);
    currentWh -= whToS2;
    let s2RemainingDeficit = s2Deficit - whToS2;

    // 3. Lateral Transfer Logic (Store to Store)
    let s1ToS2 = 0;
    let s2ToS1 = 0;

    // Check if S1 can help S2
    if (s2RemainingDeficit > 0) {
      const s1Surplus = Math.max(0, item.s1Qty - minPerStore);
      if (s1Surplus > 0) {
        s1ToS2 = Math.min(s1Surplus, s2RemainingDeficit);
        s2RemainingDeficit -= s1ToS2;
      }
    }

    // Check if S2 can help S1
    if (s1RemainingDeficit > 0) {
      const s2Surplus = Math.max(0, item.s2Qty - minPerStore);
      if (s2Surplus > 0) {
        s2ToS1 = Math.min(s2Surplus, s1RemainingDeficit);
        s1RemainingDeficit -= s2ToS1;
      }
    }

    // 4. Warehouse Deficit Calculation
    // After giving stock to stores, does WH have enough to meet its own minimum?
    // currentWh now holds the remaining stock after distributions
    const whDeficit = Math.max(0, minPerWarehouse - currentWh);

    // 5. Purchase Order Logic
    // Buy enough to cover remaining store deficits AND replenish warehouse to its minimum
    const poQty = s1RemainingDeficit + s2RemainingDeficit + whDeficit;
    totalPoNeeded += poQty;

    // 6. Status
    let status: InventoryItem['status'] = 'OK';
    if (poQty > 0) status = 'Critical';
    else if (whToS1 > 0 || whToS2 > 0 || s1ToS2 > 0 || s2ToS1 > 0) status = 'Review';

    return {
      ...item,
      s1Deficit,
      s2Deficit,
      whDeficit,
      whToS1,
      whToS2,
      s1ToS2,
      s2ToS1,
      poQty,
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
      itemsBelowMin
    }
  };
};