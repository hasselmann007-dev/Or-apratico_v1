import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Search, 
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
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Edit2,
  X
} from 'lucide-react';
import { Quote, MaterialItem } from '../types';
import { searchProductsWithAI, suggestMaterialsForServices, AISearchProduct } from '../lib/gemini';
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

const QUICK_SEARCH_CHIPS = [
  'Tinta Acrílica 18L',
  'Massa Corrida 18L',
  'Argamassa AC-III 20kg',
  'Porcelanato 80x80',
  'Cimento Votoran 50kg',
  'Placa Drywall 120x180',
  'Rolo de Pintura 23cm',
  'Tubo PVC 25mm Tigre',
  'Cabo Flexível 2.5mm Sil',
];

export default function MaterialsList({ quote, onUpdateMaterials, onNext, onBack }: MaterialsListProps) {
  const materials = quote.materials || [];

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<AISearchProduct[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [addedSearchIdxs, setAddedSearchIdxs] = useState<Record<number, boolean>>({});

  // Auto-Suggest State
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  // Manual Add Form State
  const [showManualForm, setShowManualForm] = useState(false);
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

  // Parse Brazilian numeric string (handles both comma and dot)
  const parseBrNumber = (val: string): number => {
    if (!val) return 0;
    const sanitized = val.toString().replace(/\s/g, '').replace(',', '.');
    return parseFloat(sanitized) || 0;
  };

  // Handle AI Web Search
  const handleSearch = async (queryToSearch?: string) => {
    const q = (queryToSearch || searchQuery).trim();
    if (!q) return;

    if (queryToSearch) {
      setSearchQuery(queryToSearch);
    }

    setIsSearching(true);
    setHasSearched(true);
    setSuggestError(null);
    setAddedSearchIdxs({});

    try {
      const results = await searchProductsWithAI(q);
      setSearchResults(results);
    } catch (err: any) {
      console.error('Search error:', err);
      setSuggestError('Não foi possível completar a pesquisa na web no momento. Tente novamente ou use a adição manual.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle Suggest based on quote services
  const handleSuggestFromServices = async () => {
    if (!quote.items || quote.items.length === 0) {
      setSuggestError('Adicione pelo menos um serviço no passo anterior para que a IA possa analisar e sugerir os materiais da obra.');
      return;
    }

    setIsSuggesting(true);
    setSuggestError(null);
    setSearchResults([]);
    setAddedSearchIdxs({});

    try {
      const suggestions = await suggestMaterialsForServices(quote.items);
      setSearchResults(suggestions);
      setHasSearched(true);
    } catch (err: any) {
      console.error('Suggest error:', err);
      setSuggestError('Ocorreu um erro ao calcular os materiais sugeridos. Tente novamente.');
    } finally {
      setIsSuggesting(false);
    }
  };

  // Add Item from Search/Suggestions
  const handleAddSearchResult = (product: AISearchProduct, idx: number) => {
    const qty = Math.max(0.01, product.quantity || 1);
    const unitPrice = Math.max(0, product.estimatedUnitPrice || 0);

    const newItem: MaterialItem = {
      id: crypto.randomUUID(),
      name: product.name,
      category: product.category,
      quantity: qty,
      unit: product.unit || 'un',
      unitPrice,
      totalPrice: Number((qty * unitPrice).toFixed(2)),
      notes: product.description,
      sourceStore: product.storeOrSource,
      sourceUrl: product.sourceUrl,
    };

    onUpdateMaterials([...materials, newItem]);
    setAddedSearchIdxs(prev => ({ ...prev, [idx]: true }));
  };

  // Add All Search Results (ignoring duplicates)
  const handleAddAllSearchResults = () => {
    const unaddedProducts = searchResults.filter((_, idx) => !addedSearchIdxs[idx]);
    if (unaddedProducts.length === 0) return;

    const newItems: MaterialItem[] = unaddedProducts.map((product) => {
      const qty = Math.max(0.01, product.quantity || 1);
      const unitPrice = Math.max(0, product.estimatedUnitPrice || 0);
      return {
        id: crypto.randomUUID(),
        name: product.name,
        category: product.category,
        quantity: qty,
        unit: product.unit || 'un',
        unitPrice,
        totalPrice: Number((qty * unitPrice).toFixed(2)),
        notes: product.description,
        sourceStore: product.storeOrSource,
        sourceUrl: product.sourceUrl,
      };
    });

    onUpdateMaterials([...materials, ...newItems]);
    const allAdded: Record<number, boolean> = {};
    searchResults.forEach((_, idx) => {
      allAdded[idx] = true;
    });
    setAddedSearchIdxs(allAdded);
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
    setShowManualForm(false);
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

  // Update Item Quantity with step
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
                  Orçamento Inteligente
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
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalMaterialsAmount)}
            </span>
          </div>
        </div>

        <p className="text-slate-500 text-sm font-medium">
          Pesquise produtos e preços médios do mercado brasileiro na web com IA do Google, gere estimativas automáticas a partir dos serviços ou cadastre itens manualmente.
        </p>
      </div>

      {/* AI Hub Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Web Search with AI */}
        <div className="bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/50 border border-blue-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between gap-4 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-200">
                <Search size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  Pesquisar na Web com IA
                  <span className="bg-blue-100 text-blue-700 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                    Google AI
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Preços reais e referências do mercado brasileiro
                </p>
              </div>
            </div>
          </div>

          {/* Search Form */}
          <div className="flex flex-col gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Ex: Tinta Suvinil 18L, Argamassa AC3, Porcelanato..."
                className="w-full h-12 pl-4 pr-11 rounded-2xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs font-medium text-slate-700 placeholder:text-slate-400 transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => handleSearch()}
                disabled={isSearching || !searchQuery.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                title="Pesquisar Preços"
              >
                {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              </button>
            </div>

            {/* Quick Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sugestões:</span>
              {QUICK_SEARCH_CHIPS.slice(0, 4).map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSearch(chip)}
                  disabled={isSearching}
                  className="text-[10px] font-semibold text-blue-700 bg-white hover:bg-blue-100/70 border border-blue-200/60 px-2.5 py-1 rounded-lg transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Suggest from Quote Services */}
        <div className="bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 border border-emerald-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between gap-4 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  Calcular com Base na Obra
                  <span className="bg-emerald-100 text-emerald-700 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                    Automático
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Calcula quantidades e rendimentos por m² e serviços
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs text-slate-600 font-medium">
              {quote.items.length > 0 ? (
                <>
                  Identificamos <strong className="text-slate-800">{quote.items.length} {quote.items.length === 1 ? 'serviço' : 'serviços'}</strong> no orçamento. A IA calculará todos os insumos necessários para a execução técnica.
                </>
              ) : (
                'Nenhum serviço adicionado ainda. Adicione serviços no passo anterior para cálculo automático de materiais.'
              )}
            </p>

            <button
              type="button"
              onClick={handleSuggestFromServices}
              disabled={isSuggesting || quote.items.length === 0}
              className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSuggesting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Analisando serviços da obra...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Sugerir Materiais dos Serviços ({quote.items.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Suggest Error Message */}
      {suggestError && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-3">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-600" />
          <div className="flex-1 font-medium leading-relaxed">{suggestError}</div>
        </div>
      )}

      {/* AI Search / Suggestion Results Panel */}
      <AnimatePresence>
        {hasSearched && (
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white border border-slate-200 rounded-3xl p-6 shadow-lg shadow-slate-100 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Store size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    Resultados e Sugestões da IA ({searchResults.length})
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Pesquisa de mercado na web e cálculos de rendimento técnico
                  </span>
                </div>
              </div>

              {searchResults.length > 1 && (
                <button
                  type="button"
                  onClick={handleAddAllSearchResults}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus size={14} />
                  Adicionar Todos ({searchResults.length})
                </button>
              )}
            </div>

            {searchResults.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Nenhum produto correspondente encontrado. Tente refinar os termos ou adicionar manualmente abaixo.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                {searchResults.map((product, idx) => {
                  const isAdded = !!addedSearchIdxs[idx];
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3",
                        isAdded 
                          ? "bg-emerald-50/50 border-emerald-200" 
                          : "bg-slate-50/70 hover:bg-white border-slate-100 hover:border-slate-300 hover:shadow-md"
                      )}
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-xs text-slate-800 leading-snug">
                            {product.name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full shrink-0">
                            {product.category}
                          </span>
                        </div>

                        {product.description && (
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            {product.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium flex-wrap pt-0.5">
                          {product.storeOrSource && (
                            <div className="flex items-center gap-1">
                              <Store size={11} />
                              <span>Referência: {product.storeOrSource}</span>
                            </div>
                          )}
                          {product.sourceUrl && (
                            <a
                              href={product.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 underline underline-offset-2"
                            >
                              <ExternalLink size={11} />
                              Ver link
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            Preço Médio ({product.quantity} {product.unit})
                          </span>
                          <span className="text-base font-black text-slate-900">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                              product.quantity * product.estimatedUnitPrice
                            )}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddSearchResult(product, idx)}
                          disabled={isAdded}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm",
                            isAdded
                              ? "bg-emerald-600 text-white cursor-default"
                              : "bg-primary hover:bg-primary-dark text-white hover:scale-102"
                          )}
                        >
                          {isAdded ? (
                            <>
                              <Check size={14} />
                              Adicionado
                            </>
                          ) : (
                            <>
                              <Plus size={14} />
                              Adicionar
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* Manual Add Toggle Button & Form */}
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
                Insira itens e valores personalizados diretamente
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

        {/* Form Body */}
        <AnimatePresence>
          {showManualForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleManualAdd}
              className="flex flex-col gap-4 pt-4 border-t border-slate-100"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">
                    Descrição do Material / Insumo *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Ex: Rolo de Lã de Carneiro 23cm Antigota"
                    className="w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-primary focus:bg-white outline-none text-xs font-medium text-slate-800 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">
                    Preço Unitário (R$) *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    placeholder="Ex: 38,90 ou 38.90"
                    className="w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-primary focus:bg-white outline-none text-xs font-bold text-slate-800 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">
                    Observações / Marca (Opcional)
                  </label>
                  <input
                    type="text"
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder="Ex: Tigre ou Atlas, cabo reforçado"
                    className="w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-primary focus:bg-white outline-none text-xs font-medium text-slate-800 transition-all"
                  />
                </div>
              </div>

              {/* Preview & Submit */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-500 font-medium">
                  Total deste item:{' '}
                  <strong className="text-slate-800 font-bold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      (parseBrNumber(manualQuantity) || 0) * (parseBrNumber(manualPrice) || 0)
                    )}
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

      {/* Materials List (Items in Quote) */}
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
                Você pode pesquisar produtos na web acima, sugerir a partir dos serviços ou avançar diretamente caso os materiais fiquem 100% por conta do cliente.
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
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                              (parseBrNumber(editQuantity) || 0) * (parseBrNumber(editUnitPrice) || 0)
                            )}
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
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.totalPrice)}
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
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalMaterialsAmount)}
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
