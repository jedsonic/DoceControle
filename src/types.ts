/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ShippingRate {
  maxDistanceKm: number;
  price: number;
}

export interface User {
  id: string;
  username: string;
  businessName: string;
  createdAt: string;
  whatsapp?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  shippingRates?: ShippingRate[];
}

export interface Insumo {
  id: string;
  userId: string;
  description: string;
  unit: string; // e.g., 'g', 'kg', 'ml', 'L', 'un'
  costValue: number; // Cost price per unit
  currentStock: number; // Current stock of this raw material
  minStock: number; // Minimum stock warning limit
  updatedAt: string;
  packageQty?: number;
  packageCost?: number;
}

export interface RecipeIngredient {
  insumoId: string;
  quantity: number; // Quantity needed in the insumo's unit
}

export interface Recipe {
  id: string;
  userId: string;
  name: string;
  yieldAmount: number; // Yield quantity (e.g., 10, 1)
  yieldUnit: string; // e.g., 'unidades', 'fatias', 'kg', 'porções'
  ingredients: RecipeIngredient[];
  productionHours?: number; // Estimated production time in hours
  notes?: string;
  updatedAt: string;
}

export interface IndirectCostsConfig {
  userId: string;
  proLabore: number; // Pró-labore desejado (R$)
  utilities: number; // Gás, Energia e Água (R$)
  cleaningAndSupport: number; // Produtos de limpeza e Apoio (R$)
  otherExpenses?: number; // Outras despesas fixas (R$)
  workHoursCapacity: number; // Capacidade de Trabalho Comercial em horas (ex: 160h)
  updatedAt: string;
}

export interface ExtraCost {
  name: string;
  value: number;
}

export interface ProductionLot {
  id: string;
  userId: string;
  recipeId: string;
  name: string;
  yieldActual: number; // Real yield obtained
  costIngredients: number; // Subtotal cost of recipe raw materials
  costIndirect?: number; // Subtotal cost of indirect costs/hourly rate
  costExtra: ExtraCost[]; // e.g., packaging, electricity, labor, etc.
  costTotal: number; // costIngredients + costIndirect + sum(costExtra)
  costUnit: number; // costTotal / yieldActual
  suggestedPrice: number; // Price calculated using the 40/40/20 rule
  finalPrice: number; // Custom final price chosen by user
  date: string;
  status: 'production' | 'completed'; // 'completed' means sent to stock
  updatedAt: string;
}

export interface StockProduct {
  id: string;
  userId: string;
  name: string;
  lotId?: string; // Optional if created from a production lot or manually
  costUnit: number;
  priceSale: number;
  quantity: number;
  updatedAt: string;
  image?: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  priceUnit: number;
  costUnit: number;
}

export interface Sale {
  id: string;
  userId: string;
  date: string;
  items: SaleItem[];
  totalAmount: number;
  totalCost: number;
  paymentMethod: 'pix' | 'dinheiro' | 'cartao';
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
}
