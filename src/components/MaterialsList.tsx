import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Link2, 
  Plus, 
  Trash2, 
  Package, 
  ShoppingCart, 
  Store, 
  Check, 
  Loader2, 
  AlertCircle, 
  PlusCircle, 
  MinusCircle, 
  ExternalLink,
  Edit2,
  X,
  HelpCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Quote, MaterialItem } from '../types';
import { analyzeProductLinkWithAI, AISearchProduct } from '../lib/gemini';
import { cn } from '../lib/utils';

interface MaterialsListProps {
  quote: Quote;
  onUpdateMaterials: (materials: MaterialItem[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const COMMON_UNITS = [
  { id: 'un', label: 'Unidade (un)' },
  { id: 'lata', label: 'Lata (18L)' },
  { id: 'galão', label: 'Galão (3,6L)' },
  { id: 'saco', label: 'Saco (20kg/50kg)' },
  { id: 'm²', label: 'Metro Quadrado (m²)' },
  { id: 'm', label: 'Metro Linear (m)' },
  { id: 'barra', label: 'Barra (6m/3m)' },
  { id: 'kg', label: 'Quilo (kg)' },
  { id: 'cx', label: 'Caixa (cx)' },
  { id: 'rolo', label: 'Rolo' },
  { id: 'pct', label: 'Pacote (pct)' },
];

const CATEGORIES = [
  'Pintura',
  'Alvenaria',
  'Piso',
  'Hidráulica',
  'Elétrica',
  'Drywall',
  'Ferramentas',
  'Geral',
];

export default function MaterialsList({ quote, onUpdateMaterials, onNext, onBack }: MaterialsListProps) {
  const materials = quote.materials || [];

  // Link Analysis State
  const [linkUrl, setLinkUrl] = useState('');
  const [isAnalyzingLink, setIsAnalyzingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [detectedProduct, setDetectedProduct] = useState<AISearchProduct | null>(null);

  // Editable fields for the detected product prompt
  const [confirmName, setConfirmName] = useState('');
  const [confirmQty, setConfirmQty] = useState('1');
  const [confirmUnit, setConfirmUnit] = useState('un');
  const [confirmPrice, setConfirmPrice] = useState('0');
  const [confirmSuccessMsg, setConfirmSuccessMsg] = useState<string | null>(null);

  // Manual Add Form State
  const [showManualForm, setShowManualForm] = useState(true);
  const [manualName, setManualName] = useState('');
  const [manualCategory, setManualCategory] = useState('Geral');
  const [manualQuantity, setManualQuantity] = useState('1');
  const [manualUnit, setManualUnit] = useState('un');
  const [manualPrice, setManualPrice] = useState('');
  const [manualNotes, setManualNotes] = useState('');

  // Inline Editing State for added items
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editUnitPrice, setEditUnitPrice] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Total Materials Cost
  const totalMaterialsAmount = materials.reduce((acc, m) => acc + (Number(m.totalPrice) || 0), 0);

  // Parse Brazilian numeric string (handles comma and dot)
  const parseBrNumber = (val: string): number => {
    if (!val) return 0;
    const sanitized = val.toString().replace(/\s/g, '').replace(',', '.');
    return parseFloat(sanitized) || 0;
  };

  // Format currency
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Handle Analyzing Product Link with AI
  const handleAnalyzeLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const url = linkUrl.trim();
    if (!url) {
      setLinkError('Por favor, cole o link (URL) do produto antes de analisar.');
      return;
    }

    setIsAnalyzingLink(true);
    setLinkError(null);
    setDetectedProduct(null);
    setConfirmSuccessMsg(null);

    try {
      const product = await analyzeProductLinkWithAI(url);
      setDetectedProduct(product);
      setConfirmName(product.name);
      setConfirmQty(String(product.quantity || 1));
      setConfirmUnit(product.unit || 'un');
      setConfirmPrice(String(product.estimatedUnitPrice || 0));
    } catch (err: any) {
      console.error('Error analyzing link:', err);
      setLinkError('Não foi possível identificar o produto automaticamente através do link. Verifique se o endereço é válido ou adicione-o manualmente.');
    } finally {
      setIsAnalyzingLink(false);
    }
  };

  // Confirm and Add Detected Product to Materials List
  const handleConfirmAddDetected = () => {
    if (!detectedProduct) return;

    const qty = Math.max(0.01, parseBrNumber(confirmQty) || 1);
    const unitPrice = Math.max(0, parseBrNumber(confirmPrice));

    const newItem: MaterialItem = {
      id: crypto.randomUUID(),
      name: confirmName.trim() || detectedProduct.name,
      category: detectedProduct.category || 'Geral',
      quantity: qty,
      unit: confirmUnit || detectedProduct.unit || 'un',
      unitPrice,
      totalPrice: Number((qty * unitPrice).toFixed(2)),
      notes: detectedProduct.description,
      sourceStore: detectedProduct.storeOrSource,
      sourceUrl: detectedProduct.sourceUrl,
    };

    onUpdateMaterials([...materials, newItem]);

    // Success feedback and reset
    setConfirmSuccessMsg(`"${newItem.name}" foi adicionado com sucesso à sua lista!`);
    setDetectedProduct(null);
    setLinkUrl('');
    setTimeout(() => setConfirmSuccessMsg(null), 5000);
  };

  // Discard Detected Product
  const handleDiscardDetected = () => {
    setDetectedProduct(null);
    setLinkError(null);
  };

  // Manual Add Form Submit
  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    const qty = Math.max(0.01, parseBrNumber(manualQuantity) || 1);
    const price = Math.max(0, parseBrNumber(manualPrice));

    const newItem: MaterialItem = {
      id: crypto.randomUUID(),
      name: manualName.trim(),
      category: manualCategory,
      quantity: qty,
      unit: manualUnit,
      unitPrice: price,
      totalPrice: Number((qty * price).toFixed(2)),
      notes: manualNotes.trim() || undefined,
    };

    onUpdateMaterials([...materials, newItem]);

    // Reset Form
    setManualName('');
    setManualQuantity('1');
    setManualPrice('');
    setManualNotes('');
  };

  // Start Editing an Item
  const handleStartEdit = (item: MaterialItem) => {
    setEditingItemId(item.id);
    setEditName(item.name);
    setEditQuantity(String(item.quantity));
    setEditUnit(item.unit);
    setEditUnitPrice(String(item.unitPrice));
    setEditNotes(item.notes || '');
  };

  // Save Edited Item
  const handleSaveEdit = (id: string) => {
    const qty = Math.max(0.01, parseBrNumber(editQuantity) || 1);
    const price = Math.max(0, parseBrNumber(editUnitPrice));

    const updated = materials.map(m => {
      if (m.id === id) {
        return {
          ...m,
          name: editName.trim() || m.name,
          quantity: qty,
          unit: editUnit || m.unit,
          unitPrice: price,
          totalPrice: Number((qty * price).toFixed(2)),
          notes: editNotes.trim() || undefined,
        };
      }
      return m;
    });

    onUpdateMaterials(updated);
    setEditingItemId(null);
  };

  // Cancel Editing
  const handleCancelEdit = () => {
    setEditingItemId(null);
  };

  // Remove Item
  const handleRemoveItem = (id: string) => {
    onUpdateMaterials(materials.filter(m => m.id !== id));
  };

  // Update Item Quantity with step (+/-)
  const handleUpdateQuantity = (id: string, delta: number) => {
    const updated = materials.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0.1, Number((item.quantity + delta).toFixed(2)));
        const newTotal = Number((newQty * item.unitPrice).toFixed(2));
        return {
          ...item,
          quantity: newQty,
          totalPrice: newTotal,
        };
      }
      return item;
    });
    onUpdateMaterials(updated);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col gap-6 p-6 pb-40 max-w-4xl mx-auto w-full font-sans"
    >
      {/* Header & Step Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-400 shadow-sm hover:text-primary transition-colors touch-target"
              title="Voltar para Serviços"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary-container px-2.5 py-0.5 rounded-full">
                  Etapa 3 de 4
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Orçamento de Obras
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 mt-0.5">
                <Package className="text-primary" size={24} />
                Lista de Materiais
              </h2>
            </div>
          </div>

          {/* Quick Summary Pill */}
          <div className="hidden sm:flex flex-col items-end bg-white border border-slate-100 px-4 py-2 rounded-2xl shadow-sm">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Total Materiais</span>
            <span className="text-base font-black text-slate-800">
              {formatBRL(totalMaterialsAmount)}
            </span>
          </div>
        </div>

        <p className="text-slate-500 text-sm font-medium">
          Adicione materiais colando o link do produto para a IA identificar nome, preço e quantidade, ou cadastre os insumos manualmente.
        </p>
      </div>

      {/* Success Notification */}
      <AnimatePresence>
        {confirmSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-3 shadow-sm"
          >
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{confirmSuccessMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTION 1: ADD VIA PRODUCT LINK (AI-POWERED) */}
      <section className="bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 border border-blue-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-200">
              <Link2 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                Adicionar por Link de Produto
                <span className="bg-blue-100 text-blue-700 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles size={10} /> Google AI
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Cole o link de qualquer loja (Mercado Livre, Leroy Merlin, Obramax, Amazon, etc.) para a IA identificar o produto
              </p>
            </div>
          </div>
        </div>

        {/* Link Input Form */}
        <form onSubmit={handleAnalyzeLink} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => {
                setLinkUrl(e.target.value);
                if (linkError) setLinkError(null);
              }}
              placeholder="Cole aqui o link do produto (ex: https://www.mercadolivre.com.br/...)"
              className="w-full h-12 pl-4 pr-10 rounded-2xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs font-medium text-slate-800 placeholder:text-slate-400 transition-all shadow-inner"
            />
            {linkUrl && (
              <button
                type="button"
                onClick={() => setLinkUrl('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-1"
                title="Limpar campo"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isAnalyzingLink || !linkUrl.trim()}
            className="h-12 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {isAnalyzingLink ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Identificando com IA...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Analisar Link</span>
              </>
            )}
          </button>
        </form>

        {/* Link Analysis Error */}
        {linkError && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
            <div className="flex-1 font-medium">{linkError}</div>
          </div>
        )}

        {/* CONFIRMATION PROMPT: Solicitando se é pra adicionar na lista ou não */}
        <AnimatePresence>
          {detectedProduct && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="mt-2 p-5 rounded-2xl bg-white border-2 border-blue-400 shadow-xl flex flex-col gap-4 relative overflow-hidden"
            >
              {/* Prompt Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">
                      Produto Identificado pela IA
                    </h4>
                    <p className="text-[11px] font-semibold text-blue-700">
                      Deseja adicionar este produto à lista de materiais?
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {detectedProduct.storeOrSource && (
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Store size={11} /> {detectedProduct.storeOrSource}
                    </span>
                  )}
                  {detectedProduct.sourceUrl && (
                    <a
                      href={detectedProduct.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-blue-600 p-1 transition-colors"
                      title="Ver anúncio original"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>

              {/* Detected Product Editable Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Produto Identificado
                  </label>
                  <input
                    type="text"
                    value={confirmName}
                    onChange={(e) => setConfirmName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition-all"
                  />
                  {detectedProduct.description && (
                    <p className="text-[11px] text-slate-500 italic mt-1">
                      {detectedProduct.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Qtd. & Unidade
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={confirmQty}
                        onChange={(e) => setConfirmQty(e.target.value)}
                        className="w-16 h-11 px-2 text-center rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
                      />
                      <select
                        value={confirmUnit}
                        onChange={(e) => setConfirmUnit(e.target.value)}
                        className="flex-1 h-11 px-1 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700 outline-none"
                      >
                        {COMMON_UNITS.map(u => (
                          <option key={u.id} value={u.id}>{u.id}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Valor Unit. (R$)
                    </label>
                    <input
                      type="text"
                      value={confirmPrice}
                      onChange={(e) => setConfirmPrice(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Subtotal Calculation & Decision Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    Total deste item:
                  </span>
                  <span className="text-base font-black text-slate-900">
                    {formatBRL((parseBrNumber(confirmQty) || 0) * (parseBrNumber(confirmPrice) || 0))}
                  </span>
                </div>

                {/* The Two Decision Actions */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleDiscardDetected}
                    className="flex-1 sm:flex-initial h-11 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <X size={15} />
                    Descartar
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmAddDetected}
                    className="flex-1 sm:flex-initial h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <Check size={16} />
                    Adicionar à Lista
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* SECTION 2: MANUAL ADD FORM */}
      <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <PlusCircle size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">
                Adicionar Material Manualmente
              </h3>
              <p className="text-[11px] text-slate-400">
                Insira itens, especificações e valores personalizados diretamente
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowManualForm(!showManualForm)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-xs flex items-center gap-1 transition-all"
          >
            {showManualForm ? (
              <>
                <ChevronUp size={16} /> Ocultar
              </>
            ) : (
              <>
                <ChevronDown size={16} /> Novo Item Manual
              </>
            )}
          </button>
        </div>

        {/* Manual Form Body */}
        <AnimatePresence>
          {showManualForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleManualAdd}
              className="flex flex-col gap-4 pt-4 border-t border-slate-100"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">
                    Descrição do Material / Insumo *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Ex: Tinta Acrílica Fosca Suvinil 18L, Cimento CP II 50kg, etc."
                    className="w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-primary focus:bg-white outline-none text-xs font-medium text-slate-800 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">
                    Categoria
                  </label>
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value)}
                    className="w-full h-12 px-3 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-primary focus:bg-white outline-none text-xs font-medium text-slate-800 transition-all"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">
                    Quantidade *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualQuantity}
                    onChange={(e) => setManualQuantity(e.target.value)}
                    placeholder="Ex: 1 ou 2,5"
                    className="w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-primary focus:bg-white outline-none text-xs font-bold text-slate-800 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">
                    Unidade de Medida
                  </label>
                  <select
                    value={manualUnit}
                    onChange={(e) => setManualUnit(e.target.value)}
                    className="w-full h-12 px-3 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-primary focus:bg-white outline-none text-xs font-medium text-slate-800 transition-all"
                  >
                    {COMMON_UNITS.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">
                    Preço Unitário (R$) *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    placeholder="Ex: 189,90"
                    className="w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-primary focus:bg-white outline-none text-xs font-bold text-slate-800 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">
                  Observações / Marca / Loja de Referência (Opcional)
                </label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="Ex: Leroy Merlin, Coral Rende Muito, cabo reforçado, etc."
                  className="w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-primary focus:bg-white outline-none text-xs font-medium text-slate-800 transition-all"
                />
              </div>

              {/* Preview & Submit */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-500 font-medium">
                  Total deste item:{' '}
                  <strong className="text-slate-800 font-bold">
                    {formatBRL((parseBrNumber(manualQuantity) || 0) * (parseBrNumber(manualPrice) || 0))}
                  </strong>
                </div>

                <button
                  type="submit"
                  className="px-6 h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                >
                  <Plus size={16} />
                  Adicionar ao Orçamento
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </section>

      {/* SECTION 3: MATERIALS LIST (ITEMS IN QUOTE) */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between ml-2">
          <h3 className="text-[11px] font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2">
            <ShoppingCart size={14} />
            Materiais Incluídos no Orçamento ({materials.length})
          </h3>

          {materials.length > 0 && (
            <button
              type="button"
              onClick={() => onUpdateMaterials([])}
              className="text-[10px] text-red-500 hover:text-red-700 font-bold uppercase tracking-wider transition-colors"
            >
              Limpar Todos
            </button>
          )}
        </div>

        {materials.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-10 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center">
              <Package size={28} />
            </div>
            <div className="flex flex-col gap-1 max-w-sm">
              <h4 className="font-bold text-slate-700 text-sm">Nenhum material adicionado ainda</h4>
              <p className="text-xs text-slate-400">
                Cole o link de um produto acima ou use o formulário manual. Se os materiais forem fornecidos pelo cliente, você pode simplesmente avançar para a próxima etapa.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {materials.map((item, idx) => {
              const isEditing = editingItemId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all"
                >
                  {isEditing ? (
                    /* Inline Item Editor */
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Edit2 size={13} className="text-primary" />
                          Editar Material #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="text-slate-400 hover:text-slate-600 p-1"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[10px] font-bold uppercase text-slate-400">Descrição</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-slate-400">Observação / Ref.</label>
                          <input
                            type="text"
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Marca ou loja"
                            className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-slate-400">Quantidade</label>
                          <input
                            type="text"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-slate-400">Unidade</label>
                          <select
                            value={editUnit}
                            onChange={(e) => setEditUnit(e.target.value)}
                            className="w-full h-10 px-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                          >
                            {COMMON_UNITS.map(u => (
                              <option key={u.id} value={u.id}>{u.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-slate-400">Preço Unit. (R$)</label>
                          <input
                            type="text"
                            value={editUnitPrice}
                            onChange={(e) => setEditUnitPrice(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div className="text-xs text-slate-600">
                          Total atualizado:{' '}
                          <strong className="text-slate-900 font-bold">
                            {formatBRL((parseBrNumber(editQuantity) || 0) * (parseBrNumber(editUnitPrice) || 0))}
                          </strong>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium rounded-lg"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(item.id)}
                            className="px-4 py-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl shadow-sm"
                          >
                            Salvar Alterações
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Normal Item View */
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-start gap-3.5 flex-1">
                        <div className="w-9 h-9 rounded-xl bg-primary-container text-primary flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-800 text-sm leading-tight">
                            {item.name}
                          </span>
                          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-1 flex-wrap">
                            {item.category && (
                              <span className="text-primary">{item.category}</span>
                            )}
                            {item.sourceStore && (
                              <>
                                <div className="w-1 h-1 rounded-full bg-slate-300" />
                                <span>Ref: {item.sourceStore}</span>
                              </>
                            )}
                            {item.notes && (
                              <>
                                <div className="w-1 h-1 rounded-full bg-slate-300" />
                                <span className="normal-case font-normal text-slate-500 truncate max-w-xs">{item.notes}</span>
                              </>
                            )}
                            {item.sourceUrl && (
                              <>
                                <div className="w-1 h-1 rounded-full bg-slate-300" />
                                <a
                                  href={item.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="normal-case text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold underline"
                                >
                                  <ExternalLink size={10} /> Link
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quantitative controls & Total */}
                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {/* Quantity controls */}
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 rounded-xl px-2 py-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, -1)}
                            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
                            title="Diminuir quantidade"
                          >
                            <MinusCircle size={15} />
                          </button>
                          <span className="text-xs font-bold text-slate-800 min-w-8 text-center">
                            {item.quantity} {item.unit}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, 1)}
                            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
                            title="Aumentar quantidade"
                          >
                            <PlusCircle size={15} />
                          </button>
                        </div>

                        {/* Unit Price & Total */}
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                            R$ {item.unitPrice.toFixed(2)} / {item.unit}
                          </span>
                          <span className="text-lg font-black text-slate-900 tracking-tight">
                            {formatBRL(item.totalPrice)}
                          </span>
                        </div>

                        {/* Action buttons: Edit & Delete */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-xl transition-all"
                            title="Editar este material"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Excluir material"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Total Materials Summary Bar */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 flex items-center justify-between shadow-xl mt-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-primary">
                  <Package size={20} className="text-blue-400" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Subtotal de Materiais
                  </span>
                  <div className="text-sm font-semibold text-slate-200">
                    {materials.length} {materials.length === 1 ? 'item cadastrado' : 'itens cadastrados'}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black tracking-tight text-white">
                  {formatBRL(totalMaterialsAmount)}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onBack}
          className="h-14 px-6 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm flex items-center gap-2 shadow-sm transition-all touch-target"
        >
          <ArrowLeft size={18} />
          Voltar para Serviços
        </button>

        <button
          type="button"
          onClick={onNext}
          className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary-dark text-white font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all touch-target"
        >
          <span>Avançar para Resumo</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </motion.div>
  );
}
