export interface InventoryItem {
  id: string; // From Column B
  description: string; // From Column C
  
  // Sales Data
  sales2MonthsAgo: number; // Column J
  sales1MonthAgo: number; // Column K
  salesCurrentMonth: number; // Column L
  total3MonthSales: number; // Column M

  // Inventory Data
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
  
  poQty: number; // Based on Min/Max logic
  poBySales: number; // New: Based on Sales vs Inventory
  
  status: 'OK' | 'Review' | 'Critical';
}

export interface InventoryStats {
  totalItems: number;
  totalWhStock: number;
  totalS1Stock: number;
  totalS2Stock: number;
  totalPoNeeded: number;
  totalPoBySales: number; // New stat
  itemsBelowMin: number;
}