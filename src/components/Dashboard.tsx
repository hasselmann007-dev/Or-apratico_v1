import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlusCircle, 
  History, 
  Settings, 
  Home, 
  Calculator as CalcIcon, 
  Users, 
  ChevronRight, 
  CheckCircle2, 
  Clock,
  LayoutDashboard,
  Trash2,
  Loader2,
  X
} from 'lucide-react';
import { Quote, QuoteStatus } from '../types';
import { cn } from '../lib/utils';

interface DashboardProps {
  quotes: Quote[];
  onNewQuote: () => void;
  onViewQuote: (quote: Quote) => void;
  onDeleteQuote: (id: string) => Promise<void>;
  showToast: (message: string) => void;
}

export default function Dashboard({ quotes, onNewQuote, onViewQuote, onDeleteQuote, showToast }: DashboardProps) {
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const approvedCount = quotes.filter(q => q.status === QuoteStatus.APPROVED).length;
  const pendingCount = quotes.filter(q => q.status !== QuoteStatus.APPROVED).length;

  const handleConfirmDelete = (e: React.MouseEvent, quote: Quote) => {
    e.stopPropagation();
    setQuoteToDelete(quote);
  };

  const executeDelete = async () => {
    if (!quoteToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteQuote(quoteToDelete.id);
      showToast("Orçamento excluído com sucesso");
      setQuoteToDelete(null);
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir o orçamento.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 p-6 pb-24 max-w-3xl mx-auto w-full font-sans">
      {/* Hero Action */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={onNewQuote}
        className="w-full bg-white rounded-3xl p-10 flex flex-col items-center justify-center gap-4 shadow-2xl shadow-slate-200 border border-slate-100 relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white opacity-50 transition-opacity" />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200 group-hover:scale-110 transition-transform duration-300">
            <PlusCircle size={32} strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Novo Orçamento</h2>
          <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">Criar estimativa rápida</p>
        </div>
      </motion.button>

      {/* Stats Bento */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xl shadow-slate-100 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span>Aprovados</span>
          </div>
          <span className="text-4xl font-black text-slate-800">{approvedCount}</span>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xl shadow-slate-100 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            <Clock size={14} className="text-orange-400" />
            <span>Pendentes</span>
          </div>
          <span className="text-4xl font-black text-slate-800">{pendingCount}</span>
        </div>
      </div>

      {/* Recent Quotes */}
      <section className="flex flex-col gap-6">
        <div className="flex justify-between items-end px-2">
          <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Histórico Recente</h3>
          <button className="text-xs font-bold uppercase tracking-widest text-primary hover:opacity-70 transition-opacity">Ver todos</button>
        </div>

        <div className="flex flex-col gap-4">
          {quotes.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <History size={48} className="mx-auto mb-4 text-slate-200" />
              <p className="text-slate-400 font-medium">Nenhum orçamento encontrado</p>
            </div>
          ) : (
            quotes.slice(0, 5).map((quote) => (
              <motion.div
                key={quote.id}
                whileTap={{ scale: 0.99 }}
                onClick={() => onViewQuote(quote)}
                className="bg-white border border-slate-100 rounded-2xl p-5 shadow-lg shadow-slate-50 cursor-pointer hover:shadow-xl transition-all duration-300 flex flex-col gap-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-lg leading-tight">{quote.customer.name || 'Cliente sem nome'}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{quote.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                      quote.status === QuoteStatus.APPROVED ? "bg-emerald-50 text-emerald-600" :
                      quote.status === QuoteStatus.SENT ? "bg-blue-50 text-blue-600" :
                      "bg-slate-50 text-slate-500"
                    )}>
                      {quote.status}
                    </span>
                    <button
                      onClick={(e) => handleConfirmDelete(e, quote)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors duration-200"
                      aria-label="Excluir orçamento"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-50 flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Serviço Principal</span>
                    <span className="text-sm font-bold text-slate-600 truncate max-w-[180px]">
                      {quote.items[0]?.description || 'Sem itens'}
                      {quote.items.length > 1 && ` (+${quote.items.length - 1})`}
                    </span>
                  </div>
                  <span className="text-2xl font-black text-slate-900 tracking-tighter">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.totalAmount)}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {quoteToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[32px] max-w-md w-full p-8 shadow-2xl border border-slate-100 flex flex-col gap-6 relative"
            >
              <button 
                onClick={() => setQuoteToDelete(null)}
                className="absolute right-6 top-6 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                <Trash2 size={24} />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Confirmar Exclusão</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Tem certeza que deseja excluir o orçamento <strong className="text-slate-800 font-bold">{quoteToDelete.numeroSequencial || 'sem número'}</strong>? Esta ação não poderá ser desfeita.
                </p>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setQuoteToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 h-12 rounded-xl border-2 border-slate-100 text-slate-500 font-bold uppercase tracking-widest text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={executeDelete}
                  disabled={isDeleting}
                  className="flex-1 h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-100 transition-colors"
                >
                  {isDeleting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Excluir"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
