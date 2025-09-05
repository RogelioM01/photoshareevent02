import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { EventAttendee, EventAttendeeWithUser, AttendeeStats } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// PHASE 4: RSVP Hooks for Event Attendance Management

export function useAttendeeStatus(eventId: string, userId?: string) {
  return useQuery({
    queryKey: ['/api/events', eventId, 'my-attendance', userId],
    enabled: !!eventId && !!userId,
  });
}

export function useEventAttendees(eventId: string) {
  return useQuery({
    queryKey: ['/api/events', eventId, 'attendees'],
    enabled: !!eventId,
  });
}

export function useAttendeeStats(eventId: string) {
  return useQuery({
    queryKey: ['/api/events', eventId, 'attendee-stats'],
    enabled: !!eventId,
  });
}

export function useConfirmAttendance(eventId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { userId: string }) => 
      apiRequest(`/api/events/${eventId}/confirm-attendance`, 'POST', data),
    onSuccess: (data, variables) => {
      // Invalidate and refetch attendance status
      queryClient.invalidateQueries({ 
        queryKey: ['/api/events', eventId, 'my-attendance', variables.userId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/events', eventId, 'attendees'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/events', eventId, 'attendee-stats'] 
      });
    },
  });
}

export function useCheckIn(eventId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { qrCode: string; checkedInBy?: string }) => 
      apiRequest(`/api/events/${eventId}/checkin`, 'POST', data),
    onSuccess: () => {
      // Invalidate and refetch all attendance data
      queryClient.invalidateQueries({ 
        queryKey: ['/api/events', eventId, 'attendees'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/events', eventId, 'attendee-stats'] 
      });
    },
  });
}

export function useManualCheckIn(eventId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { attendeeId: string; action: 'checkin' | 'undo_checkin' }) => 
      apiRequest(`/api/events/${eventId}/manual-checkin`, 'POST', data),
    onSuccess: () => {
      // Invalidate and refetch all attendance data
      queryClient.invalidateQueries({ 
        queryKey: ['/api/events', eventId, 'attendees'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/events', eventId, 'attendee-stats'] 
      });
    },
  });
}

// Helper function to get attendance status text in Spanish
export function getAttendanceStatusText(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'confirmed':
      return 'Confirmado';
    case 'present':
      return 'Presente';
    case 'absent':
      return 'Ausente';
    default:
      return 'Desconocido';
  }
}

// Helper function to get status color for UI
export function getAttendanceStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'text-yellow-600 bg-yellow-50';
    case 'confirmed':
      return 'text-blue-600 bg-blue-50';
    case 'present':
      return 'text-green-600 bg-green-50';
    case 'absent':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}