import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  PlusCircle, 
  ArrowLeft, 
  MoveHorizontal, 
  MoveVertical, 
  Square,
  BadgeDollarSign,
  Trash2
} from 'lucide-react';
import { QuoteItem } from '../types';
import { cn } from '../lib/utils';

interface CalculatorProps {
  items: QuoteItem[];
  onAddItem: (item: QuoteItem) => void;
  onRemoveItem: (id: string) => void;
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

export default function Calculator({ items, onAddItem, onRemoveItem, onNext, onBack }: CalculatorProps) {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [length, setLength] = useState<string>('');
  const [width, setWidth] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<string>(CATEGORIES[0].basePrice.toString());
  
  const area = (parseFloat(length) || 0) * (parseFloat(width) || 0);
  const total = area * (parseFloat(unitPrice) || 0);

  const handleAdd = () => {
    if (!length || !width || !unitPrice) return;
    
    const newItem: QuoteItem = {
      id: crypto.randomUUID(),
      category: selectedCategory.name,
      description: description || selectedCategory.name,
      length: parseFloat(length),
      widthOrHeight: parseFloat(width),
      area,
      unitPrice: parseFloat(unitPrice),
      total,
    };
    
    onAddItem(newItem);
    
    // Reset form
    setLength('');
    setWidth('');
    setDescription('');
  };

  useEffect(() => {
    setUnitPrice(selectedCategory.basePrice.toString());
  }, [selectedCategory]);

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
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Medição do Serviço</h2>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-2xl shadow-slate-200 p-8 flex flex-col gap-8">
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
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
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

        <button
          onClick={handleAdd}
          disabled={!length || !width}
          className="w-full h-16 bg-slate-900 text-white rounded-2xl font-extrabold uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all text-sm disabled:opacity-30"
        >
          <PlusCircle size={22} />
          Adicionar Medição
        </button>
      </div>

      {/* Added Items List */}
      {items.length > 0 && (
        <section className="flex flex-col gap-6 mt-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">Serviços Listados ({items.length})</h3>
          </div>
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={item.id}
                className="bg-white border border-slate-100 rounded-2xl p-5 flex justify-between items-center shadow-lg shadow-slate-50"
              >
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">{item.description}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {item.area.toFixed(2)}m² • R${item.unitPrice.toFixed(2)}/m²
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-black text-slate-900">R${item.total.toFixed(2)}</span>
                  <button 
                    onClick={() => onRemoveItem(item.id)}
                    className="p-2.5 text-slate-300 hover:text-error hover:bg-error-container rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Floating Action Button for Next */}
      <div className="fixed bottom-24 left-0 right-0 p-6 pointer-events-none z-40">
        <div className="max-w-3xl mx-auto flex justify-end">
          <button
            onClick={onNext}
            disabled={items.length === 0}
            className="pointer-events-auto h-20 px-10 bg-emerald-500 text-white rounded-[32px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-emerald-200 active:scale-95 disabled:opacity-0 transition-all text-sm"
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
