"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from '../../lib/api';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
 const authentication = async (e:any) => {
  e.preventDefault();
  setError(null);
  
  if (email != "" && password != "") {
    const formData = { email: email, password: password }
    
    console.log("📤 Dados sendo enviados:", formData);
    
    try {
      const add = await apiFetch('api/users/loginUser', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(formData)
      });
      
      const content = await add.json();
      console.log("✅ Resposta COMPLETA do backend:", content);
      
      if (content.token) {
        console.log("🎉 Login bem-sucedido!");
        const userData = {
          nome: content.name,
          tipo: content.role
        };
        console.log("👤 User data adaptado:", userData);
        sessionStorage.setItem('token', content.token);
        sessionStorage.setItem('user', JSON.stringify(userData));
        // Salva o _id do usuário no sessionStorage (isolado por guia)
        if (content._id) {
          sessionStorage.setItem('userId', content._id);
        }
        router.push('/home');
      } else {
        setError('Credenciais inválidas. Por favor, tente novamente.');
      }
    } catch (error) {
      console.error("Erro no login:", error);
      setError('Erro ao conectar com o servidor.');
    }
  } else {
    setError('Por favor, preencha todos os campos.');
  }
}

  return (
    <main className="min-h-screen font-sans flex flex-col items-center justify-between bg-gradient-to-br from-[#222] to-[#111] text-white relative overflow-hidden">
      {/* Decorações de fundo */}
      <div className="absolute top-0 left-0 w-48 sm:w-96 h-48 sm:h-96 bg-pink-500/10 rounded-full -translate-x-24 sm:-translate-x-48 -translate-y-24 sm:-translate-y-48 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-48 sm:w-96 h-48 sm:h-96 bg-purple-500/10 rounded-full translate-x-24 sm:translate-x-48 translate-y-24 sm:translate-y-48 blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 w-32 sm:w-64 h-32 sm:h-64 bg-blue-500/5 rounded-full -translate-x-16 sm:-translate-x-32 -translate-y-16 sm:-translate-y-32 blur-2xl"></div>

      {/* Header com logo */}
      <header className="w-full py-4 sm:py-8 px-4 sm:px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex justify-center">
          <a href="/" className="flex items-center gap-3 sm:gap-4">
            <div className="relative group">
              {/* Glow externo animado */}
              <div className="absolute -inset-2 bg-gradient-to-r from-pink-500/40 via-purple-500/40 to-pink-500/40 rounded-3xl blur-lg group-hover:blur-xl transition-all duration-500 animate-pulse"></div>
              
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
                <div className="absolute -top-1 -left-1 w-2 sm:w-3 h-2 sm:h-3 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full shadow-lg shadow-pink-500/50"></div>
                <div className="absolute -top-1 -right-1 w-1.5 sm:w-2 h-1.5 sm:h-2 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full shadow-lg shadow-purple-500/50"></div>
                <div className="absolute -bottom-1 -left-1 w-1.5 sm:w-2 h-1.5 sm:h-2 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-pink-300 bg-clip-text text-transparent">
                Espaço Marias
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 font-medium">Beleza & Bem-estar</p>
            </div>
          </a>
        </div>
      </header>

      {/* Conteúdo principal */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-4 sm:py-0 relative z-10 w-full">
        <div className="bg-gradient-to-br from-[#111]/80 to-[#222]/80 backdrop-blur-xl p-6 sm:p-10 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md border border-pink-500/20 relative">
          {/* Decoração interna */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-500/10 rounded-full translate-y-8 -translate-x-8"></div>
          
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-4xl font-bold text-center mb-6 sm:mb-8 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              ✨ Entrar ✨
            </h1>
            <p className="text-center text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base">
              Acesse sua conta para agendar serviços e gerenciar suas informações
            </p>

            <form className="space-y-4 sm:space-y-6" onSubmit={authentication}>
              <div className="space-y-1.5 sm:space-y-2">
                <label className="block text-xs sm:text-sm font-semibold text-pink-400">Email</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  className="w-full p-3 sm:p-4 bg-[#222] border-2 border-pink-500/30 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-pink-500/60 focus:ring-2 focus:ring-pink-500/20 transition-all text-sm sm:text-base"
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                />
              </div>
              
              <div className="space-y-1.5 sm:space-y-2">
                <label className="block text-xs sm:text-sm font-semibold text-pink-400">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full p-3 sm:p-4 pr-12 bg-[#222] border-2 border-pink-500/30 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-pink-500/60 focus:ring-2 focus:ring-pink-500/20 transition-all text-sm sm:text-base"
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-4 text-gray-400 hover:text-pink-400 transition-colors"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl shadow-lg transition-all transform hover:scale-105 hover:shadow-xl text-sm sm:text-base"
              >
                <span className="flex items-center justify-center space-x-2">
                  <span>Entrar</span>
                  <span>🚀</span>
                </span>
              </button>
              
              {error && (
                <div className="p-3 sm:p-4 bg-red-500/20 border-2 border-red-500/40 rounded-lg sm:rounded-xl text-red-300 text-xs sm:text-sm text-center backdrop-blur-sm">
                  {error}
                </div>
              )}
            </form>

            <div className="text-center mt-6 sm:mt-8 space-y-3 sm:space-y-4">
              <a 
                href="esqueci-senha" 
                className="block text-pink-400 hover:text-pink-300 transition-colors text-xs sm:text-sm font-medium"
              >
                🔐 Esqueci minha senha
              </a>
              
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
                <span className="text-gray-400 text-xs sm:text-sm">ou</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
              </div>
              
              <p className="text-gray-300 text-xs sm:text-sm">
                Não tem uma conta?{" "}
                <a href="registro" className="text-pink-400 hover:text-pink-300 font-semibold transition-colors">
                  Cadastre-se aqui
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer simples */}
      <footer className="w-full py-4 sm:py-6 text-center relative z-10 px-4">
        <p className="text-gray-400 text-xs sm:text-sm">
          © 2025 Espaço Marias • Feito com ❤️ para cuidar da sua beleza
        </p>
      </footer>
    </main>
  );
}
