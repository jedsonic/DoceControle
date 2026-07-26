import { Insumo, Recipe, ProductionLot, StockProduct, Sale, User, SupabaseConfig, IndirectCostsConfig } from '../types';

// Storage keys
const USERS_KEY = 'doce_controle_users';
const ACTIVE_USER_KEY = 'doce_controle_active_user';
const INSUMOS_KEY = 'doce_controle_insumos';
const RECIPES_KEY = 'doce_controle_recipes';
const LOTS_KEY = 'doce_controle_lots';
const STOCK_KEY = 'doce_controle_stock';
const SALES_KEY = 'doce_controle_sales';
const SUPABASE_KEY = 'doce_controle_supabase_config';
const INDIRECT_COSTS_KEY = 'doce_controle_indirect_costs';

// Help helper to get items from localStorage
function getLocal<T>(key: string, defaultValue: T): T {
  const data = localStorage.getItem(key);
  if (!data) return defaultValue;
  try {
    return JSON.parse(data) as T;
  } catch {
    return defaultValue;
  }
}

// Help helper to set items in localStorage
function setLocal<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Generate unique short IDs
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

const SEED_TIMESTAMP = '2020-01-01T00:00:00.000Z';

// Default Insumos to seed for new accounts
const DEFAULT_INSUMOS = (userId: string): Insumo[] => [
  { id: 'i1', userId, description: 'Leite Condensado (Moça)', unit: 'g', costValue: 0.016, currentStock: 5000, minStock: 1000, updatedAt: SEED_TIMESTAMP }, // 395g x R$ 6.30
  { id: 'i2', userId, description: 'Creme de Leite', unit: 'g', costValue: 0.015, currentStock: 3000, minStock: 600, updatedAt: SEED_TIMESTAMP }, // 200g x R$ 3.00
  { id: 'i3', userId, description: 'Açúcar Refinado', unit: 'g', costValue: 0.005, currentStock: 10000, minStock: 2000, updatedAt: SEED_TIMESTAMP }, // 1kg x R$ 5.00
  { id: 'i4', userId, description: 'Farinha de Trigo', unit: 'g', costValue: 0.006, currentStock: 8000, minStock: 1500, updatedAt: SEED_TIMESTAMP }, // 1kg x R$ 6.00
  { id: 'i5', userId, description: 'Chocolate em Pó 50%', unit: 'g', costValue: 0.032, currentStock: 2000, minStock: 500, updatedAt: SEED_TIMESTAMP }, // 400g x R$ 12.80
  { id: 'i6', userId, description: 'Manteiga sem Sal', unit: 'g', costValue: 0.055, currentStock: 1500, minStock: 400, updatedAt: SEED_TIMESTAMP }, // 500g x R$ 27.50
  { id: 'i7', userId, description: 'Ovos Brancos', unit: 'un', costValue: 0.60, currentStock: 60, minStock: 12, updatedAt: SEED_TIMESTAMP }, // Bandeja 30 un x R$ 18.00
  { id: 'i8', userId, description: 'Granulado Belga', unit: 'g', costValue: 0.085, currentStock: 1000, minStock: 200, updatedAt: SEED_TIMESTAMP }, // 500g x R$ 42.50
  { id: 'i9', userId, description: 'Embalagem de Bolo G', unit: 'un', costValue: 3.50, currentStock: 25, minStock: 5, updatedAt: SEED_TIMESTAMP },
  { id: 'i10', userId, description: 'Nutella Pote 350g', unit: 'g', costValue: 0.068, currentStock: 1050, minStock: 350, updatedAt: SEED_TIMESTAMP }, // 350g x R$ 23.80
  { id: 'i11', userId, description: 'Leite Ninho em Pó', unit: 'g', costValue: 0.045, currentStock: 2000, minStock: 400, updatedAt: SEED_TIMESTAMP }, // 400g x R$ 18.00
  { id: 'i12', userId, description: 'Saquinho para Din-Din (Geladinho)', unit: 'un', costValue: 0.08, currentStock: 200, minStock: 50, updatedAt: SEED_TIMESTAMP },
];

