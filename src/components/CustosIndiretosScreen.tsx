import React, { useState, useEffect } from 'react';
import { IndirectCostsConfig } from '../types';
import { DataService } from '../lib/dataService';
import { ArrowLeft, Save, Calculator, DollarSign, Flame, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface CustosIndiretosScreenProps {
  userId: string;
  onBack?: () => void;
}

export default function CustosIndiretosScreen({ userId, onBack }: CustosIndiretosScreenProps) {
  const [proLabore, setProLabore] = useState('2500');
  const [utilities, setUtilities] = useState('400');
  const [cleaningAndSupport, setCleaningAndSupport] = useState('150');
  const [otherExpenses, setOtherExpenses] = useState('0');
  const [workHoursCapacity, setWorkHoursCapacity] = useState('160');
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, [userId]);

  const loadConfig = async () => {
    setLoading(true);
    const config = await DataService.getIndirectCosts(userId);
    if (config) {
      setProLabore(config.proLabore.toString());
      setUtilities(config.utilities.toString());
      setCleaningAndSupport(config.cleaningAndSupport.toString());
      setOtherExpenses((config.otherExpenses || 0).toString());
      setWorkHoursCapacity(config.workHoursCapacity.toString());
    }
    setLoading(false);
  };

  const getNum = (val: string): number => {
    const parsed = parseFloat(val);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  };

  const totalCosts = getNum(proLabore) + getNum(utilities) + getNum(cleaningAndSupport) + getNum(otherExpenses);
  const capacityHours = getNum(workHoursCapacity) > 0 ? getNum(workHoursCapacity) : 1;
  const hourlyRate = totalCosts / capacityHours;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    await DataService.saveIndirectCosts(userId, {
      proLabore: getNum(proLabore),
      utilities: getNum(utilities),
      cleaningAndSupport: getNum(cleaningAndSupport),
      otherExpenses: getNum(otherExpenses),
      workHoursCapacity: capacityHours,
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-brand-brown-light">
        <Calculator className="w-8 h-8 mx-auto mb-2 animate-bounce text-brand-rose" />
        <p className="text-sm font-medium">Carregando custos indiretos...</p>
      </div>
    );
  }

  return (
    <div id="custos-indiretos-screen" className="max-w-4xl mx-auto px-4 py-6">
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
            <h1 className="text-2xl font-bold tracking-tight text-brand-chocolate flex items-center gap-2">
              <Calculator className="w-6 h-6 text-brand-rose" />
              Custos Indiretos & Hora Operacional
            </h1>
            <p className="text-xs text-brand-brown-light font-medium">
              Calcule a valorização do seu trabalho e despesas fixas para embutir no preço de cada receita
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <motion.form
        onSubmit={handleSave}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/45 backdrop-blur-xl border border-white/55 rounded-3xl p-6 shadow-md space-y-6"
      >
        {/* Banner Alert Explanation */}
        <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-brand-rose/10 border border-brand-rose/20 rounded-2xl p-4 flex items-start gap-3 text-xs text-brand-chocolate">
          <Sparkles className="w-5 h-5 text-brand-rose shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-brand-chocolate">Como funciona o cálculo da Hora Operacional?</h4>
            <p className="text-brand-brown-light leading-relaxed">
              O sistema soma todas as suas despesas fixas mensais (salário pró-labore, contas de água, gás, energia, produtos de limpeza) e divide pela quantidade de horas que você tem de capacidade comercial por mês. Isso resulta no <strong>valor exato de cada hora da sua cozinha em funcionamento!</strong>
            </p>
          </div>
        </div>

        {/* Input Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Pró-labore */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-chocolate uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Pró-Labore Desejado (Salário Mensal)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 inset-y-0 flex items-center text-xs font-bold text-brand-brown-light">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={proLabore}
                onChange={(e) => setProLabore(e.target.value)}
                placeholder="Ex: 2500.00"
                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose/25 focus:border-brand-rose transition text-brand-chocolate font-mono font-bold"
                required
              />
            </div>
            <p className="text-[10px] text-brand-brown-light/70">
              Valor líquido mensal que você deseja retirar como pagamento pelo seu trabalho.
            </p>
          </div>

          {/* Gás, Energia e Água */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-chocolate uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500" />
              Gás, Energia Elétrica e Água
            </label>
            <div className="relative">
              <span className="absolute left-3.5 inset-y-0 flex items-center text-xs font-bold text-brand-brown-light">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={utilities}
                onChange={(e) => setUtilities(e.target.value)}
                placeholder="Ex: 400.00"
                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose/25 focus:border-brand-rose transition text-brand-chocolate font-mono font-bold"
                required
              />
            </div>
            <p className="text-[10px] text-brand-brown-light/70">
              Média mensal gasta com concessionárias e botijão de gás da produção.
            </p>
          </div>

          {/* Produtos de Limpeza e Apoio */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-chocolate uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-sky-500" />
              Produtos de Limpeza e Apoio
            </label>
            <div className="relative">
              <span className="absolute left-3.5 inset-y-0 flex items-center text-xs font-bold text-brand-brown-light">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cleaningAndSupport}
                onChange={(e) => setCleaningAndSupport(e.target.value)}
                placeholder="Ex: 150.00"
                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose/25 focus:border-brand-rose transition text-brand-chocolate font-mono font-bold"
                required
              />
            </div>
            <p className="text-[10px] text-brand-brown-light/70">
              Detergente, desengordurante, papel toalha, toucas, luvas descartáveis etc.
            </p>
          </div>

          {/* Outros Custos Fixos */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-chocolate uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-purple-500" />
              Outros Custos Fixos (Internet, Aluguel, MEI...)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 inset-y-0 flex items-center text-xs font-bold text-brand-brown-light">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={otherExpenses}
                onChange={(e) => setOtherExpenses(e.target.value)}
                placeholder="Ex: 200.00"
                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose/25 focus:border-brand-rose transition text-brand-chocolate font-mono font-bold"
              />
            </div>
            <p className="text-[10px] text-brand-brown-light/70">
              Demais despesas mensais recorrentes da sua doceria.
            </p>
          </div>

          {/* Capacidade de Trabalho Comercial em Horas */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-brand-chocolate uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-brand-rose" />
              Capacidade de Trabalho Comercial Mensal (Horas)
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="1"
                value={workHoursCapacity}
                onChange={(e) => setWorkHoursCapacity(e.target.value)}
                placeholder="Ex: 160"
                className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-rose/25 focus:border-brand-rose transition text-brand-chocolate font-mono font-bold"
                required
              />
              <span className="absolute right-4 inset-y-0 flex items-center text-xs text-brand-brown-light font-bold">
                Horas / mês
              </span>
            </div>
            <p className="text-[10px] text-brand-brown-light/70">
              Exemplo: 8 horas por dia x 20 dias no mês = <strong>160 horas</strong>.
            </p>
          </div>
        </div>

        {/* Calculation Result Summary Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl text-white rounded-3xl p-6 shadow-xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-brand-gold/10 rounded-full -mr-16 -mt-16 opacity-60 blur-xl" />

          <h3 className="font-bold text-brand-gold text-lg mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-brand-gold" />
            Resultado do Valor da Hora Operacional
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-white/10 pb-4 mb-4">
            <div>
              <span className="text-[10px] text-white/50 block uppercase tracking-wider">Total Custos Indiretos</span>
              <span className="font-mono font-bold text-lg text-white block mt-0.5">
                R$ {totalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-white/50 block uppercase tracking-wider">Capacidade Comercial</span>
              <span className="font-mono font-bold text-lg text-white block mt-0.5">
                {capacityHours} Horas / mês
              </span>
            </div>

            <div>
              <span className="text-[10px] text-brand-gold block uppercase tracking-wider font-bold">VALOR DA HORA OPERACIONAL</span>
              <span className="font-mono font-extrabold text-2xl text-brand-gold block mt-0.5">
                R$ {hourlyRate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / h
              </span>
            </div>
          </div>

          <div className="text-xs text-white/80 bg-white/5 p-3 rounded-xl border border-white/5 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Ao criar ou editar receitas, você poderá informar quantas horas de trabalho cada receita exige, e este valor de <strong>R$ {hourlyRate.toFixed(2)}/h</strong> será somado automaticamente ao custo final!
            </span>
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/20">
          {isSaved && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-pulse">
              <CheckCircle2 className="w-4 h-4" /> Configurações salvas com sucesso!
            </span>
          )}
          <button
            type="submit"
            className="py-3.5 px-6 bg-brand-chocolate hover:bg-brand-chocolate/90 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 touch-target cursor-pointer"
          >
            <Save className="w-4 h-4 text-brand-gold" />
            Salvar Custos Indiretos
          </button>
        </div>
      </motion.form>
    </div>
  );
}
