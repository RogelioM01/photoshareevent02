import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface PersonalEvent {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  backgroundType: string;
  backgroundValue: string;
  eventDate?: string; // ISO date string (YYYY-MM-DD) - optional for existing events
  eventTime?: string; // Time string (HH:MM) - optional for existing events
  timezone?: string; // IANA timezone identifier
  eventPlace?: string; // Place type (e.g., "Casa", "Restaurante", "Parque") - optional for existing events
  eventAddress?: string; // Specific address or location details - optional for existing events
  enableAutoRedirect?: boolean; // Auto-redirect to RSVP page before event date
  maxCompanions?: string; // Maximum companions allowed per attendee (configurable by organizer)
  shouldRedirectToRSVP?: boolean; // Server-calculated redirect flag
  ownerId: string;
}

export interface PersonalEventFormData {
  title: string;
  description: string;
  coverImageUrl: string;
  backgroundType: string;
  backgroundValue: string;
  eventDate?: string; // ISO date string (YYYY-MM-DD) - optional for existing events
  eventTime?: string; // Time string (HH:MM) - optional for existing events
  timezone?: string; // IANA timezone identifier
  eventPlace?: string; // Place type (e.g., "Casa", "Restaurante", "Parque") - optional for existing events
  eventAddress?: string; // Specific address or location details - optional for existing events
  enableAutoRedirect?: boolean; // Auto-redirect to RSVP page before event date
  maxCompanions?: string; // Maximum companions allowed per attendee (configurable by organizer)
}

/**
 * REACT QUERY IMPLEMENTATION NOTES - usePersonalEvent.ts
 * ====================================================
 * 
 * PURPOSE: Centralized hook for personal event data management using React Query
 * 
 * KEY ARCHITECTURAL DECISIONS:
 * - Single source of truth: React Query cache replaces manual state management
 * - Declarative loading states: No manual loading/error state management needed
 * - Automatic cache invalidation: Data stays fresh across components
 * - Optimistic updates: Immediate UI feedback for better UX
 * 
 * DEBUGGING TIPS:
 * - Query key: ['/api/evento', username] - Check React Query DevTools
 * - Cache invalidation: All mutations invalidate query automatically
 * - Error handling: React Query provides automatic retry and error states
 * - staleTime: 5 minutes - Data considered fresh, won't refetch
 * 
 * MIGRATION BENEFITS vs MANUAL STATE:
 * - ✅ Automatic loading/error states instead of useState hooks
 * - ✅ Background refetching and data synchronization  
 * - ✅ Built-in request deduplication and caching
 * - ✅ Declarative mutations with onSuccess/onError callbacks
 * - ✅ Eliminates manual fetch calls and state updates
 */
