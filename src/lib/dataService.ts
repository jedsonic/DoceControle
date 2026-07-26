/**
 * DataService — Fachada unificada de acesso a dados.
 *
 * Quando o Supabase está habilitado e o cliente está disponível,
 * todas as operações vão para a nuvem.
 * Caso contrário, usam o localStorage via StorageService.
 *
 * Todos os métodos são assíncronos para suportar os dois modos.
 */
import { Insumo, Recipe, ProductionLot, StockProduct, Sale } from '../types';
import { StorageService } from './storage';
import { getSupabase } from './supabase';
import { SupabaseService } from './supabaseService';

function getService(): SupabaseService | null {
  const sb = getSupabase();
  if (!sb) return null;
  return new SupabaseService(sb);
}

export const DataService = {

  // ── Insumos ──────────────────────────────────────────────────────────────

  async getAllInsumos(userId: string): Promise<Insumo[]> {
    const svc = getService();
    if (svc) return svc.getAllInsumos(userId);
    return StorageService.getAllInsumos(userId);
  },

  async saveInsumo(
    userId: string,
    insumo: Omit<Insumo, 'userId' | 'updatedAt'> & { id?: string }
  ): Promise<Insumo> {
    const svc = getService();
    if (svc) return svc.saveInsumo(userId, insumo);
    return StorageService.saveInsumo(userId, insumo);
  },

  async deleteInsumo(userId: string, id: string): Promise<void> {
    const svc = getService();
    if (svc) return svc.deleteInsumo(userId, id);
    StorageService.deleteInsumo(userId, id);
  },

  // ── Receitas ─────────────────────────────────────────────────────────────

  async getAllRecipes(userId: string): Promise<Recipe[]> {
    const svc = getService();
    if (svc) return svc.getAllRecipes(userId);
    return StorageService.getAllRecipes(userId);
  },

  async saveRecipe(
    userId: string,
    recipe: Omit<Recipe, 'userId' | 'updatedAt'> & { id?: string }
  ): Promise<Recipe> {
    const svc = getService();
    if (svc) return svc.saveRecipe(userId, recipe);
    return StorageService.saveRecipe(userId, recipe);
  },

  async deleteRecipe(userId: string, id: string): Promise<void> {
    const svc = getService();
    if (svc) return svc.deleteRecipe(userId, id);
    StorageService.deleteRecipe(userId, id);
  },

  // ── Lotes de Produção ────────────────────────────────────────────────────

  async getAllLots(userId: string): Promise<ProductionLot[]> {
    const svc = getService();
    if (svc) return svc.getAllLots(userId);
    return StorageService.getAllLots(userId);
  },

  async saveLot(
    userId: string,
    lot: Omit<ProductionLot, 'userId' | 'updatedAt'> & { id?: string }
  ): Promise<ProductionLot> {
    const svc = getService();
    if (svc) return svc.saveLot(userId, lot);
    return StorageService.saveLot(userId, lot);
  },

  async deleteLot(userId: string, id: string): Promise<void> {
    const svc = getService();
    if (svc) return svc.deleteLot(userId, id);
    StorageService.deleteLot(userId, id);
  },

  async completeProductionLot(
    userId: string,
    lotId: string
  ): Promise<{ success: boolean; message: string }> {
    const svc = getService();
    if (svc) return svc.completeProductionLot(userId, lotId);
    return StorageService.completeProductionLot(userId, lotId);
  },

  // ── Estoque de Produtos Acabados ─────────────────────────────────────────

  async getAllStock(userId: string): Promise<StockProduct[]> {
    const svc = getService();
    if (svc) return svc.getAllStock(userId);
    return StorageService.getAllStock(userId);
  },

  async saveStockProduct(
    userId: string,
    prod: Omit<StockProduct, 'userId' | 'updatedAt'> & { id?: string }
  ): Promise<StockProduct> {
    const svc = getService();
    if (svc) return svc.saveStockProduct(userId, prod);
    return StorageService.saveStockProduct(userId, prod);
  },

  async deleteStockProduct(userId: string, id: string): Promise<void> {
    const svc = getService();
    if (svc) return svc.deleteStockProduct(userId, id);
    StorageService.deleteStockProduct(userId, id);
  },

  // ── Vendas (PDV) ─────────────────────────────────────────────────────────

  async getAllSales(userId: string): Promise<Sale[]> {
    const svc = getService();
    if (svc) return svc.getAllSales(userId);
    return StorageService.getAllSales(userId);
  },

  async registerSale(userId: string, sale: Omit<Sale, 'userId' | 'id'>): Promise<Sale> {
    const svc = getService();
    if (svc) return svc.registerSale(userId, sale);
    return StorageService.registerSale(userId, sale);
  },

  async deleteSale(userId: string, id: string): Promise<void> {
    const svc = getService();
    if (svc) return svc.deleteSale(userId, id);
    StorageService.deleteSale(userId, id);
  },

  // ── Sincronização Inicial ─────────────────────────────────────────────────

  /**
   * Ao ativar o Supabase com dados locais existentes,
   * migra todos os dados locais para a nuvem.
   */
  async syncLocalToSupabase(userId: string): Promise<void> {
    const svc = getService();
    if (!svc) return;

    const localData = {
      insumos: StorageService.getAllInsumos(userId),
      recipes: StorageService.getAllRecipes(userId),
      lots: StorageService.getAllLots(userId),
      stock: StorageService.getAllStock(userId),
      sales: StorageService.getAllSales(userId),
    };

    // Só sincroniza se houver dados locais
    const hasLocalData = Object.values(localData).some(arr => arr.length > 0);
    if (!hasLocalData) return;

    await svc.syncLocalDataToSupabase(userId, localData);
  },
};
