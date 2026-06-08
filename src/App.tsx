import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlusCircle, 
  LayoutDashboard, 
  Users, 
  Calculator as CalcIcon, 
  FileText as SummaryIcon,
  Construction,
  User as UserIcon,
  LogOut,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { Quote, QuoteStatus, QuoteItem, CustomerInfo } from './types';
import { supabase } from './lib/supabase';
import Dashboard from './components/Dashboard';
import CustomerForm from './components/CustomerForm';
import Calculator from './components/Calculator';
import Summary from './components/Summary';
import Login from './components/Login';
import ProfileSettings from './components/ProfileSettings';
import ActionHub from './components/ActionHub';
import { cn } from './lib/utils';

type Screen = 'dashboard' | 'customer' | 'calculator' | 'summary' | 'profile' | 'hub';

const EMPTY_CUSTOMER: CustomerInfo = {
  name: '',
  phone: '',
  email: '',
  address: '',
  startDate: new Date().toISOString().split('T')[0],
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  
  // Auth state
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Monitor auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthLoading(false);
      if (!session) {
        setQuotes([]);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch profile and quotes from Supabase
  const loadData = async (userId: string) => {
    try {
      // 1. Fetch Profile
      const { data: profileData, error: profileErr } = await supabase
        .from('perfis_profissionais')
        .select('*')
        .eq('id', userId)
        .single();
      
      let currentProfile = profileData;
      if (profileData) {
        setProfile(profileData);
      }

      // 2. Fetch Quotes
      const { data: quotesData, error: quotesErr } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (quotesErr) throw quotesErr;

      if (quotesData) {
        const mappedQuotes: Quote[] = quotesData.map(q => ({
          id: q.id,
          numeroSequencial: q.numero_sequencial,
          date: q.data,
          customer: q.cliente as CustomerInfo,
          items: q.itens as QuoteItem[],
          discount: Number(q.desconto) || 0,
          adjustment: Number(q.ajuste) || 0,
          notes: q.observacoes || '',
          executionTerm: q.execution_term || '',
          paymentTerms: q.payment_terms || '',
          professionalName: currentProfile?.nome || 'Profissional',
          professionalTaxId: currentProfile?.documento || '',
          professionalPhone: currentProfile?.telefone || '',
          professionalLogoUrl: currentProfile?.logo_url || undefined,
          status: q.status as QuoteStatus,
          totalAmount: Number(q.total_amount) || 0,
          foiPago: q.foi_pago,
          formaPagamento: q.forma_pagamento,
          dataPagamento: q.data_pagamento
        }));
        setQuotes(mappedQuotes);
      }
    } catch (e) {
      console.error('Error loading data:', e);
    }
  };

  useEffect(() => {
    if (user) {
      loadData(user.id);
    }
  }, [user, currentScreen]); // reload data when user logs in or when screen changes to get fresh profile info

  const saveQuoteToSupabase = async (quote: Quote) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('orcamentos')
        .upsert({
          id: quote.id,
          user_id: user.id,
          data: quote.date,
          cliente: quote.customer,
          itens: quote.items,
          desconto: quote.discount,
          ajuste: quote.adjustment,
          observacoes: quote.notes,
          status: quote.status,
          execution_term: quote.executionTerm,
          payment_terms: quote.paymentTerms,
          total_amount: quote.totalAmount,
          foi_pago: quote.foiPago,
          forma_pagamento: quote.formaPagamento,
          data_pagamento: quote.dataPagamento
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const mapped: Quote = {
          id: data.id,
          numeroSequencial: data.numero_sequencial,
          date: data.data,
          customer: data.cliente as CustomerInfo,
          items: data.itens as QuoteItem[],
          discount: Number(data.desconto) || 0,
          adjustment: Number(data.ajuste) || 0,
          notes: data.observacoes || '',
          executionTerm: data.execution_term || '',
          paymentTerms: data.payment_terms || '',
          professionalName: profile?.nome || 'Profissional',
          professionalTaxId: profile?.documento || '',
          professionalPhone: profile?.telefone || '',
          professionalLogoUrl: profile?.logo_url || undefined,
          status: data.status as QuoteStatus,
          totalAmount: Number(data.total_amount) || 0,
          foiPago: data.foi_pago,
          formaPagamento: data.forma_pagamento,
          dataPagamento: data.data_pagamento
        };

        setQuotes(prev => {
          const exists = prev.find(q => q.id === mapped.id);
          if (exists) {
            return prev.map(q => q.id === mapped.id ? mapped : q);
          }
          return [mapped, ...prev];
        });

        // Sync local currentQuote if it is the one being saved
        if (currentQuote && currentQuote.id === mapped.id) {
          setCurrentQuote(mapped);
        }
      }
    } catch (err) {
      console.error('Error saving quote to Supabase:', err);
    }
  };

  const startNewQuote = () => {
    const newQuote: Quote = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleDateString('pt-BR'),
      customer: { ...EMPTY_CUSTOMER },
      items: [],
      discount: 0,
      adjustment: 0,
      notes: profile?.termos_padrao || '',
      executionTerm: 'A combinar',
      paymentTerms: '50% de sinal + 50% na entrega.',
      professionalName: profile?.nome || 'OrçaPrático Serviços',
      professionalTaxId: profile?.documento || '',
      professionalPhone: profile?.telefone || '',
      professionalLogoUrl: profile?.logo_url || undefined,
      status: QuoteStatus.DRAFT,
      totalAmount: 0,
    };
    setCurrentQuote(newQuote);
    saveQuoteToSupabase(newQuote);
    setCurrentScreen('customer');
  };

  const handleUpdateQuote = (updated: Quote) => {
    setCurrentQuote(updated);
    saveQuoteToSupabase(updated);
  };

  const finalizeQuote = async () => {
    if (!currentQuote) return;
    
    const totalAmount = currentQuote.items.reduce((acc, i) => acc + i.total, 0) - currentQuote.discount + currentQuote.adjustment;
    const finalized = { 
      ...currentQuote, 
      status: QuoteStatus.SENT,
      totalAmount
    };
    
    await saveQuoteToSupabase(finalized);
    setCurrentScreen('dashboard');
    setCurrentQuote(null);
  };

  const deleteQuote = async (id: string) => {
    setQuotes(prev => prev.filter(q => q.id !== id));
    try {
      const { error } = await supabase
        .from('orcamentos')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Error deleting quote:', err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return (
          <Dashboard 
            quotes={quotes} 
            onNewQuote={startNewQuote} 
            onViewQuote={(q) => { setCurrentQuote(q); setCurrentScreen('hub'); }} 
            onDeleteQuote={deleteQuote}
            showToast={showToast}
          />
        );
      case 'customer':
        return currentQuote && (
          <CustomerForm 
            data={currentQuote.customer}
            onChange={(customer) => setCurrentQuote({ ...currentQuote, customer })}
            onNext={() => {
              saveQuoteToSupabase(currentQuote);
              setCurrentScreen('calculator');
            }}
            onBack={() => {
              saveQuoteToSupabase(currentQuote);
              setCurrentScreen('dashboard');
            }}
          />
        );
      case 'calculator':
        return currentQuote && (
          <Calculator 
            items={currentQuote.items}
            onAddItem={(item) => {
              const updatedItems = [...currentQuote.items, item];
              const updatedQuote = {
                ...currentQuote,
                items: updatedItems,
                totalAmount: updatedItems.reduce((acc, i) => acc + i.total, 0) - currentQuote.discount + currentQuote.adjustment
              };
              setCurrentQuote(updatedQuote);
              saveQuoteToSupabase(updatedQuote);
            }}
            onRemoveItem={(id) => {
              const updatedItems = currentQuote.items.filter(i => i.id !== id);
              const updatedQuote = {
                ...currentQuote,
                items: updatedItems,
                totalAmount: updatedItems.reduce((acc, i) => acc + i.total, 0) - currentQuote.discount + currentQuote.adjustment
              };
              setCurrentQuote(updatedQuote);
              saveQuoteToSupabase(updatedQuote);
            }}
            onUpdateItem={(updatedItem) => {
              const updatedItems = currentQuote.items.map(i => i.id === updatedItem.id ? updatedItem : i);
              const updatedQuote = {
                ...currentQuote,
                items: updatedItems,
                totalAmount: updatedItems.reduce((acc, i) => acc + i.total, 0) - currentQuote.discount + currentQuote.adjustment
              };
              setCurrentQuote(updatedQuote);
              saveQuoteToSupabase(updatedQuote);
            }}
            onNext={() => {
              saveQuoteToSupabase(currentQuote);
              setCurrentScreen('summary');
            }}
            onBack={() => {
              saveQuoteToSupabase(currentQuote);
              setCurrentScreen('customer');
            }}
          />
        );
      case 'summary':
        return currentQuote && (
          <Summary 
            quote={currentQuote}
            onUpdateQuote={handleUpdateQuote}
            onFinalize={finalizeQuote}
            onBack={() => {
              saveQuoteToSupabase(currentQuote);
              setCurrentScreen('calculator');
            }}
            onRemoveItem={(id) => {
              const updatedItems = currentQuote.items.filter(i => i.id !== id);
              const updatedQuote = {
                ...currentQuote,
                items: updatedItems,
                totalAmount: updatedItems.reduce((acc, i) => acc + i.total, 0) - currentQuote.discount + currentQuote.adjustment
              };
              setCurrentQuote(updatedQuote);
              saveQuoteToSupabase(updatedQuote);
            }}
          />
        );
      case 'profile':
        return (
          <ProfileSettings 
            userId={user.id} 
            onBack={() => setCurrentScreen('dashboard')} 
            onLogout={handleLogout}
          />
        );
      case 'hub':
        return currentQuote && (
          <ActionHub
            quote={currentQuote}
            onUpdateQuote={async (updated) => {
              await saveQuoteToSupabase(updated);
            }}
            onEdit={() => {
              setCurrentScreen('customer');
            }}
            onBack={() => {
              setCurrentQuote(null);
              setCurrentScreen('dashboard');
            }}
            showToast={showToast}
          />
        );
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col justify-center items-center gap-3">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Carregando OrçaPrático...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      {/* Top Bar */}
      <header className="fixed top-0 w-full z-50 bg-white shadow-sm border-b border-surface-container h-[64px] flex justify-between items-center px-6">
        <div 
          className="flex items-center gap-3 cursor-pointer select-none touch-target" 
          onClick={() => {
            setCurrentQuote(null);
            setCurrentScreen('dashboard');
          }}
        >
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Construction className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">OrçaPrático</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentScreen('profile')}
            className={cn(
              "p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-primary transition-colors touch-target",
              currentScreen === 'profile' && "text-primary bg-blue-50"
            )}
            title="Configurações do Perfil"
          >
            <UserIcon size={22} />
          </button>
          <button 
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors touch-target"
            title="Sair"
          >
            <LogOut size={22} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-[64px] pb-[80px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-white border-t border-surface-container shadow-2xl md:hidden">
        <div className="flex justify-around items-center h-[80px] pb-safe px-2">
          <NavBtn 
            icon={<LayoutDashboard size={22} />} 
            label="Início" 
            active={currentScreen === 'dashboard'} 
            onClick={() => {
              setCurrentQuote(null);
              setCurrentScreen('dashboard');
            }} 
          />
          <NavBtn 
            icon={<Users size={22} />} 
            label="Clientes" 
            active={currentScreen === 'customer'} 
            onClick={() => currentQuote && setCurrentScreen('customer')} 
            disabled={!currentQuote}
          />
          <NavBtn 
            icon={<CalcIcon size={22} />} 
            label="Calcular" 
            active={currentScreen === 'calculator'} 
            onClick={() => currentQuote && setCurrentScreen('calculator')} 
            disabled={!currentQuote}
          />
          <NavBtn 
            icon={<SummaryIcon size={22} />} 
            label="Resumo" 
            active={currentScreen === 'summary'} 
            onClick={() => currentQuote && setCurrentScreen('summary')} 
            disabled={!currentQuote}
          />
        </div>
      </nav>

      {/* Toast Notification overlay */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-800 text-xs font-bold uppercase tracking-wider whitespace-nowrap"
          >
            <CheckCircle2 size={16} className="text-emerald-500 animate-pulse" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface NavBtnProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function NavBtn({ icon, label, active, onClick, disabled }: NavBtnProps) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 flex-1 h-full transition-all relative",
        active ? "text-primary" : "text-slate-400",
        disabled && "opacity-20 cursor-not-allowed"
      )}
    >
      <div className={cn(
        "flex items-center justify-center transition-all duration-300",
        active && "scale-110"
      )}>
        {icon}
      </div>
      <span className={cn(
        "text-[10px] font-bold uppercase tracking-widest transition-all", 
        active ? "opacity-100" : "opacity-40"
      )}>
        {label}
      </span>
      {active && (
        <motion.div 
          layoutId="nav-indicator"
          className="absolute top-0 w-8 h-1 bg-primary rounded-b-full"
        />
      )}
    </button>
  );
}