export function usePersonalEvent(username?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ⚠️ CRITICAL: SUPABASE MIGRATION COMPLETE - DO NOT REVERT TO LOCALSTORAGE
  // 
  // MIGRATION COMPLETED JULY 27, 2025:
  // All date and toggle fields (eventDate, eventTime, timezone, enableAutoRedirect) 
  // are now stored in Supabase PostgreSQL database permanently.
  //
  // ❌ NEVER REVERT TO LOCALSTORAGE:
  // - enableAutoRedirect MUST come from database only for URL consistency
  // - Date fields are persistent in database, localStorage causes data conflicts
  // - Hybrid systems cause toggle state inconsistency across URLs
  //
  // 🔧 DEBUGGING IF TOGGLE INCONSISTENT:
  // 1. Check backend logs for "enableAutoRedirect=true/false" in Supabase queries
  // 2. Verify React Query cache invalidation triggers after mutations
  // 3. Confirm no localStorage.getItem() calls for event settings anywhere
  //
  // 🚨 BREAKING CHANGE PREVENTION:
  // If you need to modify this hook, maintain pure database persistence.
  // Any localStorage usage will break toggle consistency across URLs.

  // QUERY CONFIGURATION - Personal Event Data Fetching
  // ================================================
  // DEBUG: Check React Query DevTools for cache status
  // PERFORMANCE: staleTime prevents unnecessary refetches
  // CONDITIONAL: enabled prevents query when no username provided
  const {
    data: rawPersonalEvent,
    isLoading,
    error,
    refetch
  } = useQuery<PersonalEvent>({
    queryKey: ['/api/evento', username], // CACHE KEY: Unique per username
    enabled: !!username, // CONDITIONAL: Only run if username exists
    retry: 1, // RETRY POLICY: One retry on failure
    staleTime: 30 * 1000, // FRESHNESS: 30 seconds - reduced for faster updates
    queryFn: async () => {
      if (!username) throw new Error('Username required');
      
      // SUPABASE MIGRATION COMPLETE: Now using pure database persistence
      console.log('🔍 SUPABASE: Fetching personal event for', username);
      const url = `/api/evento/${username}`;
      console.log('🔍 SUPABASE: Fetching URL:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch personal event: ${response.statusText}`);
      }
      
      return response.json();
    }
  });

  // PERSONAL EVENT: Direct data from backend (already includes localStorage fields)
  // Backend now handles hybrid system by reading localStorage data via query parameters
  const personalEvent = rawPersonalEvent;

  // UPDATE MUTATION - Event Details Modification
  // ==========================================
  // OPTIMISTIC UPDATES: Cache updated immediately on success
  // ERROR HANDLING: Automatic toast notifications for user feedback
  // CACHE STRATEGY: Direct cache update instead of invalidation for better UX
  const updateEventMutation = useMutation({
    mutationFn: async (formData: PersonalEventFormData) => {
      // DEBUG: Check Network tab for PUT request status
      const response = await fetch(`/api/evento/${username}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // DEBUG: Error details logged in console for troubleshooting
        console.error("Update event error:", errorText);
        throw new Error(errorText || "Error al actualizar el evento");
      }

      return await response.json();
    },
    onSuccess: (updatedEvent, formData) => {
      // SUPABASE MIGRATION COMPLETE: Use server response directly
      console.log('🔍 SUPABASE: Event updated successfully:', updatedEvent);
      
      // FORCE IMMEDIATE UPDATE: Update cache directly with fresh data
      queryClient.setQueryData(['/api/evento', username], updatedEvent);
      
      // CRITICAL: Force immediate invalidation of current personal event query
      queryClient.invalidateQueries({ 
        queryKey: ['/api/evento', username],
        exact: true
      });
      
      // CRITICAL FIX: Cross-endpoint cache invalidation for gallery updates
      // PROBLEM: Two different API endpoints serve same data with different cache keys
      // - Dashboard: /api/evento/username (gets updated properly)
      // - Gallery: /api/events/username-album (needs manual invalidation)
      
      const albumKey = `${username}-album`;
      
      // Invalidate both possible gallery cache patterns
      queryClient.invalidateQueries({ 
        queryKey: ["/api/events"], // Invalidate all event queries
        exact: false 
      });
      
      // Force refetch of the specific gallery event data
      queryClient.invalidateQueries({ 
        queryKey: ["/api/events", albumKey]
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ["/api/events", albumKey, "with-owner"]
      });
      
      // Also try invalidating with the direct username (legacy support)
      queryClient.invalidateQueries({ 
        queryKey: ["/api/events", username]
      });
      
      console.log('🔄 COMPREHENSIVE cache invalidation for gallery sync:', {
        personalEventKey: ['/api/evento', username],
        galleryKeys: [
          ["/api/events", albumKey],
          ["/api/events", albumKey, "with-owner"], 
          ["/api/events", username]
        ],
        broadInvalidation: ["/api/events", "*"]
      });
      
      // FORCE REFETCH: Ensure fresh data loads immediately
      setTimeout(() => {
        queryClient.refetchQueries({ 
          queryKey: ['/api/evento', username],
          exact: true
        });
      }, 100);
      
      // USER FEEDBACK: Success toast notification
      toast({
        title: "Éxito",
        description: "Tu evento personal ha sido actualizado",
      });
    },
    onError: (error: any) => {
      console.error("Dashboard: handleSave error", error);
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el evento",
        variant: "destructive",
      });
    },
  });

  // COVER UPLOAD MUTATION - Image Upload Handling  
  // ============================================
  // FILE UPLOAD: Uses FormData for multipart upload to /api/upload-image
  // USER FEEDBACK: Toast notifications for upload status
  // ERROR RECOVERY: Detailed error logging for troubleshooting
  const uploadCoverMutation = useMutation({
    mutationFn: async (file: File) => {
      // DEBUG: Check file size and type in Network tab
      const formData = new FormData();
      formData.append("image", file);
      
      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        // DEBUG: Upload errors logged with response details
        console.error("Cover upload error:", errorText);
        throw new Error(errorText || "Error al subir la imagen");
      }

      return await response.json();
    },
    onSuccess: (response) => {
      // USER FEEDBACK: Success confirmation for upload completion
      toast({
        title: "Éxito",
        description: "Imagen de portada subida correctamente",
      });
    },
    onError: (error: any) => {
      // ERROR HANDLING: Detailed logging and user notification
      console.error("Error uploading cover image:", error);
      toast({
        title: "Error",
        description: "Error al subir la imagen de portada",
        variant: "destructive",
      });
    },
  });

  // ZIP DOWNLOAD MUTATION - Bulk Content Download
  // ============================================
  // FILE DOWNLOAD: Creates browser download for ZIP containing all event content
  // BLOB HANDLING: Proper memory management with URL cleanup
  // DEPENDENCY: Requires personalEvent.id from cache data
  const downloadZipMutation = useMutation({
    mutationFn: async () => {
      // VALIDATION: Ensure event ID exists before attempting download
      if (!personalEvent?.id) {
        console.error("ZIP download attempted without event ID");
        throw new Error("No event ID found");
      }
      
      // DEBUG: Monitor download progress in Network tab
      const response = await fetch(`/api/events/${personalEvent.id}/download`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("ZIP generation error:", errorText);
        throw new Error("Error al crear el archivo ZIP");
      }
      
      // BLOB PROCESSING: Convert response to downloadable file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${personalEvent.title || "evento"}-fotos.zip`;
      document.body.appendChild(a);
      a.click();
      
      // MEMORY CLEANUP: Prevent memory leaks from blob URLs
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      // USER FEEDBACK: Download initiation confirmation
      toast({
        title: "Éxito",
        description: "Descarga iniciada correctamente",
      });
    },
    onError: (error: any) => {
      console.error("Error downloading ZIP:", error);
      toast({
        title: "Error",
        description: error.message || "Error al descargar el archivo ZIP",
        variant: "destructive",
      });
    },
  });

  return {
    // Data
    personalEvent,
    isLoading,
    error,
    
    // Actions
    refetch,
    updateEvent: updateEventMutation.mutate,
    uploadCover: uploadCoverMutation.mutate,
    downloadZip: downloadZipMutation.mutate,
    
    // Loading states
    isUpdating: updateEventMutation.isPending,
    isUploadingCover: uploadCoverMutation.isPending,
    isDownloadingZip: downloadZipMutation.isPending,
    
    // Upload result for cover image
    coverUploadResult: uploadCoverMutation.data,
  };
}