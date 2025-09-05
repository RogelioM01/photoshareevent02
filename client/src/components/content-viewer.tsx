import React, { useState, useEffect, memo } from "react";
import { X, ChevronLeft, ChevronRight, Play, Heart, Download, MessageCircle } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Button } from "@/components/ui/button";
import { useLikePhoto, useUnlikePhoto } from "@/hooks/use-photos";
import { PhotoComments } from "./photo-comments";
import { logger } from "@/utils/logger";

/* 
 * CRITICAL: ContentItem Interface Synchronization
 * 
 * ISSUE FIXED: Type conflicts between components caused gallery not to load
 * SOLUTION: Keep interface identical across PhotoGridItem and ContentViewer
 * 
 * KEY REQUIREMENTS:
 * - userId: string | null (NOT string | undefined) 
 * - createdAt: string | Date (support both formats)
 * - Include all optional fields that API might return
 * 
 * WITHOUT THIS: TypeScript errors prevent compilation and gallery fails
 */
interface ContentItem {
  id: string;
  type: 'photo' | 'post';
  fileUrl?: string;
  originalName?: string;
  fileName?: string;
  userName: string;
  userId?: string | null;
  createdAt: string | Date;
  eventId?: string;
  fileType?: string;
  fileSize?: string;
  isVideo?: boolean;
  content?: string;
  likeCount?: number;
  isLikedByCurrentUser?: boolean;
  commentCount?: number;
}

interface ContentViewerProps {
  content: ContentItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  currentUserId?: string;
  currentUserName?: string;
  eventId: string;
}

/**
 * MEMOIZED CONTENT VIEWER
 * 
 * This component is memoized to prevent unnecessary re-renders when parent components update.
 * It only re-renders when its specific props change, improving performance for the modal.
 */
