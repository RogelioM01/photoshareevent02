import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, UserCheck, Clock, Scan } from "lucide-react";
import { QRScanner } from "@/components/qr-scanner";
import { AttendeeStats } from "@/components/attendee-stats";
import { usePersonalEvent } from "@/hooks/usePersonalEvent";
import { useQuery } from "@tanstack/react-query";

// PHASE 3: Admin Check-in Page with QR Scanner
export default function AdminCheckinPage() {
  const { username } = useParams();
  const [, setLocation] = useLocation();
  const [scanHistory, setScanHistory] = useState<any[]>([]);

  // Get personal event data
  const { personalEvent, isLoading } = usePersonalEvent(username);

  // Get attendee list
  const { data: attendees = [] } = useQuery({
    queryKey: [`/api/events/${personalEvent?.id}/attendees`],
    enabled: !!personalEvent?.id,
  });

  // Type guard for attendees
  const attendeeList = Array.isArray(attendees) ? attendees : [];

  // Handle successful scan
  const handleScanSuccess = (attendeeData: any) => {
    setScanHistory(prev => [
      {
        ...attendeeData,
        scannedAt: new Date().toISOString()
      },
      ...prev.slice(0, 9) // Keep last 10 scans
    ]);
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
          <Button onClick={() => setLocation("/dashboard")}>
            Volver al dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile Optimized */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/dashboard")}
                className="flex items-center gap-1 px-2 sm:px-3"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Regresar</span>
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                  Check-in: {personalEvent.title}
                </h1>
              </div>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1 text-xs sm:text-sm px-2 py-1">
              <Scan className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Modo Scanner</span>
              <span className="sm:hidden">Scanner</span>
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 py-4 sm:px-4 sm:py-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column: QR Scanner */}
          <div className="space-y-6">
            <QRScanner 
              eventId={personalEvent.id}
              onScanSuccess={handleScanSuccess}
            />

            {/* Recent Scans */}
            {scanHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Últimos Check-ins
                  </CardTitle>
                  <CardDescription>
                    Historial de los últimos {scanHistory.length} check-ins realizados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {scanHistory.map((scan, index) => (
                      <div 
                        key={`${scan.id}-${scan.scannedAt}`}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                            <UserCheck className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {scan.guestName || scan.userId || 'Usuario'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(scan.scannedAt).toLocaleTimeString('es-ES')}
                            </p>
                          </div>
                        </div>
                        <Badge variant="default" className="bg-green-600">
                          Presente
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Statistics and Attendee List */}
          <div className="space-y-6">
            {/* Event Statistics */}
            <AttendeeStats eventId={personalEvent.id} eventTitle={personalEvent.title} />


          </div>
        </div>
      </div>
    </div>
  );
}