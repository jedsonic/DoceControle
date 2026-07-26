import React, { useState, useEffect } from 'react';
import { Sale } from '../types';
import { StorageService } from '../lib/storage';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, CartesianGrid, Legend
} from 'recharts';
import { 
  Search, Calendar, DollarSign, TrendingUp, Sparkles, ShieldAlert, 
  Award, ChevronDown, Trash, Download, Printer, FileText, BarChart2, 
  ArrowUpRight, ArrowDownRight, RefreshCw, LayoutDashboard, Database, Info, HelpCircle,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FinanceiroScreenProps {
  userId: string;
}

export default function FinanceiroScreen({ userId }: FinanceiroScreenProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [activeTab, setActiveTab] = useState<'geral' | 'relatorios'>('geral');
  
  // Tab 1: General view filters
  const [filterType, setFilterType] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Tab 2: Advanced report selectors
  const [reportType, setReportType] = useState<'mensal' | 'anual'>('mensal');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  
  // Card Toggle Mode for General Tab
  const [cardMode, setCardMode] = useState<'regra' | 'pagamentos'>('regra');

  useEffect(() => {
    loadSales();
  }, [userId, filterType, startDate, endDate]);

  const loadSales = () => {
    let allSales = StorageService.getAllSales(userId);

    // Sort chronologically by default for calculations, but let's filter first
    const now = new Date();
    
    // Set default month/year selectors if empty
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (!selectedMonth) setSelectedMonth(currentMonthStr);
    if (!selectedYear) setSelectedYear(String(now.getFullYear()));

    // Apply preset date filters for General Tab
    const todayStr = now.toISOString().split('T')[0];

    if (filterType === 'today') {
      allSales = allSales.filter(s => s.date.startsWith(todayStr));
    } else if (filterType === 'week') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      allSales = allSales.filter(s => new Date(s.date) >= sevenDaysAgo);
    } else if (filterType === 'month') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      allSales = allSales.filter(s => new Date(s.date) >= thirtyDaysAgo);
    } else if (filterType === 'custom' && startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      allSales = allSales.filter(s => {
        const d = new Date(s.date);
        return d >= start && d <= end;
      });
    }

    // Sort by date descending for ledger listing
    const sortedSales = [...allSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setSales(sortedSales);
  };

  const handleDeleteSale = (saleId: string, amount: number) => {
    const confirmed = window.confirm(
      `Deseja realmente estornar/cancelar esta venda de R$ ${amount.toFixed(2)}?\n\n` +
      `Os produtos vendidos serão devolvidos ao estoque de produtos acabados automaticamente e os valores serão estornados dos controles financeiros.`
    );
    if (confirmed) {
      const res = StorageService.deleteSale(userId, saleId);
      if (res) {
        loadSales();
        alert(`Venda de R$ ${amount.toFixed(2)} cancelada com sucesso! O estoque de produtos foi devolvido e as finanças foram atualizadas.`);
      } else {
        alert('Não foi possível cancelar a venda.');
      }
    }
  };

  // Aggregated indicators for Tab 1 (Visão Geral)
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalCost = sales.reduce((sum, s) => sum + s.totalCost, 0);
  const netProfit = totalRevenue - totalCost;

  // 40/40/20 Distribution for Tab 1
  const replacementFund = totalRevenue * 0.4;
  const profitFund = totalRevenue * 0.4;
  const emergencyFund = totalRevenue * 0.2;

  const pieData = [
    { name: 'Reposição de Insumos (40%)', value: replacementFund, color: '#845e4e' },
    { name: 'Lucro / Pró-labore (40%)', value: profitFund, color: '#f43f5e' },
    { name: 'Caixa de Emergência (20%)', value: emergencyFund, color: '#f59e0b' }
  ];

  // Payment methods calculation for Tab 1
  const pixSalesList = sales.filter(s => s.paymentMethod === 'pix');
  const dinheiroSalesList = sales.filter(s => s.paymentMethod === 'dinheiro');
  const cartaoSalesList = sales.filter(s => s.paymentMethod === 'cartao');

  const pixRevenueVal = pixSalesList.reduce((sum, s) => sum + s.totalAmount, 0);
  const dinheiroRevenueVal = dinheiroSalesList.reduce((sum, s) => sum + s.totalAmount, 0);
  const cartaoRevenueVal = cartaoSalesList.reduce((sum, s) => sum + s.totalAmount, 0);

  const pixCostVal = pixSalesList.reduce((sum, s) => sum + s.totalCost, 0);
  const dinheiroCostVal = dinheiroSalesList.reduce((sum, s) => sum + s.totalCost, 0);
  const cartaoCostVal = cartaoSalesList.reduce((sum, s) => sum + s.totalCost, 0);

  const pixProfitVal = pixRevenueVal - pixCostVal;
  const dinheiroProfitVal = dinheiroRevenueVal - dinheiroCostVal;
  const cartaoProfitVal = cartaoRevenueVal - cartaoCostVal;

  const paymentMethodsPieData = [
    { name: 'Pix', value: pixRevenueVal, color: '#0ea5e9', count: pixSalesList.length, profit: pixProfitVal },
    { name: 'Dinheiro', value: dinheiroRevenueVal, color: '#10b981', count: dinheiroSalesList.length, profit: dinheiroProfitVal },
    { name: 'Cartão', value: cartaoRevenueVal, color: '#ec4899', count: cartaoSalesList.length, profit: cartaoProfitVal }
  ];

  // Daily Sales bar chart for Tab 1
  const getBarChartData = () => {
    const groups: { [key: string]: { date: string, faturamento: number, custo: number, lucro: number } } = {};
    const chronoSales = [...sales].reverse();
    
    chronoSales.forEach(s => {
      const dateLabel = new Date(s.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!groups[dateLabel]) {
        groups[dateLabel] = { date: dateLabel, faturamento: 0, custo: 0, lucro: 0 };
      }
      groups[dateLabel].faturamento += s.totalAmount;
      groups[dateLabel].custo += s.totalCost;
      groups[dateLabel].lucro += (s.totalAmount - s.totalCost);
    });

    return Object.values(groups);
  };

  const barData = getBarChartData();

  // --- RECONCILE ADVANCED REPORT DATA ---
  const allSalesHistory = StorageService.getAllSales(userId);

  // Filter sales for the chosen report period
  const getFilteredPeriodSales = () => {
    if (reportType === 'mensal') {
      if (!selectedMonth) return [];
      return allSalesHistory.filter(s => s.date.startsWith(selectedMonth));
    } else {
      if (!selectedYear) return [];
      return allSalesHistory.filter(s => s.date.startsWith(selectedYear));
    }
  };

  const filteredPeriodSales = getFilteredPeriodSales();

  // Selected report stats
  const totalRevenueReport = filteredPeriodSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalCostReport = filteredPeriodSales.reduce((sum, s) => sum + s.totalCost, 0);
  const netProfitReport = totalRevenueReport - totalCostReport;
  const marginReport = totalRevenueReport > 0 ? (netProfitReport / totalRevenueReport) * 100 : 0;

  const replacementFundReport = totalRevenueReport * 0.4;
  const profitFundReport = totalRevenueReport * 0.4;
  const emergencyFundReport = totalRevenueReport * 0.2;

  const reportPieData = [
    { name: 'Reposição (40%)', value: replacementFundReport, color: '#845e4e' },
    { name: 'Lucro / Pró-labore (40%)', value: profitFundReport, color: '#f43f5e' },
    { name: 'Caixa Emergência (20%)', value: emergencyFundReport, color: '#f59e0b' }
  ];

  // Inferred category profitability categories helper
  const getProductCategory = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('bolo') || n.includes('cake') || n.includes('fatia') || n.includes('torta doce')) return 'Bolos';
    if (n.includes('doce') || n.includes('brigadeiro') || n.includes('trufa') || n.includes('bombom') || n.includes('beijinho') || n.includes('pudim') || n.includes('copinho') || n.includes('palha')) return 'Doces & Brigadeiros';
    if (n.includes('torta') || n.includes('pie') || n.includes('empadão')) return 'Tortas';
    if (n.includes('salgado') || n.includes('empada') || n.includes('coxinha') || n.includes('quiche') || n.includes('pastel')) return 'Salgados';
    if (n.includes('café') || n.includes('cafe') || n.includes('suco') || n.includes('refrigerante') || n.includes('água') || n.includes('agua') || n.includes('chá') || n.includes('cha') || n.includes('refris') || n.includes('bebida')) return 'Bebidas';
    return 'Outros';
  };

  // Graph 1: Sales Trend for Report
  const getReportTrendData = () => {
    if (reportType === 'mensal') {
      if (!selectedMonth) return [];
      const [year, month] = selectedMonth.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      
      const dailyData = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dateLabel = `${String(d).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
        dailyData.push({ date: dateLabel, faturamento: 0, custo: 0, lucro: 0 });
      }
      
      filteredPeriodSales.forEach(s => {
        const sDate = new Date(s.date);
        const sDay = sDate.getDate();
        if (sDay >= 1 && sDay <= daysInMonth) {
          dailyData[sDay - 1].faturamento += s.totalAmount;
          dailyData[sDay - 1].custo += s.totalCost;
          dailyData[sDay - 1].lucro += (s.totalAmount - s.totalCost);
        }
      });
      return dailyData;
    } else {
      // Annual Trend
      const monthsNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const monthlyData = monthsNames.map((name, index) => ({
        date: name,
        faturamento: 0,
        custo: 0,
        lucro: 0
      }));
      
      filteredPeriodSales.forEach(s => {
        const sDate = new Date(s.date);
        const sMonth = sDate.getMonth();
        if (sMonth >= 0 && sMonth <= 11) {
          monthlyData[sMonth].faturamento += s.totalAmount;
          monthlyData[sMonth].custo += s.totalCost;
          monthlyData[sMonth].lucro += (s.totalAmount - s.totalCost);
        }
      });
      return monthlyData;
    }
  };

  const reportTrendData = getReportTrendData();

  // Graph 2: Profitability by Category (Inferred)
  const getCategoryProfitability = () => {
    const categories: { [key: string]: { name: string, faturamento: number, custo: number, lucro: number } } = {
      'Bolos': { name: 'Bolos', faturamento: 0, custo: 0, lucro: 0 },
      'Doces & Brigadeiros': { name: 'Doces & B.', faturamento: 0, custo: 0, lucro: 0 },
      'Tortas': { name: 'Tortas', faturamento: 0, custo: 0, lucro: 0 },
      'Salgados': { name: 'Salgados', faturamento: 0, custo: 0, lucro: 0 },
      'Bebidas': { name: 'Bebidas', faturamento: 0, custo: 0, lucro: 0 },
      'Outros': { name: 'Outros', faturamento: 0, custo: 0, lucro: 0 },
    };
    
    filteredPeriodSales.forEach(s => {
      s.items.forEach(item => {
        const cat = getProductCategory(item.name);
        // Map shorthand key to display name
        const key = cat === 'Doces & Brigadeiros' ? 'Doces & Brigadeiros' : cat;
        const targetKey = cat === 'Doces & Brigadeiros' ? 'Doces & Brigadeiros' : cat;
        
        if (categories[targetKey === 'Doces & Brigadeiros' ? 'Doces & Brigadeiros' : targetKey]) {
          categories[targetKey === 'Doces & Brigadeiros' ? 'Doces & Brigadeiros' : targetKey].faturamento += item.priceUnit * item.quantity;
          categories[targetKey === 'Doces & Brigadeiros' ? 'Doces & Brigadeiros' : targetKey].custo += item.costUnit * item.quantity;
          categories[targetKey === 'Doces & Brigadeiros' ? 'Doces & Brigadeiros' : targetKey].lucro += (item.priceUnit - item.costUnit) * item.quantity;
        } else {
          // Fallback or dynamic
          const mapKey = targetKey === 'Doces & Brigadeiros' ? 'Doces & Brigadeiros' : targetKey;
          if (mapKey === 'Doces & Brigadeiros') {
            categories['Doces & Brigadeiros'] = categories['Doces & Brigadeiros'] || { name: 'Doces & B.', faturamento: 0, custo: 0, lucro: 0 };
            categories['Doces & Brigadeiros'].faturamento += item.priceUnit * item.quantity;
            categories['Doces & Brigadeiros'].custo += item.costUnit * item.quantity;
            categories['Doces & Brigadeiros'].lucro += (item.priceUnit - item.costUnit) * item.quantity;
          }
        }
      });
    });
    
    return Object.values(categories).filter(c => c.faturamento > 0);
  };

  const categoryData = getCategoryProfitability();

  // Graph 3: Production Cost vs Sale Price
  const getCostVsPriceData = () => {
    const products: { [key: string]: { name: string, precoVenda: number, custoProducao: number, totalQty: number } } = {};
    
    filteredPeriodSales.forEach(s => {
      s.items.forEach(item => {
        if (!products[item.name]) {
          products[item.name] = { name: item.name, precoVenda: 0, custoProducao: 0, totalQty: 0 };
        }
        products[item.name].precoVenda += item.priceUnit * item.quantity;
        products[item.name].custoProducao += item.costUnit * item.quantity;
        products[item.name].totalQty += item.quantity;
      });
    });
    
    const formatted = Object.values(products).map(p => ({
      name: p.name.length > 15 ? p.name.substring(0, 13) + '...' : p.name,
      'Preço Venda': parseFloat((p.precoVenda / p.totalQty).toFixed(2)),
      'Custo Produção': parseFloat((p.custoProducao / p.totalQty).toFixed(2)),
      totalQty: p.totalQty
    }));
    
    return formatted.sort((a, b) => b.totalQty - a.totalQty).slice(0, 5);
  };

  const costVsPriceData = getCostVsPriceData();

  // Graph 4: Projected Cash Flow with dynamic Regression/Moving Average
  const getProjectedCashFlow = () => {
    const monthlyDataMap: { [key: string]: { monthKey: string, dateObj: Date, faturamento: number, custo: number } } = {};
    
    allSalesHistory.forEach(s => {
      const d = new Date(s.date);
      const monthKey = d.toISOString().slice(0, 7); // "YYYY-MM"
      if (!monthlyDataMap[monthKey]) {
        monthlyDataMap[monthKey] = {
          monthKey,
          dateObj: new Date(d.getFullYear(), d.getMonth(), 1),
          faturamento: 0,
          custo: 0
        };
      }
      monthlyDataMap[monthKey].faturamento += s.totalAmount;
      monthlyDataMap[monthKey].custo += s.totalCost;
    });
    
    const history = Object.values(monthlyDataMap).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    
    if (history.length === 0) return [];
    
    const formattedHistory = history.map(h => {
      const monthLabel = h.dateObj.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      return {
        monthLabel,
        faturamento: parseFloat(h.faturamento.toFixed(2)),
        custo: parseFloat(h.custo.toFixed(2)),
        lucro: parseFloat((h.faturamento - h.custo).toFixed(2)),
        isProjection: false
      };
    });
    
    // Extrapolate next 3 months
    const projections = [];
    let avgRevenue = 0;
    let avgCost = 0;
    let revenueSlope = 0;
    let costSlope = 0;
    
    if (history.length >= 2) {
      let sumX = 0, sumY_rev = 0, sumY_cost = 0, sumXX = 0, sumXY_rev = 0, sumXY_cost = 0;
      const n = history.length;
      for (let i = 0; i < n; i++) {
        const x = i;
        sumX += x;
        sumY_rev += history[i].faturamento;
        sumY_cost += history[i].custo;
        sumXX += x * x;
        sumXY_rev += x * history[i].faturamento;
        sumXY_cost += x * history[i].custo;
      }
      
      const denominator = (n * sumXX - sumX * sumX);
      if (denominator !== 0) {
        revenueSlope = (n * sumXY_rev - sumX * sumY_rev) / denominator;
        costSlope = (n * sumXY_cost - sumX * sumY_cost) / denominator;
      }
      avgRevenue = history[n - 1].faturamento;
      avgCost = history[n - 1].custo;
    } else {
      avgRevenue = history[0].faturamento;
      avgCost = history[0].custo;
      revenueSlope = avgRevenue * 0.08; // 8% standard growth for simulation
      costSlope = avgCost * 0.06;      // 6% cost growth
    }
    
    const lastDate = new Date(history[history.length - 1].dateObj);
    
    for (let i = 1; i <= 3; i++) {
      const nextDate = new Date(lastDate.getFullYear(), lastDate.getMonth() + i, 1);
      const monthLabel = nextDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) + ' *';
      
      const pRev = Math.max(0, avgRevenue + (revenueSlope * i));
      const pCost = Math.max(0, avgCost + (costSlope * i));
      
      projections.push({
        monthLabel,
        faturamento: parseFloat(pRev.toFixed(2)),
        custo: parseFloat(pCost.toFixed(2)),
        lucro: parseFloat((pRev - pCost).toFixed(2)),
        isProjection: true
      });
    }
    
    return [...formattedHistory, ...projections];
  };

  const projectedCashFlow = getProjectedCashFlow();

  // Export functions
  const handleExportCSV = () => {
    const reportTitle = reportType === 'mensal' 
      ? `Mensal_${selectedMonth}` 
      : `Anual_${selectedYear}`;

    let csvContent = `RELATORIO FINANCEIRO DOCE CONTROLE - ${reportType.toUpperCase()} (${reportType === 'mensal' ? selectedMonth : selectedYear})\n\n`;
    csvContent += "RESUMO DOS INDICADORES FINANCEIROS\n";
    csvContent += `Faturamento Total,R$ ${totalRevenueReport.toFixed(2)}\n`;
    csvContent += `Custo de Insumos (CMV),R$ ${totalCostReport.toFixed(2)}\n`;
    csvContent += `Lucro Real Brutp,R$ ${netProfitReport.toFixed(2)}\n`;
    csvContent += `Margem de Lucro Real,${marginReport.toFixed(1)}%\n\n`;
    
    csvContent += "DISTRIBUICAO DE CAIXA (REGRA 40/40/20)\n";
    csvContent += `40% Reposicao de Insumos (Fabrica),R$ ${(totalRevenueReport * 0.4).toFixed(2)}\n`;
    csvContent += `40% Lucro Real / Pro-labore,R$ ${(totalRevenueReport * 0.4).toFixed(2)}\n`;
    csvContent += `20% Caixa de Emergencia / Giro,R$ ${(totalRevenueReport * 0.2).toFixed(2)}\n\n`;
    
    csvContent += "VENDAS DETALHADAS POR PRODUTO\n";
    csvContent += "Produto,Quantidade Vendida,Faturamento Total (R$),Custo Total (R$),Lucro Real (R$)\n";
    
    const productSummary: { [key: string]: { name: string, qty: number, rev: number, cost: number } } = {};
    filteredPeriodSales.forEach(s => {
      s.items.forEach(i => {
        if (!productSummary[i.name]) {
          productSummary[i.name] = { name: i.name, qty: 0, rev: 0, cost: 0 };
        }
        productSummary[i.name].qty += i.quantity;
        productSummary[i.name].rev += i.priceUnit * i.quantity;
        productSummary[i.name].cost += i.costUnit * i.quantity;
      });
    });
    
    Object.values(productSummary).forEach(p => {
      const profit = p.rev - p.cost;
      csvContent += `"${p.name}",${p.qty},${p.rev.toFixed(2)},${p.cost.toFixed(2)},${profit.toFixed(2)}\n`;
    });
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `relatorio_doce_controle_${reportTitle}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  // Seed simulated historic sales for perfect demonstration
  const handleSeedSimulationData = () => {
    const confirmed = window.confirm("Deseja simular dados de vendas para os últimos 12 meses? Isso gerará transações automáticas realistas de confeitos para ilustrar os relatórios avançados e projeções de fluxo de caixa.");
    if (confirmed) {
      const dummySales: Sale[] = [];
      const paymentMethods: ('pix' | 'dinheiro' | 'cartao')[] = ['pix', 'dinheiro', 'cartao'];
      
      const stockProds = StorageService.getAllStock(userId);
      const prodPool = stockProds.length > 0 ? stockProds : [
        { id: 's1', name: 'Bolo de Chocolate Brigadeiro Tradicional', costUnit: 35.80, priceSale: 90.00 },
        { id: 's2', name: 'Din-Din Gourmet de Ninho com Nutella', costUnit: 2.15, priceSale: 7.00 }
      ];

      // Create sales across last 12 months
      for (let m = 11; m >= 0; m--) {
        const d = new Date();
        d.setMonth(d.getMonth() - m);
        
        // Random volume per month, growing slightly
        const saleCount = 10 + Math.floor(Math.random() * 8) + (11 - m); 
        for (let s = 0; s < saleCount; s++) {
          const saleDate = new Date(d.getFullYear(), d.getMonth(), Math.floor(Math.random() * 28) + 1, 10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));
          
          const items = [];
          const itemTypes = Math.floor(Math.random() * 2) + 1;
          const usedIndices = new Set();
          
          for (let i = 0; i < itemTypes; i++) {
            let randIdx = Math.floor(Math.random() * prodPool.length);
            if (usedIndices.has(randIdx)) continue;
            usedIndices.add(randIdx);
            
            const p = prodPool[randIdx];
            const qty = p.priceSale > 50 ? 1 : Math.floor(Math.random() * 5) + 2;
            
            items.push({
              productId: p.id || `sim_${randIdx}`,
              name: p.name,
              quantity: qty,
              priceUnit: p.priceSale,
              costUnit: p.costUnit
            });
          }
          
          const totalAmount = items.reduce((sum, item) => sum + (item.priceUnit * item.quantity), 0);
          const totalCost = items.reduce((sum, item) => sum + (item.costUnit * item.quantity), 0);
          
          dummySales.push({
            id: `sim_sale_${m}_${s}`,
            userId,
            date: saleDate.toISOString(),
            items,
            totalAmount,
            totalCost,
            paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)]
          });
        }
      }
      
      StorageService.saveSalesRaw(userId, dummySales);
      loadSales();
      alert("Simulação de 12 meses concluída! Seus relatórios e projeções agora estão repletos de dados visuais.");
    }
  };

  // Reusable custom tooltip styled to match the dark glass motif
  const CustomTooltipElement = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-2xl border border-white/10 text-[11px] shadow-xl font-sans min-w-[130px]">
          <p className="font-bold border-b border-white/10 pb-1 mb-1.5">{label}</p>
          {payload.map((item: any, idx: number) => (
            <p key={idx} className="flex justify-between gap-4 py-0.5" style={{ color: item.color || item.fill }}>
              <span>{item.name}:</span>
              <span className="font-mono font-bold">R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 md:py-6">
      
      {/* Tab Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/20 pb-4 no-print">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-brand-chocolate flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-brand-rose" />
            Finanças & Relatórios
          </h1>
          <p className="text-xs text-brand-brown-light font-medium">Controle de caixa, relatórios mensais/anuais e projeções automatizadas</p>
        </div>

        {/* Big tactile navigation tab pills */}
        <div className="flex bg-white/40 p-1.5 rounded-2xl border border-white/50 backdrop-blur-sm self-start">
          <button
            onClick={() => setActiveTab('geral')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'geral' ? 'bg-brand-chocolate text-white shadow-md' : 'text-brand-brown-light hover:text-brand-chocolate'}`}
          >
            <TrendingUp className="w-4 h-4" />
            Faturamento Geral
          </button>
          <button
            onClick={() => setActiveTab('relatorios')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'relatorios' ? 'bg-brand-chocolate text-white shadow-md' : 'text-brand-brown-light hover:text-brand-chocolate'}`}
          >
            <FileText className="w-4 h-4" />
            Relatórios Avançados
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}
      <AnimatePresence mode="wait">
        {activeTab === 'geral' ? (
          <motion.div
            key="geral-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Filter controls */}
            <div className="flex items-center justify-between bg-white/40 backdrop-blur-sm p-3 rounded-2xl border border-white/50 shadow-xs">
              <span className="text-xs font-bold text-brand-chocolate hidden sm:inline">Período de Análise</span>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value as any);
                    if (e.target.value !== 'custom') {
                      setStartDate('');
                      setEndDate('');
                    }
                  }}
                  className="px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-xs font-bold text-brand-chocolate focus:outline-none focus:ring-2 focus:ring-brand-rose cursor-pointer"
                >
                  <option value="today">Vendas de Hoje</option>
                  <option value="week">Últimos 7 Dias</option>
                  <option value="month">Últimos 30 Dias</option>
                  <option value="custom">Período Personalizado</option>
                </select>

                {filterType === 'custom' && (
                  <div className="flex items-center gap-1.5 bg-white/80 p-1.5 rounded-xl border border-white/45 text-xs text-brand-chocolate">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-transparent px-1 focus:outline-none font-mono font-medium"
                    />
                    <span className="text-brand-brown-light text-[10px]">até</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-transparent px-1 focus:outline-none font-mono font-medium"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* General KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white/45 backdrop-blur-md rounded-2xl border border-white/55 p-4 shadow-xs">
                <span className="text-[10px] text-brand-brown-light/60 block uppercase font-bold tracking-wider">Faturamento</span>
                <p className="font-mono text-lg md:text-xl font-black text-brand-chocolate mt-1">
                  R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-emerald-600 block font-medium mt-0.5">{sales.length} vendas</span>
              </div>

              <div className="bg-white/45 backdrop-blur-md rounded-2xl border border-white/55 p-4 shadow-xs">
                <span className="text-[10px] text-brand-brown-light/60 block uppercase font-bold tracking-wider">Custo (CMV)</span>
                <p className="font-mono text-lg md:text-xl font-bold text-rose-700 mt-1">
                  R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-brand-brown-light block font-medium mt-0.5">({totalRevenue > 0 ? ((totalCost / totalRevenue) * 100).toFixed(0) : 0}% do total)</span>
              </div>

              <div className="bg-white/45 backdrop-blur-md rounded-2xl border border-white/55 p-4 shadow-xs">
                <span className="text-[10px] text-brand-brown-light/60 block uppercase font-bold tracking-wider">Lucro Bruto</span>
                <p className="font-mono text-lg md:text-xl font-bold text-emerald-700 mt-1">
                  +R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-brand-brown-light block font-medium mt-0.5">({totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(0) : 0}% de margem)</span>
              </div>

              <div className="bg-slate-900/80 backdrop-blur-md text-white rounded-2xl p-4 shadow-xs border border-white/10">
                <span className="text-[10px] text-brand-gold/80 block uppercase font-bold tracking-wider">Fundo de Reserva</span>
                <p className="font-mono text-lg md:text-xl font-extrabold text-brand-gold mt-1">
                  R$ {emergencyFund.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-white/70 block font-medium mt-0.5">20% para segurança</span>
              </div>
            </div>

            {/* Visual Charts row for General */}
            {sales.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/45 backdrop-blur-md rounded-3xl border border-white/55 p-5 shadow-xs">
                  <h3 className="font-bold text-brand-chocolate text-xs uppercase tracking-wider mb-4 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Faturamento Diário do Período</span>
                  </h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData}>
                        <XAxis dataKey="date" stroke="#64748b" fontSize={9} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                        <Tooltip content={<CustomTooltipElement />} />
                        <Bar dataKey="faturamento" fill="#f43f5e" name="Faturamento" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="lucro" fill="#f59e0b" name="Lucro Real" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white/45 backdrop-blur-md rounded-3xl border border-white/55 p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <div>
                        <h3 className="font-bold text-brand-chocolate text-xs uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                          {cardMode === 'regra' ? (
                            <>
                              <Award className="w-4 h-4 text-brand-rose" />
                              <span>Distribuição pela Regra 40/40/20</span>
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4 text-brand-rose" />
                              <span>Vendas por Tipo de Pagamento</span>
                            </>
                          )}
                        </h3>
                        <p className="text-[10px] text-brand-brown-light/80 leading-relaxed">
                          {cardMode === 'regra' 
                            ? "Divisão proporcional e saudável do seu faturamento bruto atual."
                            : "Resumo de faturamento e quantidade de transações por recebível."}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setCardMode(cardMode === 'regra' ? 'pagamentos' : 'regra')}
                        className="flex items-center gap-1.5 bg-white/60 hover:bg-white border border-white/50 text-[9px] font-black uppercase text-brand-chocolate px-2.5 py-1.5 rounded-xl transition shadow-xs cursor-pointer tracking-wider shrink-0"
                      >
                        <RefreshCw className="w-2.5 h-2.5 text-brand-rose" />
                        <span>Alternar</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="h-40 flex items-center justify-center my-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={cardMode === 'regra' ? pieData : paymentMethodsPieData.filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={60}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {(cardMode === 'regra' ? pieData : paymentMethodsPieData.filter(d => d.value > 0)).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltipElement />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {cardMode === 'regra' ? (
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-bold border-t border-white/20 pt-3">
                      <div className="text-center">
                        <span className="block text-stone-500 uppercase text-[8px]">Fábrica (40%)</span>
                        <span className="text-stone-600 font-mono">R$ {replacementFund.toFixed(1)}</span>
                      </div>
                      <div className="text-center border-x border-white/20">
                        <span className="block text-rose-500 uppercase text-[8px]">Pró-labore (40%)</span>
                        <span className="text-rose-500 font-mono">R$ {profitFund.toFixed(1)}</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-amber-500 uppercase text-[8px]">Giro (20%)</span>
                        <span className="text-amber-500 font-mono">R$ {emergencyFund.toFixed(1)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-bold border-t border-white/20 pt-3">
                      <div className="text-center">
                        <span className="block text-stone-500 uppercase text-[8px]">Pix ({pixSalesList.length})</span>
                        <span className="text-stone-600 font-mono">R$ {pixRevenueVal.toFixed(1)}</span>
                      </div>
                      <div className="text-center border-x border-white/20">
                        <span className="block text-emerald-600 uppercase text-[8px]">Dinheiro ({dinheiroSalesList.length})</span>
                        <span className="text-stone-600 font-mono">R$ {dinheiroRevenueVal.toFixed(1)}</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-pink-500 uppercase text-[8px]">Cartão ({cartaoSalesList.length})</span>
                        <span className="text-stone-600 font-mono">R$ {cartaoRevenueVal.toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Education Panel */}
            <div className="bg-slate-900/80 backdrop-blur-md text-white rounded-3xl p-5 border border-white/10 shadow-md">
              <h3 className="font-bold text-brand-gold text-sm mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-gold" />
                Regra de Ouro 40/40/20
              </h3>
              <p className="text-xs text-white/90 leading-relaxed mb-4">
                Gerencie sua confeitaria profissionalmente. Divida o faturamento bruto em três caixas virtuais de segurança:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="font-extrabold text-stone-300 text-base font-mono">40%</span>
                  <span className="font-bold block mt-1 text-stone-200">Matéria-Prima (Fábrica)</span>
                  <p className="text-[10px] text-white/70 mt-1">Dinheiro intocável exclusivo para recomprar leite condensado, farinha, embalagens e manter a fábrica rodando.</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="font-extrabold text-brand-rose text-base font-mono">40%</span>
                  <span className="font-bold block mt-1 text-brand-rose">Seu Pró-Labore / Lucro</span>
                  <p className="text-[10px] text-white/70 mt-1">Sua remuneração justa pelo esforço na cozinha, além de margens para reinvestir em maquinários e capacitação.</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="font-extrabold text-brand-gold text-base font-mono">20%</span>
                  <span className="font-bold block mt-1 text-brand-gold">Caixa de Emergência</span>
                  <p className="text-[10px] text-white/70 mt-1">Colchão de segurança para consertos de batedeira, flutuações sazonais de vendas ou capital de giro em meses de baixa.</p>
                </div>
              </div>
            </div>

            {/* Sales ledger list */}
            <div className="bg-white/45 backdrop-blur-md rounded-3xl border border-white/55 overflow-hidden shadow-xs">
              <div className="p-4 bg-white/20 border-b border-white/30 flex items-center justify-between">
                <h3 className="font-bold text-brand-chocolate text-xs uppercase tracking-wider">Histórico de Transações de Caixa</h3>
                <span className="text-[10px] text-brand-brown-light font-bold font-mono">{sales.length} registros</span>
              </div>

              <div className="divide-y divide-white/20">
                {sales.length === 0 ? (
                  <div className="p-10 text-center text-brand-brown-light/50 text-xs">
                    Nenhuma venda registrada no período selecionado.
                  </div>
                ) : (
                  sales.map((sale) => {
                    const saleDateStr = new Date(sale.date).toLocaleString('pt-BR', {
                      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                    });
                    const saleProfit = sale.totalAmount - sale.totalCost;
                    return (
                      <div key={sale.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-brand-cream/10 transition">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-brand-chocolate bg-brand-cream px-2 py-0.5 rounded-lg uppercase">
                              {sale.paymentMethod}
                            </span>
                            <span className="text-[10px] text-brand-brown-light font-mono font-medium">
                              {saleDateStr}
                            </span>
                          </div>

                          <div className="mt-2 space-y-1">
                            {sale.items.map((item, index) => (
                              <p key={index} className="text-xs text-brand-chocolate font-medium">
                                {item.quantity}x <span className="font-bold">{item.name}</span> <span className="text-brand-brown-light font-mono text-[11px]">({(item.priceUnit).toFixed(2)}/un)</span>
                              </p>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-brand-brown-light/15">
                          <div className="text-right font-mono">
                            <p className="text-xs text-brand-brown-light font-bold">Total Venda</p>
                            <p className="text-sm font-black text-brand-chocolate">R$ {sale.totalAmount.toFixed(2)}</p>
                            <p className="text-[10px] text-emerald-600 font-bold">Lucro: +R$ {saleProfit.toFixed(2)}</p>
                          </div>
                          
                          <button
                            onClick={() => handleDeleteSale(sale.id, sale.totalAmount)}
                            className="p-2.5 bg-rose-50 hover:bg-rose-100/80 text-rose-600 rounded-xl transition border border-rose-100 cursor-pointer touch-target"
                            title="Estornar venda"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="relatorios-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Report settings panel */}
            <div className="bg-white/45 backdrop-blur-md rounded-3xl p-5 border border-white/55 shadow-xs space-y-4 no-print">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-brand-chocolate text-sm flex items-center gap-1">
                    <FileText className="w-4 h-4 text-brand-rose" />
                    Gerador de Relatórios Financeiros
                  </h3>
                  <p className="text-[10px] text-brand-brown-light font-medium">Selecione o filtro temporal para gerar faturamento e análises dinâmicas.</p>
                </div>

                {/* Simulated Data Quick Link */}
                {allSalesHistory.length < 15 && (
                  <button
                    onClick={handleSeedSimulationData}
                    className="px-3 py-1.5 bg-amber-50/50 hover:bg-amber-100 text-amber-700 font-bold text-[10px] rounded-xl border border-amber-200 transition flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                    title="Simular 12 meses de vendas"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                    Simular Histórico 12 Meses
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Report Type Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-brand-chocolate uppercase tracking-wider block">Frequência</label>
                  <div className="flex bg-white/50 p-1 rounded-xl border border-white/50">
                    <button
                      type="button"
                      onClick={() => setReportType('mensal')}
                      className={`flex-1 py-2 rounded-lg font-bold text-xs transition ${reportType === 'mensal' ? 'bg-brand-chocolate text-white' : 'text-brand-brown-light hover:text-brand-chocolate'} cursor-pointer`}
                    >
                      Relatório Mensal
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportType('anual')}
                      className={`flex-1 py-2 rounded-lg font-bold text-xs transition ${reportType === 'anual' ? 'bg-brand-chocolate text-white' : 'text-brand-brown-light hover:text-brand-chocolate'} cursor-pointer`}
                    >
                      Relatório Anual
                    </button>
                  </div>
                </div>

                {/* 2. Month Selector */}
                {reportType === 'mensal' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-brand-chocolate uppercase tracking-wider block">Selecione o Mês</label>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full px-3 py-2 bg-white/80 border border-white/50 rounded-xl text-xs font-bold text-brand-chocolate focus:outline-none focus:ring-2 focus:ring-brand-rose h-10 cursor-pointer"
                    />
                  </div>
                )}

                {/* 3. Year Selector */}
                {reportType === 'anual' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-brand-chocolate uppercase tracking-wider block">Selecione o Ano</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full px-3 py-2 bg-white/80 border border-white/50 rounded-xl text-xs font-bold text-brand-chocolate focus:outline-none focus:ring-2 focus:ring-brand-rose h-10 cursor-pointer"
                    >
                      {Array.from({ length: 3 }, (_, i) => String(new Date().getFullYear() - i)).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Export triggers */}
                <div className="space-y-1 flex items-end gap-2">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    disabled={filteredPeriodSales.length === 0}
                    className="flex-1 py-2.5 bg-brand-cream/85 hover:bg-white text-brand-chocolate font-bold text-xs border border-white/70 rounded-xl transition flex items-center justify-center gap-1 touch-target disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    title="Exportar dados de faturamento para Excel"
                  >
                    <Download className="w-4 h-4 text-emerald-600" />
                    CSV
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintPDF}
                    disabled={filteredPeriodSales.length === 0}
                    className="flex-1 py-2.5 bg-brand-chocolate hover:bg-brand-chocolate/90 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 touch-target shadow-md disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    title="Imprimir ou Salvar Relatório em PDF"
                  >
                    <Printer className="w-4 h-4 text-brand-gold animate-bounce-slow" />
                    PDF
                  </button>
                </div>
              </div>
            </div>

            {/* PRINT CONTAINER WITH ENHANCED CUSTOMER REPORTS */}
            <div className="print-container space-y-6">
              
              {/* Report Header for Print/Visual */}
              <div className="bg-white/45 backdrop-blur-md rounded-3xl p-5 border border-white/55 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <span className="text-[8px] sm:text-[9px] font-black uppercase text-brand-rose bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                    {reportType === 'mensal' ? 'RELATÓRIO MENSAL DE DESEMPENHO' : 'RELATÓRIO ANUAL DE DESEMPENHO'}
                  </span>
                  <h2 className="text-xl md:text-2xl font-black text-brand-chocolate mt-2 font-display">
                    {reportType === 'mensal' 
                      ? `Competência: ${new Date(selectedMonth + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
                      : `Competência Anual: Exercício ${selectedYear}`}
                  </h2>
                  <p className="text-[10px] text-brand-brown-light mt-0.5">Ficha financeira gerada em {new Date().toLocaleDateString('pt-BR')}</p>
                </div>

                <div className="font-mono text-center sm:text-right border-t sm:border-t-0 border-white/30 pt-3 sm:pt-0">
                  <span className="text-[10px] font-bold text-brand-brown-light uppercase block">MARGEM LÍQUIDA</span>
                  <span className="text-3xl font-black text-brand-chocolate">{marginReport.toFixed(1)}%</span>
                  <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Fórmula CMV aplicada</span>
                </div>
              </div>

              {filteredPeriodSales.length === 0 ? (
                <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 p-12 text-center text-brand-brown-light/60">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-brand-rose" />
                  <p className="text-sm font-bold text-brand-chocolate">Nenhum faturamento registrado para o período.</p>
                  <p className="text-xs mt-1">Insira vendas no PDV ou simule dados demonstrativos acima para iniciar as análises.</p>
                </div>
              ) : (
                <>
                  {/* Detailed Report stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print-grid">
                    <div className="bg-white/45 backdrop-blur-md rounded-2xl border border-white/55 p-4 shadow-xs">
                      <span className="text-[10px] text-brand-brown-light/60 block uppercase font-bold tracking-wider">FATURAMENTO TOTAL</span>
                      <p className="font-mono text-xl font-black text-brand-chocolate mt-1">
                        R$ {totalRevenueReport.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <span className="text-[10px] text-brand-brown-light block font-medium mt-0.5">{filteredPeriodSales.length} transações</span>
                    </div>

                    <div className="bg-white/45 backdrop-blur-md rounded-2xl border border-white/55 p-4 shadow-xs">
                      <span className="text-[10px] text-brand-brown-light/60 block uppercase font-bold tracking-wider">CUSTO DE INSUMOS (CMV)</span>
                      <p className="font-mono text-xl font-bold text-rose-700 mt-1">
                        R$ {totalCostReport.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <span className="text-[10px] text-rose-600 block font-medium mt-0.5">({(totalRevenueReport > 0 ? (totalCostReport / totalRevenueReport) * 100 : 0).toFixed(0)}% do total)</span>
                    </div>

                    <div className="bg-white/45 backdrop-blur-md rounded-2xl border border-white/55 p-4 shadow-xs">
                      <span className="text-[10px] text-brand-brown-light/60 block uppercase font-bold tracking-wider">LUCRO REAL LÍQUIDO</span>
                      <p className="font-mono text-xl font-bold text-emerald-700 mt-1">
                        R$ {netProfitReport.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <span className="text-[10px] text-emerald-600 block font-medium mt-0.5">+{marginReport.toFixed(1)}% de retorno</span>
                    </div>

                    <div className="bg-slate-900/80 backdrop-blur-md text-white rounded-2xl p-4 shadow-xs border border-white/10">
                      <span className="text-[10px] text-brand-gold/80 block uppercase font-bold tracking-wider">CAIXA DE GIRO (20%)</span>
                      <p className="font-mono text-xl font-extrabold text-brand-gold mt-1">
                        R$ {emergencyFundReport.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <span className="text-[10px] text-white/70 block font-medium mt-0.5">Reservado para o mês</span>
                    </div>
                  </div>

                  {/* Graph 1 & 2: Sales Trend & 40/40/20 Distribution */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Trend Line chart */}
                    <div className="bg-white/45 backdrop-blur-md rounded-3xl border border-white/55 p-5 shadow-xs">
                      <h3 className="font-bold text-brand-chocolate text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        <span>Curva de Vendas e Retorno Líquido</span>
                      </h3>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={reportTrendData}>
                            <XAxis dataKey="date" stroke="#64748b" fontSize={9} tickLine={false} />
                            <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                            <Tooltip content={<CustomTooltipElement />} />
                            <Area type="monotone" dataKey="faturamento" stroke="#f43f5e" fillOpacity={0.1} fill="#f43f5e" name="Faturamento" strokeWidth={2} />
                            <Area type="monotone" dataKey="lucro" stroke="#10b981" fillOpacity={0.05} fill="#10b981" name="Lucro Real" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* 40/40/20 report pie distribution */}
                    <div className="bg-white/45 backdrop-blur-md rounded-3xl border border-white/55 p-5 shadow-xs flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-brand-chocolate text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-brand-rose" />
                          <span>Fração das Contas (Regra 40/40/20)</span>
                        </h3>
                        <p className="text-[10px] text-brand-brown-light/80 leading-relaxed">Divisão proporcional recomendada para este período de faturamento.</p>
                      </div>
                      
                      <div className="h-40 flex items-center justify-center my-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={reportPieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={60}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {reportPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltipElement />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[9px] font-bold border-t border-white/20 pt-3 text-center">
                        <div>
                          <span className="block text-stone-500 uppercase text-[8px]">Insumos (40%)</span>
                          <span className="text-stone-600 font-mono">R$ {replacementFundReport.toFixed(2)}</span>
                        </div>
                        <div className="border-x border-white/20">
                          <span className="block text-rose-500 uppercase text-[8px]">Pró-Labore (40%)</span>
                          <span className="text-rose-500 font-mono">R$ {profitFundReport.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="block text-amber-500 uppercase text-[8px]">Reserva (20%)</span>
                          <span className="text-amber-500 font-mono">R$ {emergencyFundReport.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Graph 3 & 4: Category Profitability & Top Product Pricing analysis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Category Profitability bar */}
                    <div className="bg-white/45 backdrop-blur-md rounded-3xl border border-white/55 p-5 shadow-xs">
                      <h3 className="font-bold text-brand-chocolate text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <BarChart2 className="w-4 h-4 text-indigo-600" />
                        <span>Lucratividade por Categoria de Confeitos</span>
                      </h3>
                      <p className="text-[10px] text-brand-brown-light/80 mb-4 leading-relaxed">
                        Classificação inteligente baseada na descrição dos produtos vendidos no período.
                      </p>
                      
                      {categoryData.length === 0 ? (
                        <div className="h-52 flex items-center justify-center text-xs text-brand-brown-light/50 italic">
                          Dados de categorias insuficientes.
                        </div>
                      ) : (
                        <div className="h-52">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryData} layout="vertical">
                              <XAxis type="number" stroke="#64748b" fontSize={9} tickLine={false} />
                              <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={9} tickLine={false} width={80} />
                              <Tooltip content={<CustomTooltipElement />} />
                              <Bar dataKey="faturamento" fill="#818cf8" name="Faturamento" radius={[0, 4, 4, 0]} />
                              <Bar dataKey="lucro" fill="#34d399" name="Lucro Real" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>

                    {/* Cost vs. Pricing Chart */}
                    <div className="bg-white/45 backdrop-blur-md rounded-3xl border border-white/55 p-5 shadow-xs">
                      <h3 className="font-bold text-brand-chocolate text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-brand-gold" />
                        <span>Custos de Produção versus Preço Praticado</span>
                      </h3>
                      <p className="text-[10px] text-brand-brown-light/80 mb-4 leading-relaxed">
                        Comparativo unitário dos 5 itens mais vendidos do período selecionado.
                      </p>

                      {costVsPriceData.length === 0 ? (
                        <div className="h-52 flex items-center justify-center text-xs text-brand-brown-light/50 italic">
                          Dados de custos insuficientes.
                        </div>
                      ) : (
                        <div className="h-52">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={costVsPriceData}>
                              <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                              <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                              <Tooltip />
                              <Bar dataKey="Preço Venda" fill="#f59e0b" name="Preço de Venda (R$)" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="Custo Produção" fill="#dc2626" name="Custo de Insumos (R$)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Projected Cash Flow Area Chart */}
                  <div className="bg-white/45 backdrop-blur-md rounded-3xl border border-white/55 p-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                      <div>
                        <h3 className="font-bold text-brand-chocolate text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-emerald-600 animate-pulse" />
                          <span>Fluxo de Caixa Mensal Projetado (Estatístico)</span>
                        </h3>
                        <p className="text-[10px] text-brand-brown-light/80 mt-0.5">Estimativa para os próximos 3 meses baseada em regressão linear dos meses anteriores.</p>
                      </div>
                      <span className="text-[9px] font-bold text-brand-gold bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 self-start sm:self-auto">* Meses estimados</span>
                    </div>

                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={projectedCashFlow}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="monthLabel" stroke="#64748b" fontSize={9} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                          <Tooltip content={({ active, payload, label }: any) => {
                            if (active && payload && payload.length) {
                              const isProj = payload[0]?.payload?.isProjection;
                              return (
                                <div className="bg-slate-900/95 text-white p-3 rounded-2xl border border-white/10 text-[11px] shadow-xl min-w-[140px]">
                                  <p className="font-bold border-b border-white/10 pb-1 mb-1.5">
                                    {label} {isProj ? "(PROJETADO)" : ""}
                                  </p>
                                  <p className="flex justify-between gap-4 py-0.5 text-rose-400">
                                    <span>Faturamento:</span>
                                    <span className="font-mono font-bold">R$ {payload[0]?.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </p>
                                  <p className="flex justify-between gap-4 py-0.5 text-stone-400">
                                    <span>Custo CMV:</span>
                                    <span className="font-mono font-bold">R$ {payload[1]?.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </p>
                                  <p className="flex justify-between gap-4 py-0.5 border-t border-white/10 mt-1 pt-1 text-emerald-400">
                                    <span>Lucro Real:</span>
                                    <span className="font-mono font-bold">R$ {payload[2]?.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }} />
                          <Legend verticalAlign="top" height={36} iconSize={10} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                          <Line type="monotone" dataKey="faturamento" stroke="#f43f5e" strokeWidth={3} name="Faturamento (R$)" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="custo" stroke="#64748b" strokeWidth={2} name="Custo de Insumos (R$)" strokeDasharray="4 4" dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="lucro" stroke="#10b981" strokeWidth={3} name="Lucro Real (R$)" dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Printable Signature Footnote */}
                  <div className="hidden print:block border-t border-dashed border-stone-300 pt-10 text-center text-xs text-brand-brown-light space-y-6">
                    <div className="flex justify-around items-center pt-4">
                      <div className="flex flex-col items-center">
                        <div className="w-40 border-b border-stone-400 h-1" />
                        <span className="mt-2 font-bold text-[10px]">Assinatura do Confeiteiro(a) / Gestor</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-40 border-b border-stone-400 h-1" />
                        <span className="mt-2 font-bold text-[10px]">Auditoria Financeira Interna</span>
                      </div>
                    </div>
                    <p className="text-[9px] italic mt-4">Ficha gerada através do sistema integrado Doce Controle. Todos os direitos reservados.</p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
