"use client";
import React, { useEffect, useState } from "react";
import ChangePasswordModal from "../../../../components/ChangePasswordModal";
import { apiFetch } from "../../../../lib/api";

interface Admin {
  _id: string;
  name: string;
  email: string;
  phone: string;
  nascimento: string;
  endereco: string;
  especialidade: string;
  photo?: string;
  instagram?: string;
  createdAt: string;
}

export default function MeusDadosAdmin() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [form, setForm] = useState<Partial<Admin>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Estados e flags para verificação
  const [originalEmail, setOriginalEmail] = useState<string | null>(null);
  const [originalPhone, setOriginalPhone] = useState<string | null>(null);
  const [emailTempId, setEmailTempId] = useState<string | null>(null);
  const [phoneTempId, setPhoneTempId] = useState<string | null>(null);
  const [emailVerificationPending, setEmailVerificationPending] = useState(false);
  const [phoneVerificationPending, setPhoneVerificationPending] = useState(false);
  const [emailVerifiedForEdit, setEmailVerifiedForEdit] = useState(false);
  const [phoneVerifiedForEdit, setPhoneVerifiedForEdit] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [info, setInfo] = useState<string>("");

  // Estados para guardar valores verificados (segurança)
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState("");

  useEffect(() => {
    fetchAdmin();
  }, []);

  const fetchAdmin = async () => {
    setLoading(true);
    try {
      const userId = sessionStorage.getItem('userId');
      if (!userId) return;
      const response = await apiFetch(`api/users/users/${userId}`);
      const data = await response.json();
      setAdmin(data);
      setForm(data);
      setPhotoPreview(data.photo || null);
      // configurar valores originais para detectar mudança
      setOriginalEmail(data.email || null);
      setOriginalPhone(data.phone || null);
      // reset flags
      setEmailVerifiedForEdit(false);
      setPhoneVerifiedForEdit(false);
      setEmailVerificationPending(false);
      setPhoneVerificationPending(false);
      setInfo("");
    } catch (err) {
      console.error("Erro ao buscar dados do admin");
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneInput = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limited = numbers.substring(0, 11);
    
    // Aplica formatação: (11) 98765-4321
    if (limited.length >= 7) {
      return `(${limited.substring(0, 2)}) ${limited.substring(2, 3)}${limited.substring(3, 7)}-${limited.substring(7)}`;
    } else if (limited.length >= 3) {
      return `(${limited.substring(0, 2)}) ${limited.substring(2)}`;
    } else if (limited.length >= 1) {
      return `(${limited}`;
    }
    
    return limited;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, photo: reader.result as string }));
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Funções de verificação
  const startEmailVerification = async (tempId?: string) => {
    if (!form.email) {
      setMessage('Informe um email válido para enviar o código.');
      return;
    }
    try {
      const targetId = tempId || admin?._id || sessionStorage.getItem('userId');
      const response = await apiFetch('api/users/startEmailVerification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, tempId: targetId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Erro ao solicitar verificação de email.');
        return;
      }
      setEmailTempId(data.tempId || targetId || null);
      setEmailVerificationPending(true);
      setVerifiedEmail(form.email); // SEGURANÇA: Guardar o email que foi enviado para verificação
      setInfo(`Código de verificação enviado para ${form.email}. Insira abaixo para confirmar.`);
    } catch (err) {
      console.error(err);
      setMessage('Erro ao solicitar verificação de email.');
    }
  };

  const confirmEmailCode = async () => {
    if (!emailTempId) return;
    try {
      const response = await apiFetch('api/users/confirmEmailCode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: emailCode, tempId: emailTempId }),
      });
      const resBody = await response.json().catch(() => null);
      if (!response.ok) {
        const text = resBody && (resBody.error || resBody.message) ? (resBody.error || resBody.message) : 'Erro ao confirmar código de email';
        setMessage(text);
        return;
      }
      
      // SEGURANÇA: Salvar automaticamente o email verificado
      const emailToVerify = verifiedEmail || form.email;
      
      // Atualizar automaticamente no backend
      try {
        const updateResponse = await apiFetch(`api/users/atualizarUser/${admin?._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailToVerify }),
        });
        
        if (updateResponse.ok) {
          setEmailVerificationPending(false);
          setEmailVerifiedForEdit(false);
          setVerifiedEmail("");
          setEmailCode("");
          setInfo('Email verificado e atualizado automaticamente com sucesso!');
          
          fetchAdmin();
        } else {
          setMessage('Erro ao salvar o email verificado');
        }
      } catch (err) {
        console.error('Erro ao salvar email:', err);
        setMessage('Erro ao salvar o email verificado');
      }
    } catch (err) {
      console.error(err);
      setMessage('Erro ao confirmar código de email.');
    }
  };

  const startPhoneVerification = async (tempId?: string) => {
    if (!form.phone) {
      setMessage('Informe um telefone válido para enviar o código.');
      return;
    }
    try {
      const targetId = tempId || admin?._id || sessionStorage.getItem('userId');
      const response = await apiFetch('api/users/startPhoneVerification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone, tempId: targetId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Erro ao solicitar verificação de telefone.');
        return;
      }
      setPhoneTempId(data.tempId || targetId || null);
      setPhoneVerificationPending(true);
      setVerifiedPhone(form.phone); // SEGURANÇA: Guardar o telefone que foi enviado para verificação
      setInfo(`Código de verificação enviado para ${form.phone}. Insira abaixo para confirmar. ATENÇÃO: Não altere o telefone durante a verificação!`);
    } catch (err) {
      console.error(err);
      setMessage('Erro ao solicitar verificação de telefone.');
    }
  };

  const confirmPhoneCode = async () => {
    if (!phoneTempId) return;
    try {
      const response = await apiFetch('api/users/confirmPhoneCode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: phoneCode, tempId: phoneTempId }),
      });
      const resBody = await response.json().catch(() => null);
      if (!response.ok) {
        const text = resBody && (resBody.error || resBody.message) ? (resBody.error || resBody.message) : 'Erro ao confirmar código de telefone';
        setMessage(text);
        return;
      }
      
      // SEGURANÇA: Salvar automaticamente o telefone verificado
      const phoneToVerify = verifiedPhone || form.phone;
      
      // Atualizar automaticamente no backend
      try {
        const updateResponse = await apiFetch(`api/users/atualizarUser/${admin?._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phoneToVerify }),
        });
        
        if (updateResponse.ok) {
          setPhoneVerificationPending(false);
          setPhoneVerifiedForEdit(false);
          setVerifiedPhone("");
          setPhoneCode("");
          setInfo('Telefone verificado e atualizado automaticamente com sucesso!');
          
          fetchAdmin();
        } else {
          setMessage('Erro ao salvar o telefone verificado');
        }
      } catch (err) {
        console.error('Erro ao salvar telefone:', err);
        setMessage('Erro ao salvar o telefone verificado');
      }
    } catch (err) {
      console.error(err);
      setMessage('Erro ao confirmar código de telefone.');
    }
  };

  const salvarAlteracoes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin) return;
    setLoading(true);

    // detectar se email/phone mudaram
    const emailChanged = Boolean(form.email && form.email !== originalEmail);
    const phoneChanged = Boolean(form.phone && form.phone !== originalPhone);

    // Se mudou e ainda não foi verificado, iniciar verificação e mostrar input de código
    if ((emailChanged && !emailVerifiedForEdit) || (phoneChanged && !phoneVerifiedForEdit)) {
      if (emailChanged && !emailVerifiedForEdit) await startEmailVerification(admin._id);
      if (phoneChanged && !phoneVerifiedForEdit) await startPhoneVerification(admin._id);
      setLoading(false);
      return;
    }

    // VALIDAÇÃO DE SEGURANÇA: verificar se dados atuais batem com os verificados
    if (emailChanged && emailVerifiedForEdit) {
      if (form.email !== verifiedEmail) {
        setMessage("Erro: o email foi alterado após a verificação. Verifique novamente.");
        setEmailVerifiedForEdit(false);
        setVerifiedEmail("");
        setLoading(false);
        return;
      }
    }

    if (phoneChanged && phoneVerifiedForEdit) {
      if (form.phone !== verifiedPhone) {
        setMessage("Erro: o telefone foi alterado após a verificação. Verifique novamente.");
        setPhoneVerifiedForEdit(false);
        setVerifiedPhone("");
        setLoading(false);
        return;
      }
    }

    // Preparar payload apenas com campos alterados (e que não dependem de verificação pendente)
    const payload: any = {};
    if (form.name) payload.name = form.name;
    if (form.endereco) payload.endereco = form.endereco;
    if (form.nascimento) payload.nascimento = form.nascimento;
    if (form.especialidade) payload.especialidade = form.especialidade;
    if (form.photo) payload.photo = form.photo;
    if (form.instagram) payload.instagram = form.instagram;
    
    // email/phone só enviar se não foram alterados ou já estiverem verificados
    if (!emailChanged) {
      // não tocar
    } else if (emailVerifiedForEdit) {
      payload.email = form.email;
    }
    if (!phoneChanged) {
      // não tocar
    } else if (phoneVerifiedForEdit) {
      payload.phone = form.phone;
    }

    // Assegurar que, se a verificação já foi confirmada durante esta sessão, o campo seja enviado
    // Usar valores verificados para segurança extra
    if (emailVerifiedForEdit && verifiedEmail) {
      payload.email = verifiedEmail;
    }
    if (phoneVerifiedForEdit && verifiedPhone) {
      payload.phone = verifiedPhone;
    }

    try {
      console.log('UPDATE payload', payload);
      const response = await apiFetch(`api/users/atualizarUser/${admin._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setMessage("Dados atualizados com sucesso!");
        // reset flags
        setEmailVerifiedForEdit(false);
        setPhoneVerifiedForEdit(false);
        setVerifiedEmail("");
        setVerifiedPhone("");
        setInfo("");
        fetchAdmin();
      } else {
        const text = await response.text();
        setMessage(text || "Erro ao atualizar dados");
      }
    } catch (err) {
      setMessage("Erro ao atualizar dados");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen font-sans flex flex-col bg-gradient-to-br from-[#222] to-[#111] text-white relative overflow-hidden">
      {/* Decorações de fundo */}
      <div className="absolute top-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-pink-500/10 rounded-full -translate-x-32 sm:-translate-x-48 -translate-y-32 sm:-translate-y-48 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-purple-500/10 rounded-full translate-x-32 sm:translate-x-48 translate-y-32 sm:translate-y-48 blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 w-48 sm:w-64 h-48 sm:h-64 bg-blue-500/5 rounded-full -translate-x-24 sm:-translate-x-32 -translate-y-24 sm:-translate-y-32 blur-2xl"></div>

      {/* Header com logo */}
      <header className="w-full py-4 sm:py-6 lg:py-8 px-4 sm:px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative group">
              {/* Glow externo animado */}
              <div className="absolute -inset-2 bg-gradient-to-r from-pink-500/40 via-purple-500/40 to-pink-500/40 rounded-2xl sm:rounded-3xl blur-lg group-hover:blur-xl transition-all duration-500 animate-pulse"></div>
              
              {/* Container principal do logo */}
              <div className="relative bg-gradient-to-br from-[#111] via-[#1a1a1a] to-[#222] p-2 sm:p-3 rounded-xl sm:rounded-2xl border-2 border-pink-400/40 group-hover:border-pink-400/70 shadow-2xl transition-all duration-500">
                {/* Reflexo interno */}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-purple-500/10 rounded-xl sm:rounded-2xl"></div>
                
                {/* Imagem do logo */}
                <div className="relative">
                  <img 
                    src="/logo.png" 
                    alt="Espaço Marias" 
                    className="w-12 h-12 sm:w-16 sm:h-16 object-contain filter drop-shadow-lg transition-all duration-500" 
                    style={{
                      filter: 'brightness(1.2) contrast(1.1) saturate(1.2) hue-rotate(10deg)'
                    }}
                  />
                </div>
                
                {/* Pontos decorativos nos cantos */}
                <div className="absolute -top-1 -left-1 w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full shadow-lg shadow-pink-500/50"></div>
                <div className="absolute -top-1 -right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full shadow-lg shadow-purple-500/50"></div>
                <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-pink-300 bg-clip-text text-transparent">
                Espaço Marias
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 font-medium">Meus Dados Pessoais</p>
            </div>
          </div>

          {/* Botão de voltar */}
          <a
            href="/home"
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center gap-2 text-sm sm:text-base"
          >
            🏠 Voltar ao Painel
          </a>
        </div>
      </header>

      {/* Conteúdo principal */}
      <section className="flex-1 px-4 sm:px-6 py-4 sm:py-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            👤 Meus Dados Pessoais
          </h1>
          <p className="text-center text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base">
            Gerencie suas informações pessoais e configurações de conta
          </p>
          {/* Container Principal Premium */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Coluna da Foto - Premium */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-[#111]/80 to-[#222]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden p-8">
                {/* Decoração interna */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-pink-500/10 rounded-full -translate-y-8 translate-x-8"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 bg-purple-500/10 rounded-full translate-y-6 -translate-x-6"></div>
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse shadow-lg shadow-pink-400/50"></div>
                    <h2 className="text-pink-400 font-bold text-xl">📸 Foto do Perfil</h2>
                  </div>
                  
                  {/* Container da foto com efeitos premium */}
                  <div className="relative group mb-6">
                    {/* Glow externo */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-blue-500/30 rounded-full blur-lg group-hover:blur-xl transition-all duration-500"></div>
                    
                    {/* Container da imagem */}
                    <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 border-4 border-white/20 overflow-hidden shadow-2xl">
                      {photoPreview ? (
                        <img 
                          src={photoPreview} 
                          alt="Foto do admin" 
                          className="object-cover w-full h-full hover:scale-105 transition-transform duration-300" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-600 to-gray-800">
                          <span className="text-white/60 text-4xl">👤</span>
                        </div>
                      )}
                      
                      {/* Overlay de hover */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">📷 Alterar</span>
                      </div>
                    </div>
                    
                    {/* Pontos decorativos */}
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full shadow-lg shadow-pink-500/50"></div>
                    <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
                  </div>
                  
                  {/* Botão de upload premium */}
                  <label className="cursor-pointer bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center gap-2">
                    📷 Alterar Foto
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  </label>
                  
                  <p className="text-gray-400 text-sm mt-3 text-center">
                    Clique para enviar uma nova foto de perfil
                  </p>
                </div>
              </div>
            </div>

            {/* Coluna do Formulário - Premium */}
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-[#111]/80 to-[#222]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden p-8">
                {/* Decoração interna */}
                <div className="absolute top-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full -translate-y-12 -translate-x-12"></div>
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-green-500/10 rounded-full translate-y-10 translate-x-10"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50"></div>
                    <h2 className="text-blue-400 font-bold text-2xl">✏️ Editar Dados Pessoais</h2>
                  </div>
                  {admin ? (
                    <form onSubmit={salvarAlteracoes} className="space-y-6">
                      {/* Primeira linha - Nome e Email */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-white font-semibold mb-2 flex items-center gap-2">
                            <span className="text-pink-400">👤</span>
                            Nome Completo
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={form.name || ""}
                            onChange={handleInputChange}
                            className="w-full p-4 border-2 border-white/20 rounded-xl bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:border-pink-400/50 focus:outline-none focus:ring-2 focus:ring-pink-400/20 transition-all"
                            placeholder="Digite seu nome completo"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-white font-semibold mb-2 flex items-center gap-2">
                            <span className="text-purple-400">📧</span>
                            Email
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="email"
                              name="email"
                              value={form.email || ""}
                              onChange={(e) => {
                                if (emailVerificationPending) {
                                  setMessage("⚠️ Não é possível alterar o email durante a verificação. Complete a verificação primeiro!");
                                  return;
                                }
                                handleInputChange(e);
                                if (emailVerifiedForEdit && e.target.value !== verifiedEmail) {
                                  setEmailVerifiedForEdit(false);
                                  setVerifiedEmail("");
                                  setMessage("Email alterado. Será necessário verificar novamente.");
                                }
                              }}
                              className={`flex-1 p-4 border-2 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 transition-all ${
                                emailVerificationPending
                                  ? 'bg-yellow-900/30 border-yellow-500 cursor-not-allowed focus:ring-yellow-400/20'
                                  : emailVerifiedForEdit && form.email === verifiedEmail 
                                  ? 'bg-green-900/30 border-green-500 focus:border-green-400/50 focus:ring-green-400/20' 
                                  : emailVerifiedForEdit && form.email !== verifiedEmail
                                  ? 'bg-red-900/30 border-red-500 focus:border-red-400/50 focus:ring-red-400/20'
                                  : 'bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm border-white/20 focus:border-purple-400/50 focus:ring-purple-400/20'
                              }`}
                              placeholder="seu.email@exemplo.com"
                              disabled={emailVerificationPending}
                              required
                            />
                            <div className="flex items-center">
                              {emailVerificationPending && (
                                <span className="text-yellow-400 text-lg">🔒</span>
                              )}
                              {emailVerifiedForEdit && form.email === verifiedEmail && (
                                <span className="text-green-400 text-lg">✅</span>
                              )}
                              {emailVerifiedForEdit && form.email !== verifiedEmail && (
                                <span className="text-red-400 text-lg">⚠️</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Segunda linha - Telefone e Data de Nascimento */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-white font-semibold mb-2 flex items-center gap-2">
                            <span className="text-blue-400">📱</span>
                            Telefone
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="tel"
                              name="phone"
                              value={form.phone || ""}
                              onChange={(e) => {
                                if (phoneVerificationPending) {
                                  setMessage("⚠️ Não é possível alterar o telefone durante a verificação. Complete a verificação primeiro!");
                                  return;
                                }
                                const formatted = formatPhoneInput(e.target.value);
                                setForm(prev => ({ ...prev, phone: formatted }));
                                if (phoneVerifiedForEdit && formatted !== verifiedPhone) {
                                  setPhoneVerifiedForEdit(false);
                                  setVerifiedPhone("");
                                  setMessage("Telefone alterado. Será necessário verificar novamente.");
                                }
                              }}
                              className={`flex-1 p-4 border-2 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 transition-all ${
                                phoneVerificationPending
                                  ? 'bg-yellow-900/30 border-yellow-500 cursor-not-allowed focus:ring-yellow-400/20'
                                  : phoneVerifiedForEdit && form.phone === verifiedPhone 
                                  ? 'bg-green-900/30 border-green-500 focus:border-green-400/50 focus:ring-green-400/20' 
                                  : phoneVerifiedForEdit && form.phone !== verifiedPhone
                                  ? 'bg-red-900/30 border-red-500 focus:border-red-400/50 focus:ring-red-400/20'
                                  : 'bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm border-white/20 focus:border-blue-400/50 focus:ring-blue-400/20'
                              }`}
                              placeholder="(11) 99999-9999"
                              disabled={phoneVerificationPending}
                            />
                            <div className="flex items-center">
                              {phoneVerificationPending && (
                                <span className="text-yellow-400 text-lg">🔒</span>
                              )}
                              {phoneVerifiedForEdit && form.phone === verifiedPhone && (
                                <span className="text-green-400 text-lg">✅</span>
                              )}
                              {phoneVerifiedForEdit && form.phone !== verifiedPhone && (
                                <span className="text-red-400 text-lg">⚠️</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-white font-semibold mb-2 flex items-center gap-2">
                            <span className="text-green-400">🎂</span>
                            Data de Nascimento
                          </label>
                          <input
                            type="date"
                            name="nascimento"
                            value={form.nascimento ? form.nascimento.split('T')[0] : ""}
                            onChange={handleInputChange}
                            className="w-full p-4 border-2 border-white/20 rounded-xl bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm text-white focus:border-green-400/50 focus:outline-none focus:ring-2 focus:ring-green-400/20 transition-all"
                          />
                        </div>
                      </div>

                      {/* Terceira linha - Especialidade */}
                      <div>
                        <label className="block text-white font-semibold mb-2 flex items-center gap-2">
                          <span className="text-yellow-400">⭐</span>
                          Especialidade
                        </label>
                        <input
                          type="text"
                          name="especialidade"
                          value={form.especialidade || ""}
                          onChange={handleInputChange}
                          className="w-full p-4 border-2 border-white/20 rounded-xl bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:border-yellow-400/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all"
                          placeholder="Ex: Alongamento de unhas, esmaltação em gel..."
                        />
                      </div>

                      {/* Quarta linha - Endereço */}
                      <div>
                        <label className="block text-white font-semibold mb-2 flex items-center gap-2">
                          <span className="text-orange-400">🏠</span>
                          Endereço
                        </label>
                        <input
                          type="text"
                          name="endereco"
                          value={form.endereco || ""}
                          onChange={handleInputChange}
                          className="w-full p-4 border-2 border-white/20 rounded-xl bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:border-orange-400/50 focus:outline-none focus:ring-2 focus:ring-orange-400/20 transition-all"
                          placeholder="Rua, número, bairro, cidade - UF"
                        />
                      </div>

                      {/* Quinta linha - Instagram */}
                      <div>
                        <label className="block text-white font-semibold mb-2 flex items-center gap-2">
                          <span className="text-pink-400">📷</span>
                          Instagram
                        </label>
                        <input
                          type="text"
                          name="instagram"
                          value={form.instagram || ""}
                          onChange={handleInputChange}
                          className="w-full p-4 border-2 border-white/20 rounded-xl bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:border-pink-400/50 focus:outline-none focus:ring-2 focus:ring-pink-400/20 transition-all"
                          placeholder="@seu_usuario_instagram"
                        />
                      </div>

                      {/* Seções de Verificação Premium */}
                      {emailVerificationPending && (
                        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-2 border-yellow-400/30 rounded-2xl p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-yellow-400 text-xl">🔐</span>
                            <h3 className="text-yellow-400 font-bold text-lg">Verificação de Email</h3>
                          </div>
                          <p className="text-yellow-300 mb-4">
                            Digite o código de verificação enviado para seu email
                          </p>
                          <div className="space-y-4">
                            <input
                              type="text"
                              value={emailCode}
                              onChange={(e) => setEmailCode(e.target.value)}
                              className="w-full p-4 border-2 border-yellow-400/30 rounded-xl bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:border-yellow-400/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all"
                              placeholder="Digite o código de 6 dígitos"
                              maxLength={6}
                            />
                            <button 
                              type="button" 
                              onClick={confirmEmailCode} 
                              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                            >
                              ✅ Confirmar Email
                            </button>
                          </div>
                        </div>
                      )}

                      {phoneVerificationPending && (
                        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-2 border-blue-400/30 rounded-2xl p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-blue-400 text-xl">📱</span>
                            <h3 className="text-blue-400 font-bold text-lg">Verificação de Telefone</h3>
                          </div>
                          <p className="text-blue-300 mb-4">
                            Digite o código de verificação enviado para seu telefone
                          </p>
                          <div className="space-y-4">
                            <input
                              type="text"
                              value={phoneCode}
                              onChange={(e) => setPhoneCode(e.target.value)}
                              className="w-full p-4 border-2 border-blue-400/30 rounded-xl bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all"
                              placeholder="Digite o código de 6 dígitos"
                              maxLength={6}
                            />
                            <button 
                              type="button" 
                              onClick={confirmPhoneCode} 
                              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                            >
                              ✅ Confirmar Telefone
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Botões de Ação Premium */}
                      <div className="space-y-4 pt-6">
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
                        >
                          {loading ? (
                            <>
                              <span className="animate-spin">💾</span>
                              Salvando...
                            </>
                          ) : (
                            <>
                              <span>💾</span>
                              Salvar Alterações
                            </>
                          )}
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setShowPasswordModal(true)}
                          className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                        >
                          <span>🔒</span>
                          Alterar Senha
                        </button>
                      </div>

                      {/* Mensagens de Status Premium */}
                      {info && (
                        <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-2 border-blue-400/50 rounded-2xl p-4 backdrop-blur-sm">
                          <div className="flex items-center gap-3">
                            <span className="text-blue-400 text-lg">ℹ️</span>
                            <p className="text-blue-300 font-medium">{info}</p>
                          </div>
                        </div>
                      )}
                      
                      {message && (
                        <div className={`border-2 rounded-2xl p-4 backdrop-blur-sm ${
                          message.includes("sucesso") 
                            ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/50" 
                            : "bg-gradient-to-r from-red-500/20 to-red-600/20 border-red-400/50"
                        }`}>
                          <div className="flex items-center gap-3">
                            <span className={`text-lg ${
                              message.includes("sucesso") ? "text-green-400" : "text-red-400"
                            }`}>
                              {message.includes("sucesso") ? "✅" : "⚠️"}
                            </span>
                            <p className={`font-medium ${
                              message.includes("sucesso") ? "text-green-300" : "text-red-300"
                            }`}>
                              {message}
                            </p>
                          </div>
                        </div>
                      )}
                    </form>
                  ) : (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl mb-4 animate-pulse">
                        <span className="text-2xl">⏳</span>
                      </div>
                      <p className="text-white text-xl font-semibold">Carregando dados...</p>
                      <p className="text-gray-300 mt-2">Aguarde um momento</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Modal de Alteração de Senha */}
      {admin && (
        <ChangePasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          userId={admin._id}
          onSuccess={() => {
            setMessage("Senha alterada com sucesso!");
            setTimeout(() => setMessage(""), 3000);
          }}
        />
      )}
    </main>
  );
}

