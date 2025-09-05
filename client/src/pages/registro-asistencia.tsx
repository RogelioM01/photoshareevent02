import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, User, Mail, Phone, CheckCircle, Loader2, Users, UserPlus, Calendar, QrCode, Camera, Download, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePersonalEvent } from "@/hooks/usePersonalEvent";
import { QRInline } from "@/components/qr-inline";
import confetti from 'canvas-confetti';

// PHASE 4 FINAL: Optimized Registration Form with Glassmorphism Hybrid Layout
const registroSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Ingresa un email válido"),
  whatsapp: z.string().min(10, "Ingresa un número de WhatsApp válido"),
  acompanantes: z.string().regex(/^\d+$/, "Debe ser un número válido").default("0"),
});

type RegistroFormData = z.infer<typeof registroSchema>;

interface RegistroState {
  paso: 'formulario' | 'confirmado';
  qrCode?: string;
  attendeeId?: string;
}

export default function RegistroAsistencia() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registroState, setRegistroState] = useState<RegistroState>({
    paso: 'formulario'
  });

  // Extract username from route parameter /evento/:username/registro
  const username = params.username || '';
  
  // Get personal event data for theming
  const { personalEvent, isLoading } = usePersonalEvent(username);

  // CRITICAL FUNCTION: Confetti celebration system
  // WARNING: Do not modify timing or particle counts without testing thoroughly
  // This function provides multi-burst confetti animation on successful registration
  const triggerConfetti = () => {
    // Project color palette - matches theme colors (purple, pink, green, yellow, red)
    const colors = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444'];
    
    // Main explosion from center (60% down from top)
    // particleCount: 100 provides good visual impact without performance issues
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors
    });

    // Left side explosion - delayed 250ms for dramatic effect
    // angle: 60 creates proper left-to-right trajectory
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: colors
      });
    }, 250);

    // Right side explosion - delayed 400ms for sequence completion
    // angle: 120 creates proper right-to-left trajectory
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: colors
      });
    }, 400);
    
    // DEBUGGING: If confetti doesn't trigger:
    // 1. Check canvas-confetti library is installed
    // 2. Verify triggerConfetti() is called after successful API response
    // 3. Check browser console for JavaScript errors
    // 4. Test with: console.log('Confetti triggered') at start of function
  };

  // CRITICAL FUNCTION: QR Download functionality
  // WARNING: Must use same QR parameters as QRInline component to maintain consistency
  // This function downloads the exact QR image displayed to user
  const downloadQR = async () => {
    if (!registroState.qrCode || !personalEvent) return;
    
    try {
      // IMPORTANT: Use identical QR parameters as QRInline component
      // size=200x200, margin=3, format=png for consistency
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(registroState.qrCode)}&format=png&margin=3`;
      
      // Fetch QR image as blob for download
      const response = await fetch(qrUrl);
      if (!response.ok) throw new Error('Failed to fetch QR image');
      const blob = await response.blob();
      
      // Create download link with sanitized filename
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `QR-${personalEvent.title.replace(/[^a-zA-Z0-9]/g, '_')}-${registroState.qrCode}.png`;
      
      // Trigger download and cleanup
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      toast({
        title: "QR descargado",
        description: "El código QR se ha guardado en tu dispositivo.",
      });
    } catch (error) {
      console.error('Error downloading QR:', error);
      toast({
        title: "Error",
        description: "No se pudo descargar el QR. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
    
    // DEBUGGING: If download fails:
    // 1. Check network connectivity to api.qrserver.com
    // 2. Verify registroState.qrCode exists and is valid
    // 3. Check browser download permissions
    // 4. Test with simplified filename (remove special characters)
  };

  // CRITICAL FUNCTION: QR Share functionality
  // Uses native Web Share API with clipboard fallback for cross-platform compatibility
  const shareQR = async () => {
    if (!registroState.qrCode || !personalEvent) return;
    
    // Prepare share content with event details
    const shareData = {
      title: `Mi asistencia a ${personalEvent.title}`,
      text: `¡Confirmé mi asistencia a ${personalEvent.title}! 🎉`,
      url: window.location.href
    };

    try {
      // Try native Web Share API first (mobile/progressive web app)
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard (desktop browsers)
        await navigator.clipboard.writeText(
          `¡Confirmé mi asistencia a ${personalEvent.title}! 🎉\n${window.location.href}`
        );
        toast({
          title: "Enlace copiado",
          description: "El enlace se ha copiado al portapapeles.",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Error",
        description: "No se pudo compartir. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
    
    // DEBUGGING: If sharing fails:
    // 1. Check if navigator.share is supported (mobile/PWA only)
    // 2. Verify clipboard permissions for fallback
    // 3. Test share data format compliance
    // 4. Check HTTPS requirement for both APIs
  };

  const form = useForm<RegistroFormData>({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      nombre: "",
      email: "",
      whatsapp: "",
      acompanantes: "0",
    },
  });

  // PHASE 1: Form submission handler
  const onSubmit = async (data: RegistroFormData) => {
    if (!personalEvent) return;
    
    setIsSubmitting(true);
    try {
      // TODO PHASE 2: Implement actual API call to register attendance
      const response = await fetch(`/api/events/${personalEvent.id}/confirm-attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: data.email, // Use email as unique identifier for guests
          userName: data.nombre,
          userEmail: data.email,
          userWhatsapp: data.whatsapp,
          companionsCount: data.acompanantes,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al registrar asistencia');
      }

      const result = await response.json();
      
      // Update state to show confirmation
      setRegistroState({
        paso: 'confirmado',
        qrCode: result.qrCode,
        attendeeId: result.attendeeId,
      });

      // PHASE 3: Trigger confetti celebration on successful registration
      triggerConfetti();

      toast({
        title: "¡Asistencia confirmada!",
        description: `Gracias ${data.nombre}, tu registro ha sido exitoso.`,
      });

    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Error",
        description: "No se pudo registrar la asistencia. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Cargando evento...</p>
        </div>
      </div>
    );
  }

  // Event not found
  if (!personalEvent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Evento no encontrado</h1>
          <p className="text-gray-600 mb-6">No se pudo encontrar el evento solicitado.</p>
          <Button onClick={() => setLocation("/")}>
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  // Get background styling from personal event
  const getBackgroundStyle = () => {
    if (personalEvent.backgroundType === 'image' && personalEvent.backgroundValue) {
      return {
        backgroundImage: `url(${personalEvent.backgroundValue})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    // Default gradient fallback
    return {};
  };

  const getBackgroundClass = () => {
    if (personalEvent.backgroundType === 'gradient' && personalEvent.backgroundValue) {
      return `bg-gradient-to-br ${personalEvent.backgroundValue}`;
    }
    return 'bg-gradient-to-br from-blue-500 to-purple-600';
  };

  return (
    <div className={`min-h-screen ${getBackgroundClass()}`} style={getBackgroundStyle()}>
      {/* Enhanced Background overlay for better glassmorphism effect */}
      {personalEvent.backgroundType === 'image' && (
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-purple-900/30 to-black/50"></div>
      )}
      {/* Additional glass texture overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-[1px]"></div>
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Enhanced Header with improved accessibility */}
        <div className="p-4">
          <Button
            variant="ghost"
            onClick={() => setLocation(`/evento/${username}`)}
            className="text-white hover:bg-white/20 backdrop-blur-sm border border-white/10 transition-all duration-300"
            aria-label={`Volver al evento ${personalEvent.title}`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al evento
          </Button>
        </div>

        {/* Main Content - Hybrid Responsive Layout */}
        <div className="flex-1 flex items-center justify-center p-4">
          {/* Mobile: Stack Layout */}
          <div className="block lg:hidden w-full max-w-md">
            {/* Mobile Event Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full border-4 border-white shadow-lg overflow-hidden backdrop-blur-sm bg-white/10">
                <img 
                  src={personalEvent.coverImageUrl || "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"}
                  alt={`Avatar del evento ${personalEvent.title}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {personalEvent.title}
              </h1>
              <p className="text-white/90">
                Confirma tu asistencia al evento
              </p>
            </div>

            {/* Mobile Form */}
            {registroState.paso === 'formulario' ? (
              <Card className="backdrop-blur-sm bg-white/95 border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Registro de Asistencia
                  </CardTitle>
                  <CardDescription>
                    Completa tus datos para generar tu código QR de acceso
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="nombre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre completo</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input 
                                  placeholder="Tu nombre completo"
                                  className="pl-10"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Correo electrónico</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input 
                                  type="email"
                                  placeholder="tu@email.com"
                                  className="pl-10"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="whatsapp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>WhatsApp</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-green-600" />
                                <Input 
                                  placeholder="5551234567"
                                  className="pl-10 border-green-300 focus:border-green-500 focus:ring-green-500"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="acompanantes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número de acompañantes</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input 
                                  type="number"
                                  min="0"
                                  max={personalEvent?.maxCompanions || "2"}
                                  placeholder="0"
                                  className="pl-10"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                            <p className="text-sm text-gray-600">
                              Máximo {personalEvent?.maxCompanions || "2"} acompañantes permitidos
                            </p>
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Registrando...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Confirmar Asistencia
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            ) : (
              /* Confirmation Screen with QR */
              <Card className="backdrop-blur-sm bg-white/95 border-0 shadow-xl">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-green-700">
                    ¡Asistencia Confirmada!
                  </CardTitle>
                  <CardDescription>
                    Tu registro ha sido exitoso. Guarda este código QR para el check-in.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  {registroState.qrCode && (
                    <div className="bg-white p-4 rounded-lg border">
                      <QRInline 
                        value={registroState.qrCode}
                        size={200}
                        className="mx-auto qr-code-canvas"
                      />
                      <p className="text-sm text-gray-600 mt-2 mb-4">
                        Presenta este código al llegar al evento
                      </p>
                      
                      {/* QR Action Buttons - Mobile */}
                      <div className="flex gap-2 justify-center">
                        <Button
                          onClick={downloadQR}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border-gray-200"
                        >
                          <Download className="h-4 w-4" />
                          Descargar QR
                        </Button>
                        <Button
                          onClick={shareQR}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                        >
                          <Share2 className="h-4 w-4" />
                          Compartir
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Button 
                      onClick={() => setLocation(`/evento/${username}`)}
                      className="w-full"
                      variant="outline"
                    >
                      Ver galería del evento
                    </Button>
                    <Button 
                      onClick={() => setRegistroState({ paso: 'formulario' })}
                      className="w-full"
                      variant="ghost"
                    >
                      Registrar otra persona
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Desktop: Grid Layout */}
          <div className="hidden lg:grid lg:grid-cols-12 w-full max-w-6xl gap-2 items-end min-h-[600px]">
            {/* Left Side: Form Container */}
            <div className="col-span-5">
              {/* Desktop Event Header */}
              <div className="text-left mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                      {personalEvent.title}
                    </h1>
                    <p className="text-white/90 text-lg">
                      Confirma tu asistencia al evento
                    </p>
                  </div>
                  <div className="w-20 h-20 rounded-full border-2 border-white shadow-lg overflow-hidden backdrop-blur-sm bg-white/10 flex-shrink-0">
                    <img 
                      src={personalEvent.coverImageUrl || "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"}
                      alt={`Avatar del evento ${personalEvent.title}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>

              {/* Desktop Form with Glassmorphism */}
              {registroState.paso === 'formulario' ? (
                <Card className="backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl ring-1 ring-white/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <User className="h-5 w-5 text-white" />
                      Registro de Asistencia
                    </CardTitle>
                    <CardDescription className="text-white/80">
                      Completa tus datos para generar tu código QR de acceso
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="nombre"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white/90">Nombre completo</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                                  <Input 
                                    placeholder="Tu nombre completo"
                                    className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30"
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage className="text-red-300" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white/90">Correo electrónico</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                                  <Input 
                                    type="email"
                                    placeholder="tu@email.com"
                                    className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30"
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage className="text-red-300" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="whatsapp"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white/90">WhatsApp</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-3 h-4 w-4 text-green-300" />
                                  <Input 
                                    placeholder="5551234567"
                                    className="pl-10 bg-green-400/20 border-green-300/40 text-white placeholder:text-green-100/70 focus:bg-green-400/30 focus:border-green-300/60"
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage className="text-red-300" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="acompanantes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white/90">Número de acompañantes</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Users className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                                  <Input 
                                    type="number"
                                    min="0"
                                    max={personalEvent?.maxCompanions || "2"}
                                    placeholder="0"
                                    className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30"
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage className="text-red-300" />
                              <p className="text-sm text-white/60">
                                Máximo {personalEvent?.maxCompanions || "2"} acompañantes permitidos
                              </p>
                            </FormItem>
                          )}
                        />

                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-green-500/80 to-green-600/80 hover:from-green-500 hover:to-green-600 text-white border border-green-400/30 backdrop-blur-lg shadow-xl hover:shadow-green-500/25 transform hover:scale-105 transition-all duration-300"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Registrando...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Confirmar Asistencia
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              ) : (
                /* Desktop Confirmation Screen with Glassmorphism */
                <Card className="backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl ring-1 ring-white/30">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-green-400/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-green-300/30">
                      <CheckCircle className="h-8 w-8 text-green-300" />
                    </div>
                    <CardTitle className="text-white">
                      ¡Asistencia Confirmada!
                    </CardTitle>
                    <CardDescription className="text-white/80">
                      Tu registro ha sido exitoso. Guarda este código QR para el check-in.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center space-y-6">
                    {registroState.qrCode && (
                      <div className="bg-white p-4 rounded-lg border">
                        <QRInline 
                          value={registroState.qrCode}
                          size={180}
                          className="mx-auto qr-code-canvas"
                        />
                        <p className="text-sm text-gray-600 mt-2 mb-4">
                          Presenta este código al llegar al evento
                        </p>
                        
                        {/* QR Action Buttons */}
                        <div className="flex gap-2 justify-center">
                          <Button
                            onClick={downloadQR}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border-gray-200"
                          >
                            <Download className="h-4 w-4" />
                            Descargar QR
                          </Button>
                          <Button
                            onClick={shareQR}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                          >
                            <Share2 className="h-4 w-4" />
                            Compartir
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Button 
                        onClick={() => setLocation(`/evento/${username}`)}
                        className="w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
                      >
                        Ver galería del evento
                      </Button>
                      <Button 
                        onClick={() => setRegistroState({ paso: 'formulario' })}
                        className="w-full bg-transparent border border-white/20 text-white/80 hover:bg-white/10"
                      >
                        Registrar otra persona
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Center: Floating Adaptive Icons */}
            <div className="col-span-2 flex flex-col items-center justify-center space-y-6">
              {/* Main Icon - Changes based on step */}
              <div className="relative">
                <div className={`w-20 h-20 rounded-full backdrop-blur-lg border flex items-center justify-center shadow-2xl ring-2 transition-all duration-700 ${
                  registroState.paso === 'formulario'
                    ? 'bg-white/10 border-white/20 ring-white/10'
                    : 'bg-green-400/20 border-green-300/30 ring-green-300/20 scale-110'
                }`}>
                  {registroState.paso === 'formulario' ? (
                    <UserPlus className="h-10 w-10 text-white transition-all duration-500" />
                  ) : (
                    <CheckCircle className="h-10 w-10 text-green-300 animate-pulse" />
                  )}
                </div>
                {/* Dynamic glow effect */}
                <div className={`absolute inset-0 rounded-full blur-xl animate-pulse transition-colors duration-700 ${
                  registroState.paso === 'formulario' ? 'bg-white/5' : 'bg-green-400/10'
                }`}></div>
                {/* Success celebration ring */}
                {registroState.paso === 'confirmado' && (
                  <div className="absolute inset-0 rounded-full border-2 border-green-300/50 animate-ping"></div>
                )}
              </div>

              {/* Connecting Line */}
              <div className="w-1 bg-gradient-to-b from-white/30 via-white/10 to-white/30 h-32 rounded-full"></div>

              {/* Secondary Icons with Enhanced Animations */}
              <div className="flex flex-col space-y-6">
                {/* Event Icon */}
                <div className="w-14 h-14 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-xl hover:bg-white/10 transition-all duration-300 hover:scale-110">
                  <Calendar className="h-6 w-6 text-white/70 hover:text-white transition-colors duration-300" />
                </div>
                
                {/* QR Icon - Highlighted when in confirmation step */}
                <div className={`w-14 h-14 rounded-full backdrop-blur-md border flex items-center justify-center shadow-xl transition-all duration-500 hover:scale-110 ${
                  registroState.paso === 'confirmado' 
                    ? 'bg-green-400/20 border-green-300/30 ring-2 ring-green-300/20' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}>
                  <QrCode className={`h-6 w-6 transition-colors duration-300 ${
                    registroState.paso === 'confirmado' ? 'text-green-300' : 'text-white/70 hover:text-white'
                  }`} />
                </div>
                
                {/* Camera Icon */}
                <div className="w-14 h-14 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-xl hover:bg-white/10 transition-all duration-300 hover:scale-110">
                  <Camera className="h-6 w-6 text-white/70 hover:text-white transition-colors duration-300" />
                </div>
              </div>
            </div>

            {/* Right Side: Optimized Enhanced Image Container */}
            <div className="col-span-5 pl-4">
              <div className="w-full h-[480px] rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/20 relative group">
                <img 
                  src={personalEvent.coverImageUrl || "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"}
                  alt={`Imagen del evento ${personalEvent.title}`}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                {/* Enhanced overlay gradient for better visual depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent"></div>
                {/* Glassmorphism overlay on hover */}
                <div className="absolute inset-0 bg-white/5 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {/* Event title overlay with enhanced styling */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white text-xl font-bold drop-shadow-lg mb-1">
                    {personalEvent.title}
                  </h3>
                  <p className="text-white/90 text-sm drop-shadow-md">
                    ¡Te esperamos en nuestro evento!
                  </p>
                  {/* Subtle decoration line */}
                  <div className="w-16 h-1 bg-white/30 rounded-full mt-2"></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}