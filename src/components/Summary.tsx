import React from 'react';
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

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    const primaryNavy = [11, 38, 52];
    const accentTeal = [6, 214, 160];
    const slateGray = [100, 116, 139];
    const softGray = [241, 245, 249];
    const ghostWhite = [248, 250, 252];
    const pureWhite = [255, 255, 255];

    // Helpers
    const drawCircleIcon = (x: number, y: number, char: string, bgColor = primaryNavy) => {
      doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      doc.circle(x, y, 4, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.text(char, x - 1.2, y + 1);
    };

    // --- TOP HEADER ---
    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.rect(0, 0, 210, 50, 'F');
    
    // Logo
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.text('OrçaPrático', 15, 22);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('ORÇAMENTO DE SERVIÇOS', 15, 28);
    
    // Floating Info Card
    doc.setFillColor(pureWhite[0], pureWhite[1], pureWhite[2]);
    doc.roundedRect(15, 35, 180, 25, 4, 4, 'F');
    doc.setDrawColor(softGray[0], softGray[1], softGray[2]);
    doc.roundedRect(15, 35, 180, 25, 4, 4, 'D');

    doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('Nº DO ORÇAMENTO', 30, 48);
    doc.text('DATA DE EMISSÃO', 105, 48);
    
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.setFontSize(11);
    doc.text('001/2026', 30, 55);
    doc.text(quote.date, 105, 55);

    // Calendar Icon decoration on card
    doc.setDrawColor(accentTeal[0], accentTeal[1], accentTeal[2]);
    doc.roundedRect(170, 43, 10, 10, 2, 2, 'D');

    // --- SECTIONS ---
    let y = 75;

    // 1. DADOS DO CLIENTE
    drawCircleIcon(15, y - 2, 'U');
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO CLIENTE', 25, y);

    y += 10;
    doc.setFillColor(ghostWhite[0], ghostWhite[1], ghostWhite[2]);
    doc.roundedRect(15, y, 180, 40, 4, 4, 'F');
    
    doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Cliente:', 25, y + 10);
    doc.text('Telefone:', 25, y + 20);
    doc.text('Endereço:', 25, y + 30);
    
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(quote.customer.name, 50, y + 10);
    doc.text(quote.customer.phone, 50, y + 20);
    doc.text(quote.customer.address, 50, y + 30);

    y += 55;

    // 2. CRONOGRAMA
    drawCircleIcon(15, y - 2, 'C');
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CRONOGRAMA ESTIMADO', 25, y);

    y += 10;
    doc.setFillColor(235, 251, 248); // Mockup light teal
    doc.roundedRect(15, y, 180, 45, 4, 4, 'F');
    
    doc.setTextColor(accentTeal[0], accentTeal[1], accentTeal[2]);
    doc.circle(25, y + 12, 3, 'F');
    doc.circle(25, y + 26, 3, 'F');
    
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Previsão de Início:', 35, y + 13);
    doc.text('Prazo de Execução:', 35, y + 27);
    
    doc.setFont('helvetica', 'bold');
    doc.text(quote.customer.startDate || 'A definir', 110, y + 13);
    doc.text(quote.executionTerm || 'A combinar', 110, y + 27);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('*Válido após aprovação e liberação do local.', 35, y + 38);

    y += 60;

    // 3. ESCOPO DOS SERVIÇOS
    drawCircleIcon(15, y - 2, 'S', accentTeal);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ESCOPO DOS SERVIÇOS E VALORES', 25, y);
    
    y += 8;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
    doc.text('Abaixo estão detalhados os serviços solicitados e metragens para execução.', 15, y);

    y += 10;
    quote.items.forEach((item, idx) => {
      if (y > 240) { doc.addPage(); y = 20; }
      
      doc.setDrawColor(softGray[0], softGray[1], softGray[2]);
      doc.roundedRect(15, y, 180, 30, 4, 4, 'D');
      
      // Mini Icon Bubble
      doc.setFillColor(ghostWhite[0], ghostWhite[1], ghostWhite[2]);
      doc.circle(28, y + 12, 6, 'F');
      doc.setTextColor(accentTeal[0], accentTeal[1], accentTeal[2]);
      doc.setFontSize(6);
      doc.text('W', 26.5, y + 13.5);

      doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(item.description, 40, y + 8);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
      doc.text('MEDIDA/QTD', 40, y + 18);
      doc.text('VALOR TOTAL', 150, y + 18);
      
      doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`${item.area.toFixed(2)} m²`, 40, y + 25);
      doc.text(`R$ ${item.total.toFixed(2)}`, 150, y + 25);
      
      y += 35;
    });

    // 4. CONDIÇÕES DE PAGAMENTO
    if (y > 245) { doc.addPage(); y = 30; }
    drawCircleIcon(15, y - 2, 'P', accentTeal);
    doc.text('CONDIÇÕES DE PAGAMENTO', 25, y);
    y += 8;
    doc.setFillColor(ghostWhite[0], ghostWhite[1], ghostWhite[2]);
    doc.roundedRect(15, y, 180, 40, 4, 4, 'F');
    
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('• Opção Única:', 25, y + 12);
    doc.setFont('helvetica', 'normal');
    const payLines = doc.splitTextToSize(quote.paymentTerms || 'A combinar conforme negociação.', 160);
    doc.text(payLines, 30, y + 20);

    y += 55;

    // 5. TOTALS
    const totalsY = y;
    doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
    doc.setFontSize(9);
    doc.text('SUBTOTAL DOS SERVIÇOS', 15, totalsY);
    doc.text('ADICIONAIS / ACRÉSCIMOS', 15, totalsY + 12);
    
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(`R$ ${subtotal.toFixed(2)}`, 195, totalsY, { align: 'right' });
    const adjTotalRes = quote.adjustment - quote.discount;
    doc.text(`R$ ${Math.abs(adjTotalRes).toFixed(2)}`, 195, totalsY + 12, { align: 'right' });

    y += 20;
    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.roundedRect(15, y, 180, 20, 2, 2, 'F');
    doc.setFillColor(accentTeal[0], accentTeal[1], accentTeal[2]);
    doc.roundedRect(120, y + 4, 70, 12, 2, 2, 'F');
    
    doc.setTextColor(pureWhite[0], pureWhite[1], pureWhite[2]);
    doc.setFontSize(11);
    doc.text('TOTAL GERAL', 25, y + 12.5);
    doc.setFontSize(16);
    doc.text(`R$ ${total.toFixed(2)}`, 185, y + 12.5, { align: 'right' });

    y += 35;

    // 6. TERMS
    if (y > 240) { doc.addPage(); y = 30; }
    drawCircleIcon(15, y - 2, 'T');
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.setFontSize(10);
    doc.text('TERMOS E OBSERVAÇÕES IMPORTANTES', 25, y);
    
    y += 10;
    doc.setTextColor(accentTeal[0], accentTeal[1], accentTeal[2]);
    doc.circle(20, y + 1, 2, 'F'); doc.circle(20, y + 9, 2, 'F');
    
    doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
    doc.setFontSize(8);
    doc.text('Validade desta Proposta: Válida por 15 dias a partir da emissão.', 25, y + 2);
    doc.text('Insumos e Materiais: Materiais necessários não inclusos, salvo acordo.', 25, y + 10);

    y += 25;

    // 7. ACEITE
    drawCircleIcon(15, y - 2, 'A', accentTeal);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text('ACEITE DO ORÇAMENTO', 25, y); y += 8;
    doc.setFontSize(8);
    doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
    doc.text('Para aprovação e agendamento, por favor assine abaixo.', 15, y);
    
    y += 25;
    doc.setLineWidth(0.2);
    doc.line(15, y, 90, y);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(110, y, 195, y);
    doc.setLineDashPattern([], 0);
    
    doc.setTextColor(accentTeal[0], accentTeal[1], accentTeal[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(quote.professionalName, 15, y + 8);
    doc.text(`${quote.customer.name} (Cliente)`, 110, y + 8);
    
    doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`Responsável pelo orçamento`, 15, y + 13);
    doc.text(`Data do aceite: ................................................................`, 15, y + 22);

    // Footer
    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.rect(0, 285, 210, 12, 'F');
    doc.setTextColor(pureWhite[0], pureWhite[1], pureWhite[2]);
    doc.setFontSize(7);
    doc.text('Qualidade e praticidade para seu projeto. (11) 95492-5944', 105, 292, { align: 'center' });

    doc.save(`Orcamento_${quote.customer.name.replace(/\s/g, '_')}.pdf`);
    onFinalize();
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
                  <span>{item.area.toFixed(2)} m²</span>
                  <div className="w-1 h-1 rounded-full bg-slate-200" />
                  <span>R$ {item.unitPrice.toFixed(2)}/m²</span>
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
            className="w-full h-20 bg-emerald-500 text-white rounded-[32px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-emerald-200 active:scale-95 transition-all text-sm"
          >
            <FileText size={22} />
            Gerar PDF para WhatsApp
          </button>
          <p className="text-center text-[10px] uppercase font-bold tracking-widest text-slate-400 px-4">
            Validade sugerida desta proposta: 10 dias úteis
          </p>
        </div>
      </div>
    </motion.div>
  );
}
