import React, { useState, useCallback } from 'react';
import { StorageService } from '../lib/storage';
import { User } from '../types';
import { getSupabase } from '../lib/supabase';
import SupabaseConfigModal from './SupabaseConfigModal';
import { Cake, Sparkles, LogIn, Store, Lock, Mail, Database, Eye, EyeOff, UserPlus, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Estado reativo para atualizar quando o modal de configuração for fechado
  const [supabaseKey, setSupabaseKey] = useState(0);
  const supabase = getSupabase();

  const handleModalClose = useCallback(() => {
    setIsSupabaseModalOpen(false);
    setSupabaseKey(k => k + 1);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (!username.trim()) {
      setError(supabase ? 'Por favor, informe seu e-mail.' : 'Por favor, informe o seu usuário.');
      setLoading(false);
      return;
    }

    if (supabase && !password) {
      setError('Por favor, informe sua senha.');
      setLoading(false);
      return;
    }

    if (isRegistering && !businessName.trim()) {
      setError('Por favor, informe o nome do seu negócio.');
      setLoading(false);
      return;
    }

    // ── FLUXO SUPABASE AUTH ─────────────────────────────────────────
    if (supabase) {
      try {
        if (isRegistering) {
          // Cadastro no Supabase Auth
          const { data, error: signUpError } = await supabase.auth.signUp({
            email: username.trim(),
            password: password,
            options: {
              data: {
                businessName: businessName.trim()
              }
            }
          });

          if (signUpError) throw signUpError;

          if (data.user) {
            // Se o e-mail não for confirmado automaticamente por algum motivo, faz login para verificar
            let session = data.session;
            if (!session) {
              // Tenta efetuar o login imediatamente (auto-confirm via trigger do banco)
              const { data: signInData } = await supabase.auth.signInWithPassword({
                email: username.trim(),
                password: password
              });
              if (signInData.session) {
                session = signInData.session;
              }
            }

            if (session && session.user) {
              const localUser: User = {
                id: session.user.id,
                username: session.user.email || '',
                businessName: businessName.trim() || session.user.user_metadata?.businessName || 'Minha Confeitaria',
                createdAt: session.user.created_at || new Date().toISOString()
              };
              StorageService.setActiveUser(localUser);

              const users = StorageService.getUsers();
              if (!users.some(u => u.id === localUser.id)) {
                users.push(localUser);
                localStorage.setItem('doce_controle_users', JSON.stringify(users));
              }
              onLoginSuccess(localUser);
            } else {
              setSuccessMsg('Cadastro realizado com sucesso! Você já pode entrar com suas credenciais.');
              setIsRegistering(false);
              setPassword('');
            }
          }
        } else {
          // Login no Supabase Auth
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email: username.trim(),
            password: password
          });

          if (signInError) throw signInError;

          if (data.user) {
            const localUser: User = {
              id: data.user.id,
              username: data.user.email || '',
              businessName: data.user.user_metadata?.businessName || 'Minha Confeitaria',
              createdAt: data.user.created_at || new Date().toISOString()
            };
            StorageService.setActiveUser(localUser);

            const users = StorageService.getUsers();
            if (!users.some(u => u.id === localUser.id)) {
              users.push(localUser);
              localStorage.setItem('doce_controle_users', JSON.stringify(users));
            }
            onLoginSuccess(localUser);
          }
        }
      } catch (err: any) {
        console.error(err);
        const msg: string = err.message || '';
        if (msg.includes('Invalid login credentials')) {
          setError('E-mail ou senha incorretos. Verifique suas credenciais.');
        } else if (msg.includes('Email not confirmed')) {
          setError('Sua conta ainda não foi confirmada. Verifique sua caixa de entrada.');
        } else if (msg.includes('User already registered')) {
          setError('Este e-mail já está cadastrado. Alterne para a aba "Entrar".');
        } else {
          setError(msg || 'Erro ao conectar ao Supabase.');
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── FLUXO LOCAL (FALLBACK) ─────────────────────────────────────────
    try {
      const user = StorageService.login(
        username.trim(),
        isRegistering ? businessName.trim() : ''
      );
      onLoginSuccess(user);
    } catch (err: any) {
      setError('Erro ao efetuar login local. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-container" className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-amber-50/40 to-pink-50 p-4 relative overflow-hidden">
      {/* Background Decor Elements */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-brand-rose/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-brand-gold/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar Button: Supabase Status & Config */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setIsSupabaseModalOpen(true)}
          className="px-3 py-2 bg-white/70 hover:bg-white text-brand-chocolate rounded-2xl border border-white/60 backdrop-blur-md transition active:scale-95 flex items-center gap-2 font-bold text-xs cursor-pointer shadow-sm"
          title="Configurar Conexão com Supabase"
        >
          <Database className={`w-4 h-4 ${supabase ? 'text-emerald-600 animate-pulse' : 'text-amber-500'}`} />
          <span>{supabase ? 'Supabase Conectado' : 'Modo Offline'}</span>
        </button>
      </div>

      <motion.div
        key={supabaseKey}
        initial={{ opacity: 0, y: 25, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/80 p-8 relative z-10"
      >
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-brand-chocolate via-brand-rose to-brand-gold rounded-2xl flex items-center justify-center text-white mb-3 shadow-lg shadow-brand-rose/25">
            <Cake className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-chocolate">Doce Controle</h1>
          <p className="text-xs text-brand-brown-light mt-1 max-w-xs font-medium">
            Gestão inteligente de produção, estoque e vendas em tempo real
          </p>

          <div className="mt-3 flex items-center gap-1.5">
            {supabase ? (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Autenticação Supabase Ativa
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-[10px] font-bold px-3 py-1 rounded-full border border-amber-200 shadow-2xs">
                ● Armazenamento Local
              </span>
            )}
          </div>
        </div>

        {/* Tab Toggle: Entrar vs Cadastrar */}
        <div className="flex p-1 bg-brand-cream/60 rounded-2xl mb-6 border border-brand-brown-light/10">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(false);
              setError('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              !isRegistering
                ? 'bg-white text-brand-chocolate shadow-sm'
                : 'text-brand-brown-light/70 hover:text-brand-chocolate'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Entrar
          </button>

          <button
            type="button"
            onClick={() => {
              setIsRegistering(true);
              setError('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              isRegistering
                ? 'bg-white text-brand-chocolate shadow-sm'
                : 'text-brand-brown-light/70 hover:text-brand-chocolate'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Cadastrar
          </button>
        </div>

        {/* Messages */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-2xl mb-4 font-semibold text-center"
            >
              {error}
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-2xl mb-4 font-semibold text-center flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome do Negócio (Apenas no Cadastro) */}
          {isRegistering && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-1"
            >
              <label className="text-[11px] font-bold text-brand-chocolate uppercase tracking-wider block">
                Nome do seu Negócio / Confeitaria
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-brown-light/50">
                  <Store className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ex: Maria Bolos & Tortas"
                  className="w-full pl-10 pr-4 py-3 bg-brand-cream/30 border border-brand-brown-light/15 rounded-2xl text-brand-chocolate placeholder-brand-brown-light/40 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition"
                  required={isRegistering}
                />
              </div>
            </motion.div>
          )}

          {/* E-mail ou Nome de Usuário */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-brand-chocolate uppercase tracking-wider block">
              {supabase ? 'E-mail' : 'Nome de Usuário'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-brown-light/50">
                {supabase ? <Mail className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              </span>
              <input
                type={supabase ? 'email' : 'text'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={supabase ? 'Ex: confeitaria@exemplo.com' : 'Ex: maria_doces'}
                className="w-full pl-10 pr-4 py-3 bg-brand-cream/30 border border-brand-brown-light/15 rounded-2xl text-brand-chocolate placeholder-brand-brown-light/40 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition"
                required
              />
            </div>
          </div>

          {/* Senha (com Toggle Mostrar/Ocultar) */}
          {supabase && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-brand-chocolate uppercase tracking-wider block">
                Senha
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-brown-light/50">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha de acesso"
                  className="w-full pl-10 pr-10 py-3 bg-brand-cream/30 border border-brand-brown-light/15 rounded-2xl text-brand-chocolate placeholder-brand-brown-light/40 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-brand-brown-light/50 hover:text-brand-chocolate cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand-chocolate hover:bg-brand-chocolate/90 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition flex items-center justify-center gap-2 touch-target mt-4 cursor-pointer disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4 text-brand-gold animate-pulse" />
            {loading ? 'Aguarde...' : (isRegistering ? 'Criar Conta no Supabase' : 'Entrar no Sistema')}
          </button>
        </form>

        <div className="mt-6 border-t border-brand-brown-light/10 pt-4 text-center">
          <p className="text-[11px] text-brand-brown-light/60">
            Doce Controle • Sincronização em Nuvem em Tempo Real
          </p>
        </div>
      </motion.div>

      {/* Modal de Configuração do Supabase */}
      {isSupabaseModalOpen && (
        <SupabaseConfigModal onClose={handleModalClose} />
      )}
    </div>
  );
}
