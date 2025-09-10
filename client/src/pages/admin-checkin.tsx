import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, UserCheck, Clock } from "lucide-react";
import { AttendeeStats } from "@/components/attendee-stats";
import { usePersonalEvent } from "@/hooks/usePersonalEvent";
import { useQuery } from "@tanstack/react-query";

// Admin Check-in Page - Attendance List Management
export default function AdminCheckinPage() {
  const { username } = useParams();
  const [, setLocation] = useLocation();
  // Get personal event data
  const { personalEvent, isLoading } = usePersonalEvent(username);

  // Get attendee list
  const { data: attendees = [] } = useQuery({
    queryKey: [`/api/events/${personalEvent?.id}/attendees`],
    enabled: !!personalEvent?.id,
  });

  // Type guard for attendees
  const attendeeList = Array.isArray(attendees) ? attendees : [];

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
                  Lista de Asistencia: {personalEvent.title}
                </h1>
              </div>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1 text-xs sm:text-sm px-2 py-1">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Lista de Asistencia</span>
              <span className="sm:hidden">Lista</span>
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 py-4 sm:px-4 sm:py-6">
        <div className="space-y-6">
          {/* Event Statistics */}
          <AttendeeStats eventId={personalEvent.id} eventTitle={personalEvent.title} />
        </div>
      </div>
    </div>
  );
}