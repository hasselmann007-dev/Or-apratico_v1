import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { 
  User, 
  FileText, 
  Phone, 
  Upload, 
  Trash2, 
  Check, 
  AlertCircle, 
  Loader2, 
  ArrowLeft,
  Briefcase,
  LogOut
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ProfileSettingsProps {
  userId: string;
  onBack: () => void;
  onLogout: () => void;
}

interface Profile {
  id: string;
  nome: string;
  email: string | null;
  documento: string | null;
  telefone: string | null;
  termos_padrao: string | null;
  logo_url: string | null;
}

export default function ProfileSettings({ userId, onBack, onLogout }: ProfileSettingsProps) {
  const [profile, setProfile] = useState<Profile>({
    id: userId,
    nome: '',
    email: '',
    documento: '',
    telefone: '',
    termos_padrao: '',
    logo_url: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phoneDisplay, setPhoneDisplay] = useState('');

  function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length === 0) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      [46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
      (e.ctrlKey === true && [65, 67, 86, 88].indexOf(e.keyCode) !== -1) ||
      (e.keyCode >= 35 && e.keyCode <= 40)
    ) {
      return;
    }
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const digitsOnly = rawValue.replace(/\D/g, '').slice(0, 11);
    const formatted = formatPhone(digitsOnly);
    setPhoneDisplay(formatted);
    setProfile(prev => ({ ...prev, telefone: digitsOnly }));
  };

  const handlePhonePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const digitsOnly = pastedText.replace(/\D/g, '').slice(0, 11);
    const formatted = formatPhone(digitsOnly);
    setPhoneDisplay(formatted);
    setProfile(prev => ({ ...prev, telefone: digitsOnly }));
  };

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('perfis_profissionais')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            console.log('Profile not found, will upsert on save.');
          } else {
            throw error;
          }
        }

        if (data) {
          setProfile({
            id: userId,
            nome: data.nome || '',
            email: data.email || '',
            documento: data.documento || '',
            telefone: data.telefone || '',
            termos_padrao: data.termos_padrao || '',
            logo_url: data.logo_url || ''
          });
          setPhoneDisplay(formatPhone(data.telefone || ''));
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setErrorMsg('Erro ao carregar dados do perfil.');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [userId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    
    // Strict empty validation
    const trimmedNome = profile.nome.trim();
    if (!trimmedNome) {
      setErrorMsg('O nome profissional é obrigatório.');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('perfis_profissionais')
        .upsert({
          id: userId,
          nome: trimmedNome,
          documento: profile.documento ? profile.documento.trim() : null,
          telefone: profile.telefone ? profile.telefone.trim() : null,
          termos_padrao: profile.termos_padrao,
          logo_url: profile.logo_url
        });

      if (error) throw error;
      setSuccessMsg('Configurações salvas com sucesso!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setErrorMsg(err.message || 'Erro ao salvar perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('A imagem deve ter no máximo 2MB.');
      return;
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      setErrorMsg('O arquivo deve ser uma imagem (PNG, JPG, etc.).');
      return;
    }

    setErrorMsg(null);
    setUploadingLogo(true);

    try {
      // Build safe filename with timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('logos-usuarios')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('logos-usuarios')
        .getPublicUrl(filePath);

      // Update local state and database
      setProfile(prev => ({ ...prev, logo_url: publicUrl }));
      
      // Update immediately in database
      const { error: updateError } = await supabase
        .from('perfis_profissionais')
        .update({ logo_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;
      setSuccessMsg('Logo enviada e salva!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Error uploading logo:', err);
      setErrorMsg(err.message || 'Erro ao enviar logotipo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    setErrorMsg(null);
    setUploadingLogo(true);

    try {
      // Set logo_url to empty string in state and db
      setProfile(prev => ({ ...prev, logo_url: '' }));

      const { error } = await supabase
        .from('perfis_profissionais')
        .update({ logo_url: null })
        .eq('id', userId);

      if (error) throw error;
      setSuccessMsg('Logotipo removido.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Error removing logo:', err);
      setErrorMsg('Erro ao remover logotipo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center items-center gap-3">
        <Loader2 className="animate-spin text-primary" size={36} />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="flex flex-col gap-6 p-6 pb-40 max-w-3xl mx-auto w-full font-sans"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-400 shadow-sm hover:text-primary transition-colors touch-target"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Configurações</h2>
            <p className="text-xs text-slate-400 mt-0.5">Gerencie seu perfil e dados padrão</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-100 bg-red-50/50 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 transition-all touch-target"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-2xl shadow-slate-200/50 p-8 flex flex-col gap-8 relative overflow-hidden">
        {/* Banner Messages */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-error-container text-error rounded-2xl border border-red-100 flex items-start gap-3"
            >
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
              <span className="text-xs font-semibold leading-relaxed">{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-secondary-container text-on-secondary-container rounded-2xl border border-emerald-100 flex items-start gap-3"
            >
              <Check className="shrink-0 mt-0.5 text-secondary" size={18} />
              <span className="text-xs font-semibold leading-relaxed">{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section: Logotipo */}
        <div className="flex flex-col gap-4">
          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Logotipo da Empresa</label>
          <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200">
            {profile.logo_url ? (
              <div className="relative group">
                <img 
                  src={profile.logo_url} 
                  alt="Logo da empresa" 
                  className="w-28 h-28 object-contain bg-white rounded-2xl border border-slate-100 p-2 shadow-sm"
                />
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  disabled={uploadingLogo}
                  className="absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-transform active:scale-90"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <div className="w-28 h-28 bg-slate-100 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-1">
                <Briefcase size={28} className="opacity-60" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Sem Logo</span>
              </div>
            )}

            <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left gap-2">
              <h4 className="text-sm font-extrabold text-slate-700">Envie seu logotipo</h4>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">Formatos suportados: PNG, JPG ou WEBP. Tamanho máximo recomendado de 2MB. Aparecerá em seus PDFs.</p>
              
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
                className="h-10 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-sm transition-all active:scale-95 touch-target mt-1"
              >
                {uploadingLogo ? (
                  <Loader2 className="animate-spin text-slate-500" size={16} />
                ) : (
                  <Upload size={16} />
                )}
                {uploadingLogo ? 'Enviando...' : 'Selecionar Imagem'}
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-6">
          {/* Section: Informações do Profissional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Nome Profissional / Empresa</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="text"
                  required
                  placeholder="Nome completo ou Razão Social"
                  value={profile.nome}
                  onChange={(e) => setProfile({ ...profile, nome: e.target.value })}
                  className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">CNPJ / CPF</label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="text"
                  placeholder="Ex: 00.000.000/0001-00"
                  value={profile.documento || ''}
                  onChange={(e) => setProfile({ ...profile, documento: e.target.value })}
                  className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Telefone de Contato</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={phoneDisplay}
                  onKeyDown={handlePhoneKeyDown}
                  onChange={handlePhoneChange}
                  onPaste={handlePhonePaste}
                  className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">E-mail (Não editável)</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="email"
                  disabled
                  value={profile.email || ''}
                  className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 outline-none cursor-not-allowed text-sm font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section: Termos Padrão */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Termos e Condições Padrão do PDF</label>
            <textarea
              rows={6}
              placeholder="Digite aqui as cláusulas que sempre aparecerão nos orçamentos (ex: validade da proposta, formas de pagamento, etc)..."
              value={profile.termos_padrao || ''}
              onChange={(e) => setProfile({ ...profile, termos_padrao: e.target.value })}
              className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-medium leading-relaxed resize-y"
            />
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-extrabold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all text-xs disabled:opacity-50 mt-4 active:scale-95 touch-target"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Check size={16} />
            )}
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
