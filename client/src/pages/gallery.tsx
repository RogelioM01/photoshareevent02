import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "wouter";
import { ChevronDown, Shield, Trash2, Camera } from "lucide-react";
import { useEvent, useEventWithOwner } from "@/hooks/use-event";
import { usePhotos, useLikePhoto, useUnlikePhoto, useDeletePhoto, useTextPosts, useDeleteTextPost } from "@/hooks/use-photos";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import UploadModal from "@/components/upload-modal";
import ContentViewer from "@/components/content-viewer";
import VideoThumbnail from "@/components/video-thumbnail";
import { useAuth } from "@/contexts/auth-context";
import { generateTextPostImage } from "@/utils/text-to-image";
import PhotoGridItem from "@/components/photo-grid-item";
import { logger } from "@/utils/logger";


export default function Gallery() {
  const params = useParams();
  
  /* 
   * CRITICAL: URL Parameter Extraction
   * 
   * ISSUE FIXED: Username was undefined causing gallery not to load
   * SOLUTION: Check multiple param sources due to different routing patterns
   * - params.username: Standard wouter parameter
   * - params.param: Alternative parameter name
   * - params[0]: Fallback for dynamic route patterns
   * 
   * WITHOUT THIS: Event ID will be undefined and photos won't load
   */
  const username = params.username || params.param || params[0];
  const queryClient = useQueryClient();
  
  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedContentIndex, setSelectedContentIndex] = useState<number | null>(null);
  
  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    type: null as 'photo' | 'post' | null,
    id: '',
    userId: '',
    title: '',
    description: ''
  });

  // Get event data based on URL parameter
  const { data: event, isLoading: eventLoading, error: eventError } = useEvent(username || "");
  const { data: eventWithOwner } = useEventWithOwner(username || "");
  

  // Use centralized authentication context
  const { authUser, currentUser, effectiveUserId, isLoading: authLoading, setCurrentUser, refreshAuth } = useAuth();

  // Force auth refresh when Gallery component mounts to catch any localStorage changes
  useEffect(() => {
    refreshAuth();
  }, []); // Empty dependency array - only run on mount

  const { data: photos = [], isLoading: photosLoading, error: photosError, dataUpdatedAt } = usePhotos(event?.id || "", effectiveUserId);
  
  
  // Debug logging for photo state changes (throttled to avoid too many logs)
  useEffect(() => {
    logger.log("🖼️ Gallery photos state updated:", {
      photosCount: photos.length,
      photosLoading,
      photosError: photosError?.message,
      currentUserId: currentUser?.id,
      effectiveUserId,
      eventId: event?.id,
      dataUpdatedAt: new Date(dataUpdatedAt).toLocaleTimeString(),
      photoIds: photos.map(p => p.id)
    });
  }, [photos.length, photosLoading, currentUser?.id, event?.id]); // Reduced dependencies

  const { data: textPosts = [] } = useTextPosts(event?.id || "");
  const deletePhoto = useDeletePhoto();
  const deleteTextPost = useDeleteTextPost();
  const likePhoto = useLikePhoto();
  const unlikePhoto = useUnlikePhoto();
  
  // State for generated images
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedTextPost, setSelectedTextPost] = useState<any>(null);
  
  // Function to generate image from text post
  const handleGenerateTextImage = async (post: any) => {
    try {
      const timestamp = new Date(post.createdAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const imageDataUrl = await generateTextPostImage({
        content: post.content,
        userName: post.userName,
        timestamp: timestamp,
        width: 800,
        height: 600
      });
      
      // Store the generated image and show it in a modal
      setGeneratedImage(imageDataUrl);
      setSelectedTextPost(post);
      
    } catch (error) {
      logger.error('Error generating text image:', error);
    }
  };

  // Check if current user is the event owner (permanent admin mode)
  const [isEventOwner, setIsEventOwner] = useState(false);
  
  /* 
    ADMIN MODE DETECTION: Determines if current user can delete any photo/post
    
    LOGIC FLOW:
    1. NEW URL FORMAT: /evento/username-album
       - Extract username from URL parameter (remove '-album' suffix)
       - Compare with authenticated user's username
       - If match = event owner = admin mode enabled
       
    2. LEGACY FORMAT: /event/eventTitle  
       - Use eventWithOwner data from server
       - Compare ownerUsername with authenticated user's username
       
    DEBUG NOTES:
    - If admin mode not working: verify authUser exists in localStorage
    - For new format: check username variable contains 'username-album' format
    - For legacy: ensure eventWithOwner is loaded and contains ownerUsername
    - Admin indicator only shows when isEventOwner = true
  */
  useEffect(() => {
    if (authUser) {
      // FOR NEW URL FORMAT: /evento/username-album
      if (username && username.endsWith('-album')) {
        const eventUsername = username.replace('-album', '');
        const isOwner = authUser.username === eventUsername;
        
        // DEBUG: Uncomment for admin detection troubleshooting
        // console.log('Admin Detection (New Format):', {
        //   urlParam: username,
        //   eventUsername,
        //   authUsername: authUser.username,
        //   isOwner
        // });
        
        setIsEventOwner(isOwner);
      } 
      // FOR LEGACY URL FORMAT: /event/eventTitle
      else if (eventWithOwner?.ownerUsername) {
        const isOwner = authUser.username === eventWithOwner.ownerUsername;
        
        // DEBUG: Uncomment for admin detection troubleshooting
        // console.log('Admin Detection (Legacy Format):', {
        //   eventOwnerUsername: eventWithOwner.ownerUsername,
        //   authUsername: authUser.username,
        //   isOwner
        // });
        
        setIsEventOwner(isOwner);
      }
    } else {
      setIsEventOwner(false);
    }
  }, [authUser?.username, username, eventWithOwner?.ownerUsername]);

  /**
   * DELETE PHOTO CONFIRMATION - UI Only (Security Handled by Backend)
   * 
   * PERMISSION LOGIC:
   * - Photo owners: Can delete their own photos
   * - Event owners: Can delete any photo in their event (admin mode)
   * - Backend validates all permissions regardless of frontend checks
   * 
   * DEBUGGING NOTES:
   * - If delete button not showing: Check currentUser exists and ID matches
   * - If admin mode not working: Verify isEventOwner state is true
   * - If backend returns 403: User doesn't have actual permission despite frontend showing button
   */
  const handleDeletePhoto = (photoId: string, photoUserId?: string) => {
    if (!currentUser || !event) return;
    
    const title = isEventOwner 
      ? "Eliminar Foto (Modo Administrador)"
      : "Eliminar Foto";
    
    const description = isEventOwner 
      ? "¿Estás seguro de que quieres eliminar esta foto? Como administrador del evento, puedes eliminar cualquier foto."
      : "¿Estás seguro de que quieres eliminar esta foto? Esta acción no se puede deshacer.";
    
    setDeleteDialog({
      isOpen: true,
      type: 'photo',
      id: photoId,
      userId: photoUserId || '',
      title,
      description
    });
  };

  const handleDeleteTextPost = (postId: string, postUserId?: string) => {
    if (!currentUser || !event) return;
    
    const title = isEventOwner 
      ? "Eliminar Mensaje (Modo Administrador)"
      : "Eliminar Mensaje";
    
    const description = isEventOwner 
      ? "¿Estás seguro de que quieres eliminar este mensaje? Como administrador del evento, puedes eliminar cualquier mensaje."
      : "¿Estás seguro de que quieres eliminar este mensaje? Esta acción no se puede deshacer.";
    
    setDeleteDialog({
      isOpen: true,
      type: 'post',
      id: postId,
      userId: postUserId || '',
      title,
      description
    });
  };

  /**
   * DELETE EXECUTION - Async Mutation Handler
   * 
   * ARCHITECTURE: Delegates security to backend, frontend only handles UX flow
   * 
   * USER ID LOGIC:
   * - Event owners: Use photo/post owner's ID (deleteDialog.userId) for admin delete
   * - Regular users: Use their own ID (currentUser.id) for self-delete
   * - Backend validates permissions regardless of frontend logic
   * 
   * DEBUGGING NOTES:
   * - If mutation fails: Check network tab for backend error response
   * - If loading state stuck: Verify isPending states in AlertDialog
   * - If dialog won't close: Check setDeleteDialog state reset
   * - If permissions error: Backend will return 403, frontend just handles UX
   */
  const confirmDelete = async () => {
    if (!currentUser || !event || !deleteDialog.type) return;
    
    try {
      // Admin mode: use original owner's ID, Regular mode: use current user's ID
      const userIdToUse = isEventOwner ? (deleteDialog.userId || currentUser.id) : currentUser.id;
      
      if (deleteDialog.type === 'photo') {
        await deletePhoto.mutateAsync({
          eventId: event.id,
          photoId: deleteDialog.id,
          userId: userIdToUse
        });
      } else if (deleteDialog.type === 'post') {
        await deleteTextPost.mutateAsync({
          eventId: event.id,
          postId: deleteDialog.id,
          userId: userIdToUse
        });
      }
      
      // Reset dialog state on success
      setDeleteDialog({
        isOpen: false,
        type: null,
        id: '',
        userId: '',
        title: '',
        description: ''
      });
    } catch (error) {
      logger.error(`Error deleting ${deleteDialog.type}:`, error);
      // Dialog stays open on error so user can retry or cancel
    }
  };

  // Memoize handlers to prevent unnecessary re-renders of grid items
  const handleItemClick = useCallback((item: any) => {
    const contentIndex = allContent.findIndex(c => c.id === item.id && c.type === item.type);
    setSelectedContentIndex(contentIndex);
  }, []);

  const handleLikePhoto = useCallback(async (photoId: string) => {
    if (!currentUser || !event?.id) return;
    
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;

    try {
      if (photo.isLikedByCurrentUser) {
        await unlikePhoto.mutateAsync({ photoId, userId: currentUser.id, eventId: event.id });
      } else {
        await likePhoto.mutateAsync({ photoId, userId: currentUser.id, eventId: event.id });
      }
    } catch (error) {
      logger.error('Error toggling like:', error);
    }
  }, [currentUser, event?.id, photos, likePhoto, unlikePhoto]);

  // Convert authUser to EventUser format when needed for compatibility
  useEffect(() => {
    if (authUser && event?.id && (!currentUser || currentUser.id !== authUser.id)) {
      const eventUser = {
        id: authUser.id,
        name: authUser.fullName,
        eventId: event.id,
        createdAt: new Date() // Add required createdAt field
      };
      setCurrentUser(eventUser);
    }
  }, [authUser?.id, event?.id]); // Only run when IDs change

  // Check if this is the first visit to this gallery  
  useEffect(() => {
    if (event && !currentUser && !authLoading) {
      // Show upload modal immediately for users without authentication
      setTimeout(() => {
        setShowUploadModal(true);
      }, 500);
    } else if (event && currentUser) {
      const visitKey = `gallery_visited_${event.id}_${currentUser.id}`;
      const hasVisited = localStorage.getItem(visitKey);
      
      if (!hasVisited) {
        // Mark as visited
        localStorage.setItem(visitKey, 'true');
        // Show upload modal after a longer delay to ensure auth is fully synced
        setTimeout(() => {
          setShowUploadModal(true);
        }, 1500); // Increased delay
      }
    }
  }, [event, currentUser, authLoading]);

  /**
   * PERFORMANCE OPTIMIZATION - Memoized Content Calculations
   * 
   * CRITICAL: These useMemo hooks MUST be placed before any conditional returns
   * to avoid "Rendered more hooks than during the previous render" error
   * 
   * WHY MEMOIZED:
   * - allContent: Prevents expensive array operations (map, spread, sort) on every render
   * - oldestPhoto: Avoids repeated array sorting when determining hero banner background
   * 
   * DEBUGGING NOTES:
   * - If React hooks error occurs: Check these are before any conditional returns
   * - If performance issues: Verify dependencies array [photos, textPosts] is correct
   * - If content doesn't update: Check React Query invalidation after mutations
   */
  const allContent = useMemo(() => {
    return [
      ...photos.map(photo => ({ ...photo, type: 'photo' as const })),
      ...textPosts.map(post => ({ ...post, type: 'post' as const }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [photos, textPosts]);

  const oldestPhoto = useMemo(() => {
    return photos.length > 0 ? 
      [...photos].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0] : null;
  }, [photos]);

  // Update the memoized function dependencies
  const memoizedHandleItemClick = useCallback((item: any) => {
    const contentIndex = allContent.findIndex(c => c.id === item.id && c.type === item.type);
    setSelectedContentIndex(contentIndex);
  }, [allContent]);

  // Only show loading if event is not loaded yet
  // Allow gallery to render even without currentUser (guest users)
  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-event-secondary mx-auto mb-4"></div>
          <p>Cargando evento...</p>
        </div>
      </div>
    );
  }

  // Get hero banner background - always use oldest photo or fallback image
  const getHeroBannerBackground = () => {
    return oldestPhoto ? oldestPhoto.fileUrl : event.coverImageUrl || "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=600";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="relative h-80 md:h-96 lg:h-[28rem] overflow-hidden">
        {/* Background Image - Always use oldest photo or fallback */}
        <div className="absolute inset-0">
          <img 
            src={getHeroBannerBackground()}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          {/* Standard overlay for image backgrounds */}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        {/* Hero Content */}
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center text-white px-4">
            
            {/* Event Title with serif font */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-3 drop-shadow-lg">
              {event.title}
            </h1>
            

            {/* Add Photos Button with improved styling */}
            <Button 
              onClick={() => setShowUploadModal(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-full text-lg font-medium shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
            >
              Agregar fotos
            </Button>

            {/* Admin Mode Indicator - Only show for event owners */}
            {isEventOwner && (
              <div className="mt-4 flex items-center justify-center">
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">Administrador</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Counter */}
        <div className="absolute bottom-4 right-4 flex items-center space-x-2 text-white">
          <span className="text-sm font-medium">
            {photos.filter(p => !p.isVideo).length} fotos • {photos.filter(p => p.isVideo).length} videos • {textPosts.length} mensajes
          </span>
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Content Grid */}
        {photosLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : allContent.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allContent.map((item, index) => (
              <PhotoGridItem
                key={`${item.type}-${item.id}`}
                item={item}
                index={index}
                currentUser={currentUser}
                isEventOwner={isEventOwner}
                onItemClick={memoizedHandleItemClick}
                onLike={handleLikePhoto}
                onDeletePhoto={handleDeletePhoto}
                onDeleteTextPost={handleDeleteTextPost}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay fotos o publicaciones aún.</p>
            <p className="text-gray-400 mt-2">¡Sé el primero en subir algo!</p>
          </div>
        )}

        {/* Floating Action Button - Force render with inline styles for production */}
        <button
          onClick={() => setShowUploadModal(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group fab-pulse hover:animate-none focus:animate-none active:scale-95 z-50"
          style={{
            // Force styles for production compatibility
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            width: '3.5rem',
            height: '3.5rem',
            background: 'linear-gradient(to right, rgb(59 130 246), rgb(37 99 235))',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            animation: 'fab-pulse-animation 4s infinite'
          }}
          data-testid="fab-upload-button"
          aria-label="Subir fotos y videos"
        >
          <Camera className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
          
          {/* Mobile touch indicator */}
          <span className="absolute inset-0 rounded-full bg-white opacity-0 group-active:opacity-20 transition-opacity duration-150 md:hidden"></span>
          
          {/* Hover ring effect */}
          <span className="absolute inset-0 rounded-full border-2 border-white opacity-0 group-hover:opacity-30 scale-100 group-hover:scale-110 transition-all duration-300 hidden md:block"></span>
        </button>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          event={event!}
          onClose={() => setShowUploadModal(false)}
        />
      )}

      {/* Content Viewer */}
      {selectedContentIndex !== null && (
        <ContentViewer
          content={allContent.filter(item => item.type === 'photo' || item.type === 'post')}
          currentIndex={selectedContentIndex}
          onClose={() => {
            setSelectedContentIndex(null);
            if (currentUser && event?.id) {
              // Invalidate cache when closing to ensure fresh data
              queryClient.invalidateQueries({ 
                queryKey: ["/api/events", event.id, "photos"],
                exact: false 
              });
            }
          }}
          onNavigate={(newIndex) => setSelectedContentIndex(newIndex)}
          currentUserId={currentUser?.id}
          currentUserName={currentUser?.name}
          eventId={event?.id || ""}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.isOpen} onOpenChange={(open) => 
        setDeleteDialog(prev => ({ ...prev, isOpen: open }))
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deletePhoto.isPending || deleteTextPost.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {(deletePhoto.isPending || deleteTextPost.isPending) ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}