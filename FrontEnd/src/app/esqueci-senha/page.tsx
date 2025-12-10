"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from '../../lib/api';

export default function EsqueciSenha() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<"email" | "code" | "newPassword">("email");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Função para validar email
  const validateEmail = (e: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  };

  // Enviar código de recuperação
  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    
    if (!validateEmail(email)) {
      setMessage("Por favor, insira um email válido.");
      return;
    }
    
    setLoading(true);
    try {
      const res = await apiFetch("api/users/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage("Código de recuperação enviado para seu email (verifique sua caixa de SPAM).");
        setStep("code");
      } else {
        setMessage(data.error || "Email não encontrado.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  // Verificar código de recuperação
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    
    if (!resetCode || resetCode.length !== 6) {
      setMessage("Por favor, insira o código de 6 dígitos.");
      return;
    }
    
    setLoading(true);
    console.log('🔍 Frontend - Verificando código:', { email, code: resetCode, codeLength: resetCode.length, codeType: typeof resetCode });
    
    try {
      const res = await apiFetch("api/users/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: resetCode }),
      });
      
      const data = await res.json();
      console.log('📥 Resposta do backend:', data);
      
      if (res.ok) {
        setMessage("Código verificado! Agora defina sua nova senha.");
        setStep("newPassword");
      } else {
        console.log('❌ Erro na verificação:', data.error);
        setMessage(data.error || "Código inválido ou expirado.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  // Redefinir senha
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    
    if (newPassword.length < 6) {
      setMessage("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setMessage("As senhas não coincidem.");
      return;
    }
    
    setLoading(true);
    try {
      const res = await apiFetch("api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: resetCode, newPassword }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage("Senha alterada com sucesso! Redirecionando para o login...");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setMessage(data.error || "Erro ao alterar senha.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  // Reenviar código
  const handleResendCode = async () => {
    setMessage("");
    setLoading(true);
    try {
      const res = await apiFetch("api/users/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage("Novo código enviado para seu email. (verifique sua caixa de SPAM)");
      } else {
        setMessage(data.error || "Erro ao reenviar código.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen font-sans flex flex-col items-center justify-between bg-gradient-to-br from-[#222] to-[#111] text-white relative overflow-hidden">
      {/* Decorações de fundo */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-pink-500/10 rounded-full -translate-x-48 -translate-y-48 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full translate-x-48 translate-y-48 blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/5 rounded-full -translate-x-32 -translate-y-32 blur-2xl"></div>

      {/* Header com logo */}
      <header className="w-full py-8 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex justify-center">
          <div className="flex items-center gap-4">
            <div className="relative group">
              {/* Glow externo animado */}
              <div className="absolute -inset-2 bg-gradient-to-r from-pink-500/40 via-purple-500/40 to-pink-500/40 rounded-3xl blur-lg group-hover:blur-xl transition-all duration-500 animate-pulse"></div>
              
              {/* Container principal do logo */}
              <div className="relative bg-gradient-to-br from-[#111] via-[#1a1a1a] to-[#222] p-3 rounded-2xl border-2 border-pink-400/40 group-hover:border-pink-400/70 shadow-2xl transition-all duration-500">
                {/* Reflexo interno */}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-purple-500/10 rounded-2xl"></div>
                
                {/* Imagem do logo */}
                <div className="relative">
                  <img 
                    src="/logo.png" 
                    alt="Espaço Marias" 
                    className="w-16 h-16 object-contain filter drop-shadow-lg transition-all duration-500" 
                    style={{
                      filter: 'brightness(1.2) contrast(1.1) saturate(1.2) hue-rotate(10deg)'
                    }}
                  />
                </div>
                
                {/* Pontos decorativos nos cantos */}
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full shadow-lg shadow-pink-500/50"></div>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full shadow-lg shadow-purple-500/50"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-pink-300 bg-clip-text text-transparent">
                Espaço Marias
              </h2>
              <p className="text-sm text-gray-400 font-medium">Beleza & Bem-estar</p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <div className="flex-1 flex items-center justify-center px-6 relative z-10">
        <div className="bg-gradient-to-br from-[#111]/80 to-[#222]/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-full max-w-lg border border-pink-500/20 relative">
          {/* Decoração interna */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-500/10 rounded-full translate-y-8 -translate-x-8"></div>
          
          <div className="relative z-10">
            <h1 className="text-4xl font-bold text-center mb-6 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              🔐 Recuperar Senha
            </h1>

            {step === "email" && (
              <div>
                <p className="text-gray-300 text-center mb-8 leading-relaxed">
                  Digite seu email para receber o código de recuperação de 6 dígitos
                </p>
                <form onSubmit={handleSendResetCode} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-pink-400">Email</label>
                    <input
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-4 bg-[#222] border-2 border-pink-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-pink-500/60 focus:ring-2 focus:ring-pink-500/20 transition-all"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all transform hover:scale-105 hover:shadow-xl"
                  >
                    <span className="flex items-center justify-center space-x-2">
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <span>Enviar Código</span>
                          <span>📧</span>
                        </>
                      )}
                    </span>
                  </button>
                </form>
              </div>
            )}

            {step === "code" && (
              <div>
                <p className="text-gray-300 text-center mb-8 leading-relaxed">
                  Digite o código de 6 dígitos enviado para<br />
                  <strong className="text-pink-400 text-lg">{email}</strong>
                </p>
                <form onSubmit={handleVerifyCode} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-pink-400 text-center">Código de Verificação</label>
                    <input
                      type="text"
                      placeholder="000000"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full p-6 bg-[#222] border-2 border-pink-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-pink-500/60 focus:ring-2 focus:ring-pink-500/20 transition-all text-center tracking-[0.8em] text-2xl font-mono"
                      maxLength={6}
                      required
                      autoComplete="one-time-code"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || resetCode.length !== 6}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all transform hover:scale-105 hover:shadow-xl"
                  >
                    <span className="flex items-center justify-center space-x-2">
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Verificando...</span>
                        </>
                      ) : (
                        <>
                          <span>Verificar Código</span>
                          <span>✅</span>
                        </>
                      )}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all transform hover:scale-105"
                  >
                    <span className="flex items-center justify-center space-x-2">
                      <span>Reenviar Código</span>
                      <span>🔄</span>
                    </span>
                  </button>
                </form>
                <button
                  onClick={() => setStep("email")}
                  className="w-full mt-6 p-2 text-gray-400 hover:text-pink-400 transition-colors text-sm font-medium"
                >
                  ← Alterar email
                </button>
              </div>
            )}

            {step === "newPassword" && (
              <div>
                <p className="text-gray-300 text-center mb-8 leading-relaxed">
                  Defina sua nova senha segura para acessar sua conta
                </p>
                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-pink-400">Nova Senha</label>
                    <input
                      type="password"
                      placeholder="Nova senha (mín. 6 caracteres)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-4 bg-[#222] border-2 border-pink-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-pink-500/60 focus:ring-2 focus:ring-pink-500/20 transition-all"
                      required
                    />
                    {newPassword && (
                      <div className="mt-3 space-y-2">
                        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              newPassword.length >= 8 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 
                              newPassword.length >= 6 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-red-500 to-red-600'
                            }`} 
                            style={{ width: `${Math.min(100, (newPassword.length / 8) * 100)}%` }}
                          ></div>
                        </div>
                        <p className={`text-sm font-medium ${
                          newPassword.length >= 8 ? 'text-green-400' : 
                          newPassword.length >= 6 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {newPassword.length >= 8 ? '✅ Senha forte' : 
                           newPassword.length >= 6 ? '⚠️ Senha ok' : '❌ Senha muito fraca'}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-pink-400">Confirmar Senha</label>
                    <input
                      type="password"
                      placeholder="Digite a senha novamente"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full p-4 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all border-2 ${
                        confirmPassword && newPassword === confirmPassword 
                          ? 'bg-[#222] border-green-500/60 focus:ring-green-500/20'
                          : confirmPassword && newPassword !== confirmPassword
                          ? 'bg-[#222] border-red-500/60 focus:ring-red-500/20'
                          : 'bg-[#222] border-pink-500/30 focus:border-pink-500/60 focus:ring-pink-500/20'
                      }`}
                      required
                    />
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-red-400 text-sm font-medium">❌ As senhas não coincidem</p>
                    )}
                    {confirmPassword && newPassword === confirmPassword && confirmPassword.length >= 6 && (
                      <p className="text-green-400 text-sm font-medium">✅ Senhas coincidem</p>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all transform hover:scale-105 hover:shadow-xl"
                  >
                    <span className="flex items-center justify-center space-x-2">
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Salvando...</span>
                        </>
                      ) : (
                        <>
                          <span>Alterar Senha</span>
                          <span>🔒</span>
                        </>
                      )}
                    </span>
                  </button>
                </form>
              </div>
            )}

            {message && (
              <div className={`mt-8 p-4 rounded-xl text-center font-medium border-2 backdrop-blur-sm ${
                message.includes("sucesso") || message.includes("enviado") || message.includes("verificado") 
                  ? "bg-green-500/20 text-green-300 border-green-500/40" 
                  : "bg-red-500/20 text-red-300 border-red-500/40"
              }`}>
                {message}
              </div>
            )}

            <div className="text-center mt-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
                <span className="text-gray-400 text-sm">voltar</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
              </div>
              
              <button
                onClick={() => router.push("/login")}
                className="text-pink-400 hover:text-pink-300 font-semibold transition-colors flex items-center justify-center space-x-2 mx-auto"
              >
                <span>←</span>
                <span>Voltar para o Login</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer simples */}
      <footer className="w-full py-6 text-center relative z-10">
        <p className="text-gray-400 text-sm">
          © 2025 Espaço Marias • Feito com ❤️ para cuidar da sua beleza
        </p>
      </footer>
    </main>
  );
}

