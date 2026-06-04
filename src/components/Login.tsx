import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Construction 
} from 'lucide-react';
import { cn } from '../lib/utils';

type AuthMode = 'login' | 'signup' | 'forgot';

export default function Login() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const clearMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else if (mode === 'signup') {
        if (!nome.trim()) {
          throw new Error('Por favor, informe seu nome.');
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nome: nome,
            },
          },
        });
        if (error) throw error;
        setSuccessMsg('Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta ou faça login.');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setSuccessMsg('E-mail de recuperação enviado com sucesso!');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 py-12 select-none">
      <div className="w-full max-w-md">
        {/* Brand Logo & Name */}
        <div className="flex flex-col items-center gap-3 mb-8 text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-blue-100">
            <Construction className="text-white" size={36} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">OrçaPrático</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Orçamentos de Obras Simplificados</p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-2xl shadow-slate-200/50 p-8 relative overflow-hidden">
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

          {/* Form Header */}
          <div className="mb-6">
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
              {mode === 'login' && 'Seja bem-vindo de volta'}
              {mode === 'signup' && 'Criar sua conta profissional'}
              {mode === 'forgot' && 'Recuperar acesso'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {mode === 'login' && 'Insira seus dados de acesso para gerenciar seus orçamentos.'}
              {mode === 'signup' && 'Comece a gerar orçamentos profissionais em poucos minutos.'}
              {mode === 'forgot' && 'Digite seu e-mail cadastrado para redefinir sua senha.'}
            </p>
          </div>

          {/* Error and Success Alert Banners */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-error-container text-error rounded-2xl border border-red-100 flex items-start gap-3"
              >
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <span className="text-xs font-semibold leading-relaxed">{errorMsg}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-secondary-container text-on-secondary-container rounded-2xl border border-emerald-100 flex items-start gap-3"
              >
                <CheckCircle2 className="shrink-0 mt-0.5 text-secondary" size={18} />
                <span className="text-xs font-semibold leading-relaxed">{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {/* Nome (Signup Only) */}
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5"
                >
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      type="text"
                      required
                      placeholder="Ex: João Silva"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </motion.div>
              )}

              {/* Email */}
              <motion.div layout className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">E-mail profissional</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="email"
                    required
                    placeholder="voce@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-medium"
                  />
                </div>
              </motion.div>

              {/* Password (Login & Signup) */}
              {mode !== 'forgot' && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: 10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  layout
                  className="space-y-1.5"
                >
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Senha</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => { setMode('forgot'); clearMessages(); }}
                        className="text-[10px] font-bold uppercase text-primary tracking-widest hover:underline focus:outline-none"
                      >
                        Esqueceu?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
              layout
              type="submit"
              disabled={loading}
              className={cn(
                "w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-extrabold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all text-xs disabled:opacity-50 mt-4 active:scale-95 touch-target",
                mode === 'signup' && "bg-secondary hover:bg-emerald-600 shadow-emerald-100"
              )}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <>
                  {mode === 'login' && 'Entrar na Conta'}
                  {mode === 'signup' && 'Criar Conta'}
                  {mode === 'forgot' && 'Enviar link de redefinição'}
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>

          {/* Mode Switcher Footer */}
          <motion.div layout className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-2">
            {mode === 'login' && (
              <p className="text-xs text-slate-400">
                Não tem uma conta?{' '}
                <button
                  onClick={() => { setMode('signup'); clearMessages(); }}
                  className="font-bold text-primary hover:underline focus:outline-none"
                >
                  Cadastre-se gratuitamente
                </button>
              </p>
            )}

            {mode === 'signup' && (
              <p className="text-xs text-slate-400">
                Já possui cadastro?{' '}
                <button
                  onClick={() => { setMode('login'); clearMessages(); }}
                  className="font-bold text-primary hover:underline focus:outline-none"
                >
                  Faça login
                </button>
              </p>
            )}

            {mode === 'forgot' && (
              <button
                onClick={() => { setMode('login'); clearMessages(); }}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 hover:underline focus:outline-none"
              >
                Voltar para o Login
              </button>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
