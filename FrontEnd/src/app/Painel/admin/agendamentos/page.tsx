"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { apiFetch } from "../../../../lib/api";

// Importar react-select dinamicamente para evitar erro de hidratação
const Select = dynamic(() => import("react-select"), { ssr: false });

interface Agendamento {
  _id: string;
  dataAgendamento: string;
  tempoAproximado: string;
  clientId: string;
  manicureId: string;
  serviceId: string;
}
interface User { _id: string; name: string; role: string; }
interface Servico { _id: string; name: string; preco: number; tempoAproximado: string; }
interface Imagem { url: string; title?: string; description?: string; }
interface DadosSalao {
  _id?: string;
  phone?: string;
  telefone?: string;
  endereco: string;
  email: string;
  instagram?: string;
  fotosServicos?: Imagem[];
  fotosHome?: Imagem[];
}

export default function AdminAgendamentos() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [form, setForm] = useState({
    dataAgendamento: "", // Será definido no useEffect
    tempoAproximado: "",
    clientId: "",
    manicureId: "",
    serviceId: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedManicure, setSelectedManicure] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [clientSearch, setClientSearch] = useState("");

  const [clientOption, setClientOption] = useState<{ label: string; value: string } | null>(null);
  const [selectedHour, setSelectedHour] = useState<string>("");
  const [selectedMinute, setSelectedMinute] = useState<string>("");
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agendamentoParaDeletar, setAgendamentoParaDeletar] = useState<string | null>(null);
  const [dadosSalao, setDadosSalao] = useState<DadosSalao | null>(null);

  // Função para obter a data local atual no formato YYYY-MM-DD
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    // Sempre definir a data atual quando a página carrega
    const hoje = getLocalDateString();
    setSelectedDate(hoje);
    setForm(prev => ({ ...prev, dataAgendamento: hoje }));
    fetchAll();
  }, []);

  // Altere o fetchAll para buscar todos os usuários, não só manicures
  const fetchAll = async () => {
    try {
      const [ags, us, ss] = await Promise.all([
        apiFetch("api/users/agendamentos").then(r => r.json()),
        apiFetch("api/users/users").then(r => r.json()), // Remove o filtro role=manicure
        apiFetch("api/users/servicos").then(r => r.json()),
      ]);

      // Se houver agendamentos cujas manicureId ou clientId não existem mais em users, deletar automaticamente
      async function cleanupOrphanAgendamentos(agendamentosList: Agendamento[], usersList: User[]) {
        const userIds = new Set(usersList.map(u => u._id));
        const orphans = agendamentosList.filter(a => !userIds.has(a.manicureId) || !userIds.has(a.clientId));
        if (orphans.length === 0) return 0;
        try {
          await Promise.all(orphans.map(o => apiFetch(`api/users/agendamentos/${o._id}`, { method: 'DELETE' })));
          console.info(`cleanupOrphanAgendamentos: deleted ${orphans.length} orphan agendamentos`);
          return orphans.length;
        } catch (e) {
          console.error('Erro ao limpar agendamentos órfãos', e);
          return 0;
        }
      }

      // primeiro ajustar estados locais
      setAgendamentos(ags);
      setUsers(us);
      setServicos(ss);

      // executar limpeza de órfãos em background e, se houver exclusões, recarregar a lista
      const deleted = await cleanupOrphanAgendamentos(ags, us);
      if (deleted > 0) {
        // recarregar dados atualizados
        const [ags2] = await Promise.all([
          apiFetch("api/users/agendamentos").then(r => r.json()),
        ]);
        setAgendamentos(ags2);
      }
    } catch (err) {
      setError("Erro ao buscar dados");
    }
  };

  // Opções para selects de hora e minuto
  const hourOptions = Array.from({ length: 24 }, (_, i) => ({ value: String(i).padStart(2, "0"), label: String(i).padStart(2, "0") }));
  const minuteOptions = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map(m => ({ value: m, label: m }));

  // Função utilitária para extrair horas e minutos de qualquer formato
  function parseTempoAproximado(tempo: string): { horas: number, minutos: number } {
    if (!tempo) return { horas: 1, minutos: 0 };
    // Remove texto e espaços
    tempo = tempo.toLowerCase().replace(/[^0-9:]/g, ':').replace(/:+/g, ':').replace(/^:|:$/g, '');
    // Ex: "2:30", "02:30", "2:00", "2", "2h30", "2 horas", "2:30 horas"
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

  // Corrigir data para UTC e exibir corretamente + checar conflitos
  const adicionarAgendamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setConflictError(null);
    try {
      // Monta a data/hora completa em UTC
      let data = form.dataAgendamento;
      if (data && selectedHour && selectedMinute) {
        // Cria a data como local de Brasília, mas salva como UTC (ISO)
        const [year, month, day] = data.split("-");
        // Cria a data no fuso do navegador (usuário está em Brasília)
        const dateLocal = new Date(Number(year), Number(month) - 1, Number(day), Number(selectedHour), Number(selectedMinute));
        // Salva como ISO (UTC, com 'Z')
        data = dateLocal.toISOString();
      }
      // Checa conflitos
      const servicoSelecionado = servicos.find(s => s._id === form.serviceId);
      if (!servicoSelecionado) throw new Error("Serviço inválido");
      // Corrige: considera horas e minutos (agora aceita vários formatos)
      const { horas: durH, minutos: durM } = parseTempoAproximado(servicoSelecionado.tempoAproximado);
      const duracaoMs = (durH * 60 + durM) * 60 * 1000;
      const inicioNovo = new Date(data);
      const fimNovo = new Date(inicioNovo.getTime() + duracaoMs);
      const conflitos = agendamentos.filter(a => {
        if (a.manicureId !== form.manicureId) return false;
        if (new Date(a.dataAgendamento).toDateString() !== inicioNovo.toDateString()) return false;
        const servicoAgendado = servicos.find(s => s._id === a.serviceId);
        const { horas: agH, minutos: agM } = parseTempoAproximado(servicoAgendado?.tempoAproximado || "1:00");
        const duracaoAgMs = (agH * 60 + agM) * 60 * 1000;
        const inicioExistente = new Date(a.dataAgendamento);
        const fimExistente = new Date(inicioExistente.getTime() + duracaoAgMs);
        // O novo agendamento só pode começar se for MAIOR OU IGUAL ao fim do anterior
        return (inicioNovo < fimExistente);
      });
      // NOVO: impedir agendar se o início do novo for menor que o fim de qualquer outro
      const existeFimMaior = agendamentos.some(a => {
        if (a.manicureId !== form.manicureId) return false;
        if (new Date(a.dataAgendamento).toDateString() !== inicioNovo.toDateString()) return false;
        const servicoAgendado = servicos.find(s => s._id === a.serviceId);
        const { horas: agH, minutos: agM } = parseTempoAproximado(servicoAgendado?.tempoAproximado || "1:00");
        const duracaoAgMs = (agH * 60 + agM) * 60 * 1000;
        const inicioExistente = new Date(a.dataAgendamento);
        const fimExistente = new Date(inicioExistente.getTime() + duracaoAgMs);
        return (inicioNovo >= inicioExistente && inicioNovo < fimExistente);
      });
      if (conflitos.length > 0 || existeFimMaior) {
        setConflictError("Já existe agendamento para essa manicure nesse horário!");
        setLoading(false);
        return;
      }
      const response = await apiFetch("api/users/criarAgendamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, dataAgendamento: data }),
      });
      if (!response.ok) throw new Error("Erro ao adicionar agendamento");
      setForm({ dataAgendamento: getLocalDateString(), tempoAproximado: "", clientId: "", manicureId: "", serviceId: "" });
      setClientOption(null);
      setSelectedHour("");
      setSelectedMinute("");
      fetchAll();
    } catch (err) {
      setError("Erro ao adicionar agendamento");
    } finally {
      setLoading(false);
    }
  };

  // Deletar agendamento
  const deletarAgendamento = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`api/users/agendamentos/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao deletar agendamento");
      fetchAll();
    } catch (err) {
      setError("Erro ao deletar agendamento");
    } finally {
      setLoading(false);
    }
  };

  // Sempre atualizar tempoAproximado ao selecionar serviço
  const handleServiceChange = (serviceId: string) => {
    setForm((prev) => {
      const servico = servicos.find(s => s._id === serviceId);
      return {
        ...prev,
        serviceId,
        tempoAproximado: servico ? servico.tempoAproximado : ""
      };
    });
  };

  // Preencher formulário para edição
  const handleEdit = (ag: Agendamento) => {
    setEditId(ag._id);
    setForm({
      dataAgendamento: ag.dataAgendamento.slice(0, 10),
      tempoAproximado: ag.tempoAproximado,
      clientId: ag.clientId,
      manicureId: ag.manicureId,
      serviceId: ag.serviceId
    });
    setSelectedHour(new Date(ag.dataAgendamento).getUTCHours().toString().padStart(2, "0"));
    setSelectedMinute(new Date(ag.dataAgendamento).getUTCMinutes().toString().padStart(2, "0"));
    setClientOption(clientOptions.find(opt => opt.value === ag.clientId) || null);
  };

  // Salvar (criar ou atualizar) agendamento
  const salvarAgendamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setConflictError(null);
    try {
      let data = form.dataAgendamento;
      if (data && selectedHour && selectedMinute) {
        const [year, month, day] = data.split("-");
        const dateLocal = new Date(Number(year), Number(month) - 1, Number(day), Number(selectedHour), Number(selectedMinute));
        data = dateLocal.toISOString();
      }
      // Checa conflitos (igual já faz)
      const servicoSelecionado = servicos.find(s => s._id === form.serviceId);
      if (!servicoSelecionado) throw new Error("Serviço inválido");
      const { horas: durH, minutos: durM } = parseTempoAproximado(servicoSelecionado.tempoAproximado);
      const duracaoMs = (durH * 60 + durM) * 60 * 1000;
      const inicioNovo = new Date(data);
      const fimNovo = new Date(inicioNovo.getTime() + duracaoMs);
      const conflitos = agendamentos.filter(a => {
        if (a.manicureId !== form.manicureId) return false;
        if (new Date(a.dataAgendamento).toDateString() !== inicioNovo.toDateString()) return false;
        if (editId && a._id === editId) return false; // Ignora o próprio agendamento em edição
        const servicoAgendado = servicos.find(s => s._id === a.serviceId);
        const { horas: agH, minutos: agM } = parseTempoAproximado(servicoAgendado?.tempoAproximado || "1:00");
        const duracaoAgMs = (agH * 60 + agM) * 60 * 1000;
        const inicioExistente = new Date(a.dataAgendamento);
        const fimExistente = new Date(inicioExistente.getTime() + duracaoAgMs);
        // O novo agendamento só pode começar se for MAIOR OU IGUAL ao fim do anterior
        return (inicioNovo < fimExistente);
      });
      // NOVO: impedir agendar se o início do novo for menor que o fim de qualquer outro
      const existeFimMaior = agendamentos.some(a => {
        if (a.manicureId !== form.manicureId) return false;
        if (new Date(a.dataAgendamento).toDateString() !== inicioNovo.toDateString()) return false;
        if (editId && a._id === editId) return false; // Ignora o próprio agendamento em edição
        const servicoAgendado = servicos.find(s => s._id === a.serviceId);
        const { horas: agH, minutos: agM } = parseTempoAproximado(servicoAgendado?.tempoAproximado || "1:00");
        const duracaoAgMs = (agH * 60 + agM) * 60 * 1000;
        const inicioExistente = new Date(a.dataAgendamento);
        const fimExistente = new Date(inicioExistente.getTime() + duracaoAgMs);
        return (inicioNovo >= inicioExistente && inicioNovo < fimExistente);
      });
      if (conflitos.length > 0 || existeFimMaior) {
        setConflictError("Já existe agendamento para essa manicure nesse horário!");
        setLoading(false);
        return;
      }
      const payload = { ...form, dataAgendamento: data, tempoAproximado: servicoSelecionado.tempoAproximado };
      let response;
      if (editId) {
        response = await apiFetch(`api/users/atualizarAgendamentos/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await apiFetch("api/users/criarAgendamentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      if (!response.ok) throw new Error(editId ? "Erro ao atualizar agendamento" : "Erro ao adicionar agendamento");
      setForm({ dataAgendamento: getLocalDateString(), tempoAproximado: "", clientId: "", manicureId: "", serviceId: "" });
      setClientOption(null);
      setSelectedHour("");
      setSelectedMinute("");
      setEditId(null);
      fetchAll();
    } catch (err) {
      setError(editId ? "Erro ao atualizar agendamento" : "Erro ao adicionar agendamento");
    } finally {
      setLoading(false);
    }
  };

  // Função utilitária para buscar status do agendamento (caso não exista no model, ajuste para incluir status)
  function getStatusAgendamento(ag: Agendamento) {
    // Se o model já tem status, use: return ag.status;
    // Caso não tenha, adapte conforme sua lógica de negócio
    return (ag as any).status || '';
  }

  // Mapas para converter id -> nome e valor
  const userMap = Object.fromEntries(users.map(u => [u._id, u.name]));
  const manicureList = users.filter(u => u.role === "manicure" || u.role === "admin");
  const clientList = users.filter(u => u.role === "client");
  const manicureMap = Object.fromEntries(manicureList.map(m => [m._id, m.name]));
  const servicoMap = Object.fromEntries(servicos.map(s => [s._id, s.name]));
  const servicoValorMap = Object.fromEntries(servicos.map(s => [s._id, s.preco]));

  // Filtro dos agendamentos
  let agendamentosFiltrados = agendamentos;
  if (selectedManicure) {
    agendamentosFiltrados = agendamentosFiltrados.filter(a => a.manicureId === selectedManicure);
  }
  if (selectedDate) {
    agendamentosFiltrados = agendamentosFiltrados.filter(a => {
      const data = new Date(a.dataAgendamento).toISOString().slice(0, 10);
      return data === selectedDate;
    });
  }

  // Filtro de clientes para busca
  const clientesFiltrados = users.filter(u => u.name.toLowerCase().includes(clientSearch.toLowerCase()));

  // Agrupar agendamentos filtrados por data (corrigindo exibição)
  const agendamentosPorData: { [data: string]: Agendamento[] } = {};
  agendamentosFiltrados.forEach(a => {
    // Verifica se a data é válida antes de processar
    const dateObj = new Date(a.dataAgendamento);
    let data: string;
    
    if (isNaN(dateObj.getTime()) || !a.dataAgendamento || a.dataAgendamento === 'Invalid Date') {
      // Se a data é inválida, pula este agendamento (não exibe)
      return;
    } else {
      // Exibe a data local corretamente
      data = dateObj.toLocaleDateString('pt-BR');
    }
    
    if (!agendamentosPorData[data]) agendamentosPorData[data] = [];
    agendamentosPorData[data].push(a);
  });

  // Filtro de clientes para busca (para react-select)
  const clientOptions = clientList.map(u => ({ value: u._id, label: u.name }));

  function handleDeleteClick(a: Agendamento) {
    if (getStatusAgendamento(a) === 'concluido' || getStatusAgendamento(a) === 'realizado') {
      alert('Não é permitido deletar agendamentos já realizados.');
      return;
    }
    setAgendamentoParaDeletar(a._id);
    setShowConfirm(true);
  }

  // Função auxiliar para obter texto descritivo da data
  const getDateLabel = (dateStr: string) => {
    const today = getLocalDateString();
    const yesterday = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })();
    const tomorrow = (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })();
    
    if (dateStr === today) return '📅 Hoje';
    if (dateStr === yesterday) return '📅 Ontem';  
    if (dateStr === tomorrow) return '📅 Amanhã';
    return '📅 Data Personalizada';
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
              <p className="text-xs sm:text-sm text-gray-400 font-medium">Agenda de Atendimentos</p>
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
            📅 Agenda de Atendimentos
          </h1>
          <p className="text-center text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base">
            Gerencie todos os agendamentos do salão de forma completa e organizada
          </p>
          {/* Filtros da agenda */}
          <div className="bg-gradient-to-br from-[#111]/80 to-[#222]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden mb-8">
            {/* Decoração interna */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-500/10 rounded-full translate-y-8 -translate-x-8"></div>
            
            <div className="relative z-10 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50"></div>
                  <h2 className="text-blue-400 font-bold text-2xl">🔍 Filtros da Agenda</h2>
                </div>
                <div className="text-sm text-gray-300 bg-white/10 px-3 py-1 rounded-full">
                  📅 Hoje ({new Date().toLocaleDateString('pt-BR')})
                </div>
              </div>
              
              {/* Botões rápidos de data */}
              <div className="flex flex-wrap gap-3 mb-6">
                <button
                  className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                    selectedDate === (() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 1);
                      const year = d.getFullYear();
                      const month = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      return `${year}-${month}-${day}`;
                    })()
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg' 
                      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                  }`}
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 1);
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    setSelectedDate(`${year}-${month}-${day}`);
                  }}
                >
                  ← Ontem
                </button>
                <button
                  className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                    selectedDate === getLocalDateString()
                      ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg shadow-emerald-500/30' 
                      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                  }`}
                  onClick={() => setSelectedDate(getLocalDateString())}
                >
                  📅 Hoje
                </button>
                <button
                  className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                    selectedDate === (() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      const year = d.getFullYear();
                      const month = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      return `${year}-${month}-${day}`;
                    })()
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                  }`}
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 1);
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    setSelectedDate(`${year}-${month}-${day}`);
                  }}
                >
                  Amanhã →
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-blue-300 font-semibold mb-2 flex items-center gap-2">
                    💅 Manicure
                  </label>
                  <select
                    className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:border-blue-500 focus:outline-none transition-all"
                    value={selectedManicure}
                    onChange={e => setSelectedManicure(e.target.value)}
                  >
                    <option value="" className="bg-gray-800 text-white">
                      Todas as Manicures
                    </option>
                    {manicureList.map(m => (
                      <option 
                        key={m._id} 
                        value={m._id}
                        className="bg-gray-800 text-white"
                      >
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-blue-300 font-semibold mb-2 flex items-center gap-2">
                    📅 Data Específica
                  </label>
                  <input
                    type="date"
                    className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:border-blue-500 focus:outline-none transition-all"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    className="w-full px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                    onClick={() => { 
                      setSelectedManicure(""); 
                      setSelectedDate(getLocalDateString());
                    }}
                  >
                    🔄 Resetar
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Resumo estatístico */}
          {Object.keys(agendamentosPorData).length > 0 && (
            <div className="bg-gradient-to-br from-emerald-500/20 to-blue-500/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-500/30 relative overflow-hidden mb-8">
              {/* Decoração interna */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-400/10 rounded-full -translate-y-8 translate-x-8"></div>
              <div className="absolute bottom-0 left-0 w-12 h-12 bg-blue-400/10 rounded-full translate-y-6 -translate-x-6"></div>
              
              <div className="relative z-10 p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                    <h3 className="text-emerald-400 font-bold text-2xl">📊 Resumo dos Agendamentos</h3>
                  </div>
                  <div className="text-sm text-gray-300 bg-white/10 px-3 py-1 rounded-full">
                    {selectedDate ? getDateLabel(selectedDate) : '📅 Todos os Períodos'} • {selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Todas as Datas'}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl p-6 text-center border border-blue-500/30">
                    <div className="text-3xl font-bold text-blue-300 mb-2">
                      {agendamentosFiltrados.length}
                    </div>
                    <div className="text-blue-200 font-medium">Total de Agendamentos</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-2xl p-6 text-center border border-emerald-500/30">
                    <div className="text-3xl font-bold text-emerald-300 mb-2">
                      {Object.keys(agendamentosPorData).length}
                    </div>
                    <div className="text-emerald-200 font-medium">Dias com Atendimento</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 text-center border border-purple-500/30">
                    <div className="text-3xl font-bold text-purple-300 mb-2">
                      R$ {agendamentosFiltrados.reduce((total, a) => total + (servicoValorMap[a.serviceId] || 0), 0).toFixed(2)}
                    </div>
                    <div className="text-purple-200 font-medium">Valor Total</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-2xl p-6 text-center border border-amber-500/30">
                    <div className="text-3xl font-bold text-amber-300 mb-2">
                      {new Set(agendamentosFiltrados.map(a => a.manicureId)).size}
                    </div>
                    <div className="text-amber-200 font-medium">Manicures Ativas</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Vista em formato de agenda */}
          <div className="w-full">
            {Object.keys(agendamentosPorData).length === 0 && (
              <div className="bg-gradient-to-br from-[#111]/80 to-[#222]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden p-12 text-center mb-8">
                {/* Decoração interna */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gray-500/10 rounded-full -translate-y-10 translate-x-10"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-gray-400/10 rounded-full translate-y-8 -translate-x-8"></div>
                
                <div className="relative z-10">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gray-500/20 rounded-full flex items-center justify-center">
                    <span className="text-6xl">📅</span>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">
                    {selectedDate === getLocalDateString() 
                      ? 'Nenhum agendamento para hoje' 
                      : 'Nenhum agendamento encontrado'
                    }
                  </h3>
                  <p className="text-gray-400 text-lg mb-6">
                    {selectedDate === getLocalDateString() 
                      ? 'Não há atendimentos agendados para hoje.' 
                      : `Não há atendimentos para ${selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'os filtros selecionados'}.`
                    }
                  </p>
                  {selectedDate === getLocalDateString() && (
                    <div className="flex justify-center gap-4">
                      <button
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + 1);
                          const year = d.getFullYear();
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const day = String(d.getDate()).padStart(2, '0');
                          setSelectedDate(`${year}-${month}-${day}`);
                        }}
                      >
                        Ver amanhã →
                      </button>
                      <button
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                        onClick={() => setSelectedDate("")}
                      >
                        Ver todos os dias
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {Object.entries(agendamentosPorData).map(([data, ags]) => (
              <div key={data} className="mb-8">
                {/* Cabeçalho da data */}
                <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-t-3xl p-6 shadow-2xl">
                  <h3 className="text-2xl font-bold text-white flex items-center justify-between">
                    <span className="flex items-center gap-3">
                      📅 {data}
                      <span className="text-sm bg-white/20 px-3 py-1 rounded-full font-semibold">
                        {ags.length} agendamento{ags.length !== 1 ? 's' : ''}
                      </span>
                    </span>
                  </h3>
                </div>
                
                {/* Cards dos agendamentos */}
                <div className="bg-gradient-to-br from-[#111]/80 to-[#222]/80 backdrop-blur-xl rounded-b-3xl border border-white/10 p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ags
                      .sort((a, b) => new Date(a.dataAgendamento).getTime() - new Date(b.dataAgendamento).getTime())
                      .map((a) => (
                      <div key={a._id} className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl relative overflow-hidden">
                        {/* Decoração interna */}
                        <div className="absolute top-0 right-0 w-8 h-8 bg-pink-500/10 rounded-full -translate-y-4 translate-x-4"></div>
                        
                        <div className="relative z-10">
                          {/* Horário destacado */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                              🕐 {(() => {
                                const d = new Date(a.dataAgendamento);
                                if (isNaN(d.getTime())) return '--:--';
                                return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
                              })()}
                            </div>
                            <div className="bg-white/20 text-white/90 px-3 py-1 rounded-full text-xs font-semibold">
                              ⏱️ {a.tempoAproximado}
                            </div>
                          </div>
                          
                          {/* Informações principais */}
                          <div className="space-y-3 mb-6">
                            <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-blue-300 text-sm font-semibold">👤 Cliente:</span>
                              </div>
                              <span className="text-white font-medium">{userMap[a.clientId] || 'N/A'}</span>
                            </div>
                            
                            <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/30">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-purple-300 text-sm font-semibold">💅 Manicure:</span>
                              </div>
                              <span className="text-white font-medium">{userMap[a.manicureId] || 'N/A'}</span>
                            </div>
                            
                            <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/30">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-emerald-300 text-sm font-semibold">✨ Serviço:</span>
                              </div>
                              <span className="text-white font-medium">{servicoMap[a.serviceId] || 'N/A'}</span>
                            </div>
                            
                            <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/30">
                              <div className="flex items-center justify-between">
                                <span className="text-amber-300 text-sm font-semibold">💰 Valor:</span>
                                <span className="text-emerald-400 font-bold text-lg">
                                  R$ {servicoValorMap[a.serviceId] ? servicoValorMap[a.serviceId].toFixed(2) : '0,00'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Botões de ação */}
                          <div className="flex gap-3">
                            <button
                              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                              onClick={() => handleEdit(a)}
                              disabled={loading}
                            >
                              ✏️ Editar
                            </button>
                            <button
                              className={`flex-1 font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 ${
                                getStatusAgendamento(a) === 'concluido' || getStatusAgendamento(a) === 'realizado' 
                                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50' 
                                  : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white'
                              }`}
                              onClick={() => handleDeleteClick(a)}
                              disabled={loading || getStatusAgendamento(a) === 'concluido' || getStatusAgendamento(a) === 'realizado'}
                              title={getStatusAgendamento(a) === 'concluido' || getStatusAgendamento(a) === 'realizado' ? 'Não é permitido deletar agendamentos já realizados.' : 'Deletar'}
                            >
                              🗑️ Deletar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
          {/* Formulário de agendamento */}
          <div className="bg-gradient-to-br from-[#111]/80 to-[#222]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden">
            {/* Decoração interna */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-pink-500/10 rounded-full translate-y-8 -translate-x-8"></div>
            
            <div className="relative z-10 p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                <h2 className="text-emerald-400 font-bold text-2xl">
                  {editId ? "✏️ Editar Agendamento" : "➕ Novo Agendamento"}
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-emerald-400/50 to-transparent"></div>
              </div>
              
              <form className="space-y-8" onSubmit={salvarAgendamento}>
                {/* Seção Data e Horário */}
                <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-6 rounded-2xl border border-blue-500/30">
                  <h3 className="text-blue-400 font-bold text-lg mb-4 flex items-center gap-2">
                    📅 Data e Horário
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <label className="block text-blue-300 font-semibold mb-2">Data</label>
                      <input
                        type="date"
                        className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:border-blue-500 focus:outline-none transition-all"
                        value={form.dataAgendamento}
                        onChange={e => setForm({ ...form, dataAgendamento: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-blue-300 font-semibold mb-2">Hora</label>
                      <select
                        className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:border-blue-500 focus:outline-none transition-all"
                        value={selectedHour}
                        onChange={e => setSelectedHour(e.target.value)}
                        required
                      >
                        <option value="" className="bg-gray-800 text-gray-400">
                          Selecione a hora
                        </option>
                        {hourOptions.map(h => (
                          <option 
                            key={h.value} 
                            value={h.value}
                            className="bg-gray-800 text-white"
                          >
                            {h.label}h
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-blue-300 font-semibold mb-2">Minutos</label>
                      <select
                        className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:border-blue-500 focus:outline-none transition-all"
                        value={selectedMinute}
                        onChange={e => setSelectedMinute(e.target.value)}
                        required
                      >
                        <option value="" className="bg-gray-800 text-gray-400">
                          Minutos
                        </option>
                        {minuteOptions.map(m => (
                          <option 
                            key={m.value} 
                            value={m.value}
                            className="bg-gray-800 text-white"
                          >
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Seção Cliente */}
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 rounded-2xl border border-purple-500/30">
                  <h3 className="text-purple-400 font-bold text-lg mb-4 flex items-center gap-2">
                    👤 Cliente
                  </h3>
                  <Select
                    className="text-black"
                    options={clientOptions}
                    value={clientOption}
                    onChange={(opt: any) => {
                      setClientOption(opt);
                      setForm({ ...form, clientId: opt?.value || "" });
                    }}
                    placeholder="Buscar e selecionar cliente..."
                    isClearable
                    isSearchable
                    styles={{
                      control: (base: any) => ({ 
                        ...base, 
                        backgroundColor: "rgba(255,255,255,0.1)", 
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "8px",
                        padding: "4px"
                      }),
                      menu: (base: any) => ({ ...base, backgroundColor: "#1f2937", color: "#fff", borderRadius: "8px" }),
                      option: (base: any, state: any) => ({ 
                        ...base, 
                        backgroundColor: state.isFocused ? "#374151" : "#1f2937", 
                        color: "#fff" 
                      }),
                      singleValue: (base: any) => ({ ...base, color: "#fff" }),
                      input: (base: any) => ({ ...base, color: "#fff" }),
                      placeholder: (base: any) => ({ ...base, color: "#9ca3af" })
                    }}
                  />
                </div>
                
                {/* Seção Manicure e Serviço */}
                <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 p-6 rounded-2xl border border-emerald-500/30">
                  <h3 className="text-emerald-400 font-bold text-lg mb-4 flex items-center gap-2">
                    💅 Manicure e Serviço
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-emerald-300 font-semibold mb-2">Manicure</label>
                      <select
                        className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:border-emerald-500 focus:outline-none transition-all"
                        value={form.manicureId}
                        onChange={e => setForm({ ...form, manicureId: e.target.value })}
                        required
                      >
                        <option value="" className="bg-gray-800 text-gray-400">
                          Selecione a manicure
                        </option>
                        {manicureList.map((m: User) => (
                          <option 
                            key={m._id} 
                            value={m._id}
                            className="bg-gray-800 text-white"
                          >
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-emerald-300 font-semibold mb-2">Serviço</label>
                      <select
                        className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:border-emerald-500 focus:outline-none transition-all"
                        value={form.serviceId}
                        onChange={e => { handleServiceChange(e.target.value); }}
                        required
                      >
                        <option value="" className="bg-gray-800 text-gray-400">
                          Selecione o serviço
                        </option>
                        {servicos.map(s => (
                          <option 
                            key={s._id} 
                            value={s._id}
                            className="bg-gray-800 text-white"
                          >
                            {s.name} - R$ {s.preco?.toFixed(2) ?? '-'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Botões de Ação */}
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6 rounded-2xl border border-amber-500/30">
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                        loading 
                          ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white shadow-lg hover:shadow-emerald-500/30'
                      }`}
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                          {editId ? "Atualizando..." : "Criando..."}
                        </span>
                      ) : (
                        editId ? "💾 Atualizar Agendamento" : "➕ Criar Agendamento"
                      )}
                    </button>
                    
                    {editId && (
                      <button
                        type="button"
                        className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                        onClick={() => { 
                          setEditId(null); 
                          setForm({ dataAgendamento: getLocalDateString(), tempoAproximado: "", clientId: "", manicureId: "", serviceId: "" }); 
                          setClientOption(null); 
                          setSelectedHour(""); 
                          setSelectedMinute(""); 
                        }}
                      >
                        ❌ Cancelar Edição
                      </button>
                    )}
                  </div>
                </div>
              </form>
              
              {/* Mensagens de erro */}
              {conflictError && (
                <div className="mt-6 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 p-4 rounded-xl">
                  <p className="text-amber-300 flex items-center gap-2">
                    ⚠️ {conflictError}
                  </p>
                </div>
              )}
              {error && (
                <div className="mt-6 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/50 p-4 rounded-xl">
                  <p className="text-red-300 flex items-center gap-2">
                    ❌ {error}
                  </p>
                </div>
              )}
            </div>
          </div>
          {/* Modal de confirmação de exclusão */}
          {showConfirm && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
              <div className="bg-gradient-to-br from-[#111] to-[#222] rounded-2xl p-8 shadow-2xl border border-white/20 flex flex-col items-center max-w-md mx-4">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">⚠️</span>
                </div>
                <p className="text-xl font-bold mb-6 text-white text-center">
                  Tem certeza que deseja deletar esse agendamento?
                </p>
                <p className="text-gray-400 text-center mb-6">
                  Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-4 w-full">
                  <button
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300"
                    onClick={async () => {
                      if (agendamentoParaDeletar) await deletarAgendamento(agendamentoParaDeletar);
                      setShowConfirm(false);
                      setAgendamentoParaDeletar(null);
                    }}
                  >
                    Sim, deletar
                  </button>
                  <button
                    className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300"
                    onClick={() => { setShowConfirm(false); setAgendamentoParaDeletar(null); }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}


