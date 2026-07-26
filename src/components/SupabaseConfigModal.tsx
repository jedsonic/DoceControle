import React, { useState, useEffect } from 'react';
import { SupabaseConfig } from '../types';
import { StorageService } from '../lib/storage';
import { Server, Database, Check, Copy, AlertCircle, FileText, Info, X } from 'lucide-react';
import { motion } from 'motion/react';
import { createClient } from '@supabase/supabase-js';
import { resetSupabaseInstance } from '../lib/supabase';

interface SupabaseConfigModalProps {
  onClose: () => void;
}

export default function SupabaseConfigModal({ onClose }: SupabaseConfigModalProps) {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'success' | 'error' | null, msg: string }>({ status: null, msg: '' });

  useEffect(() => {
    const config = StorageService.getSupabaseConfig();
    setUrl(config.url);
    setAnonKey(config.anonKey);
    setEnabled(config.enabled);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSupabaseConfig({
      url: url.trim(),
      anonKey: anonKey.trim(),
      enabled
    });
    resetSupabaseInstance();
    alert('Configurações salvas com sucesso! Os dados locais continuam seguros e prontos para sincronização.');
    onClose();
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(StorageService.getSupabaseSQLSchema());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestConnection = async () => {
    setTestResult({ status: null, msg: 'Testando conexão...' });
    if (!url || !anonKey) {
      setTestResult({ status: 'error', msg: 'Por favor, preencha a URL e a Anon Key para testar.' });
      return;
    }

    try {
      const testClient = createClient(url.trim(), anonKey.trim());
      const { error } = await testClient.auth.getSession();
      
      if (error) throw error;
      
      setTestResult({
        status: 'success',
        msg: 'Conexão real estabelecida com sucesso! Credenciais e conectividade de API válidas.'
      });
    } catch (err: any) {
      setTestResult({
        status: 'error',
        msg: 'Erro ao conectar no projeto Supabase: ' + (err.message || err.toString())
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-white/50 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 bg-white/40 border border-white/50 rounded-full text-brand-chocolate hover:bg-white/70 transition active:scale-90 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-550/10 text-emerald-600 rounded-xl flex items-center justify-center">
            <Database className="w-5 h-5 text-brand-gold animate-bounce" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-brand-chocolate">Conexão com Banco de Dados Supabase</h2>
            <p className="text-xs text-brand-brown-light font-medium">Sincronize sua confeitaria local com a nuvem em tempo real</p>
          </div>
        </div>

        {/* Informative Alert */}
        <div className="bg-white/20 p-4 rounded-2xl border border-white/30 backdrop-blur-xs mb-6 flex items-start gap-3 text-xs text-brand-chocolate">
          <Info className="w-5 h-5 text-brand-rose shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Como funciona a integração com Supabase?</p>
            <p className="leading-relaxed">
              O Doce Controle utiliza um mecanismo local-first extremamente robusto. Ao conectar o Supabase, os dados do seu negócio serão persistidos na nuvem de forma privada, permitindo que você acesse de múltiplos dispositivos simultaneamente.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-brand-chocolate uppercase tracking-wider block">
              URL do seu Projeto Supabase
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Ex: https://xyzcompany.supabase.co"
              className="w-full px-4 py-3 bg-white/40 border border-white/50 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-rose/25 text-brand-chocolate font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-brand-chocolate uppercase tracking-wider block">
              Anon Key do Supabase (Chave pública de API)
            </label>
            <input
              type="text"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="Ex: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-4 py-3 bg-white/40 border border-white/50 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-rose/25 text-brand-chocolate font-mono"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-y border-white/20">
            <div>
              <span className="text-xs font-bold text-brand-chocolate block">Ativar Sincronização em Nuvem</span>
              <span className="text-[10px] text-brand-brown-light block">Habilita leitura e escrita direta no Supabase</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={enabled} 
                onChange={(e) => setEnabled(e.target.checked)} 
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/30 border border-white/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {testResult.status && (
            <div className={`p-3 rounded-xl text-xs font-medium border ${testResult.status === 'success' ? 'bg-emerald-50/50 backdrop-blur-xs border-emerald-200/50 text-emerald-800' : 'bg-rose-50/50 backdrop-blur-xs border-rose-200/50 text-rose-800'}`}>
              {testResult.msg}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              className="flex-1 py-3 bg-white/40 hover:bg-white text-brand-chocolate border border-white/50 rounded-xl font-bold text-xs cursor-pointer"
            >
              Testar Conexão
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-brand-chocolate hover:bg-brand-chocolate/90 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer"
            >
              Salvar Credenciais
            </button>
          </div>
        </form>

        {/* SQL Schema Migrations Section */}
        <div className="mt-6 border-t border-white/20 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-brand-chocolate text-xs uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-4 h-4 text-brand-gold" />
              <span>Script de Migração SQL para Supabase</span>
            </h3>

            <button
              onClick={handleCopySQL}
              className="text-xs text-brand-rose font-bold hover:underline flex items-center gap-1"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar SQL</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[10px] text-brand-brown-light mb-2 leading-relaxed">
            Abra o console SQL do seu projeto no Supabase, cole o script abaixo e clique em "Run" para criar instantaneamente todas as tabelas necessárias (<span className="font-bold">insumos, receitas, lotes, estoque_produtos, vendas</span>) com seus devidos índices e RLS.
          </p>

          <pre className="w-full h-32 overflow-auto bg-stone-950/80 backdrop-blur-xs text-stone-200 p-3 rounded-2xl text-[10px] font-mono leading-relaxed text-left border border-white/20 scrollbar-thin">
            {StorageService.getSupabaseSQLSchema()}
          </pre>
        </div>
      </motion.div>
    </div>
  );
}
