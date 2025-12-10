"use client";
import React, { useState } from "react";

interface PublicHeaderProps {
  currentPage?: string;
}

export default function PublicHeader({ currentPage = "" }: PublicHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Início", icon: "🏠", key: "inicio" },
    { href: "/login", label: "Login", icon: "🔐", key: "login" },
    { href: "/manicures", label: "Manicures", icon: "💅", key: "manicures" },
    { href: "/servicos", label: "Serviços", icon: "✨", key: "servicos" },
  ];

  return (
    <header className="w-full shadow-2xl sticky top-0 z-50 bg-gradient-to-r from-[#111]/95 to-[#222]/95 backdrop-blur-lg text-white border-b border-pink-500/20 relative overflow-hidden">
      {/* Elementos decorativos no header */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full -translate-y-12 translate-x-12"></div>
      <div className="absolute bottom-0 left-1/4 w-16 h-16 bg-purple-500/10 rounded-full translate-y-8"></div>
      
      <nav className="relative z-10 max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        {/* Logo/Brand Section */}
        <a href="/" className="flex items-center gap-2 sm:gap-4">
          <div className="relative group cursor-pointer">
            {/* Glow externo animado */}
            <div className="absolute -inset-1 sm:-inset-2 bg-gradient-to-r from-pink-500/40 via-purple-500/40 to-pink-500/40 rounded-2xl sm:rounded-3xl blur-lg group-hover:blur-xl transition-all duration-500 animate-pulse group-hover:animate-none"></div>
            
            {/* Container principal do logo */}
            <div className="relative bg-gradient-to-br from-[#111] via-[#1a1a1a] to-[#222] p-2 sm:p-3 rounded-xl sm:rounded-2xl border-2 border-pink-400/40 group-hover:border-pink-400/70 shadow-2xl group-hover:shadow-pink-500/25 transition-all duration-500">
              {/* Reflexo interno */}
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-purple-500/10 rounded-xl sm:rounded-2xl"></div>
              
              {/* Imagem do logo */}
              <div className="relative">
                <img 
                  src="/logo.png" 
                  alt="Espaço Marias" 
                  className="w-10 h-10 sm:w-14 md:w-16 sm:h-14 md:h-16 object-contain filter drop-shadow-lg group-hover:drop-shadow-2xl transition-all duration-500 group-hover:scale-110" 
                  style={{
                    filter: 'brightness(1.2) contrast(1.1) saturate(1.2) hue-rotate(10deg)'
                  }}
                />
              </div>
              
              {/* Pontos decorativos - escondidos em mobile */}
              <div className="hidden sm:block absolute -top-1 -left-1 w-2 h-2 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full shadow-lg shadow-pink-500/50"></div>
              <div className="hidden sm:block absolute -top-1 -right-1 w-1.5 h-1.5 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full shadow-lg shadow-purple-500/50"></div>
            </div>
          </div>
          
          {/* Brand name - visível em tablets e desktop */}
          <div className="hidden sm:block">
            <h2 className="text-base md:text-xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-pink-300 bg-clip-text text-transparent leading-tight">
              Espaço Marias
            </h2>
            <div className="hidden md:flex items-center gap-2">
              <div className="w-3 h-0.5 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full"></div>
              <p className="text-xs text-gray-400 font-medium">Beleza & Bem-estar</p>
              <div className="w-3 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
            </div>
          </div>
        </a>

        {/* Navigation Links - Desktop */}
        <ul className="hidden lg:flex items-center gap-4 xl:gap-6">
          {navLinks.map((link) => (
            <li key={link.key}>
              <a 
                href={link.href} 
                className={`relative px-3 py-2 font-semibold transition-all duration-300 group ${
                  currentPage === link.key ? "text-pink-400" : "text-white hover:text-pink-300"
                }`}
              >
                <span className="relative z-10">{link.label}</span>
                <div className="absolute inset-0 bg-pink-500/20 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></div>
              </a>
            </li>
          ))}
          <li>
            <a 
              href="/contato" 
              className={`relative bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold px-4 py-2 rounded-xl shadow-lg transition-all transform hover:scale-105 hover:shadow-xl ${
                currentPage === "contato" ? "ring-2 ring-white/50" : ""
              }`}
            >
              Contato
            </a>
          </li>
        </ul>

        {/* Navigation compacta para tablets */}
        <ul className="hidden md:flex lg:hidden items-center gap-3">
          <li><a href="/" className={`font-semibold text-sm ${currentPage === "inicio" ? "text-pink-400" : "text-white hover:text-pink-300"}`}>Início</a></li>
          <li><a href="/login" className={`font-semibold text-sm ${currentPage === "login" ? "text-pink-400" : "text-white hover:text-pink-300"}`}>Login</a></li>
          <li><a href="/servicos" className={`font-semibold text-sm ${currentPage === "servicos" ? "text-pink-400" : "text-white hover:text-pink-300"}`}>Serviços</a></li>
          <li>
            <a 
              href="/contato" 
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold px-3 py-1.5 rounded-lg hover:scale-105 transition-transform text-sm"
            >
              Contato
            </a>
          </li>
        </ul>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white hover:text-pink-400 transition-colors p-2 rounded-lg hover:bg-white/10"
            aria-label="Menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-pink-500/20 bg-gradient-to-b from-[#111]/98 to-[#222]/98 backdrop-blur-lg animate-[slideDown_0.3s_ease-out]">
          <ul className="flex flex-col py-4 px-4 space-y-2">
            {navLinks.map((link) => (
              <li key={link.key}>
                <a 
                  href={link.href} 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${
                    currentPage === link.key 
                      ? "text-pink-400 bg-pink-500/10 border border-pink-500/20" 
                      : "text-white hover:bg-white/10"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-xl">{link.icon}</span>
                  {link.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              <a 
                href="/contato" 
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="text-xl">📞</span>
                Contato
              </a>
            </li>
          </ul>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </header>
  );
}