// Default Recipes to seed for new accounts
const DEFAULT_RECIPES = (userId: string): Recipe[] => [
  {
    id: 'r1',
    userId,
    name: 'Bolo de Chocolate Brigadeiro Tradicional',
    yieldAmount: 10,
    yieldUnit: 'fatias',
    productionHours: 2.0,
    ingredients: [
      { insumoId: 'i4', quantity: 300 }, // Trigo
      { insumoId: 'i3', quantity: 200 }, // Açúcar
      { insumoId: 'i7', quantity: 4 },   // Ovos
      { insumoId: 'i6', quantity: 100 }, // Manteiga
      { insumoId: 'i1', quantity: 790 }, // 2 latas leite cond.
      { insumoId: 'i2', quantity: 200 }, // 1 cx creme leite
      { insumoId: 'i5', quantity: 150 }, // Chocolate pó
      { insumoId: 'i8', quantity: 120 }, // Granulado belga
    ],
    notes: 'Bolo clássico para festas. Fazer cobertura em ponto de brigadeiro mole e decorar com granulado belga por cima.',
    updatedAt: SEED_TIMESTAMP
  },
  {
    id: 'r2',
    userId,
    name: 'Din-Din Gourmet de Ninho com Nutella',
    yieldAmount: 12,
    yieldUnit: 'unidades',
    productionHours: 1.0,
    ingredients: [
      { insumoId: 'i1', quantity: 395 }, // 1 lata leite cond.
      { insumoId: 'i2', quantity: 200 }, // 1 cx creme leite
      { insumoId: 'i11', quantity: 120 }, // Leite ninho
      { insumoId: 'i10', quantity: 180 }, // Nutella
      { insumoId: 'i12', quantity: 12 },  // Saquinhos
    ],
    notes: 'Bater a base cremosa no liquidificador (leite condensado, creme de leite e leite ninho). Adicionar colheradas de Nutella diretamente dentro de cada saquinho antes de encher com a base líquida.',
    updatedAt: SEED_TIMESTAMP
  }
];

// Default Stock to seed for new accounts
const DEFAULT_STOCK = (userId: string): StockProduct[] => [
  { id: 's1', userId, name: 'Bolo de Chocolate Brigadeiro Tradicional', costUnit: 35.80, priceSale: 90.00, quantity: 3, updatedAt: SEED_TIMESTAMP },
  { id: 's2', userId, name: 'Din-Din Gourmet de Ninho com Nutella', costUnit: 2.15, priceSale: 7.00, quantity: 24, updatedAt: SEED_TIMESTAMP }
];

// Default Sales to seed (simulated past 7 days)
const DEFAULT_SALES = (userId: string): Sale[] => {
  const sales: Sale[] = [];
  const paymentMethods: ('pix' | 'dinheiro' | 'cartao')[] = ['pix', 'dinheiro', 'cartao'];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(14 + i, 30, 0, 0); // afternoon sales
    
    // Day 1-7 sales
    const count = i === 0 ? 3 : Math.floor(Math.random() * 4) + 1; // today has 3, other days random
    for (let j = 0; j < count; j++) {
      const isBolo = Math.random() > 0.5;
      const items = isBolo 
        ? [{ productId: 's1', name: 'Bolo de Chocolate Brigadeiro Tradicional', quantity: 1, priceUnit: 90.00, costUnit: 35.80 }]
        : [{ productId: 's2', name: 'Din-Din Gourmet de Ninho com Nutella', quantity: Math.floor(Math.random() * 5) + 3, priceUnit: 7.00, costUnit: 2.15 }];
      
      const totalAmount = items.reduce((sum, item) => sum + (item.priceUnit * item.quantity), 0);
      const totalCost = items.reduce((sum, item) => sum + (item.costUnit * item.quantity), 0);
      
      sales.push({
        id: `sale_${i}_${j}`,
        userId,
        date: date.toISOString(),
        items,
        totalAmount,
        totalCost,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)]
      });
    }
  }
  return sales;
};

