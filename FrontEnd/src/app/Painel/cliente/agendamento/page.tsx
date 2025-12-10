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
  status: 'pendente' | 'confirmado' | 'cancelado' | 'realizado';
}

interface Manicure {
  _id: string;
  name: string;
}

interface Adicional {
  nome: string;
  preco: number;
  porUnidade?: boolean;
}

interface Servico {
  _id: string;
  name: string;
  preco: number;
  tempoAproximado: string;
  adicionais?: Adicional[];
}

export default function AgendamentoClient() {
  const [manicures, setManicures] = useState<Manicure[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formAgendamento, setFormAgendamento] = useState({
    dataAgendamento: "",
    manicureId: "",
    serviceId: ""
  });
  const [selectedHour, setSelectedHour] = useState<string>("");
  const [selectedMinute, setSelectedMinute] = useState<string>("");
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [adicionaisSelecionados, setAdicionaisSelecionados] = useState<string[]>([]);
  const [adicionaisDisponiveis, setAdicionaisDisponiveis] = useState<Adicional[]>([]);
  const [valorTotal, setValorTotal] = useState<number>(0);
  const [quantidadesAdicionais, setQuantidadesAdicionais] = useState<{ [nome: string]: number }>({});

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [ags, us, ss] = await Promise.all([
        apiFetch("api/users/agendamentos").then(r => r.json()),
        apiFetch("api/users/users").then(r => r.json()), // Buscar todos os usuários
        apiFetch("api/users/servicos").then(r => r.json()),
      ]);
      const userId = sessionStorage.getItem('userId') || 'user-id-placeholder';
      const userAgendamentos = ags.filter((ag: Agendamento) => ag.clientId === userId);
      const manicureList = us.filter((u: any) => u.role === 'manicure' || u.role === 'admin');
      setAgendamentos(userAgendamentos);
      setManicures(manicureList);
      setServicos(ss);
    } catch (err) {
      setError("Erro ao buscar dados");
    }
  };

  const hourOptions = Array.from({ length: 14 }, (_, i) => ({ 
    value: String(i + 7).padStart(2, "0"), 
    label: String(i + 7).padStart(2, "0") 
  }));

  const minuteOptions = ["00", "15", "30", "45"].map(m => ({ 
    value: m, 
    label: m 
  }));

  function parseTempoAproximado(tempo: string): { horas: number, minutos: number } {
    if (!tempo) return { horas: 1, minutos: 0 };
    tempo = tempo.toLowerCase().replace(/[^0-9:]/g, ':').replace(/:+/g, ':').replace(/^:|:$/g, '');
    const partes = tempo.split(":");
    let horas = 0, minutos = 0;
    if (partes.length === 1) {
      horas = parseInt(partes[0]) || 0;
    } else if (partes.length >= 2) {
      horas = parseInt(partes[0]) || 0;
      minutos = parseInt(partes[1]) || 0;
    }
    return { horas, minutos };
  }

  const solicitarAgendamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setConflictError(null);

    try {
      const userId = sessionStorage.getItem('userId');
      if (!userId || userId === 'user-id-placeholder') {
        setError("Usuário não autenticado. Faça login novamente.");
        setLoading(false);
        return;
      }
      if (!formAgendamento.dataAgendamento || !selectedHour || !selectedMinute) {
        throw new Error("Data e horário são obrigatórios");
      }
      if (!formAgendamento.manicureId) {
        throw new Error("Selecione uma manicure");
      }
      if (!formAgendamento.serviceId) {
        throw new Error("Selecione um serviço");
      }
      // Monta a data/hora completa em UTC (padrão admin)
      let data = formAgendamento.dataAgendamento;
      if (data && selectedHour && selectedMinute) {
        const [year, month, day] = data.split("-");
        const dateLocal = new Date(Number(year), Number(month) - 1, Number(day), Number(selectedHour), Number(selectedMinute));
        data = dateLocal.toISOString();
      }
      // Checa conflitos
      const servicoSelecionado = servicos.find(s => s._id === formAgendamento.serviceId);
      if (!servicoSelecionado) {
        setError("Serviço inválido");
        setLoading(false);
        return;
      }
      const adicionaisDisponiveis: Adicional[] = servicoSelecionado.adicionais || [];
      const valorBase = servicoSelecionado.preco || 0;
      const valorAdicionais = adicionaisDisponiveis
        .filter((a: Adicional) => adicionaisSelecionados.includes(a.nome))
        .reduce((acc, a) => {
          if (a.porUnidade) {
            const qtd = quantidadesAdicionais[a.nome] || 1;
            return acc + a.preco * qtd;
          }
          return acc + a.preco;
        }, 0);
      const valorTotal = valorBase + valorAdicionais;
      const { horas: durH, minutos: durM } = parseTempoAproximado(servicoSelecionado.tempoAproximado);
      const duracaoMs = (durH * 60 + durM) * 60 * 1000;
      const inicioNovo = new Date(data);
      const fimNovo = new Date(inicioNovo.getTime() + duracaoMs);
      const conflitos = agendamentos.filter(a => {
        if (a.manicureId !== formAgendamento.manicureId) return false;
        if (new Date(a.dataAgendamento).toDateString() !== inicioNovo.toDateString()) return false;
        if (a.status === 'cancelado') return false;
        const servicoAgendado = servicos.find(s => s._id === a.serviceId);
        const { horas: agH, minutos: agM } = parseTempoAproximado(servicoAgendado?.tempoAproximado || "1:00");
        const duracaoAgMs = (agH * 60 + agM) * 60 * 1000;
        const inicioExistente = new Date(a.dataAgendamento);
        const fimExistente = new Date(inicioExistente.getTime() + duracaoAgMs);
        return (inicioNovo < fimExistente && fimNovo > inicioExistente);
      });
      if (conflitos.length > 0) {
        setConflictError("Já existe um agendamento para essa manicure nesse horário!");
        setLoading(false);
        return;
      }
      const adicionaisSelecionadosObjs = adicionaisDisponiveis.filter(a => adicionaisSelecionados.includes(a.nome)).map(a => {
        if (a.porUnidade) {
          return { ...a, quantidade: quantidadesAdicionais[a.nome] || 1 };
        }
        return a;
      });
      const payload = {
        dataAgendamento: data,
        tempoAproximado: servicoSelecionado.tempoAproximado,
        clientId: userId,
        manicureId: formAgendamento.manicureId,
        serviceId: formAgendamento.serviceId,
        status: 'pendente',
        adicionais: adicionaisSelecionadosObjs
      };
      const response = await apiFetch("api/users/criarAgendamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Erro ao solicitar agendamento");
      setFormAgendamento({ dataAgendamento: "", manicureId: "", serviceId: "" });
      setSelectedHour("");
      setSelectedMinute("");
      setAdicionaisSelecionados([]);
      setQuantidadesAdicionais({});
      setSuccess("Agendamento solicitado com sucesso! Aguarde a confirmação da manicure.");
      fetchAll();
    } catch (err: any) {
      setError(err.message || "Erro ao solicitar agendamento");
    } finally {
      setLoading(false);
    }
  };

  // Cálculo do valor total
  useEffect(() => {
    const servicoSelecionado = servicos.find(s => s._id === formAgendamento.serviceId);
    const adicionaisDisponiveis: Adicional[] = servicoSelecionado?.adicionais || [];
    const valorBase = servicoSelecionado?.preco || 0;
    const valorAdicionais = adicionaisDisponiveis
      .filter((a: Adicional) => adicionaisSelecionados.includes(a.nome))
      .reduce((acc, a) => {
        if (a.porUnidade) {
          const qtd = quantidadesAdicionais[a.nome] || 1;
          return acc + a.preco * qtd;
        }
        return acc + a.preco;
      }, 0);
    const valorTotal = valorBase + valorAdicionais;
    setAdicionaisDisponiveis(adicionaisDisponiveis);
    setValorTotal(valorTotal);
  }, [formAgendamento.serviceId, adicionaisSelecionados, servicos, quantidadesAdicionais]);

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
              
              <div className="relative bg-gradient-to-br from-[#111] via-[#1a1a1a] to-[#222] p-2 sm:p-3 rounded-xl sm:rounded-2xl border-2 border-pink-400/40 group-hover:border-pink-400/70 shadow-2xl transition-all duration-500">

                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-purple-500/10 rounded-xl sm:rounded-2xl"></div>
                
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
                
                <div className="hidden sm:block absolute -top-1 -left-1 w-3 h-3 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full shadow-lg shadow-pink-500/50"></div>
                <div className="hidden sm:block absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full shadow-lg shadow-purple-500/50"></div>
                <div className="hidden sm:block absolute -bottom-1 -left-1 w-2 h-2 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-pink-300 bg-clip-text text-transparent">
                Espaço Marias
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 font-medium">Solicitar Agendamento</p>
            </div>
          </div>

          <a 
            href="/home" 
            className="w-full sm:w-auto text-center bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all transform hover:scale-105 shadow-lg text-sm sm:text-base"
          >
            🏠 Voltar ao Painel
          </a>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8 relative z-10">
        <div className="bg-gradient-to-br from-[#111]/80 to-[#222]/80 backdrop-blur-xl p-5 sm:p-10 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl border border-pink-500/20 relative">
          <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-pink-500/10 rounded-full -translate-y-8 sm:-translate-y-10 translate-x-8 sm:translate-x-10"></div>
          <div className="absolute bottom-0 left-0 w-12 sm:w-16 h-12 sm:h-16 bg-purple-500/10 rounded-full translate-y-6 sm:translate-y-8 -translate-x-6 sm:-translate-x-8"></div>
          
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-4xl font-bold text-center mb-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              📅 Novo Agendamento
            </h1>
            <p className="text-center text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base">
              Escolha a data, horário e serviço desejado para seu atendimento
            </p>
            <form className="space-y-4 sm:space-y-6" onSubmit={solicitarAgendamento}>

              <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-4 sm:p-6 rounded-xl border border-blue-500/30 backdrop-blur-sm">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  🗓️ Data e Horário
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-blue-400 font-semibold mb-1.5 sm:mb-2 text-sm sm:text-base">📅 Data</label>
                    <input
                      type="date"
                      className="w-full p-3 sm:p-4 bg-white/10 backdrop-blur-sm border border-gray-600 rounded-lg sm:rounded-xl text-white focus:border-blue-500 focus:outline-none transition-colors text-sm sm:text-base"
                      value={formAgendamento.dataAgendamento}
                      onChange={e => setFormAgendamento({ ...formAgendamento, dataAgendamento: e.target.value })}
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-blue-400 font-semibold mb-1.5 sm:mb-2 text-sm sm:text-base">🕐 Hora</label>
                    <select
                      className="w-full p-3 sm:p-4 bg-white/10 backdrop-blur-sm border border-gray-600 rounded-lg sm:rounded-xl text-white focus:border-blue-500 focus:outline-none transition-colors text-sm sm:text-base"
                      value={selectedHour}
                      onChange={e => setSelectedHour(e.target.value)}
                      required
                    >
                      <option value="" className="bg-gray-800">Selecione a hora</option>
                      {hourOptions.map(h => (
                        <option key={h.value} value={h.value} className="bg-gray-800">{h.value}h</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-blue-400 font-semibold mb-1.5 sm:mb-2 text-sm sm:text-base">⏰ Minutos</label>
                    <select
                      className="w-full p-3 sm:p-4 bg-white/10 backdrop-blur-sm border border-gray-600 rounded-lg sm:rounded-xl text-white focus:border-blue-500 focus:outline-none transition-colors text-sm sm:text-base"
                      value={selectedMinute}
                      onChange={e => setSelectedMinute(e.target.value)}
                      required
                    >
                      <option value="" className="bg-gray-800">Selecione os minutos</option>
                      {minuteOptions.map(m => (
                        <option key={m.value} value={m.value} className="bg-gray-800">{m.value}min</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 sm:p-6 rounded-xl border border-purple-500/30 backdrop-blur-sm">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  💅 Profissional e Serviço
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-purple-400 font-semibold mb-1.5 sm:mb-2 text-sm sm:text-base">👩‍💼 Manicure</label>
                    <select
                      className="w-full p-3 sm:p-4 bg-white/10 backdrop-blur-sm border border-gray-600 rounded-lg sm:rounded-xl text-white focus:border-purple-500 focus:outline-none transition-colors text-sm sm:text-base"
                      value={formAgendamento.manicureId}
                      onChange={e => setFormAgendamento({ ...formAgendamento, manicureId: e.target.value })}
                      required
                    >
                      <option value="" className="bg-gray-800">Selecione a Manicure</option>
                      {manicures.map(m => (
                        <option key={m._id} value={m._id} className="bg-gray-800">{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-purple-400 font-semibold mb-1.5 sm:mb-2 text-sm sm:text-base">✨ Serviço</label>
                    <select
                      className="w-full p-3 sm:p-4 bg-white/10 backdrop-blur-sm border border-gray-600 rounded-lg sm:rounded-xl text-white focus:border-purple-500 focus:outline-none transition-colors text-sm sm:text-base"
                      value={formAgendamento.serviceId}
                      onChange={e => setFormAgendamento({ ...formAgendamento, serviceId: e.target.value })}
                      required
                    >
                      <option value="" className="bg-gray-800">Selecione o Serviço</option>
                      {servicos.map(s => (
                        <option key={s._id} value={s._id} className="bg-gray-800">
                          {s.name} - R$ {s.preco.toFixed(2)} - {s.tempoAproximado}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {adicionaisDisponiveis.length > 0 && (
                <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-4 sm:p-6 rounded-xl border border-emerald-500/30 backdrop-blur-sm">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                    ✨ Serviços Adicionais
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    {adicionaisDisponiveis.map((a, idx) => (
                      <div key={idx} className="bg-white/5 p-3 sm:p-4 rounded-lg border border-emerald-500/20">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <input
                            type="checkbox"
                            id={`adicional-${idx}`}
                            checked={adicionaisSelecionados.includes(a.nome)}
                            onChange={e => {
                              if (e.target.checked) {
                                setAdicionaisSelecionados([...adicionaisSelecionados, a.nome]);
                                if (a.porUnidade && !quantidadesAdicionais[a.nome]) {
                                  setQuantidadesAdicionais(q => ({ ...q, [a.nome]: 1 }));
                                }
                              } else {
                                setAdicionaisSelecionados(adicionaisSelecionados.filter(n => n !== a.nome));
                                if (a.porUnidade) {
                                  setQuantidadesAdicionais(q => {
                                    const novo = { ...q };
                                    delete novo[a.nome];
                                    return novo;
                                  });
                                }
                              }
                            }}
                            className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 bg-white/10 border-2 border-emerald-500 rounded focus:ring-emerald-500 focus:ring-2"
                          />
                          <label htmlFor={`adicional-${idx}`} className="flex-1 text-white font-medium text-sm sm:text-base">
                            {a.nome}
                          </label>
                          <span className="text-emerald-400 font-bold text-sm sm:text-base">
                            +R$ {a.preco.toFixed(2)}
                          </span>
                        </div>
                        
                        {a.porUnidade && adicionaisSelecionados.includes(a.nome) && (
                          <div className="mt-2 sm:mt-3 flex items-center gap-2 sm:gap-3 ml-6 sm:ml-8">
                            <label className="text-emerald-400 font-semibold text-xs sm:text-sm">
                              💅 Quantidade:
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={10}
                              className="w-16 sm:w-20 p-1.5 sm:p-2 bg-white/10 backdrop-blur-sm border border-emerald-500 rounded-lg text-white text-center font-bold focus:border-emerald-400 focus:outline-none transition-colors text-sm"
                              value={quantidadesAdicionais[a.nome] || 1}
                              onChange={e => {
                                const val = Math.max(1, Math.min(10, Number(e.target.value)));
                                setQuantidadesAdicionais(q => ({ ...q, [a.nome]: val }));
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-4 sm:p-6 rounded-xl border border-amber-500/30 backdrop-blur-sm">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  💰 Resumo do Agendamento
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-amber-500/20">
                    <span className="text-amber-200 font-medium text-sm sm:text-base">Serviço Principal</span>
                    <span className="text-white font-bold text-sm sm:text-base">R$ {servicos.find(s => s._id === formAgendamento.serviceId)?.preco?.toFixed(2) || '0.00'}</span>
                  </div>
                  
                  {adicionaisSelecionados.length > 0 && (
                    <div className="space-y-1.5 sm:space-y-2">
                      <h4 className="text-amber-400 font-semibold text-sm sm:text-base">Serviços Adicionais:</h4>
                      {adicionaisSelecionados.map(nome => {
                        const adicional = adicionaisDisponiveis.find(a => a.nome === nome);
                        const quantidade = quantidadesAdicionais[nome] || 1;
                        const precoTotal = (adicional?.preco || 0) * quantidade;
                        return (
                          <div key={nome} className="flex justify-between items-center text-xs sm:text-sm">
                            <span className="text-amber-200">
                              {nome} {adicional?.porUnidade ? `(${quantidade}x)` : ''}
                            </span>
                            <span className="text-white font-semibold">+R$ {precoTotal?.toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  <div className="pt-2 sm:pt-3 border-t border-amber-500/30">
                    <div className="flex justify-between items-center">
                      <span className="text-lg sm:text-xl font-bold text-amber-400">Total</span>
                      <span className="text-xl sm:text-2xl font-bold text-white bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                        R$ {valorTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-base sm:text-lg rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-pink-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="text-sm sm:text-base">Enviando...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm sm:text-base">✨ Solicitar Agendamento</span>
                  </div>
                )}
              </button>
            </form>

            {conflictError && (
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/50 rounded-lg sm:rounded-xl text-red-200 text-center font-medium text-sm sm:text-base">
                ⚠️ {conflictError}
              </div>
            )}
            {error && (
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/50 rounded-lg sm:rounded-xl text-red-200 text-center font-medium text-sm sm:text-base">
                ❌ {error}
              </div>
            )}
            {success && (
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-green-500/20 backdrop-blur-sm border border-green-500/50 rounded-lg sm:rounded-xl text-green-200 text-center font-medium text-sm sm:text-base">
                ✅ {success}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
