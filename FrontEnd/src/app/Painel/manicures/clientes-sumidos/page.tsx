"use client";
import React, { useEffect, useState } from "react";
import { apiFetch } from "../../../../lib/api";

interface User { 
  _id: string; 
  name: string; 
  email: string;
  phone?: string;
  role: string; 
  createdAt: string;
}
interface Agendamento {
  _id: string;
  dataAgendamento: string;
  clientId: string;
  status: string;
}

export default function ClientesInativos() {
  const [clientes, setClientes] = useState<User[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [diasInatividade, setDiasInatividade] = useState<number>(30);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDados();
  }, []);

  const fetchDados = async () => {
    setLoading(true);
    try {
      const [clientesData, ags] = await Promise.all([
        apiFetch("api/users/users?role=client").then(r => r.json()),
        apiFetch("api/users/agendamentos").then(r => r.json()),
      ]);
      setClientes(clientesData);
      setAgendamentos(ags);
    } catch (err) {
      console.error("Erro ao buscar dados");
    } finally {
      setLoading(false);
    }
  };

  // Função para obter data local (evita problemas de timezone)
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Verificar se cliente tem agendamento futuro, hoje ou foi atendido recentemente
  const temAgendamentoRecente = (clientId: string) => {
    const hoje = getLocalDateString();
    return agendamentos.some(ag => {
      if (ag.clientId !== clientId) return false;
      const dataAg = ag.dataAgendamento.split('T')[0]; // Pega apenas a data
      
      // Agendamentos futuros (pendente ou confirmado)
      if (dataAg >= hoje && (ag.status === 'pendente' || ag.status === 'confirmado')) {
        return true;
      }
      
      // Agendamentos concluídos hoje
      if (dataAg === hoje && ag.status === 'concluido') {
        return true;
      }
      
      return false;
    });
  };

  // Encontrar última data de agendamento CONCLUÍDO para cada cliente
  const getUltimoAgendamento = (clientId: string) => {
    const hoje = getLocalDateString();
    const agsCliente = agendamentos
      .filter(ag => {
        if (ag.clientId !== clientId || ag.status !== 'concluido') return false;
        const dataAg = ag.dataAgendamento.split('T')[0];
        return dataAg < hoje; // Apenas agendamentos concluídos no passado
      })
      .sort((a, b) => new Date(b.dataAgendamento).getTime() - new Date(a.dataAgendamento).getTime());
    
    return agsCliente.length > 0 ? new Date(agsCliente[0].dataAgendamento) : null;
  };

  // Encontrar próximo agendamento ou atendimento de hoje do cliente
  const getProximoAgendamento = (clientId: string) => {
    const hoje = getLocalDateString();
    const agsCliente = agendamentos
      .filter(ag => {
        if (ag.clientId !== clientId) return false;
        const dataAg = ag.dataAgendamento.split('T')[0];
        
        // Agendamentos futuros
        if (dataAg > hoje && (ag.status === 'pendente' || ag.status === 'confirmado')) {
          return true;
        }
        
        // Agendamentos de hoje (qualquer status)
        if (dataAg === hoje) {
          return true;
        }
        
        return false;
      })
      .sort((a, b) => new Date(a.dataAgendamento).getTime() - new Date(b.dataAgendamento).getTime());
    
    return agsCliente.length > 0 ? new Date(agsCliente[0].dataAgendamento) : null;
  };

  // Calcular dias desde o último agendamento
  const getDiasDesdeUltimoAgendamento = (clientId: string) => {
    // Se tem agendamento futuro ou foi atendido recentemente, não está sumido
    if (temAgendamentoRecente(clientId)) return null;
    
    const ultimoAg = getUltimoAgendamento(clientId);
    if (!ultimoAg) return null;
    
    const hoje = new Date();
    const diffTime = hoje.getTime() - ultimoAg.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Filtrar clientes inativos
  const clientesInativos = clientes.filter(cliente => {
    const dias = getDiasDesdeUltimoAgendamento(cliente._id);
    return dias !== null && dias > diasInatividade;
  });

  const enviarLembrete = (clienteId: string, clienteNome: string, clientePhone?: string) => {
    if (!clientePhone) {
      alert("Este cliente não possui telefone cadastrado.");
      return;
    }
    const msg = encodeURIComponent(`Olá ${clienteNome}, sentimos sua falta no Espaço Marias! Que tal agendar um novo horário conosco? 💅✨`);
    const tel = clientePhone.replace(/\D/g, "");
    window.open(`https://wa.me/55${tel}?text=${msg}`, "_blank");
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
              <p className="text-xs sm:text-sm text-gray-400 font-medium">Clientes Inativos</p>
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
            👥 Clientes Inativos
          </h1>
          <p className="text-center text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base">
            Identifique e reconquiste clientes que não agendam há muito tempo
          </p>
          
          {/* Seção de Configuração */}
          <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl border border-orange-500/20 mb-6 sm:mb-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6">
              <div className="text-center lg:text-left">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 justify-center lg:justify-start">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-orange-400 rounded-full animate-pulse shadow-lg shadow-orange-400/50"></div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-400">⏰ Filtro de Inatividade</h2>
                </div>
                <p className="text-gray-300 text-sm sm:text-base lg:text-lg max-w-md">
                  Configure o período de inatividade para identificar clientes que precisam de atenção
                </p>
              </div>
              <div className="bg-white/10 p-4 rounded-xl border border-white/20 flex items-center gap-3">
                <label className="text-orange-300 font-semibold">Mais de</label>
                <input
                  type="number"
                  className="p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:border-orange-500 focus:outline-none transition-all w-20 text-center font-bold"
                  value={diasInatividade}
                  onChange={e => setDiasInatividade(Number(e.target.value))}
                  min="1"
                />
                <label className="text-orange-300 font-semibold">dias</label>
              </div>
            </div>
          </div>

          {/* Container principal dos clientes */}
          <div className="bg-gradient-to-br from-[#111]/80 to-[#222]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden">
            {/* Decoração interna */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/10 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-500/10 rounded-full translate-y-8 -translate-x-8"></div>
            
            <div className="relative z-10 p-8">
              {loading ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-3xl">🔍</span>
                  </div>
                  <p className="text-blue-400 text-lg font-medium">Analisando clientes...</p>
                </div>
              ) : clientesInativos.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <span className="text-4xl">🎉</span>
                  </div>
                  <p className="text-2xl font-bold text-white mb-2">
                    {diasInatividade === 30 
                      ? "Todos os clientes estão ativos!" 
                      : `Nenhum cliente inativo há mais de ${diasInatividade} dias`}
                  </p>
                  <p className="text-gray-400 text-lg">
                    Excelente trabalho mantendo seus clientes engajados! ✨
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse shadow-lg shadow-red-400/50"></div>
                    <h3 className="text-red-400 font-bold text-xl">
                      🚨 {clientesInativos.length} Cliente{clientesInativos.length > 1 ? 's' : ''} Inativo{clientesInativos.length > 1 ? 's' : ''}
                    </h3>
                    <div className="flex-1 h-px bg-gradient-to-r from-red-400/50 to-transparent"></div>
                  </div>
                  
                  {clientesInativos.map(cliente => {
                    const dias = getDiasDesdeUltimoAgendamento(cliente._id);
                    const ultimoAg = getUltimoAgendamento(cliente._id);
                    const proximoAg = getProximoAgendamento(cliente._id);
                    
                    return (
                      <div key={cliente._id} className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 hover:border-white/40 transition-all shadow-lg hover:shadow-xl">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-3">
                              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                                <span className="text-xl">👤</span>
                              </div>
                              <div>
                                <h3 className="text-white font-bold text-xl">{cliente.name}</h3>
                                <p className="text-gray-300 font-medium">{cliente.email}</p>
                                {cliente.phone && (
                                  <p className="text-gray-400 text-sm">📞 {cliente.phone}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg mb-2">
                              <span className="text-2xl font-bold">{dias}</span>
                              <p className="text-xs">dias inativo</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                          {/* Informações de histórico */}
                          <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/30">
                            <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-2 text-sm">
                              📅 Histórico de Atendimento
                            </h4>
                            <p className="text-white text-sm">
                              Último serviço:{' '}
                              <span className="font-bold">
                                {ultimoAg ? ultimoAg.toLocaleDateString('pt-BR') : 'Nunca agendou'}
                              </span>
                            </p>
                            {proximoAg && (
                              <p className="text-emerald-400 text-sm font-medium mt-1">
                                {proximoAg.toLocaleDateString('pt-BR') === new Date().toLocaleDateString('pt-BR') 
                                  ? '✅ Atendimento hoje' 
                                  : `📋 Próximo: ${proximoAg.toLocaleDateString('pt-BR')}`}
                              </p>
                            )}
                          </div>
                          
                          {/* Ação de contato */}
                          <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/30 flex items-center justify-center">
                            <button
                              onClick={() => enviarLembrete(cliente._id, cliente.name, cliente.phone)}
                              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
                              disabled={!cliente.phone}
                            >
                              <span className="text-xl">💬</span>
                              {cliente.phone ? 'Enviar Lembrete WhatsApp' : 'Sem Telefone'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
