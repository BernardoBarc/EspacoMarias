"use client";
import React, { useEffect, useState } from "react";
import { apiFetch } from "../../../../lib/api";

interface Agendamento {
  _id: string;
  dataAgendamento: string;
  clientId: string;
  manicureId: string;
  serviceId: string;
  status: string;
}
interface Servico { _id: string; name: string; preco: number; }

export default function RelatoriosMensais() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [mesAno, setMesAno] = useState<string>(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDados();
  }, [mesAno]);

  const fetchDados = async () => {
    setLoading(true);
    try {
      const [ags, ss] = await Promise.all([
        apiFetch("api/users/agendamentos").then(r => r.json()),
        apiFetch("api/users/servicos").then(r => r.json()),
      ]);
      setAgendamentos(ags);
      setServicos(ss);
    } catch (err) {
      console.error("Erro ao buscar dados");
    } finally {
      setLoading(false);
    }
  };

  const servicoMap = Object.fromEntries(servicos.map(s => [s._id, s]));

  // Filtrar agendamentos do mês selecionado e apenas os concluídos
  const agendamentosFiltrados = agendamentos.filter(ag => {
    const dataAg = new Date(ag.dataAgendamento);
    const mesAg = dataAg.getFullYear() + '-' + String(dataAg.getMonth() + 1).padStart(2, '0');
    return mesAg === mesAno && ag.status === 'concluido';
  });

  // Calcular totais
  const totalServicos = agendamentosFiltrados.length;
  const totalRecebido = agendamentosFiltrados.reduce((total, ag) => {
    const servico = servicoMap[ag.serviceId];
    return total + (servico?.preco || 0);
  }, 0);

  // Estatísticas por serviço
  const statsPorServico = agendamentosFiltrados.reduce((acc, ag) => {
    const servico = servicoMap[ag.serviceId];
    if (servico) {
      if (!acc[servico.name]) {
        acc[servico.name] = { quantidade: 0, valor: 0 };
      }
      acc[servico.name].quantidade += 1;
      acc[servico.name].valor += servico.preco;
    }
    return acc;
  }, {} as { [key: string]: { quantidade: number; valor: number } });

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
              <p className="text-xs sm:text-sm text-gray-400 font-medium">Relatórios Mensais</p>
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
      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            📊 Relatórios Mensais
          </h1>
          <p className="text-center text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base">
            Acompanhe o desempenho e resultados financeiros dos seus serviços
          </p>
          
          {/* Seção de Seleção de Período */}
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl border border-blue-500/20 mb-6 sm:mb-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6">
              <div className="text-center lg:text-left">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 justify-center lg:justify-start">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50"></div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-400">📅 Período do Relatório</h2>
                </div>
                <p className="text-gray-300 text-sm sm:text-base lg:text-lg max-w-md">
                  Selecione o mês e ano para visualizar os dados financeiros e estatísticas
                </p>
              </div>
              <div className="bg-white/10 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-white/20">
                <label className="block text-blue-300 font-semibold mb-2 text-xs sm:text-sm">Mês/Ano</label>
                <input
                  type="month"
                  className="p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:border-blue-500 focus:outline-none transition-all min-w-[200px]"
                  value={mesAno}
                  onChange={e => setMesAno(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Container principal dos dados */}
          <div className="bg-gradient-to-br from-[#111]/80 to-[#222]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden">
            {/* Decoração interna */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/10 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-500/10 rounded-full translate-y-8 -translate-x-8"></div>
            
            <div className="relative z-10 p-8">
              {loading ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-3xl">📊</span>
                  </div>
                  <p className="text-blue-400 text-lg font-medium">Carregando relatórios...</p>
                </div>
              ) : (
                <>
                  {/* Métricas Principais */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-pink-500/20 to-red-500/20 p-6 rounded-2xl border border-pink-500/30 hover:border-pink-500/50 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-pink-400 font-bold text-lg">Total de Serviços</h3>
                        <div className="w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center">
                          <span className="text-2xl">💅</span>
                        </div>
                      </div>
                      <p className="text-4xl font-bold text-pink-400 mb-2">{totalServicos}</p>
                      <p className="text-gray-300 text-sm">serviços realizados</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 p-6 rounded-2xl border border-emerald-500/30 hover:border-emerald-500/50 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-emerald-400 font-bold text-lg">Valor Recebido</h3>
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                          <span className="text-2xl">💰</span>
                        </div>
                      </div>
                      <p className="text-4xl font-bold text-emerald-400 mb-2">
                        R$ {totalRecebido.toFixed(2)}
                      </p>
                      <p className="text-gray-300 text-sm">receita total</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 p-6 rounded-2xl border border-blue-500/30 hover:border-blue-500/50 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-blue-400 font-bold text-lg">Ticket Médio</h3>
                        <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <span className="text-2xl">📈</span>
                        </div>
                      </div>
                      <p className="text-4xl font-bold text-blue-400 mb-2">
                        R$ {totalServicos > 0 ? (totalRecebido / totalServicos).toFixed(2) : '0.00'}
                      </p>
                      <p className="text-gray-300 text-sm">valor médio por serviço</p>
                    </div>
                  </div>

                  {/* Seção de Serviços Realizados */}
                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 rounded-2xl border border-purple-500/30">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse shadow-lg shadow-purple-400/50"></div>
                      <h3 className="text-purple-400 font-bold text-xl">📋 Serviços Realizados</h3>
                      <div className="flex-1 h-px bg-gradient-to-r from-purple-400/50 to-transparent"></div>
                    </div>
                    
                    {Object.keys(statsPorServico).length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 mx-auto mb-4 bg-gray-500/20 rounded-full flex items-center justify-center">
                          <span className="text-3xl">📊</span>
                        </div>
                        <p className="text-xl font-bold text-white mb-2">Nenhum serviço realizado</p>
                        <p className="text-gray-400">Não há dados para o período selecionado</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(statsPorServico).map(([servico, stats]) => (
                          <div key={servico} className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/20 hover:border-white/40 transition-all">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                                  <span className="text-lg">✨</span>
                                </div>
                                <span className="text-white font-bold text-lg">{servico}</span>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-4">
                                  <div className="text-center">
                                    <p className="text-purple-300 text-sm font-medium">Quantidade</p>
                                    <p className="text-white font-bold text-xl">{stats.quantidade}</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-emerald-300 text-sm font-medium">Valor Total</p>
                                    <p className="text-emerald-400 font-bold text-xl">R$ {stats.valor.toFixed(2)}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
