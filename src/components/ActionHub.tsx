import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  FileText, 
  Send, 
  Edit, 
  CheckCircle2, 
  Clock, 
  Building, 
  DollarSign, 
  Calendar, 
  ChevronDown, 
  MessageSquare, 
  Mail, 
  Loader2,
  Check
} from 'lucide-react';
import { Quote, QuoteStatus } from '../types';
import { cn } from '../lib/utils';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import PdfTemplate from './PdfTemplate';

interface ActionHubProps {
  quote: Quote;
  onUpdateQuote: (quote: Quote) => Promise<void>;
  onEdit: () => void;
  onBack: () => void;
  showToast: (message: string) => void;
}

export default function ActionHub({ quote, onUpdateQuote, onEdit, onBack, showToast }: ActionHubProps) {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Status Ledger States
  const [status, setStatus] = useState<QuoteStatus>(quote.status);
  const [foiPago, setFoiPago] = useState<boolean>(!!quote.foiPago);
  const [formaPagamento, setFormaPagamento] = useState<string>(quote.formaPagamento || 'Pix');
  const [dataPagamento, setDataPagamento] = useState<string>(quote.dataPagamento || new Date().toISOString().split('T')[0]);
  const [isSavingLedger, setIsSavingLedger] = useState(false);

  // Sync state if props change
  useEffect(() => {
    setStatus(quote.status);
    setFoiPago(!!quote.foiPago);
    setFormaPagamento(quote.formaPagamento || 'Pix');
    setDataPagamento(quote.dataPagamento || new Date().toISOString().split('T')[0]);
  }, [quote]);

  const subtotal = quote.items.reduce((acc, item) => acc + item.total, 0);
  const total = subtotal - quote.discount + quote.adjustment;

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
          pixelRatio: 2,
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
      showToast("PDF baixado com sucesso");
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Houve um erro ao gerar o PDF. Tente novamente.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleShareWhatsApp = () => {
    const formattedTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total);
    const docNumber = quote.numeroSequencial || 'N/A';
    const cleanPhone = quote.customer.phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    
    const message = `Olá, ${quote.customer.name}! Segue o orçamento referente ao serviço solicitado.\n\n📄 *Orçamento Nº:* ${docNumber}\n💰 *Valor Total:* ${formattedTotal}\n📅 *Data:* ${quote.date}\n\nEntre em contato caso tenha alguma dúvida ou para aprovar o serviço. Obrigado!`;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    setShowShareMenu(false);
  };

  const handleShareEmail = () => {
    const formattedTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total);
    const docNumber = quote.numeroSequencial || 'N/A';
    const subject = `Orçamento Nº ${docNumber} - ${quote.professionalName}`;
    const body = `Olá, ${quote.customer.name}!\n\nSegue o orçamento referente ao serviço solicitado.\n\nOrçamento Nº: ${docNumber}\nValor Total: ${formattedTotal}\nData de Emissão: ${quote.date}\n\nFicamos à disposição para esclarecer qualquer dúvida.\n\nAtenciosamente,\n${quote.professionalName}`;
    
    const mailtoUrl = `mailto:${quote.customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    setShowShareMenu(false);
  };

  const handleSaveLedger = async () => {
    setIsSavingLedger(true);
    try {
      const updatedQuote: Quote = {
        ...quote,
        status,
        foiPago,
        formaPagamento: foiPago ? formaPagamento : undefined,
        dataPagamento: foiPago ? dataPagamento : undefined,
      };
      await onUpdateQuote(updatedQuote);
      showToast("Status financeiro atualizado");
    } catch (err) {
      console.error(err);
      alert("Houve um erro ao salvar as alterações.");
    } finally {
      setIsSavingLedger(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 pb-24 max-w-4xl mx-auto w-full font-sans animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-400 shadow-sm hover:text-primary transition-colors touch-target"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Painel do Orçamento</h2>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-0.5">Gestão e Acompanhamento</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider shadow-sm",
            status === QuoteStatus.APPROVED ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
            status === QuoteStatus.SENT ? "bg-blue-50 text-blue-600 border border-blue-100" :
            "bg-slate-100 text-slate-600 border border-slate-200"
          )}>
            {status === QuoteStatus.APPROVED ? "Concluído" : status}
          </span>
          {foiPago && (
            <span className="px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500 text-white shadow-sm flex items-center gap-1.5">
              <Check size={14} strokeWidth={3} /> Pago
            </span>
          )}
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Summary Grid */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Card: Client & Professional Summary */}
          <div className="bg-white rounded-[28px] border border-slate-100 shadow-xl shadow-slate-100 p-6 flex flex-col gap-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                  {quote.professionalLogoUrl ? (
                    <img src={quote.professionalLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building className="text-slate-300" size={28} />
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Orçamento</span>
                  <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">{quote.numeroSequencial || "Rascunho"}</h3>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Emissão</span>
                <span className="text-sm font-bold text-slate-700">{quote.date}</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Cliente</span>
                  <p className="font-extrabold text-slate-800 text-base leading-snug">{quote.customer.name}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Endereço da Obra</span>
                  <p className="text-sm font-bold text-slate-500 leading-relaxed">{quote.customer.address || "Não informado"}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">WhatsApp</span>
                    <p className="text-sm font-bold text-slate-700">{quote.customer.phone || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">E-mail</span>
                    <p className="text-sm font-bold text-slate-700 truncate">{quote.customer.email || "N/A"}</p>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Data Estimada de Início</span>
                  <p className="text-sm font-bold text-slate-700">{quote.customer.startDate ? new Date(quote.customer.startDate).toLocaleDateString('pt-BR') : "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6 grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Prazo de Execução</span>
                <p className="text-sm font-bold text-slate-700">{quote.executionTerm}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Forma de Pagamento</span>
                <p className="text-sm font-bold text-slate-700">{quote.paymentTerms}</p>
              </div>
              <div className="col-span-2 md:col-span-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Responsável</span>
                <p className="text-sm font-bold text-slate-700">{quote.professionalName}</p>
              </div>
            </div>
          </div>

          {/* Card: Items & Totals */}
          <div className="bg-white rounded-[28px] border border-slate-100 shadow-xl shadow-slate-100 p-6 flex flex-col gap-4">
            <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Resumo dos Serviços</h4>
            <div className="divide-y divide-slate-50 max-h-[250px] overflow-y-auto pr-1">
              {quote.items.map((item) => (
                <div key={item.id} className="py-3.5 flex justify-between items-center gap-4 first:pt-0 last:pb-0">
                  <div className="flex flex-col min-w-0">
                    <span className="font-extrabold text-slate-700 text-sm truncate">{item.description}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                      {item.type === 'fixed' ? 'Valor Fixo' : `${item.area?.toFixed(2)} m² × R$ ${item.unitPrice?.toFixed(2)}`}
                    </span>
                  </div>
                  <span className="font-bold text-slate-800 text-sm whitespace-nowrap">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-4 flex flex-col gap-2 bg-slate-50/50 -mx-6 -mb-6 p-6 rounded-b-[28px]">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>Subtotal</span>
                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</span>
              </div>
              {quote.discount > 0 && (
                <div className="flex justify-between items-center text-xs font-bold text-red-500 uppercase tracking-wider">
                  <span>Desconto</span>
                  <span>-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.discount)}</span>
                </div>
              )}
              {quote.adjustment > 0 && (
                <div className="flex justify-between items-center text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  <span>Acréscimo</span>
                  <span>+{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.adjustment)}</span>
                </div>
              )}
              <div className="flex justify-between items-end border-t border-slate-200/50 pt-3 mt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total do Orçamento</span>
                <span className="text-2xl font-black text-slate-800 tracking-tight">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Action Toolbar & Status Ledger */}
        <div className="flex flex-col gap-6">
          {/* Action Toolbar */}
          <div className="bg-white rounded-[28px] border border-slate-100 shadow-xl shadow-slate-100 p-6 flex flex-col gap-3">
            <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1">Ações Rápidas</h4>
            
            {/* Download PDF */}
            <button
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-md transition-colors disabled:opacity-50 touch-target"
            >
              {isGeneratingPDF ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <FileText size={16} />
              )}
              Baixar PDF
            </button>

            {/* Share Menu */}
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="w-full h-12 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-sm transition-colors touch-target"
              >
                <Send size={16} />
                Enviar para Cliente
                <ChevronDown size={14} className={cn("transition-transform duration-200", showShareMenu && "rotate-180")} />
              </button>

              <AnimatePresence>
                {showShareMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute z-10 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl p-2 flex flex-col gap-1"
                  >
                    <button
                      onClick={handleShareWhatsApp}
                      className="w-full h-10 px-4 hover:bg-emerald-50 text-emerald-600 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors text-left"
                    >
                      <MessageSquare size={16} />
                      WhatsApp Link
                    </button>
                    <button
                      onClick={handleShareEmail}
                      className="w-full h-10 px-4 hover:bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors text-left"
                    >
                      <Mail size={16} />
                      E-mail
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Edit Button */}
            <button
              onClick={onEdit}
              className="w-full h-12 bg-primary/10 hover:bg-primary/15 text-primary rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-colors touch-target"
            >
              <Edit size={16} />
              Alterar / Editar
            </button>
          </div>

          {/* Financial Status Ledger */}
          <div className="bg-white rounded-[28px] border border-slate-100 shadow-xl shadow-slate-100 p-6 flex flex-col gap-6">
            <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Controle Financeiro</h4>
            
            {/* Status Toggle Switch */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex flex-col">
                <span className="text-sm font-extrabold text-slate-800">Status do Projeto</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                  {status === QuoteStatus.APPROVED ? "Concluído" : "Pendente"}
                </span>
              </div>
              <button
                onClick={() => setStatus(status === QuoteStatus.APPROVED ? QuoteStatus.SENT : QuoteStatus.APPROVED)}
                className={cn(
                  "w-12 h-6 rounded-full p-1 transition-colors duration-200 outline-none flex items-center",
                  status === QuoteStatus.APPROVED ? "bg-emerald-500" : "bg-slate-200"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200",
                    status === QuoteStatus.APPROVED ? "translate-x-6" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {/* Payment Trigger Checkbox */}
            <div className="flex flex-col gap-4">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={foiPago}
                  onChange={(e) => setFoiPago(e.target.checked)}
                  className="w-5 h-5 rounded-md border-slate-300 text-emerald-500 focus:ring-emerald-500 transition-colors"
                />
                <span className="text-sm font-extrabold text-slate-800">Pagamento Realizado</span>
              </label>

              {/* Smooth Reveal Sub-form */}
              <div
                className={cn(
                  "grid transition-all duration-300 ease-in-out",
                  foiPago ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 overflow-hidden pointer-events-none"
                )}
              >
                <div className="overflow-hidden">
                  <div className="pt-4 flex flex-col gap-4 border-t border-slate-100 mt-2">
                    {/* Forma de Pagamento */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Forma de Pagamento</label>
                      <select
                        name="Forma de Pagamento"
                        value={formaPagamento}
                        onChange={(e) => setFormaPagamento(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-primary text-sm font-bold text-slate-700"
                      >
                        <option value="Pix">Pix</option>
                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                        <option value="Cartão de Débito">Cartão de Débito</option>
                        <option value="Boleto">Boleto</option>
                        <option value="Dinheiro">Dinheiro</option>
                      </select>
                    </div>

                    {/* Data do Pagamento */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Data do Pagamento</label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="date"
                          value={dataPagamento}
                          onChange={(e) => setDataPagamento(e.target.value)}
                          className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-primary text-sm font-bold text-slate-700"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveLedger}
              disabled={isSavingLedger}
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 transition-colors disabled:opacity-50 touch-target"
            >
              {isSavingLedger ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Check size={16} strokeWidth={3} />
              )}
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>

      {/* Hidden PDF Template Container */}
      <div className="absolute left-[-9999px] top-0">
        <PdfTemplate ref={pdfRef} quote={quote} />
      </div>
    </div>
  );
}
