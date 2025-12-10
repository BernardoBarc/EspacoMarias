"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from '../../lib/api';
import PublicHeader from '../../components/PublicHeader';
import PublicFooter from '../../components/PublicFooter';

interface Manicure {
	_id: string;
	name: string;
	photo?: string;
	especialidade?: string;
	phone?: string;
	instagram?: string;
}

interface DadosSalao {
	telefone: string;
	endereco: string;
	email: string;
	instagram?: string;
}

export default function Manicures() {
	const [manicures, setManicures] = useState<Manicure[]>([]);
	const [dadosSalao, setDadosSalao] = useState<DadosSalao | null>(null);

	useEffect(() => {
		apiFetch("api/users/users")
			.then((res) => res.json())
			.then((data) => {
				const manicuresAndAdmins = data.filter(
					(u: any) => u.role === "manicure" || u.role === "admin"
				);
				console.log('manicures fetched:', manicuresAndAdmins);
				setManicures(manicuresAndAdmins);
			});
		apiFetch("api/users/dados-salao")
			.then((res) => res.json())
			.then((data) => setDadosSalao(data));
	}, []);

	return (
		<main className="min-h-screen font-sans flex flex-col items-center justify-between bg-gradient-to-br from-[#222] to-[#111] text-white">
			<PublicHeader currentPage="manicures" />
			
			<section className="w-full max-w-7xl flex flex-col items-center mt-12 mb-16 px-4 sm:px-6">
				{/* Hero Section */}
				<div className="bg-gradient-to-r from-[#111] to-[#222] rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-10 mb-8 sm:mb-12 w-full relative overflow-hidden border border-[#333]/30">
					{/* Decoração de fundo */}
					<div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-pink-500/20 rounded-full -translate-y-8 translate-x-8"></div>
					<div className="absolute bottom-0 left-0 w-16 sm:w-24 h-16 sm:h-24 bg-purple-500/20 rounded-full translate-y-6 -translate-x-6"></div>
					
					<div className="relative z-10 text-center">
						<h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
							✨ Nossas <span className="text-pink-400">Manicures</span> ✨
						</h1>
						
						<div className="max-w-3xl mx-auto">
							<p className="text-base sm:text-lg md:text-xl text-gray-200 leading-relaxed mb-6 sm:mb-8 px-2 sm:px-4">
								Conheça as talentosas profissionais que fazem do <span className="text-pink-400 font-semibold">Espaço Marias</span> o lugar perfeito 
								para cuidar das suas unhas. Nossa equipe é dedicada ao atendimento personalizado e à excelência nos detalhes.
							</p>
							
							<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
								<div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl p-4 sm:p-6 backdrop-blur-sm border border-pink-400/30 hover:border-pink-400/50 transition-all">
									<div className="text-2xl sm:text-3xl mb-2 sm:mb-3">💅</div>
									<h3 className="text-white font-bold mb-1 sm:mb-2 text-sm sm:text-base">Especialistas em Unhas</h3>
									<p className="text-gray-300 text-xs sm:text-sm">Profissionais capacitadas com anos de experiência</p>
								</div>
								
								<div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl p-4 sm:p-6 backdrop-blur-sm border border-purple-400/30 hover:border-purple-400/50 transition-all">
									<div className="text-2xl sm:text-3xl mb-2 sm:mb-3">⭐</div>
									<h3 className="text-white font-bold mb-1 sm:mb-2 text-sm sm:text-base">Atendimento Personalizado</h3>
									<p className="text-gray-300 text-xs sm:text-sm">Cada cliente recebe cuidado único e especial</p>
								</div>
								
								<div className="bg-gradient-to-br from-blue-500/20 to-teal-500/20 rounded-xl p-4 sm:p-6 backdrop-blur-sm border border-blue-400/30 hover:border-blue-400/50 transition-all sm:col-span-2 md:col-span-1">
									<div className="text-2xl sm:text-3xl mb-2 sm:mb-3">💎</div>
									<h3 className="text-white font-bold mb-1 sm:mb-2 text-sm sm:text-base">Produtos Premium</h3>
									<p className="text-gray-300 text-xs sm:text-sm">Sempre os melhores materiais e esmaltes</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Grid das Manicures */}
				<div className="w-full">
					<h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-6 sm:mb-8">
						✨ Conheça Nossa Equipe ✨
					</h2>
					
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 w-full">
						{manicures.map((m) => (
							<div
								key={m._id}
								className="group relative overflow-hidden bg-gradient-to-br from-[#111] to-[#222] rounded-2xl sm:rounded-3xl shadow-2xl border border-pink-500/30 hover:border-pink-500/50 transition-all duration-500 hover:scale-[1.02]"
							>
								{/* Decoração de fundo */}
								<div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/10 rounded-full -translate-y-10 translate-x-10"></div>
								<div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-500/10 rounded-full translate-y-8 -translate-x-8"></div>
								
								<div className="relative z-10 flex flex-col items-center p-6 sm:p-8 gap-4 sm:gap-6">
									{/* Foto da manicure */}
									<div className="flex-shrink-0 relative">
										<div className="absolute -inset-2 bg-gradient-to-r from-pink-500/40 to-purple-500/40 rounded-full blur-lg group-hover:blur-xl transition-all duration-500"></div>
										<div className="relative">
											<img
												src={m.photo || "/user-default.png"}
												alt={m.name}
												className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-full object-cover border-4 border-pink-400/50 group-hover:border-pink-400/80 shadow-2xl group-hover:scale-105 transition-all duration-500"
											/>
											<div className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
										</div>
									</div>
									
									{/* Informações da manicure */}
									<div className="flex-1 flex flex-col items-center text-center">
										<h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 sm:mb-3 group-hover:text-pink-300 transition-colors duration-300">
											{m.name}
										</h2>
										<p className="text-gray-300 text-sm sm:text-base lg:text-lg font-medium leading-relaxed mb-4 sm:mb-6 px-2">
											{m.especialidade || "Manicure profissional especializada em cuidados completos"}
										</p>
										
										{/* Botões de contato */}
										<div className="flex flex-wrap justify-center gap-2 sm:gap-3">
											{m.phone && (
												<a
													href={`https://wa.me/55${m.phone.replace(/\D/g, "")}`}
													target="_blank"
													rel="noopener noreferrer"
													className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl shadow-lg transition-all transform hover:scale-105 hover:shadow-xl text-sm sm:text-base"
												>
													<span className="text-base sm:text-lg">📱</span>
													WhatsApp
												</a>
											)}
											{m.instagram && (
												<a
													href={
														m.instagram.startsWith("http")
															? m.instagram
															: `https://instagram.com/${m.instagram.replace(/^@/, "")}`
													}
													target="_blank"
													rel="noopener noreferrer"
													className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl shadow-lg transition-all transform hover:scale-105 hover:shadow-xl text-sm sm:text-base"
												>
													<span className="text-base sm:text-lg">📷</span>
													Instagram
												</a>
											)}
										</div>
									</div>
								</div>
								
								{/* Borda decorativa animada */}
								<div className="absolute inset-0 rounded-2xl sm:rounded-3xl border-2 border-pink-500/0 group-hover:border-pink-500/30 transition-colors duration-500"></div>
							</div>
						))}
					</div>
					
					{/* Mensagem quando não há manicures */}
					{manicures.length === 0 && (
						<div className="text-center py-12 sm:py-16">
							<div className="bg-gradient-to-br from-[#111] to-[#222] rounded-2xl p-6 sm:p-8 max-w-md mx-auto border border-pink-500/30">
								<div className="text-5xl sm:text-6xl mb-3 sm:mb-4">💅</div>
								<h3 className="text-lg sm:text-xl font-bold text-white mb-2">Equipe em Formação</h3>
								<p className="text-gray-300 text-sm sm:text-base">Estamos montando nossa equipe de profissionais incríveis!</p>
							</div>
						</div>
					)}
				</div>
			</section>
			
			<PublicFooter dadosSalao={dadosSalao} />
		</main>
	);
}

