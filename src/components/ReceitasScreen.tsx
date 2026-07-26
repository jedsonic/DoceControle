import React, { useState, useEffect } from 'react';
import { Recipe, Insumo, RecipeIngredient } from '../types';
import { DataService } from '../lib/dataService';
import { Search, Plus, Edit2, Trash2, ArrowLeft, Save, Sparkles, BookOpen, Trash, X } from 'lucide-react';
import { motion } from 'motion/react';

interface ReceitasScreenProps {
  userId: string;
  onBack?: () => void;
}

export default function ReceitasScreen({ userId, onBack }: ReceitasScreenProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [yieldAmount, setYieldAmount] = useState('1');
  const [yieldUnit, setYieldUnit] = useState('fatias');
  const [notes, setNotes] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState<RecipeIngredient[]>([]);

  // Selected single ingredient state for adding
  const [tempInsumoId, setTempInsumoId] = useState('');
  const [tempQuantity, setTempQuantity] = useState('');

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    const [recipeData, insumoData] = await Promise.all([
      DataService.getAllRecipes(userId),
      DataService.getAllInsumos(userId),
    ]);
    setRecipes(recipeData);
    setInsumos(insumoData);
  };

  const startAddRecipe = () => {
    setEditingRecipe(null);
    setName('');
    setYieldAmount('1');
    setYieldUnit('unidades');
    setNotes('');
    setSelectedIngredients([]);
    setTempInsumoId('');
    setTempQuantity('');
    setIsEditMode(true);
  };

  const startEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setName(recipe.name);
    setYieldAmount(recipe.yieldAmount.toString());
    setYieldUnit(recipe.yieldUnit);
    setNotes(recipe.notes || '');
    setSelectedIngredients([...recipe.ingredients]);
    setTempInsumoId('');
    setTempQuantity('');
    setIsEditMode(true);
  };

  const handleAddIngredient = () => {
    if (!tempInsumoId || !tempQuantity || parseFloat(tempQuantity) <= 0) {
      alert('Por favor, selecione um insumo e digite uma quantidade válida.');
      return;
    }

    // Check if ingredient already added
    const existsIndex = selectedIngredients.findIndex(item => item.insumoId === tempInsumoId);
    if (existsIndex !== -1) {
      const updated = [...selectedIngredients];
      updated[existsIndex].quantity += parseFloat(tempQuantity);
      setSelectedIngredients(updated);
    } else {
      setSelectedIngredients([...selectedIngredients, {
        insumoId: tempInsumoId,
        quantity: parseFloat(tempQuantity)
      }]);
    }

    setTempInsumoId('');
    setTempQuantity('');
  };

  const handleRemoveIngredient = (index: number) => {
    const updated = selectedIngredients.filter((_, i) => i !== index);
    setSelectedIngredients(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !yieldAmount || !yieldUnit.trim()) {
      alert('Por favor, preencha o nome da receita, rendimento e unidade.');
      return;
    }

    if (selectedIngredients.length === 0) {
      alert('Por favor, inclua pelo menos um ingrediente na sua receita.');
      return;
    }

    const payload = {
      id: editingRecipe?.id,
      name: name.trim(),
      yieldAmount: parseFloat(yieldAmount),
      yieldUnit: yieldUnit.trim(),
      ingredients: selectedIngredients,
      notes: notes.trim()
    };

    await DataService.saveRecipe(userId, payload);
    setIsEditMode(false);
    loadData();
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(`Deseja realmente excluir a receita "${name}"?\nEsta ação é irreversível.`);
    if (confirmed) {
      await DataService.deleteRecipe(userId, id);
      loadData();
    }
  };

  // Cost calculator helper
  const calculateCost = (ingredientsList: RecipeIngredient[]) => {
    return ingredientsList.reduce((sum, ing) => {
      const match = insumos.find(i => i.id === ing.insumoId);
      if (!match) return sum;
      return sum + (match.costValue * ing.quantity);
    }, 0);
  };

  // Filter recipes based on query
  const filteredRecipes = recipes.filter(recipe => {
    const q = searchQuery.toLowerCase();
    return (
      recipe.name.toLowerCase().includes(q) ||
      recipe.yieldUnit.toLowerCase().includes(q) ||
      recipe.notes?.toLowerCase().includes(q)
    );
  });

  return (
    <div id="receitas-screen" className="max-w-4xl mx-auto px-4 py-6">
      {!isEditMode ? (
        <>
          {/* List View Header */}
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
                <h1 className="text-2xl font-bold tracking-tight text-brand-chocolate">Minhas Receitas</h1>
                <p className="text-xs text-brand-brown-light font-medium">Ficha técnica e composição de custos base</p>
              </div>
            </div>

            <button
              onClick={startAddRecipe}
              className="bg-brand-chocolate hover:bg-brand-chocolate/90 text-white font-semibold text-xs py-3 px-4 rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition touch-target cursor-pointer"
            >
              <Plus className="w-4 h-4 text-brand-gold" />
              Nova Receita
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
              placeholder="Pesquisar receita por nome, observação..."
              className="w-full pl-10 pr-4 py-3 bg-white/40 border border-white/50 backdrop-blur-md rounded-2xl text-brand-chocolate placeholder-brand-brown-light/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose focus:bg-white/60 transition shadow-sm"
            />
          </div>

          {/* Recipes Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRecipes.length === 0 ? (
              <div className="col-span-full bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 p-10 text-center text-brand-brown-light/60">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-35 text-brand-rose" />
                <p className="text-sm font-semibold text-brand-chocolate">Nenhuma receita registrada.</p>
                <p className="text-xs mt-1">Toque em "Nova Receita" para registrar sua primeira ficha técnica!</p>
              </div>
            ) : (
              filteredRecipes.map((recipe) => {
                const totalRecipeCost = calculateCost(recipe.ingredients);
                const unitCost = totalRecipeCost / recipe.yieldAmount;
                return (
                  <motion.div
                    key={recipe.id}
                    layoutId={`recipe-card-${recipe.id}`}
                    className="bg-white/45 backdrop-blur-md rounded-2xl border border-white/55 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="font-bold text-brand-chocolate text-base line-clamp-1">{recipe.name}</h3>
                        <span className="bg-brand-pink text-brand-rose border border-rose-100 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                          {recipe.ingredients.length} Ingred.
                        </span>
                      </div>

                      {recipe.notes && (
                        <p className="text-xs text-brand-brown-light/80 italic mb-4 line-clamp-2 bg-white/20 p-2 rounded-lg border border-white/20">
                          "{recipe.notes}"
                        </p>
                      )}

                      {/* Ingredient list preview */}
                      <div className="text-[11px] text-brand-brown-light/80 space-y-1 mb-4">
                        <span className="block text-[10px] text-brand-chocolate/40 uppercase tracking-wide font-semibold">Ingredientes Base:</span>
                        <div className="max-h-20 overflow-y-auto pr-1 no-scrollbar space-y-0.5">
                          {recipe.ingredients.slice(0, 3).map((ing, i) => {
                            const match = insumos.find(item => item.id === ing.insumoId);
                            return (
                              <div key={i} className="flex justify-between">
                                <span className="truncate max-w-[150px]">- {match ? match.description : 'Item excluído'}</span>
                                <span className="font-mono">{ing.quantity} {match?.unit}</span>
                              </div>
                            );
                          })}
                          {recipe.ingredients.length > 3 && (
                            <span className="text-[10px] text-brand-rose font-medium block">
                              + {recipe.ingredients.length - 3} outros ingredientes...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/20 pt-3">
                      <div className="flex justify-between items-end mb-3">
                        <div>
                          <span className="block text-[10px] text-brand-brown-light/60 uppercase">Custo da Receita</span>
                          <span className="font-mono font-bold text-base text-brand-chocolate">
                            R$ {totalRecipeCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] text-brand-brown-light/60 uppercase">Rendimento</span>
                          <span className="font-sans font-semibold text-xs text-brand-brown-light">
                            {recipe.yieldAmount} {recipe.yieldUnit} <span className="font-mono text-[10px] text-brand-chocolate font-bold">(R$ {unitCost.toFixed(2)}/un)</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEditRecipe(recipe)}
                          className="flex-1 py-2.5 bg-white/40 hover:bg-white text-brand-chocolate border border-white/50 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1 active:scale-95 touch-target cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Ficha Técnica
                        </button>
                        <button
                          onClick={() => handleDelete(recipe.id, recipe.name)}
                          className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl border border-rose-100 transition active:scale-95 touch-target cursor-pointer"
                          title="Excluir receita"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Edit/Create Form View */
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/45 backdrop-blur-xl border border-white/55 rounded-3xl p-6 shadow-md"
        >
          <div className="flex items-center justify-between border-b border-white/20 pb-4 mb-5">
            <h2 className="text-xl font-bold text-brand-chocolate">
              {editingRecipe ? 'Editar Receita Base' : 'Cadastrar Receita'}
            </h2>
            <button
              onClick={() => setIsEditMode(false)}
              className="p-1.5 bg-white/40 rounded-full text-brand-chocolate hover:bg-brand-rose/20 transition active:scale-90 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-brand-chocolate uppercase tracking-wider block">
                  Nome da Receita
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Bolo Brigadeiro Supreme"
                  className="w-full px-4 py-3 bg-white/40 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose/25 focus:border-brand-rose focus:bg-white/65 transition text-brand-chocolate font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-chocolate uppercase tracking-wider block">
                    Rendimento Base
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={yieldAmount}
                    onChange={(e) => setYieldAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-white/40 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose/25 focus:border-brand-rose focus:bg-white/65 transition text-brand-chocolate font-mono font-medium"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-chocolate uppercase tracking-wider block">
                    Unidade
                  </label>
                  <input
                    type="text"
                    value={yieldUnit}
                    onChange={(e) => setYieldUnit(e.target.value)}
                    placeholder="Ex: fatias, un, kg"
                    className="w-full px-4 py-3 bg-white/40 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose/25 focus:border-brand-rose focus:bg-white/65 transition text-brand-chocolate font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-chocolate uppercase tracking-wider block">
                Modo de Preparo / Notas Opcionais
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Dicas sobre pontos de calda, decoração ou segredos da receita..."
                rows={2}
                className="w-full px-4 py-3 bg-white/40 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose/25 focus:border-brand-rose focus:bg-white/65 transition text-brand-chocolate font-medium"
              />
            </div>

            {/* Recipe Composition Section */}
            <div className="border-t border-white/20 pt-4">
              <h3 className="font-bold text-brand-chocolate text-base mb-3 flex items-center gap-1">
                <span>Composição dos Ingredientes</span>
                <span className="text-xs text-brand-brown-light font-normal">(monte os ingredientes abaixo)</span>
              </h3>

              {/* Ingredient entry form row */}
              <div className="bg-white/30 p-4 rounded-2xl border border-white/40 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end mb-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-chocolate uppercase tracking-wider block">
                    Insumo / Matéria Prima
                  </label>
                  <select
                    value={tempInsumoId}
                    onChange={(e) => setTempInsumoId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/50 border border-white/55 backdrop-blur-xs rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-rose/25 focus:border-brand-rose transition text-brand-chocolate font-medium cursor-pointer"
                  >
                    <option value="">Selecione um ingrediente...</option>
                    {insumos.map(i => (
                      <option key={i.id} value={i.id}>
                        {i.description} ({i.unit}) - R$ {i.costValue.toFixed(3)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-chocolate uppercase tracking-wider block">
                    Quantidade Necessária
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={tempQuantity}
                      onChange={(e) => setTempQuantity(e.target.value)}
                      placeholder="Ex: 395"
                      className="w-full px-3 py-2.5 bg-white/50 border border-white/55 backdrop-blur-xs rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-rose/25 focus:border-brand-rose transition text-brand-chocolate font-mono font-medium"
                    />
                    <span className="absolute right-3 inset-y-0 flex items-center text-[10px] text-brand-brown-light font-bold">
                      {insumos.find(i => i.id === tempInsumoId)?.unit || ''}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="w-full py-2.5 bg-brand-chocolate text-white rounded-xl font-bold text-xs shadow-sm hover:bg-brand-chocolate/90 transition flex items-center justify-center gap-1 touch-target cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-brand-gold" />
                  Incluir Ingrediente
                </button>
              </div>

              {/* Added ingredients list with live costs */}
              <div className="space-y-2 max-h-56 overflow-y-auto mb-4 pr-1">
                {selectedIngredients.length === 0 ? (
                  <p className="text-xs text-brand-brown-light/70 text-center py-4 italic">
                    Nenhum ingrediente incluído ainda. Adicione insumos acima.
                  </p>
                ) : (
                  selectedIngredients.map((item, index) => {
                    const match = insumos.find(i => i.id === item.insumoId);
                    const itemCost = match ? match.costValue * item.quantity : 0;
                    return (
                      <div
                        key={index}
                        className="bg-white/40 border border-white/50 backdrop-blur-xs p-3 rounded-xl flex items-center justify-between gap-4 text-xs shadow-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-brand-chocolate truncate">
                            {match ? match.description : 'Ingrediente Excluído'}
                          </p>
                          <p className="text-[10px] text-brand-brown-light font-mono mt-0.5">
                            {item.quantity} {match?.unit} x R$ {match?.costValue.toFixed(3)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono font-bold text-brand-chocolate">
                            R$ {itemCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredient(index)}
                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition cursor-pointer"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Live Cost Summary Panel */}
              {selectedIngredients.length > 0 && (
                <div className="bg-rose-100/35 backdrop-blur-md border border-rose-200/50 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-4 text-sm font-semibold text-brand-chocolate shadow-inner">
                  <div>
                    <span className="text-[10px] text-brand-brown-light/70 block uppercase">CUSTO TOTAL DE MATÉRIA-PRIMA DA RECEITA</span>
                    <span className="font-mono font-extrabold text-lg text-brand-chocolate">
                      R$ {calculateCost(selectedIngredients).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-[10px] text-brand-brown-light/70 block uppercase">CUSTO ESTIMADO UNITÁRIO</span>
                    <span className="font-mono font-extrabold text-base text-brand-rose">
                      R$ {(calculateCost(selectedIngredients) / (parseFloat(yieldAmount) || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-brand-brown-light/80 block">
                      por {yieldUnit}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-white/20 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsEditMode(false)}
                className="flex-1 py-3.5 bg-white/40 hover:bg-white text-brand-chocolate rounded-xl font-bold text-xs border border-white/50 transition touch-target cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-3.5 bg-brand-chocolate hover:bg-brand-chocolate/90 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 touch-target cursor-pointer"
              >
                <Save className="w-4 h-4 text-brand-gold animate-bounce" />
                Salvar Receita Base
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
}
