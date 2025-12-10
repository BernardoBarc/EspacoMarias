"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from '../../lib/api';
import PublicHeader from '../../components/PublicHeader';
import PublicFooter from '../../components/PublicFooter';

interface DadosSalao {
  telefone?: string;
  endereco?: string;
  email?: string;
  instagram?: string;
}

export default function Contato() {
  const [dadosSalao, setDadosSalao] = useState<DadosSalao | null>(null);
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    assunto: '',
    mensagem: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const fetchDados = async () => {
    try {
      const res = await apiFetch("api/users/dados-salao");
      const data = await res.json();
      setDadosSalao(data);
    } catch (err) {
      console.error('Erro ao buscar dados do salão em contato:', err);
    }
  };

  // Funções do formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpar mensagem quando usuário começar a digitar
    if (message) {
      setMessage('');
      setMessageType('');
    }
  };

  const validateForm = () => {
    if (!formData.nome.trim()) {
      setMessage('Nome é obrigatório');
      setMessageType('error');
      return false;
    }
    if (!formData.email.trim()) {
      setMessage('Email é obrigatório');
      setMessageType('error');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setMessage('Email inválido');
      setMessageType('error');
      return false;
    }
    if (!formData.assunto.trim()) {
      setMessage('Assunto é obrigatório');
      setMessageType('error');
      return false;
    }
    if (!formData.mensagem.trim()) {
      setMessage('Mensagem é obrigatória');
      setMessageType('error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await apiFetch('api/users/send-contact-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Mensagem enviada com sucesso!');
        setMessageType('success');
        // Limpar formulário após sucesso
        setFormData({
          nome: '',
          email: '',
          assunto: '',
          mensagem: ''
        });
      } else {
        setMessage(data.error || 'Erro ao enviar mensagem');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      setMessage('Erro de conexão. Tente novamente.');
      setMessageType('error');
    } finally {
      setLoading(false);
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

	return (
		<main className="min-h-screen font-sans flex flex-col items-center justify-between bg-gradient-to-br from-[#222] to-[#111] text-white">
			<PublicHeader currentPage="contato" />

			<section className="w-full max-w-7xl flex flex-col items-center mt-8 sm:mt-12 mb-12 sm:mb-16 px-4 sm:px-6">
				{/* Hero Section */}
				<div className="bg-gradient-to-r from-[#111] to-[#222] rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-10 mb-8 sm:mb-12 w-full relative overflow-hidden border border-[#333]/30">
					{/* Decoração de fundo */}
					<div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-pink-500/20 rounded-full -translate-y-8 translate-x-8"></div>
					<div className="absolute bottom-0 left-0 w-16 sm:w-24 h-16 sm:h-24 bg-purple-500/20 rounded-full translate-y-6 -translate-x-6"></div>
					
					<div className="relative z-10 text-center mb-6 sm:mb-8">
						<h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
							✨ Entre em <span className="text-pink-400">Contato</span> ✨
						</h1>
						<p className="text-base sm:text-lg md:text-xl text-gray-200 leading-relaxed px-2 sm:px-4 max-w-3xl mx-auto">
							Tem alguma dúvida ou quer agendar um serviço? Entre em contato conosco! 
							Estamos sempre prontas para cuidar de você com carinho e profissionalismo.
						</p>
					</div>
				</div>

				{/* Formulário de Contato */}
				<div className="bg-gradient-to-br from-[#111] to-[#222] rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-8 md:p-10 w-full max-w-4xl border border-pink-500/20">
					{/* Mensagem de feedback */}
					{message && (
						<div className={`mb-6 sm:mb-8 p-3 sm:p-4 rounded-xl text-center font-medium border-2 text-sm sm:text-base ${
							messageType === 'success' 
								? 'bg-green-500/20 text-green-300 border-green-500/40 backdrop-blur-sm' 
								: 'bg-red-500/20 text-red-300 border-red-500/40 backdrop-blur-sm'
						}`}>
							{message}
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
							<div className="space-y-1.5 sm:space-y-2">
								<label className="block text-xs sm:text-sm font-semibold text-pink-400">Nome *</label>
								<input 
									type="text" 
									name="nome"
									placeholder="Seu nome completo" 
									value={formData.nome}
									onChange={handleInputChange}
									disabled={loading}
									className="w-full p-3 sm:p-4 bg-[#222] border-2 border-pink-500/30 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-pink-500/60 focus:ring-2 focus:ring-pink-500/20 transition-all disabled:bg-gray-800 disabled:opacity-60 text-sm sm:text-base"
									required
								/>
							</div>
							<div className="space-y-1.5 sm:space-y-2">
								<label className="block text-xs sm:text-sm font-semibold text-pink-400">Email *</label>
								<input 
									type="email" 
									name="email"
									placeholder="seu@email.com" 
									value={formData.email}
									onChange={handleInputChange}
									disabled={loading}
									className="w-full p-3 sm:p-4 bg-[#222] border-2 border-pink-500/30 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-pink-500/60 focus:ring-2 focus:ring-pink-500/20 transition-all disabled:bg-gray-800 disabled:opacity-60 text-sm sm:text-base"
									required
								/>
							</div>
						</div>
						
						<div className="space-y-1.5 sm:space-y-2">
							<label className="block text-xs sm:text-sm font-semibold text-pink-400">Assunto *</label>
							<input
								type="text"
								name="assunto"
								placeholder="Qual o assunto da sua mensagem?"
								value={formData.assunto}
								onChange={handleInputChange}
								disabled={loading}
								className="w-full p-3 sm:p-4 bg-[#222] border-2 border-pink-500/30 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-pink-500/60 focus:ring-2 focus:ring-pink-500/20 transition-all disabled:bg-gray-800 disabled:opacity-60 text-sm sm:text-base"
								required
							/>
						</div>
						
						<div className="space-y-1.5 sm:space-y-2">
							<label className="block text-xs sm:text-sm font-semibold text-pink-400">Mensagem *</label>
							<textarea
								name="mensagem"
								placeholder="Conte-nos como podemos ajudar você..."
								rows={5}
								value={formData.mensagem}
								onChange={handleInputChange}
								disabled={loading}
								className="w-full p-3 sm:p-4 bg-[#222] border-2 border-pink-500/30 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-pink-500/60 focus:ring-2 focus:ring-pink-500/20 transition-all disabled:bg-gray-800 disabled:opacity-60 resize-none text-sm sm:text-base"
								required
							/>
						</div>
						
						<div className="flex flex-col items-center space-y-3 sm:space-y-4 pt-4 sm:pt-6">
							<button
								type="submit" 
								disabled={loading}
								className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg sm:rounded-xl shadow-lg transition-all transform hover:scale-105 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none min-w-[180px] sm:min-w-[200px] text-sm sm:text-base"
							>
								{loading ? (
									<div className="flex items-center justify-center space-x-2">
										<div className="w-4 sm:w-5 h-4 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
										<span>Enviando...</span>
									</div>
								) : (
									<span className="flex items-center justify-center space-x-2">
										<span>Enviar Mensagem</span>
										<span>🌟</span>
									</span>
								)}
							</button>
							
							<p className="text-xs sm:text-sm text-gray-400 text-center px-2">
								* Campos obrigatórios • Responderemos o mais breve possível
							</p>
						</div>
					</form>
				</div>
			</section>
			
			<PublicFooter dadosSalao={dadosSalao} />
		</main>
	);
}

