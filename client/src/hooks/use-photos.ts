import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { logger } from "@/utils/logger";
import type { Photo, TextPost, PhotoWithUser, PhotoWithUserAndLikes, TextPostWithUser } from "@shared/schema";

export function usePhotos(eventId: string, userId?: string) {
  return useQuery<PhotoWithUserAndLikes[]>({
    queryKey: ["/api/events", eventId, "photos", userId || "no-user"],
    queryFn: async () => {
      const url = userId 
        ? `/api/events/${eventId}/photos?userId=${userId}`
        : `/api/events/${eventId}/photos`;
      logger.log(`🔍 Fetching photos from: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        logger.error(`❌ Photo fetch failed: ${response.status} ${response.statusText}`);
        throw new Error('Failed to fetch photos');
      }
      const data = await response.json();
      logger.log(`📸 Received ${data.length} photos:`, data.map((p: any) => ({ id: p.id, fileName: p.fileName, url: p.fileUrl })));
      return data;
    },
    enabled: !!eventId,
  });
}

export function useTextPosts(eventId: string) {
  return useQuery<TextPostWithUser[]>({
    queryKey: ["/api/events", eventId, "posts"],
    enabled: !!eventId,
  });
}

export function useUploadPhotos() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ eventId, userId, files }: { eventId: string; userId: string; files: FileList }) => {
      const formData = new FormData();
      formData.append("userId", userId);
      
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });
      
      const res = await fetch(`/api/events/${eventId}/photos`, {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload failed with status ${res.status}`);
      }
      
      return res.json();
    },
    onSuccess: (data, variables) => {
      logger.log("🔄 Photo upload successful, invalidating cache...");
      logger.log("📊 Upload response data:", data);
      logger.log("📋 Variables:", variables);
      
      // Invalidate ALL photo-related cache entries
      queryClient.invalidateQueries({ 
        queryKey: ["/api/events"],
        exact: false 
      });
      
      // Force immediate refetch with a small delay to ensure database is consistent
      setTimeout(() => {
        queryClient.refetchQueries({ 
          queryKey: ["/api/events", variables.eventId, "photos"],
          exact: false
        }).then(() => {
          logger.log("✅ Refetch completed after upload");
        });
      }, 500);
    },
  });
}

export function useCreateTextPost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ eventId, userId, content }: { eventId: string; userId: string; content: string }) => {
      const res = await apiRequest(`/api/events/${eventId}/posts`, "POST", { userId, content });
      return res.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch text posts
      queryClient.invalidateQueries({ 
        queryKey: ["/api/events", variables.eventId, "posts"],
        exact: false 
      });
      queryClient.refetchQueries({ 
        queryKey: ["/api/events", variables.eventId, "posts"],
        exact: false
      });
    },
  });
}

export function useDeletePhoto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ eventId, photoId, userId }: { eventId: string; photoId: string; userId: string }) => {
      const res = await apiRequest(`/api/events/${eventId}/photos/${photoId}`, "DELETE", { userId });
      return res.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch photo queries
      queryClient.invalidateQueries({ 
        queryKey: ["/api/events", variables.eventId, "photos"],
        exact: false 
      });
      queryClient.refetchQueries({ 
        queryKey: ["/api/events", variables.eventId, "photos"],
        exact: false
      });
    },
  });
}

export function useDeleteTextPost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ eventId, postId, userId }: { eventId: string; postId: string; userId: string }) => {
      const res = await apiRequest(`/api/events/${eventId}/posts/${postId}`, "DELETE", { userId });
      return res.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch text post queries
      queryClient.invalidateQueries({ 
        queryKey: ["/api/events", variables.eventId, "posts"],
        exact: false 
      });
      queryClient.refetchQueries({ 
        queryKey: ["/api/events", variables.eventId, "posts"],
        exact: false
      });
    },
  });
}

export function useLikePhoto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ photoId, userId, eventId }: { photoId: string; userId: string; eventId: string }) => {
      const res = await apiRequest(`/api/photos/${photoId}/like`, "POST", { userId });
      if (!res.ok) {
        throw new Error(`Failed to like photo: ${res.status}`);
      }
      return res.json();
    },
    onMutate: async ({ photoId, userId, eventId }) => {
      // Cancel outgoing refetches for this specific event only
      await queryClient.cancelQueries({ queryKey: ["/api/events", eventId, "photos"] });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueriesData({ queryKey: ["/api/events", eventId, "photos"] });
      
      // Optimistically update the specific event's photos
      queryClient.setQueriesData({ queryKey: ["/api/events", eventId, "photos"] }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map((photo: any) => 
            photo.id === photoId 
              ? { ...photo, isLikedByCurrentUser: true, likeCount: (photo.likeCount || 0) + 1 }
              : photo
          );
        }
        return old;
      });
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (data, error, { eventId }) => {
      // Invalidate only this specific event's photos, not the entire cache
      queryClient.invalidateQueries({ 
        queryKey: ["/api/events", eventId, "photos"],
        exact: false 
      });
    },
  });
}

export function useUnlikePhoto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ photoId, userId, eventId }: { photoId: string; userId: string; eventId: string }) => {
      const res = await apiRequest(`/api/photos/${photoId}/like`, "DELETE", { userId });
      if (!res.ok) {
        throw new Error(`Failed to unlike photo: ${res.status}`);
      }
      return res.json();
    },
    onMutate: async ({ photoId, userId, eventId }) => {
      // Cancel outgoing refetches for this specific event only
      await queryClient.cancelQueries({ queryKey: ["/api/events", eventId, "photos"] });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueriesData({ queryKey: ["/api/events", eventId, "photos"] });
      
      // Optimistically update the specific event's photos
      queryClient.setQueriesData({ queryKey: ["/api/events", eventId, "photos"] }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map((photo: any) => 
            photo.id === photoId 
              ? { ...photo, isLikedByCurrentUser: false, likeCount: Math.max((photo.likeCount || 1) - 1, 0) }
              : photo
          );
        }
        return old;
      });
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (data, error, { eventId }) => {
      // Invalidate only this specific event's photos, not the entire cache
      queryClient.invalidateQueries({ 
        queryKey: ["/api/events", eventId, "photos"],
        exact: false 
      });
    },
  });
}
