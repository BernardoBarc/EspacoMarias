"use client";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/api';

interface DadosSalao {
  telefone: string;
  endereco: string;
  email: string;
  instagram?: string;
}

export default function Registro() {
  const [dadosSalao, setDadosSalao] = useState<DadosSalao | null>(null);
  useEffect(() => {
    apiFetch("api/users/dados-salao")
      .then((res) => res.json())
      .then((data) => setDadosSalao(data));
  }, []);

  const router = useRouter();

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // id do registro temporário criado no backend (para vincular todas as etapas)
  const [tempId, setTempId] = useState<string | null>(null);

  // Verification flow state
  const [phoneSent, setPhoneSent] = useState(false);
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState(""); // telefone que foi realmente verificado

  const [emailSent, setEmailSent] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState(""); // email que foi realmente verificado

  // control the sequential steps: 'idle' | 'phoneCode' | 'emailCode' | 'done'
  const [currentStep, setCurrentStep] = useState<"idle" | "phoneCode" | "emailCode" | "done">("idle");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  // Detectar registro pendente quando componente carrega (sem informar ao usuário)
  useEffect(() => {
    // Verificar e limpar registros antigos no localStorage (sem expor informações)
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('pendingRegistration_'));
      if (keys.length > 0) {
        // limpar registros antigos (máximo 1 dia)
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        keys.forEach(key => {
          const pendingData = JSON.parse(localStorage.getItem(key) || '{}');
          if (!pendingData.timestamp || pendingData.timestamp <= oneDayAgo) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (e) {
      // ignore errors
    }
  }, []);

  const validatePhone = (p: string) => {
    if (!p) return false;
    
    // Normalizar removendo caracteres não numéricos
    const normalized = p.replace(/\D/g, '');
    
    // Verificar se tem 11 dígitos (DDD + 9 + número)
    if (normalized.length !== 11) {
      return false;
    }
    
    // Verificar se começa com DDD válido (11-99)
    const ddd = normalized.substring(0, 2);
    const validDDDs = [
      '11', '12', '13', '14', '15', '16', '17', '18', '19', // São Paulo
      '21', '22', '24', // Rio de Janeiro
      '27', '28', // Espírito Santo
      '31', '32', '33', '34', '35', '37', '38', // Minas Gerais
      '41', '42', '43', '44', '45', '46', // Paraná
      '47', '48', '49', // Santa Catarina
      '51', '53', '54', '55', // Rio Grande do Sul
      '61', // Distrito Federal
      '62', '64', // Goiás
      '63', // Tocantins
      '65', '66', // Mato Grosso
      '67', // Mato Grosso do Sul
      '68', // Acre
      '69', // Rondônia
      '71', '73', '74', '75', '77', // Bahia
      '79', // Sergipe
      '81', '87', // Pernambuco
      '82', // Alagoas
      '83', // Paraíba
      '84', // Rio Grande do Norte
      '85', '88', // Ceará
      '86', '89', // Piauí
      '91', '93', '94', // Pará
      '92', '97', // Amazonas
      '95', // Roraima
      '96', // Amapá
      '98', '99'  // Maranhão
    ];
    
    if (!validDDDs.includes(ddd)) {
      return false;
    }
    
    // Verificar se o terceiro dígito é 9 (obrigatório para celular)
    if (normalized.charAt(2) !== '9') {
      return false;
    }
    
    return true;
  };
  const validateEmail = (e: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  };
  const validatePassword = (pw: string) => pw.length >= 6;

  const formatPhoneInput = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limited = numbers.substring(0, 11);
    
    // Aplica formatação: (11) 98765-4321
    if (limited.length >= 7) {
      return `(${limited.substring(0, 2)}) ${limited.substring(2, 3)}${limited.substring(3, 7)}-${limited.substring(7)}`;
    } else if (limited.length >= 3) {
      return `(${limited.substring(0, 2)}) ${limited.substring(2)}`;
    } else if (limited.length >= 1) {
      return `(${limited}`;
    }
    
    return limited;
  };

  // retornam booleanos para permitir encadeamento
  const startPhoneVerification = async () => {
    setMessage("");
    if (!validatePhone(phone)) {
      setMessage("Telefone inválido. Digite no formato: DDD + 9 + número (ex: 11987654321)");
      return null;
    }
    setLoading(true);
    try {
      const res = await apiFetch("api/users/startPhoneVerification", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setPhoneSent(true);
        // salvar tempId retornado pelo backend para usar nas próximas etapas
        if (data && data.tempId) setTempId(data.tempId);
        setMessage("Código enviado por SMS (verifique sua caixa SPAM).");
        return data && data.tempId ? data.tempId : null;
      } else {
        setMessage(data.error || "Erro ao enviar código de telefone");
        return null;
      }
    } catch (err) {
      console.error(err);
      setMessage("Erro de rede ao iniciar verificação de telefone");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const confirmPhone = async () => {
    setMessage("");
    if (!phoneSent) return (setMessage("Inicie verificação do telefone primeiro"), false);
    if (!phoneCode) return (setMessage("Informe o código recebido"), false);
    setLoading(true);
    try {
      const res = await apiFetch("api/users/confirmPhoneCode", {
        method: "POST",
        body: JSON.stringify({ phone, code: phoneCode, tempId }),
      });
      const data = await res.json();
      if (res.ok) {
        setPhoneVerified(true);
        setVerifiedPhone(phone);
        setMessage("Telefone verificado com sucesso");
        return true;
      } else {
        setMessage(data.error || "Código inválido");
        return false;
      }
    } catch (err) {
      console.error(err);
      setMessage("Erro de rede ao confirmar código do telefone");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const startEmailVerification = async () => {
    setMessage("");
    if (!validateEmail(email)) {
      setMessage("Email inválido");
      return false;
    }
    setLoading(true);
    try {
      const res = await apiFetch("api/users/startEmailVerification", {
        method: "POST",
        body: JSON.stringify({ email, phone, tempId }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailSent(true);
        // Verificar se retornou um tempId simulado (email já cadastrado)
        if (data && data.tempId && data.tempId.startsWith('simulated_')) {
          setTempId(data.tempId);
          setMessage("⚠️ Este email já está cadastrado. Use um email diferente.");
          return false; // Retornar false para indicar que não deve prosseguir
        }
        // backend pode retornar tempId (ex.: encontrou usuário existente) — atualizar se houver
        if (data && data.tempId) setTempId(data.tempId);
        setMessage("Código de verificação enviado por email (verifique sua caixa SPAM).");
        return true;
      } else {
        setMessage(data.error || "Erro ao enviar código de email");
        return false;
      }
    } catch (err) {
      console.error(err);
      setMessage("Erro de rede ao iniciar verificação de email");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const confirmEmail = async () => {
    setMessage("");
    if (!emailSent) return (setMessage("Inicie verificação do email primeiro"), false);
    if (!emailCode) return (setMessage("Informe o código recebido por email"), false);
    setLoading(true);
    try {
      const res = await apiFetch("api/users/confirmEmailCode", {
        method: "POST",
        body: JSON.stringify({ email, code: emailCode, tempId }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailVerified(true);
        setVerifiedEmail(email); // salvar o email que foi realmente verificado
        setMessage("Email verificado com sucesso");
        return true;
      } else {
        setMessage(data.error || "Código de email inválido");
        return false;
      }
    } catch (err) {
      console.error(err);
      setMessage("Erro de rede ao confirmar código de email");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // cria a conta após ambas verificações concluírem
  const finalizeCreateAccount = async () => {
    // VALIDAÇÃO DE SEGURANÇA: verificar se os dados atuais batem com os verificados
    if (!phoneVerified || !emailVerified) {
      setMessage("Erro: telefone e email devem estar verificados");
      return;
    }
    
    if (phone !== verifiedPhone) {
      setMessage("Erro: o telefone foi alterado após a verificação. Verifique o telefone novamente.");
      // resetar verificação de telefone
      setPhoneVerified(false);
      setVerifiedPhone("");
      setPhoneSent(false);
      setPhoneCode("");
      setCurrentStep("phoneCode");
      return;
    }
    
    if (email !== verifiedEmail) {
      setMessage("Erro: o email foi alterado após a verificação. Verifique o email novamente.");
      // resetar verificação de email
      setEmailVerified(false);
      setVerifiedEmail("");
      setEmailSent(false);
      setEmailCode("");
      setCurrentStep("emailCode");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("api/users/CriarUser", {
        method: "POST",
        body: JSON.stringify({ name, email: verifiedEmail, phone: verifiedPhone, password, tempId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Conta criada com sucesso. Faça login.");
        // reset
        setName("");
        setPhone("");
        setEmail("");
        setPassword("");
        setTempId(null);
        setPhoneSent(false);
        setPhoneCode("");
        setPhoneVerified(false);
        setVerifiedPhone("");
        setEmailSent(false);
        setEmailCode("");
        setEmailVerified(false);
        setVerifiedEmail("");
        setCurrentStep("done");
      } else {
        setMessage(data.error || "Erro ao criar usuário");
      }
    } catch (err) {
      console.error(err);
      setMessage("Erro de rede ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  // novo fluxo orquestrado: inicia verificação de telefone e redireciona para página de verificação
  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!name) return setMessage("Nome obrigatório");
    if (!validatePhone(phone)) return setMessage("Telefone inválido. Digite no formato: DDD + 9 + número (ex: 11987654321)");
    if (!validateEmail(email)) return setMessage("Email inválido");
    if (!validatePassword(password)) return setMessage("Senha deve ter ao menos 6 caracteres");
    
    setLoading(true);
    try {
      // PRIMEIRO: Verificar se telefone ou email já existem ANTES de qualquer processo
      const checkRes = await apiFetch("api/users/checkDuplicates", {
        method: "POST",
        body: JSON.stringify({ 
          phone: phone.replace(/\D/g, ''), // Enviar apenas números
          email: email 
        }),
      });
      
      if (!checkRes.ok) {
        setMessage("Erro ao verificar dados. Tente novamente.");
        return;
      }
      
      const checkData = await checkRes.json();
      
      // Se encontrou duplicatas, mostrar erro específico e NÃO prosseguir
      if (checkData.duplicates && checkData.duplicates.length > 0) {
        const isPhoneDuplicate = checkData.duplicates.includes('phone');
        const isEmailDuplicate = checkData.duplicates.includes('email');
        
        if (isPhoneDuplicate && isEmailDuplicate) {
          setMessage("⚠️ Este telefone e email já estão cadastrados. Use dados diferentes.");
        } else if (isPhoneDuplicate) {
          setMessage("⚠️ Este telefone já está cadastrado. Use um telefone diferente.");
        } else if (isEmailDuplicate) {
          setMessage("⚠️ Este email já está cadastrado. Use um email diferente.");
        }
        return; // NÃO prosseguir para verificação
      }
      
      // Se chegou aqui, não há duplicatas - prosseguir com o registro
      const returnedTempId = await startPhoneVerification();
      if (!returnedTempId) return;
      
      // salvar dados temporários no sessionStorage E localStorage para persistir após fechar navegador
      try {
        const pending = { 
          tempId: returnedTempId, 
          name: name, 
          email: email, 
          phone: phone, 
          password: password,
          timestamp: Date.now() // para controle de expiração
        };
        sessionStorage.setItem('pendingRegistration', JSON.stringify(pending));
        // localStorage persiste após fechar navegador - será limpo após criação da conta
        localStorage.setItem('pendingRegistration_' + returnedTempId, JSON.stringify(pending));
      } catch (e) {
        // ignore
      }
      // redirecionar para a página de verificação (melhor UX)
      router.push(`/registro/verify?tempId=${returnedTempId}&step=phone`);
    } catch (err) {
      console.error(err);
      setMessage("Erro de rede ao verificar dados. Tente novamente.");
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
              ✨ Criar Conta ✨
            </h1>
            <p className="text-center text-gray-300 mb-8">
              Junte-se a nós e tenha acesso aos nossos serviços de beleza e bem-estar
            </p>

            <form className="space-y-6" onSubmit={createAccount}>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-pink-400">Nome Completo</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  placeholder="Seu nome completo"
                  className="w-full p-4 bg-[#222] border-2 border-pink-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-pink-500/60 focus:ring-2 focus:ring-pink-500/20 transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-pink-400">Telefone</label>
                <input
                  value={phone}
                  onChange={(e) => {
                    const formatted = formatPhoneInput(e.target.value);
                    setPhone(formatted);
                    // se alterou após verificação, resetar estado
                    if (phoneVerified && formatted !== verifiedPhone) {
                      setPhoneVerified(false);
                      setVerifiedPhone("");
                      setMessage("Telefone alterado. Será necessário verificar novamente.");
                    }
                  }}
                  type="tel"
                  placeholder="(11) 99999-9999"
                  className="w-full p-4 bg-[#222] border-2 border-pink-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-pink-500/60 focus:ring-2 focus:ring-pink-500/20 transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-pink-400">Email</label>
                <input
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    // se alterou após verificação, resetar estado
                    if (emailVerified && e.target.value !== verifiedEmail) {
                      setEmailVerified(false);
                      setVerifiedEmail("");
                      setMessage("Email alterado. Será necessário verificar novamente.");
                    }
                  }}
                  type="email"
                  placeholder="seu@email.com"
                  className="w-full p-4 bg-[#222] border-2 border-pink-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-pink-500/60 focus:ring-2 focus:ring-pink-500/20 transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-pink-400">Senha</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  className="w-full p-4 bg-[#222] border-2 border-pink-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-pink-500/60 focus:ring-2 focus:ring-pink-500/20 transition-all"
                  required
                />
                {password && (
                  <div className="space-y-2">
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          password.length >= 8 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 
                          password.length >= 6 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-red-500 to-red-600'
                        }`} 
                        style={{ width: `${Math.min(100, (password.length / 8) * 100)}%` }}
                      ></div>
                    </div>
                    <p className={`text-sm font-medium ${
                      password.length >= 8 ? 'text-green-400' : 
                      password.length >= 6 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {password.length >= 8 ? '✅ Senha forte' : 
                       password.length >= 6 ? '⚠️ Senha ok' : '❌ Senha muito fraca'}
                    </p>
                  </div>
                )}
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
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      <span>Criar Conta</span>
                      <span>🚀</span>
                    </>
                  )}
                </span>
              </button>
            </form>

            {message && (
              <div className={`mt-8 p-4 rounded-xl text-center font-medium border-2 backdrop-blur-sm ${
                message.includes("sucesso") || message.includes("criada") || message.includes("verificado") 
                  ? "bg-green-500/20 text-green-300 border-green-500/40" 
                  : message.includes("Erro") || message.includes("inválido") || message.includes("⚠️")
                  ? "bg-red-500/20 text-red-300 border-red-500/40"
                  : "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"
              }`}>
                {message}
              </div>
            )}

            <div className="text-center mt-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
                <span className="text-gray-400 text-sm">ou</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
              </div>
              
              <p className="text-gray-300 text-sm">
                Já tem uma conta?{" "}
                <a
                  href="login"
                  className="text-pink-400 hover:text-pink-300 font-semibold transition-colors"
                >
                  Faça login aqui
                </a>
              </p>
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