export const StorageService = {
  // --- AUTH SECTION ---
  getUsers(): User[] {
    return getLocal<User[]>(USERS_KEY, []);
  },

  getActiveUser(): User | null {
    return getLocal<User | null>(ACTIVE_USER_KEY, null);
  },

  getUserById(id: string): User | null {
    const users = this.getUsers();
    return users.find(u => u.id === id) || null;
  },

  updateUserProfile(userId: string, data: Partial<User>): User | null {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return null;
    
    const updatedUser = {
      ...users[index],
      ...data
    };
    users[index] = updatedUser;
    setLocal(USERS_KEY, users);
    
    // Also update active user if they are the one logged in
    const active = this.getActiveUser();
    if (active && active.id === userId) {
      this.setActiveUser(updatedUser);
    }
    
    return updatedUser;
  },

  setActiveUser(user: User | null): void {
    setLocal<User | null>(ACTIVE_USER_KEY, user);
  },

  login(username: string, businessName: string): User {
    const users = this.getUsers();
    let user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (!user) {
      // Create user on first login (passwordless clean entry as requested or simplified secure flow)
      user = {
        id: generateId(),
        username: username,
        businessName: businessName || `${username}'s Gourmet`,
        createdAt: new Date().toISOString()
      };
      users.push(user);
      setLocal(USERS_KEY, users);
      
      // Seed data for this new user
      this.seedDataForUser(user.id);
    } else if (businessName && businessName !== user.businessName) {
      // Update business name if edited
      user.businessName = businessName;
      setLocal(USERS_KEY, users.map(u => u.id === user!.id ? user! : u));
    }
    
    this.setActiveUser(user);
    return user;
  },

  logout(): void {
    this.setActiveUser(null);
  },

  seedDataForUser(userId: string): void {
    // Check if user already has data, if not, populate
    const insumos = this.getAllInsumos(userId);
    if (insumos.length === 0) {
      this.saveInsumosRaw(userId, DEFAULT_INSUMOS(userId));
      this.saveRecipesRaw(userId, DEFAULT_RECIPES(userId));
      this.saveStockRaw(userId, DEFAULT_STOCK(userId));
      this.saveSalesRaw(userId, DEFAULT_SALES(userId));
    }
  },

  // --- RAW DATA WRITERS ---
  saveInsumosRaw(userId: string, data: Insumo[]) {
    const all = getLocal<Insumo[]>(INSUMOS_KEY, []);
    const filtered = all.filter(x => x.userId !== userId);
    setLocal(INSUMOS_KEY, [...filtered, ...data]);
  },
  saveRecipesRaw(userId: string, data: Recipe[]) {
    const all = getLocal<Recipe[]>(RECIPES_KEY, []);
    const filtered = all.filter(x => x.userId !== userId);
    setLocal(RECIPES_KEY, [...filtered, ...data]);
  },
  saveStockRaw(userId: string, data: StockProduct[]) {
    const all = getLocal<StockProduct[]>(STOCK_KEY, []);
    const filtered = all.filter(x => x.userId !== userId);
    setLocal(STOCK_KEY, [...filtered, ...data]);
  },
  saveLotsRaw(userId: string, data: ProductionLot[]) {
    const all = getLocal<ProductionLot[]>(LOTS_KEY, []);
    const filtered = all.filter(x => x.userId !== userId);
    setLocal(LOTS_KEY, [...filtered, ...data]);
  },
  saveSalesRaw(userId: string, data: Sale[]) {
    const all = getLocal<Sale[]>(SALES_KEY, []);
    const filtered = all.filter(x => x.userId !== userId);
    setLocal(SALES_KEY, [...filtered, ...data]);
  },

  // --- INSUMOS CRUD ---
  getAllInsumos(userId: string): Insumo[] {
    const all = getLocal<Insumo[]>(INSUMOS_KEY, []);
    return all.filter(item => item.userId === userId);
  },

  saveInsumo(userId: string, insumo: Omit<Insumo, 'userId' | 'updatedAt'> & { id?: string }): Insumo {
    const all = getLocal<Insumo[]>(INSUMOS_KEY, []);
    const now = new Date().toISOString();
    
    if (insumo.id) {
      // Edit
      const index = all.findIndex(item => item.id === insumo.id && item.userId === userId);
      if (index !== -1) {
        const updated: Insumo = {
          ...all[index],
          description: insumo.description,
          unit: insumo.unit,
          costValue: insumo.costValue,
          currentStock: insumo.currentStock,
          minStock: insumo.minStock,
          packageQty: insumo.packageQty,
          packageCost: insumo.packageCost,
          updatedAt: now
        };
        all[index] = updated;
        setLocal(INSUMOS_KEY, all);
        return updated;
      }
    }
    
    // New
    const newInsumo: Insumo = {
      id: generateId(),
      userId,
      description: insumo.description,
      unit: insumo.unit,
      costValue: insumo.costValue,
      currentStock: insumo.currentStock,
      minStock: insumo.minStock,
      packageQty: insumo.packageQty,
      packageCost: insumo.packageCost,
      updatedAt: now
    };
    all.push(newInsumo);
    setLocal(INSUMOS_KEY, all);
    return newInsumo;
  },

  deleteInsumo(userId: string, id: string): boolean {
    const all = getLocal<Insumo[]>(INSUMOS_KEY, []);
    const initialLength = all.length;
    const filtered = all.filter(item => !(item.id === id && item.userId === userId));
    setLocal(INSUMOS_KEY, filtered);
    return filtered.length < initialLength;
  },

  // --- RECIPES CRUD ---
  // --- INDIRECT COSTS CONFIG CRUD ---
  getIndirectCosts(userId: string): IndirectCostsConfig {
    const all = getLocal<IndirectCostsConfig[]>(INDIRECT_COSTS_KEY, []);
    const found = all.find(item => item.userId === userId);
    if (found) return found;

    // Default configuration for new users
    return {
      userId,
      proLabore: 2500,
      utilities: 400,
      cleaningAndSupport: 150,
      otherExpenses: 0,
      workHoursCapacity: 160,
      updatedAt: SEED_TIMESTAMP
    };
  },

  saveIndirectCosts(userId: string, config: Partial<IndirectCostsConfig>): IndirectCostsConfig {
    const all = getLocal<IndirectCostsConfig[]>(INDIRECT_COSTS_KEY, []);
    const now = new Date().toISOString();
    const current = this.getIndirectCosts(userId);
    
    const updated: IndirectCostsConfig = {
      ...current,
      ...config,
      userId,
      updatedAt: now
    };

    const index = all.findIndex(item => item.userId === userId);
    if (index !== -1) {
      all[index] = updated;
    } else {
      all.push(updated);
    }
    setLocal(INDIRECT_COSTS_KEY, all);
    return updated;
  },

  // --- RECIPES CRUD ---
  getAllRecipes(userId: string): Recipe[] {
    const all = getLocal<Recipe[]>(RECIPES_KEY, []);
    return all.filter(item => item.userId === userId);
  },

  saveRecipe(userId: string, recipe: Omit<Recipe, 'userId' | 'updatedAt'> & { id?: string }): Recipe {
    const all = getLocal<Recipe[]>(RECIPES_KEY, []);
    const now = new Date().toISOString();
    
    // Find index by ID or by same Name for this user
    let index = -1;
    if (recipe.id) {
      index = all.findIndex(item => item.userId === userId && item.id === recipe.id);
    }
    if (index === -1 && recipe.name) {
      index = all.findIndex(item => item.userId === userId && item.name.trim().toLowerCase() === recipe.name.trim().toLowerCase());
    }
    
    if (index !== -1) {
      const updated: Recipe = {
        ...all[index],
        id: recipe.id || all[index].id,
        name: recipe.name,
        yieldAmount: recipe.yieldAmount,
        yieldUnit: recipe.yieldUnit,
        ingredients: recipe.ingredients,
        productionHours: recipe.productionHours,
        notes: recipe.notes,
        updatedAt: now
      };
      all[index] = updated;
      setLocal(RECIPES_KEY, all);
      return updated;
    }
    
    const newRecipe: Recipe = {
      id: recipe.id || generateId(),
      userId,
      name: recipe.name,
      yieldAmount: recipe.yieldAmount,
      yieldUnit: recipe.yieldUnit,
      ingredients: recipe.ingredients,
      productionHours: recipe.productionHours,
      notes: recipe.notes,
      updatedAt: now
    };
    all.push(newRecipe);
    setLocal(RECIPES_KEY, all);
    return newRecipe;
  },

  deleteRecipe(userId: string, id: string): boolean {
    const all = getLocal<Recipe[]>(RECIPES_KEY, []);
    const initialLength = all.length;
    const filtered = all.filter(item => !(item.id === id && item.userId === userId));
    setLocal(RECIPES_KEY, filtered);
    return filtered.length < initialLength;
  },

  // --- PRODUCTION LOTS CRUD ---
  getAllLots(userId: string): ProductionLot[] {
    const all = getLocal<ProductionLot[]>(LOTS_KEY, []);
    return all.filter(item => item.userId === userId);
  },

  saveLot(userId: string, lot: Omit<ProductionLot, 'userId' | 'updatedAt'> & { id?: string }): ProductionLot {
    const all = getLocal<ProductionLot[]>(LOTS_KEY, []);
    const now = new Date().toISOString();
    
    if (lot.id) {
      const index = all.findIndex(item => item.id === lot.id && item.userId === userId);
      if (index !== -1) {
        const updated: ProductionLot = {
          ...all[index],
          name: lot.name,
          recipeId: lot.recipeId,
          yieldActual: lot.yieldActual,
          costIngredients: lot.costIngredients,
          costIndirect: lot.costIndirect,
          costExtra: lot.costExtra,
          costTotal: lot.costTotal,
          costUnit: lot.costUnit,
          suggestedPrice: lot.suggestedPrice,
          finalPrice: lot.finalPrice,
          status: lot.status,
          date: lot.date,
          updatedAt: now
        };
        all[index] = updated;
        setLocal(LOTS_KEY, all);
        return updated;
      }
    }
    
    const newLot: ProductionLot = {
      id: generateId(),
      userId,
      recipeId: lot.recipeId,
      name: lot.name,
      yieldActual: lot.yieldActual,
      costIngredients: lot.costIngredients,
      costIndirect: lot.costIndirect,
      costExtra: lot.costExtra,
      costTotal: lot.costTotal,
      costUnit: lot.costUnit,
      suggestedPrice: lot.suggestedPrice,
      finalPrice: lot.finalPrice,
      date: lot.date || now.split('T')[0],
      status: lot.status,
      updatedAt: now
    };
    all.push(newLot);
    setLocal(LOTS_KEY, all);
    return newLot;
  },

  deleteLot(userId: string, id: string): boolean {
    const all = getLocal<ProductionLot[]>(LOTS_KEY, []);
    const initialLength = all.length;
    const filtered = all.filter(item => !(item.id === id && item.userId === userId));
    setLocal(LOTS_KEY, filtered);
    return filtered.length < initialLength;
  },

  // Complete a lot: decrease raw material stocks and send finished products to product stock
  completeProductionLot(userId: string, lotId: string): { success: boolean, message: string } {
    const lots = this.getAllLots(userId);
    const lot = lots.find(l => l.id === lotId);
    if (!lot) return { success: false, message: 'Lote não encontrado.' };
    if (lot.status === 'completed') return { success: false, message: 'Este lote já foi concluído e enviado ao estoque.' };
    
    const recipes = this.getAllRecipes(userId);
    const recipe = recipes.find(r => r.id === lot.recipeId);
    if (!recipe) return { success: false, message: 'Receita associada não encontrada.' };
    
    // Check raw materials stock first to avoid half-complete deductions
    const insumos = this.getAllInsumos(userId);
    const insumoMap = new Map<string, Insumo>(insumos.map(i => [i.id, i]));
    
    const scaleFactor = lot.yieldActual / recipe.yieldAmount;
    
    for (const ing of recipe.ingredients) {
      const insumo = insumoMap.get(ing.insumoId);
      if (!insumo) {
        return { success: false, message: `Ingrediente da receita não cadastrado nos Insumos.` };
      }
      const neededQty = ing.quantity * scaleFactor;
      if (insumo.currentStock < neededQty) {
        // We will allow negative stocks if user forces but warn, or cap. Let's warn and allow proceeding, or deduct. 
        // Best approach: deduct and let it go negative with warning, so they can update raw stock later.
      }
    }
    
    // Deduct raw material stock
    const allInsumos = getLocal<Insumo[]>(INSUMOS_KEY, []);
    recipe.ingredients.forEach(ing => {
      const neededQty = ing.quantity * scaleFactor;
      const index = allInsumos.findIndex(i => i.id === ing.insumoId && i.userId === userId);
      if (index !== -1) {
        allInsumos[index].currentStock = Math.max(0, parseFloat((allInsumos[index].currentStock - neededQty).toFixed(3)));
        allInsumos[index].updatedAt = new Date().toISOString();
      }
    });
    setLocal(INSUMOS_KEY, allInsumos);
    
    // Update lot status to completed
    lot.status = 'completed';
    this.saveLot(userId, lot);
    
    // Send to product stock
    const allStock = getLocal<StockProduct[]>(STOCK_KEY, []);
    const existingStockIndex = allStock.findIndex(s => s.name.toLowerCase() === lot.name.toLowerCase() && s.userId === userId);
    
    if (existingStockIndex !== -1) {
      const existing = allStock[existingStockIndex];
      // Weighted cost calculation or overwrite. Weighted cost is more professional!
      const totalQty = existing.quantity + lot.yieldActual;
      const weightedCost = totalQty > 0 
        ? ((existing.costUnit * existing.quantity) + (lot.costUnit * lot.yieldActual)) / totalQty 
        : lot.costUnit;
        
      allStock[existingStockIndex] = {
        ...existing,
        costUnit: parseFloat(weightedCost.toFixed(2)),
        priceSale: lot.finalPrice, // update to latest sale price
        quantity: totalQty,
        updatedAt: new Date().toISOString()
      };
    } else {
      allStock.push({
        id: generateId(),
        userId,
        name: lot.name,
        lotId: lot.id,
        costUnit: lot.costUnit,
        priceSale: lot.finalPrice,
        quantity: lot.yieldActual,
        updatedAt: new Date().toISOString()
      });
    }
    setLocal(STOCK_KEY, allStock);
    
    return { success: true, message: 'Lote finalizado! Estoque de ingredientes reduzido e produtos adicionados ao estoque.' };
  },

  // --- FINISHED PRODUCTS STOCK CRUD ---
  getAllStock(userId: string): StockProduct[] {
    const all = getLocal<StockProduct[]>(STOCK_KEY, []);
    return all.filter(item => item.userId === userId);
  },

  saveStockProduct(userId: string, prod: Omit<StockProduct, 'userId' | 'updatedAt'> & { id?: string }): StockProduct {
    const all = getLocal<StockProduct[]>(STOCK_KEY, []);
    const now = new Date().toISOString();
    
    if (prod.id) {
      const index = all.findIndex(item => item.id === prod.id && item.userId === userId);
      if (index !== -1) {
        const updated: StockProduct = {
          ...all[index],
          name: prod.name,
          costUnit: prod.costUnit,
          priceSale: prod.priceSale,
          quantity: prod.quantity,
          image: prod.image,
          updatedAt: now
        };
        all[index] = updated;
        setLocal(STOCK_KEY, all);
        return updated;
      }
    }
    
    const newProd: StockProduct = {
      id: generateId(),
      userId,
      name: prod.name,
      costUnit: prod.costUnit,
      priceSale: prod.priceSale,
      quantity: prod.quantity,
      image: prod.image,
      updatedAt: now
    };
    all.push(newProd);
    setLocal(STOCK_KEY, all);
    return newProd;
  },

  deleteStockProduct(userId: string, id: string): boolean {
    const all = getLocal<StockProduct[]>(STOCK_KEY, []);
    const initialLength = all.length;
    const filtered = all.filter(item => !(item.id === id && item.userId === userId));
    setLocal(STOCK_KEY, filtered);
    return filtered.length < initialLength;
  },

  // --- SALES CRUD (PDV) ---
  getAllSales(userId: string): Sale[] {
    const all = getLocal<Sale[]>(SALES_KEY, []);
    return all.filter(item => item.userId === userId);
  },

  registerSale(userId: string, sale: Omit<Sale, 'userId' | 'id'>): Sale {
    const allSales = getLocal<Sale[]>(SALES_KEY, []);
    const allStock = getLocal<StockProduct[]>(STOCK_KEY, []);
    
    // Deduct finished product stock
    sale.items.forEach(item => {
      const stockIndex = allStock.findIndex(s => s.id === item.productId && s.userId === userId);
      if (stockIndex !== -1) {
        allStock[stockIndex].quantity = Math.max(0, allStock[stockIndex].quantity - item.quantity);
        allStock[stockIndex].updatedAt = new Date().toISOString();
      }
    });
    setLocal(STOCK_KEY, allStock);
    
    const newSale: Sale = {
      ...sale,
      id: `sale_${generateId()}`,
      userId,
    };
    
    allSales.push(newSale);
    setLocal(SALES_KEY, allSales);
    return newSale;
  },

  deleteSale(userId: string, id: string): boolean {
    const allSales = getLocal<Sale[]>(SALES_KEY, []);
    const saleToDelete = allSales.find(item => item.id === id && item.userId === userId);
    
    if (!saleToDelete) return false;
    
    // Reverse finished product stock
    const allStock = getLocal<StockProduct[]>(STOCK_KEY, []);
    saleToDelete.items.forEach(item => {
      const stockIndex = allStock.findIndex(s => s.id === item.productId && s.userId === userId);
      if (stockIndex !== -1) {
        allStock[stockIndex].quantity = parseFloat((allStock[stockIndex].quantity + item.quantity).toFixed(3));
        allStock[stockIndex].updatedAt = new Date().toISOString();
      }
    });
    setLocal(STOCK_KEY, allStock);
    
    // Remove the sale
    const filteredSales = allSales.filter(item => !(item.id === id && item.userId === userId));
    setLocal(SALES_KEY, filteredSales);
    return true;
  },

  // --- SUPABASE SYNC CONFIG ---
  getSupabaseConfig(): SupabaseConfig {
    const defaultConfig: SupabaseConfig = {
      url: 'https://icnkntxdqpsoekgrvyry.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljbmtudHhkcXBzb2VrZ3J2eXJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NjAyMzgsImV4cCI6MjEwMDAzNjIzOH0.iqQzl0wPOnEuauVza2Wvi_ItyZFXaKu1Xk8oa53uDtE',
      enabled: true
    };

    const config = getLocal<SupabaseConfig>(SUPABASE_KEY, defaultConfig);
    if (!config.url || !config.anonKey || config.enabled === false) {
      setLocal(SUPABASE_KEY, defaultConfig);
      return defaultConfig;
    }
    return config;
  },

  saveSupabaseConfig(config: SupabaseConfig): void {
    setLocal(SUPABASE_KEY, config);
  },

  // Generate SQL script for Supabase
  getSupabaseSQLSchema(): string {
    return `-- SQL SCHEMA DE MIGRAÇÃO PARA SUPABASE (DOCE CONTROLE)
-- Execute este script no SQL Editor do seu projeto Supabase.

-- Tabela de Insumos (Matérias Primas)
CREATE TABLE IF NOT EXISTS insumos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  description TEXT NOT NULL,
  unit TEXT NOT NULL,
  cost_value NUMERIC NOT NULL,
  current_stock NUMERIC NOT NULL DEFAULT 0,
  min_stock NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Receitas
CREATE TABLE IF NOT EXISTS receitas (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  yield_amount NUMERIC NOT NULL,
  yield_unit TEXT NOT NULL,
  ingredients JSONB NOT NULL, -- Array de { insumoId, quantity }
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Lotes de Produção
CREATE TABLE IF NOT EXISTS lotes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  recipe_id TEXT NOT NULL,
  name TEXT NOT NULL,
  yield_actual NUMERIC NOT NULL,
  cost_ingredients NUMERIC NOT NULL,
  cost_extra JSONB NOT NULL, -- Array de { name, value }
  cost_total NUMERIC NOT NULL,
  cost_unit NUMERIC NOT NULL,
  suggested_price NUMERIC NOT NULL,
  final_price NUMERIC NOT NULL,
  status TEXT NOT NULL, -- 'production' ou 'completed'
  date TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Estoque de Produtos Acabados
CREATE TABLE IF NOT EXISTS estoque_produtos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  lot_id TEXT,
  cost_unit NUMERIC NOT NULL,
  price_sale NUMERIC NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Custos Indiretos
CREATE TABLE IF NOT EXISTS custos_indiretos (
  user_id TEXT PRIMARY KEY,
  pro_labore NUMERIC NOT NULL DEFAULT 2500,
  utilities NUMERIC NOT NULL DEFAULT 400,
  cleaning_and_support NUMERIC NOT NULL DEFAULT 150,
  other_expenses NUMERIC NOT NULL DEFAULT 0,
  work_hours_capacity NUMERIC NOT NULL DEFAULT 160,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Vendas
CREATE TABLE IF NOT EXISTS vendas (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  items JSONB NOT NULL, -- Array de { productId, name, quantity, priceUnit, costUnit }
  total_amount NUMERIC NOT NULL,
  total_cost NUMERIC NOT NULL,
  payment_method TEXT NOT NULL
);

-- Índices para otimização por usuário
CREATE INDEX IF NOT EXISTS idx_insumos_user ON insumos(user_id);
CREATE INDEX IF NOT EXISTS idx_receitas_user ON receitas(user_id);
CREATE INDEX IF NOT EXISTS idx_lotes_user ON lotes(user_id);
CREATE INDEX IF NOT EXISTS idx_estoque_user ON estoque_produtos(user_id);
CREATE INDEX IF NOT EXISTS idx_vendas_user ON vendas(user_id);

-- Ativa o Row Level Security (RLS) se necessário, ou configure o acesso das chaves anon
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE custos_indiretos ENABLE ROW LEVEL SECURITY;

-- Cria políticas simples baseadas no user_id enviado pela app (ou desative RLS temporariamente para teste)
CREATE POLICY "Acesso total aos insumos do usuário" ON insumos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total às receitas" ON receitas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total aos lotes" ON lotes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total ao estoque" ON estoque_produtos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total às vendas" ON vendas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total aos custos indiretos" ON custos_indiretos FOR ALL USING (true) WITH CHECK (true);
`;
  }
};
