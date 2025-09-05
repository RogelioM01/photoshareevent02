import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, UserX, Clock, QrCode, ChevronDown, ChevronRight, Mail, Phone } from "lucide-react";
import { useAttendeeStats, useEventAttendees, useManualCheckIn } from "@/hooks/useRSVP";
import { getAttendanceStatusText, getAttendanceStatusColor } from "@/hooks/useRSVP";
import { useToast } from "@/hooks/use-toast";

// PHASE 4: Attendee Statistics Component for Event Organizers

interface AttendeeStatsProps {
  eventId: string;
  eventTitle: string;
  onShowCheckIn?: () => void;
}

// Expandable Attendee Row Component - Scalable for future features
interface ExpandableAttendeeRowProps {
  attendee: any;
  index: number;
  eventId: string;
}

function ExpandableAttendeeRow({ attendee, index, eventId }: ExpandableAttendeeRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();
  const manualCheckInMutation = useManualCheckIn(eventId);
  
  // Generate consistent avatar colors
  const avatarColors = [
    'bg-emerald-400', 'bg-blue-400', 'bg-purple-400', 'bg-orange-400',
    'bg-pink-400', 'bg-indigo-400', 'bg-teal-400', 'bg-red-400'
  ];
  const avatarColor = avatarColors[index % avatarColors.length];
  
  const displayName = attendee.guestName || attendee.userName || attendee.userId || 'Usuario';
  const firstLetter = displayName.charAt(0).toUpperCase();
  
  // Determine if attendee can be modified based on check-in origin
  // QR check-ins: attendee has qrCode and status 'present' (came via QR scanner)
  // Manual check-ins: attendee status 'present' but no qrCode or was set manually
  const hasQRCode = Boolean(attendee.qrCode);
  const isQRCheckIn = attendee.status === 'present' && hasQRCode;
  const isManualCheckIn = attendee.status === 'present' && !hasQRCode;
  
  // Rules:
  // - "confirmed": always toggleable → "present" 
  // - "present" (manual admin): toggleable → "confirmed"
  // - "present" (QR/scanner): PROTECTED, not toggleable
  const canToggleManually = attendee.status === 'confirmed' || isManualCheckIn;
  
  // Handle manual check-in toggle
  const handleBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row expansion
    
    if (!canToggleManually) {
      // TODO: Future iteration - implement bidirectional toggle for manual check-ins
      // For now, silently prevent modification of present attendees
      return;
    }
    
    // Bidirectional toggle: confirmed ↔ present (only for manual check-ins)
    const newStatus = attendee.status === 'confirmed' ? 'present' : 'confirmed';
    
    manualCheckInMutation.mutate(
      { 
        attendeeId: attendee.id, 
        action: newStatus === 'present' ? 'checkin' : 'undo_checkin'
      },
      {
        onSuccess: () => {
          toast({
            title: "✅ Estado actualizado",
            description: `${displayName} ahora está ${newStatus === 'present' ? 'Presente' : 'Confirmado'}`,
          });
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: "No se pudo actualizar el estado",
            variant: "destructive",
          });
        }
      }
    );
  };
  
  return (
    <div className="border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200">
      {/* Collapsed View - Name + Status Only */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Left side: Avatar + Name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 ${avatarColor} rounded-full flex items-center justify-center`}>
            <span className="text-white text-sm font-bold">{firstLetter}</span>
          </div>
          <p className="font-medium text-gray-900 truncate">{displayName}</p>
        </div>
        
        {/* Right side: Badge + Chevron */}
        <div className="flex items-center gap-2 ml-2">
          <Badge 
            className={`${getAttendanceStatusColor(attendee.status)} text-xs px-2 py-1 ${
              canToggleManually ? 'cursor-pointer hover:opacity-80' : ''
            }`}
            onClick={handleBadgeClick}
          >
            {getAttendanceStatusText(attendee.status)}
          </Badge>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>
      
      {/* Expanded View - All Details */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50 space-y-3">
          {/* Contact Information */}
          {(attendee.guestEmail || attendee.userEmail) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4" />
              <span>{attendee.guestEmail || attendee.userEmail}</span>
            </div>
          )}
          
          {attendee.guestWhatsapp && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4" />
              <span>{attendee.guestWhatsapp}</span>
            </div>
          )}
          
          {/* Timestamp Information */}
          <div className="space-y-1 text-xs text-gray-500">
            {attendee.status === 'confirmed' && attendee.confirmedAt && (
              <p>📝 Confirmó: {new Date(attendee.confirmedAt).toLocaleString('es-ES')}</p>
            )}
            {attendee.status === 'present' && attendee.checkedInAt && (
              <p>✅ Check-in: {new Date(attendee.checkedInAt).toLocaleString('es-ES')}</p>
            )}
          </div>
          
          {/* Companions Information */}
          {attendee.companionsCount && parseInt(attendee.companionsCount) > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>Acompañantes: {attendee.companionsCount}</span>
            </div>
          )}
          
          {/* Future Scalable Section - Special Requirements */}
          {/* TODO: Add special requirements when implemented
          {attendee.specialRequirements && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Requerimientos:</span> {attendee.specialRequirements}
            </div>
          )}
          */}
        </div>
      )}
    </div>
  );
}

export function AttendeeStats({ eventId, eventTitle, onShowCheckIn }: AttendeeStatsProps) {
  const { data: stats, isLoading: statsLoading } = useAttendeeStats(eventId);
  const { data: attendees, isLoading: attendeesLoading } = useEventAttendees(eventId);

  // Add safety checks for data types - FORCE CACHE INVALIDATION v2.1
  const safeStats = stats as any || { total: 0, confirmed: 0, present: 0, pending: 0 };
  const safeAttendees = (attendees as any) || [];
  
  // Calculate total companions from attendees
  const totalCompanions = safeAttendees.reduce((total: number, attendee: any) => {
    const companions = parseInt(attendee.companionsCount || "0");
    return total + companions;
  }, 0);

  if (statsLoading || attendeesLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="h-4 w-4 animate-spin" />
            <span>Cargando estadísticas de asistencia...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!safeStats || safeStats.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Control de Asistencia
          </CardTitle>
          <CardDescription>
            Gestiona las confirmaciones y check-ins para "{eventTitle}"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium mb-1">Sin confirmaciones aún</p>
            <p className="text-sm">
              Los asistentes podrán confirmar su participación desde la página del evento
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Resumen de Asistencia
          </CardTitle>
          <CardDescription>
            Estado actual de confirmaciones para "{eventTitle}"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{safeStats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{safeStats.confirmed}</div>
              <div className="text-sm text-gray-600">Confirmados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{safeStats.present}</div>
              <div className="text-sm text-gray-600">Presentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{safeStats.pending}</div>
              <div className="text-sm text-gray-600">Pendientes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{totalCompanions}</div>
              <div className="text-sm text-gray-600">Acompañantes</div>
            </div>
          </div>
          
          {onShowCheckIn && (
            <Button 
              onClick={onShowCheckIn}
              className="w-full mt-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              <QrCode className="h-4 w-4 mr-2" />
              Abrir Scanner QR para Check-in
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Attendees List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-gray-900">Lista de Asistentes</CardTitle>
          <CardDescription className="text-gray-600">
            {safeStats.total} persona{safeStats.total !== 1 ? 's' : ''} ha{safeStats.total !== 1 ? 'n' : ''} interactuado con el evento
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {Array.isArray(safeAttendees) && safeAttendees.length > 0 ? (
              safeAttendees.map((attendee: any, index: number) => (
                <ExpandableAttendeeRow key={attendee.id} attendee={attendee} index={index} eventId={eventId} />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-600 text-lg font-medium">No hay asistentes registrados aún</p>
                <p className="text-sm text-gray-400 mt-2">Los invitados aparecerán aquí cuando se registren</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}