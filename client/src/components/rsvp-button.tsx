import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle, Clock, Users, QrCode, User } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useAttendeeStatus, useConfirmAttendance, getAttendanceStatusText, getAttendanceStatusColor } from "@/hooks/useRSVP";
import { useToast } from "@/hooks/use-toast";
import { QRInline } from "./qr-inline";

// PHASE 4: RSVP Button Component for Event Attendance

interface RSVPButtonProps {
  eventId: string;
  eventTitle: string;
  isOwner?: boolean;
}

export function RSVPButton({ eventId, eventTitle, isOwner = false }: RSVPButtonProps) {
  const { authUser } = useAuth();
  const { toast } = useToast();
  const [showQR, setShowQR] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  
  // Use authUser ID if authenticated, otherwise use guest name
  const userId = authUser?.id || guestName;
  const { data: attendeeStatus, isLoading } = useAttendeeStatus(eventId, userId);
  const confirmMutation = useConfirmAttendance(eventId);

  // Don't show RSVP for event owners - they're automatically present
  if (isOwner) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-green-700">
            <Users className="h-4 w-4" />
            <span className="font-medium">Organizador del evento</span>
          </div>
          <p className="text-sm text-green-600 mt-1">
            Tienes acceso completo a la gestión del evento
          </p>
        </CardContent>
      </Card>
    );
  }

  // Handle guest name confirmation  
  const handleGuestConfirmation = async () => {
    if (!guestName.trim()) {
      toast({
        title: "Nombre requerido",
        description: "Por favor ingresa tu nombre para confirmar asistencia",
        variant: "destructive",
      });
      return;
    }

    setIsConfirming(true);
    try {
      await confirmMutation.mutateAsync({
        userId: guestName.trim()
      });
      
      toast({
        title: "¡Asistencia confirmada!",
        description: `Gracias ${guestName}, tu asistencia ha sido registrada.`,
      });
      
      setShowNameInput(false);
      setShowQR(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo confirmar la asistencia. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  // Show name input for guests (non-authenticated users)
  if (!authUser && !attendeeStatus) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Users className="h-5 w-5" />
            Confirma tu Asistencia
          </CardTitle>
          <CardDescription>
            Únete a "{eventTitle}" ingresando tu nombre
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showNameInput ? (
            <Button 
              onClick={() => setShowNameInput(true)}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              <User className="h-4 w-4 mr-2" />
              Confirmar Asistencia
            </Button>
          ) : (
            <div className="space-y-3">
              <Input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Ingresa tu nombre"
                onKeyPress={(e) => e.key === 'Enter' && handleGuestConfirmation()}
                autoFocus
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleGuestConfirmation}
                  disabled={isConfirming || !guestName.trim()}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                  {isConfirming ? "Confirmando..." : "Confirmar"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowNameInput(false);
                    setGuestName("");
                  }}
                  disabled={isConfirming}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const handleConfirmAttendance = async () => {
    if (!authUser) return;
    
    try {
      await confirmMutation.mutateAsync({ userId: authUser.id });
      toast({
        title: "¡Asistencia confirmada!",
        description: "Tu código QR está listo para el evento",
      });
      setShowQR(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo confirmar la asistencia. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 animate-spin" />
            <span>Verificando estado de asistencia...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // User hasn't confirmed yet
  if (!attendeeStatus) {
    return (
      <Card className="border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Confirmar Asistencia</CardTitle>
          <CardDescription>
            ¿Vas a asistir a "{eventTitle}"?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleConfirmAttendance}
            disabled={confirmMutation.isPending}
            className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700"
          >
            {confirmMutation.isPending ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Confirmando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Sí, voy a asistir
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // User has confirmed - show status and QR
  const statusText = getAttendanceStatusText((attendeeStatus as any)?.status || 'pending');
  const statusColor = getAttendanceStatusColor((attendeeStatus as any)?.status || 'pending');

  return (
    <Card className={`border-green-200 ${(attendeeStatus as any)?.status === 'confirmed' ? 'bg-green-50' : 'bg-blue-50'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Estado de Asistencia</CardTitle>
          <Badge className={`${statusColor} border-0`}>
            {statusText}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {(attendeeStatus as any)?.status === 'confirmed' && (
          <>
            <div className="flex items-center gap-2 text-green-700 mb-3">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">¡Asistencia confirmada!</span>
            </div>
            
            <div className="space-y-3">
              <Button 
                variant="outline" 
                onClick={() => setShowQR(!showQR)}
                className="w-full"
              >
                <QrCode className="h-4 w-4 mr-2" />
                {showQR ? 'Ocultar' : 'Mostrar'} código QR
              </Button>
              
              {showQR && (attendeeStatus as any)?.qrCode && (
                <div className="border rounded-lg p-4 bg-white">
                  <QRInline 
                    value={(attendeeStatus as any).qrCode}
                    size={200}
                    className="mx-auto"
                  />
                  <p className="text-center text-sm text-gray-600 mt-2">
                    Presenta este código al llegar al evento
                  </p>
                </div>
              )}
            </div>
          </>
        )}
        
        {(attendeeStatus as any)?.status === 'present' && (
          <div className="flex items-center gap-2 text-blue-700">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">¡Ya registraste tu llegada!</span>
          </div>
        )}
        
        {(attendeeStatus as any)?.status === 'pending' && (
          <div className="flex items-center gap-2 text-yellow-700">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Confirmación pendiente</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}