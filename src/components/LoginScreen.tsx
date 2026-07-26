import React, { useState } from 'react';
import { StorageService } from '../lib/storage';
import { User } from '../types';
import { getSupabase } from '../lib/supabase';
import SupabaseConfigModal from './SupabaseConfigModal';
import { Cake, Sparkles, LogIn, Store, Lock, Mail, Database, Settings } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState(''); // Servirá como Email se Supabase estiver ativo
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  const supabase = getSupabase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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

    // --- Fluxo SUPABASE ---
    if (supabase) {
      try {
        if (isRegistering) {
          // Cadastro no Supabase
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
            // Se o email de confirmação estiver ativo e não retornou sessão ativa
            if (!data.session) {
              alert('Cadastro realizado! Por favor, verifique seu e-mail para confirmar a conta antes de entrar.');
              setIsRegistering(false);
              setPassword('');
            } else {
              // Logado automaticamente
              const localUser: User = {
                id: data.user.id,
                username: data.user.email || '',
                businessName: businessName.trim(),
                createdAt: data.user.created_at || new Date().toISOString()
              };
              StorageService.setActiveUser(localUser);
              
              // Salva na lista local para manter sincronismo
              const users = StorageService.getUsers();
              if (!users.some(u => u.id === localUser.id)) {
                users.push(localUser);
                localStorage.setItem('doce_controle_users', JSON.stringify(users));
              }
              onLoginSuccess(localUser);
            }
          }
        } else {
          // Login no Supabase
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
            
            // Salva na lista local
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
        setError(err.message || 'Erro de autenticação no Supabase.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // --- Fluxo LOCAL (Padrão) ---
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
    <div id="login-container" className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-pink via-brand-cream to-white p-4">
      {/* Botão flutuante para Configurações do Supabase */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setIsSupabaseModalOpen(true)}
          className="p-3 bg-white/60 hover:bg-white text-brand-brown-light hover:text-brand-chocolate rounded-2xl border border-white/50 backdrop-blur-md transition active:scale-95 flex items-center gap-1.5 font-bold text-xs cursor-pointer shadow-xs"
          title="Configurar Conexão Supabase"
        >
          <Database className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>Configurar Banco</span>
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-rose-100/50 p-8 relative overflow-hidden"
      >
        {/* Abstract background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-pink rounded-full -mr-16 -mt-16 opacity-40 blur-xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-gold/10 rounded-full opacity-30 blur-2xl" />

        <div className="flex flex-col items-center text-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-brand-rose/10 rounded-2xl flex items-center justify-center text-brand-rose mb-4 shadow-sm">
            <Cake className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-chocolate">Doce Controle</h1>
          <p className="text-sm text-brand-brown-light mt-1.5 max-w-xs">
            {supabase 
              ? 'Conectado ao Supabase Cloud. Acesse sua conta de qualquer dispositivo.'
              : 'Gestão inteligente de produção, receitas, estoque e vendas para confeitaria gourmet.'
            }
          </p>
          {supabase && (
            <span className="mt-2.5 inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-250">
              Supabase Ativo
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl text-center font-medium"
            >
              {error}
            </motion.div>
          )}

          {/* Campo: Usuário / Email */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-brand-chocolate uppercase tracking-wider block">
              {supabase ? 'E-mail' : 'Nome de Usuário'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-brown-light/60">
                {supabase ? <Mail className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              </span>
              <input
                type={supabase ? 'email' : 'text'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={supabase ? 'Ex: maria@gmail.com' : 'Ex: maria, demo, chef_doces'}
                className="w-full pl-10 pr-4 py-3 bg-brand-cream/40 border border-brand-brown-light/15 rounded-2xl text-brand-chocolate placeholder-brand-brown-light/45 focus:outline-none focus:ring-2 focus:ring-brand-rose/25 focus:border-brand-rose text-sm font-medium transition"
                required
              />
            </div>
            {!supabase && (
              <p className="text-[10px] text-brand-brown-light/70 mt-0.5 pl-1">
                *Para contas existentes, digite apenas o usuário. Novos usuários serão criados na hora.
              </p>
            )}
          </div>

          {/* Campo: Senha (Somente se Supabase estiver ativo) */}
          {supabase && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-chocolate uppercase tracking-wider block">
                Senha
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-brown-light/60">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha secreta"
                  className="w-full pl-10 pr-4 py-3 bg-brand-cream/40 border border-brand-brown-light/15 rounded-2xl text-brand-chocolate placeholder-brand-brown-light/45 focus:outline-none focus:ring-2 focus:ring-brand-rose/25 focus:border-brand-rose text-sm font-medium transition"
                  required
                />
              </div>
            </div>
          )}

          {/* Campo: Nome do Negócio (se cadastrando) */}
          {isRegistering && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-1"
            >
              <label className="text-xs font-semibold text-brand-chocolate uppercase tracking-wider block">
                Nome do Negócio / Confeitaria
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-brown-light/60">
                  <Store className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ex: Maria Bolos e Tortas"
                  className="w-full pl-10 pr-4 py-3 bg-brand-cream/40 border border-brand-brown-light/15 rounded-2xl text-brand-chocolate placeholder-brand-brown-light/45 focus:outline-none focus:ring-2 focus:ring-brand-rose/25 focus:border-brand-rose text-sm font-medium transition"
                  required={isRegistering}
                />
              </div>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand-chocolate hover:bg-brand-chocolate/90 text-white rounded-2xl font-semibold text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition flex items-center justify-center gap-2 touch-target mt-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-brand-gold animate-pulse" />
            {loading ? 'Processando...' : (isRegistering ? 'Criar Minha Confeitaria' : 'Entrar no Sistema')}
          </button>
        </form>

        <div className="mt-6 text-center relative z-10">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
            className="text-xs text-brand-rose hover:text-brand-rose/80 font-semibold underline underline-offset-4 transition"
          >
            {isRegistering 
              ? 'Já tenho um negócio cadastrado. Entrar.' 
              : 'Não tem cadastro? Toque aqui para criar seu espaço.'}
          </button>
        </div>

        <div className="mt-8 border-t border-brand-brown-light/10 pt-4 text-center">
          <p className="text-[11px] text-brand-brown-light/60 flex items-center justify-center gap-1">
            <span>Desenvolvido com padrão premium e mobile-first</span>
          </p>
        </div>
      </motion.div>

      {/* Modal de Configuração do Supabase */}
      {isSupabaseModalOpen && (
        <SupabaseConfigModal onClose={() => setIsSupabaseModalOpen(false)} />
      )}
    </div>
  );
}
