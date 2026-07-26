/**
 * SupabaseService — Camada de CRUD assíncrona para o Supabase.
 * Espelha a interface do StorageService, mas persiste dados na nuvem.
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { Insumo, Recipe, ProductionLot, StockProduct, Sale, SaleItem } from '../types';
import { generateId } from './storage';

// ─── Helpers de mapeamento (snake_case ↔ camelCase) ───────────────────────

function toDbInsumo(i: Insumo) {
  return {
    id: i.id,
    user_id: i.userId,
    description: i.description,
    unit: i.unit,
    cost_value: i.costValue,
    current_stock: i.currentStock,
    min_stock: i.minStock,
    package_qty: i.packageQty ?? null,
    package_cost: i.packageCost ?? null,
    updated_at: i.updatedAt,
  };
}

function fromDbInsumo(row: any): Insumo {
  return {
    id: row.id,
    userId: row.user_id,
    description: row.description,
    unit: row.unit,
    costValue: Number(row.cost_value),
    currentStock: Number(row.current_stock),
    minStock: Number(row.min_stock),
    packageQty: row.package_qty != null ? Number(row.package_qty) : undefined,
    packageCost: row.package_cost != null ? Number(row.package_cost) : undefined,
    updatedAt: row.updated_at,
  };
}

function toDbReceita(r: Recipe) {
  return {
    id: r.id,
    user_id: r.userId,
    name: r.name,
    yield_amount: r.yieldAmount,
    yield_unit: r.yieldUnit,
    ingredients: r.ingredients,
    notes: r.notes ?? null,
    updated_at: r.updatedAt,
  };
}

function fromDbReceita(row: any): Recipe {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    yieldAmount: Number(row.yield_amount),
    yieldUnit: row.yield_unit,
    ingredients: row.ingredients,
    notes: row.notes ?? undefined,
    updatedAt: row.updated_at,
  };
}

function toDbLote(l: ProductionLot) {
  return {
    id: l.id,
    user_id: l.userId,
    recipe_id: l.recipeId,
    name: l.name,
    yield_actual: l.yieldActual,
    cost_ingredients: l.costIngredients,
    cost_extra: l.costExtra,
    cost_total: l.costTotal,
    cost_unit: l.costUnit,
    suggested_price: l.suggestedPrice,
    final_price: l.finalPrice,
    status: l.status,
    date: l.date,
    updated_at: l.updatedAt,
  };
}

function fromDbLote(row: any): ProductionLot {
  return {
    id: row.id,
    userId: row.user_id,
    recipeId: row.recipe_id,
    name: row.name,
    yieldActual: Number(row.yield_actual),
    costIngredients: Number(row.cost_ingredients),
    costExtra: row.cost_extra,
    costTotal: Number(row.cost_total),
    costUnit: Number(row.cost_unit),
    suggestedPrice: Number(row.suggested_price),
    finalPrice: Number(row.final_price),
    status: row.status,
    date: row.date,
    updatedAt: row.updated_at,
  };
}

function toDbEstoque(p: StockProduct) {
  return {
    id: p.id,
    user_id: p.userId,
    name: p.name,
    lot_id: p.lotId ?? null,
    cost_unit: p.costUnit,
    price_sale: p.priceSale,
    quantity: p.quantity,
    image: p.image ?? null,
    updated_at: p.updatedAt,
  };
}

function fromDbEstoque(row: any): StockProduct {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    lotId: row.lot_id ?? undefined,
    costUnit: Number(row.cost_unit),
    priceSale: Number(row.price_sale),
    quantity: Number(row.quantity),
    image: row.image ?? undefined,
    updatedAt: row.updated_at,
  };
}

function toDbVenda(s: Sale) {
  return {
    id: s.id,
    user_id: s.userId,
    date: s.date,
    items: s.items,
    total_amount: s.totalAmount,
    total_cost: s.totalCost,
    payment_method: s.paymentMethod,
  };
}

function fromDbVenda(row: any): Sale {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    items: row.items as SaleItem[],
    totalAmount: Number(row.total_amount),
    totalCost: Number(row.total_cost),
    paymentMethod: row.payment_method as Sale['paymentMethod'],
  };
}

// ─── Classe de serviço ────────────────────────────────────────────────────

export class SupabaseService {
  private sb: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.sb = client;
  }

  // ── Insumos ──────────────────────────────────────────────────────────────

  async getAllInsumos(userId: string): Promise<Insumo[]> {
    const { data, error } = await this.sb
      .from('insumos')
      .select('*')
      .eq('user_id', userId)
      .order('description');
    if (error) throw error;
    return (data ?? []).map(fromDbInsumo);
  }

  async saveInsumo(userId: string, insumo: Omit<Insumo, 'userId' | 'updatedAt'> & { id?: string }): Promise<Insumo> {
    const now = new Date().toISOString();
    const full: Insumo = {
      id: insumo.id || generateId(),
      userId,
      description: insumo.description,
      unit: insumo.unit,
      costValue: insumo.costValue,
      currentStock: insumo.currentStock,
      minStock: insumo.minStock,
      packageQty: insumo.packageQty,
      packageCost: insumo.packageCost,
      updatedAt: now,
    };
    const { data, error } = await this.sb
      .from('insumos')
      .upsert(toDbInsumo(full), { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return fromDbInsumo(data);
  }

  async deleteInsumo(userId: string, id: string): Promise<void> {
    const { error } = await this.sb
      .from('insumos')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }

  // ── Receitas ─────────────────────────────────────────────────────────────

  async getAllRecipes(userId: string): Promise<Recipe[]> {
    const { data, error } = await this.sb
      .from('receitas')
      .select('*')
      .eq('user_id', userId)
      .order('name');
    if (error) throw error;
    return (data ?? []).map(fromDbReceita);
  }

  async saveRecipe(userId: string, recipe: Omit<Recipe, 'userId' | 'updatedAt'> & { id?: string }): Promise<Recipe> {
    const now = new Date().toISOString();
    const full: Recipe = {
      id: recipe.id || generateId(),
      userId,
      name: recipe.name,
      yieldAmount: recipe.yieldAmount,
      yieldUnit: recipe.yieldUnit,
      ingredients: recipe.ingredients,
      notes: recipe.notes,
      updatedAt: now,
    };
    const { data, error } = await this.sb
      .from('receitas')
      .upsert(toDbReceita(full), { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return fromDbReceita(data);
  }

  async deleteRecipe(userId: string, id: string): Promise<void> {
    const { error } = await this.sb
      .from('receitas')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }

  // ── Lotes de Produção ────────────────────────────────────────────────────

  async getAllLots(userId: string): Promise<ProductionLot[]> {
    const { data, error } = await this.sb
      .from('lotes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(fromDbLote);
  }

  async saveLot(userId: string, lot: Omit<ProductionLot, 'userId' | 'updatedAt'> & { id?: string }): Promise<ProductionLot> {
    const now = new Date().toISOString();
    const full: ProductionLot = {
      id: lot.id || generateId(),
      userId,
      recipeId: lot.recipeId,
      name: lot.name,
      yieldActual: lot.yieldActual,
      costIngredients: lot.costIngredients,
      costExtra: lot.costExtra,
      costTotal: lot.costTotal,
      costUnit: lot.costUnit,
      suggestedPrice: lot.suggestedPrice,
      finalPrice: lot.finalPrice,
      status: lot.status,
      date: lot.date || now.split('T')[0],
      updatedAt: now,
    };
    const { data, error } = await this.sb
      .from('lotes')
      .upsert(toDbLote(full), { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return fromDbLote(data);
  }

  async deleteLot(userId: string, id: string): Promise<void> {
    const { error } = await this.sb
      .from('lotes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }

  // ── Estoque de Produtos Acabados ─────────────────────────────────────────

  async getAllStock(userId: string): Promise<StockProduct[]> {
    const { data, error } = await this.sb
      .from('estoque_produtos')
      .select('*')
      .eq('user_id', userId)
      .order('name');
    if (error) throw error;
    return (data ?? []).map(fromDbEstoque);
  }

  async saveStockProduct(userId: string, prod: Omit<StockProduct, 'userId' | 'updatedAt'> & { id?: string }): Promise<StockProduct> {
    const now = new Date().toISOString();
    const full: StockProduct = {
      id: prod.id || generateId(),
      userId,
      name: prod.name,
      lotId: prod.lotId,
      costUnit: prod.costUnit,
      priceSale: prod.priceSale,
      quantity: prod.quantity,
      image: prod.image,
      updatedAt: now,
    };
    const { data, error } = await this.sb
      .from('estoque_produtos')
      .upsert(toDbEstoque(full), { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return fromDbEstoque(data);
  }

  async deleteStockProduct(userId: string, id: string): Promise<void> {
    const { error } = await this.sb
      .from('estoque_produtos')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }

  // ── Vendas (PDV) ─────────────────────────────────────────────────────────

  async getAllSales(userId: string): Promise<Sale[]> {
    const { data, error } = await this.sb
      .from('vendas')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(fromDbVenda);
  }

  /**
   * Registra uma venda e desconta o estoque de produtos acabados — tudo no Supabase.
   */
  async registerSale(userId: string, sale: Omit<Sale, 'userId' | 'id'>): Promise<Sale> {
    const saleId = `sale_${generateId()}`;
    const now = new Date().toISOString();

    // 1. Grava a venda
    const fullSale: Sale = { ...sale, id: saleId, userId };
    const { data: savedSale, error: saleError } = await this.sb
      .from('vendas')
      .insert(toDbVenda(fullSale))
      .select()
      .single();
    if (saleError) throw saleError;

    // 2. Desconta estoque de produtos acabados (em paralelo)
    const stockUpdates = sale.items.map(async (item) => {
      const { data: current } = await this.sb
        .from('estoque_produtos')
        .select('quantity')
        .eq('id', item.productId)
        .eq('user_id', userId)
        .single();
      if (!current) return;
      const newQty = Math.max(0, Number(current.quantity) - item.quantity);
      await this.sb
        .from('estoque_produtos')
        .update({ quantity: newQty, updated_at: now })
        .eq('id', item.productId)
        .eq('user_id', userId);
    });
    await Promise.all(stockUpdates);

    return fromDbVenda(savedSale);
  }

  async deleteSale(userId: string, id: string): Promise<void> {
    // Recupera a venda para estornar estoque
    const { data: saleRow } = await this.sb
      .from('vendas')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (saleRow) {
      const sale = fromDbVenda(saleRow);
      const now = new Date().toISOString();
      // Estorna estoque
      const restores = sale.items.map(async (item) => {
        const { data: current } = await this.sb
          .from('estoque_produtos')
          .select('quantity')
          .eq('id', item.productId)
          .eq('user_id', userId)
          .single();
        if (!current) return;
        await this.sb
          .from('estoque_produtos')
          .update({ quantity: Number(current.quantity) + item.quantity, updated_at: now })
          .eq('id', item.productId)
          .eq('user_id', userId);
      });
      await Promise.all(restores);
    }

    const { error } = await this.sb
      .from('vendas')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }

  /**
   * Finaliza um lote de produção:
   * 1. Desconta matérias-primas
   * 2. Atualiza status do lote para 'completed'
   * 3. Adiciona produtos ao estoque
   */
  async completeProductionLot(userId: string, lotId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Busca o lote
      const { data: lotRow } = await this.sb
        .from('lotes')
        .select('*')
        .eq('id', lotId)
        .eq('user_id', userId)
        .single();
      if (!lotRow) return { success: false, message: 'Lote não encontrado.' };
      const lot = fromDbLote(lotRow);
      if (lot.status === 'completed') return { success: false, message: 'Este lote já foi concluído.' };

      // Busca a receita
      const { data: receitaRow } = await this.sb
        .from('receitas')
        .select('*')
        .eq('id', lot.recipeId)
        .single();
      if (!receitaRow) return { success: false, message: 'Receita associada não encontrada.' };
      const recipe = fromDbReceita(receitaRow);

      const scaleFactor = lot.yieldActual / recipe.yieldAmount;
      const now = new Date().toISOString();

      // Desconta insumos
      for (const ing of recipe.ingredients) {
        const { data: insumoRow } = await this.sb
          .from('insumos')
          .select('current_stock')
          .eq('id', ing.insumoId)
          .eq('user_id', userId)
          .single();
        if (!insumoRow) continue;
        const neededQty = ing.quantity * scaleFactor;
        const newStock = Math.max(0, parseFloat((Number(insumoRow.current_stock) - neededQty).toFixed(3)));
        await this.sb
          .from('insumos')
          .update({ current_stock: newStock, updated_at: now })
          .eq('id', ing.insumoId)
          .eq('user_id', userId);
      }

      // Atualiza status do lote
      await this.sb
        .from('lotes')
        .update({ status: 'completed', updated_at: now })
        .eq('id', lotId)
        .eq('user_id', userId);

      // Adiciona ao estoque de produtos acabados
      const { data: existingStock } = await this.sb
        .from('estoque_produtos')
        .select('*')
        .eq('user_id', userId)
        .ilike('name', lot.name)
        .single();

      if (existingStock) {
        const existing = fromDbEstoque(existingStock);
        const totalQty = existing.quantity + lot.yieldActual;
        const weightedCost = totalQty > 0
          ? ((existing.costUnit * existing.quantity) + (lot.costUnit * lot.yieldActual)) / totalQty
          : lot.costUnit;
        await this.sb
          .from('estoque_produtos')
          .update({
            cost_unit: parseFloat(weightedCost.toFixed(2)),
            price_sale: lot.finalPrice,
            quantity: totalQty,
            updated_at: now,
          })
          .eq('id', existing.id)
          .eq('user_id', userId);
      } else {
        await this.sb
          .from('estoque_produtos')
          .insert({
            id: generateId(),
            user_id: userId,
            name: lot.name,
            lot_id: lot.id,
            cost_unit: lot.costUnit,
            price_sale: lot.finalPrice,
            quantity: lot.yieldActual,
            updated_at: now,
          });
      }

      return { success: true, message: 'Lote finalizado! Estoque de ingredientes reduzido e produtos adicionados ao estoque.' };
    } catch (err: any) {
      return { success: false, message: `Erro ao finalizar lote: ${err.message}` };
    }
  }

  /**
   * Sincroniza dados do localStorage para o Supabase (migração inicial).
   * Só é chamada quando o usuário conecta o Supabase pela primeira vez e já tem dados locais.
   */
  async syncLocalDataToSupabase(
    userId: string,
    localData: {
      insumos: Insumo[];
      recipes: Recipe[];
      lots: ProductionLot[];
      stock: StockProduct[];
      sales: Sale[];
    }
  ): Promise<void> {
    const jobs: Promise<any>[] = [];

    if (localData.insumos.length > 0) {
      jobs.push(Promise.resolve(this.sb.from('insumos').upsert(localData.insumos.map(toDbInsumo), { onConflict: 'id' })));
    }
    if (localData.recipes.length > 0) {
      jobs.push(Promise.resolve(this.sb.from('receitas').upsert(localData.recipes.map(toDbReceita), { onConflict: 'id' })));
    }
    if (localData.lots.length > 0) {
      jobs.push(Promise.resolve(this.sb.from('lotes').upsert(localData.lots.map(toDbLote), { onConflict: 'id' })));
    }
    if (localData.stock.length > 0) {
      jobs.push(Promise.resolve(this.sb.from('estoque_produtos').upsert(localData.stock.map(toDbEstoque), { onConflict: 'id' })));
    }
    if (localData.sales.length > 0) {
      jobs.push(Promise.resolve(this.sb.from('vendas').upsert(localData.sales.map(toDbVenda), { onConflict: 'id' })));
    }

    await Promise.all(jobs);
  }
}
