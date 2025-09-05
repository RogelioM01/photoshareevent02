import { useState } from "react";
import { Link } from "wouter";

export default function Demo() {
  const [activeTab, setActiveTab] = useState("stats");
  const [activeSection, setActiveSection] = useState("dashboard");

  const statsData = {
    totalGuests: 247,
    confirmedGuests: 189,
    checkedIn: 156,
    photosUploaded: 342
  };

  const guestList = [
    { name: "María González", email: "maria@email.com", status: "confirmed" },
    { name: "Carlos Rodríguez", email: "carlos@email.com", status: "checkedin" },
    { name: "Ana Martínez", email: "ana@email.com", status: "pending" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] overflow-x-hidden">
      {/* Header */}
      <header className="bg-white/25 backdrop-blur-[20px] border border-white/18 rounded-[20px] m-4 p-4 md:p-8 sticky top-4 z-[100] shadow-[0_8px_32px_rgba(31,38,135,0.37)]">
        <nav className="flex justify-between items-center flex-wrap gap-4 max-w-6xl mx-auto">
          <Link href="/" className="text-2xl md:text-3xl font-bold text-white text-shadow-[0_2px_4px_rgba(0,0,0,0.3)] no-underline">
            🎉 Rocky.Mx
          </Link>
          <ul className="flex gap-8 list-none flex-wrap">
            <li><Link href="/" className="text-white no-underline font-medium transition-all duration-300 px-4 py-2 rounded-lg hover:bg-white/20 hover:-translate-y-0.5">Inicio</Link></li>
            <li><Link href="/features" className="text-white no-underline font-medium transition-all duration-300 px-4 py-2 rounded-lg hover:bg-white/20 hover:-translate-y-0.5">Características</Link></li>
            <li><Link href="/demo" className="text-white no-underline font-medium transition-all duration-300 px-4 py-2 rounded-lg hover:bg-white/20 hover:-translate-y-0.5 bg-white/20">Demo</Link></li>
            <li><Link href="/login" className="text-white no-underline font-medium transition-all duration-300 px-4 py-2 rounded-lg hover:bg-white/20 hover:-translate-y-0.5">Iniciar Sesión</Link></li>
          </ul>
        </nav>
      </header>

      <div className="max-w-6xl mx-auto px-4">
        {/* Hero Section */}
        <section className="text-center py-16 text-white">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-shadow-[0_4px_8px_rgba(0,0,0,0.3)] bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
            Demo Interactivo
          </h1>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Explora todas las funcionalidades de Rocky.Mx en acción con datos reales de eventos
          </p>
        </section>

        {/* Demo Navigation */}
        <section className="py-8">
          <div className="bg-white/25 backdrop-blur-[20px] border border-white/18 rounded-2xl p-6 mb-8">
            <div className="flex gap-4 justify-center flex-wrap">
              <button 
                onClick={() => setActiveSection("dashboard")}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeSection === "dashboard" 
                    ? "bg-indigo-600 text-white shadow-[0_4px_15px_rgba(99,102,241,0.4)]" 
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                📊 Dashboard
              </button>
              <button 
                onClick={() => setActiveSection("gallery")}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeSection === "gallery" 
                    ? "bg-indigo-600 text-white shadow-[0_4px_15px_rgba(99,102,241,0.4)]" 
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                📸 Galería
              </button>
              <button 
                onClick={() => setActiveSection("rsvp")}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeSection === "rsvp" 
                    ? "bg-indigo-600 text-white shadow-[0_4px_15px_rgba(99,102,241,0.4)]" 
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                📱 RSVP
              </button>
              <button 
                onClick={() => setActiveSection("scanner")}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeSection === "scanner" 
                    ? "bg-indigo-600 text-white shadow-[0_4px_15px_rgba(99,102,241,0.4)]" 
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                📲 Scanner QR
              </button>
            </div>
          </div>
        </section>

        {/* Dashboard Demo */}
        {activeSection === "dashboard" && (
          <section className="py-8">
            <div className="bg-white/25 backdrop-blur-[20px] border border-white/18 rounded-2xl p-8">
              <h2 className="text-white text-2xl font-bold mb-6 text-center">Panel de Control del Evento</h2>
              
              <div className="flex gap-4 mb-6 justify-center flex-wrap">
                <button 
                  onClick={() => setActiveTab("stats")}
                  className={`px-6 py-3 rounded-lg transition-all duration-300 ${
                    activeTab === "stats" 
                      ? "bg-indigo-600 text-white shadow-[0_4px_15px_rgba(99,102,241,0.4)]" 
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  📊 Estadísticas
                </button>
                <button 
                  onClick={() => setActiveTab("guests")}
                  className={`px-6 py-3 rounded-lg transition-all duration-300 ${
                    activeTab === "guests" 
                      ? "bg-indigo-600 text-white shadow-[0_4px_15px_rgba(99,102,241,0.4)]" 
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  👥 Invitados
                </button>
                <button 
                  onClick={() => setActiveTab("media")}
                  className={`px-6 py-3 rounded-lg transition-all duration-300 ${
                    activeTab === "media" 
                      ? "bg-indigo-600 text-white shadow-[0_4px_15px_rgba(99,102,241,0.4)]" 
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  📸 Multimedia
                </button>
              </div>

              {activeTab === "stats" && (
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white/10 p-6 rounded-2xl text-center border border-white/10">
                      <span className="text-3xl font-bold text-emerald-400 block">{statsData.totalGuests}</span>
                      <span className="text-white/80 text-sm">Invitados Totales</span>
                    </div>
                    <div className="bg-white/10 p-6 rounded-2xl text-center border border-white/10">
                      <span className="text-3xl font-bold text-emerald-400 block">{statsData.confirmedGuests}</span>
                      <span className="text-white/80 text-sm">Confirmados</span>
                    </div>
                    <div className="bg-white/10 p-6 rounded-2xl text-center border border-white/10">
                      <span className="text-3xl font-bold text-emerald-400 block">{statsData.checkedIn}</span>
                      <span className="text-white/80 text-sm">Check-in Completado</span>
                    </div>
                    <div className="bg-white/10 p-6 rounded-2xl text-center border border-white/10">
                      <span className="text-3xl font-bold text-emerald-400 block">{statsData.photosUploaded}</span>
                      <span className="text-white/80 text-sm">Fotos Subidas</span>
                    </div>
                  </div>
                  
                  <div className="bg-white/10 p-6 rounded-2xl text-white">
                    <h3 className="text-lg font-bold mb-4">📈 Análisis en Tiempo Real</h3>
                    <ul className="space-y-2">
                      <li>• Pico de asistencia: 18:30 - 19:15</li>
                      <li>• Fotos más populares: 28 me gusta promedio</li>
                      <li>• Duración promedio de estancia: 3.2 horas</li>
                      <li>• Engagement rate: 89%</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "guests" && (
                <div className="bg-white/10 rounded-2xl overflow-hidden">
                  {guestList.map((guest, index) => (
                    <div key={index} className="flex justify-between items-center p-4 border-b border-white/10 text-white">
                      <div>
                        <strong className="block">{guest.name}</strong>
                        <small className="text-white/70">{guest.email}</small>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        guest.status === "confirmed" ? "bg-emerald-500 text-white" :
                        guest.status === "checkedin" ? "bg-blue-500 text-white" :
                        "bg-yellow-500 text-white"
                      }`}>
                        {guest.status === "confirmed" ? "Confirmado" :
                         guest.status === "checkedin" ? "Check-in ✓" :
                         "Pendiente"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "media" && (
                <div>
                  <h3 className="text-white text-lg font-bold mb-4">🤖 Análisis IA de Contenido</h3>
                  <div className="bg-white/10 p-6 rounded-2xl text-white mb-6">
                    <p><strong>Resumen automático del evento:</strong></p>
                    <p className="mt-2">"Una celebración llena de alegría con momentos emotivos durante el brindis. Se identificaron 156 sonrisas únicas, 23 abrazos especiales y una atmósfera general muy positiva. Las fotos muestran una excelente iluminación y composición natural."</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-2xl overflow-hidden">
                      <div className="h-48 bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-2xl">
                        📸 Foto 1
                      </div>
                      <div className="p-4 text-white">
                        <small>Subida por: María G.</small><br/>
                        <small>❤️ 24 reacciones</small>
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-2xl overflow-hidden">
                      <div className="h-48 bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white text-2xl">
                        📸 Foto 2
                      </div>
                      <div className="p-4 text-white">
                        <small>Subida por: Carlos R.</small><br/>
                        <small>❤️ 31 reacciones</small>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Gallery Demo */}
        {activeSection === "gallery" && (
          <section className="py-8">
            <div className="bg-white/25 backdrop-blur-[20px] border border-white/18 rounded-2xl p-8">
              <h2 className="text-white text-2xl font-bold mb-6 text-center">📸 Galería del Evento</h2>
              
              <div className="text-center mb-6">
                <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_35px_rgba(0,0,0,0.2)] inline-flex items-center gap-2">
                  <span>📤</span> Subir Foto
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: "Ceremonia", color: "from-red-400 to-yellow-400", author: "Fotógrafo Oficial", likes: 47, comments: 12 },
                  { name: "Brindis", color: "from-blue-400 to-cyan-400", author: "María González", likes: 52, comments: 8 },
                  { name: "Baile", color: "from-pink-400 to-purple-400", author: "Carlos Rodríguez", likes: 38, comments: 15 },
                  { name: "Grupo", color: "from-indigo-400 to-blue-500", author: "Ana Martínez", likes: 63, comments: 22 },
                  { name: "Pastel", color: "from-green-400 to-teal-400", author: "Luis García", likes: 29, comments: 6 },
                  { name: "Despedida", color: "from-purple-400 to-pink-400", author: "Sofia López", likes: 41, comments: 18 }
                ].map((photo, index) => (
                  <div key={index} className="bg-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 cursor-pointer">
                    <div className={`h-48 bg-gradient-to-br ${photo.color} flex items-center justify-center text-white text-xl font-semibold`}>
                      📸 {photo.name}
                    </div>
                    <div className="p-4 text-white">
                      <small className="block">Por: {photo.author}</small>
                      <small className="text-white/70">❤️ {photo.likes} reacciones | 💬 {photo.comments} comentarios</small>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white/10 p-6 rounded-2xl mt-6 text-white">
                <h3 className="font-bold mb-2">🤖 Análisis IA de esta galería:</h3>
                <p>"Las fotos muestran una progresión natural del evento, desde momentos formales hasta celebración espontánea. La IA detecta emociones positivas en el 94% de las imágenes, con excelente calidad técnica y composición natural."</p>
              </div>
            </div>
          </section>
        )}

        {/* RSVP Demo */}
        {activeSection === "rsvp" && (
          <section className="py-8">
            <div className="bg-white/25 backdrop-blur-[20px] border border-white/18 rounded-2xl p-8">
              <h2 className="text-white text-2xl font-bold mb-6 text-center">📱 Sistema RSVP</h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white/10 p-6 rounded-2xl text-white">
                  <h3 className="text-lg font-bold mb-4">📨 Enviar Invitación</h3>
                  <form className="space-y-4">
                    <div>
                      <label className="block mb-2 font-medium">Nombre:</label>
                      <input 
                        type="text" 
                        className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/20" 
                        placeholder="Nombre del invitado" 
                      />
                    </div>
                    <div>
                      <label className="block mb-2 font-medium">Email:</label>
                      <input 
                        type="email" 
                        className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/20" 
                        placeholder="email@ejemplo.com" 
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold rounded-lg transition-all duration-300 hover:-translate-y-1"
                    >
                      Enviar Invitación
                    </button>
                  </form>
                </div>

                <div className="bg-white/10 p-6 rounded-2xl text-white">
                  <h3 className="text-lg font-bold mb-4">📊 Estadísticas RSVP</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Invitaciones enviadas:</span>
                      <span className="font-bold text-emerald-400">247</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Confirmados:</span>
                      <span className="font-bold text-emerald-400">189</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Pendientes:</span>
                      <span className="font-bold text-yellow-400">58</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Tasa de respuesta:</span>
                      <span className="font-bold text-emerald-400">76.5%</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-white/10 rounded-lg">
                    <h4 className="font-bold mb-2">💡 Código QR de ejemplo:</h4>
                    <div className="w-32 h-32 bg-white rounded-lg mx-auto flex items-center justify-center text-black font-bold">
                      QR CODE
                    </div>
                    <p className="text-center text-sm mt-2">Invitado: María González</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Scanner Demo */}
        {activeSection === "scanner" && (
          <section className="py-8">
            <div className="bg-white/25 backdrop-blur-[20px] border border-white/18 rounded-2xl p-8">
              <h2 className="text-white text-2xl font-bold mb-6 text-center">📲 Scanner QR</h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="w-80 h-80 mx-auto border-4 border-dashed border-white/50 rounded-2xl flex items-center justify-center text-white text-lg relative overflow-hidden">
                    <div className="absolute w-full h-1 bg-emerald-500 animate-pulse" style={{
                      animation: "scan 2s linear infinite"
                    }}></div>
                    📱 Área de Scanner
                    <br />
                    <small>Coloca el código QR aquí</small>
                  </div>
                  <button className="mt-6 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-lg transition-all duration-300 hover:-translate-y-1 inline-flex items-center gap-2">
                    <span>📸</span> Activar Cámara
                  </button>
                </div>

                <div className="bg-white/10 p-6 rounded-2xl text-white">
                  <h3 className="text-lg font-bold mb-4">✅ Últimos Check-ins</h3>
                  <div className="space-y-3">
                    {[
                      { name: "María González", time: "14:32", status: "success" },
                      { name: "Carlos Rodríguez", time: "14:28", status: "success" },
                      { name: "Ana Martínez", time: "14:25", status: "success" },
                      { name: "Luis García", time: "14:20", status: "warning" }
                    ].map((checkin, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
                        <div>
                          <span className="font-medium">{checkin.name}</span>
                          <small className="block text-white/70">{checkin.time}</small>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          checkin.status === "success" ? "bg-emerald-500" : "bg-yellow-500"
                        } text-white`}>
                          {checkin.status === "success" ? "✓ Confirmado" : "⚠ Verificar"}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-emerald-500/20 border border-emerald-500 rounded-lg">
                    <h4 className="font-bold text-emerald-400 mb-2">📊 Resumen del día:</h4>
                    <p className="text-sm">156 check-ins completados de 189 confirmados (82.5% de asistencia)</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="text-center py-16">
          <div className="bg-white/25 backdrop-blur-[20px] border border-white/18 rounded-2xl p-12 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6">
              ¿Impresionado con la demo?
            </h2>
            <p className="text-white/80 text-lg mb-8">
              Esto es solo una muestra de lo que Rocky.Mx puede hacer por tus eventos
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link 
                href="/login" 
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_35px_rgba(0,0,0,0.2)] relative overflow-hidden inline-flex items-center gap-2 no-underline"
              >
                <span>🚀</span> Comenzar Ahora
              </Link>
              <Link 
                href="/features" 
                className="px-8 py-4 bg-white/25 backdrop-blur-[20px] text-white border border-white/18 font-semibold rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_35px_rgba(0,0,0,0.2)] relative overflow-hidden inline-flex items-center gap-2 no-underline"
              >
                <span>📋</span> Ver Características
              </Link>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}