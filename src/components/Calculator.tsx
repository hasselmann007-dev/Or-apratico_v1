import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlusCircle, 
  ArrowLeft, 
  MoveHorizontal, 
  MoveVertical, 
  Square,
  BadgeDollarSign,
  Trash2,
  Settings,
  AlignLeft,
  CalendarDays,
  Check,
  Edit2
} from 'lucide-react';
import { PricingType, QuoteItem } from '../types';
import { cn } from '../lib/utils';

interface CalculatorProps {
  items: QuoteItem[];
  onAddItem: (item: QuoteItem) => void;
  onRemoveItem: (id: string) => void;
  onUpdateItem: (item: QuoteItem) => void;
  onNext: () => void;
  onBack: () => void;
}

const CATEGORIES = [
  { id: 'pintura', name: 'Pintura', basePrice: 25 },
  { id: 'piso', name: 'Piso / Porcelanato', basePrice: 80 },
  { id: 'gesso', name: 'Gesso / Forro', basePrice: 60 },
  { id: 'drywall', name: 'Drywall', basePrice: 90 },
  { id: 'alvenaria', name: 'Reboco / Alvenaria', basePrice: 45 },
  { id: 'outro', name: 'Outro Serviço', basePrice: 0 },
];

export default function Calculator({ items, onAddItem, onRemoveItem, onUpdateItem, onNext, onBack }: CalculatorProps) {
  const [modality, setModality] = useState<PricingType>('m2');
  
  // m2 state
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [length, setLength] = useState<string>('');
  const [width, setWidth] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<string>(CATEGORIES[0].basePrice.toString());
  
  // fixed state
  const [fixedName, setFixedName] = useState('');
  const [fixedDetails, setFixedDetails] = useState('');
  const [fixedPrice, setFixedPrice] = useState<string>('');
  const [fixedTerm, setFixedTerm] = useState('');
  
  const area = (parseFloat(length) || 0) * (parseFloat(width) || 0);
  const m2Total = area * (parseFloat(unitPrice) || 0);

  const handleAdd = () => {
    let newItem: QuoteItem;
    
    if (modality === 'm2') {
      if (!length || !width || !unitPrice) return;
      newItem = {
        id: crypto.randomUUID(),
        type: 'm2',
        category: selectedCategory.name,
        description: description || selectedCategory.name,
        length: parseFloat(length),
        widthOrHeight: parseFloat(width),
        area,
        unitPrice: parseFloat(unitPrice),
        total: m2Total,
      };
      setLength('');
      setWidth('');
      setDescription('');
    } else {
      if (!fixedName || !fixedPrice) return;
      newItem = {
        id: crypto.randomUUID(),
        type: 'fixed',
        category: 'Outro Serviço',
        description: fixedName,
        details: fixedDetails,
        fixedTerm: fixedTerm,
        total: parseFloat(fixedPrice),
      };
      setFixedName('');
      setFixedDetails('');
      setFixedPrice('');
      setFixedTerm('');
    }
    
    onAddItem(newItem);
  };

  useEffect(() => {
    if (modality === 'm2') {
      setUnitPrice(selectedCategory.basePrice.toString());
    }
  }, [selectedCategory, modality]);

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
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Inserir Serviço</h2>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-2xl shadow-slate-200 p-8 flex flex-col gap-8 overflow-hidden relative">
        {/* Modality Toggle */}
        <div className="flex p-1.5 bg-slate-100 rounded-2xl">
          <button
            onClick={() => setModality('m2')}
            className={cn(
              "flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all",
              modality === 'm2' 
                ? "bg-white text-primary shadow-sm" 
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            Por Metro Quadrado (m²)
          </button>
          <button
            onClick={() => setModality('fixed')}
            className={cn(
              "flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all",
              modality === 'fixed' 
                ? "bg-white text-emerald-600 shadow-sm" 
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            Valor Fixo
          </button>
        </div>

        <AnimatePresence mode="wait">
          {modality === 'm2' ? (
            <motion.div
              key="m2-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-8"
            >
              {/* Category Selector */}
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Tipo de Serviço</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(c)}
                      className={cn(
                        "p-4 rounded-2xl text-center transition-all border-2",
                        selectedCategory.id === c.id 
                          ? "bg-blue-50 border-blue-600 text-blue-600 shadow-lg shadow-blue-50" 
                          : "bg-white border-slate-50 text-slate-400 hover:border-slate-100"
                      )}
                    >
                      <span className="block text-[10px] font-bold uppercase mb-1">{c.name.split(' ')[0]}</span>
                      <span className="text-sm font-bold tracking-tight">R$ {c.basePrice}/m²</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Note input */}
              <div className="space-y-1.5 group">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Descrição / Comôdo</label>
                <input
                  type="text"
                  placeholder="Ex: Sala de Estar, Fachada Norte..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-14 pl-6 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-300 font-medium"
                />
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Largura (m)</label>
                  <div className="relative">
                    <MoveHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary outline-none transition-all font-light text-2xl"
                    />
                  </div>
                </div>
                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Altura (m)</label>
                  <div className="relative">
                    <MoveVertical className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary outline-none transition-all font-light text-2xl"
                    />
                  </div>
                </div>
              </div>

              {/* Price adjustment */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Ajustar Preço (R$/m²)</label>
                <div className="relative">
                  <BadgeDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input
                    type="number"
                    inputMode="decimal"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary outline-none font-bold text-slate-700 text-xl"
                  />
                </div>
              </div>

              {/* Calculated Info Card */}
              <div className="bg-primary rounded-3xl p-6 text-white shadow-xl shadow-blue-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold uppercase opacity-70 tracking-widest">Subtotal Previsto</span>
                  <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                    <Square size={14} />
                    <span className="text-xs font-bold">{area.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} m²</span>
                  </div>
                </div>
                <div className="text-5xl font-black tracking-tighter">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(m2Total)}
                </div>
              </div>

              <button
                onClick={handleAdd}
                disabled={!length || !width}
                className="w-full h-16 bg-slate-900 text-white rounded-2xl font-extrabold uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all text-sm disabled:opacity-30"
              >
                <PlusCircle size={22} />
                Adicionar Serviço
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="fixed-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-8"
            >
              {/* Fixed Name */}
              <div className="space-y-1.5 group">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Nome do Serviço</label>
                <div className="relative">
                  <Settings className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" size={20} />
                  <input
                    type="text"
                    placeholder="Ex: Instalação de Vaso Sanitário"
                    value={fixedName}
                    onChange={(e) => setFixedName(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-emerald-50/50 border-none focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-300 font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Fixed Details */}
              <div className="space-y-1.5 group">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Detalhes / Descrição</label>
                <div className="relative">
                  <AlignLeft className="absolute left-4 top-4 text-slate-300" size={20} />
                  <textarea
                    rows={3}
                    placeholder="Especifique os detalhes que estarão inclusos neste valor..."
                    value={fixedDetails}
                    onChange={(e) => setFixedDetails(e.target.value)}
                    className="w-full py-4 pl-12 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-300 font-medium resize-none"
                  />
                </div>
              </div>

              {/* Fixed Price & Term */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Valor do Serviço (R$)</label>
                  <div className="relative">
                    <BadgeDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={fixedPrice}
                      onChange={(e) => setFixedPrice(e.target.value)}
                      className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-light text-2xl text-emerald-600"
                    />
                  </div>
                </div>
                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Prazo de Execução</label>
                  <div className="relative">
                    <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input
                      type="text"
                      placeholder="Ex: 2 dias úteis"
                      value={fixedTerm}
                      onChange={(e) => setFixedTerm(e.target.value)}
                      className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-700"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleAdd}
                disabled={!fixedName || !fixedPrice}
                className="w-full h-16 bg-emerald-500 text-white rounded-2xl font-extrabold uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-emerald-200 active:scale-95 transition-all text-sm disabled:opacity-30 disabled:shadow-none"
              >
                <PlusCircle size={22} />
                Adicionar Serviço Fixo
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Added Items List */}
      {items.length > 0 && (
        <section className="flex flex-col gap-6 mt-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">Serviços Listados ({items.length})</h3>
          </div>
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {items.map((item) => (
                <EditableItem 
                  key={item.id}
                  item={item}
                  onUpdateItem={onUpdateItem}
                  onRemoveItem={onRemoveItem}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Floating Action Button for Next */}
      <div className="fixed bottom-24 left-0 right-0 p-6 pointer-events-none z-40">
        <div className="max-w-3xl mx-auto flex justify-end">
          <button
            onClick={onNext}
            disabled={items.length === 0}
            className="pointer-events-auto h-20 px-10 bg-slate-900 text-white rounded-[32px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-slate-300 active:scale-95 disabled:opacity-0 transition-all text-sm"
          >
            Concluir Orçamento
            <ArrowRightIcon size={24} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ArrowRightIcon({ size }: { size: number }) {
  return <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}><PlusCircle size={size} className="rotate-[-90deg]" /></motion.div>;
}

interface EditableItemProps {
  item: QuoteItem;
  onUpdateItem: (item: QuoteItem) => void;
  onRemoveItem: (id: string) => void;
}

function EditableItem({ item, onUpdateItem, onRemoveItem }: EditableItemProps & { key?: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [localDescription, setLocalDescription] = useState(item.description);
  
  // m2 specific states
  const [localLength, setLocalLength] = useState(item.length?.toString() || '');
  const [localWidth, setLocalWidth] = useState(item.widthOrHeight?.toString() || '');
  const [localUnitPrice, setLocalUnitPrice] = useState(item.unitPrice?.toString() || '');

  // fixed specific states
  const [localDetails, setLocalDetails] = useState(item.details || '');
  const [localFixedTerm, setLocalFixedTerm] = useState(item.fixedTerm || '');
  const [localTotal, setLocalTotal] = useState(item.total.toString());

  // Update local states if item prop changes externally
  useEffect(() => {
    setLocalDescription(item.description);
    setLocalLength(item.length?.toString() || '');
    setLocalWidth(item.widthOrHeight?.toString() || '');
    setLocalUnitPrice(item.unitPrice?.toString() || '');
    setLocalDetails(item.details || '');
    setLocalFixedTerm(item.fixedTerm || '');
    setLocalTotal(item.total.toString());
  }, [item]);

  const triggerUpdate = (fields: {
    description?: string;
    length?: string;
    widthOrHeight?: string;
    unitPrice?: string;
    details?: string;
    fixedTerm?: string;
    total?: string;
  }) => {
    const desc = fields.description !== undefined ? fields.description : localDescription;
    
    if (item.type === 'fixed') {
      const detailsVal = fields.details !== undefined ? fields.details : localDetails;
      const termVal = fields.fixedTerm !== undefined ? fields.fixedTerm : localFixedTerm;
      const totVal = parseFloat(fields.total !== undefined ? fields.total : localTotal) || 0;

      onUpdateItem({
        ...item,
        description: desc,
        details: detailsVal,
        fixedTerm: termVal,
        total: totVal
      });
    } else {
      const lenVal = parseFloat(fields.length !== undefined ? fields.length : localLength) || 0;
      const wVal = parseFloat(fields.widthOrHeight !== undefined ? fields.widthOrHeight : localWidth) || 0;
      const upVal = parseFloat(fields.unitPrice !== undefined ? fields.unitPrice : localUnitPrice) || 0;

      const calculatedArea = lenVal * wVal;
      const calculatedTotal = calculatedArea * upVal;

      onUpdateItem({
        ...item,
        description: desc,
        length: lenVal,
        widthOrHeight: wVal,
        area: calculatedArea,
        unitPrice: upVal,
        total: calculatedTotal
      });
    }
  };

  if (isEditing) {
    return (
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden"
      >
        {item.type === 'fixed' && (
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-emerald-500"></div>
        )}
        {(!item.type || item.type === 'm2') && (
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-primary"></div>
        )}

        <div className="flex flex-col gap-3">
          {/* Description */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest ml-1">Descrição</label>
            <input 
              type="text" 
              value={localDescription}
              onChange={(e) => {
                setLocalDescription(e.target.value);
                triggerUpdate({ description: e.target.value });
              }}
              className="w-full h-10 px-3 rounded-lg bg-white border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-xs font-bold text-slate-800"
            />
          </div>

          {/* Type Conditional Inputs */}
          {item.type === 'fixed' ? (
            <>
              {/* Details */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest ml-1">Detalhes</label>
                <input 
                  type="text" 
                  value={localDetails}
                  onChange={(e) => {
                    setLocalDetails(e.target.value);
                    triggerUpdate({ details: e.target.value });
                  }}
                  placeholder="Detalhes inclusos no serviço"
                  className="w-full h-10 px-3 rounded-lg bg-white border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-xs font-medium text-slate-600"
                />
              </div>

              {/* Price & Term */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest ml-1">Prazo</label>
                  <input 
                    type="text" 
                    value={localFixedTerm}
                    onChange={(e) => {
                      setLocalFixedTerm(e.target.value);
                      triggerUpdate({ fixedTerm: e.target.value });
                    }}
                    placeholder="Ex: 2 dias"
                    className="w-full h-10 px-3 rounded-lg bg-white border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-xs font-medium text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest ml-1">Preço Fixo (R$)</label>
                  <input 
                    type="number" 
                    value={localTotal}
                    onChange={(e) => {
                      setLocalTotal(e.target.value);
                      triggerUpdate({ total: e.target.value });
                    }}
                    className="w-full h-10 px-3 rounded-lg bg-white border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-xs font-black text-emerald-600"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Length, Width, UnitPrice */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest ml-1">Largura (m)</label>
                  <input 
                    type="number" 
                    value={localLength}
                    onChange={(e) => {
                      setLocalLength(e.target.value);
                      triggerUpdate({ length: e.target.value });
                    }}
                    className="w-full h-10 px-3 rounded-lg bg-white border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-xs font-medium text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest ml-1">Altura (m)</label>
                  <input 
                    type="number" 
                    value={localWidth}
                    onChange={(e) => {
                      setLocalWidth(e.target.value);
                      triggerUpdate({ widthOrHeight: e.target.value });
                    }}
                    className="w-full h-10 px-3 rounded-lg bg-white border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-xs font-medium text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest ml-1">Preço/m² (R$)</label>
                  <input 
                    type="number" 
                    value={localUnitPrice}
                    onChange={(e) => {
                      setLocalUnitPrice(e.target.value);
                      triggerUpdate({ unitPrice: e.target.value });
                    }}
                    className="w-full h-10 px-3 rounded-lg bg-white border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-xs font-bold text-slate-800"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-1">
          <button
            type="button"
            onClick={() => onRemoveItem(item.id)}
            className="h-9 px-3 border border-red-100 bg-red-50 text-red-500 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-red-100 transition-all flex items-center gap-1.5"
          >
            <Trash2 size={12} />
            Excluir
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="h-9 px-4 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Check size={12} />
            Concluir
          </button>
        </div>
      </motion.div>
    );
  }

  // Static view (clicking description or numbers enables editing inline)
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white border border-slate-100 rounded-2xl p-5 flex justify-between items-center shadow-lg shadow-slate-50 relative overflow-hidden hover:border-slate-200 transition-all group w-full"
    >
      {item.type === 'fixed' && (
        <div className="absolute top-0 left-0 bottom-0 w-1 bg-emerald-500"></div>
      )}
      {(!item.type || item.type === 'm2') && (
        <div className="absolute top-0 left-0 bottom-0 w-1 bg-primary"></div>
      )}

      {/* Clicking description enables editing */}
      <div 
        onClick={() => setIsEditing(true)} 
        className="pl-2 flex-1 cursor-pointer select-none"
      >
        <h4 className="font-extrabold text-slate-800 text-sm tracking-tight group-hover:text-primary transition-colors flex items-center gap-2">
          {item.description}
          <Edit2 size={12} className="opacity-0 group-hover:opacity-40 transition-opacity text-slate-400" />
        </h4>
        
        {/* Clicking numbers enables editing */}
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
          {item.type === 'fixed' 
            ? `Valor Fixo ${item.fixedTerm ? `• Prazo: ${item.fixedTerm}` : ''}`
            : `${(item.area || 0).toFixed(2)}m² • R$${(item.unitPrice || 0).toFixed(2)}/m²`
          }
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Clicking total price also enables editing */}
        <span 
          onClick={() => setIsEditing(true)}
          className={cn(
            "font-black text-lg cursor-pointer select-none", 
            item.type === 'fixed' ? 'text-emerald-600 hover:text-emerald-500' : 'text-slate-900 hover:text-primary'
          )}
        >
          R${item.total.toFixed(2)}
        </span>
        <button 
          onClick={() => onRemoveItem(item.id)}
          className="p-2.5 text-slate-300 hover:text-error hover:bg-error-container rounded-xl transition-all touch-target"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </motion.div>
  );
}
