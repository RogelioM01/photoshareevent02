import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] overflow-x-hidden">
      {/* Glassmorphism Header */}
      <header className="bg-white/25 backdrop-blur-[20px] border border-white/18 rounded-[20px] m-4 p-4 md:p-8 sticky top-4 z-[100] shadow-[0_8px_32px_rgba(31,38,135,0.37)]">
        <nav className="flex justify-between items-center flex-wrap gap-4 max-w-6xl mx-auto">
          <div className="text-2xl md:text-3xl font-bold text-white text-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
            🎉 Rocky.Mx
          </div>
          <ul className="flex gap-8 list-none flex-wrap">
            <li><Link href="/" className="text-white no-underline font-medium transition-all duration-300 px-4 py-2 rounded-lg hover:bg-white/20 hover:-translate-y-0.5">Inicio</Link></li>
            <li><Link href="/features" className="text-white no-underline font-medium transition-all duration-300 px-4 py-2 rounded-lg hover:bg-white/20 hover:-translate-y-0.5">Características</Link></li>
            <li><Link href="/demo" className="text-white no-underline font-medium transition-all duration-300 px-4 py-2 rounded-lg hover:bg-white/20 hover:-translate-y-0.5">Demo</Link></li>
            <li><Link href="/login" className="text-white no-underline font-medium transition-all duration-300 px-4 py-2 rounded-lg hover:bg-white/20 hover:-translate-y-0.5">Iniciar Sesión</Link></li>
          </ul>
        </nav>
      </header>

      <div className="max-w-6xl mx-auto px-4">
        {/* Hero Section */}
        <section className="text-center py-16 text-white">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4 text-shadow-[0_4px_8px_rgba(0,0,0,0.3)] bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
            Álbum Digital para Eventos
          </h1>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Crea, gestiona y comparte los momentos especiales de tus eventos con códigos QR únicos y análisis inteligente con IA
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link 
              href="/demo" 
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_35px_rgba(0,0,0,0.2)] relative overflow-hidden inline-flex items-center gap-2 no-underline"
            >
              <span>📊</span> Ver Demo
            </Link>
            <Link 
              href="/login" 
              className="px-8 py-4 bg-white/25 backdrop-blur-[20px] text-white border border-white/18 font-semibold rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_35px_rgba(0,0,0,0.2)] relative overflow-hidden inline-flex items-center gap-2 no-underline"
            >
              <span>🔐</span> Iniciar Sesión
            </Link>
          </div>
        </section>

        {/* Features Preview */}
        <section className="py-16">
          <h2 className="text-center text-4xl font-bold mb-12 text-white text-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
            Características Principales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: "🎊",
                title: "Eventos Personalizados",
                description: "Cada usuario tiene su página de evento con personalización completa y branding único"
              },
              {
                icon: "📸",
                title: "Galería Multimedia",
                description: "Subida de fotos y videos con thumbnails automáticos y optimización inteligente"
              },
              {
                icon: "📱",
                title: "Sistema RSVP",
                description: "Registro de invitados con códigos QR únicos para check-in automático"
              },
              {
                icon: "📲",
                title: "Scanner QR",
                description: "Scanner de cámara real para check-in rápido de asistentes al evento"
              },
              {
                icon: "🤖",
                title: "IA Integrada",
                description: "Análisis inteligente de fotos y generación automática de contenido con Gemini AI"
              },
              {
                icon: "📊",
                title: "Analytics Avanzados",
                description: "Panel de administración con estadísticas en tiempo real y métricas detalladas"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-white/25 backdrop-blur-[20px] border border-white/18 rounded-2xl p-8 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-indigo-600 before:to-emerald-500"
              >
                <span className="text-5xl mb-4 block">{feature.icon}</span>
                <h3 className="text-xl font-semibold mb-4 text-white">{feature.title}</h3>
                <p className="text-white/80 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center py-16">
          <div className="bg-white/25 backdrop-blur-[20px] border border-white/18 rounded-2xl p-12 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6">
              ¿Listo para crear tu evento?
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
              Únete a miles de organizadores que ya confían en Rocky.Mx para gestionar sus eventos más importantes
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link 
                href="/demo" 
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_35px_rgba(0,0,0,0.2)] relative overflow-hidden inline-flex items-center gap-2 no-underline"
              >
                <span>🎯</span> Explorar Demo
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
    </div>
  );
}