"use client";

import { useEffect, useState } from "react";
import { apiFetch } from '../../lib/api';
import PublicHeader from '../../components/PublicHeader';
import PublicFooter from '../../components/PublicFooter';

interface DadosSalao {
  telefone: string;
  endereco: string;
  email: string;
  instagram?: string;
  fotosServicos?: string[];
}

export default function Home() {
  const [dadosSalao, setDadosSalao] = useState<DadosSalao | null>(null);

  const fetchDados = async () => {
    try {
      const res = await apiFetch("api/users/dados-salao");
      const data = await res.json();
      setDadosSalao(data);
    } catch (err) {
      console.error("Erro ao buscar dados do salão:", err);
    }
  };

  useEffect(() => {
    fetchDados();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "dadosSalaoUpdated") fetchDados();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const imagens =
    dadosSalao && dadosSalao.fotosServicos ? dadosSalao.fotosServicos : [];

  // Mostrar somente imagens enviadas via admin (data URLs), ignorar paths estáticos da IDE
  const imagensAdmin = imagens.filter((item: any) => {
    const url = typeof item === "string" ? item : item && item.url;
    return typeof url === "string" && url.startsWith("data:");
  });

  return (
    <main className="min-h-screen font-sans flex flex-col items-center justify-between bg-gradient-to-br from-[#222] to-[#111] text-white">
      <PublicHeader currentPage="servicos" />

      <section className="w-full max-w-7xl flex flex-col items-center mt-6 sm:mt-12 mb-8 sm:mb-16 px-4 sm:px-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-[#111] to-[#222] rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-10 mb-8 sm:mb-12 w-full relative overflow-hidden border border-[#333]/30">
          {/* Decoração de fundo */}
          <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 bg-pink-500/20 rounded-full -translate-y-8 translate-x-8"></div>
          <div className="absolute bottom-0 left-0 w-16 sm:w-24 h-16 sm:h-24 bg-purple-500/20 rounded-full translate-y-6 -translate-x-6"></div>
          
          <div className="relative z-10 text-center">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              ✨ Nossos <span className="text-pink-400">Serviços</span> ✨
            </h1>
            
            <div className="max-w-3xl mx-auto">
              <p className="text-base sm:text-lg md:text-xl text-gray-200 leading-relaxed mb-6 sm:mb-8 px-2 sm:px-4">
                Descubra uma variedade completa de serviços para cuidar das suas unhas com carinho e profissionalismo. 
                Cada serviço é realizado com produtos de qualidade e técnicas modernas.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
                <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl p-4 sm:p-6 backdrop-blur-sm border border-pink-400/30 hover:border-pink-400/50 transition-all">
                  <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">💅</div>
                  <h3 className="text-white font-bold mb-1 sm:mb-2 text-sm sm:text-base">Manicure Completa</h3>
                  <p className="text-gray-300 text-xs sm:text-sm">Cuidado completo das unhas das mãos com esmaltação</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl p-4 sm:p-6 backdrop-blur-sm border border-purple-400/30 hover:border-purple-400/50 transition-all">
                  <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">🦶</div>
                  <h3 className="text-white font-bold mb-2">Pedicure Premium</h3>
                  <p className="text-gray-300 text-sm">Tratamento especializado para os pés com hidratação</p>
                </div>
                
                <div className="bg-gradient-to-br from-blue-500/20 to-teal-500/20 rounded-xl p-6 backdrop-blur-sm border border-blue-400/30 hover:border-blue-400/50 transition-all">
                  <div className="text-3xl mb-3">✨</div>
                  <h3 className="text-white font-bold mb-2">Designs Especiais</h3>
                  <p className="text-gray-300 text-sm">Arte nas unhas e decorações personalizadas</p>
                </div>
              </div>
              
              <div className="mt-8">
                <a 
                  href="/login" 
                  className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all transform hover:scale-105 hover:shadow-xl"
                >
                  Agendar Agora 🌟
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Galeria de Serviços */}
        <div className="w-full">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            ✨ Galeria dos Nossos Serviços ✨
          </h2>
          
          {imagensAdmin.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gradient-to-br from-[#111] to-[#222] rounded-2xl p-8 max-w-md mx-auto border border-pink-500/30">
                <div className="text-6xl mb-4">💅</div>
                <h3 className="text-xl font-bold text-white mb-2">Galeria em Breve</h3>
                <p className="text-gray-300">Estamos preparando lindas fotos dos nossos serviços para você!</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
              {imagensAdmin.map((item: any, idx: number) => {
                const src = typeof item === "string" ? item : item.url;
                const title = typeof item === "string" ? "" : item.title || "";
                const desc = typeof item === "string" ? "" : item.description || "";
                return (
                  <article
                    key={idx}
                    className="group relative overflow-hidden rounded-2xl shadow-2xl bg-gradient-to-b from-[#111] to-[#222] border border-pink-500/20 hover:border-pink-500/50 transition-all duration-500"
                  >
                    <div className="aspect-square overflow-hidden relative">
                      <img
                        src={src}
                        alt={`serviço ${idx + 1}`}
                        className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
                      />
                      
                      {/* Overlay com gradiente */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Conteúdo sobreposto */}
                      <div className="absolute inset-0 p-4 flex flex-col justify-end transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <div className="text-white">
                          <h3 className="text-lg font-bold mb-2">
                            {title || `Serviço ${idx + 1}`}
                          </h3>
                          {desc && (
                            <p className="text-sm opacity-90 mb-4 line-clamp-3">
                              {desc}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Informações visíveis */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-white truncate group-hover:text-pink-300 transition-colors">
                        {title || `Serviço ${idx + 1}`}
                      </h3>
                      {desc && (
                        <p className="mt-2 text-sm text-gray-300 leading-relaxed line-clamp-2">
                          {desc}
                        </p>
                      )}
                    </div>
                    
                    {/* Borda decorativa */}
                    <div className="absolute inset-0 border-2 border-pink-500/0 group-hover:border-pink-500/40 rounded-2xl transition-colors duration-300"></div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
      
      <footer className="w-full bg-gradient-to-r from-[#111] to-[#222] text-white border-t border-[#333] py-12 shadow-2xl rounded-t-3xl relative overflow-hidden">
        {/* Decoração de fundo */}
        <div className="absolute top-0 left-1/4 w-20 h-20 bg-pink-500/20 rounded-full -translate-y-10"></div>
        <div className="absolute bottom-0 right-1/3 w-16 h-16 bg-purple-500/20 rounded-full translate-y-8"></div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-4">📍 Venha nos Visitar!</h3>
            {dadosSalao ? (
              <div className="space-y-3">
                <div className="flex flex-wrap justify-center gap-6 text-lg">
                  <span className="flex items-center gap-2">
                    <span className="text-pink-400">📍</span> {dadosSalao.endereco}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-pink-400">📞</span> {dadosSalao.telefone}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-pink-400">✉️</span> {dadosSalao.email}
                  </span>
                </div>
                
                {dadosSalao.instagram && (
                  <div className="mt-4">
                    <a 
                      href={dadosSalao.instagram.startsWith('http') ? dadosSalao.instagram : `https://instagram.com/${(dadosSalao.instagram || '').replace(/^@/, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all transform hover:scale-105"
                    >
                      <span className="text-xl">📷</span>
                      Siga no Instagram
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="animate-pulse">
                <div className="bg-white/20 rounded-lg h-6 w-64 mx-auto mb-2"></div>
                <div className="bg-white/20 rounded-lg h-4 w-48 mx-auto"></div>
              </div>
            )}
          </div>
          
          <div className="border-t border-white/20 pt-6 text-center">
            <p className="text-gray-300">© 2025 Espaço Marias. Todos os direitos reservados.</p>
            <p className="text-sm text-gray-400 mt-2">Feito com ❤️ para cuidar da sua beleza</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

