import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// PHASE 1: Registration Hook for Guest Attendance
// This hook handles the complete flow for guest registration to events

export interface RegistroAsistenciaData {
  userId: string; // Will use email as unique identifier for guests
  userName: string;
  userEmail: string;
  userWhatsapp: string;
}

export interface RegistroAsistenciaResponse {
  success: boolean;
  attendeeId: string;
  qrCode: string;
  message: string;
}

export function useRegistroAsistencia(eventId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: RegistroAsistenciaData): Promise<RegistroAsistenciaResponse> => {
      const response = await fetch(`/api/events/${eventId}/confirm-attendance`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Error al registrar asistencia');
      }
      
      return await response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries to update statistics
      queryClient.invalidateQueries({ 
        queryKey: ['/api/events', eventId, 'attendees'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/events', eventId, 'attendee-stats'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/events', eventId, 'my-attendance', variables.userId] 
      });
    },
  });
}

// Helper function to validate WhatsApp number format
export function validateWhatsAppNumber(number: string): boolean {
  // Remove all non-digit characters
  const cleaned = number.replace(/\D/g, '');
  
  // Check if it's a valid length (10-15 digits)
  if (cleaned.length < 10 || cleaned.length > 15) {
    return false;
  }
  
  return true;
}

// Helper function to format WhatsApp number
export function formatWhatsAppNumber(number: string): string {
  const cleaned = number.replace(/\D/g, '');
  
  // Add country code if not present (assume Mexico +52)
  if (cleaned.length === 10) {
    return `+52${cleaned}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('52')) {
    return `+${cleaned}`;
  }
  
  return `+${cleaned}`;
}