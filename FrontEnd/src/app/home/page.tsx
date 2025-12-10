"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from '../../lib/api';

interface DadosSalao {
  telefone?: string;
  endereco?: string;
  email?: string;
  fotosHome?: string[];
  instagram?: string;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dadosSalao, setDadosSalao] = useState<DadosSalao | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const storedUser = sessionStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/home");
    } else {
      try {
        if (storedUser && storedUser !== "null" && storedUser !== "undefined") {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        } else {
          router.push("/home");
        }
      } catch (error) {
        console.error("Erro ao parsear usuário:", error);
        router.push("/home");
      } finally {
        setLoading(false);
      }
    }
  }, [router]);

  const fetchDados = async () => {
    try {
      const res = await apiFetch("api/users/dados-salao");
      const data = await res.json();
      setDadosSalao(data);
    } catch (err) {
      console.error('Erro ao buscar dados do salão na home:', err);
    }
  };

  useEffect(() => {
    fetchDados();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'dadosSalaoUpdated') fetchDados();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  if (loading) {
    return <p className="text-white text-center mt-10">Carregando...</p>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#333333]/80 via-[#333333] to-[#333333]">
        <p className="text-white text-xl mb-4">Erro: Dados do usuário não encontrados</p>
        <button 
          onClick={() => router.push("/loginUser")}
          className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-lg text-white"
        >
          Fazer Login Novamente
        </button>
      </div>
    );
  }

  const imagens = (dadosSalao && dadosSalao.fotosHome && dadosSalao.fotosHome.length > 0)
    ? dadosSalao.fotosHome
    : ["/salao.png", "/salao-dentro.jpg", "/salão2.png", "/salão1.png"];

  return (
    <main className="min-h-screen font-sans flex flex-col bg-gradient-to-br from-[#222] to-[#111] text-white relative overflow-hidden">
      {/* Decorações de fundo */}
      <div className="absolute top-0 left-0 w-48 sm:w-96 h-48 sm:h-96 bg-pink-500/10 rounded-full -translate-x-24 sm:-translate-x-48 -translate-y-24 sm:-translate-y-48 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-48 sm:w-96 h-48 sm:h-96 bg-purple-500/10 rounded-full translate-x-24 sm:translate-x-48 translate-y-24 sm:translate-y-48 blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 w-32 sm:w-64 h-32 sm:h-64 bg-blue-500/5 rounded-full -translate-x-16 sm:-translate-x-32 -translate-y-16 sm:-translate-y-32 blur-2xl"></div>

      {/* Header com logo */}
      <header className="w-full py-4 sm:py-8 px-4 sm:px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative group">
              {/* Glow externo animado */}
              <div className="absolute -inset-1 sm:-inset-2 bg-gradient-to-r from-pink-500/40 via-purple-500/40 to-pink-500/40 rounded-2xl sm:rounded-3xl blur-lg group-hover:blur-xl transition-all duration-500 animate-pulse"></div>
              
              {/* Container principal do logo */}
              <div className="relative bg-gradient-to-br from-[#111] via-[#1a1a1a] to-[#222] p-2 sm:p-3 rounded-xl sm:rounded-2xl border-2 border-pink-400/40 group-hover:border-pink-400/70 shadow-2xl transition-all duration-500">
                {/* Reflexo interno */}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-purple-500/10 rounded-xl sm:rounded-2xl"></div>
                
                {/* Imagem do logo */}
                <div className="relative">
                  <img 
                    src="/logo.png" 
                    alt="Espaço Marias" 
                    className="w-10 h-10 sm:w-16 sm:h-16 object-contain filter drop-shadow-lg transition-all duration-500" 
                    style={{
                      filter: 'brightness(1.2) contrast(1.1) saturate(1.2) hue-rotate(10deg)'
                    }}
                  />
                </div>
                
                {/* Pontos decorativos nos cantos */}
                <div className="hidden sm:block absolute -top-1 -left-1 w-3 h-3 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full shadow-lg shadow-pink-500/50"></div>
                <div className="hidden sm:block absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full shadow-lg shadow-purple-500/50"></div>
                <div className="hidden sm:block absolute -bottom-1 -left-1 w-2 h-2 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-pink-300 bg-clip-text text-transparent">
                Espaço Marias
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 font-medium">Painel de Controle</p>
            </div>
          </div>

          {/* Botão de logout */}
          <button
            onClick={() => {
              sessionStorage.clear();
              router.push("/");
            }}
            className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all transform hover:scale-105 shadow-lg text-sm sm:text-base"
          >
            🚪 Sair da Conta
          </button>
        </div>
      </header>

      {/* Conteúdo principal */}
      <div className="flex-1 px-4 sm:px-6 py-6 sm:py-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Card de boas-vindas */}
          <div className="bg-gradient-to-br from-[#111]/80 to-[#222]/80 backdrop-blur-xl p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl border border-pink-500/20 relative mb-8 sm:mb-10">
            {/* Decoração interna */}
            <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-pink-500/10 rounded-full -translate-y-8 sm:-translate-y-10 translate-x-8 sm:translate-x-10"></div>
            <div className="absolute bottom-0 left-0 w-12 sm:w-16 h-12 sm:h-16 bg-purple-500/10 rounded-full translate-y-6 sm:translate-y-8 -translate-x-6 sm:-translate-x-8"></div>
            
            <div className="relative z-10 text-center">
              <h1 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-pink-400 via-purple-400 to-pink-300 bg-clip-text text-transparent">
                👋 Bem-vindo(a), {user.nome || "Usuário"}!
              </h1>
              <p className="text-gray-300 text-sm sm:text-lg">
                {user.tipo === "admin" && "Gerencie todas as operações do salão com facilidade"}
                {user.tipo === "client" && "Agende seus serviços e acompanhe seus horários"}
                {user.tipo === "manicure" && "Gerencie seus agendamentos e clientes"}
              </p>
            </div>
          </div>
          
          {user.tipo === "admin" && (
            <div className="mb-6 sm:mb-8">
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  🔧 Painel do Administrador
                </h2>
                <p className="text-gray-400 text-sm sm:text-base">Controle total sobre o salão e operações</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <a href="/Painel/admin/users" className="group">
                  <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 p-4 sm:p-6 rounded-xl border border-blue-500/30 backdrop-blur-sm hover:border-blue-400/50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
                    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform">👥</div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">Gerenciar Manicures</h3>
                    <p className="text-gray-300 text-xs sm:text-sm">Visualize e gerencie todos os usuários do sistema</p>
                  </div>
                </a>

                <a href="/Painel/admin/relatorios" className="group">
                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-4 sm:p-6 rounded-xl border border-purple-500/30 backdrop-blur-sm hover:border-purple-400/50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
                    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform">📊</div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">Relatórios</h3>
                    <p className="text-gray-300 text-xs sm:text-sm">Acesse relatórios e estatísticas detalhadas</p>
                  </div>
                </a>

                <a href="/Painel/admin/agendamentos" className="group">
                  <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-4 sm:p-6 rounded-xl border border-green-500/30 backdrop-blur-sm hover:border-green-400/50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
                    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform">📅</div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">Todos os Agendamentos</h3>
                    <p className="text-gray-300 text-xs sm:text-sm">Acompanhe todos os agendamentos realizados</p>
                  </div>
                </a>

                <a href="/Painel/admin/meus-agendamentos" className="group">
                  <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-4 sm:p-6 rounded-xl border border-yellow-500/30 backdrop-blur-sm hover:border-yellow-400/50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
                    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform">📋</div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">Meus Agendamentos</h3>
                    <p className="text-gray-300 text-xs sm:text-sm">Visualize e gerencie seus agendamentos pessoais</p>
                  </div>
                </a>

                <a href="/Painel/admin/servicos" className="group">
                  <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 p-4 sm:p-6 rounded-xl border border-teal-500/30 backdrop-blur-sm hover:border-teal-400/50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
                    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform">✨</div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">Adicionar Serviços</h3>
                    <p className="text-gray-300 text-xs sm:text-sm">Cadastre novos serviços no catálogo</p>
                  </div>
                </a>

                <a href="/Painel/admin/meusDados" className="group">
                  <div className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 p-4 sm:p-6 rounded-xl border border-rose-500/30 backdrop-blur-sm hover:border-rose-400/50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
                    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform">👤</div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">Meus Dados</h3>
                    <p className="text-gray-300 text-xs sm:text-sm">Atualize suas informações pessoais</p>
                  </div>
                </a>

                <a href="/Painel/admin/dados-salao" className="group sm:col-span-2 lg:col-span-1">
                  <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 p-4 sm:p-6 rounded-xl border border-violet-500/30 backdrop-blur-sm hover:border-violet-400/50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
                    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform">🏢</div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">Dados do Salão</h3>
                    <p className="text-gray-300 text-xs sm:text-sm">Atualize as informações do estabelecimento</p>
                  </div>
                </a>
              </div>
            </div>
          )}

          {user.tipo === "client" && (
            <div className="mb-6 sm:mb-8">
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  💅 Área do Cliente
                </h2>
                <p className="text-gray-400 text-sm sm:text-base">Gerencie seus agendamentos e dados pessoais</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <a href="/Painel/cliente/agendamento" className="group">
                  <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 p-4 sm:p-6 rounded-xl border border-pink-500/30 backdrop-blur-sm hover:border-pink-400/50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
                    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform">📅</div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">Solicitar Agendamento</h3>
                    <p className="text-gray-300 text-xs sm:text-sm">Marque um novo horário para seus serviços de beleza</p>
                  </div>
                </a>

                <a href="/Painel/cliente/historico" className="group">
                  <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 p-4 sm:p-6 rounded-xl border border-purple-500/30 backdrop-blur-sm hover:border-purple-400/50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
                    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform">📋</div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">Meus Agendamentos</h3>
                    <p className="text-gray-300 text-xs sm:text-sm">Veja seus agendamentos pendentes e confirmados</p>
                  </div>
                </a>

                <a href="/Painel/cliente/dados" className="group sm:col-span-2 lg:col-span-1">
                  <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-4 sm:p-6 rounded-xl border border-blue-500/30 backdrop-blur-sm hover:border-blue-400/50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
                    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform">👤</div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">Meus Dados</h3>
                    <p className="text-gray-300 text-xs sm:text-sm">Atualize suas informações pessoais e preferências</p>
                  </div>
                </a>
              </div>
            </div>
          )}

          {user.tipo === "manicure" && (
            <div className="mb-6 sm:mb-8">
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
                  💼 Painel da Manicure
                </h2>
                <p className="text-gray-400 text-sm sm:text-base">Gerencie seus clientes e agendamentos profissionais</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <a href="/Painel/manicures/agendamentos" className="group">
                  <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-4 sm:p-6 rounded-xl border border-emerald-500/30 backdrop-blur-sm hover:border-emerald-400/50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
                    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform">📅</div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">Gerenciar Agendamentos</h3>
                    <p className="text-gray-300 text-xs sm:text-sm">Visualize e gerencie todos os agendamentos do sistema</p>
                  </div>
                </a>

                <a href="/Painel/manicures/relatorios" className="group">
                  <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 p-4 sm:p-6 rounded-xl border border-blue-500/30 backdrop-blur-sm hover:border-blue-400/50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
                    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform">📊</div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">Relatórios</h3>
                    <p className="text-gray-300 text-xs sm:text-sm">Acesse relatórios e estatísticas de performance</p>
                  </div>
                </a>

                <a href="/Painel/manicures/clientes-sumidos" className="group">
                  <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 p-4 sm:p-6 rounded-xl border border-orange-500/30 backdrop-blur-sm hover:border-orange-400/50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
                    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform">🔍</div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">Clientes Sumidos</h3>
                    <p className="text-gray-300 text-xs sm:text-sm">Clientes que estão há tempo sem agendar horário</p>
                  </div>
                </a>

                <a href="/Painel/manicures/dados" className="group">
                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-4 sm:p-6 rounded-xl border border-purple-500/30 backdrop-blur-sm hover:border-purple-400/50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
                    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform">👤</div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">Meus Dados</h3>
                    <p className="text-gray-300 text-xs sm:text-sm">Atualize suas informações profissionais</p>
                  </div>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="bg-gradient-to-r from-[#111] to-[#222] border-t border-pink-500/20 py-6 sm:py-8 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-3 sm:space-y-4">
            {/* Informações do salão */}
            <div className="text-gray-300">
              {dadosSalao ? (
                <div className="flex flex-col items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-pink-400">📍</span>
                    <span className="text-center">{dadosSalao.endereco}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400">📞</span>
                      <span>{dadosSalao.telefone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400">✉️</span>
                      <span className="break-all">{dadosSalao.email}</span>
                    </div>
                  </div>
                  {dadosSalao.instagram && (
                    <div className="flex items-center gap-2">
                      <span className="text-pink-400">📷</span>
                      <a 
                        href={dadosSalao.instagram.startsWith('http') ? dadosSalao.instagram : `https://instagram.com/${dadosSalao.instagram.replace(/^@/, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-pink-400 hover:text-pink-300 transition-colors"
                      >
                        Instagram
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-gray-400 text-xs sm:text-sm">Carregando dados do salão...</span>
              )}
            </div>
            
            {/* Copyright */}
            <div className="border-t border-gray-600 pt-3 sm:pt-4">
              <p className="text-gray-400 text-xs sm:text-sm">
                © 2025 Espaço Marias. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
