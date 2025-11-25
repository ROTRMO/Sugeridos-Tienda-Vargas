export interface InventoryItem {
  id: string; // From Column B
  description: string; // From Column C
  whQty: number; // From Column N
  s1Qty: number; // From Column O
  s2Qty: number; // From Column P
  
  // Calculated fields
  s1Deficit: number;
  s2Deficit: number;
  whDeficit: number; // New field for Warehouse Deficit
  whToS1: number;
  whToS2: number;
  s1ToS2: number; // Lateral transfer
  s2ToS1: number; // Lateral transfer
  poQty: number;
  status: 'OK' | 'Review' | 'Critical';
}

export interface InventoryStats {
  totalItems: number;
  totalWhStock: number;
  totalS1Stock: number;
  totalS2Stock: number;
  totalPoNeeded: number;
  itemsBelowMin: number;
}