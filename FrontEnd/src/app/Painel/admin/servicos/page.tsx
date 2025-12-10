"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../../lib/api";

interface Adicional {
  nome: string;
  preco: string;
  porUnidade?: boolean;
}

interface Servico {
  _id: string;
  name: string;
  preco: number;
  tempoAproximado: string;
  dataCadastro: string;
  adicionais?: { nome: string; preco: number; porUnidade?: boolean }[];
}

export default function AdminServicos() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [form, setForm] = useState({
    name: "",
    preco: "",
    tempoAproximado: ""
  });
  const [tempoHoras, setTempoHoras] = useState("");
  const [tempoMinutos, setTempoMinutos] = useState("");
  const [adicionais, setAdicionais] = useState<Adicional[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Função para extrair horas e minutos de uma string formatada
  const extrairTempo = (tempoString: string) => {
    const horasMatch = tempoString.match(/(\d+)\s*hora/);
    const minutosMatch = tempoString.match(/(\d+)\s*minuto/);
    
    return {
      horas: horasMatch ? horasMatch[1] : "",
      minutos: minutosMatch ? minutosMatch[1] : ""
    };
  };

  // Função para formatar o tempo em texto
  const formatarTempo = (horas: string, minutos: string) => {
    const h = parseInt(horas) || 0;
    const m = parseInt(minutos) || 0;
    
    if (h === 0 && m === 0) return "";
    
    let resultado = "";
    if (h > 0) {
      resultado += h === 1 ? "1 hora" : `${h} horas`;
    }
    if (m > 0) {
      if (resultado) resultado += " e ";
      resultado += m === 1 ? "1 minuto" : `${m} minutos`;
    }
    
    return resultado;
  };

  // Atualizar o tempo formatado sempre que horas ou minutos mudarem
  useEffect(() => {
    const tempoFormatado = formatarTempo(tempoHoras, tempoMinutos);
    setForm(prev => ({ ...prev, tempoAproximado: tempoFormatado }));
  }, [tempoHoras, tempoMinutos]);

  useEffect(() => {
    fetchServicos();
  }, []);

  const fetchServicos = async () => {
    try {
      const response = await apiFetch("api/users/servicos");
      if (!response.ok) throw new Error("Erro ao buscar serviços");
      const data = await response.json();
      setServicos(data);
    } catch (err) {
      setError("Erro ao buscar serviços");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!form.name.trim()) {
        throw new Error("Nome do serviço é obrigatório");
      }
      if (!form.preco || parseFloat(form.preco) <= 0) {
        throw new Error("Preço deve ser maior que zero");
      }
      if (!form.tempoAproximado.trim()) {
        throw new Error("Defina pelo menos horas ou minutos para a duração do serviço");
      }

      const payload = {
        name: form.name.trim(),
        preco: parseFloat(form.preco),
        tempoAproximado: form.tempoAproximado.trim(),
        adicionais: adicionais
          .filter(a => a.nome.trim() && a.preco && !isNaN(Number(a.preco)))
          .map(a => ({ nome: a.nome.trim(), preco: parseFloat(a.preco), porUnidade: !!a.porUnidade }))
      };

      let response;
      if (editId) {
        response = await apiFetch(`api/users/servicos/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await apiFetch("api/users/servicos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao salvar serviço");
      }

      // Limpar formulário e recarregar lista
      setForm({ name: "", preco: "", tempoAproximado: "" });
      setTempoHoras("");
      setTempoMinutos("");
      setAdicionais([]);
      setEditId(null);
      fetchServicos();
      
    } catch (err: any) {
      setError(err.message || "Erro ao salvar serviço");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (servico: Servico) => {
    setEditId(servico._id);
    setForm({
      name: servico.name,
      preco: servico.preco.toString(),
      tempoAproximado: servico.tempoAproximado
    });
    
    const { horas, minutos } = extrairTempo(servico.tempoAproximado);
    setTempoHoras(horas);
    setTempoMinutos(minutos);
    
    setAdicionais(servico.adicionais?.map(a => ({ nome: a.nome, preco: a.preco.toString(), porUnidade: !!a.porUnidade })) || []);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este serviço?")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch(`api/users/servicos/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao excluir serviço");
      }

      fetchServicos();
    } catch (err: any) {
      setError(err.message || "Erro ao excluir serviço");
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm({ name: "", preco: "", tempoAproximado: "" });
    setTempoHoras("");
    setTempoMinutos("");
    setAdicionais([]);
  };

  // Filtrar serviços baseado na busca
  const servicosFiltrados = servicos.filter(servico =>
    servico.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    servico.tempoAproximado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="min-h-screen font-sans flex flex-col bg-gradient-to-br from-[#222] to-[#111] text-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-pink-500/10 rounded-full -translate-x-32 sm:-translate-x-48 -translate-y-32 sm:-translate-y-48 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-purple-500/10 rounded-full translate-x-32 sm:translate-x-48 translate-y-32 sm:translate-y-48 blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 w-48 sm:w-64 h-48 sm:h-64 bg-blue-500/5 rounded-full -translate-x-24 sm:-translate-x-32 -translate-y-24 sm:-translate-y-32 blur-2xl"></div>

      <header className="w-full py-4 sm:py-6 lg:py-8 px-4 sm:px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-pink-500/40 via-purple-500/40 to-pink-500/40 rounded-2xl sm:rounded-3xl blur-lg group-hover:blur-xl transition-all duration-500 animate-pulse"></div>
              
              <div className="relative bg-gradient-to-br from-[#111] via-[#1a1a1a] to-[#222] p-2 sm:p-3 rounded-xl sm:rounded-2xl border-2 border-pink-400/40 group-hover:border-pink-400/70 shadow-2xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-purple-500/10 rounded-xl sm:rounded-2xl"></div>
                
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
                
                <div className="absolute -top-1 -left-1 w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full shadow-lg shadow-pink-500/50"></div>
                <div className="absolute -top-1 -right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full shadow-lg shadow-purple-500/50"></div>
                <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-pink-300 bg-clip-text text-transparent">
                Espaço Marias
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 font-medium">Gerenciamento de Serviços</p>
            </div>
          </div>

          <a
            href="/home"
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center gap-2 text-sm sm:text-base"
          >
            🏠 Voltar ao Painel
          </a>
        </div>
      </header>

      <section className="flex-1 px-4 sm:px-6 py-4 sm:py-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            ⚙️ Gerenciamento de Serviços
          </h1>
          <p className="text-center text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base">
            Cadastre e gerencie os serviços oferecidos no salão
          </p>
          <div className="bg-gradient-to-br from-[#111]/80 to-[#222]/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden mb-6 sm:mb-8">
            {/* Decoração interna */}
            <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-blue-500/10 rounded-full -translate-y-8 sm:-translate-y-10 translate-x-8 sm:translate-x-10"></div>
            <div className="absolute bottom-0 left-0 w-12 sm:w-16 h-12 sm:h-16 bg-purple-500/10 rounded-full translate-y-6 sm:translate-y-8 -translate-x-6 sm:-translate-x-8"></div>
            
            <div className="relative z-10 p-4 sm:p-6 lg:p-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50"></div>
                <h2 className="text-blue-400 font-bold text-2xl">🔍 Buscar Serviços</h2>
              </div>
              
              <input
                type="text"
                placeholder="🔎 Buscar serviços por nome ou tempo..."
                className="w-full p-4 border-2 border-white/20 rounded-xl bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#111]/80 to-[#222]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden mb-8">

            <div className="absolute top-0 left-0 w-24 h-24 bg-pink-500/10 rounded-full -translate-y-12 -translate-x-12"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full translate-y-16 translate-x-16"></div>
            
            <div className="relative z-10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse shadow-lg shadow-pink-400/50"></div>
                <h2 className="text-pink-400 font-bold text-2xl">📋 Lista de Serviços</h2>
                {servicosFiltrados.length > 0 && (
                  <span className="bg-pink-500/20 px-3 py-1 rounded-full text-pink-300 text-sm font-semibold">
                    {servicosFiltrados.length} serviço{servicosFiltrados.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              {servicosFiltrados.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl mb-6 animate-pulse">
                    <span className="text-3xl">📝</span>
                  </div>
                  <p className="text-white text-xl font-bold mb-2">
                    {servicos.length === 0 ? "Nenhum serviço cadastrado ainda" : "Nenhum serviço encontrado"}
                  </p>
                  <p className="text-gray-300">
                    {servicos.length === 0 ? "Comece cadastrando seu primeiro serviço" : "Tente ajustar os filtros de busca"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl">
                  <table className="min-w-full text-white">
                    <thead>
                      <tr className="bg-gradient-to-r from-pink-500 to-purple-500">
                        <th className="px-6 py-4 text-left text-white font-bold">📋 Nome & Adicionais</th>
                        <th className="px-6 py-4 text-right text-white font-bold">💰 Preço Base</th>
                        <th className="px-6 py-4 text-left text-white font-bold">⏱️ Tempo Aprox.</th>
                        <th className="px-6 py-4 text-left text-white font-bold">📅 Data Cadastro</th>
                        <th className="px-6 py-4 text-center text-white font-bold">⚙️ Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {servicosFiltrados.map((servico) => (
                        <tr key={servico._id} className="border-b border-white/10 hover:bg-gradient-to-r hover:from-white/5 hover:to-white/10 transition-all duration-300">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-semibold text-white text-lg flex items-center gap-2">
                                <span className="text-pink-400">✨</span>
                                {servico.name}
                              </div>
                              {servico.adicionais && servico.adicionais.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {servico.adicionais.map((adicional, idx) => (
                                    <span 
                                      key={idx}
                                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-400/30 hover:border-blue-400/50 transition-all shadow-lg"
                                      title={`${adicional.porUnidade ? 'Por unidade' : 'Valor fixo'}: R$ ${adicional.preco.toFixed(2)}`}
                                    >
                                      <span className="text-blue-200">+</span>
                                      <span className="ml-1">{adicional.nome}</span>
                                      <span className="ml-2 text-blue-100 font-bold">R$ {adicional.preco.toFixed(2)}</span>
                                      {adicional.porUnidade && (
                                        <span className="ml-1 text-blue-300 text-[10px]">📊</span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-bold text-green-300 text-lg">
                              R$ {servico.preco.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-purple-500/20 px-3 py-1 rounded-full text-purple-300 font-semibold">
                              {servico.tempoAproximado}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-300">
                            {new Date(servico.dataCadastro).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2 justify-center">
                              <button
                                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all transform hover:scale-105 shadow-lg flex items-center gap-1"
                                onClick={() => handleEdit(servico)}
                                disabled={loading}
                              >
                                ✏️ Editar
                              </button>
                              <button
                                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all transform hover:scale-105 shadow-lg flex items-center gap-1"
                                onClick={() => handleDelete(servico._id)}
                                disabled={loading}
                              >
                                🗑️ Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#111]/80 to-[#222]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden">

            <div className="absolute top-0 right-0 w-28 h-28 bg-green-500/10 rounded-full -translate-y-14 translate-x-14"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-blue-500/10 rounded-full translate-y-10 -translate-x-10"></div>
            
            <div className="relative z-10 p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                <h2 className="text-green-400 font-bold text-2xl">
                  {editId ? "✏️ Editar Serviço" : "➕ Cadastrar Novo Serviço"}
                </h2>
              </div>
              
              <form className="grid grid-cols-1 lg:grid-cols-2 gap-6" onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-white font-semibold mb-2">📝 Nome do Serviço</label>
                    <input
                      type="text"
                      placeholder="Ex: Manicure Completa"
                      className="w-full p-4 border-2 border-white/20 rounded-xl bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:border-pink-400/50 focus:outline-none focus:ring-2 focus:ring-pink-400/20 transition-all"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white font-semibold mb-2">💰 Preço Base (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="w-full p-4 border-2 border-white/20 rounded-xl bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:border-green-400/50 focus:outline-none focus:ring-2 focus:ring-green-400/20 transition-all"
                      value={form.preco}
                      onChange={(e) => setForm({ ...form, preco: e.target.value })}
                      required
                    />
                  </div>

                  <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-6 rounded-2xl border border-purple-400/30">
                    <h3 className="text-purple-400 font-bold mb-4 flex items-center gap-2">
                      <span>⏱️</span>
                      Tempo de Duração do Serviço
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-white text-sm block mb-2 font-semibold">Horas</label>
                        <input
                          type="number"
                          min="0"
                          max="12"
                          placeholder="0"
                          className="w-full p-3 border-2 border-white/20 rounded-xl bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20 transition-all"
                          value={tempoHoras}
                          onChange={(e) => setTempoHoras(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-white text-sm block mb-2 font-semibold">Minutos</label>
                        <select
                          className="w-full p-3 border-2 border-white/20 rounded-xl bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm text-white focus:border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20 transition-all"
                          value={tempoMinutos}
                          onChange={(e) => setTempoMinutos(e.target.value)}
                        >
                          <option value="" className="bg-gray-800">0</option>
                          <option value="5" className="bg-gray-800">5</option>
                          <option value="10" className="bg-gray-800">10</option>
                          <option value="15" className="bg-gray-800">15</option>
                          <option value="20" className="bg-gray-800">20</option>
                          <option value="25" className="bg-gray-800">25</option>
                          <option value="30" className="bg-gray-800">30</option>
                          <option value="35" className="bg-gray-800">35</option>
                          <option value="40" className="bg-gray-800">40</option>
                          <option value="45" className="bg-gray-800">45</option>
                          <option value="50" className="bg-gray-800">50</option>
                          <option value="55" className="bg-gray-800">55</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-white text-sm block mb-2 font-semibold">Tempo Total</label>
                        <div className="w-full p-3 border-2 border-purple-400/30 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-300 min-h-[48px] flex items-center font-medium">
                          {form.tempoAproximado || "⏳ Defina duração"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-6 rounded-2xl border border-blue-400/30">
                    <h3 className="text-blue-400 font-bold mb-4 flex items-center gap-2">
                      <span>🎯</span>
                      Adicionais do Serviço
                    </h3>
                    
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                      {adicionais.map((a, idx) => (
                        <div key={idx} className="bg-gradient-to-r from-white/5 to-white/10 p-4 rounded-xl border border-white/20">
                          <div className="space-y-3">
                            <input
                              type="text"
                              placeholder="Nome do adicional"
                              className="w-full p-3 border-2 border-white/20 rounded-xl bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all"
                              value={a.nome}
                              onChange={e => setAdicionais(adicionais.map((ad, i) => i === idx ? { ...ad, nome: e.target.value } : ad))}
                            />
                            <div className="flex gap-3">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Preço (R$)"
                                className="flex-1 p-3 border-2 border-white/20 rounded-xl bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:border-green-400/50 focus:outline-none focus:ring-2 focus:ring-green-400/20 transition-all"
                                value={a.preco}
                                onChange={e => setAdicionais(adicionais.map((ad, i) => i === idx ? { ...ad, preco: e.target.value } : ad))}
                              />
                              <button
                                type="button"
                                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                                onClick={() => setAdicionais(adicionais.filter((_, i) => i !== idx))}
                              >
                                🗑️
                              </button>
                            </div>
                            <label className="flex items-center gap-2 text-white text-sm bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-2 rounded-lg border border-yellow-400/30">
                              <input
                                type="checkbox"
                                checked={!!a.porUnidade}
                                onChange={e => setAdicionais(adicionais.map((ad, i) => i === idx ? { ...ad, porUnidade: e.target.checked } : ad))}
                                className="w-4 h-4 text-yellow-500 bg-transparent border-2 border-yellow-400 rounded focus:ring-yellow-500 focus:ring-2"
                              />
                              <span className="font-medium">📊 Cobrar por unidade</span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      type="button"
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg mt-4"
                      onClick={() => setAdicionais([...adicionais, { nome: "", preco: "", porUnidade: false }])}
                    >
                      ➕ Adicionar Novo Adicional
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-2 flex gap-4 pt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none"
                    disabled={loading}
                  >
                    {loading ? "💾 Salvando..." : (editId ? "✅ Atualizar Serviço" : "🚀 Cadastrar Serviço")}
                  </button>
                  
                  {editId && (
                    <button
                      type="button"
                      className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                      onClick={cancelEdit}
                      disabled={loading}
                    >
                      ❌ Cancelar Edição
                    </button>
                  )}
                </div>
              </form>

              {error && (
                <div className="mt-6 p-4 bg-gradient-to-r from-red-500/20 to-red-600/20 border-2 border-red-500/50 rounded-xl text-red-200 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-red-400">⚠️</span>
                    <span className="font-semibold">{error}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
