"use client";
import React, { useEffect, useState } from "react";
import { apiFetch } from "../../../../lib/api";

interface Agendamento {
  _id: string;
  dataAgendamento: string;
  tempoAproximado: string;
  clientId: string;
  manicureId: string;
  serviceId: string;
  status: string;
  adicionais?: { nome: string; preco: number; quantidade?: number }[];
}
interface User { _id: string; name: string; role: string; }
interface Servico { _id: string; name: string; preco: number; tempoAproximado: string; }

export default function VisualizarAgendamentosAdmin() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("pendente");
  const [atualizando, setAtualizando] = useState<string | null>(null);

  useEffect(() => {
    fetchAgendamentos();
  }, [selectedStatus]);

  const fetchAgendamentos = async () => {
    setLoading(true);
    try {
      const [ags, us, ss] = await Promise.all([
        apiFetch("api/users/agendamentos").then(r => r.json()),
        apiFetch("api/users/users").then(r => r.json()),
        apiFetch("api/users/servicos").then(r => r.json()),
      ]);
      // Recupera o id da admin logada
      const userId = sessionStorage.getItem('userId');
      // Filtra agendamentos onde a admin é manicure
      const agsFiltrados = ags.filter(
        (ag: Agendamento) => ag.manicureId === userId && ag.status === selectedStatus
      );
      setAgendamentos(agsFiltrados);
      setUsers(us);
      setServicos(ss);
    } catch (err) {
      console.error("Erro ao buscar dados");
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatus = async (id: string, novoStatus: string) => {
    setAtualizando(id);
    try {
      const response = await apiFetch(`api/users/atualizarAgendamentos/${id}` , {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      });
      if (response.ok) {
        setAgendamentos(prev => prev.filter(ag => ag._id !== id));
      } else {
        alert("Erro ao atualizar o agendamento. Tente novamente.");
      }
    } catch (err) {
      alert("Erro ao atualizar o agendamento. Tente novamente.");
    } finally {
      setAtualizando(null);
    }
  };

  const userMap = Object.fromEntries(users.map(u => [u._id, u.name]));
  const servicoMap = Object.fromEntries(servicos.map(s => [s._id, s.name]));
  const servicoValorMap = Object.fromEntries(servicos.map(s => [s._id, s.preco]));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendente": return "bg-yellow-500";
      case "confirmado": return "bg-green-500";
      case "cancelado": return "bg-red-500";
      case "concluido": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pendente": return "Pendente";
      case "confirmado": return "Confirmado";
      case "cancelado": return "Cancelado";
      case "concluido": return "Concluído";
      default: return status;
    }
  };

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
              <p className="text-sm text-gray-400 font-medium">Meus Agendamentos</p>
            </div>
          </div>

          {/* Botão de voltar */}
          <a
            href="/home"
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
          >
            🏠 Voltar ao Painel
          </a>
        </div>
      </header>

      {/* Conteúdo principal */}
      <div className="flex-1 px-6 py-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            📅 Meus Agendamentos
          </h1>
          <p className="text-center text-gray-300 mb-8">
            Gestão pessoal de agendamentos - Visualize e gerencie seus atendimentos
          </p>

          {/* Filtros Premium */}
          <div className="bg-gradient-to-br from-[#111]/80 to-[#222]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden mb-8">
            {/* Decoração interna */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-500/10 rounded-full translate-y-8 -translate-x-8"></div>
            
            <div className="relative z-10 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50"></div>
                  <h2 className="text-blue-400 font-bold text-2xl">🔍 Filtros de Status</h2>
                </div>
              </div>
              
              <div className="flex gap-4 flex-wrap">
                {[
                  { value: "pendente", label: "Pendentes", count: agendamentos.length, icon: "⏳" },
                  { value: "confirmado", label: "Confirmados", icon: "✅" },
                  { value: "cancelado", label: "Cancelados", icon: "❌" },
                  { value: "concluido", label: "Concluídos", icon: "🎉" }
                ].map(({ value, label, count, icon }) => (
                <button
                  key={value}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                    selectedStatus === value
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30"
                      : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
                  }`}
                  onClick={() => setSelectedStatus(value)}
                >
                  <div className="flex items-center gap-2">
                    <span>{icon}</span>
                    <span>{label}</span>
                    {value === "pendente" && (count ?? 0) > 0 && (
                      <span className="bg-white/30 px-2 py-1 rounded-full text-xs font-bold">
                        {count ?? 0}
                      </span>
                    )}
                  </div>
                </button>
                ))}
              </div>
            </div>
          </div>
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl mb-4 animate-pulse">
                <span className="text-2xl">⏳</span>
              </div>
              <p className="text-white text-xl font-semibold">Carregando agendamentos...</p>
              <p className="text-gray-300 mt-2">Aguarde um momento</p>
            </div>
          ) : agendamentos.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl mb-6 animate-pulse">
                <span className="text-3xl">🎉</span>
              </div>
              <p className="text-white text-2xl font-bold mb-2">
                Nenhum agendamento {getStatusText(selectedStatus).toLowerCase()} encontrado
              </p>
              <p className="text-gray-300 text-lg">Tudo em dia!</p>
            </div>
          ) : (
            <div className="mb-8">
              {/* Cabeçalho da data */}
              <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-t-3xl p-6 shadow-2xl">
                <h3 className="text-2xl font-bold text-white flex items-center justify-between">
                  <span className="flex items-center gap-3">
                    📅 {getStatusText(selectedStatus)} - {new Date().toLocaleDateString('pt-BR')}
                    <span className="text-sm bg-white/20 px-3 py-1 rounded-full font-semibold">
                      {agendamentos.length} agendamento{agendamentos.length !== 1 ? 's' : ''}
                    </span>
                  </span>
                </h3>
              </div>
              
              {/* Cards dos agendamentos */}
              <div className="bg-gradient-to-br from-[#111]/80 to-[#222]/80 backdrop-blur-xl rounded-b-3xl border border-white/10 p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {agendamentos
                    .sort((a, b) => new Date(a.dataAgendamento).getTime() - new Date(b.dataAgendamento).getTime())
                    .map((ag) => (
                    <div key={ag._id} className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl relative overflow-hidden">
                      {/* Decoração interna */}
                      <div className="absolute top-0 right-0 w-8 h-8 bg-pink-500/10 rounded-full -translate-y-4 translate-x-4"></div>
                      
                      <div className="relative z-10">
                        {/* Horário destacado */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                            🕐 {(() => {
                              const d = new Date(ag.dataAgendamento);
                              if (isNaN(d.getTime())) return '--:--';
                              return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                            })()}
                          </div>
                          <div className="bg-white/20 text-white/90 px-3 py-1 rounded-full text-xs font-semibold">
                            ⏱️ {ag.tempoAproximado}
                          </div>
                        </div>
                        
                        {/* Informações principais */}
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-pink-400">👤</span>
                            <span className="text-white font-semibold">
                              {userMap[ag.clientId] || "Cliente não encontrado"}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-purple-400">✨</span>
                            <span className="text-white/90">
                              {servicoMap[ag.serviceId] || "Serviço não encontrado"}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-green-400">💰</span>
                            <span className="text-green-300 font-bold">
                              R$ {servicoValorMap[ag.serviceId]?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                          
                          {ag.manicureId && (
                            <div className="flex items-center gap-2">
                              <span className="text-blue-400">�</span>
                              <span className="text-white/90">
                                {userMap[ag.manicureId] || "Não atribuído"}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Status badge */}
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-xs font-bold ${getStatusColor(ag.status)}`}>
                          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                          {getStatusText(ag.status)}
                        </div>
                        
                        {/* Adicionais (se houver) */}
                        {Array.isArray(ag.adicionais) && ag.adicionais.length > 0 && (
                          <div className="mt-3 p-2 bg-white/5 rounded-lg">
                            <p className="text-xs text-white/70 mb-1">➕ Adicionais:</p>
                            {ag.adicionais.map((ad, idx) => {
                              const qtd = ad.quantidade ?? 1;
                              const valorTotal = Number(ad.preco) * qtd;
                              return (
                                <p key={idx} className="text-xs text-white/80 flex justify-between">
                                  <span>{ad.nome} {qtd > 1 ? `(${qtd}x)` : ''}</span>
                                  <span className="text-green-300">+R$ {valorTotal.toFixed(2)}</span>
                                </p>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* Botões de ação */}
                        {selectedStatus === "pendente" && (
                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => atualizarStatus(ag._id, "confirmado")}
                              disabled={atualizando === ag._id}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-bold flex-1 disabled:opacity-50 transition-all"
                            >
                              {atualizando === ag._id ? "..." : "✅ Confirmar"}
                            </button>
                            <button
                              onClick={() => atualizarStatus(ag._id, "cancelado")}
                              disabled={atualizando === ag._id}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-bold flex-1 disabled:opacity-50 transition-all"
                            >
                              {atualizando === ag._id ? "..." : "❌ Recusar"}
                            </button>
                          </div>
                        )}
                        
                        {selectedStatus === "confirmado" && (
                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => atualizarStatus(ag._id, "concluido")}
                              disabled={atualizando === ag._id}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold flex-1 disabled:opacity-50 transition-all"
                            >
                              {atualizando === ag._id ? "..." : "🎉 Concluir"}
                            </button>
                            <button
                              onClick={() => atualizarStatus(ag._id, "cancelado")}
                              disabled={atualizando === ag._id}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-bold flex-1 disabled:opacity-50 transition-all"
                            >
                              ❌ Cancelar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

