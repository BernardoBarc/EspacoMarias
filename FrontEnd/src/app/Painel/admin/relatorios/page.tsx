"use client";
import React, { useEffect, useState } from "react";
import { apiFetch } from '../../../../lib/api';

interface Agendamento {
  _id: string;
  dataAgendamento: string;
  tempoAproximado: string;
  clientId: string;
  manicureId: string;
  serviceId: string;
}

interface User {
  _id: string;
  name: string;
  role: string;
}

interface Servico {
  _id: string;
  name: string;
  preco: number;
  tempoAproximado: string;
}

interface RelatorioMensal {
  manicureId: string;
  manicureName: string;
  totalValor: number;
  quantidadeServicos: number;
  mes: string;
  ano: string;
}

export default function RelatoriosMensais() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [manicures, setManicures] = useState<User[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [relatorios, setRelatorios] = useState<RelatorioMensal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para filtros
  const [mesSelecionado, setMesSelecionado] = useState<string>(
    (new Date().getMonth() + 1).toString()
  );
  const [anoSelecionado, setAnoSelecionado] = useState<string>(
    new Date().getFullYear().toString()
  );

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (agendamentos.length > 0 && manicures.length > 0 && servicos.length > 0) {
      gerarRelatorio();
    }
  }, [agendamentos, manicures, servicos, mesSelecionado, anoSelecionado]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ags, us, ss] = await Promise.all([
        apiFetch("api/users/agendamentos").then(r => r.json()),
        apiFetch("api/users/users").then(r => r.json()),
        apiFetch("api/users/servicos").then(r => r.json()),
      ]);
      setAgendamentos(ags);
      setManicures(us.filter((u: User) => u.role === "manicure"));
      setServicos(ss);
    } catch (err) {
      setError("Erro ao buscar dados");
    } finally {
      setLoading(false);
    }
  };

  const gerarRelatorio = () => {
    try {
      // Filtra agendamentos pelo mês e ano selecionados
      const agendamentosFiltrados = agendamentos.filter(agendamento => {
        const dataAgendamento = new Date(agendamento.dataAgendamento);
        const mes = dataAgendamento.getMonth() + 1;
        const ano = dataAgendamento.getFullYear();
        
        return mes === parseInt(mesSelecionado) && ano === parseInt(anoSelecionado);
      });

      // Cria um mapa de serviços para rápido acesso aos preços
      const servicoMap = new Map(servicos.map(servico => [servico._id, servico]));

      // Agrupa agendamentos por manicure
      const agrupamentoPorManicure = agendamentosFiltrados.reduce((acc, agendamento) => {
        const manicureId = agendamento.manicureId;
        if (!acc[manicureId]) {
          acc[manicureId] = [];
        }
        acc[manicureId].push(agendamento);
        return acc;
      }, {} as Record<string, Agendamento[]>);

      // Calcula totais para cada manicure
      const relatoriosGerados: RelatorioMensal[] = Object.entries(agrupamentoPorManicure).map(([manicureId, ags]) => {
        const manicure = manicures.find(m => m._id === manicureId);
        const totalValor = ags.reduce((sum, ag) => {
          const servico = servicoMap.get(ag.serviceId);
          return sum + (servico?.preco || 0);
        }, 0);

        return {
          manicureId,
          manicureName: manicure?.name || 'Manicure não encontrada',
          totalValor,
          quantidadeServicos: ags.length,
          mes: mesSelecionado,
          ano: anoSelecionado
        };
      });

      // Ordena por valor total (decrescente)
      relatoriosGerados.sort((a, b) => b.totalValor - a.totalValor);
      
      setRelatorios(relatoriosGerados);
    } catch (err) {
      setError("Erro ao gerar relatório");
    }
  };

  const getNomeMes = (mes: string) => {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return meses[parseInt(mes) - 1] || '';
  };

  const getTotalGeral = () => {
    return relatorios.reduce((total, relatorio) => total + relatorio.totalValor, 0);
  };

  const getAnosDisponiveis = () => {
    const anos = new Set<number>();
    
    // Adiciona anos dos agendamentos
    agendamentos.forEach(agendamento => {
      const ano = new Date(agendamento.dataAgendamento).getFullYear();
      anos.add(ano);
    });
    
    // Adiciona anos futuros para garantir disponibilidade
    const anoAtual = new Date().getFullYear();
    for (let i = anoAtual - 2; i <= anoAtual + 5; i++) {
      anos.add(i);
    }
    
    // Converte para array e ordena decrescente
    return Array.from(anos).sort((a, b) => b - a);
  };

  // Função para obter TODOS os meses (sempre 1-12)
  const getTodosMeses = () => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  };

  // Função para verificar se existe agendamento no mês/ano selecionado
  const existeAgendamentoNoPeriodo = () => {
    return agendamentos.some(agendamento => {
      const data = new Date(agendamento.dataAgendamento);
      const mes = data.getMonth() + 1;
      const ano = data.getFullYear();
      return mes === parseInt(mesSelecionado) && ano === parseInt(anoSelecionado);
    });
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
              <p className="text-xs sm:text-sm text-gray-400 font-medium">Relatórios Mensais</p>
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
      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            📊 Relatórios Mensais
          </h1>
          <p className="text-center text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base">
            Análise completa da produtividade e faturamento das manicures
          </p>
          
          {/* Filtros */}
          <div className="bg-gradient-to-br from-[#111]/80 to-[#222]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden mb-8">
            {/* Decoração interna */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-500/10 rounded-full translate-y-8 -translate-x-8"></div>
            
            <div className="relative z-10 p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50"></div>
                <h2 className="text-blue-400 font-bold text-2xl">🔍 Filtros do Relatório</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-blue-400/50 to-transparent"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-blue-300 font-semibold mb-2 flex items-center gap-2">
                    📅 Mês
                  </label>
                  <select
                    className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:border-blue-500 focus:outline-none transition-all"
                    value={mesSelecionado}
                    onChange={(e) => setMesSelecionado(e.target.value)}
                  >
                    {getTodosMeses().map(mes => (
                      <option key={mes} value={mes} className="bg-gray-800 text-white">
                        {getNomeMes(mes.toString())}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-blue-300 font-semibold mb-2 flex items-center gap-2">
                    🗓️ Ano
                  </label>
                  <select
                    className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:border-blue-500 focus:outline-none transition-all"
                    value={anoSelecionado}
                    onChange={(e) => setAnoSelecionado(e.target.value)}
                  >
                    {getAnosDisponiveis().map(ano => (
                      <option key={ano} value={ano} className="bg-gray-800 text-white">
                        {ano}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                      loading 
                        ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white shadow-lg hover:shadow-emerald-500/30'
                    }`}
                    onClick={gerarRelatorio}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                        Gerando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        🔄 Atualizar
                      </span>
                    )}
                  </button>
                </div>
              </div>
          </div>
              
              {/* Aviso se não há agendamentos no período */}
              {!existeAgendamentoNoPeriodo() && relatorios.length === 0 && (
                <div className="mt-6 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/50 p-4 rounded-xl">
                  <p className="text-amber-300 flex items-center gap-2">
                    ⓘ Não há agendamentos para {getNomeMes(mesSelecionado)}/{anoSelecionado}. 
                    O relatório estará vazio até que sejam criados agendamentos neste período.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Resumo Geral */}
          {relatorios.length > 0 && (
            <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-500/30 relative overflow-hidden mb-8">
              {/* Decoração interna */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-green-400/10 rounded-full -translate-y-8 translate-x-8"></div>
              <div className="absolute bottom-0 left-0 w-12 h-12 bg-emerald-400/10 rounded-full translate-y-6 -translate-x-6"></div>
              
              <div className="relative z-10 p-8 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                  <h3 className="text-emerald-400 font-bold text-2xl">
                    💰 Resumo do Mês - {getNomeMes(mesSelecionado)}/{anoSelecionado}
                  </h3>
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                </div>
                <p className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent">
                  Total Geral: R$ {getTotalGeral().toFixed(2)}
                </p>
                <div className="flex items-center justify-center gap-6 text-emerald-200">
                  <span className="flex items-center gap-2">
                    👥 {relatorios.length} manicure(s)
                  </span>
                  <span className="flex items-center gap-2">
                    ✂️ {relatorios.reduce((total, rel) => total + rel.quantidadeServicos, 0)} serviço(s) realizados
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tabela de Relatórios */}
          <div className="bg-gradient-to-br from-[#111]/80 to-[#222]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden">
            {/* Decoração interna */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-pink-500/10 rounded-full translate-y-8 -translate-x-8"></div>
            
            <div className="relative z-10 p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse shadow-lg shadow-purple-400/50"></div>
                <h2 className="text-purple-400 font-bold text-2xl">
                  📋 Produção por Manicure - {getNomeMes(mesSelecionado)}/{anoSelecionado}
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-purple-400/50 to-transparent"></div>
              </div>
              
              {loading ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-6 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-purple-300 text-xl font-semibold">Carregando dados...</p>
                </div>
              ) : relatorios.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gray-500/20 rounded-full flex items-center justify-center">
                    <span className="text-4xl">📊</span>
                  </div>
                  <p className="text-2xl font-bold text-white mb-2">
                    Nenhum dado encontrado
                  </p>
                  <p className="text-gray-400 text-lg mb-2">
                    Para {getNomeMes(mesSelecionado)}/{anoSelecionado}
                  </p>
                  <p className="text-gray-400">
                    {existeAgendamentoNoPeriodo() 
                      ? "Não há agendamentos realizados no período selecionado."
                      : "Não há agendamentos cadastrados para este mês e ano."
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-white">
                    <thead>
                      <tr className="bg-gradient-to-r from-purple-600/50 to-pink-600/50">
                        <th className="px-6 py-4 text-left font-bold text-purple-200">🏆 Posição</th>
                        <th className="px-6 py-4 text-left font-bold text-purple-200">💅 Manicure</th>
                        <th className="px-6 py-4 text-right font-bold text-purple-200">✂️ Serviços</th>
                        <th className="px-6 py-4 text-right font-bold text-purple-200">💰 Total</th>
                        <th className="px-6 py-4 text-right font-bold text-purple-200">📊 Média</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relatorios.map((relatorio, index) => (
                        <tr 
                          key={relatorio.manicureId} 
                          className="border-b border-white/10 hover:bg-white/5 transition-all duration-300"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm shadow-lg ${
                                index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-yellow-500/50' :
                                index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black shadow-gray-400/50' :
                                index === 2 ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-white shadow-orange-500/50' :
                                'bg-gradient-to-br from-white/20 to-white/10 text-white border border-white/30'
                              }`}>
                                {index + 1}º
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                                <span className="text-sm">👤</span>
                              </div>
                              <span className="font-medium text-lg">{relatorio.manicureName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="bg-blue-500/20 px-3 py-1 rounded-full text-blue-300 font-semibold">
                              {relatorio.quantidadeServicos}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-emerald-300 font-bold text-lg">
                              R$ {relatorio.totalValor.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-gray-300">
                              R$ {(relatorio.totalValor / relatorio.quantidadeServicos).toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Estatísticas Adicionais - Só mostra se houver dados */}
          {relatorios.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-xl rounded-2xl border border-blue-500/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-12 h-12 bg-blue-400/10 rounded-full -translate-y-6 translate-x-6"></div>
                <div className="relative z-10 p-6">
                  <h4 className="text-blue-300 font-bold mb-3 flex items-center gap-2">
                    🏆 Maior Produção
                  </h4>
                  <p className="text-white text-xl font-bold mb-2">
                    {relatorios[0]?.manicureName}
                  </p>
                  <p className="text-blue-200 text-lg">
                    R$ {relatorios[0]?.totalValor.toFixed(2)}
                  </p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl border border-purple-500/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-12 h-12 bg-purple-400/10 rounded-full -translate-y-6 translate-x-6"></div>
                <div className="relative z-10 p-6">
                  <h4 className="text-purple-300 font-bold mb-3 flex items-center gap-2">
                    📊 Média por Manicure
                  </h4>
                  <p className="text-white text-xl font-bold mb-2">
                    R$ {(getTotalGeral() / relatorios.length).toFixed(2)}
                  </p>
                  <p className="text-purple-200 text-lg">
                    {relatorios.length} manicures
                  </p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 backdrop-blur-xl rounded-2xl border border-orange-500/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-12 h-12 bg-orange-400/10 rounded-full -translate-y-6 translate-x-6"></div>
                <div className="relative z-10 p-6">
                  <h4 className="text-orange-300 font-bold mb-3 flex items-center gap-2">
                    📅 Serviços por Dia
                  </h4>
                  <p className="text-white text-xl font-bold mb-2">
                    {(
                      relatorios.reduce((total, rel) => total + rel.quantidadeServicos, 0) / 
                      new Date(parseInt(anoSelecionado), parseInt(mesSelecionado), 0).getDate()
                    ).toFixed(1)}
                  </p>
                  <p className="text-orange-200 text-lg">
                    média diária
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Alerta de Erro */}
          {error && (
            <div className="mt-8 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/50 p-4 rounded-xl">
              <p className="text-red-300 text-center flex items-center gap-2">
                ❌ {error}
              </p>
            </div>
          )}
        </div>
    </main>
  );
}
