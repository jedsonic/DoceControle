import React, { useState, useEffect } from 'react';
import { StockProduct, Insumo } from '../types';
import { DataService } from '../lib/dataService';
import { Search, Plus, Trash2, ShieldCheck, AlertTriangle, TrendingUp, DollarSign, Package, Layers, Info, X } from 'lucide-react';
import { motion } from 'motion/react';

interface EstoqueScreenProps {
  userId: string;
  onNavigateToLots?: () => void;
  onNavigateToInsumos?: () => void;
}

export default function EstoqueScreen({ userId, onNavigateToLots, onNavigateToInsumos }: EstoqueScreenProps) {
  const [stockProducts, setStockProducts] = useState<StockProduct[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'insumos'>('products');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProd, setEditingProd] = useState<StockProduct | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCost, setProdCost] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodQty, setProdQty] = useState('');
  const [prodImage, setProdImage] = useState('');

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    const [stockData, insumoData] = await Promise.all([
      DataService.getAllStock(userId),
      DataService.getAllInsumos(userId),
    ]);
    setStockProducts(stockData);
    setInsumos(insumoData);
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    const confirmed = window.confirm(`Tem certeza que deseja excluir o produto "${name}" do estoque?\nEsta ação é permanente.`);
    if (confirmed) {
      await DataService.deleteStockProduct(userId, id);
      loadData();
    }
  };

  const handleAdjustQty = async (id: string, delta: number) => {
    const all = await DataService.getAllStock(userId);
    const item = all.find(x => x.id === id);
    if (item) {
      const updatedQty = Math.max(0, item.quantity + delta);
      await DataService.saveStockProduct(userId, {
        ...item,
        quantity: updatedQty
      });
      loadData();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProdImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenEditModal = (prod: StockProduct) => {
    setEditingProd(prod);
    setProdName(prod.name);
    setProdCost(prod.costUnit.toString());
    setProdPrice(prod.priceSale.toString());
    setProdQty(prod.quantity.toString());
    setProdImage(prod.image || '');
    setIsEditModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodCost || !prodPrice || !prodQty) {
      alert('Preencha todos os campos.');
      return;
    }

    if (editingProd) {
      await DataService.saveStockProduct(userId, {
        id: editingProd.id,
        name: prodName.trim(),
        costUnit: parseFloat(prodCost),
        priceSale: parseFloat(prodPrice),
        quantity: parseFloat(prodQty),
        image: prodImage,
        lotId: editingProd.lotId
      });
      setIsEditModalOpen(false);
      loadData();
    }
  };

  // Calculations for dashboard
  const getTotalCostProductsValue = () => {
    return stockProducts.reduce((sum, p) => sum + (p.costUnit * p.quantity), 0);
  };

  const getTotalSaleProductsValue = () => {
    return stockProducts.reduce((sum, p) => sum + (p.priceSale * p.quantity), 0);
  };

  const getTotalInsumosCostValue = () => {
    return insumos.reduce((sum, i) => sum + (i.costValue * i.currentStock), 0);
  };

  const getFilteredItems = () => {
    const q = searchQuery.toLowerCase();
    if (activeTab === 'products') {
      return stockProducts.filter(p => p.name.toLowerCase().includes(q));
    } else {
      return insumos.filter(i => i.description.toLowerCase().includes(q));
    }
  };

  const filteredItems = getFilteredItems();

  return (
    <div id="estoque-screen" className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-chocolate">Estoque Geral</h1>
          <p className="text-xs text-brand-brown-light font-medium">Controle físico de insumos e produtos acabados para venda</p>
        </div>

        {/* Tab switchers */}
        <div className="bg-white/30 backdrop-blur-sm p-1 rounded-2xl flex border border-white/40">
          <button
            onClick={() => { setActiveTab('products'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${activeTab === 'products' ? 'bg-white/60 backdrop-blur-xs text-brand-chocolate shadow-sm border border-white/50' : 'text-brand-brown-light hover:text-brand-chocolate'}`}
          >
            <Package className="w-3.5 h-3.5" />
            Produtos Prontos ({stockProducts.length})
          </button>
          <button
            onClick={() => { setActiveTab('insumos'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${activeTab === 'insumos' ? 'bg-white/60 backdrop-blur-xs text-brand-chocolate shadow-sm border border-white/50' : 'text-brand-brown-light hover:text-brand-chocolate'}`}
          >
            <Layers className="w-3.5 h-3.5" />
            Insumos ({insumos.length})
          </button>
        </div>
      </div>

      {/* Financial Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/45 backdrop-blur-md rounded-2xl border border-white/55 p-4 shadow-sm">
          <span className="text-[10px] text-brand-brown-light/60 block uppercase font-bold">Valor Estoque Insumos</span>
          <p className="font-mono text-xl font-bold text-brand-chocolate mt-1">
            R$ {getTotalInsumosCostValue().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-brand-brown-light block mt-0.5">Capital investido em ingredientes</span>
        </div>

        <div className="bg-white/45 backdrop-blur-md rounded-2xl border border-white/55 p-4 shadow-sm">
          <span className="text-[10px] text-brand-brown-light/60 block uppercase font-bold">Custo de Produtos Prontos</span>
          <p className="font-mono text-xl font-bold text-brand-chocolate mt-1">
            R$ {getTotalCostProductsValue().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-brand-brown-light block mt-0.5">Custo de produção estocado</span>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-md text-white rounded-2xl p-4 shadow-sm border border-white/10">
          <span className="text-[10px] text-brand-gold/80 block uppercase font-bold">Faturamento Estimado</span>
          <p className="font-mono text-xl font-bold text-brand-gold mt-1">
            R$ {getTotalSaleProductsValue().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-white/75 block mt-0.5">Lucro Potencial: <span className="font-bold text-emerald-400">R$ {(getTotalSaleProductsValue() - getTotalCostProductsValue()).toFixed(2)}</span></span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-brown-light/50 pointer-events-none">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={activeTab === 'products' ? "Pesquisar produtos prontos..." : "Pesquisar insumos em estoque..."}
          className="w-full pl-10 pr-4 py-3 bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl text-brand-chocolate placeholder-brand-brown-light/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose focus:bg-white/60 transition shadow-sm"
        />
      </div>

      {/* Products Stock List */}
      {activeTab === 'products' ? (
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 p-10 text-center text-brand-brown-light/60">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-35 text-brand-rose" />
              <p className="text-sm font-semibold text-brand-chocolate">Sem produtos estocados.</p>
              <p className="text-xs mt-1.5 mb-4">Finalize um lote de produção para enviar produtos diretamente para o estoque!</p>
              {onNavigateToLots && (
                <button
                  onClick={onNavigateToLots}
                  className="bg-brand-chocolate text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm hover:bg-brand-chocolate/90 transition active:scale-95 touch-target cursor-pointer"
                >
                  Ir para Lotes de Produção
                </button>
              )}
            </div>
          ) : (
            (filteredItems as StockProduct[]).map((prod) => {
              const profitPerUnit = prod.priceSale - prod.costUnit;
              const totalCostVal = prod.costUnit * prod.quantity;
              const totalSaleVal = prod.priceSale * prod.quantity;
              const isOut = prod.quantity === 0;

              return (
                <motion.div
                  key={prod.id}
                  layoutId={`stock-prod-${prod.id}`}
                  className="bg-white/45 backdrop-blur-md rounded-2xl border border-white/55 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    {prod.image ? (
                      <img src={prod.image} alt={prod.name} className="w-12 h-12 object-cover rounded-xl border border-white/50 shadow-sm shrink-0" />
                    ) : (
                      <div className="w-12 h-12 bg-brand-rose/10 text-brand-rose rounded-xl flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-brand-chocolate text-base truncate">{prod.name}</h3>
                        {isOut && (
                          <span className="bg-rose-50 text-rose-800 border border-rose-200 text-[9px] font-bold px-2 py-0.5 rounded-full">
                            Sem Estoque
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs text-brand-brown-light font-medium">
                      <div>
                        <span className="block text-[10px] text-brand-brown-light/60 uppercase font-bold">Custo Prod.</span>
                        <span className="font-mono text-brand-chocolate">R$ {prod.costUnit.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-brand-brown-light/60 uppercase font-bold">Preço de Venda</span>
                        <span className="font-mono text-brand-chocolate font-semibold">R$ {prod.priceSale.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-brand-brown-light/60 uppercase font-bold font-mono">Lucro p/ Unid.</span>
                        <span className="font-mono text-emerald-600 font-semibold">+R$ {profitPerUnit.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-brand-brown-light/60 uppercase font-bold">Valores Totais</span>
                        <span className="font-mono text-brand-chocolate">Custo: <span className="font-bold">R${totalCostVal.toFixed(1)}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Stock adjust Controls */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/20 shrink-0">
                    <div className="flex items-center gap-2 bg-white/40 backdrop-blur-xs p-1.5 rounded-xl border border-white/45">
                      <button
                        onClick={() => handleAdjustQty(prod.id, -1)}
                        className="w-8 h-8 flex items-center justify-center bg-white/60 border border-white/50 text-brand-chocolate rounded-lg font-bold hover:bg-rose-50 transition active:scale-90 cursor-pointer"
                        title="Remover 1 unidade"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-sm text-brand-chocolate text-center min-w-[36px]">
                        {prod.quantity}
                      </span>
                      <button
                        onClick={() => handleAdjustQty(prod.id, 1)}
                        className="w-8 h-8 flex items-center justify-center bg-white/60 border border-white/50 text-brand-chocolate rounded-lg font-bold hover:bg-emerald-50 transition active:scale-90 cursor-pointer"
                        title="Adicionar 1 unidade"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenEditModal(prod)}
                        className="p-2 bg-white/40 text-brand-chocolate hover:text-brand-gold rounded-xl border border-white/50 transition active:scale-95 touch-target cursor-pointer"
                        title="Editar produto no estoque"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.id, prod.name)}
                        className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 transition hover:bg-rose-100 active:scale-95 cursor-pointer"
                        title="Excluir produto do estoque"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      ) : (
        /* Insumos Stock List */
        <div className="bg-white/40 backdrop-blur-xl rounded-2xl border border-white/50 overflow-hidden shadow-sm">
          <div className="p-4 bg-white/20 border-b border-white/30 flex items-center gap-1.5 text-xs text-brand-brown-light">
            <Info className="w-4 h-4 text-brand-rose" />
            <span>O estoque de insumos diminui automaticamente ao concluir lotes e pode ser reabastecido no painel de Cadastro de Insumos.</span>
          </div>

          <div className="divide-y divide-white/25">
            {filteredItems.length === 0 ? (
              <div className="p-10 text-center text-brand-brown-light/60">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-35 text-brand-rose" />
                <p className="text-sm font-semibold">Nenhum insumo encontrado.</p>
                <p className="text-xs mt-1.5 mb-4">Comece cadastrando suas matérias primas.</p>
                {onNavigateToInsumos && (
                  <button
                    onClick={onNavigateToInsumos}
                    className="bg-brand-chocolate text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm hover:bg-brand-chocolate/90 transition active:scale-95 touch-target cursor-pointer"
                  >
                    Ir para Cadastro de Insumos
                  </button>
                )}
              </div>
            ) : (
              (filteredItems as Insumo[]).map((insumo) => {
                const isLow = insumo.minStock > 0 && insumo.currentStock <= insumo.minStock;
                const valueOfStock = insumo.costValue * insumo.currentStock;
                return (
                  <div key={insumo.id} className="p-4 flex items-center justify-between gap-4 hover:bg-white/10 transition">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-brand-chocolate text-sm truncate">{insumo.description}</span>
                        {isLow && (
                          <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                            Reposição!
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-brand-brown-light mt-0.5 font-mono">
                        Custo unitário: R$ {insumo.costValue.toFixed(3)}/{insumo.unit}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={`font-mono text-sm font-bold ${isLow ? 'text-amber-700' : 'text-brand-chocolate'}`}>
                        {insumo.currentStock} {insumo.unit}
                      </p>
                      <p className="text-[10px] text-brand-brown-light/60 mt-0.5 font-mono">
                        Custo total: R$ {valueOfStock.toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Manual Product Edit Modal */}
      {isEditModalOpen && editingProd && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-white/50 backdrop-blur-xl rounded-3xl p-6 border border-white/60 shadow-2xl relative"
          >
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 p-1 bg-white/40 rounded-full text-brand-chocolate hover:bg-brand-rose/20 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-brand-chocolate mb-4">Editar Produto Estocado</h3>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-brand-chocolate uppercase tracking-wider block">Nome do Produto</label>
                <input
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full px-3 py-2 bg-white/40 border border-white/50 rounded-xl text-sm text-brand-chocolate font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-chocolate uppercase tracking-wider block">Custo Unitário (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={prodCost}
                    onChange={(e) => setProdCost(e.target.value)}
                    className="w-full px-3 py-2 bg-white/40 border border-white/50 rounded-xl text-sm font-mono text-brand-chocolate font-medium"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-chocolate uppercase tracking-wider block">Preço de Venda (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-white/40 border border-white/50 rounded-xl text-sm font-mono text-brand-chocolate font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-brand-chocolate uppercase tracking-wider block">Quantidade em Estoque</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={prodQty}
                  onChange={(e) => setProdQty(e.target.value)}
                  className="w-full px-3 py-2 bg-white/40 border border-white/50 rounded-xl text-sm font-mono text-brand-chocolate font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-brand-chocolate uppercase tracking-wider block">Foto do Produto</label>
                <div className="flex items-center gap-3 bg-white/30 border border-white/45 p-2 rounded-xl">
                  {prodImage ? (
                    <div className="relative shrink-0">
                      <img src={prodImage} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-white/40" />
                      <button
                        type="button"
                        onClick={() => setProdImage('')}
                        className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 hover:bg-rose-700 transition"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-brand-rose/5 border border-brand-rose/10 text-brand-rose/65 rounded-lg flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="text-[10px] text-brand-brown-light file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-brand-rose/10 file:text-brand-rose hover:file:bg-brand-rose/20 file:cursor-pointer w-full"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2.5 bg-white/40 hover:bg-white text-brand-chocolate border border-white/50 rounded-xl font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-chocolate hover:bg-brand-chocolate/90 text-white rounded-xl font-semibold text-xs shadow-md cursor-pointer"
                >
                  Salvar Mudanças
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
