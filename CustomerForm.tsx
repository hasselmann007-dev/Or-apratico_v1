import { motion } from 'motion/react';
import React from 'react';
import { User, Phone, MapPin, Calendar, ArrowRight, ArrowLeft } from 'lucide-react';
import { CustomerInfo } from '../types';

interface CustomerFormProps {
  data: CustomerInfo;
  onChange: (data: CustomerInfo) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function CustomerForm({ data, onChange, onNext, onBack }: CustomerFormProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...data, [e.target.name]: e.target.value });
  };

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="flex flex-col gap-6 p-6 pb-24 max-w-3xl mx-auto w-full font-sans"
    >
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-400 shadow-sm hover:text-primary transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Dados da Obra</h2>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-2xl shadow-slate-200 p-8 flex flex-col gap-8">
        <p className="text-slate-500 text-sm font-medium">
          Preencha as informações essenciais para iniciar o orçamento do seu cliente.
        </p>

        <div className="flex flex-col gap-6">
          <div className="space-y-1.5 transition-all group">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Nome do Cliente</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
              <input
                type="text"
                name="name"
                placeholder="Ex: Ricardo Oliveira"
                value={data.name}
                onChange={handleChange}
                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-300 font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5 transition-all group">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">WhatsApp / Telefone</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
              <input
                type="tel"
                name="phone"
                placeholder="(00) 00000-0000"
                value={data.phone}
                onChange={handleChange}
                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-300 font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5 transition-all group">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">E-mail do Cliente</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <input
                type="email"
                name="email"
                placeholder="cliente@email.com"
                value={data.email}
                onChange={handleChange}
                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-300 font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5 transition-all group">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Endereço da Obra</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
              <input
                type="text"
                name="address"
                placeholder="Ex: Rua das Palmeiras, 123"
                value={data.address}
                onChange={handleChange}
                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-300 font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5 transition-all group">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Data de Início Estimada</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
              <input
                type="date"
                name="startDate"
                value={data.startDate}
                onChange={handleChange}
                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
              />
            </div>
          </div>
        </div>

        <button
          onClick={onNext}
          disabled={!data.name}
          className="w-full h-16 mt-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all text-sm"
        >
          Próximo: Adicionar Serviços
          <ArrowRight size={20} />
        </button>
      </div>
    </motion.div>
  );
}
