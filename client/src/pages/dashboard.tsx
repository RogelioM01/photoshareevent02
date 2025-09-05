import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAuthUser } from "@/lib/auth";
import { Settings, User, Calendar, Download, Loader2, Eye } from "lucide-react";
import QRModal from "@/components/qr-modal";
import { usePersonalEvent } from "@/hooks/usePersonalEvent";
import { AttendeeStats } from "@/components/attendee-stats";
import { QRScanner } from "@/components/qr-scanner";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const [showAttendeeManagement, setShowAttendeeManagement] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  
  /* 
    REACT QUERY MIGRATION NOTES - Dashboard.tsx
    ==========================================
    
    BEFORE (Manual State Management):
    - Multiple useState hooks: personalEvent, loading, saving, uploadingCover, etc.
    - useEffect for initial data fetching with manual error handling
    - Manual loading states and error boundaries
    - Duplicate API calls and state synchronization issues
    
    AFTER (React Query):
    - Single usePersonalEvent hook provides all data and mutations
    - Automatic loading/error states with built-in retry logic  
    - Cache-first approach with background updates
    - Declarative mutations with optimistic updates
    
    DEBUGGING TIPS:
    - personalEvent: Direct from React Query cache (display data)
    - formData: Local state for modal forms only (temporary editing)
    - Check React Query DevTools for cache inspection
    - isLoading, isUpdating, etc: Automatic loading states from mutations
  */


  const currentUser = getAuthUser();

  // REACT QUERY DATA INTEGRATION - Centralized Event Management
  // =========================================================
  // ARCHITECTURE: Single hook replaces multiple useEffect + useState patterns
  // DATA FLOW: personalEvent (display) ← cache → formData (editing) → mutations → cache
  // PERFORMANCE: Background refetching, intelligent caching, automatic deduplication
  const {
    personalEvent,      // DISPLAY DATA: Direct from React Query cache, updates automatically
    isLoading,          // LOADING STATE: Initial data fetch status
    updateEvent,        // MUTATION: Update event details with optimistic updates
    uploadCover,        // MUTATION: Upload cover image with progress tracking
    downloadZip,        // MUTATION: Generate and download ZIP file
    isUpdating,         // MUTATION STATE: Event update in progress
    isUploadingCover,   // MUTATION STATE: Cover upload in progress  
    isDownloadingZip,   // MUTATION STATE: ZIP generation in progress
    coverUploadResult   // MUTATION RESULT: Cover upload response data
  } = usePersonalEvent(currentUser?.username);

  // Redirect if not authenticated
  if (!currentUser) {
    setLocation("/");
    return null;
  }

  const getGradientClass = (backgroundValue: string) => {
    if (!backgroundValue || backgroundValue === "none") return "";
    
    const gradientClasses = {
      "from-pink-500 to-pink-600": "bg-gradient-to-br from-pink-500 to-pink-600",
      "from-blue-500 to-cyan-400": "bg-gradient-to-br from-blue-500 to-cyan-400", 
      "from-purple-500 to-pink-500": "bg-gradient-to-br from-purple-500 to-pink-500",
      "from-green-400 to-blue-500": "bg-gradient-to-br from-green-400 to-blue-500",
      "from-yellow-400 to-orange-500": "bg-gradient-to-br from-yellow-400 to-orange-500",
      "from-gray-400 to-gray-600": "bg-gradient-to-br from-gray-400 to-gray-600",
      "from-indigo-500 to-purple-600": "bg-gradient-to-br from-indigo-500 to-purple-600",
      "from-red-500 to-pink-500": "bg-gradient-to-br from-red-500 to-pink-500",
      "from-teal-400 to-blue-500": "bg-gradient-to-br from-teal-400 to-blue-500",
      "from-white to-gray-300": "bg-gradient-to-br from-white to-gray-300",
      "from-blue-200 to-white": "bg-gradient-to-br from-blue-200 to-white"
    };
    
    return gradientClasses[backgroundValue as keyof typeof gradientClasses] || backgroundValue;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando tu panel de control...</span>
        </div>
      </div>
    );
  }

  if (!personalEvent) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p>No se pudo cargar tu evento personal</p>
        </div>
      </div>
    );
  }

  const getUserInitials = (user: any) => {
    const username = user?.username || "";
    return username.slice(0, 2).toUpperCase();
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">


      {/* Main Header Card */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-lg p-6 mb-6 text-white">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12 border-2 border-white/20">
            <AvatarFallback className="bg-white/20 text-white font-semibold">
              {getUserInitials(currentUser)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold">Panel de Control</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Event Card */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              <CardTitle>Tu Evento Personal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-4">
                <Avatar className="h-16 w-16 border-2 border-gray-200">
                  <AvatarImage src={personalEvent.coverImageUrl} alt={personalEvent.title} />
                  <AvatarFallback className="bg-orange-500 text-white text-lg font-bold">
                    🎉
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {personalEvent.title || "Fiesta de cumpleaños"}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {personalEvent.description || "Comparte tus imágenes y videos"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <Button
                  onClick={() => setLocation(`/evento/${currentUser.username}`)}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Ver Tu Evento
                </Button>
                <Button
                  onClick={() => setLocation(`/evento/${currentUser.username}-album`)}
                  variant="destructive"
                  className="bg-red-500 hover:bg-red-600"
                >
                  Administrar fotos
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={() => setLocation(`/evento/${currentUser.username}/configuracion`)}
                className="w-full justify-start mt-3 border-purple-300 text-purple-600 hover:bg-purple-50"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configuración Avanzada
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions & Attendance */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                onClick={() => setLocation(`/evento/${currentUser.username}`)}
                className="w-full justify-start border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Página del Evento
              </Button>

              <Button
                variant="outline"
                onClick={() => downloadZip()}
                disabled={isDownloadingZip}
                className="w-full justify-start border-green-300 text-green-600 hover:bg-green-50"
              >
                {isDownloadingZip ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Descargar Todo (ZIP)
              </Button>

              <Button
                variant="outline"
                onClick={() => setLocation(`/evento/${currentUser.username}/checkin`)}
                className="w-full justify-start border-orange-300 text-orange-600 hover:bg-orange-50"
              >
                <User className="h-4 w-4 mr-2" />
                Gestionar Asistencia
              </Button>

              <Button
                variant="outline"
                onClick={() => setLocation(`/evento/${currentUser.username}/registro`)}
                className="w-full justify-start border-purple-300 text-purple-600 hover:bg-purple-50"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Página de Registro
              </Button>

              {/* QR Code Section */}
              <div className="border-t pt-3 mt-3">
                <QRModal 
                  eventUrl={`${window.location.origin}/evento/${currentUser.username}`}
                  eventTitle={personalEvent?.title || "Mi Evento"}
                  buttonVariant="outline"
                  buttonText="QR de mi evento"
                  buttonIcon={true}
                />
              </div>
            </CardContent>
          </Card>

          {/* Attendee Management Section */}
          {showAttendeeManagement && personalEvent?.id && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Control de Asistencia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AttendeeStats 
                  eventId={personalEvent.id}
                  eventTitle={personalEvent.title}
                  onShowCheckIn={() => setShowQRScanner(true)}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>





      {/* QR Scanner Modal */}
      {showQRScanner && personalEvent?.id && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Scanner QR - Check-in</h3>
              <Button
                variant="outline"
                onClick={() => setShowQRScanner(false)}
                className="ml-4"
              >
                Cerrar
              </Button>
            </div>
            <div className="p-4">
              <QRScanner 
                eventId={personalEvent.id}
                eventTitle={personalEvent.title}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}