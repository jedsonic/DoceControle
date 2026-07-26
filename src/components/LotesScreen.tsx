import React, { useState, useEffect } from 'react';
import { ProductionLot, Recipe, Insumo, ExtraCost } from '../types';
import { DataService } from '../lib/dataService';
import { Search, Plus, Save, Sparkles, AlertCircle, PlayCircle, CheckCircle, Package, ArrowRight, ArrowLeft, PlusCircle, Trash, X } from 'lucide-react';
import { motion } from 'motion/react';

interface LotesScreenProps {
  userId: string;
  onBack?: () => void;
  onNavigateToStock?: () => void;
}

export default function LotesScreen({ userId, onBack, onNavigateToStock }: LotesScreenProps) {
  const [lots, setLots] = useState<ProductionLot[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingLot, setEditingLot] = useState<ProductionLot | null>(null);

  // Form states
  const [recipeId, setRecipeId] = useState('');
  const [name, setName] = useState('');
  const [yieldActual, setYieldActual] = useState('1');
  const [extraCosts, setExtraCosts] = useState<ExtraCost[]>([]);
  const [finalPrice, setFinalPrice] = useState('');
  
  // Extra cost entry form states
  const [extraName, setExtraName] = useState('');
  const [extraValue, setExtraValue] = useState('');

  // AI advisory state
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // New States for custom modal confirmation and notifications
  const [confirmingLotId, setConfirmingLotId] = useState<string | null>(null);
  const [successNotification, setSuccessNotification] = useState<{
    lotName: string;
    yieldActual: number;
    yieldUnit: string;
    finalPrice: number;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    const [lotData, recipeData, insumoData] = await Promise.all([
      DataService.getAllLots(userId),
      DataService.getAllRecipes(userId),
      DataService.getAllInsumos(userId),
    ]);
    setLots(lotData);
    setRecipes(recipeData);
    setInsumos(insumoData);
  };

  const handleRecipeChange = (selectedRecipeId: string) => {
    setRecipeId(selectedRecipeId);
    const recipe = recipes.find(r => r.id === selectedRecipeId);
    if (recipe) {
      // Pre-fill name and yield based on recipe
      setName(`${recipe.name} - Lote #${Math.floor(Math.random() * 100) + 1}`);
      setYieldActual(recipe.yieldAmount.toString());
      setAiAdvice(null);
    }
  };

  const startAddLot = () => {
    setEditingLot(null);
    setRecipeId('');
    setName('');
    setYieldActual('1');
    setExtraCosts([
      { name: 'Embalagem e Etiqueta', value: 3.50 },
      { name: 'Gás e Energia', value: 2.00 }
    ]); // standard starters for gourmet confectioners
    setFinalPrice('');
    setExtraName('');
    setExtraValue('');
    setAiAdvice(null);
    setAiError(null);
    setIsEditMode(true);
  };

  const startEditLot = (lot: ProductionLot) => {
    setEditingLot(lot);
    setRecipeId(lot.recipeId);
    setName(lot.name);
    setYieldActual(lot.yieldActual.toString());
    setExtraCosts([...lot.costExtra]);
    setFinalPrice(lot.finalPrice.toString());
    setExtraName('');
    setExtraValue('');
    setAiAdvice(null);
    setAiError(null);
    setIsEditMode(true);
  };

  const handleAddExtraCost = () => {
    if (!extraName.trim() || !extraValue || parseFloat(extraValue) <= 0) {
      alert('Por favor, informe o nome e um valor válido para o custo extra.');
      return;
    }

    setExtraCosts([...extraCosts, {
      name: extraName.trim(),
      value: parseFloat(extraValue)
    }]);

    setExtraName('');
    setExtraValue('');
  };

  const handleRemoveExtraCost = (index: number) => {
    setExtraCosts(extraCosts.filter((_, i) => i !== index));
  };

  // Pricing calculations
  const getRecipeIngredientsCost = (): number => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return 0;
    
    // Calculate cost based on actual lot scale
    const baseRecipeCost = recipe.ingredients.reduce((sum, ing) => {
      const match = insumos.find(i => i.id === ing.insumoId);
      if (!match) return sum;
      return sum + (match.costValue * ing.quantity);
    }, 0);

    const targetYield = parseFloat(yieldActual) || 1;
    const scale = targetYield / recipe.yieldAmount;
    return baseRecipeCost * scale;
  };

  const getExtraCostsTotal = (): number => {
    return extraCosts.reduce((sum, c) => sum + c.value, 0);
  };

  const getTotalCost = (): number => {
    return getRecipeIngredientsCost() + getExtraCostsTotal();
  };

  const getCostUnit = (): number => {
    const qty = parseFloat(yieldActual) || 1;
    return getTotalCost() / qty;
  };

  // 40/40/20 Suggested Sale Price
  // Production Cost represents 40% of final sales price. Price = Cost / 0.4
  const getSuggestedPrice = (): number => {
    const costUnit = getCostUnit();
    return costUnit / 0.4;
  };

  // Form submit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipeId || !name.trim() || !yieldActual) {
      alert('Por favor, selecione uma receita e preencha todos os dados.');
      return;
    }

    const costIngredients = getRecipeIngredientsCost();
    const costTotal = getTotalCost();
    const costUnit = getCostUnit();
    const suggestedPrice = getSuggestedPrice();
    const finalPriceChosen = finalPrice ? parseFloat(finalPrice) : suggestedPrice;

    const payload = {
      id: editingLot?.id,
      recipeId,
      name: name.trim(),
      yieldActual: parseFloat(yieldActual),
      costIngredients,
      costExtra: extraCosts,
      costTotal,
      costUnit,
      suggestedPrice,
      finalPrice: finalPriceChosen,
      status: editingLot?.status || 'production',
      date: editingLot?.date || new Date().toISOString().split('T')[0]
    };

    await DataService.saveLot(userId, payload);
    setIsEditMode(false);
    loadData();
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(`Deseja realmente excluir o lote de produção "${name}"?\nEsta ação é irreversível.`);
    if (confirmed) {
      await DataService.deleteLot(userId, id);
      loadData();
    }
  };

  const handleSendToStock = (lotId: string) => {
    setConfirmingLotId(lotId);
  };

  const handleConfirmSendToStock = async (lotId: string) => {
    const lot = lots.find(l => l.id === lotId);
    if (!lot) return;

    const res = await DataService.completeProductionLot(userId, lotId);
    if (res.success) {
      const recipe = recipes.find(r => r.id === lot.recipeId);
      setSuccessNotification({
        lotName: lot.name,
        yieldActual: lot.yieldActual,
        yieldUnit: recipe?.yieldUnit || 'un',
        finalPrice: lot.finalPrice
      });
      loadData();
    } else {
      alert(res.message);
    }
    setConfirmingLotId(null);
  };

  // Request pricing advice from Gemini AI Advisor
  const handleGetAiAdvice = async () => {
    setIsAiLoading(true);
    setAiError(null);
    setAiAdvice(null);

    const recipe = recipes.find(r => r.id === recipeId);

    try {
      const response = await fetch('/api/ai/pricing-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeName: name,
          yieldAmount: parseFloat(yieldActual),
          costIngredients: getRecipeIngredientsCost(),
          costExtra: extraCosts,
          totalCost: getTotalCost(),
          costUnit: getCostUnit(),
          suggestedPrice: getSuggestedPrice()
        })
      });

      const data = await response.json();
      if (response.ok) {
        setAiAdvice(data.advice);
      } else {
        setAiError(data.error || 'Erro ao gerar parecer da IA.');
      }
    } catch (err: any) {
      setAiError('Não foi possível conectar ao assistente de IA. Verifique se o servidor está rodando.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Lightweight custom markdown formatter
  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Headers
      if (line.startsWith('### ')) {
        return <h4 key={i} className="text-sm font-bold text-brand-chocolate mt-3 mb-1">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={i} className="text-base font-bold text-brand-chocolate mt-4 mb-1.5 border-b border-brand-brown-light/10 pb-0.5">{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('# ')) {
        return <h2 key={i} className="text-lg font-bold text-brand-chocolate mt-4 mb-2">{line.replace('# ', '')}</h2>;
      }
      // List items
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const cleaned = line.replace(/^[\s]*[-*]\s+/, '');
        // format bold inside list items
        return (
          <li key={i} className="ml-4 list-disc text-xs text-brand-chocolate/90 leading-relaxed mb-1">
            {formatBold(cleaned)}
          </li>
        );
      }
      // Regular paragraphs
      if (line.trim() === '') return <div key={i} className="h-2" />;
      return (
        <p key={i} className="text-xs text-brand-chocolate/95 leading-relaxed mb-2">
          {formatBold(line)}
        </p>
      );
    });
  };

  const formatBold = (str: string) => {
    const parts = str.split('**');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-bold text-brand-chocolate">{part}</strong>;
      }
      return part;
    });
  };

  // Filter lots based on query
  const filteredLots = lots.filter(lot => {
    const q = searchQuery.toLowerCase();
    const recipe = recipes.find(r => r.id === lot.recipeId);
    return (
      lot.name.toLowerCase().includes(q) ||
      (recipe?.name || '').toLowerCase().includes(q) ||
      lot.status.toLowerCase().includes(q)
    );
  });

  return (
    <div id="lotes-screen" className="max-w-4xl mx-auto px-4 py-6">
      {!isEditMode ? (
        <>
          {/* List View Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {onBack && (
                <button 
                  onClick={onBack}
                  className="p-2 bg-white rounded-xl border border-brand-brown-light/10 text-brand-chocolate hover:bg-brand-cream/50 transition active:scale-95 touch-target"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-brand-chocolate">Lotes de Produção</h1>
                <p className="text-xs text-brand-brown-light font-medium">Controle de lotes e precificação de vendas</p>
              </div>
            </div>

            <button
              onClick={startAddLot}
              className="bg-brand-chocolate hover:bg-brand-chocolate/90 text-white font-semibold text-xs py-3 px-4 rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition touch-target"
            >
              <Plus className="w-4 h-4 text-brand-gold" />
              Novo Lote
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mb-6">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-brown-light/50 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar lotes de produção por nome, receita ou status..."
              className="w-full pl-10 pr-4 py-3 bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl text-brand-chocolate placeholder-brand-brown-light/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose focus:bg-white/60 transition shadow-sm"
            />
          </div>

          {/* Lots List */}
          <div className="space-y-4">
            {filteredLots.length === 0 ? (
              <div className="bg-white rounded-2xl border border-brand-brown-light/10 p-10 text-center text-brand-brown-light/60">
                <PlayCircle className="w-12 h-12 mx-auto mb-3 opacity-35 text-brand-rose" />
                <p className="text-sm font-semibold text-brand-chocolate">Nenhum lote registrado.</p>
                <p className="text-xs mt-1">Abra um lote de produção para calcular custos reais e abastecer o estoque.</p>
              </div>
            ) : (
              filteredLots.map((lot) => {
                const recipe = recipes.find(r => r.id === lot.recipeId);
                const isCompleted = lot.status === 'completed';
                
                return (
                  <motion.div
                    key={lot.id}
                    layoutId={`lot-card-${lot.id}`}
                    className="bg-white/45 backdrop-blur-md rounded-2xl border border-white/55 p-5 shadow-xs hover:shadow-md transition flex flex-col md:flex-row justify-between gap-4 relative overflow-hidden"
                  >
                    {/* Visual Status Indicator Strip */}
                    <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${isCompleted ? 'bg-emerald-500' : 'bg-brand-rose'}`} />

                    {/* Left Column Details */}
                    <div className="pl-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-bold text-brand-chocolate text-base truncate">{lot.name}</h3>
                        {isCompleted ? (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Estoque Concluído
                          </span>
                        ) : (
                          <span className="bg-rose-50 text-brand-rose border border-rose-100 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shrink-0 animate-pulse">
                            <PlayCircle className="w-3 h-3 text-brand-rose" />
                            Em Produção
                          </span>
                        )}
                        <span className="bg-brand-cream text-brand-brown-light text-[9px] font-semibold px-2 py-0.5 rounded-full shrink-0 font-mono">
                          {lot.date}
                        </span>
                      </div>

                      <p className="text-xs text-brand-brown-light mb-4">
                        Receita base: <span className="font-bold text-brand-chocolate">{recipe ? recipe.name : 'Receita excluída'}</span>
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="block text-[10px] text-brand-brown-light/50 uppercase">Rendimento</span>
                          <span className="font-semibold text-brand-chocolate">{lot.yieldActual} {recipe?.yieldUnit || 'un'}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-brand-brown-light/50 uppercase">Custo Unitário</span>
                          <span className="font-mono text-brand-chocolate font-bold">R$ {lot.costUnit.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-brand-brown-light/50 uppercase">Sugerido (40/40/20)</span>
                          <span className="font-mono text-brand-gold font-bold">R$ {lot.suggestedPrice.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-brand-brown-light/50 uppercase">Venda Final</span>
                          <span className="font-mono text-emerald-700 font-extrabold text-sm">R$ {lot.finalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column Controls */}
                    <div className="flex flex-row md:flex-col justify-end items-end gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-brand-brown-light/5">
                      {!isCompleted ? (
                        <>
                          <button
                            onClick={() => handleSendToStock(lot.id)}
                            className="flex-1 md:flex-none w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 px-4 font-bold text-xs shadow-sm hover:shadow-md transition flex items-center justify-center gap-1.5 touch-target"
                          >
                            <Package className="w-4 h-4 text-emerald-200" />
                            Enviar p/ Estoque
                          </button>
                          
                          <div className="flex items-center gap-1.5 w-full md:w-auto">
                            <button
                              onClick={() => startEditLot(lot)}
                              className="flex-1 py-2 px-3 bg-brand-cream/40 text-brand-chocolate border border-brand-brown-light/10 rounded-xl font-semibold text-[11px] transition touch-target"
                            >
                              Editar Lote
                            </button>
                            <button
                              onClick={() => handleDelete(lot.id, lot.name)}
                              className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 transition active:scale-95 touch-target"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="w-full text-right">
                          <span className="text-[10px] text-emerald-700/60 block uppercase font-bold mb-1">Rendimento no Estoque</span>
                          <p className="text-xs text-brand-brown-light font-medium">
                            Adicionado {lot.yieldActual} {recipe?.yieldUnit || 'un'} ao estoque de produtos prontos a R$ {lot.finalPrice.toFixed(2)} cada.
                          </p>
                          <button
                            onClick={() => handleDelete(lot.id, lot.name)}
                            className="mt-3 text-[10px] font-bold text-rose-600 hover:underline flex items-center justify-end gap-0.5 ml-auto"
                          >
                            <Trash className="w-3 h-3" /> Excluir Registro Lote
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Edit/Create Lote Form View */
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/40 backdrop-blur-xl rounded-3xl border border-white/60 p-6 shadow-md"
        >
          <div className="flex items-center justify-between border-b border-brand-brown-light/5 pb-4 mb-5">
            <h2 className="text-xl font-bold text-brand-chocolate">
              {editingLot ? 'Editar Lote de Produção' : 'Montar Lote de Produção'}
            </h2>
            <button
              onClick={() => setIsEditMode(false)}
              className="p-1.5 bg-brand-cream rounded-full text-brand-chocolate hover:bg-brand-rose/20 transition active:scale-90"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-brand-chocolate uppercase tracking-wider block">
                  Selecione a Receita Base
                </label>
                <select
                  value={recipeId}
                  onChange={(e) => handleRecipeChange(e.target.value)}
                  className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose/25 focus:border-brand-rose focus:bg-white/60 transition text-brand-chocolate font-medium"
                  required
                >
                  <option value="">Selecione uma receita base...</option>
                  {recipes.map(r => (
                    <option key={r.id} value={r.id}>{r.name} (Rende {r.yieldAmount} {r.yieldUnit})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-brand-chocolate uppercase tracking-wider block">
                  Nome do Lote
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setAiAdvice(null); }}
                  placeholder="Ex: Bolo de Chocolate Lote #41"
                  className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose/25 focus:border-brand-rose focus:bg-white/60 transition text-brand-chocolate font-medium"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-brand-chocolate uppercase tracking-wider block">
                  Rendimento Real Obtido (Rendimento do Lote)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={yieldActual}
                    onChange={(e) => { setYieldActual(e.target.value); setAiAdvice(null); }}
                    className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose/25 focus:border-brand-rose focus:bg-white/60 transition text-brand-chocolate font-mono font-medium"
                    required
                  />
                  <span className="absolute right-4 inset-y-0 flex items-center text-xs text-brand-brown-light font-bold">
                    {recipes.find(r => r.id === recipeId)?.yieldUnit || 'unidades'}
                  </span>
                </div>
                <p className="text-[10px] text-brand-brown-light/70 pl-1">
                  *As quantidades de ingredientes da receita original serão recalculadas proporcionalmente a este rendimento real.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-brand-chocolate uppercase tracking-wider block">
                  Preço Praticado de Venda Final (R$ / un)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={finalPrice}
                  onChange={(e) => setFinalPrice(e.target.value)}
                  placeholder={`Sugerido: R$ ${getSuggestedPrice().toFixed(2)}`}
                  className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose/25 focus:border-brand-rose focus:bg-white/60 transition text-brand-chocolate font-mono font-medium"
                />
                <p className="text-[10px] text-brand-brown-light/70 pl-1">
                  *Deixe vazio para adotar automaticamente a sugestão da regra 40/40/20 de R$ {getSuggestedPrice().toFixed(2)}.
                </p>
              </div>
            </div>

            {/* Extra Costs Composition Section */}
            <div className="border-t border-white/20 pt-4">
              <h3 className="font-bold text-brand-chocolate text-base mb-3 flex items-center gap-1">
                <span>Composição de Custos Extras do Lote</span>
                <span className="text-xs text-brand-brown-light font-normal">(embalagem, fitas, fita, entrega, mão de obra extra...)</span>
              </h3>

              <div className="bg-white/30 backdrop-blur-sm p-4 rounded-2xl border border-white/40 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end mb-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-chocolate uppercase tracking-wider block">
                    Descrição do Custo Extra
                  </label>
                  <input
                    type="text"
                    value={extraName}
                    onChange={(e) => setExtraName(e.target.value)}
                    placeholder="Ex: Embalagem Fita Cetim, Adesivo"
                    className="w-full px-3 py-2.5 bg-white border border-brand-brown-light/15 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-rose/25 focus:border-brand-rose transition text-brand-chocolate font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-chocolate uppercase tracking-wider block">
                    Valor total de Custo Extra (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={extraValue}
                    onChange={(e) => setExtraValue(e.target.value)}
                    placeholder="Ex: 5.00"
                    className="w-full px-3 py-2.5 bg-white border border-brand-brown-light/15 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-rose/25 focus:border-brand-rose transition text-brand-chocolate font-mono font-medium"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddExtraCost}
                  className="w-full py-2.5 bg-brand-chocolate text-white rounded-xl font-bold text-xs shadow-sm hover:bg-brand-chocolate/90 transition flex items-center justify-center gap-1 touch-target cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-brand-gold" />
                  Incluir Custo Extra
                </button>
              </div>

              {/* List of Extra Costs */}
              <div className="space-y-1.5 max-h-40 overflow-y-auto mb-4 pr-1">
                {extraCosts.length === 0 ? (
                  <p className="text-xs text-brand-brown-light/70 text-center py-2 italic">
                    Nenhum custo extra lançado.
                  </p>
                ) : (
                  extraCosts.map((c, idx) => (
                    <div key={idx} className="bg-white border border-brand-brown-light/10 py-2 px-3 rounded-xl flex justify-between items-center text-xs">
                      <span className="font-medium text-brand-chocolate">{c.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-brand-chocolate">R$ {c.value.toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveExtraCost(idx)}
                          className="text-rose-600 hover:text-rose-700 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Powerful Price Composition Advice Card */}
            {recipeId && (
              <div className="border-t border-white/20 pt-4">
                <div className="bg-slate-900/80 backdrop-blur-xl text-white rounded-3xl p-6 shadow-lg border border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 rounded-full -mr-16 -mt-16 opacity-50 blur-xl" />
                  
                  <h3 className="font-bold text-brand-gold text-lg mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-brand-gold" />
                    Calculadora de Preço de Venda (Regra 40/40/20)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5 border-b border-white/10 pb-4">
                    <div>
                      <span className="text-[10px] text-white/50 block uppercase tracking-wider">Custo dos Ingredientes</span>
                      <span className="font-mono font-bold text-base text-white">R$ {getRecipeIngredientsCost().toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/50 block uppercase tracking-wider">Custos Extras</span>
                      <span className="font-mono font-bold text-base text-white">R$ {getExtraCostsTotal().toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-brand-gold block uppercase tracking-wider font-semibold">CUSTO TOTAL DO LOTE</span>
                      <span className="font-mono font-extrabold text-lg text-brand-gold">R$ {getTotalCost().toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-white/60 block uppercase tracking-wider">CUSTO UNITÁRIO DO PRODUTO</span>
                        <span className="font-mono text-xl md:text-2xl font-bold text-white block mt-1">R$ {getCostUnit().toFixed(2)}</span>
                      </div>
                      <span className="text-[10px] text-white/50 block mt-2">Custo de fábrica por unidade produzida</span>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-brand-gold block uppercase tracking-wider font-bold">PREÇO RECOMENDADO (40/40/20)</span>
                        <span className="font-mono text-xl md:text-2xl font-extrabold text-brand-gold block mt-1">R$ {getSuggestedPrice().toFixed(2)}</span>
                      </div>
                      <span className="text-[10px] text-white/70 block mt-2">Garante reposição, lucro e fundo de reserva</span>
                    </div>
                    <div className="bg-white/10 p-4 rounded-2xl border border-brand-rose/30 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-brand-rose block uppercase tracking-wider font-bold">VALOR DE VENDA</span>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-sm font-bold text-white/50 font-mono">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={finalPrice}
                            onChange={(e) => setFinalPrice(e.target.value)}
                            placeholder={getSuggestedPrice().toFixed(2)}
                            className="w-full bg-transparent border-b border-white/20 text-xl md:text-2xl font-mono font-bold text-white focus:outline-none focus:border-brand-rose transition-all py-0"
                          />
                        </div>
                      </div>
                      <span className="text-[10px] text-white/50 block mt-2">Adote ou digite seu preço de venda final</span>
                    </div>
                  </div>

                  {/* 40/40/20 Allocation visual bar */}
                  <div className="space-y-2 mb-6">
                    <span className="text-[11px] text-white/75 block uppercase font-bold tracking-wider">
                      Como se distribui a venda de R$ {getSuggestedPrice().toFixed(2)}:
                    </span>
                    <div className="h-6 w-full rounded-xl overflow-hidden flex text-[10px] font-bold text-white shadow-inner">
                      <div className="bg-brand-brown-light flex items-center justify-center" style={{ width: '40%' }} title="Reposição de Insumos">
                        40% Reposição
                      </div>
                      <div className="bg-brand-rose flex items-center justify-center" style={{ width: '40%' }} title="Margem de Lucro">
                        40% Lucro
                      </div>
                      <div className="bg-brand-gold text-brand-chocolate flex items-center justify-center" style={{ width: '20%' }} title="Fundo de Emergência">
                        20% Caixa
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[10px] text-white/75 font-mono">
                      <div>• Reposição: R$ {(getSuggestedPrice() * 0.4).toFixed(2)}</div>
                      <div>• Lucro: R$ {(getSuggestedPrice() * 0.4).toFixed(2)}</div>
                      <div>• Caixa/Emerg.: R$ {(getSuggestedPrice() * 0.2).toFixed(2)}</div>
                    </div>
                  </div>

                    {/* AI Advisor Button and Output */}
                  <div className="border-t border-white/10 pt-4">
                    <button
                      type="button"
                      onClick={handleGetAiAdvice}
                      disabled={isAiLoading}
                      className="w-full bg-white/90 hover:bg-white text-brand-chocolate py-3 px-4 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 touch-target"
                    >
                      <Sparkles className="w-4 h-4 text-brand-rose animate-spin-slow" />
                      {isAiLoading ? 'Analisando lote com o consultor financeiro AI...' : 'Chamar Consultor Financeiro IA (Gemini)'}
                    </button>

                    {/* AI Advisory message */}
                    {aiAdvice && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/80 backdrop-blur-lg text-brand-chocolate rounded-2xl p-4 mt-4 max-h-72 overflow-y-auto border border-white/40 shadow-xl scrollbar-thin"
                      >
                        <div className="flex items-center gap-2 mb-3 border-b border-brand-brown-light/10 pb-2">
                          <Sparkles className="w-4 h-4 text-brand-gold shrink-0" />
                          <span className="text-xs font-bold text-brand-chocolate">Parecer da Inteligência Artificial:</span>
                        </div>
                        <div className="space-y-1 text-left">
                          {renderMarkdown(aiAdvice)}
                        </div>
                      </motion.div>
                    )}

                    {aiError && (
                      <div className="bg-rose-550/20 text-rose-200 text-xs p-3 rounded-xl mt-3 text-center border border-rose-500/30">
                        {aiError}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-brand-brown-light/5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsEditMode(false)}
                className="flex-1 py-3.5 bg-brand-cream/60 hover:bg-brand-cream text-brand-chocolate rounded-xl font-bold text-xs border border-brand-brown-light/10 transition touch-target"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-3.5 bg-brand-chocolate hover:bg-brand-chocolate/90 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 touch-target"
              >
                <Save className="w-4 h-4 text-brand-gold" />
                Salvar Lote de Produção
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Confirmation Modal */}
      {confirmingLotId && (() => {
        const lot = lots.find(l => l.id === confirmingLotId);
        if (!lot) return null;
        const recipe = recipes.find(r => r.id === lot.recipeId);
        const scaleFactor = recipe ? lot.yieldActual / recipe.yieldAmount : 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl border border-brand-brown-light/10 shadow-2xl p-6 max-w-md w-full relative"
            >
              <h3 className="text-lg font-bold text-brand-chocolate mb-2 flex items-center gap-2">
                <Package className="w-5 h-5 text-brand-rose" />
                Confirmar Envio para Estoque
              </h3>
              <p className="text-xs text-brand-brown-light mb-4">
                Deseja finalizar o lote <span className="font-bold text-brand-chocolate">"{lot.name}"</span>? Esta ação irá deduzir as quantidades de ingredientes do estoque de insumos e adicionar o produto pronto ao estoque.
              </p>

              {recipe && (
                <div className="bg-brand-cream/30 border border-brand-brown-light/5 p-4 rounded-2xl mb-5">
                  <h4 className="text-[10px] font-bold text-brand-chocolate uppercase tracking-wider mb-2">
                    Ingredientes que serão deduzidos:
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                    {recipe.ingredients.map((ing, idx) => {
                      const match = insumos.find(i => i.id === ing.insumoId);
                      const neededQty = ing.quantity * scaleFactor;
                      return (
                        <div key={idx} className="flex justify-between items-center text-xs border-b border-brand-brown-light/5 pb-1.5 last:border-0 last:pb-0">
                          <span className="text-brand-chocolate font-medium">{match?.description || 'Ingrediente'}</span>
                          <span className="font-mono text-rose-600 font-semibold">
                            -{neededQty.toFixed(1)} {match?.unit || 'un'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmingLotId(null)}
                  className="flex-1 py-3 bg-brand-cream/60 hover:bg-brand-cream text-brand-chocolate rounded-xl font-bold text-xs border border-brand-brown-light/10 transition touch-target"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleConfirmSendToStock(lot.id)}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition touch-target flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-200" />
                  Confirmar e Enviar
                </button>
              </div>
            </motion.div>
          </div>
        );
      })()}

      {/* Success Notification Modal */}
      {successNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl border border-brand-brown-light/10 shadow-2xl p-6 max-w-md w-full text-center relative overflow-hidden"
          >
            {/* Celebration Background Circles */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/5 rounded-full -mt-24 blur-xl" />

            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10">
              <CheckCircle className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-brand-chocolate mb-2 relative z-10">
              Enviado com Sucesso!
            </h3>
            <p className="text-xs text-brand-brown-light mb-6 px-2 relative z-10">
              O lote <span className="font-bold text-brand-chocolate">"{successNotification.lotName}"</span> foi finalizado. Foram adicionados <span className="font-bold text-brand-chocolate">{successNotification.yieldActual} {successNotification.yieldUnit}</span> ao estoque de produtos prontos a <span className="font-bold text-brand-chocolate">R$ {successNotification.finalPrice.toFixed(2)}</span> cada. Os insumos foram baixados com sucesso.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 relative z-10">
              <button
                onClick={() => setSuccessNotification(null)}
                className="flex-1 py-3 bg-brand-cream/60 hover:bg-brand-cream text-brand-chocolate rounded-xl font-bold text-xs border border-brand-brown-light/10 transition touch-target"
              >
                Continuar na Produção
              </button>
              {onNavigateToStock && (
                <button
                  onClick={() => {
                    setSuccessNotification(null);
                    onNavigateToStock();
                  }}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition touch-target flex items-center justify-center gap-1.5"
                >
                  <Package className="w-4 h-4 text-emerald-200" />
                  Ir para o Estoque
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
