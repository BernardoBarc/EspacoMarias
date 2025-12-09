"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "../../../../lib/api";

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

export default function Users() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "manicure",
  });
  const [loading, setLoading] = useState(false);

  // Estados para verificação (semelhantes ao cliente)
  const [emailTempId, setEmailTempId] = useState<string | null>(null);
  const [phoneTempId, setPhoneTempId] = useState<string | null>(null);
  const [emailVerificationPending, setEmailVerificationPending] = useState(false);
  const [phoneVerificationPending, setPhoneVerificationPending] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await apiFetch("api/users/users");
      if (!response.ok) throw new Error("Erro ao buscar usuários");
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError("Erro ao buscar usuários");
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

  const deleteUser = async (id: string) => {
    setLoading(true);
    try {
      const response = await apiFetch(`api/users/deletarUser/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Erro ao deletar usuário");
      setUsers(users.filter((u) => u._id !== id));
    } catch (err) {
      setError("Erro ao deletar usuário");
    } finally {
      setLoading(false);
    }
  };

  // Funções de verificação (admin criando manicure)
  const startEmailVerification = async () => {
    if (!form.email) {
      setError('Informe um email válido para enviar o código.');
      return;
    }
    setLoading(true);
    try {
      console.log('🔄 Enviando requisição de verificação de email para:', form.email);
      const response = await apiFetch('api/users/startEmailVerification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await response.json();
      console.log('📧 Resposta do servidor:', data);
      
      if (!response.ok) {
        setError(data.error || 'Erro ao solicitar verificação de email');
        return;
      }
      
      setEmailTempId(data.tempId || null);
      setEmailVerificationPending(true);
      
      // Mostrar o código se estiver em desenvolvimento
      if (data.debugCode) {
        setInfo(`Código enviado para o email: ${form.email}.`);
      } else {
        setInfo('Código de verificação enviado para o email. Insira abaixo para confirmar.');
      }
    } catch (err) {
      console.error('❌ Erro na verificação de email:', err);
      setError('Erro ao solicitar verificação de email.');
    } finally {
      setLoading(false);
    }
  };

  const confirmEmailCode = async () => {
    if (!emailTempId) return;
    setLoading(true);
    try {
      console.log('📧 Confirmando email com tempId:', emailTempId, 'código:', emailCode);
      const response = await apiFetch('api/users/confirmEmailCode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: emailCode, tempId: emailTempId }),
      });
      
      const responseData = await response.text();
      console.log('✅ Resposta confirmação email:', responseData);
      
      if (!response.ok) {
        setError(responseData || 'Erro ao confirmar código de email');
        return;
      }
      setEmailVerificationPending(false);
      setInfo('Email verificado com sucesso. Agora finalize o cadastro clicando em Salvar.');
    } catch (err) {
      console.error('❌ Erro confirmação email:', err);
      setError('Erro ao confirmar código de email.');
    } finally {
      setLoading(false);
    }
  };

  const startPhoneVerification = async () => {
    if (!form.phone) {
      setError('Informe um telefone válido para enviar o código.');
      return;
    }
    setLoading(true);
    try {
      console.log('🔄 Enviando requisição de verificação de telefone para:', form.phone);
      
      // Se já temos emailTempId, usar ele para adicionar telefone ao mesmo usuário temporário
      const requestBody = emailTempId 
        ? { phone: form.phone, tempId: emailTempId }
        : { phone: form.phone };
      
      console.log('📱 Payload da requisição:', requestBody);
      
      const response = await apiFetch('api/users/startPhoneVerification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();
      console.log('📱 Resposta do servidor:', data);
      
      if (!response.ok) {
        setError(data.error || 'Erro ao solicitar verificação de telefone');
        return;
      }
      
      // Se já tínhamos emailTempId, usar o mesmo para manter consistência
      if (emailTempId) {
        setPhoneTempId(emailTempId);
      } else {
        setPhoneTempId(data.tempId || null);
      }
      setPhoneVerificationPending(true);
      
      // Mostrar o código se estiver em desenvolvimento
      if (data.debugCode) {
        setInfo(`Código enviado para o telefone: ${form.phone}.`);
      } else {
        setInfo('Código de verificação enviado para o telefone. Insira abaixo para confirmar.');
      }
    } catch (err) {
      console.error('❌ Erro na verificação de telefone:', err);
      setError('Erro ao solicitar verificação de telefone.');
    } finally {
      setLoading(false);
    }
  };

  const confirmPhoneCode = async () => {
    const tempIdToUse = phoneTempId || emailTempId;
    if (!tempIdToUse) return;
    
    setLoading(true);
    try {
      console.log('📱 Confirmando telefone com tempId:', tempIdToUse, 'código:', phoneCode);
      const response = await apiFetch('api/users/confirmPhoneCode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: phoneCode, tempId: tempIdToUse }),
      });
      
      const responseData = await response.text();
      console.log('✅ Resposta confirmação telefone:', responseData);
      
      if (!response.ok) {
        setError(responseData || 'Erro ao confirmar código de telefone');
        return;
      }
      setPhoneVerificationPending(false);
      // Atualizar phoneTempId para ser o mesmo que emailTempId
      setPhoneTempId(tempIdToUse);
      setInfo('Telefone verificado com sucesso. Agora finalize o cadastro clicando em Salvar.');
    } catch (err) {
      console.error('❌ Erro confirmação telefone:', err);
      setError('Erro ao confirmar código de telefone.');
    } finally {
      setLoading(false);
    }
  };

  // Função para resetar verificações (caso admin queira alterar dados)
  const resetVerifications = () => {
    setEmailTempId(null);
    setPhoneTempId(null);
    setEmailVerificationPending(false);
    setPhoneVerificationPending(false);
    setEmailCode("");
    setPhoneCode("");
    setError(null);
    setInfo("Verificações resetadas. Você pode alterar os dados novamente.");
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo('');

    try {
      // ETAPA 1: Verificação de email (primeira etapa)
      if (!emailTempId && form.email) {
        setInfo('Iniciando verificação por etapas. Primeiro: Email...');
        await startEmailVerification();
        setLoading(false);
        return;
      }

      // ETAPA 2: Verificação de telefone (segunda etapa) 
      if (emailTempId && !emailVerificationPending && !phoneTempId && form.phone) {
        setInfo('Email verificado! Agora verificando telefone...');
        await startPhoneVerification();
        setLoading(false);
        return;
      }

      // Verificar se ainda há verificações pendentes
      if (emailVerificationPending) {
        setError('Complete a verificação do email primeiro.');
        setLoading(false);
        return;
      }

      if (phoneVerificationPending) {
        setError('Complete a verificação do telefone para finalizar.');
        setLoading(false);
        return;
      }

      // Verificar se temos pelo menos uma verificação completa
      if (!emailTempId && !phoneTempId) {
        setError('É necessário verificar pelo menos email ou telefone.');
        setLoading(false);
        return;
      }

      // Usar o tempId que estiver disponível (deve ser o mesmo para email e telefone)
      const tempIdToUse = emailTempId || phoneTempId;
      
      const createPayload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        tempId: tempIdToUse
      };

      console.log('🔄 Criando usuário final com payload:', createPayload);
      console.log('📋 Verificações completadas - EmailTempId:', emailTempId, 'PhoneTempId:', phoneTempId);
      
      const response = await apiFetch("api/users/CriarUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload),
      });

      const data = await response.json();
      console.log('👤 Resposta da criação:', data);

      if (!response.ok) {
        throw new Error(data.error || "Erro ao salvar usuário");
      }

      if (form.role !== 'client') {
        const updateResponse = await apiFetch(`api/users/atualizarUser/${data._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: form.role }),
        });
        
        if (!updateResponse.ok) {
          console.warn('Usuário criado mas não foi possível atualizar o role');
        }
      }

      // Limpar formulário e estados
      setForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "manicure",
      });
      setEmailTempId(null);
      setPhoneTempId(null);
      setEmailVerificationPending(false);
      setPhoneVerificationPending(false);
      setEmailCode("");
      setPhoneCode("");
      setInfo("Manicure cadastrada com sucesso!");
      
      fetchUsers();
    } catch (err: any) {
      console.error('❌ Erro ao salvar usuário:', err);
      setError(err.message || "Erro ao salvar usuário");
    } finally {
      setLoading(false);
    }
  };

  const manicures = users.filter((u) => u.role === "manicure");

  return (
    <main className="min-h-screen font-sans flex flex-col bg-gradient-to-br from-[#222] to-[#111] text-white relative overflow-hidden">
      {/* Decorações de fundo */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-pink-500/10 rounded-full -translate-x-48 -translate-y-48 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full translate-x-48 translate-y-48 blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/5 rounded-full -translate-x-32 -translate-y-32 blur-2xl"></div>

      {/* Header com logo */}
      <header className="w-full py-8 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative group">
              {/* Glow externo animado */}
              <div className="absolute -inset-2 bg-gradient-to-r from-pink-500/40 via-purple-500/40 to-pink-500/40 rounded-3xl blur-lg group-hover:blur-xl transition-all duration-500 animate-pulse"></div>
              
              {/* Container principal do logo */}
              <div className="relative bg-gradient-to-br from-[#111] via-[#1a1a1a] to-[#222] p-3 rounded-2xl border-2 border-pink-400/40 group-hover:border-pink-400/70 shadow-2xl transition-all duration-500">
                {/* Reflexo interno */}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-purple-500/10 rounded-2xl"></div>
                
                {/* Imagem do logo */}
                <div className="relative">
                  <img 
                    src="/logo.png" 
                    alt="Espaço Marias" 
                    className="w-16 h-16 object-contain filter drop-shadow-lg transition-all duration-500" 
                    style={{
                      filter: 'brightness(1.2) contrast(1.1) saturate(1.2) hue-rotate(10deg)'
                    }}
                  />
                </div>
                
                {/* Pontos decorativos nos cantos */}
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full shadow-lg shadow-pink-500/50"></div>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full shadow-lg shadow-purple-500/50"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-pink-300 bg-clip-text text-transparent">
                Espaço Marias
              </h2>
              <p className="text-sm text-gray-400 font-medium">Administração de Usuários</p>
            </div>
          </div>

          {/* Botão de voltar */}
          <button
            onClick={() => router.push("/home")}
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
          >
            🏠 Voltar ao Painel
          </button>
        </div>
      </header>

      {/* Conteúdo principal */}
      <div className="flex-1 px-6 py-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            👥 Gerenciamento de Usuários
          </h1>
          <p className="text-center text-gray-300 mb-8">
            Administre manicures e controle o acesso ao sistema
          </p>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Seção de Lista de Usuários */}
            <div className="bg-gradient-to-br from-[#111]/80 to-[#222]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden">
              {/* Decoração interna */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-500/10 rounded-full translate-y-8 -translate-x-8"></div>
              
              <div className="relative z-10 p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50"></div>
                  <h2 className="text-blue-400 font-bold text-2xl">📋 Lista de Manicures</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-blue-400/50 to-transparent"></div>
                </div>

                {manicures.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gray-500/20 rounded-full flex items-center justify-center">
                      <span className="text-4xl">👤</span>
                    </div>
                    <p className="text-2xl font-bold text-white mb-2">
                      Nenhuma manicure cadastrada
                    </p>
                    <p className="text-gray-400 text-lg">
                      Use o formulário ao lado para cadastrar a primeira manicure
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {manicures.map((user) => (
                      <div
                        key={user._id}
                        className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 hover:border-white/40 transition-all shadow-lg hover:shadow-xl"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                              <span className="text-xl">👤</span>
                            </div>
                            <div>
                              <h3 className="text-white font-bold text-xl">{user.name}</h3>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-gray-300">
                                <span className="flex items-center gap-1">
                                  📧 {user.email}
                                </span>
                                {user.phone && (
                                  <span className="flex items-center gap-1">
                                    📞 {user.phone}
                                  </span>
                                )}
                              </div>
                              <span className="inline-block mt-2 px-3 py-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-bold rounded-full">
                                💅 {user.role}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Link 
                              href={`/Painel/manicures/dados?userId=${user._id}`} 
                              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-4 py-2 rounded-lg font-bold transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
                            >
                              ✏️ Editar
                            </Link>
                            <button
                              onClick={() => deleteUser(user._id)}
                              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
                              disabled={loading}
                            >
                              🗑️ Deletar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Seção de Cadastro */}
            <div className="bg-gradient-to-br from-[#111]/80 to-[#222]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden">
              {/* Decoração interna */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-pink-500/10 rounded-full translate-y-8 -translate-x-8"></div>
              
              <div className="relative z-10 p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                  <h2 className="text-emerald-400 font-bold text-2xl">➕ Cadastrar Nova Manicure</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-emerald-400/50 to-transparent"></div>
                </div>
                
                {(emailTempId || phoneTempId) && (
                  <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/50 rounded-2xl p-4 mb-6">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <p className="text-yellow-300 font-semibold">Verificação em Andamento</p>
                        <p className="text-yellow-200 text-sm">
                          Complete as verificações ou use "Resetar" para alterar os dados
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <form onSubmit={saveUser} className="space-y-8">
                  {/* Seção Dados Básicos */}
                  <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-6 rounded-2xl border border-blue-500/30">
                    <h3 className="text-blue-400 font-bold text-lg mb-4 flex items-center gap-2">
                      👤 Dados Pessoais
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-blue-300 font-semibold mb-2">Nome Completo</label>
                        <input
                          type="text"
                          placeholder="Nome da manicure"
                          className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:border-blue-500 focus:outline-none transition-all"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-blue-300 font-semibold mb-2">Senha de Acesso</label>
                        <input
                          type="password"
                          placeholder="Digite uma senha segura"
                          className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:border-blue-500 focus:outline-none transition-all"
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Seção Contato */}
                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 rounded-2xl border border-purple-500/30">
                    <h3 className="text-purple-400 font-bold text-lg mb-4 flex items-center gap-2">
                      📧 Informações de Contato
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-purple-300 font-semibold mb-2">Email</label>
                        <input
                          type="email"
                          placeholder="email@exemplo.com"
                          className={`w-full p-3 rounded-lg border text-white transition-all focus:outline-none ${
                            emailTempId 
                              ? 'bg-gray-600/50 border-gray-500 cursor-not-allowed text-gray-300' 
                              : 'bg-white/10 border-white/20 focus:border-purple-500'
                          }`}
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          disabled={!!emailTempId}
                          required
                        />
                        {emailTempId && (
                          <p className="text-gray-400 text-sm mt-1 flex items-center gap-1">
                            ✅ Email verificado
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-purple-300 font-semibold mb-2">Telefone</label>
                        <input
                          type="tel"
                          placeholder="(11) 99999-9999"
                          className={`w-full p-3 rounded-lg border text-white transition-all focus:outline-none ${
                            phoneTempId 
                              ? 'bg-gray-600/50 border-gray-500 cursor-not-allowed text-gray-300' 
                              : 'bg-white/10 border-white/20 focus:border-purple-500'
                          }`}
                          value={form.phone}
                          onChange={(e) => {
                            const formatted = formatPhoneInput(e.target.value);
                            setForm({ ...form, phone: formatted });
                          }}
                          disabled={!!phoneTempId}
                          required
                        />
                        {phoneTempId && (
                          <p className="text-gray-400 text-sm mt-1 flex items-center gap-1">
                            ✅ Telefone verificado
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Seção Verificação */}
                  {(emailVerificationPending || phoneVerificationPending) && (
                    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6 rounded-2xl border border-amber-500/30">
                      <h3 className="text-amber-400 font-bold text-lg mb-4 flex items-center gap-2">
                        🔐 Verificação
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {emailVerificationPending && (
                          <div>
                            <label className="block text-amber-300 font-semibold mb-2">Código de Email</label>
                            <input
                              type="text"
                              value={emailCode}
                              onChange={(e) => setEmailCode(e.target.value)}
                              className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:border-amber-500 focus:outline-none transition-all mb-3"
                              placeholder="Código recebido por email"
                            />
                            <button 
                              type="button" 
                              onClick={confirmEmailCode} 
                              className="w-full px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-semibold hover:from-amber-400 hover:to-orange-400 transition-all"
                            >
                              Confirmar Email
                            </button>
                          </div>
                        )}
                        {phoneVerificationPending && (
                          <div>
                            <label className="block text-amber-300 font-semibold mb-2">Código de Telefone</label>
                            <input
                              type="text"
                              value={phoneCode}
                              onChange={(e) => setPhoneCode(e.target.value)}
                              className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:border-amber-500 focus:outline-none transition-all mb-3"
                              placeholder="Código recebido por SMS/WhatsApp"
                            />
                            <button 
                              type="button" 
                              onClick={confirmPhoneCode} 
                              className="w-full px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-semibold hover:from-amber-400 hover:to-orange-400 transition-all"
                            >
                              Confirmar Telefone
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Botões de Ação */}
                  <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 p-6 rounded-2xl border border-emerald-500/30">
                    <div className="flex gap-4 justify-end">
                      {(emailTempId || phoneTempId) && (
                        <button
                          type="button"
                          onClick={resetVerifications}
                          className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-500 hover:to-red-600 transition-all duration-300 font-semibold border border-red-500/50"
                          disabled={loading}
                          title="Resetar verificações para alterar email/telefone"
                        >
                          Resetar
                        </button>
                      )}
                      <button
                        type="submit"
                        className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                          loading 
                            ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 text-white shadow-lg hover:shadow-emerald-500/30'
                        }`}
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                            Criando...
                          </span>
                        ) : (
                          'Cadastrar Manicure'
                        )}
                      </button>
                    </div>
                  </div>
                </form>

                {/* Alertas */}
                {error && (
                  <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/50 p-4 rounded-xl mt-6">
                    <p className="text-red-300 flex items-center gap-2">
                      ❌ {error}
                    </p>
                  </div>
                )}
                {info && (
                  <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 p-4 rounded-xl mt-6">
                    <p className="text-amber-300 flex items-center gap-2">
                      ℹ️ {info}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
