"use client";
import React, { useEffect, useState } from "react";
import ChangePasswordModal from "../../../../components/ChangePasswordModal";
import { apiFetch } from '../../../../lib/api';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  endereco?: string;
  role: string;
  createdAt?: string;
}

export default function Dados() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userId = sessionStorage.getItem('userId') || 'user-id-placeholder';
      const response = await apiFetch(`api/users/users/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else if (response.status === 404) {
        setError('Usuário não encontrado');
      } else {
        throw new Error("Erro ao buscar dados do usuário");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao buscar dados do usuário");
    }
  };

  if (error) {
    return (
      <main className="min-h-screen font-sans flex flex-col bg-gradient-to-br from-[#222] to-[#111] text-white relative overflow-hidden">
        {/* Decorações de fundo */}
        <div className="absolute top-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-pink-500/10 rounded-full -translate-x-32 sm:-translate-x-48 -translate-y-32 sm:-translate-y-48 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-purple-500/10 rounded-full translate-x-32 sm:translate-x-48 translate-y-32 sm:translate-y-48 blur-3xl"></div>
        
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8 relative z-10">
          <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 backdrop-blur-xl p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl border border-red-500/20">
            <div className="text-center py-6 sm:py-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                <span className="text-2xl sm:text-3xl">❌</span>
              </div>
              <p className="text-red-400 text-base sm:text-lg font-medium">{error}</p>
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
          <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 backdrop-blur-xl p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl border border-blue-500/20">
            <div className="text-center py-6 sm:py-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-blue-500/20 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-2xl sm:text-3xl">⏳</span>
              </div>
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
      <div className="absolute top-0 left-0 w-96 h-96 bg-pink-500/10 rounded-full -translate-x-48 -translate-y-48 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full translate-x-48 translate-y-48 blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/5 rounded-full -translate-x-32 -translate-y-32 blur-2xl"></div>

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
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all transform hover:scale-105 shadow-lg text-sm sm:text-base"
          >
            🏠 Voltar ao Painel
          </a>
        </div>
      </header>

      {/* Conteúdo principal */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-4 sm:py-8 relative z-10">
        <div className="bg-gradient-to-br from-[#111]/80 to-[#222]/80 backdrop-blur-xl p-4 sm:p-6 lg:p-10 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-6xl border border-pink-500/20 relative">
          {/* Decoração interna */}
          <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-pink-500/10 rounded-full -translate-y-8 sm:-translate-y-10 translate-x-8 sm:translate-x-10"></div>
          <div className="absolute bottom-0 left-0 w-12 sm:w-16 h-12 sm:h-16 bg-purple-500/10 rounded-full translate-y-6 sm:translate-y-8 -translate-x-6 sm:-translate-x-8"></div>
          
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              👤 Meus Dados
            </h1>
            <p className="text-center text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base">
              Visualize e gerencie suas informações pessoais
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {/* Seção Informações Pessoais */}
              <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 p-4 sm:p-6 rounded-lg sm:rounded-xl border border-blue-500/30 backdrop-blur-sm">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50"></div>
                  <h3 className="text-lg sm:text-xl font-bold text-blue-400">👤 Informações Pessoais</h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-blue-400/50 to-transparent"></div>
                </div>
                
                <div className="space-y-3 sm:space-y-6">
                  <div className="bg-white/5 p-3 sm:p-4 rounded-lg border border-blue-500/20">
                    <label className="block text-blue-300 font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">👨‍💼 Nome Completo</label>
                    <p className="text-white font-bold text-base sm:text-lg">{user.name}</p>
                  </div>
                  
                  <div className="bg-white/5 p-3 sm:p-4 rounded-lg border border-blue-500/20">
                    <label className="block text-blue-300 font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">📧 E-mail</label>
                    <p className="text-white font-semibold break-all text-sm sm:text-base">{user.email}</p>
                  </div>
                  
                  <div className="bg-white/5 p-3 sm:p-4 rounded-lg border border-blue-500/20">
                    <label className="block text-blue-300 font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">📱 Telefone</label>
                    <p className="text-white font-semibold text-sm sm:text-base">{user.phone || 'Não informado'}</p>
                  </div>

                  <div className="bg-white/5 p-3 sm:p-4 rounded-lg border border-blue-500/20">
                    <label className="block text-blue-300 font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">📅 Cliente desde</label>
                    <p className="text-white font-semibold text-sm sm:text-base">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'Data não disponível'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Seção Endereço e Ações */}
              <div className="space-y-4 sm:space-y-6">
                {/* Endereço */}
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-4 sm:p-6 rounded-lg sm:rounded-xl border border-purple-500/30 backdrop-blur-sm">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-purple-400 rounded-full animate-pulse shadow-lg shadow-purple-400/50"></div>
                    <h3 className="text-lg sm:text-xl font-bold text-purple-400">🏠 Endereço</h3>
                    <div className="flex-1 h-px bg-gradient-to-r from-purple-400/50 to-transparent"></div>
                  </div>
                  
                  <div className="bg-white/5 p-3 sm:p-4 rounded-lg border border-purple-500/20">
                    <label className="block text-purple-300 font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">📍 Endereço Completo</label>
                    <p className="text-white font-semibold text-sm sm:text-base">{user.endereco || 'Não informado'}</p>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-4 sm:p-6 rounded-lg sm:rounded-xl border border-emerald-500/30 backdrop-blur-sm">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                    <h3 className="text-lg sm:text-xl font-bold text-emerald-400">⚙️ Ações da Conta</h3>
                    <div className="flex-1 h-px bg-gradient-to-r from-emerald-400/50 to-transparent"></div>
                  </div>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <button
                      className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-base sm:text-lg rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-pink-500/25"
                      onClick={() => {
                        window.location.href = '/Painel/cliente/editar-dados';
                      }}
                    >
                      ✏️ Editar Meus Dados
                    </button>
                    
                    <button
                      className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-base sm:text-lg rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
                      onClick={() => setShowPasswordModal(true)}
                    >
                      🔐 Alterar Senha
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mensagens de Feedback */}
            {error && (
              <div className="mt-4 sm:mt-8 p-4 sm:p-6 bg-red-500/20 backdrop-blur-sm border border-red-500/50 rounded-lg sm:rounded-xl text-red-200 text-center font-medium text-sm sm:text-base">
                ❌ {error}
              </div>
            )}

            {success && (
              <div className="mt-4 sm:mt-8 p-4 sm:p-6 bg-green-500/20 backdrop-blur-sm border border-green-500/50 rounded-lg sm:rounded-xl text-green-200 text-center font-medium text-sm sm:text-base">
                ✅ {success}
              </div>
            )}

            {/* Modal de Alteração de Senha */}
            <ChangePasswordModal
              isOpen={showPasswordModal}
              onClose={() => setShowPasswordModal(false)}
              userId={user._id}
              onSuccess={() => {
                setSuccess("Senha alterada com sucesso!");
                setTimeout(() => setSuccess(null), 3000);
              }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
