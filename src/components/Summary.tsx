import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Trash2, 
  FileText, 
  Minus, 
  Plus,
  AlertCircle
} from 'lucide-react';
import { Quote, QuoteStatus } from '../types';
import { cn } from '../lib/utils';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import PdfTemplate from './PdfTemplate';

interface SummaryProps {
  quote: Quote;
  onUpdateQuote: (quote: Quote) => void;
  onFinalize: () => void;
  onBack: () => void;
  onRemoveItem: (id: string) => void;
}

export default function Summary({ quote, onUpdateQuote, onFinalize, onBack, onRemoveItem }: SummaryProps) {
  const subtotal = quote.items.reduce((acc, item) => acc + item.total, 0);
  const total = subtotal - quote.discount + quote.adjustment;

  const pdfRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleGeneratePDF = async () => {
    if (!pdfRef.current) return;
    
    setIsGeneratingPDF(true);
    try {
      const pages = pdfRef.current.querySelectorAll('.pdf-page');
      if (pages.length === 0) return;
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i] as HTMLElement;
        const imgData = await toPng(pageEl, {
          quality: 1.0,
          pixelRatio: 2, // high quality
          cacheBust: true,
          width: 794,
          height: 1123
        });
        
        if (i > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }
      
      pdf.save(`Orcamento_${quote.customer.name.replace(/\s/g, '_')}.pdf`);
      
      onFinalize();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Houve um erro ao gerar o PDF. Tente novamente.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="flex flex-col gap-6 p-6 pb-40 max-w-3xl mx-auto w-full font-sans"
    >
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-400 shadow-sm hover:text-primary transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Revisão Final</h2>
      </div>

      <p className="text-slate-500 text-sm font-medium">
        Revise os itens e adicione ajustes finais antes de gerar o documento PDF.
      </p>

      {/* Items List */}
      <section className="flex flex-col gap-4">
        <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-2">Serviços Adicionados</h3>
        <div className="flex flex-col gap-3">
          {quote.items.map((item) => (
            <div 
              key={item.id}
              className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg shadow-slate-50"
            >
              <div className="flex flex-col">
                <span className="font-extrabold text-slate-800">{item.description}</span>
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                  {item.type === 'fixed' ? (
                    <>
                      <span className="text-emerald-500">Valor Fixo</span>
                      {item.fixedTerm && (
                        <>
                          <div className="w-1 h-1 rounded-full bg-slate-200" />
                          <span>Prazo: {item.fixedTerm}</span>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <span>{(item.area || 0).toFixed(2)} m²</span>
                      <div className="w-1 h-1 rounded-full bg-slate-200" />
                      <span>R$ {(item.unitPrice || 0).toFixed(2)}/m²</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                <span className="text-xl font-black text-slate-900 tracking-tight">
                  R$ {item.total.toFixed(2)}
                </span>
                <button 
                  onClick={() => onRemoveItem(item.id)}
                  className="p-2.5 text-slate-300 hover:text-error hover:bg-error-container rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Adjustments, Professional Info & Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-8">
          <section className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-2xl shadow-slate-200 flex flex-col gap-6">
            <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Informações do Profissional</h3>
            <div className="flex flex-col gap-5">
              <div className="space-y-1.5 transition-all group">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Responsável / Empresa</label>
                <input
                  type="text"
                  value={quote.professionalName}
                  onChange={(e) => onUpdateQuote({ ...quote, professionalName: e.target.value })}
                  className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 transition-all group">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">CPF / CNPJ</label>
                  <input
                    type="text"
                    value={quote.professionalTaxId}
                    onChange={(e) => onUpdateQuote({ ...quote, professionalTaxId: e.target.value })}
                    className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                  />
                </div>
                <div className="space-y-1.5 transition-all group">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">WhatsApp</label>
                  <input
                    type="text"
                    value={quote.professionalPhone}
                    onChange={(e) => onUpdateQuote({ ...quote, professionalPhone: e.target.value })}
                    className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-2xl shadow-slate-200 flex flex-col gap-6">
            <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Condições de Venda</h3>
            
            <div className="flex flex-col gap-5">
              <div className="space-y-1.5 transition-all group">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Prazo de Execução</label>
                <input
                  type="text"
                  value={quote.executionTerm}
                  onChange={(e) => onUpdateQuote({ ...quote, executionTerm: e.target.value })}
                  placeholder="Ex: 5 dias úteis"
                  className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-300 font-medium"
                />
              </div>

              <div className="space-y-1.5 transition-all group">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Formas de Pagamento</label>
                <input
                  type="text"
                  value={quote.paymentTerms}
                  onChange={(e) => onUpdateQuote({ ...quote, paymentTerms: e.target.value })}
                  placeholder="Ex: 50% entrada + 50% final"
                  className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-300 font-medium"
                />
              </div>
            </div>

            <div className="flex flex-col gap-5 pt-4 border-t border-slate-50">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 transition-all group">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Desconto (R$)</label>
                  <div className="relative">
                    <Minus size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-error" />
                    <input
                      type="number"
                      value={quote.discount}
                      onChange={(e) => onUpdateQuote({ ...quote, discount: parseFloat(e.target.value) || 0 })}
                      placeholder="0,00"
                      className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-300 font-bold text-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 transition-all group">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Acréscimo (R$)</label>
                  <div className="relative">
                    <Plus size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                    <input
                      type="number"
                      value={quote.adjustment}
                      onChange={(e) => onUpdateQuote({ ...quote, adjustment: parseFloat(e.target.value) || 0 })}
                      placeholder="0,00"
                      className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-300 font-bold text-slate-700"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-1.5 px-1">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
              <AlertCircle size={14} /> Termos e Observações
            </label>
            <textarea
              rows={4}
              value={quote.notes}
              onChange={(e) => onUpdateQuote({ ...quote, notes: e.target.value })}
              placeholder="Ex: Material por conta do cliente, validade da proposta de 10 dias úteis..."
              className="w-full p-6 rounded-2xl bg-white border border-slate-100 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-medium text-slate-600"
            />
          </section>
        </div>

        {/* Final Total Summary */}
        <div className="flex flex-col gap-6 sticky top-4">
          <section className="bg-slate-900 border border-slate-800 rounded-[40px] p-10 shadow-2xl shadow-slate-300 flex flex-col gap-6 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
             
             <div className="flex justify-between items-center opacity-60 text-xs font-bold uppercase tracking-widest">
               <span>Subtotal Bruto</span>
               <span>R$ {subtotal.toFixed(2)}</span>
             </div>
             
             {quote.discount > 0 && (
               <div className="flex justify-between items-center text-red-400 text-xs font-bold uppercase tracking-widest">
                 <span>Cupons/Descontos</span>
                 <span>- R$ {quote.discount.toFixed(2)}</span>
               </div>
             )}
             
             {quote.adjustment > 0 && (
               <div className="flex justify-between items-center text-emerald-400 text-xs font-bold uppercase tracking-widest">
                 <span>Taxas Extras</span>
                 <span>+ R$ {quote.adjustment.toFixed(2)}</span>
               </div>
             )}
             
             <div className="pt-8 border-t border-white/10 flex flex-col items-center gap-2">
               <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Valor do Orçamento</span>
               <span className="text-5xl font-black tracking-tighter">
                 {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
               </span>
             </div>
          </section>

          <button
            onClick={handleGeneratePDF}
            disabled={isGeneratingPDF}
            className="w-full h-20 bg-emerald-500 text-white rounded-[32px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-emerald-200 active:scale-95 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText size={22} className={isGeneratingPDF ? "animate-pulse" : ""} />
            {isGeneratingPDF ? 'Gerando PDF...' : 'Gerar PDF para WhatsApp'}
          </button>
          <p className="text-center text-[10px] uppercase font-bold tracking-widest text-slate-400 px-4">
            Validade sugerida desta proposta: 10 dias úteis
          </p>
        </div>
      </div>

      {/* Hidden PDF Template Container */}
      <div className="absolute left-[-9999px] top-0">
        <PdfTemplate ref={pdfRef} quote={quote} />
      </div>
    </motion.div>
  );
}
