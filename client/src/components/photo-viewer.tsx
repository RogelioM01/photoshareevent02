import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Play, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLikePhoto, useUnlikePhoto } from "@/hooks/use-photos";
import type { PhotoWithUser } from "@shared/schema";

interface ContentItem {
  id: string;
  type: 'photo' | 'post';
  fileUrl?: string;
  originalName?: string;
  userName: string;
  userId: string;
  createdAt: string;
  isVideo?: boolean;
  content?: string;
  likeCount?: number;
  isLikedByCurrentUser?: boolean;
}

interface PhotoViewerProps {
  content: ContentItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  currentUserId?: string;
  eventId: string;
}

export default function PhotoViewer({ content, currentIndex, onClose, onNavigate, currentUserId, eventId }: PhotoViewerProps) {
  const [loading, setLoading] = useState(true);
  const currentItem = content[currentIndex];
  const likePhoto = useLikePhoto();
  const unlikePhoto = useUnlikePhoto();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, content.length, onClose, onNavigate]);

  const handlePrevious = () => {
    if (content.length <= 1) return;
    const newIndex = currentIndex > 0 ? currentIndex - 1 : content.length - 1;
    console.log('Previous clicked:', currentIndex, '→', newIndex);
    onNavigate(newIndex);
  };

  const handleNext = () => {
    if (content.length <= 1) return;
    const newIndex = currentIndex < content.length - 1 ? currentIndex + 1 : 0;
    console.log('Next clicked:', currentIndex, '→', newIndex);
    onNavigate(newIndex);
  };

  if (!currentItem) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-full w-full">
        {/* Close Button - Made more visible */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 hover:bg-white/20 z-10 bg-black/50 backdrop-blur-sm border border-white/20 rounded-full p-2"
        >
          <X className="w-8 h-8" />
        </Button>

        {/* Photo Container */}
        <div 
          className="bg-white rounded-lg overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {currentItem.isVideo ? (
            <video
              src={currentItem.fileUrl}
              controls
              className="max-w-full max-h-[80vh] object-contain"
              onLoadStart={() => setLoading(true)}
              onCanPlay={() => setLoading(false)}
            />
          ) : (
            <img
              src={currentItem.fileUrl}
              alt={currentItem.originalName}
              className="max-w-full max-h-[80vh] object-contain"
              onLoad={() => setLoading(false)}
              onError={() => setLoading(false)}
            />
          )}
          
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-event-pink"></div>
            </div>
          )}

          {/* Photo Info */}
          <div className="p-4 bg-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm font-medium rounded-full shadow-sm">
                  {currentItem.userName}
                </span>
                <span className="text-gray-500 text-sm">•</span>
                <span className="text-gray-600 text-sm font-medium">
                  {currentItem.originalName}
                </span>
              </div>
              
              {/* Like Button - Always visible, but only interactive when logged in */}
              <button
                onClick={() => {
                  if (currentUserId) {
                    if (currentItem.isLikedByCurrentUser) {
                      unlikePhoto.mutate({ photoId: currentItem.id, userId: currentUserId, eventId });
                    } else {
                      likePhoto.mutate({ photoId: currentItem.id, userId: currentUserId, eventId });
                    }
                  }
                }}
                disabled={!currentUserId || likePhoto.isPending || unlikePhoto.isPending}
                className={`flex items-center space-x-1 transition-transform disabled:opacity-50 ${
                  currentUserId ? 'hover:scale-110 cursor-pointer' : 'opacity-75 cursor-not-allowed'
                }`}
                title={currentUserId ? `${currentItem.likeCount || 0} me gusta` : 'Inicia sesión para dar me gusta'}
              >
                <Heart 
                  className={`w-5 h-5 transition-colors ${
                    currentItem.isLikedByCurrentUser && currentUserId
                      ? 'text-red-500 fill-red-500' 
                      : 'text-gray-400 hover:text-red-400'
                  }`} 
                />
                <span className="text-sm text-gray-600 font-medium">
                  {currentItem.likeCount || 0}
                </span>
              </button>
            </div>
            
            <p className="text-gray-500 text-sm">
              {new Date(currentItem.createdAt).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {currentIndex + 1} de {content.length}
            </p>
          </div>
        </div>

        {/* Navigation Arrows */}
        {content.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 hover:bg-white/20 bg-black/30 backdrop-blur-sm border border-white/20 rounded-full p-2 z-10"
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 hover:bg-white/20 bg-black/30 backdrop-blur-sm border border-white/20 rounded-full p-2 z-10"
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
