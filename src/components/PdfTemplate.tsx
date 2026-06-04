import React, { forwardRef } from 'react';
import { Quote } from '../types';
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  Flag, 
  Wrench, 
  PaintRoller, 
  CreditCard, 
  FileText, 
  PenTool,
  ShieldCheck,
  Mail,
  Building
} from 'lucide-react';

interface PdfTemplateProps {
  quote: Quote;
}

const PdfTemplate = forwardRef<HTMLDivElement, PdfTemplateProps>(({ quote }, ref) => {
  const subtotal = quote.items.reduce((acc, item) => acc + item.total, 0);
  const total = subtotal - quote.discount + quote.adjustment;

  const primaryColor = '#01262d'; // Dark navy/teal
  const accentColor = '#06d6a0'; // Bright teal/green

  // Pagination logic:
  // - Page 1 contains: Header, Customer Info, Cronograma, Table Header, and the first N items (at most 5 items).
  // - Intermediate pages (if any) contain: Compact Header, Table Header, and additional items (at most 8 items).
  // - Final page contains: Page Header (Compact Header), Table Header (if items > 0), remaining items (if any, at most 3 items),
  //   Payment Conditions, Totals block, Terms and Conditions, Acceptance Signatures, and Page Footer.
  // - If the remaining items count is greater than 3, make the page a regular page (holds up to 8 items) and push the
  //   payment, totals, terms, and signature blocks to a new blank final page.
  const getPages = () => {
    const pages: Array<{
      pageNumber: number;
      type: 'first' | 'intermediate' | 'final';
      items: typeof quote.items;
      showFinalBlocks: boolean;
    }> = [];

    // Optimize: If budget has 1 or 2 items, everything fits on a single page!
    if (quote.items.length <= 2) {
      pages.push({
        pageNumber: 1,
        type: 'first',
        items: quote.items,
        showFinalBlocks: true,
      });
      return pages;
    }

    // Page 1: Up to 5 items
    const firstPageItems = quote.items.slice(0, 5);
    const remainingItemsAfterFirst = quote.items.slice(5);

    pages.push({
      pageNumber: 1,
      type: 'first',
      items: firstPageItems,
      showFinalBlocks: false,
    });

    let currentRemaining = remainingItemsAfterFirst;
    let currentPageNum = 2;

    while (true) {
      if (currentRemaining.length <= 3) {
        // They fit on the final page!
        pages.push({
          pageNumber: currentPageNum,
          type: 'final',
          items: currentRemaining,
          showFinalBlocks: true,
        });
        break;
      } else {
        // More than 3 items remaining.
        // We take up to 8 items for an intermediate page.
        const intermediateItems = currentRemaining.slice(0, 8);
        currentRemaining = currentRemaining.slice(8);

        pages.push({
          pageNumber: currentPageNum,
          type: 'intermediate',
          items: intermediateItems,
          showFinalBlocks: false,
        });
        currentPageNum++;

        // If after taking 8 items, we have 0 left, we need to add a blank final page
        if (currentRemaining.length === 0) {
          pages.push({
            pageNumber: currentPageNum,
            type: 'final',
            items: [],
            showFinalBlocks: true,
          });
          break;
        }
      }
    }

    return pages;
  };

  const pages = getPages();
  const totalPages = pages.length;

  const renderHeader = (pageType: 'first' | 'intermediate' | 'final') => {
    if (pageType === 'first') {
      return (
        <div className="flex h-32 relative mb-6 shrink-0">
          {/* Left Dark Shape */}
          <div 
            className="w-1/2 h-full absolute top-0 left-0"
            style={{ 
              backgroundColor: primaryColor,
              clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0% 100%)' 
            }}
          >
            <div className="p-8 flex flex-col justify-center h-full">
              <div className="flex items-center gap-3">
                {quote.professionalLogoUrl ? (
                  <img 
                    src={quote.professionalLogoUrl} 
                    alt="Logo" 
                    className="w-10 h-10 object-contain bg-white rounded-lg p-1 shrink-0" 
                  />
                ) : (
                  <Building size={32} color={accentColor} strokeWidth={2.5} />
                )}
                <div className="flex flex-col max-w-[220px]">
                  <h1 className="text-lg font-bold text-white tracking-tight leading-tight truncate">
                    {quote.professionalName || (
                      <>Orça<span style={{ color: accentColor }}>Prático</span></>
                    )}
                  </h1>
                  <span className="text-[9px] text-slate-400 font-medium tracking-widest uppercase">
                    Orçamento de Serviços
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Info Card */}
          <div className="w-1/2 ml-auto flex items-center justify-end pr-8 gap-8 z-10 pt-4">
            <div className="flex gap-6 items-center">
               <div className="text-right">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                   Nº
                 </span>
                 <span className="text-sm font-bold text-slate-800">
                   {quote.numeroSequencial || 'Rascunho'}
                 </span>
               </div>
               <div className="w-px h-8 bg-slate-200"></div>
               <div className="text-right">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                   Data de emissão
                 </span>
                 <span className="text-sm font-bold text-slate-800">
                   {quote.date}
                 </span>
               </div>
               <div 
                 className="w-12 h-12 rounded-xl flex items-center justify-center border-2 bg-white shadow-sm"
                 style={{ borderColor: accentColor }}
               >
                 <Calendar size={24} style={{ color: accentColor }} />
               </div>
            </div>
          </div>
        </div>
      );
    } else {
      // Compact Header
      return (
        <div className="flex h-16 items-center justify-between px-10 border-b border-slate-100 mb-4 shrink-0" style={{ backgroundColor: primaryColor }}>
          <div className="flex items-center gap-3">
            {quote.professionalLogoUrl ? (
              <img 
                src={quote.professionalLogoUrl} 
                alt="Logo" 
                className="w-7 h-7 object-contain bg-white rounded-md p-0.5 shrink-0" 
              />
            ) : (
              <Building size={20} color={accentColor} strokeWidth={2.5} />
            )}
            <span className="font-bold text-sm text-white truncate max-w-[300px]">
              {quote.professionalName}
            </span>
          </div>
          <div className="flex gap-4 text-xs text-slate-300">
            <span><strong>Nº:</strong> {quote.numeroSequencial || 'Rascunho'}</span>
            <span className="w-px bg-slate-500 h-4"></span>
            <span><strong>Data:</strong> {quote.date}</span>
          </div>
        </div>
      );
    }
  };

  const renderTable = (items: typeof quote.items, isFirstPage: boolean) => {
    if (items.length === 0) return null;

    return (
      <div className="flex flex-col gap-3 mt-1 shrink-0">
        {isFirstPage && (
          <>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: accentColor }}>
                <Wrench size={16} />
              </div>
              <div className="flex flex-col">
                <h2 className="font-bold text-[13px] tracking-widest uppercase" style={{ color: primaryColor }}>
                  Escopo dos Serviços e Valores
                </h2>
              </div>
            </div>
            <p className="text-xs text-slate-500 pl-11 -mt-2">
               Abaixo estão detalhados os serviços solicitados, metragens e respectivos valores para a execução da obra.
            </p>
          </>
        )}

        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <div className="grid grid-cols-[1fr_120px_120px_120px] items-center py-2.5 px-4" style={{ backgroundColor: primaryColor }}>
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Descrição do Serviço</span>
            <span className="text-[10px] font-bold text-white uppercase tracking-wider text-center">Medida / Qtd.</span>
            <span className="text-[10px] font-bold text-white uppercase tracking-wider text-center">Valor Unitário</span>
            <span className="text-[10px] font-bold text-white uppercase tracking-wider text-center">Valor Total</span>
          </div>
          <div className="flex flex-col">
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-[1fr_120px_120px_120px] items-center py-2.5 px-4 border-b border-slate-100 last:border-b-0 border-dashed">
                <div className="flex items-center gap-3 pr-4">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border border-slate-100 bg-slate-50 text-slate-400">
                     <PaintRoller size={13} style={{ color: accentColor }} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-slate-800 leading-tight">{item.description}</span>
                    <span className="text-[9px] text-slate-500 mt-0.5 leading-tight">
                      {item.type === 'fixed' 
                        ? (item.details ? `${item.details}${item.fixedTerm ? ` (Prazo: ${item.fixedTerm})` : ''}` : `Serviço com valor fixo.${item.fixedTerm ? ` Prazo: ${item.fixedTerm}` : ''}`) 
                        : 'Inclui preparações e execuções padrão para o item descrito.'}
                    </span>
                  </div>
                </div>
                <div className="text-center text-xs text-slate-600 font-medium font-sans">
                  {item.type === 'fixed' ? '-' : (item.area && item.area > 0 ? `${item.area.toFixed(2)} m²` : '-')}
                </div>
                <div className="text-center text-xs text-slate-600 font-medium font-sans">
                  {item.type === 'fixed' ? '-' : (item.unitPrice && item.unitPrice > 0 ? `R$ ${item.unitPrice.toFixed(2)}` : '-')}
                </div>
                <div className="text-center text-xs font-bold text-slate-800 font-sans">
                  R$ {item.total.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderFinalBlocks = () => {
    return (
      <div className="flex flex-col gap-4 mt-2 shrink-0">
        {/* BOTTOM ROW: Pagamento & Totais */}
        <div className="flex gap-6 items-stretch">
          {/* Condições de Pagamento */}
          <div className="w-1/2 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: accentColor }}>
                <CreditCard size={16} />
              </div>
              <h2 className="font-bold text-[12px] tracking-widest uppercase" style={{ color: primaryColor }}>
                Condições de Pagamento
              </h2>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex-1 flex flex-col justify-center gap-3 relative overflow-hidden">
               {/* Watermark icon */}
               <div className="absolute -right-4 -bottom-4 opacity-[0.03]">
                 <CreditCard size={100} />
               </div>
               <div className="flex gap-2">
                 <div className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ backgroundColor: primaryColor }} />
                 <div className="flex flex-col relative z-10">
                   <span className="text-[11px] font-bold text-slate-800">Opção 1 (À Vista):</span>
                   <span className="text-[11px] text-emerald-600 font-semibold">{quote.paymentTerms ? quote.paymentTerms : 'A combinar'}</span>
                 </div>
               </div>
               <div className="w-full border-t border-dashed border-slate-200" style={{ borderColor: accentColor, opacity: 0.3 }} />
               <div className="flex gap-2">
                 <div className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ backgroundColor: primaryColor }} />
                 <div className="flex flex-col relative z-10">
                   <span className="text-[11px] font-bold text-slate-800">Opção 2 (Parcelado):</span>
                   <span className="text-[11px] text-emerald-600 font-semibold">Conforme negociação direta.</span>
                 </div>
               </div>
            </div>
          </div>

          {/* Totais */}
          <div className="w-1/2 flex flex-col justify-end">
            <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col h-[115px]">
              <div className="flex-1 flex flex-col justify-center gap-2 px-4 py-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium uppercase text-[10px] tracking-wider">Subtotal dos Serviços</span>
                  <span className="text-slate-800 font-bold">R$ {subtotal.toFixed(2)}</span>
                </div>
                {(quote.adjustment > 0 || quote.discount > 0) && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium uppercase text-[10px] tracking-wider">Adicionais / Descontos</span>
                    <span className="text-slate-800 font-bold">
                      {quote.adjustment >= quote.discount ? '+' : '-'} R$ {Math.abs(quote.adjustment - quote.discount).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
              <div className="h-12 flex items-center justify-between px-4 bg-primary relative overflow-hidden" style={{ backgroundColor: primaryColor }}>
                <div className="absolute right-0 top-0 bottom-0 w-40 flex justify-end items-center pr-4" style={{ backgroundColor: accentColor }}>
                   <span className="text-lg font-bold text-white z-10 tracking-tight">
                     R$ {total.toFixed(2)}
                   </span>
                </div>
                <span className="text-[11px] font-bold text-white uppercase tracking-widest z-10">
                  Total Geral
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TERMOS E OBSERVAÇÕES */}
        <div className="flex flex-col gap-2 mt-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: primaryColor }}>
              <FileText size={16} />
            </div>
            <h2 className="font-bold text-[12px] tracking-widest uppercase" style={{ color: primaryColor }}>
              Termos e Observações Importantes
            </h2>
          </div>
          <div className="text-[10px] text-slate-600 leading-relaxed whitespace-pre-line px-2 font-medium">
            {quote.notes || `1. Validade desta Proposta: Este orçamento é válido por 15 dias a partir da data de emissão.
2. Insumos e Materiais: Os materiais necessários para a execução dos serviços não estão inclusos neste valor, ficando sob responsabilidade do cliente, salvo disposição em contrário acordada previamente.
3. Serviços Extras: Qualquer serviço solicitado que não esteja explicitamente descrito neste documento demandará uma nova avaliação e orçamento complementar.`}
          </div>
        </div>

        {/* ACEITE DO ORÇAMENTO */}
        <div className="flex flex-col gap-2 mt-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: accentColor }}>
              <PenTool size={16} />
            </div>
            <h2 className="font-bold text-[12px] tracking-widest uppercase" style={{ color: primaryColor }}>
              Aceite do Orçamento
            </h2>
          </div>
          <p className="text-[10px] text-slate-600 pl-11 -mt-2">
            Para aprovação e agendamento do serviço, por favor, assine abaixo ou responda formalmente a este documento por e-mail/WhatsApp.
          </p>

          <div className="flex justify-between items-end pl-11 pr-8 mt-4 pb-2">
            <div className="w-60 flex flex-col gap-1">
               <span className="font-bold text-xs" style={{ color: accentColor }}>{quote.professionalName}</span>
               <div className="h-px w-full bg-slate-300"></div>
               <span className="text-[9px] text-slate-500 font-medium">Responsável pelo orçamento</span>
               <span className="text-[9px] text-slate-500 font-medium">CNPJ/CPF: {quote.professionalTaxId || 'Não informado'}</span>
            </div>

            <div className="w-60 flex flex-col gap-1">
               <span className="font-bold text-xs text-center" style={{ color: accentColor }}>{quote.customer.name} (Cliente)</span>
               <div className="h-px w-full bg-slate-300"></div>
               <span className="text-[9px] text-slate-500 font-medium text-center">Data do aceite: &nbsp;_____ / _____ / _________</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={ref} className="flex flex-col gap-6 bg-slate-900/5 p-6 rounded-2xl">
      {pages.map((page, idx) => {
        const isFirstPage = page.type === 'first';

        return (
          <div 
            key={idx}
            className="pdf-page w-[794px] h-[1123px] relative font-sans text-slate-800 flex flex-col box-border bg-white shadow-lg overflow-hidden"
            style={{ 
              width: '794px', 
              height: '1123px',
              boxSizing: 'border-box',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              backgroundColor: 'white',
              WebkitFontSmoothing: 'antialiased' 
            }}
          >
            {/* Header */}
            {renderHeader(page.type)}

            {/* Main Content */}
            <div className="flex-1 px-10 flex flex-col gap-5 pb-6">
              {isFirstPage && (
                /* TOP ROW: Dados do Cliente & Cronograma */
                <div className="flex gap-6 items-stretch shrink-0">
                  {/* Dados do Cliente */}
                  <div className="w-1/2 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: primaryColor }}>
                        <User size={16} />
                      </div>
                      <h2 className="font-bold text-[12px] tracking-widest uppercase" style={{ color: primaryColor }}>
                        Dados do Cliente
                      </h2>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex-1 flex flex-col justify-center gap-2">
                      <div className="grid grid-cols-[70px_1fr] items-center gap-2">
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                          <User size={13} /> Cliente:
                        </div>
                        <div className="font-semibold text-slate-800 text-xs truncate">{quote.customer.name}</div>
                      </div>
                      <div className="grid grid-cols-[70px_1fr] items-center gap-2">
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                          <Phone size={13} /> Telefone:
                        </div>
                        <div className="font-semibold text-slate-800 text-xs truncate">{quote.customer.phone}</div>
                      </div>
                      <div className="grid grid-cols-[70px_1fr] items-center gap-2">
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                          <MapPin size={13} /> Endereço:
                        </div>
                        <div className="font-semibold text-slate-800 text-xs line-clamp-2">{quote.customer.address}</div>
                      </div>
                    </div>
                  </div>

                  {/* Cronograma Estimado */}
                  <div className="w-1/2 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: primaryColor }}>
                        <Calendar size={16} />
                      </div>
                      <h2 className="font-bold text-[12px] tracking-widest uppercase" style={{ color: primaryColor }}>
                        Cronograma Estimado
                      </h2>
                    </div>
                    <div className="border rounded-2xl p-4 flex-1 flex flex-col justify-center gap-3 bg-emerald-50/30" style={{ borderColor: '#E2F6EF' }}>
                      <div className="grid grid-cols-[130px_1fr] items-center gap-2">
                        <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold">
                          <div className="w-4.5 h-4.5 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: accentColor }}>
                            <Clock size={11} />
                          </div>
                           Previsão de Início:
                        </div>
                        <div className="font-bold text-slate-800 text-xs text-right">{quote.customer.startDate || 'A combinar'}</div>
                      </div>
                      <div className="grid grid-cols-[130px_1fr] items-center gap-2">
                        <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold">
                          <div className="w-4.5 h-4.5 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: accentColor }}>
                            <Flag size={11} />
                          </div>
                           Prazo de Execução:
                        </div>
                        <div className="font-bold text-slate-800 text-xs text-right">{quote.executionTerm || 'A combinar'}</div>
                      </div>
                      <p className="text-[9px] text-slate-400 italic mt-0.5 ml-6">
                        *Válido após aprovação e liberação do local.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Scope/Table items */}
              {renderTable(page.items, isFirstPage)}

              {/* Totals, conditions, acceptance signature, terms (only on the final page) */}
              {page.showFinalBlocks && renderFinalBlocks()}
            </div>

            {/* Footer */}
            <div className="mt-auto h-12 flex items-center justify-between px-8 text-white relative shrink-0" style={{ backgroundColor: primaryColor }}>
               <div className="absolute left-0 bottom-0 top-0 w-24 bg-white/10" style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0% 100%)' }}></div>
               
               <div className="flex items-center gap-2 z-10">
                 <ShieldCheck size={14} color={accentColor} />
                 <span className="text-[9px] font-medium tracking-wide">Qualidade, compromisso e praticidade para transformar seu projeto em realidade.</span>
               </div>
               <div className="flex items-center gap-6 z-10">
                  <span className="text-[10px] font-semibold text-slate-300">Página {page.pageNumber} de {totalPages}</span>
                  <div className="flex items-center gap-1.5">
                    <Phone size={12} />
                    <span className="text-[10px] font-medium">{quote.professionalPhone || '(00) 00000-0000'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail size={12} />
                    <span className="text-[10px] font-medium">contato@orcapratico.com</span>
                  </div>
               </div>
            </div>

            {/* Watermark Graphic for aesthetics */}
            <div className="absolute right-0 bottom-32 opacity-[0.02] pointer-events-none z-0">
               <Building size={350} />
            </div>
          </div>
        );
      })}
    </div>
  );
});

PdfTemplate.displayName = 'PdfTemplate';

export default PdfTemplate;
