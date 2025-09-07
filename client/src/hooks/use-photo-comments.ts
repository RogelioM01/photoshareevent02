import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { PhotoCommentWithUser, InsertPhotoComment, PhotoComment } from "../../../shared/schema";

// Get comments for a photo
export function usePhotoComments(photoId: string) {
  return useQuery<PhotoCommentWithUser[]>({
    queryKey: [`/api/photos/${photoId}/comments`],
    enabled: !!photoId,
  });
}

// Add comment to photo
export function useAddPhotoComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      photoId, 
      userId, 
      userName, 
      comment 
    }: { 
      photoId: string; 
      userId: string; 
      userName: string; 
      comment: string; 
    }) => {
      return await apiRequest(`/api/photos/${photoId}/comments`, "POST", { userId, userName, comment });
    },
    onSuccess: (data, variables) => {
      // Invalidate comments for this photo
      queryClient.invalidateQueries({ 
        queryKey: [`/api/photos/${variables.photoId}/comments`] 
      });
      
      // Invalidate photos with likes to update comment count (updated keys)
      queryClient.invalidateQueries({ 
        queryKey: ['/api/events'],
        exact: false
      });
    }
  });
}

// Delete photo comment
export function useDeletePhotoComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      photoId, 
      commentId, 
      userId 
    }: { 
      photoId: string; 
      commentId: string; 
      userId: string; 
    }) => {
      return await apiRequest(`/api/photos/${photoId}/comments/${commentId}`, "DELETE", { userId });
    },
    onSuccess: (data, variables) => {
      // Invalidate comments for this photo
      queryClient.invalidateQueries({ 
        queryKey: [`/api/photos/${variables.photoId}/comments`] 
      });
      
      // Invalidate photos with likes to update comment count (updated keys)
      queryClient.invalidateQueries({ 
        queryKey: ['/api/events'],
        exact: false
      });
    }
  });
}