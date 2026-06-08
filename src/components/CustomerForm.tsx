import { motion } from 'motion/react';
import React, { useState } from 'react';
import { User, Phone, MapPin, Calendar, ArrowRight, ArrowLeft } from 'lucide-react';
import { CustomerInfo } from '../types';

interface CustomerFormProps {
  data: CustomerInfo;
  onChange: (data: CustomerInfo) => void;
  onNext: () => void;
  onBack: () => void;
}

// RFC 5322 Email Validation Regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export default function CustomerForm({ data, onChange, onNext, onBack }: CustomerFormProps) {
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({});
  const [phoneDisplay, setPhoneDisplay] = useState(formatPhone(data.phone || ''));

  function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length === 0) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, control keys, and arrows
    if (
      [46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (e.ctrlKey === true && [65, 67, 86, 88].indexOf(e.keyCode) !== -1) ||
      // Allow: home, end, left, right, up, down
      (e.keyCode >= 35 && e.keyCode <= 40)
    ) {
      return;
    }
    // Ensure that it is a number and stop the keypress if it is not
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const digitsOnly = rawValue.replace(/\D/g, '').slice(0, 11);
    const formatted = formatPhone(digitsOnly);
    setPhoneDisplay(formatted);
    onChange({ ...data, phone: digitsOnly }); // Save only clean digits in DB payload

    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: undefined }));
    }
  };

  const handlePhonePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const digitsOnly = pastedText.replace(/\D/g, '').slice(0, 11);
    const formatted = formatPhone(digitsOnly);
    setPhoneDisplay(formatted);
    onChange({ ...data, phone: digitsOnly });

    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: undefined }));
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...data, name: e.target.value });
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: undefined }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...data, [e.target.name]: e.target.value });
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...data, email: e.target.value });
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  const handleEmailBlur = () => {
    const emailValue = data.email.trim();
    if (emailValue) {
      const lowercased = emailValue.toLowerCase();
      onChange({ ...data, email: lowercased }); // Auto-lowercase before sending
      if (!EMAIL_REGEX.test(lowercased)) {
        setErrors(prev => ({ ...prev, email: 'Por favor, insira um e-mail válido.' }));
      } else {
        setErrors(prev => ({ ...prev, email: undefined }));
      }
    } else {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  const handleNameBlur = () => {
    const trimmed = data.name.trim();
    onChange({ ...data, name: trimmed });
    if (!trimmed) {
      setErrors(prev => ({ ...prev, name: 'Este campo é obrigatório.' }));
    }
  };

  const handlePhoneBlur = () => {
    const trimmed = data.phone.trim();
    if (!trimmed) {
      setErrors(prev => ({ ...prev, phone: 'Este campo é obrigatório.' }));
    } else if (trimmed.length < 10) {
      setErrors(prev => ({ ...prev, phone: 'O telefone deve ter pelo menos 10 dígitos.' }));
    }
  };

  const handleNextStep = () => {
    const newErrors: { name?: string; phone?: string; email?: string } = {};

    // Strict leading/trailing whitespace checks
    const trimmedName = data.name.trim();
    const trimmedPhone = data.phone.trim();
    const trimmedEmail = data.email.trim();

    if (!trimmedName) {
      newErrors.name = 'Este campo é obrigatório.';
    }
    if (!trimmedPhone) {
      newErrors.phone = 'Este campo é obrigatório.';
    } else if (trimmedPhone.length < 10) {
      newErrors.phone = 'O telefone deve ter pelo menos 10 dígitos.';
    }
    if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
      newErrors.email = 'Por favor, insira um e-mail válido.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Pass normalized/trimmed data forward
    onChange({
      ...data,
      name: trimmedName,
      phone: trimmedPhone,
      email: trimmedEmail.toLowerCase(),
    });
    onNext();
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
          {/* Nome */}
          <div className="space-y-1.5 transition-all group animate-fade-in">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Nome do Cliente</label>
            <div className="relative">
              <User className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors",
                errors.name && "text-red-400"
              )} size={20} />
              <input
                type="text"
                name="name"
                placeholder="Ex: Ricardo Oliveira"
                value={data.name}
                onChange={handleNameChange}
                onBlur={handleNameBlur}
                className={cn(
                  "w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:ring-0 focus:border-primary outline-none transition-all placeholder:text-slate-300 font-medium",
                  errors.name && "bg-red-50/20 border-red-200 focus:border-red-500"
                )}
              />
            </div>
            {errors.name && (
              <p className="text-[10px] font-bold text-red-500 ml-1">{errors.name}</p>
            )}
          </div>

          {/* WhatsApp / Telefone */}
          <div className="space-y-1.5 transition-all group">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">WhatsApp / Telefone</label>
            <div className="relative">
              <Phone className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors",
                errors.phone && "text-red-400"
              )} size={20} />
              <input
                type="tel"
                name="phone"
                placeholder="(00) 00000-0000"
                value={phoneDisplay}
                onKeyDown={handlePhoneKeyDown}
                onChange={handlePhoneChange}
                onPaste={handlePhonePaste}
                onBlur={handlePhoneBlur}
                className={cn(
                  "w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:ring-0 focus:border-primary outline-none transition-all placeholder:text-slate-300 font-medium",
                  errors.phone && "bg-red-50/20 border-red-200 focus:border-red-500"
                )}
              />
            </div>
            {errors.phone && (
              <p className="text-[10px] font-bold text-red-500 ml-1">{errors.phone}</p>
            )}
          </div>

          {/* E-mail */}
          <div className="space-y-1.5 transition-all group">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">E-mail do Cliente</label>
            <div className="relative">
              <div className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors",
                errors.email && "text-red-400"
              )}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <input
                type="email"
                name="email"
                placeholder="cliente@email.com"
                value={data.email}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                className={cn(
                  "w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:ring-0 focus:border-primary outline-none transition-all placeholder:text-slate-300 font-medium",
                  errors.email && "bg-red-50/20 border-red-200 focus:border-red-500"
                )}
              />
            </div>
            {errors.email && (
              <p className="text-[10px] font-bold text-red-500 ml-1">{errors.email}</p>
            )}
          </div>

          {/* Endereço */}
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

          {/* Data */}
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
          onClick={handleNextStep}
          className="w-full h-16 mt-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-slate-200 active:scale-95 transition-all text-sm hover:bg-slate-800"
        >
          Próximo: Adicionar Serviços
          <ArrowRight size={20} />
        </button>
      </div>
    </motion.div>
  );
}

// Utility to apply classes conditionally
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