const ContentViewer = memo(function ContentViewer({ content, currentIndex, onClose, onNavigate, currentUserId, currentUserName, eventId }: ContentViewerProps) {
  const [loading, setLoading] = useState(true);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [showComments, setShowComments] = useState(false);
  const currentItem = content[currentIndex];
  const likePhoto = useLikePhoto();
  const unlikePhoto = useUnlikePhoto();

  // Touch handlers for swipe navigation - Updated to not interfere with image zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only handle navigation swipes on the backdrop, not on images with zoom
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG' || target.closest('.react-transform-wrapper')) {
      return;
    }
    
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Only handle navigation swipes on the backdrop, not on images with zoom
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG' || target.closest('.react-transform-wrapper')) {
      return;
    }
    
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > 50;
    const isRightSwipe = distanceX < -50;
    const isVerticalSwipe = Math.abs(distanceY) > Math.abs(distanceX);
    
    // Only handle horizontal swipes for navigation
    if (!isVerticalSwipe) {
      if (isLeftSwipe && content.length > 1) {
        handleNext();
      }
      if (isRightSwipe && content.length > 1) {
        handlePrevious();
      }
    }
  };

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
    onNavigate(newIndex);
  };

  const handleNext = () => {
    if (content.length <= 1) return;
    const newIndex = currentIndex < content.length - 1 ? currentIndex + 1 : 0;
    onNavigate(newIndex);
  };

  if (!currentItem) return null;

  return (
    <div 
      className="fixed inset-0 bg-black z-50"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative w-full h-full flex items-center justify-center">
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
              className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 hover:bg-white/20 z-10 bg-black/60 backdrop-blur-sm border border-white/30 rounded-full p-2 transition-all duration-200 md:left-4 md:p-3"
            >
              <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 hover:bg-white/20 z-10 bg-black/60 backdrop-blur-sm border border-white/30 rounded-full p-2 transition-all duration-200 md:right-4 md:p-3"
            >
              <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
            </Button>
          </>
        )}

        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 text-white hover:text-gray-300 hover:bg-white/20 z-20 bg-black/60 backdrop-blur-sm border border-white/30 rounded-full p-2 transition-all duration-200"
        >
          <X className="w-6 h-6" />
        </Button>

        {/* Content Container - Full screen optimized */}
        <div 
          className="w-full h-full relative flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {currentItem.type === 'photo' ? (
            /* Photo/Video Content */
            <>
              {currentItem.isVideo ? (
                <video
                  src={currentItem.fileUrl}
                  controls
                  className="w-full h-full max-w-full max-h-full object-contain"
                  onLoadStart={() => setLoading(true)}
                  onCanPlay={() => setLoading(false)}
                />
              ) : (
                <TransformWrapper
                  initialScale={1}
                  minScale={0.5}
                  maxScale={4}
                  centerOnInit={true}
                  doubleClick={{
                    disabled: false,
                    mode: "zoomIn",
                    step: 0.6,
                  }}
                  pinch={{
                    disabled: false,
                    step: 5,
                  }}
                  panning={{
                    disabled: false,
                    velocityDisabled: true,
                  }}
                  wheel={{
                    disabled: false,
                    step: 0.1,
                  }}
                  limitToBounds={true}
                  centerZoomedOut={true}
                  alignmentAnimation={{
                    sizeX: 100,
                    sizeY: 100,
                    velocityAlignmentTime: 200,
                  }}
                  velocityAnimation={{
                    sensitivity: 1,
                    animationTime: 200,
                  }}
                  onInit={() => setLoading(false)}
                >
                  <TransformComponent
                    wrapperClass="w-full h-full flex items-center justify-center"
                    contentClass="w-full h-full max-w-full max-h-full"
                  >
                    <img
                      src={currentItem.fileUrl}
                      alt={currentItem.originalName}
                      className="w-full h-full max-w-full max-h-full object-contain"
                      onLoad={() => setLoading(false)}
                      onError={() => setLoading(false)}
                      draggable={false}
                    />
                  </TransformComponent>
                </TransformWrapper>
              )}
              
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white border-t-2 border-t-transparent"></div>
                </div>
              )}

              {/* Floating badges - Top left: User, Top right: Actions */}
              <div className="absolute top-4 left-4 z-10">
                <span className="px-3 py-1.5 bg-black/70 backdrop-blur-sm text-white text-sm font-medium rounded-full border border-white/20">
                  {currentItem.userName}
                </span>
              </div>

              {/* Action buttons - Top right corner */}
              <div className="absolute top-4 right-16 flex items-center space-x-2 z-10">
                {/* Download button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Create download link
                    const link = document.createElement('a');
                    link.href = currentItem.fileUrl || '';
                    link.download = currentItem.originalName || 'photo.jpg';
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="p-2 bg-black/70 backdrop-blur-sm border border-white/20 rounded-full hover:bg-black/80 transition-colors"
                  title="Descargar foto"
                >
                  <Download className="w-4 h-4 text-white" />
                </button>

                {/* Comments Button - Only for photos */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowComments(true);
                  }}
                  className="flex items-center space-x-1 px-2 py-2 bg-black/70 backdrop-blur-sm border border-white/20 rounded-full hover:bg-black/80 transition-all"
                  title={`${currentItem.commentCount || 0} comentarios`}
                >
                  <MessageCircle className="w-4 h-4 text-white hover:text-blue-400 transition-colors" />
                  <span className="text-xs text-white font-medium">
                    {currentItem.commentCount || 0}
                  </span>
                </button>

                {/* Like Button - Always visible, but only interactive when logged in */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentUserId) {
                      if (currentItem.isLikedByCurrentUser) {
                        unlikePhoto.mutate({ photoId: currentItem.id, userId: currentUserId, eventId });
                      } else {
                        likePhoto.mutate({ photoId: currentItem.id, userId: currentUserId, eventId });
                      }
                    }
                  }}
                  disabled={!currentUserId || likePhoto.isPending || unlikePhoto.isPending}
                  className={`flex items-center space-x-1 px-2 py-2 bg-black/70 backdrop-blur-sm border border-white/20 rounded-full transition-all ${
                    currentUserId ? 'hover:bg-black/80 cursor-pointer' : 'opacity-75 cursor-not-allowed'
                  } disabled:opacity-50`}
                  title={currentUserId ? `${currentItem.likeCount || 0} me gusta` : 'Inicia sesión para dar me gusta'}
                >
                  <Heart 
                    className={`w-4 h-4 transition-colors ${
                      currentItem.isLikedByCurrentUser && currentUserId
                        ? 'text-red-500 fill-red-500' 
                        : 'text-white hover:text-red-400'
                    }`} 
                  />
                  <span className="text-xs text-white font-medium">
                    {currentItem.likeCount || 0}
                  </span>
                </button>
              </div>
            </>
          ) : (
            /* Text Post Content */
            <div className="p-6 min-h-[400px] max-h-[80vh] overflow-y-auto">
              <div className="mb-4">
                <span className="px-3 py-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm font-medium rounded-full shadow-sm">
                  {currentItem.userName}
                </span>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
                  {currentItem.content}
                </p>
              </div>
              
              <div className="text-sm text-gray-500">
                {new Date(currentItem.createdAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          )}
        </div>

        {/* Counter */}
        {content.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 border border-white/20">
            {currentIndex + 1} de {content.length}
          </div>
        )}

        {/* Photo Comments Modal */}
        {currentItem.type === 'photo' && (
          <PhotoComments
            photoId={currentItem.id}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            isOpen={showComments}
            onClose={() => setShowComments(false)}
          />
        )}
      </div>
    </div>
  );
});

export default ContentViewer;