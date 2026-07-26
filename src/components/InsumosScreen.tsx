import React, { useState, useEffect } from 'react';
import { Insumo } from '../types';
import { StorageService } from '../lib/storage';
import { Search, Plus, Edit2, Trash2, ArrowLeft, Save, ShoppingBag, AlertTriangle, X } from 'lucide-react';
import { motion } from 'motion/react';

interface InsumosScreenProps {
  userId: string;
  onBack?: () => void;
}

export default function InsumosScreen({ userId, onBack }: InsumosScreenProps) {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);

  // Form states
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('g');
  const [packageQty, setPackageQty] = useState('1');
  const [packageCost, setPackageCost] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [minStock, setMinStock] = useState('');

  useEffect(() => {
    loadInsumos();
  }, [userId]);

  const loadInsumos = () => {
    setInsumos(StorageService.getAllInsumos(userId));
  };

  const openAddModal = () => {
    setEditingInsumo(null);
    setDescription('');
    setUnit('g');
    setPackageQty('1');
    setPackageCost('');
    setCurrentStock('');
    setMinStock('');
    setIsModalOpen(true);
  };

  const openEditModal = (insumo: Insumo) => {
    setEditingInsumo(insumo);
    setDescription(insumo.description);
    setUnit(insumo.unit);
    
    const pQty = insumo.packageQty !== undefined ? insumo.packageQty.toString() : '1';
    const pCost = insumo.packageCost !== undefined ? insumo.packageCost.toString() : insumo.costValue.toString();
    
    setPackageQty(pQty);
    setPackageCost(pCost);
    setCurrentStock(insumo.currentStock.toString());
    setMinStock(insumo.minStock.toString());
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim() || !unit.trim() || !packageCost || !packageQty || !currentStock || !minStock) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    const cost = parseFloat(packageCost);
    const qty = parseFloat(packageQty);
    
    if (qty <= 0 || isNaN(qty)) {
      alert('A quantidade da embalagem deve ser maior que zero.');
      return;
    }

    const computedCostValue = cost / qty;

    const payload = {
      id: editingInsumo?.id,
      description: description.trim(),
      unit: unit.trim(),
      costValue: computedCostValue,
      packageQty: qty,
      packageCost: cost,
      currentStock: parseFloat(currentStock),
      minStock: parseFloat(minStock)
    };

    StorageService.saveInsumo(userId, payload);
    setIsModalOpen(false);
    loadInsumos();
  };

  const handleDelete = (id: string, name: string) => {
    const confirmed = window.confirm(`Tem certeza que deseja excluir o insumo "${name}"?\nEsta ação não poderá ser desfeita.`);
    if (confirmed) {
      StorageService.deleteInsumo(userId, id);
      loadInsumos();
    }
  };

  const handleAdjustStock = (id: string, amount: number) => {
    const all = StorageService.getAllInsumos(userId);
    const item = all.find(x => x.id === id);
    if (item) {
      const updatedStock = Math.max(0, item.currentStock + amount);
      StorageService.saveInsumo(userId, {
        ...item,
        currentStock: updatedStock
      });
      loadInsumos();
    }
  };

  // Filter insumos based on query
  const filteredInsumos = insumos.filter(insumo => {
    const q = searchQuery.toLowerCase();
    return (
      insumo.description.toLowerCase().includes(q) ||
      insumo.unit.toLowerCase().includes(q) ||
      insumo.costValue.toString().includes(q) ||
      insumo.currentStock.toString().includes(q)
    );
  });

  return (
    <div id="insumos-screen" className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 bg-white/40 backdrop-blur-sm rounded-xl border border-white/50 text-brand-chocolate hover:bg-white/70 transition active:scale-95 touch-target cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-brand-chocolate">Cadastro de Insumos</h1>
            <p className="text-xs text-brand-brown-light">Matérias-primas e embalagens de produção</p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="bg-brand-chocolate hover:bg-brand-chocolate/90 text-white font-semibold text-xs py-3 px-4 rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition touch-target cursor-pointer"
        >
          <Plus className="w-4 h-4 text-brand-gold" />
          Novo Insumo
        </button>
      </div>

      {/* Search and Alert Panel */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-brown-light/50 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar insumo por descrição, unidade..."
            className="w-full pl-10 pr-4 py-3 bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl text-brand-chocolate placeholder-brand-brown-light/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose focus:bg-white/60 transition shadow-sm"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-brand-brown-light/60 hover:text-brand-chocolate cursor-pointer"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Insumos List */}
      <div className="space-y-3">
        {filteredInsumos.length === 0 ? (
          <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 p-8 text-center text-brand-brown-light/60">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-35 text-brand-rose" />
            <p className="text-sm font-medium">Nenhum insumo encontrado.</p>
            <p className="text-xs mt-1">Experimente mudar o filtro de pesquisa ou cadastrar um novo insumo.</p>
          </div>
        ) : (
          filteredInsumos.map((insumo) => {
            const isLowStock = insumo.minStock > 0 && insumo.currentStock <= insumo.minStock;
            return (
              <motion.div
                key={insumo.id}
                layoutId={`insumo-${insumo.id}`}
                className="bg-white/45 backdrop-blur-md border border-white/55 p-4 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-brand-chocolate text-base truncate">{insumo.description}</h3>
                    {insumo.packageCost !== undefined && insumo.packageQty !== undefined && (
                      <span className="text-[10px] bg-brand-chocolate/5 text-brand-chocolate/80 px-2 py-0.5 rounded-md font-medium font-mono">
                        Emb: R$ {insumo.packageCost.toFixed(2)} ({insumo.packageQty}{insumo.unit})
                      </span>
                    )}
                    {isLowStock && (
                      <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Estoque Baixo
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-brand-brown-light font-medium">
                    <div>
                      <span className="block text-[10px] text-brand-brown-light/60 uppercase">Custo Unitário</span>
                      <span className="font-mono text-brand-chocolate font-semibold">
                        R$ {insumo.costValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 3 })}/{insumo.unit}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-brand-brown-light/60 uppercase">Em Estoque</span>
                      <span className={`font-mono font-bold ${isLowStock ? 'text-amber-700' : 'text-brand-chocolate'}`}>
                        {insumo.currentStock} {insumo.unit}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-brand-brown-light/60 uppercase">Estoque Mín.</span>
                      <span className="font-mono">
                        {insumo.minStock} {insumo.unit}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stock Controls & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/20">
                  {/* Stock Quick Adjustment */}
                  <div className="flex items-center gap-1 bg-white/35 p-1.5 rounded-xl border border-white/45 backdrop-blur-xs">
                    <button
                      onClick={() => handleAdjustStock(insumo.id, insumo.unit === 'un' || insumo.unit === 'kg' ? -1 : -100)}
                      className="w-8 h-8 flex items-center justify-center bg-white/60 border border-white/50 text-brand-chocolate rounded-lg hover:bg-rose-50 active:scale-90 transition font-bold cursor-pointer"
                      title="Reduzir estoque"
                    >
                      -
                    </button>
                    <span className="text-[11px] font-bold px-2 text-brand-chocolate text-center min-w-[50px] font-mono">
                      Ajuste Rápido
                    </span>
                    <button
                      onClick={() => handleAdjustStock(insumo.id, insumo.unit === 'un' || insumo.unit === 'kg' ? 1 : 100)}
                      className="w-8 h-8 flex items-center justify-center bg-white/60 border border-white/50 text-brand-chocolate rounded-lg hover:bg-emerald-50 active:scale-90 transition font-bold cursor-pointer"
                      title="Aumentar estoque"
                    >
                      +
                    </button>
                  </div>

                  {/* Edit / Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(insumo)}
                      className="p-2.5 bg-white/40 text-brand-chocolate hover:text-brand-gold hover:bg-white rounded-xl border border-white/50 transition active:scale-95 touch-target cursor-pointer"
                      title="Editar insumo"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(insumo.id, insumo.description)}
                      className="p-2.5 bg-rose-50 text-rose-600 hover:text-rose-700 hover:bg-rose-100 rounded-xl border border-rose-100 transition active:scale-95 touch-target cursor-pointer"
                      title="Excluir insumo"
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

      {/* Modal / overlay form for adding/editing */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md bg-white/50 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-2xl relative"
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 bg-white/40 rounded-full text-brand-chocolate hover:bg-brand-rose/20 transition active:scale-90 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-xl font-bold text-brand-chocolate mb-4">
              {editingInsumo ? 'Editar Insumo' : 'Novo Insumo'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              {/* descrição/nome */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-brand-chocolate uppercase tracking-wider block">
                  Descrição / Nome
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Leite Condensado Itambé, Embalagem Bolo P"
                  className="w-full px-4 py-3 bg-white/40 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose/25 focus:border-brand-rose transition text-brand-chocolate font-medium"
                  required
                />
              </div>

              {/* unidade medida e Quantidade da embalagem */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-chocolate uppercase tracking-wider block">
                    Unidade Medida
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-4 py-3 bg-white/40 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose/25 focus:border-brand-rose transition text-brand-chocolate font-medium cursor-pointer"
                  >
                    <option value="g">Grama (g)</option>
                    <option value="kg">Quilograma (kg)</option>
                    <option value="ml">Mililitro (ml)</option>
                    <option value="L">Litro (L)</option>
                    <option value="un">Unidade (un)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-chocolate uppercase tracking-wider block">
                    Qtd. da Embalagem
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.0001"
                    value={packageQty}
                    onChange={(e) => setPackageQty(e.target.value)}
                    placeholder="Ex: 1000"
                    className="w-full px-4 py-3 bg-white/40 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose/25 focus:border-brand-rose transition text-brand-chocolate font-mono font-medium"
                    required
                  />
                </div>
              </div>

              {/* Custo e Custo por (preenche conforme unidade) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-chocolate uppercase tracking-wider block">
                    Custo da Embalagem (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={packageCost}
                    onChange={(e) => setPackageCost(e.target.value)}
                    placeholder="Ex: 15.90"
                    className="w-full px-4 py-3 bg-white/40 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose/25 focus:border-brand-rose transition text-brand-chocolate font-mono font-medium"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-chocolate uppercase tracking-wider block">
                    Custo por {unit}
                  </label>
                  <div className="w-full px-4 py-3 bg-white/20 border border-white/35 rounded-xl text-sm text-brand-chocolate/70 font-mono font-semibold flex items-center h-[46px]">
                    R$ {(() => {
                      const cost = parseFloat(packageCost);
                      const qty = parseFloat(packageQty);
                      if (!isNaN(cost) && !isNaN(qty) && qty > 0) {
                        return (cost / qty).toFixed(4);
                      }
                      return '0.0000';
                    })()}
                  </div>
                </div>
              </div>

              {/* Estoque atual e Estoque mínimo */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-chocolate uppercase tracking-wider block">
                    Estoque Atual ({unit})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value)}
                    placeholder="Ex: 2500"
                    className="w-full px-4 py-3 bg-white/40 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose/25 focus:border-brand-rose transition text-brand-chocolate font-mono font-medium"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-chocolate uppercase tracking-wider block">
                    Estoque Mínimo ({unit})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    placeholder="Ex: 500"
                    className="w-full px-4 py-3 bg-white/40 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose/25 focus:border-brand-rose transition text-brand-chocolate font-mono font-medium"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-white/40 hover:bg-white text-brand-chocolate rounded-xl font-bold text-xs border border-white/50 transition touch-target cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-brand-chocolate hover:bg-brand-chocolate/90 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-1 touch-target cursor-pointer"
                >
                  <Save className="w-4 h-4 text-brand-gold" />
                  Salvar Insumo
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
