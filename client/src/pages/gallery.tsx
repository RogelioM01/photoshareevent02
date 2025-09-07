import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import { GuestNameModal } from "@/components/guest-name-modal";
import VideoThumbnail from "@/components/video-thumbnail";
import { useAuth } from "@/contexts/auth-context";
import { generateTextPostImage } from "@/utils/text-to-image";
import PhotoGridItem from "@/components/photo-grid-item";
import { logger } from "@/utils/logger";

// Constante para desarrollo
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

export default function Gallery() {
  const params = useParams();
  const username = params.username || params.param || params[0];
  const queryClient = useQueryClient();

  // Refs para limpieza de timeouts
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedContentIndex, setSelectedContentIndex] = useState<number | null>(null);
  const [showGuestNameModal, setShowGuestNameModal] = useState(false);

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

  // Force auth refresh when Gallery component mounts
  useEffect(() => {
    refreshAuth();
  }, []); // Solo en mount

  const { data: photos = [], isLoading: photosLoading, error: photosError, dataUpdatedAt } = usePhotos(event?.id || "", effectiveUserId);

  // Debug logging solo en desarrollo
  useEffect(() => {
    if (IS_DEVELOPMENT) {
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
    }
  }, [photos.length, photosLoading, dataUpdatedAt]); // Reducidas dependencias

  const { data: textPosts = [], isLoading: textPostsLoading, error: textPostsError } = useTextPosts(event?.id || "");

  // Debug logging solo en desarrollo
  useEffect(() => {
    if (IS_DEVELOPMENT) {
      logger.log("📝 Gallery text posts state updated:", {
        textPostsCount: textPosts.length,
        textPostsLoading,
        textPostsError: textPostsError?.message,
        eventId: event?.id,
        textPostIds: textPosts.map(p => p.id)
      });
    }
  }, [textPosts.length, textPostsLoading]);

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

      setGeneratedImage(imageDataUrl);
      setSelectedTextPost(post);

    } catch (error) {
      logger.error('Error generating text image:', error);
    }
  };

  // Check if current user is the event owner
  const [isEventOwner, setIsEventOwner] = useState(false);

  useEffect(() => {
    if (authUser) {
      if (username && username.endsWith('-album')) {
        const eventUsername = username.replace('-album', '');
        const isOwner = authUser.username === eventUsername;

        if (IS_DEVELOPMENT) {
          console.log('Admin Detection (New Format):', {
            urlParam: username,
            eventUsername,
            authUsername: authUser.username,
            isOwner
          });
        }

        setIsEventOwner(isOwner);
      } else if (eventWithOwner?.ownerUsername) {
        const isOwner = authUser.username === eventWithOwner.ownerUsername;

        if (IS_DEVELOPMENT) {
          console.log('Admin Detection (Legacy Format):', {
            eventOwnerUsername: eventWithOwner.ownerUsername,
            authUsername: authUser.username,
            isOwner
          });
        }

        setIsEventOwner(isOwner);
      }
    } else {
      setIsEventOwner(false);
    }
  }, [authUser?.username, username, eventWithOwner?.ownerUsername]);

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

  const confirmDelete = async () => {
    if (!currentUser || !event || !deleteDialog.type) return;

    try {
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
    }
  };

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

  // CORREGIDO: Evitar loop infinito con useRef para tracking
  const hasSetCurrentUser = useRef(false);
  useEffect(() => {
    if (authUser && event?.id && !hasSetCurrentUser.current) {
      if (!currentUser || currentUser.id !== authUser.id) {
        const eventUser = {
          id: authUser.id,
          name: authUser.fullName,
          eventId: event.id,
          createdAt: new Date()
        };
        setCurrentUser(eventUser);
        hasSetCurrentUser.current = true;
      }
    }

    // Reset flag cuando cambia el authUser
    if (!authUser) {
      hasSetCurrentUser.current = false;
    }
  }, [authUser, event?.id, currentUser, setCurrentUser]);

  // CORREGIDO: Manejo de timeouts con limpieza
  useEffect(() => {
    if (event && !currentUser && !authLoading) {
      const timeout = setTimeout(() => {
        setShowUploadModal(true);
      }, 500);
      timeoutRefs.current.push(timeout);
    } else if (event && currentUser) {
      const visitKey = `gallery_visited_${event.id}_${currentUser.id}`;
      const hasVisited = localStorage.getItem(visitKey);

      if (!hasVisited) {
        localStorage.setItem(visitKey, 'true');
        const timeout = setTimeout(() => {
          setShowUploadModal(true);
        }, 1500);
        timeoutRefs.current.push(timeout);
      }
    }

    // Limpieza de timeouts
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current = [];
    };
  }, [event, currentUser, authLoading]);

  // Memoized content calculations
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

  // CORREGIDO: Callback optimizado sin dependencia de allContent
  const memoizedHandleItemClick = useCallback((item: any) => {
    if (!effectiveUserId) {
      setShowGuestNameModal(true);
      return;
    }

    // Buscar el índice en tiempo real en lugar de depender de allContent memoizado
    const currentContent = [
      ...photos.map(photo => ({ ...photo, type: 'photo' as const })),
      ...textPosts.map(post => ({ ...post, type: 'post' as const }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const contentIndex = currentContent.findIndex(c => c.id === item.id && c.type === item.type);
    setSelectedContentIndex(contentIndex);
  }, [effectiveUserId, photos, textPosts]);

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

  const getHeroBannerBackground = () => {
    return oldestPhoto ? oldestPhoto.fileUrl : event.coverImageUrl || "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=600";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="relative h-80 md:h-96 lg:h-[28rem] overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={getHeroBannerBackground()}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        <div className="relative h-full flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-3 drop-shadow-lg">
              {event.title}
            </h1>

            <Button 
              onClick={() => setShowUploadModal(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-full text-lg font-medium shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
            >
              Agregar fotos
            </Button>

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

        <div className="absolute bottom-4 right-4 flex items-center space-x-2 text-white">
          <span className="text-sm font-medium">
            {photos.filter(p => !p.isVideo).length} fotos • {textPosts.length} mensajes • {photos.filter(p => p.isVideo).length} videos
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
        ) : photos.length > 0 || textPosts.length > 0 ? (
          <div className="space-y-8">
            {photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((item, index) => (
                  <PhotoGridItem
                    key={`photo-${item.id}`}
                    item={{ ...item, type: 'photo' as const }}
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
            )}

            {textPosts.length > 0 && (
              <>
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-gray-50 px-6 py-2 text-gray-500 font-medium rounded-full">
                      Mensajes
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {textPosts.map((item, index) => (
                    <PhotoGridItem
                      key={`post-${item.id}`}
                      item={{ ...item, type: 'post' as const }}
                      index={photos.length + index}
                      currentUser={currentUser}
                      isEventOwner={isEventOwner}
                      onItemClick={memoizedHandleItemClick}
                      onLike={handleLikePhoto}
                      onDeletePhoto={handleDeletePhoto}
                      onDeleteTextPost={handleDeleteTextPost}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay fotos o publicaciones aún.</p>
            <p className="text-gray-400 mt-2">¡Sé el primero en subir algo!</p>
          </div>
        )}

        {/* Floating Action Button - Mejorado con clases CSS */}
        <button
          onClick={() => setShowUploadModal(true)}
          className="fab-upload-button"
          data-testid="fab-upload-button"
          aria-label="Subir fotos y videos"
        >
          <Camera className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
          <span className="absolute inset-0 rounded-full bg-white opacity-0 group-active:opacity-20 transition-opacity duration-150 md:hidden"></span>
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

      {/* Guest Name Modal */}
      <GuestNameModal
        isOpen={showGuestNameModal}
        onClose={() => setShowGuestNameModal(false)}
        eventId={event?.id || ""}
        onSuccess={() => {
          setShowGuestNameModal(false);
        }}
      />

      {/* Content Viewer */}
      {selectedContentIndex !== null && (
        <ContentViewer
          content={allContent.filter(item => item.type === 'photo' || item.type === 'post')}
          currentIndex={selectedContentIndex}
          onClose={() => {
            setSelectedContentIndex(null);
            if (currentUser && event?.id) {
              queryClient.invalidateQueries({ 
                queryKey: ["/api/events", event.id, "photos"],
                exact: false 
              });
            }
          }}
          onNavigate={(newIndex) => setSelectedContentIndex(newIndex)}
          currentUserId={effectiveUserId}
          currentUserName={currentUser?.name || 'Usuario Invitado'}
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

      <style jsx>{`
        .fab-upload-button {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 3.5rem;
          height: 3.5rem;
          background: linear-gradient(to right, rgb(59 130 246), rgb(37 99 235));
          color: white;
          border-radius: 9999px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          cursor: pointer;
          border: none;
          transition: all 0.3s ease;
          animation: fab-pulse-animation 4s infinite;
        }

        .fab-upload-button:hover {
          background: linear-gradient(to right, rgb(37 99 235), rgb(29 78 216));
          box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
          animation: none;
        }

        .fab-upload-button:active {
          transform: scale(0.95);
        }

        @keyframes fab-pulse-animation {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}