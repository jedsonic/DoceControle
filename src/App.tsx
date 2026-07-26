/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from './types';
import { StorageService } from './lib/storage';
import LoginScreen from './components/LoginScreen';
import InsumosScreen from './components/InsumosScreen';
import ReceitasScreen from './components/ReceitasScreen';
import LotesScreen from './components/LotesScreen';
import EstoqueScreen from './components/EstoqueScreen';
import PdvScreen from './components/PdvScreen';
import FinanceiroScreen from './components/FinanceiroScreen';
import SupabaseConfigModal from './components/SupabaseConfigModal';
import FreteConfig from './components/FreteConfig';
import PublicCatalogScreen from './components/PublicCatalogScreen';
import CustosIndiretosScreen from './components/CustosIndiretosScreen';
import { getSupabase } from './lib/supabase';

import { 
  ShoppingBag, 
  BookOpen, 
  ChefHat, 
  TrendingUp, 
  Database, 
  LogOut, 
  Sparkles, 
  ShoppingCart, 
  Store,
  Grid,
  Navigation,
  Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type ScreenType = 'insumos' | 'receitas' | 'custos' | 'lotes' | 'estoque' | 'pdv' | 'financeiro' | 'frete';

export default function App() {
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [activeScreen, setActiveScreen] = useState<ScreenType>('pdv'); // Default is PDV as requested ("focada em velocidade")
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  useEffect(() => {
    // Load logged in user on mount
    const user = StorageService.getActiveUser();
    if (user) {
      setActiveUser(user);
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    setActiveUser(user);
    setActiveScreen('pdv'); // Go to fast PDV by default
  };

  const handleLogout = async () => {
    const confirmed = window.confirm('Deseja realmente sair da sua conta? Seus dados locais continuam seguros neste dispositivo.');
    if (confirmed) {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.auth.signOut();
      }
      StorageService.logout();
      setActiveUser(null);
    }
  };

  // If it's a public catalog link, bypass admin login/screens entirely
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash;
  const isPublicCatalog = params.has('c') || params.has('catalogo') || hash.startsWith('#c=') || hash.startsWith('#catalogo=');
  if (isPublicCatalog) {
    return <PublicCatalogScreen />;
  }

  // If not authenticated, render Login/Onboarding screen
  if (!activeUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Navigation tab definitions
  const tabs = [
    { id: 'pdv' as ScreenType, label: 'PDV', icon: ShoppingCart, color: 'text-brand-rose' },
    { id: 'lotes' as ScreenType, label: 'Produção', icon: ChefHat, color: 'text-brand-gold' },
    { id: 'estoque' as ScreenType, label: 'Estoque', icon: ShoppingBag, color: 'text-amber-600' },
    { id: 'receitas' as ScreenType, label: 'Receitas', icon: BookOpen, color: 'text-indigo-500' },
    { id: 'custos' as ScreenType, label: 'Custos', icon: Calculator, color: 'text-purple-600' },
    { id: 'insumos' as ScreenType, label: 'Insumos', icon: Grid, color: 'text-stone-500' },
    { id: 'financeiro' as ScreenType, label: 'Financeiro', icon: TrendingUp, color: 'text-emerald-600' },
    { id: 'frete' as ScreenType, label: 'Frete', icon: Navigation, color: 'text-brand-rose' }
  ];

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'insumos':
        return <InsumosScreen userId={activeUser.id} />;
      case 'receitas':
        return <ReceitasScreen 
          userId={activeUser.id} 
          onNavigateToCustos={() => setActiveScreen('custos')}
        />;
      case 'custos':
        return <CustosIndiretosScreen userId={activeUser.id} />;
      case 'lotes':
        return <LotesScreen 
          userId={activeUser.id} 
          onNavigateToStock={() => setActiveScreen('estoque')} 
        />;
      case 'estoque':
        return <EstoqueScreen 
          userId={activeUser.id} 
          onNavigateToLots={() => setActiveScreen('lotes')}
          onNavigateToInsumos={() => setActiveScreen('insumos')}
        />;
      case 'pdv':
        return <PdvScreen 
          userId={activeUser.id} 
          onSaleSuccess={() => {}} // trigger any callbacks if needed
        />;
      case 'financeiro':
        return <FinanceiroScreen userId={activeUser.id} />;
      case 'frete':
        return <FreteConfig userId={activeUser.id} />;
      default:
        return <PdvScreen userId={activeUser.id} />;
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-brand-chocolate pb-24 md:pb-10 font-sans flex flex-col">
      {/* Top Header Sticky Bar */}
      <header className="sticky top-0 z-40 bg-white/30 backdrop-blur-xl border-b border-white/50 shadow-xs px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-rose rounded-xl flex items-center justify-center text-white shadow-xs">
              <Store className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm tracking-tight text-brand-chocolate truncate">
                {activeUser.businessName}
              </h2>
              <span className="text-[10px] text-brand-brown-light font-medium block leading-none">
                @ {activeUser.username}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Supabase Button */}
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className="p-2.5 bg-white/40 hover:bg-white/60 text-brand-brown-light hover:text-brand-chocolate rounded-xl border border-white/50 backdrop-blur-md transition active:scale-95 flex items-center gap-1.5 font-bold text-xs cursor-pointer"
              title="Configurar Supabase"
            >
              <Database className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Supabase</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2.5 bg-rose-50/50 hover:bg-rose-100/60 text-rose-600 rounded-xl border border-rose-100/50 backdrop-blur-md transition active:scale-95 cursor-pointer"
              title="Sair da Conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Screen Stage */}
      <main className="flex-1 w-full py-4 relative z-10 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeScreen}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {renderActiveScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile-First Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/40 backdrop-blur-xl border-t border-white/50 shadow-lg px-2 py-2 flex justify-around md:max-w-md md:mx-auto md:rounded-t-[2.5rem] md:border-x md:border-white/50">
        {tabs.map((tab) => {
          const isActive = activeScreen === tab.id;
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveScreen(tab.id)}
              className="flex flex-col items-center justify-center flex-1 py-1 px-1 text-center cursor-pointer relative"
              title={tab.label}
            >
              {/* Ripple dot if active */}
              {isActive && (
                <motion.div 
                  layoutId="active-indicator"
                  className="absolute inset-x-2 -top-2 h-1 bg-brand-rose rounded-full"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              
              <IconComponent 
                className={`w-5 h-5 mb-1 transition-all ${isActive ? `${tab.color} scale-110 stroke-[2.5]` : 'text-brand-brown-light/65 hover:text-brand-chocolate'}`} 
              />
              <span 
                className={`text-[9px] font-bold tracking-tight transition-all ${isActive ? 'text-brand-chocolate scale-105' : 'text-brand-brown-light/65'}`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Settings Modal overlay */}
      {isSupabaseModalOpen && (
        <SupabaseConfigModal onClose={() => setIsSupabaseModalOpen(false)} />
      )}
    </div>
  );
}
