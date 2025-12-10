"use client";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
import React, { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiFetch, apiUrl } from '../../../lib/api';

function VerifyPageContent() {
  const search = useSearchParams();
  const router = useRouter();
  const tempId = search.get("tempId");
  const initialStep = (search.get("step") as "phone" | "email") || "phone";

  // Função para formatar telefone para exibição
  const formatPhoneForDisplay = (phone: string) => {
    if (!phone) return '';
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length === 11) {
      return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 3)}${numbers.substring(3, 7)}-${numbers.substring(7)}`;
    }
    return phone;
  };

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<"phone" | "email">(initialStep);

  const [user, setUser] = useState<any>(null);

  // inputs
  const [phoneCode, setPhoneCode] = useState("");
  const [emailVal, setEmailVal] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  // estados para guardar valores verificados (segurança)
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");

  // cooldowns para reenvio
  const [phoneCooldown, setPhoneCooldown] = useState<number>(0);
  const [emailCooldown, setEmailCooldown] = useState<number>(0);

  useEffect(() => {
    if (!tempId) return;
    // carregar dados pendentes do sessionStorage
    try {
      const pendingRaw = sessionStorage.getItem('pendingRegistration');
      if (pendingRaw) {
        const pending = JSON.parse(pendingRaw);
        if (pending.tempId === tempId) {
          if (pending.email) setEmailVal(pending.email);
          if (pending.name) setName(pending.name);
          if (pending.password) setPassword(pending.password);
          // inicializar cooldowns se houver timestamps
          if (pending.phoneSentAt) {
            const elapsed = Math.floor((Date.now() - pending.phoneSentAt) / 1000);
            const rem = Math.max(0, 60 - elapsed);
            if (rem > 0) setPhoneCooldown(rem);
          }
          if (pending.emailSentAt) {
            const elapsedE = Math.floor((Date.now() - pending.emailSentAt) / 1000);
            const remE = Math.max(0, 60 - elapsedE);
            if (remE > 0) setEmailCooldown(remE);
          }
        }
      }
    } catch (e) {}
    fetchTemp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempId]);

  // gerenciar decremento de cooldowns
  useEffect(() => {
    let t: any;
    if (phoneCooldown > 0) {
      t = setInterval(() => setPhoneCooldown(c => Math.max(0, c - 1)), 1000);
    }
    return () => clearInterval(t);
  }, [phoneCooldown]);

  useEffect(() => {
    let t: any;
    if (emailCooldown > 0) {
      t = setInterval(() => setEmailCooldown(c => Math.max(0, c - 1)), 1000);
    }
    return () => clearInterval(t);
  }, [emailCooldown]);

  async function fetchTemp() {
    try {
      // Verificar se é um tempId simulado (número já cadastrado)
      if (tempId?.includes('simulated')) {
        setMessage("⚠️ Este número já está cadastrado. Use um número diferente.");
        setUser({ 
          phone: 'Número já cadastrado', 
          phoneVerified: false, 
          emailVerified: false,
          email: 'temp_email'
        });
        return;
      }

      const res = await apiFetch(`api/users/user/${tempId}`);
      if (!res.ok) {
        setMessage("Não foi possível carregar o registro temporário. Reinicie o fluxo.");
        return;
      }
      const data = await res.json();
      setUser(data);
      // preencher emailVal se houver
      if (data.email && !String(data.email).startsWith("temp_")) setEmailVal(data.email);
      if (data.name && data.name !== "temp") setName(data.name);
      
      // SINCRONIZAR estado local com verificações do servidor
      if (data.phoneVerified && data.phone && !verifiedPhone) {
        console.log("Sincronizando telefone verificado do servidor:", data.phone);
        setVerifiedPhone(data.phone);
      }
      if (data.emailVerified && data.email && !String(data.email).startsWith("temp_") && !verifiedEmail) {
        console.log("Sincronizando email verificado do servidor:", data.email);
        setVerifiedEmail(data.email);
        setEmailVal(data.email);
      }
    } catch (e) {
      console.error(e);
      setMessage("Erro ao buscar dados do servidor");
    }
  }

  async function handleConfirmPhone() {
    if (!tempId) return setMessage("TempId ausente");
    
    // Verificar se é um tempId simulado (duplicata detectada)
    if (tempId.startsWith('simulated_')) {
      setMessage("⚠️ Este telefone já está cadastrado. Use um telefone diferente para se registrar.");
      return;
    }
    
    if (!phoneCode) return setMessage("Informe o código SMS");
    setLoading(true);
    setMessage("");
    try {
      const phoneToVerify = user?.phone || user?.phonePending || "";
      const res = await apiFetch("api/users/confirmPhoneCode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempId, code: phoneCode }),
      });
      const data = await res.json();
      if (!res.ok) return setMessage(data.error || "Erro ao confirmar telefone");
      setMessage("Telefone verificado com sucesso.");
      // IMPORTANTE: salvar telefone verificado ANTES de atualizar user
      setVerifiedPhone(phoneToVerify);
      console.log("Telefone verificado salvo:", phoneToVerify); // Debug
      // atualizar user
      await fetchTemp();
      // seguir para etapa de email
      setStep("email");

      // se já tivermos um email preenchido (do sessionStorage ou do usuário), iniciar automaticamente a verificação de email
      const autoEmail = (emailVal && emailVal.trim() !== '') || (user && user.email && !String(user.email).startsWith('temp_'));
      if (autoEmail) {
        // aguardar pequeno delay para o usuário perceber a mudança de etapa
        setTimeout(() => {
          handleStartEmail();
        }, 600);
      }
    } catch (e) {
      console.error(e);
      setMessage("Erro de rede ao confirmar telefone");
    } finally {
      setLoading(false);
    }
  }

  async function handleStartEmail() {
    if (!tempId) return setMessage("TempId ausente");
    if (!emailVal) return setMessage("Informe o email para verificação");
    setLoading(true);
    setMessage("");
    try {
      const res = await apiFetch("api/users/startEmailVerification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempId, email: emailVal, phone: user?.phone || "" }),
      });
      const data = await res.json();
      if (!res.ok) return setMessage(data.error || "Erro ao iniciar verificação de email");
      
      // Verificar se retornou um tempId simulado (email ou telefone já cadastrado)
      if (data && data.tempId && data.tempId.startsWith('simulated_')) {
        setMessage("⚠️ Este email ou telefone já está cadastrado. Use dados diferentes para se registrar.");
        return;
      }
      
      setMessage("Código de verificação enviado por email (verifique sua caixa SPAM).");
      // salvar timestamp de envio em sessionStorage para controlar reenvio
      try {
        const pendingRaw = sessionStorage.getItem('pendingRegistration');
        const pending = pendingRaw ? JSON.parse(pendingRaw) : {};
        pending.tempId = tempId;
        pending.email = emailVal;
        pending.emailSentAt = Date.now();
        sessionStorage.setItem('pendingRegistration', JSON.stringify(pending));
        setEmailCooldown(60);
      } catch (e) {}
      await fetchTemp();
      setStep("email");
    } catch (e) {
      console.error(e);
      setMessage("Erro de rede ao iniciar verificação de email");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmEmail() {
    if (!tempId) return setMessage("TempId ausente");
    
    // Verificar se é um tempId simulado (duplicata detectada)
    if (tempId.startsWith('simulated_')) {
      setMessage("⚠️ Este email ou telefone já está cadastrado. Use dados diferentes para se registrar.");
      return;
    }
    
    if (!emailCode) return setMessage("Informe o código recebido por email");
    setLoading(true);
    setMessage("");
    try {
      const emailToVerify = emailVal;
      const res = await apiFetch("api/users/confirmEmailCode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempId, code: emailCode }),
      });
      const data = await res.json();
      if (!res.ok) return setMessage(data.error || "Erro ao confirmar email");
      setMessage("Email verificado com sucesso.");
      // IMPORTANTE: salvar email verificado ANTES de qualquer operação
      setVerifiedEmail(emailToVerify);
      console.log("Email verificado salvo:", emailToVerify); // Debug
      
      await fetchTemp();
      
      setTimeout(async () => {
        await fetchTemp();
        
        setMessage("Finalizando cadastro...");
        
        setTimeout(() => {
          handleFinalize();
        }, 300);
      }, 700);
    } catch (e) {
      console.error(e);
      setMessage("Erro de rede ao confirmar email");
    } finally {
      setLoading(false);
    }
  }

  // reenvio de SMS
  async function handleResendPhone() {
    if (!tempId) return setMessage("TempId ausente");
    if (phoneCooldown > 0) return setMessage(`Aguarde ${phoneCooldown}s para reenviar`);
    setLoading(true);
    setMessage("");
    try {
      const res = await apiFetch("api/users/resendPhoneCode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempId }),
      });
      const data = await res.json();
      if (!res.ok) return setMessage(data.error || "Erro ao reenviar código SMS");
      setMessage("Código SMS reenviado com sucesso! (verifique sua caixa de SPAM)");
      setPhoneCooldown(60);
      try {
        const pendingRaw = sessionStorage.getItem('pendingRegistration');
        const pending = pendingRaw ? JSON.parse(pendingRaw) : {};
        pending.tempId = tempId;
        pending.phone = user?.phone || user?.phonePending || pending.phone;
        pending.phoneSentAt = Date.now();
        sessionStorage.setItem('pendingRegistration', JSON.stringify(pending));
      } catch (e) {}
      await fetchTemp();
    } catch (e) {
      console.error(e);
      setMessage("Erro de rede ao reenviar SMS");
    } finally {
      setLoading(false);
    }
  }

  // reenvio de Email
  async function handleResendEmail() {
    if (!tempId) return setMessage("TempId ausente");
    if (emailCooldown > 0) return setMessage(`Aguarde ${emailCooldown}s para reenviar`);
    setLoading(true);
    setMessage("");
    try {
      const res = await apiFetch("api/users/startEmailVerification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempId, email: emailVal, phone: user?.phone || "" }),
      });
      const data = await res.json();
      if (!res.ok) return setMessage(data.error || "Erro ao reenviar código de email");
      setMessage("Código de verificação reenviado por email (verifique sua caixa SPAM).");
      setEmailCooldown(60);
      try {
        const pendingRaw = sessionStorage.getItem('pendingRegistration');
        const pending = pendingRaw ? JSON.parse(pendingRaw) : {};
        pending.tempId = tempId;
        pending.email = emailVal || pending.email;
        pending.emailSentAt = Date.now();
        sessionStorage.setItem('pendingRegistration', JSON.stringify(pending));
      } catch (e) {}
      await fetchTemp();
    } catch (e) {
      console.error(e);
      setMessage("Erro de rede ao reenviar email");
    } finally {
      setLoading(false);
    }
  }


  async function handleFinalize() {
    if (!tempId) return setMessage("TempId ausente");

    let freshData = user;
    
    try {
      const res = await apiFetch(`api/users/user/${tempId}`);
      if (res.ok) {
        freshData = await res.json();
        setUser(freshData);
      }
    } catch (e) {
      console.error("Erro ao buscar dados frescos:", e);
    }
    
    const currentPhone = freshData?.phone || freshData?.phonePending || "";
    const currentEmail = freshData?.email || emailVal || "";
    
    console.log("Debug - Estado servidor (fresh):", { phoneVerified: freshData?.phoneVerified, emailVerified: freshData?.emailVerified }); // Debug
    console.log("Debug - Valores atuais (fresh):", { currentPhone, currentEmail }); // Debug
    
    // Verificar se ambos estão verificados no servidor (fonte de verdade principal)
    if (!freshData?.phoneVerified || !freshData?.emailVerified) {
      console.error("Erro de verificação servidor (fresh):", { 
        phoneVerified: freshData?.phoneVerified, 
        emailVerified: freshData?.emailVerified
      }); // Debug
      return setMessage(`Erro: aguardando sincronização das verificações. Tel: ${freshData?.phoneVerified ? 'OK' : 'Aguardando'}, Email: ${freshData?.emailVerified ? 'OK' : 'Aguardando'}`);
    }

    // Usar valores do servidor (já verificados neste ponto)
    const finalPhone = currentPhone;
    const finalEmail = currentEmail;

    // tentar obter nome/senha do estado, se não houver, do pendingRegistration
    let finalName = name;
    let finalPassword = password;
    if ((!finalName || !finalPassword) || finalPassword.length < 6) {
      try {
        const pendingRaw = sessionStorage.getItem('pendingRegistration');
        if (pendingRaw) {
          const pending = JSON.parse(pendingRaw);
          if (!finalName && pending.name) finalName = pending.name;
          if ((!finalPassword || finalPassword.length < 6) && pending.password) finalPassword = pending.password;
        }
      } catch (e) {}
    }

    if (!finalName) {
      console.error("Nome ausente na finalização:", { name, finalName }); // Debug
      return setMessage("Nome ausente. Volte ao registro e informe seu nome.");
    }
    if (!finalPassword || finalPassword.length < 6) {
      console.error("Senha ausente na finalização:", { password: password?.length, finalPassword: finalPassword?.length }); // Debug
      return setMessage("Senha inválida. Volte ao registro e informe uma senha com ao menos 6 caracteres.");
    }

    console.log("Finalizando com dados:", { finalName, finalEmail, finalPhone, passwordLength: finalPassword?.length }); // Debug

    setLoading(true);
    setMessage("");
    try {
      const res = await apiFetch("api/users/CriarUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // usar valores finais verificados (servidor ou local)
        body: JSON.stringify({ tempId, name: finalName, email: finalEmail, phone: finalPhone, password: finalPassword }),
      });
      const data = await res.json();
      if (!res.ok) return setMessage(data.error || "Erro ao criar usuário");
      // limpar pendingRegistration de ambos storages e localStorage específico
      try { 
        sessionStorage.removeItem('pendingRegistration');
        // limpar também do localStorage
        const keys = Object.keys(localStorage).filter(key => key.startsWith('pendingRegistration_'));
        keys.forEach(key => localStorage.removeItem(key));
      } catch (e) {}
      setMessage("Conta criada com sucesso. Redirecionando para login...");
      setTimeout(() => router.push('/login'), 1500);
    } catch (e) {
      console.error(e);
      setMessage("Erro de rede ao criar conta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen font-sans flex flex-col items-center justify-between bg-gradient-to-br from-[#222] to-[#111] text-white relative overflow-hidden">
      {/* Decorações de fundo */}
      <div className="absolute top-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-pink-500/10 rounded-full -translate-x-32 sm:-translate-x-48 -translate-y-32 sm:-translate-y-48 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-purple-500/10 rounded-full translate-x-32 sm:translate-x-48 translate-y-32 sm:translate-y-48 blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 w-48 sm:w-64 h-48 sm:h-64 bg-blue-500/5 rounded-full -translate-x-24 sm:-translate-x-32 -translate-y-24 sm:-translate-y-32 blur-2xl"></div>

      {/* Header com logo */}
      <header className="w-full py-4 sm:py-6 lg:py-8 px-4 sm:px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex justify-center">
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
              <p className="text-xs sm:text-sm text-gray-400 font-medium">Beleza & Bem-estar</p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 relative z-10 w-full">
        <div className="bg-gradient-to-br from-[#111]/80 to-[#222]/80 backdrop-blur-xl p-5 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl border border-pink-500/20 relative">
          {/* Decoração interna */}
          <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-pink-500/10 rounded-full -translate-y-8 sm:-translate-y-10 translate-x-8 sm:translate-x-10"></div>
          <div className="absolute bottom-0 left-0 w-12 sm:w-16 h-12 sm:h-16 bg-purple-500/10 rounded-full translate-y-6 sm:translate-y-8 -translate-x-6 sm:-translate-x-8"></div>
          
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-4 sm:mb-6 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              🔐 Verificação de Conta
            </h1>
            {!tempId && (
              <div className="bg-red-500/20 border-2 border-red-500/40 rounded-lg sm:rounded-xl p-4 sm:p-6 text-center backdrop-blur-sm">
                <p className="text-red-300 font-medium text-sm sm:text-base">⚠️ ID de verificação ausente. Volte ao registro e reinicie o processo.</p>
                <button
                  onClick={() => router.push('/registro')}
                  className="mt-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm sm:text-base"
                >
                  Voltar ao Registro
                </button>
              </div>
            )}

            {tempId && (
              <div>
                <p className="text-center text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base">
                  Complete a verificação em duas etapas para finalizar seu cadastro
                </p>

                {/* Alerta para dados duplicados */}
                {tempId?.includes('simulated') && (
                  <div className="bg-red-500/20 border-2 border-red-500/40 rounded-lg sm:rounded-xl p-4 sm:p-6 text-center backdrop-blur-sm mb-6">
                    <div className="text-3xl sm:text-4xl mb-3">⚠️</div>
                    <h3 className="text-lg sm:text-xl font-bold text-yellow-300 mb-2">Dados Já Cadastrados</h3>
                    <p className="text-gray-300 text-xs sm:text-sm mb-4">Este telefone ou email já está sendo usado por outra conta.</p>
                    <button
                      onClick={() => router.push('/registro')}
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all transform hover:scale-105 text-sm sm:text-base"
                    >
                      Usar Dados Diferentes
                    </button>
                  </div>
                )}

                {step === 'phone' && (
                  <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 p-4 sm:p-6 lg:p-8 rounded-lg sm:rounded-xl border border-blue-500/30 backdrop-blur-sm">
                    <div className="flex items-center justify-center mb-4 sm:mb-6">
                      <div className="text-3xl sm:text-4xl mr-2 sm:mr-3">📱</div>
                      <h3 className="text-lg sm:text-xl font-bold text-white">Verificação de Telefone</h3>
                    </div>
                    
                    <p className="text-center text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
                      Enviamos um código SMS para o seu número de telefone
                    </p>

                    {/* Campo telefone com status */}
                    <div className="bg-gradient-to-r from-[#222] to-[#333] p-3 sm:p-4 rounded-lg sm:rounded-xl mb-4 sm:mb-6 border border-blue-500/20">
                      <label className="block text-blue-400 font-semibold mb-2 text-sm sm:text-base">📞 Telefone Cadastrado</label>
                      <div className="flex items-center justify-between bg-white/5 p-3 sm:p-4 rounded-lg border border-gray-600">
                        {tempId?.includes('simulated') ? (
                          <span className="text-yellow-300 text-sm sm:text-base">⚠️ Número já cadastrado</span>
                        ) : (
                          <span className="text-white text-base sm:text-lg font-semibold">{formatPhoneForDisplay(user?.phone || user?.phonePending || '') || '—'}</span>
                        )}
                      </div>
                      
                      {tempId?.includes('simulated') ? (
                        <button 
                          onClick={() => router.push('/registro')}
                          className="w-full mt-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-2.5 sm:py-3 px-4 rounded-lg sm:rounded-xl transition-all transform hover:scale-105 text-sm sm:text-base"
                        >
                          🔙 Usar Número Diferente
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            const novoTelefone = prompt("Digite o novo número de telefone (DDD + 9 + número, ex: 11987654321):", user?.phone || "");
                            if (novoTelefone && novoTelefone.trim() !== "") {
                              // Validar formato do telefone brasileiro
                              const normalized = novoTelefone.replace(/\D/g, '');
                              
                              if (normalized.length !== 11) {
                                alert("Telefone deve ter 11 dígitos (DDD + 9 + número).");
                                return;
                              }
                              
                              if (normalized.charAt(2) !== '9') {
                                alert("O terceiro dígito deve ser 9 (celular).");
                                return;
                              }
                              
                              const ddd = normalized.substring(0, 2);
                              if (parseInt(ddd) < 11 || parseInt(ddd) > 99) {
                                alert("DDD inválido. Digite um DDD entre 11 e 99.");
                                return;
                              }
                              
                              setUser((prev: any) => ({...prev, phone: normalized, phonePending: normalized}));
                              setTimeout(() => {
                                handleResendPhone();
                                setMessage("Código SMS enviado para o novo número (verifique sua caixa SPAM).");
                              }, 100);
                            }
                          }}
                          disabled={loading}
                          className="w-full mt-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-2.5 sm:py-3 px-4 rounded-lg sm:rounded-xl transition-all transform hover:scale-105 disabled:hover:scale-100 text-sm sm:text-base"
                        >
                          ✏️ Editar Telefone
                        </button>
                      )}
                    </div>

                    {!tempId?.includes('simulated') && (
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <label className="block text-pink-400 font-semibold mb-2 text-sm sm:text-base">💬 Código SMS</label>
                          <input 
                            value={phoneCode} 
                            onChange={(e)=>setPhoneCode(e.target.value)} 
                            placeholder="Digite os 6 dígitos do SMS"
                            maxLength={6}
                            className="w-full p-3 sm:p-4 bg-white/10 backdrop-blur-sm border border-gray-600 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors text-center text-lg sm:text-xl font-semibold tracking-wide" 
                          />
                        </div>

                        <button 
                          onClick={handleConfirmPhone} 
                          disabled={loading || phoneCode.length < 3} 
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all transform hover:scale-105 disabled:hover:scale-100 shadow-lg text-sm sm:text-base"
                        >
                          {loading ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                              Verificando...
                            </div>
                          ) : (
                            '✅ Confirmar Telefone'
                          )}
                        </button>

                        <button 
                          onClick={handleResendPhone} 
                          disabled={loading || phoneCooldown > 0} 
                          className={`w-full font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all transform hover:scale-105 text-sm sm:text-base ${
                            phoneCooldown > 0 
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                              : 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white'
                          }`}
                        >
                          {phoneCooldown > 0 ? (
                            `⏳ Aguarde ${phoneCooldown}s`
                          ) : (
                            '🔄 Reenviar SMS'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {step === 'email' && (
                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-4 sm:p-6 lg:p-8 rounded-lg sm:rounded-xl border border-purple-500/30 backdrop-blur-sm">
                    <div className="flex items-center justify-center mb-4 sm:mb-6">
                      <div className="text-3xl sm:text-4xl mr-2 sm:mr-3">📧</div>
                      <h3 className="text-lg sm:text-xl font-bold text-white">Verificação de Email</h3>
                    </div>
                    
                    <p className="text-center text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
                      Enviamos um código de verificação para o seu email
                    </p>

                    {/* Campo email com status */}
                    <div className="bg-gradient-to-r from-[#222] to-[#333] p-3 sm:p-4 rounded-lg sm:rounded-xl mb-4 sm:mb-6 border border-purple-500/20">
                      <label className="block text-purple-400 font-semibold mb-2 text-sm sm:text-base">✉️ Email Cadastrado</label>
                      <div className="flex items-center justify-between bg-white/5 p-3 sm:p-4 rounded-lg border border-gray-600">
                        <span className="text-white text-xs sm:text-sm font-medium truncate">{emailVal || '—'}</span>
                      </div>
                      
                      <button 
                        onClick={() => {
                          const novoEmail = prompt("Digite o novo email:", emailVal || "");
                          if (novoEmail && novoEmail.trim() !== "" && novoEmail.includes('@')) {
                            setEmailVal(novoEmail.trim());
                            setTimeout(() => {
                              handleStartEmail();
                              setMessage("Código enviado para o novo email (verifique sua caixa SPAM).");
                            }, 100);
                          } else if (novoEmail && novoEmail.trim() !== "" && !novoEmail.includes('@')) {
                            alert("Por favor, digite um email válido.");
                          }
                        }}
                        disabled={loading}
                        className="w-full mt-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-2.5 sm:py-3 px-4 rounded-lg sm:rounded-xl transition-all transform hover:scale-105 disabled:hover:scale-100 text-sm sm:text-base"
                      >
                        ✏️ Editar Email
                      </button>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="block text-pink-400 font-semibold mb-2 text-sm sm:text-base">🔐 Código de Verificação</label>
                        <input 
                          value={emailCode} 
                          onChange={(e)=>setEmailCode(e.target.value)} 
                          placeholder="Digite o código do email"
                          maxLength={6}
                          className="w-full p-3 sm:p-4 bg-white/10 backdrop-blur-sm border border-gray-600 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors text-center text-lg sm:text-xl font-semibold tracking-wide" 
                        />
                      </div>

                      <button 
                        onClick={handleConfirmEmail} 
                        disabled={loading || emailCode.length < 3} 
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all transform hover:scale-105 disabled:hover:scale-100 shadow-lg text-sm sm:text-base"
                      >
                        {loading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                            Verificando...
                          </div>
                        ) : (
                          '✅ Confirmar Email'
                        )}
                      </button>

                      <button 
                        onClick={handleResendEmail} 
                        disabled={loading || emailCooldown > 0} 
                        className={`w-full font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all transform hover:scale-105 text-sm sm:text-base ${
                          emailCooldown > 0 
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white'
                        }`}
                      >
                        {emailCooldown > 0 ? (
                          `⏳ Aguarde ${emailCooldown}s`
                        ) : (
                          '🔄 Reenviar Código'
                        )}
                      </button>
                    </div>
                  </div>
                )}



                {message && (
                  <div className={`mt-4 sm:mt-6 p-4 sm:p-6 rounded-lg sm:rounded-xl backdrop-blur-sm ${
                    message.includes('sucesso') || message.includes('Finalizando') || message.includes('criada')
                      ? 'bg-green-500/20 border-2 border-green-500/40'
                      : message.includes('Erro') || message.includes('inválido')
                      ? 'bg-red-500/20 border-2 border-red-500/40' 
                      : 'bg-yellow-500/20 border-2 border-yellow-500/40'
                  }`}>
                    <div className="flex items-center justify-center">
                      <div className={`text-xl sm:text-2xl mr-2 sm:mr-3 ${
                        message.includes('sucesso') || message.includes('Finalizando') || message.includes('criada')
                          ? 'text-green-400'
                          : message.includes('Erro') || message.includes('inválido')
                          ? 'text-red-400' 
                          : 'text-yellow-400'
                      }`}>
                        {message.includes('sucesso') || message.includes('criada') ? '✅' : 
                         message.includes('Finalizando') ? '⚡' :
                         message.includes('Erro') || message.includes('inválido') ? '❌' : '⚠️'}
                      </div>
                      <p className={`text-center font-medium text-sm sm:text-base ${
                        message.includes('sucesso') || message.includes('Finalizando') || message.includes('criada')
                          ? 'text-green-300'
                          : message.includes('Erro') || message.includes('inválido')
                          ? 'text-red-300' 
                          : 'text-yellow-300'
                      }`}>
                        {message}
                      </p>
                    </div>
                    {message.includes('Finalizando') && (
                      <div className="flex justify-center mt-4">
                        <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-2 border-green-400 border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-[#111] to-[#222] border-t border-pink-500/20 py-4 sm:py-6 relative z-10 w-full">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-xs sm:text-sm mb-4 md:mb-0 text-center md:text-left">
              © 2025 Espaço Marias. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Carregando Página...</div>}>
      <VerifyPageContent />
    </Suspense>
  );
}

