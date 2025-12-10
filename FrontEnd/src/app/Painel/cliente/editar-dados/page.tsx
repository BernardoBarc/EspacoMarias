"use client";
import React, { useEffect, useState } from "react";
import { apiFetch } from '../../../../lib/api';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  endereco?: string;
}

export default function EditarDados() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Novos estados para fluxo de verificação de telefone/email durante edição
  const [originalEmail, setOriginalEmail] = useState<string>("");
  const [originalPhone, setOriginalPhone] = useState<string>("");
  const [emailTempId, setEmailTempId] = useState<string | null>(null);
  const [phoneTempId, setPhoneTempId] = useState<string | null>(null);
  const [emailVerificationPending, setEmailVerificationPending] = useState(false);
  const [phoneVerificationPending, setPhoneVerificationPending] = useState(false);
  const [emailVerifiedForEdit, setEmailVerifiedForEdit] = useState(false);
  const [phoneVerifiedForEdit, setPhoneVerifiedForEdit] = useState(false);
  // inputs de código separados para fluxo inline (mais automático)
  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");

  // controle mínimo de debounce para não disparar verificação várias vezes ao digitar
  const [emailBlurTriggered, setEmailBlurTriggered] = useState(false);
  const [phoneBlurTriggered, setPhoneBlurTriggered] = useState(false);
  
  // SEGURANÇA: Estados para guardar valores verificados
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState("");

  useEffect(() => {
    fetchUserData();
  }, []);

  // Ao desfocar o input de email/phone, NÃO iniciar verificação automaticamente — o envio de código ocorrerá apenas ao salvar
  const handleEmailBlur = async () => {
    // mantemos apenas o flag de debounce; não iniciamos verificação aqui
    if (!user) return;
    if (user.email && user.email !== originalEmail && !emailVerifiedForEdit) {
      setEmailBlurTriggered(true);
    }
  };

  const handlePhoneBlur = async () => {
    if (!user) return;
    if (user.phone && user.phone !== originalPhone && !phoneVerifiedForEdit) {
      setPhoneBlurTriggered(true);
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

  const fetchUserData = async () => {
    try {
      const userId = sessionStorage.getItem('userId') || '';
      if (!userId) throw new Error('Usuário não autenticado');
      const response = await apiFetch(`api/users/users/${userId}`);
      if (!response.ok) throw new Error('Erro ao buscar dados do usuário');
      const userData = await response.json();
      setUser(userData);
      // guardar valores originais para detectar mudanças
      setOriginalEmail(userData.email || '');
      setOriginalPhone(userData.phone || '');
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar dados do usuário');
    }
  };

  // Funções do fluxo de verificação
  const startEmailVerification = async (tempId?: string) => {
    if (!user?.email) { setError('Informe um email para verificar'); return; }
    setLoading(true); setError(null);
    try {
      const body: any = { email: user.email };
      if (tempId) body.tempId = tempId;

      // DEBUG: log do body antes de enviar para ajudar a diagnosticar 400
      console.log('DEBUG startEmailVerification body', body);

      const res = await apiFetch('api/users/startEmailVerification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      // ler resposta como texto para inspecionar conteúdo mesmo em erro
      const rawText = await res.text().catch(() => '');
      console.log('DEBUG startEmailVerification raw response text', rawText, 'status', res.status);
      let parsed: any = null;
      try { parsed = rawText ? JSON.parse(rawText) : null; console.log('DEBUG startEmailVerification parsed response', parsed); } catch (err) { /* não é JSON */ }

      if (!res.ok) throw new Error((parsed && parsed.error) || rawText || `HTTP ${res.status}`);

      const data = parsed || {};
      setEmailTempId(data.tempId);
      setEmailVerificationPending(true);
      setVerifiedEmail(user.email);
      setInfo(`Código de verificação enviado para ${user.email}. ATENÇÃO: Não altere o email durante a verificação! Verifique também sua caixa de SPAM.`);
      return data;
    } catch (e: any) {
      setError(e.message || 'Erro ao iniciar verificação do email');
    } finally { setLoading(false); }
  };

  const startPhoneVerification = async (tempId?: string) => {
    if (!user?.phone) { setError('Informe um telefone para verificar'); return; }
    setLoading(true); setError(null);
    try {
      const body: any = { phone: user.phone };
      if (tempId) body.tempId = tempId;
      const res = await apiFetch('api/users/startPhoneVerification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao iniciar verificação do telefone');
      setPhoneTempId(data.tempId);
      setPhoneVerificationPending(true);
      setVerifiedPhone(user.phone);
      setInfo(`Código de verificação enviado para ${user.phone}. ATENÇÃO: Não altere o telefone durante a verificação! Verifique também sua caixa de SPAM.`);
      return data;
    } catch (e: any) {
      setError(e.message || 'Erro ao iniciar verificação do telefone');
    } finally { setLoading(false); }
  };

  // Confirmação inline de código por tipo
  const confirmEmailCode = async () => {
    if (!emailTempId) { setError('Inicie a verificação primeiro'); return; }
    if (!emailCode || emailCode.trim().length === 0) { setError('Informe o código'); return; }
    setLoading(true); setError(null);
    try {
      const res = await apiFetch('api/users/confirmEmailCode', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: emailCode, tempId: emailTempId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Código inválido');
      
      // SEGURANÇA: Salvar automaticamente o email verificado
      const emailToVerify = verifiedEmail || user?.email;
      
      try {
        const updateResponse = await apiFetch(`api/users/atualizarUser/${user?._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailToVerify }),
        });
        
        if (updateResponse.ok) {
          setEmailVerificationPending(false);
          setEmailVerifiedForEdit(false);
          setVerifiedEmail("");
          setEmailCode("");
          setEmailTempId(null);
          setSuccess('Email verificado e atualizado automaticamente com sucesso!');
          
          // Recarregar dados atualizados
          fetchUserData();
        } else {
          setError('Erro ao salvar o email verificado');
        }
      } catch (err) {
        console.error('Erro ao salvar email:', err);
        setError('Erro ao salvar o email verificado');
      }
    } catch (e: any) { setError(e.message || 'Erro ao confirmar código'); } finally { setLoading(false); }
  };

  const confirmPhoneCode = async () => {
    if (!phoneTempId) { setError('Inicie a verificação primeiro'); return; }
    if (!phoneCode || phoneCode.trim().length === 0) { setError('Informe o código'); return; }
    setLoading(true); setError(null);
    try {
      const res = await apiFetch('api/users/confirmPhoneCode', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: phoneCode, tempId: phoneTempId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Código inválido');
      
      // SEGURANÇA: Salvar automaticamente o telefone verificado
      const phoneToVerify = verifiedPhone || user?.phone;
      
      try {
        const updateResponse = await apiFetch(`api/users/atualizarUser/${user?._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phoneToVerify }),
        });
        
        if (updateResponse.ok) {
          setPhoneVerificationPending(false);
          setPhoneVerifiedForEdit(false);
          setVerifiedPhone("");
          setPhoneCode("");
          setPhoneTempId(null);
          setSuccess('Telefone verificado e atualizado automaticamente com sucesso!');
          
          // Recarregar dados atualizados
          fetchUserData();
        } else {
          setError('Erro ao salvar o telefone verificado');
        }
      } catch (err) {
        console.error('Erro ao salvar telefone:', err);
        setError('Erro ao salvar o telefone verificado');
      }
    } catch (e: any) { setError(e.message || 'Erro ao confirmar código'); } finally { setLoading(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (!user) throw new Error('Usuário não carregado');
      // Se usuário alterou email/telefone e ainda não verificou, iniciar verificação(s) agora (ao clicar em Salvar)
      const needsEmailVerification = user.email !== originalEmail && !emailVerifiedForEdit;
      const needsPhoneVerification = user.phone !== originalPhone && !phoneVerifiedForEdit;
      if (needsEmailVerification || needsPhoneVerification) {
        // iniciar as verificações necessárias apontando para o registro atual (tempId = user._id)
        try {
          if (needsEmailVerification) {
            const d = await startEmailVerification(user._id);
            if (d && d.tempId) setEmailTempId(d.tempId);
            setEmailVerificationPending(true);
          }
          if (needsPhoneVerification) {
            const d2 = await startPhoneVerification(user._id);
            if (d2 && d2.tempId) setPhoneTempId(d2.tempId);
            setPhoneVerificationPending(true);
          }
        } catch (e: any) {
          setError(e.message || 'Erro ao iniciar verificação');
          setLoading(false);
          return;
        }
        setInfo('Códigos enviados para os novos contatos. Insira-os abaixo e confirme antes de salvar.');
        setLoading(false);
        return;
      }

      const payload: any = {};
      payload.name = user.name;
      payload.endereco = user.endereco || '';
      if (user.email !== originalEmail) {
        payload.email = user.email;
        payload.emailVerified = true;
      }
      if (user.phone !== originalPhone) {
        payload.phone = user.phone;
        payload.phoneVerified = true;
      }

      // debug: log payload antes de enviar
      console.log('UPDATE payload', payload);
      const response = await apiFetch(`api/users/atualizarUser/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        // tentar ler corpo da resposta para entender o erro
        const text = await response.text().catch(() => null);
        console.error('PUT /atualizarUser failed', response.status, text);
        throw new Error(text || `Erro ao atualizar dados (status ${response.status})`);
      }
      setSuccess('Dados atualizados com sucesso!');
      // atualizar originais e flags
      setOriginalEmail(user.email || '');
      setOriginalPhone(user.phone || '');
      setEmailVerifiedForEdit(false);
      setPhoneVerifiedForEdit(false);
      setTimeout(() => {
        window.location.href = '/Painel/cliente/dados';
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar dados');
    } finally {
      setLoading(false);
    }
  };

  // limpar mensagens informativas quando usuário interage
  useEffect(() => {
    if (info) {
      const t = setTimeout(() => setInfo(null), 12000);
      return () => clearTimeout(t);
    }
  }, [info]);

  if (error) {
    return (
      <main className="min-h-screen font-sans flex flex-col bg-gradient-to-br from-[#222] to-[#111] text-white relative overflow-hidden">
        {/* Decorações de fundo */}
        <div className="absolute top-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-pink-500/10 rounded-full -translate-x-32 sm:-translate-x-48 -translate-y-32 sm:-translate-y-48 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-purple-500/10 rounded-full translate-x-32 sm:translate-x-48 translate-y-32 sm:translate-y-48 blur-3xl"></div>
        
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8 relative z-10">
          <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 backdrop-blur-xl p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl border border-red-500/20 w-full max-w-2xl">
            <div className="text-center py-6 sm:py-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                <span className="text-2xl sm:text-3xl">❌</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">✏️ Editar Meus Dados</h2>
              <p className="text-red-400 text-base sm:text-lg font-medium mb-4 sm:mb-6">{error}</p>
              <a 
                href="/Painel/cliente/dados" 
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all transform hover:scale-105 shadow-lg text-sm sm:text-base"
              >
                🔙 Voltar para Meus Dados
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen font-sans flex flex-col bg-gradient-to-br from-[#222] to-[#111] text-white relative overflow-hidden">
        {/* Decorações de fundo */}
        <div className="absolute top-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-pink-500/10 rounded-full -translate-x-32 sm:-translate-x-48 -translate-y-32 sm:-translate-y-48 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-purple-500/10 rounded-full translate-x-32 sm:translate-x-48 translate-y-32 sm:translate-y-48 blur-3xl"></div>
        
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8 relative z-10">
          <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 backdrop-blur-xl p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl border border-blue-500/20 w-full max-w-2xl">
            <div className="text-center py-6 sm:py-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-blue-500/20 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-2xl sm:text-3xl">⏳</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">✏️ Editar Meus Dados</h2>
              <p className="text-blue-400 text-base sm:text-lg font-medium">Carregando dados...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

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
              <p className="text-xs sm:text-sm text-gray-400 font-medium">Editar Dados Pessoais</p>
            </div>
          </div>

          {/* Botão de voltar */}
          <a 
            href="/Painel/cliente/dados" 
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all transform hover:scale-105 shadow-lg text-sm sm:text-base"
          >
            🔙 Voltar aos Dados
          </a>
        </div>
      </header>

      {/* Conteúdo principal */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-4 sm:py-8 relative z-10">
        <div className="bg-gradient-to-br from-[#111]/80 to-[#222]/80 backdrop-blur-xl p-4 sm:p-6 lg:p-10 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl border border-pink-500/20 relative">
          {/* Decoração interna */}
          <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-pink-500/10 rounded-full -translate-y-8 sm:-translate-y-10 translate-x-8 sm:translate-x-10"></div>
          <div className="absolute bottom-0 left-0 w-12 sm:w-16 h-12 sm:h-16 bg-purple-500/10 rounded-full translate-y-6 sm:translate-y-8 -translate-x-6 sm:-translate-x-8"></div>
          
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              ✏️ Editar Meus Dados
            </h1>
            <p className="text-center text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base">
              Altere suas informações pessoais com segurança
            </p>
            
            {/* Mensagem informativa */}
            {info && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-amber-500/20 backdrop-blur-sm border border-amber-500/50 rounded-lg sm:rounded-xl text-amber-200 text-center font-medium text-sm sm:text-base">
                ⚠️ {info}
              </div>
            )}

            <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
              {/* Campo Nome */}
              <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-4 sm:p-6 rounded-lg sm:rounded-xl border border-blue-500/30 backdrop-blur-sm">
                <label className="block text-blue-400 font-semibold mb-2 sm:mb-3 text-xs sm:text-sm flex items-center gap-2">
                  👤 Nome Completo
                </label>
                <input
                  type="text"
                  name="name"
                  value={user.name}
                  onChange={handleChange}
                  className="w-full p-3 sm:p-4 bg-white/10 backdrop-blur-sm border border-gray-600 rounded-lg sm:rounded-xl text-white focus:border-blue-500 focus:outline-none transition-colors text-sm sm:text-base"
                  required
                />
              </div>

              {/* Campo Email */}
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 sm:p-6 rounded-lg sm:rounded-xl border border-purple-500/30 backdrop-blur-sm">
                <label className="block text-purple-400 font-semibold mb-2 sm:mb-3 text-xs sm:text-sm flex items-center gap-2">
                  📧 E-mail
                </label>
                <input
                  type="email"
                  name="email"
                  value={user.email}
                  onChange={(e) => {
                    if (emailVerificationPending) {
                      setError("⚠️ Não é possível alterar o email durante a verificação. Complete a verificação primeiro!");
                      return;
                    }
                    handleChange(e);
                  }}
                  onBlur={handleEmailBlur}
                  className={`w-full p-3 sm:p-4 backdrop-blur-sm border rounded-lg sm:rounded-xl transition-colors text-sm sm:text-base ${
                    emailVerificationPending
                      ? 'bg-amber-100/20 text-amber-200 cursor-not-allowed border-amber-500'
                      : 'bg-white/10 text-white border-gray-600 focus:border-purple-500 focus:outline-none'
                  }`}
                  disabled={emailVerificationPending}
                  required
                />
                
                {emailVerificationPending ? (
                  <p className="text-amber-300 text-sm mt-2 flex items-center gap-2">
                    📮 Código enviado — verifique seu e-mail
                  </p>
                ) : user.email !== originalEmail ? (
                  <p className="text-amber-300 text-sm mt-2 flex items-center gap-2">
                    🔄 E-mail alterado. Clique em salvar para verificar
                  </p>
                ) : null}

                {emailVerificationPending && (
                  <div className="mt-4 p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                    <p className="text-amber-300 text-sm mb-3">Confirme o código enviado para: {user.email}</p>
                    <div className="flex gap-3 items-center">
                      <input
                        type="text"
                        value={emailCode}
                        onChange={e => setEmailCode(e.target.value)}
                        className="p-3 border border-amber-500 rounded-lg bg-white/10 text-white w-40 focus:border-amber-400 focus:outline-none"
                        placeholder="Código"
                      />
                      <button 
                        type="button"
                        className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none" 
                        onClick={confirmEmailCode} 
                        disabled={loading || emailCode.trim().length === 0}
                      >
                        ✅ Confirmar
                      </button>
                    </div>
                  </div>
                )}
                
                {emailVerifiedForEdit && (
                  <p className="text-emerald-400 text-sm mt-2 flex items-center gap-2">
                    ✅ E-mail verificado com sucesso
                  </p>
                )}
              </div>

              {/* Campo Telefone */}
              <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-6 rounded-xl border border-emerald-500/30 backdrop-blur-sm">
                <label className="block text-emerald-400 font-semibold mb-3 text-sm flex items-center gap-2">
                  📱 Telefone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={user.phone || ''}
                  onChange={(e) => {
                    if (phoneVerificationPending) {
                      setError("⚠️ Não é possível alterar o telefone durante a verificação. Complete a verificação primeiro!");
                      return;
                    }
                    const formatted = formatPhoneInput(e.target.value);
                    setUser(prev => prev ? { ...prev, phone: formatted } : prev);
                  }}
                  onBlur={handlePhoneBlur}
                  className={`w-full p-4 backdrop-blur-sm border rounded-xl transition-colors ${
                    phoneVerificationPending
                      ? 'bg-amber-100/20 text-amber-200 cursor-not-allowed border-amber-500'
                      : 'bg-white/10 text-white border-gray-600 focus:border-emerald-500 focus:outline-none'
                  }`}
                  disabled={phoneVerificationPending}
                />
                
                {phoneVerificationPending ? (
                  <p className="text-amber-300 text-sm mt-2 flex items-center gap-2">
                    📱 Código enviado — verifique seu SMS
                  </p>
                ) : user.phone !== originalPhone ? (
                  <p className="text-amber-300 text-sm mt-2 flex items-center gap-2">
                    🔄 Telefone alterado. Clique em salvar para verificar
                  </p>
                ) : null}

                {phoneVerificationPending && (
                  <div className="mt-4 p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                    <p className="text-amber-300 text-sm mb-3">Confirme o código enviado para: {user.phone}</p>
                    <div className="flex gap-3 items-center">
                      <input
                        type="text"
                        value={phoneCode}
                        onChange={e => setPhoneCode(e.target.value)}
                        className="p-3 border border-amber-500 rounded-lg bg-white/10 text-white w-40 focus:border-amber-400 focus:outline-none"
                        placeholder="Código"
                      />
                      <button 
                        type="button"
                        className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none" 
                        onClick={confirmPhoneCode} 
                        disabled={loading || phoneCode.trim().length === 0}
                      >
                        ✅ Confirmar
                      </button>
                    </div>
                  </div>
                )}
                
                {phoneVerifiedForEdit && (
                  <p className="text-emerald-400 text-sm mt-2 flex items-center gap-2">
                    ✅ Telefone verificado com sucesso
                  </p>
                )}
              </div>

              {/* Campo Endereço */}
              <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 p-6 rounded-xl border border-orange-500/30 backdrop-blur-sm">
                <label className="block text-orange-400 font-semibold mb-3 text-sm flex items-center gap-2">
                  🏠 Endereço
                </label>
                <input
                  type="text"
                  name="endereco"
                  value={user.endereco || ''}
                  onChange={handleChange}
                  className="w-full p-4 bg-white/10 backdrop-blur-sm border border-gray-600 rounded-xl text-white focus:border-orange-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Botão de Salvar */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-lg rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-pink-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Salvando...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    💾 Salvar Dados
                  </div>
                )}
              </button>
                </form>

            {/* Mensagens de Feedback */}
            {success && (
              <div className="mt-8 p-6 bg-green-500/20 backdrop-blur-sm border border-green-500/50 rounded-xl text-green-200 text-center font-medium">
                ✅ {success}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

