"use client";
import React, { useEffect, useState, useRef } from "react";
import { apiFetch } from '../../../../lib/api';

interface Imagem {
  url: string;
  title?: string;
  description?: string;
}

interface DadosSalao {
  _id?: string;
  phone: string;
  endereco: string;
  email: string;
  instagram: string;
  fotosServicos: Imagem[];
  fotosHome: Imagem[];
}

export default function DadosSalaoAdmin() {
  const [dados, setDados] = useState<DadosSalao>({
    phone: "",
    endereco: "",
    email: "",
    instagram: "",
    fotosServicos: [],
    fotosHome: [],
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [previewServicos, setPreviewServicos] = useState<Imagem[]>([]);
  const [previewHome, setPreviewHome] = useState<Imagem[]>([]);

  const replaceServicosInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const replaceHomeInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    fetchDadosSalao();
  }, []);

  const fetchDadosSalao = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("api/users/dados-salao");
      const data = await res.json();
      const payload = Array.isArray(data) ? (data.length > 0 ? data[0] : {}) : (data || {});
      console.log('fetchDadosSalao payload:', payload);
      setDados(prev => ({ ...prev, ...payload }));
      // adaptar payload antigo (strings) para novo formato de objeto
      const servicos = (payload.fotosServicos || []).map((f: any) => typeof f === 'string' ? { url: f, title: '', description: '' } : f);
      const home = (payload.fotosHome || []).map((f: any) => typeof f === 'string' ? { url: f, title: '', description: '' } : f);
      setPreviewServicos(servicos);
      setPreviewHome(home);
      setMessage("");
    } catch (err) {
      console.error('Erro ao buscar dados do salão:', err);
      setMessage("Erro ao buscar dados do salão");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDados(prev => ({ ...prev, [name]: value }));
  };

  // Adicionar fotos dos serviços (agora como objetos)
  const handleAddFotosServicos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const arr: Imagem[] = [];
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        arr.push({ url: reader.result as string, title: '', description: '' });
        if (arr.length === files.length) {
          setDados(prev => ({ ...prev, fotosServicos: [...(prev.fotosServicos || []), ...arr] }));
          setPreviewServicos(prev => ([...prev, ...arr]));
          // limpar input
          e.currentTarget.value = "";
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Substituir foto de serviço em um index
  const handleReplaceFotoServico = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setDados(prev => {
        const fotos = [...(prev.fotosServicos || [])];
        fotos[index] = { url: dataUrl, title: fotos[index]?.title || '', description: fotos[index]?.description || '' };
        return { ...prev, fotosServicos: fotos };
      });
      setPreviewServicos(prev => {
        const fotos = [...prev];
        fotos[index] = { url: dataUrl, title: fotos[index]?.title || '', description: fotos[index]?.description || '' };
        return fotos;
      });
    };
    reader.readAsDataURL(file);
  };

  // Deletar foto de serviço
  const handleDeleteFotoServico = (index: number) => {
    setDados(prev => {
      const fotos = [...(prev.fotosServicos || [])];
      fotos.splice(index, 1);
      return { ...prev, fotosServicos: fotos };
    });
    setPreviewServicos(prev => {
      const fotos = [...prev];
      fotos.splice(index, 1);
      return fotos;
    });
  };

  // Adicionar fotos da home
  const handleAddFotosHome = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const arr: Imagem[] = [];
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        arr.push({ url: reader.result as string, title: '', description: '' });
        if (arr.length === files.length) {
          setDados(prev => ({ ...prev, fotosHome: [...(prev.fotosHome || []), ...arr] }));
          setPreviewHome(prev => ([...prev, ...arr]));
          e.currentTarget.value = "";
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleReplaceFotoHome = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setDados(prev => {
        const fotos = [...(prev.fotosHome || [])];
        fotos[index] = { url: dataUrl, title: fotos[index]?.title || '', description: fotos[index]?.description || '' };
        return { ...prev, fotosHome: fotos };
      });
      setPreviewHome(prev => {
        const fotos = [...prev];
        fotos[index] = { url: dataUrl, title: fotos[index]?.title || '', description: fotos[index]?.description || '' };
        return fotos;
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteFotoHome = (index: number) => {
    setDados(prev => {
      const fotos = [...(prev.fotosHome || [])];
      fotos.splice(index, 1);
      return { ...prev, fotosHome: fotos };
    });
    setPreviewHome(prev => {
      const fotos = [...prev];
      fotos.splice(index, 1);
      return fotos;
    });
  };

  // campos de título/descrição para cada imagem
  const handleChangeImageMeta = (which: 'home' | 'servicos', index: number, field: 'title' | 'description', value: string) => {
    if (which === 'home') {
      setDados(prev => {
        const fotos = [...(prev.fotosHome || [])];
        fotos[index] = { ...fotos[index], [field]: value };
        return { ...prev, fotosHome: fotos };
      });
      setPreviewHome(prev => {
        const fotos = [...prev];
        fotos[index] = { ...fotos[index], [field]: value };
        return fotos;
      });
    } else {
      setDados(prev => {
        const fotos = [...(prev.fotosServicos || [])];
        fotos[index] = { ...fotos[index], [field]: value };
        return { ...prev, fotosServicos: fotos };
      });
      setPreviewServicos(prev => {
        const fotos = [...prev];
        fotos[index] = { ...fotos[index], [field]: value };
        return fotos;
      });
    }
  };

  const salvarAlteracoes = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...dados };
      console.log('enviando dados do salao:', payload);
      const response = await apiFetch("api/users/atualizarDadosSalao", {
        method: dados._id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setMessage("Dados do salão atualizados com sucesso!");
        await fetchDadosSalao();
        try {
          localStorage.setItem('dadosSalaoUpdated', Date.now().toString());
        } catch (err) {
          console.warn('Não foi possível setar localStorage:', err);
        }
      } else {
        const text = await response.text();
        console.error('Erro ao atualizar, status:', response.status, 'body:', text);
        setMessage("Erro ao atualizar dados do salão");
      }
    } catch (err) {
      console.error('Erro salvarAlteracoes:', err);
      setMessage("Erro ao atualizar dados do salão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#222] to-[#111] relative overflow-hidden">
      {/* Elementos decorativos de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 sm:-top-40 -right-20 sm:-right-40 w-40 sm:w-80 h-40 sm:h-80 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 sm:-bottom-40 -left-20 sm:-left-40 w-40 sm:w-80 h-40 sm:h-80 bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 sm:w-96 h-48 sm:h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header Premium */}
      <header className="relative z-10 w-full bg-gradient-to-r from-[#333]/90 to-[#222]/90 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-lg">
                🏢
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Dados do Salão
                </h1>
                <p className="text-gray-400 text-xs sm:text-sm">Gerencie as informações do estabelecimento</p>
              </div>
            </div>
            <a 
              href="/home" 
              className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg sm:rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
            >
              ← Voltar
            </a>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <section className="relative z-10 container mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Card Principal */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Header do Card */}
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl border-b border-white/10 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white text-lg">
                  ✏️
                </div>
                <h2 className="text-2xl font-bold text-white">Editar Dados do Salão</h2>
              </div>
            </div>

            {/* Formulário */}
            <div className="p-8">
              <form className="space-y-8" onSubmit={salvarAlteracoes}>
                {/* Seção de Informações Básicas */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                    <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center text-white text-sm">📋</span>
                    <span>Informações Básicas</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-white font-medium flex items-center space-x-2">
                        <span>📞</span>
                        <span>Telefone</span>
                      </label>
                      <input
                        type="text"
                        name="phone"
                        value={dados.phone}
                        onChange={handleInputChange}
                        className="w-full p-4 bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                        placeholder="Digite o telefone do salão"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-white font-medium flex items-center space-x-2">
                        <span>📧</span>
                        <span>Email</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={dados.email}
                        onChange={handleInputChange}
                        className="w-full p-4 bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                        placeholder="Digite o email do salão"
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-white font-medium flex items-center space-x-2">
                        <span>📍</span>
                        <span>Endereço</span>
                      </label>
                      <input
                        type="text"
                        name="endereco"
                        value={dados.endereco}
                        onChange={handleInputChange}
                        className="w-full p-4 bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300"
                        placeholder="Digite o endereço completo do salão. Ex: Rua do Brasil 123 Centro Palmeira das Missões - RS"
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-white font-medium flex items-center space-x-2">
                        <span>📱</span>
                        <span>Instagram</span>
                      </label>
                      <input
                        type="text"
                        name="instagram"
                        value={dados.instagram}
                        onChange={handleInputChange}
                        className="w-full p-4 bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all duration-300"
                        placeholder="@usuario_instagram"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Seção de Fotos dos Serviços */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                    <span className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center text-white text-sm">🖼️</span>
                    <span>Fotos da Página de Serviços</span>
                  </h3>
                  
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <div className="space-y-4">
                      <label className="block">
                        <span className="text-white font-medium mb-2 block">Adicionar Novas Fotos</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleAddFotosServicos}
                          className="w-full p-4 bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-yellow-500 file:to-orange-600 file:text-white file:cursor-pointer hover:file:from-yellow-600 hover:file:to-orange-700 transition-all duration-300"
                        />
                      </label>
                      
                      {previewServicos.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                          {previewServicos.map((img, idx) => (
                            <div key={idx} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 hover:bg-white/10 transition-all duration-300">
                              <div className="relative group">
                                <img 
                                  src={img.url} 
                                  alt={`Serviço ${idx + 1}`} 
                                  className="w-full h-32 object-cover rounded-xl border-2 border-white/20 group-hover:border-yellow-500/50 transition-all duration-300" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                              </div>
                              
                              <div className="space-y-3 mt-4">
                                <input 
                                  type="text" 
                                  placeholder="Título (opcional)" 
                                  value={img.title} 
                                  onChange={(e) => handleChangeImageMeta('servicos', idx, 'title', e.target.value)} 
                                  className="w-full p-2 bg-white/5 backdrop-blur-xl border border-white/20 rounded-lg text-white placeholder-gray-400 text-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-300" 
                                />
                                <input 
                                  type="text" 
                                  placeholder="Descrição (opcional)" 
                                  value={img.description} 
                                  onChange={(e) => handleChangeImageMeta('servicos', idx, 'description', e.target.value)} 
                                  className="w-full p-2 bg-white/5 backdrop-blur-xl border border-white/20 rounded-lg text-white placeholder-gray-400 text-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-300" 
                                />
                                
                                <div className="flex gap-2">
                                  <button 
                                    type="button" 
                                    onClick={() => handleDeleteFotoServico(idx)} 
                                    className="flex-1 px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-sm hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg"
                                  >
                                    🗑️ Apagar
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => replaceServicosInputRefs.current[idx]?.click()} 
                                    className="flex-1 px-3 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-lg text-sm hover:from-yellow-600 hover:to-orange-700 transition-all duration-300 shadow-lg"
                                  >
                                    🔄 Substituir
                                  </button>
                                </div>
                              </div>
                              
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={el => { replaceServicosInputRefs.current[idx] = el; }}
                                onChange={(e) => {
                                  const f = e.target.files && e.target.files[0];
                                  if (f) handleReplaceFotoServico(idx, f);
                                  if (e.target) e.currentTarget.value = "";
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Seção de Fotos da Home */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                    <span className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white text-sm">🏠</span>
                    <span>Fotos da Página Inicial</span>
                  </h3>
                  
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <div className="space-y-4">
                      <label className="block">
                        <span className="text-white font-medium mb-2 block">Adicionar Novas Fotos</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleAddFotosHome}
                          className="w-full p-4 bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-green-500 file:to-emerald-600 file:text-white file:cursor-pointer hover:file:from-green-600 hover:file:to-emerald-700 transition-all duration-300"
                        />
                      </label>
                      
                      {previewHome.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                          {previewHome.map((img, idx) => (
                            <div key={idx} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 hover:bg-white/10 transition-all duration-300">
                              <div className="relative group">
                                <img 
                                  src={img.url} 
                                  alt={`Home ${idx + 1}`} 
                                  className="w-full h-32 object-cover rounded-xl border-2 border-white/20 group-hover:border-green-500/50 transition-all duration-300" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                              </div>
                              
                              <div className="space-y-3 mt-4">
                                <input 
                                  type="text" 
                                  placeholder="Título (opcional)" 
                                  value={img.title} 
                                  onChange={(e) => handleChangeImageMeta('home', idx, 'title', e.target.value)} 
                                  className="w-full p-2 bg-white/5 backdrop-blur-xl border border-white/20 rounded-lg text-white placeholder-gray-400 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300" 
                                />
                                <input 
                                  type="text" 
                                  placeholder="Descrição (opcional)" 
                                  value={img.description} 
                                  onChange={(e) => handleChangeImageMeta('home', idx, 'description', e.target.value)} 
                                  className="w-full p-2 bg-white/5 backdrop-blur-xl border border-white/20 rounded-lg text-white placeholder-gray-400 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300" 
                                />
                                
                                <div className="flex gap-2">
                                  <button 
                                    type="button" 
                                    onClick={() => handleDeleteFotoHome(idx)} 
                                    className="flex-1 px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-sm hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg"
                                  >
                                    🗑️ Apagar
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => replaceHomeInputRefs.current[idx]?.click()} 
                                    className="flex-1 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg"
                                  >
                                    🔄 Substituir
                                  </button>
                                </div>
                              </div>
                              
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={el => { replaceHomeInputRefs.current[idx] = el; }}
                                onChange={(e) => {
                                  const f = e.target.files && e.target.files[0];
                                  if (f) handleReplaceFotoHome(idx, f);
                                  if (e.target) e.currentTarget.value = "";
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botão de Salvar */}
                <div className="pt-6 border-t border-white/10">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-8 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center space-x-3"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <span>💾</span>
                        <span>Salvar Alterações</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Mensagem de Status */}
                {message && (
                  <div className={`p-4 rounded-xl backdrop-blur-xl border text-center font-medium ${
                    message.includes("sucesso") 
                      ? "bg-green-500/10 border-green-500/30 text-green-400" 
                      : "bg-red-500/10 border-red-500/30 text-red-400"
                  }`}>
                    {message}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

