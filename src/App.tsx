/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlusCircle, 
  LayoutDashboard, 
  Users, 
  Calculator as CalcIcon, 
  FileText as SummaryIcon,
  Construction,
  Bell
} from 'lucide-react';
import { Quote, QuoteStatus, QuoteItem, CustomerInfo } from './types';
import Dashboard from './components/Dashboard';
import CustomerForm from './components/CustomerForm';
import Calculator from './components/Calculator';
import Summary from './components/Summary';
import { cn } from './lib/utils';

type Screen = 'dashboard' | 'customer' | 'calculator' | 'summary';

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

  // Load quotes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('orcapratico_quotes');
    if (saved) {
      try {
        setQuotes(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading quotes', e);
      }
    }
  }, []);

  // Save quotes to localStorage
  useEffect(() => {
    localStorage.setItem('orcapratico_quotes', JSON.stringify(quotes));
  }, [quotes]);

  const startNewQuote = () => {
    const newQuote: Quote = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleDateString('pt-BR'),
      customer: { ...EMPTY_CUSTOMER },
      items: [],
      discount: 0,
      adjustment: 0,
      notes: '',
      executionTerm: 'A combinar',
      paymentTerms: '50% de sinal + 50% na entrega.',
      professionalName: 'OrçaPrático Serviços',
      professionalTaxId: '12.345.678/0001-90',
      professionalPhone: '(11) 95492-5944',
      status: QuoteStatus.DRAFT,
      totalAmount: 0,
    };
    setCurrentQuote(newQuote);
    setCurrentScreen('customer');
  };

  const handleUpdateQuote = (updated: Quote) => {
    setCurrentQuote(updated);
  };

  const finalizeQuote = () => {
    if (!currentQuote) return;
    
    const finalized = { 
      ...currentQuote, 
      status: QuoteStatus.SENT,
      totalAmount: currentQuote.items.reduce((acc, i) => acc + i.total, 0) - currentQuote.discount + currentQuote.adjustment
    };
    
    setQuotes(prev => {
      const exists = prev.find(q => q.id === finalized.id);
      if (exists) {
        return prev.map(q => q.id === finalized.id ? finalized : q);
      }
      return [finalized, ...prev];
    });
    
    setCurrentScreen('dashboard');
    setCurrentQuote(null);
  };

  const deleteQuote = (id: string) => {
    setQuotes(prev => prev.filter(q => q.id !== id));
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return (
          <Dashboard 
            quotes={quotes} 
            onNewQuote={startNewQuote} 
            onViewQuote={(q) => { setCurrentQuote(q); setCurrentScreen('summary'); }} 
          />
        );
      case 'customer':
        return currentQuote && (
          <CustomerForm 
            data={currentQuote.customer}
            onChange={(customer) => setCurrentQuote({ ...currentQuote, customer })}
            onNext={() => setCurrentScreen('calculator')}
            onBack={() => setCurrentScreen('dashboard')}
          />
        );
      case 'calculator':
        return currentQuote && (
          <Calculator 
            items={currentQuote.items}
            onAddItem={(item) => setCurrentQuote({ ...currentQuote, items: [...currentQuote.items, item] })}
            onRemoveItem={(id) => setCurrentQuote({ ...currentQuote, items: currentQuote.items.filter(i => i.id !== id) })}
            onNext={() => setCurrentScreen('summary')}
            onBack={() => setCurrentScreen('customer')}
          />
        );
      case 'summary':
        return currentQuote && (
          <Summary 
            quote={currentQuote}
            onUpdateQuote={handleUpdateQuote}
            onFinalize={finalizeQuote}
            onBack={() => setCurrentScreen('calculator')}
            onRemoveItem={(id) => setCurrentQuote({ ...currentQuote, items: currentQuote.items.filter(i => i.id !== id) })}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      {/* Top Bar */}
      <header className="fixed top-0 w-full z-50 bg-white shadow-sm border-b border-surface-container h-[64px] flex justify-between items-center px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Construction className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">OrçaPrático</h1>
        </div>
        <button className="p-2 rounded-full hover:bg-slate-50 text-slate-400 transition-colors">
          <Bell size={24} />
        </button>
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
            onClick={() => setCurrentScreen('dashboard')} 
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

// Replacement for Lucide Icon not found in previous context
function DescriptionIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

