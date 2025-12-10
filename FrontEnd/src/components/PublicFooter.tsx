"use client";
import React from "react";

interface DadosSalao {
  telefone?: string;
  endereco?: string;
  email?: string;
  instagram?: string;
}

interface PublicFooterProps {
  dadosSalao: DadosSalao | null;
}

export default function PublicFooter({ dadosSalao }: PublicFooterProps) {
  return (
    <footer className="w-full bg-gradient-to-r from-[#111] to-[#222] text-white border-t border-[#333] py-8 sm:py-12 shadow-2xl rounded-t-2xl sm:rounded-t-3xl relative overflow-hidden">
      {/* Decoração de fundo */}
      <div className="absolute top-0 left-1/4 w-20 h-20 bg-pink-500/20 rounded-full -translate-y-10"></div>
      <div className="absolute bottom-0 right-1/3 w-16 h-16 bg-purple-500/20 rounded-full translate-y-8"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">📍 Venha nos Visitar!</h3>
          {dadosSalao ? (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-6 text-sm sm:text-lg">
                {dadosSalao.endereco && (
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-pink-400">📍</span> 
                    <span className="text-center">{dadosSalao.endereco}</span>
                  </span>
                )}
                {(dadosSalao.telefone || (dadosSalao as any).phone) && (
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-pink-400">📞</span> 
                    {dadosSalao.telefone || (dadosSalao as any).phone}
                  </span>
                )}
                {dadosSalao.email && (
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-pink-400">✉️</span> 
                    <span className="break-all">{dadosSalao.email}</span>
                  </span>
                )}
              </div>
              
              {dadosSalao.instagram && (
                <div className="mt-4">
                  <a 
                    href={dadosSalao.instagram.startsWith('http') ? dadosSalao.instagram : `https://instagram.com/${(dadosSalao.instagram || '').replace(/^@/, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl shadow-lg transition-all transform hover:scale-105 text-sm sm:text-base"
                  >
                    <span className="text-lg sm:text-xl">📷</span>
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
        
        <div className="border-t border-white/20 pt-4 sm:pt-6 text-center">
          <p className="text-gray-300 text-sm sm:text-base">© 2025 Espaço Marias. Todos os direitos reservados.</p>
          <p className="text-xs sm:text-sm text-gray-400 mt-2">Feito com ❤️ para cuidar da sua beleza</p>
        </div>
      </div>
    </footer>
  );
}
