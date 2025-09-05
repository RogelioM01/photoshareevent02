import { Link } from "wouter";

export default function Features() {
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
            <li><Link href="/features" className="text-white no-underline font-medium transition-all duration-300 px-4 py-2 rounded-lg hover:bg-white/20 hover:-translate-y-0.5 bg-white/20">Características</Link></li>
            <li><Link href="/demo" className="text-white no-underline font-medium transition-all duration-300 px-4 py-2 rounded-lg hover:bg-white/20 hover:-translate-y-0.5">Demo</Link></li>
            <li><Link href="/login" className="text-white no-underline font-medium transition-all duration-300 px-4 py-2 rounded-lg hover:bg-white/20 hover:-translate-y-0.5">Iniciar Sesión</Link></li>
          </ul>
        </nav>
      </header>

      <div className="max-w-6xl mx-auto px-4">
        {/* Hero Section */}
        <section className="text-center py-16 text-white">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-shadow-[0_4px_8px_rgba(0,0,0,0.3)] bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
            Características Completas
          </h1>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Descubre todas las funcionalidades que hacen de Rocky.Mx la plataforma líder en gestión de eventos digitales
          </p>
        </section>

        {/* Main Features Grid */}
        <section className="py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {[
              {
                icon: "🎊",
                title: "Eventos Personalizados",
                subtitle: "Personalización Total",
                features: [
                  "Páginas de evento únicas para cada usuario",
                  "Branding personalizado con colores y logotipos",
                  "URLs amigables y memorables",
                  "Temas visuales adaptables",
                  "Configuración de privacidad avanzada"
                ]
              },
              {
                icon: "📸",
                title: "Galería Multimedia Avanzada",
                subtitle: "Gestión Profesional de Contenido",
                features: [
                  "Subida masiva de fotos y videos",
                  "Thumbnails automáticos optimizados",
                  "Compresión inteligente sin pérdida de calidad",
                  "Categorización automática por fecha/ubicación",
                  "Búsqueda avanzada con etiquetas"
                ]
              },
              {
                icon: "📱",
                title: "Sistema RSVP Inteligente",
                subtitle: "Gestión Completa de Invitados",
                features: [
                  "Códigos QR únicos por invitado",
                  "Confirmación automática por email",
                  "Recordatorios programados",
                  "Gestión de acompañantes",
                  "Estados de asistencia en tiempo real"
                ]
              },
              {
                icon: "📲",
                title: "Scanner QR Profesional",
                subtitle: "Check-in Ultrarrápido",
                features: [
                  "Scanner de cámara en tiempo real",
                  "Validación instantánea de códigos",
                  "Registro de hora de llegada",
                  "Modo offline para eventos sin internet",
                  "Estadísticas de asistencia inmediatas"
                ]
              },
              {
                icon: "🤖",
                title: "Inteligencia Artificial Integrada",
                subtitle: "Análisis Automático Avanzado",
                features: [
                  "Análisis automático de emociones en fotos",
                  "Generación de resúmenes del evento",
                  "Detección de momentos destacados",
                  "Clasificación automática de contenido",
                  "Sugerencias de mejora basadas en IA"
                ]
              },
              {
                icon: "📊",
                title: "Analytics y Reportes",
                subtitle: "Métricas Detalladas",
                features: [
                  "Dashboard en tiempo real",
                  "Métricas de engagement detalladas",
                  "Reportes exportables en PDF/Excel",
                  "Análisis de comportamiento de usuarios",
                  "Predicciones de asistencia con IA"
                ]
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-white/25 backdrop-blur-[20px] border border-white/18 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-indigo-600 before:to-emerald-500"
              >
                <div className="flex items-start gap-4 mb-6">
                  <span className="text-4xl">{feature.icon}</span>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-white/80 font-medium">{feature.subtitle}</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {feature.features.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-3 text-white/90">
                      <span className="text-emerald-400 mt-1">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Technical Specifications */}
        <section className="py-16">
          <h2 className="text-4xl font-bold text-center text-white mb-12 text-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
            Especificaciones Técnicas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/25 backdrop-blur-[20px] border border-white/18 rounded-2xl p-8 text-center">
              <span className="text-4xl mb-4 block">🚀</span>
              <h3 className="text-xl font-bold text-white mb-4">Rendimiento</h3>
              <ul className="text-white/80 space-y-2 text-left">
                <li>• Carga en menos de 2 segundos</li>
                <li>• Optimización automática de imágenes</li>
                <li>• CDN global para máxima velocidad</li>
                <li>• Progressive Web App (PWA)</li>
              </ul>
            </div>
            <div className="bg-white/25 backdrop-blur-[20px] border border-white/18 rounded-2xl p-8 text-center">
              <span className="text-4xl mb-4 block">🔒</span>
              <h3 className="text-xl font-bold text-white mb-4">Seguridad</h3>
              <ul className="text-white/80 space-y-2 text-left">
                <li>• Cifrado SSL/TLS completo</li>
                <li>• Autenticación de dos factores</li>
                <li>• Respaldos automáticos diarios</li>
                <li>• Cumplimiento GDPR</li>
              </ul>
            </div>
            <div className="bg-white/25 backdrop-blur-[20px] border border-white/18 rounded-2xl p-8 text-center">
              <span className="text-4xl mb-4 block">📱</span>
              <h3 className="text-xl font-bold text-white mb-4">Compatibilidad</h3>
              <ul className="text-white/80 space-y-2 text-left">
                <li>• Responsive en todos los dispositivos</li>
                <li>• Compatible con iOS y Android</li>
                <li>• Funciona offline</li>
                <li>• Navegadores modernos</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Integration Section */}
        <section className="py-16">
          <h2 className="text-4xl font-bold text-center text-white mb-12 text-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
            Integraciones Disponibles
          </h2>
          <div className="bg-white/25 backdrop-blur-[20px] border border-white/18 rounded-2xl p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { name: "Google Drive", icon: "💾" },
                { name: "WhatsApp", icon: "💬" },
                { name: "Email Marketing", icon: "📧" },
                { name: "Social Media", icon: "📱" },
                { name: "Calendar Apps", icon: "📅" },
                { name: "Payment Systems", icon: "💳" },
                { name: "CRM Systems", icon: "👥" },
                { name: "Analytics Tools", icon: "📈" }
              ].map((integration, index) => (
                <div key={index} className="text-white">
                  <span className="text-3xl mb-2 block">{integration.icon}</span>
                  <p className="font-medium">{integration.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center py-16">
          <div className="bg-white/25 backdrop-blur-[20px] border border-white/18 rounded-2xl p-12 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6">
              ¿Listo para experimentar todas estas características?
            </h2>
            <p className="text-white/80 text-lg mb-8">
              Prueba Rocky.Mx y descubre por qué es la elección preferida de organizadores profesionales
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link 
                href="/demo" 
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_35px_rgba(0,0,0,0.2)] relative overflow-hidden inline-flex items-center gap-2 no-underline"
              >
                <span>🎯</span> Explorar Demo
              </Link>
              <Link 
                href="/login" 
                className="px-8 py-4 bg-white/25 backdrop-blur-[20px] text-white border border-white/18 font-semibold rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_35px_rgba(0,0,0,0.2)] relative overflow-hidden inline-flex items-center gap-2 no-underline"
              >
                <span>🚀</span> Comenzar Ahora
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}