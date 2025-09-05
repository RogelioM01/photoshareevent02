import React, { memo, useCallback } from 'react';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import VideoThumbnail from './video-thumbnail';

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

interface PhotoGridItemProps {
  item: ContentItem;
  index: number;
  currentUser: any;
  isEventOwner: boolean;
  onItemClick: (item: ContentItem) => void;
  onLike: (photoId: string) => void;
  onDeletePhoto: (photoId: string, userId?: string) => void;
  onDeleteTextPost: (postId: string, userId?: string) => void;
}

/**
 * MEMOIZED PHOTO GRID ITEM
 * 
 * This component is memoized to prevent unnecessary re-renders when other items 
 * in the grid update. It only re-renders when its specific props change.
 */
const PhotoGridItem = memo(function PhotoGridItem({
  item,
  index,
  currentUser,
  isEventOwner,
  onItemClick,
  onLike,
  onDeletePhoto,
  onDeleteTextPost
}: PhotoGridItemProps) {
  
  // Memoize click handlers to prevent unnecessary re-renders
  const handleItemClick = useCallback(() => {
    onItemClick(item);
  }, [item, onItemClick]);

  const handleLikeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentUser) {
      onLike(item.id);
    }
  }, [item.id, currentUser, onLike]);

  const handleDeletePhoto = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onDeletePhoto(item.id, item.userId || undefined);
  }, [item.id, item.userId, onDeletePhoto]);

  const handleDeleteTextPost = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteTextPost(item.id, item.userId || undefined);
  }, [item.id, item.userId, onDeleteTextPost]);

  const handleCommentsClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentUser) {
      onItemClick(item);
    }
  }, [item, currentUser, onItemClick]);

  const showDeleteButton = !!(currentUser && (item.userId === currentUser.id || isEventOwner));

  return (
    <div 
      key={`${item.type}-${item.id}`} 
      className="aspect-square bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer group"
      onClick={handleItemClick}
    >
      {item.type === 'photo' ? (
        item.isVideo ? (
          <VideoThumbnail
            videoUrl={item.fileUrl!}
            fileName={item.originalName!}
            userName={item.userName}
            onClick={handleItemClick}
            showDeleteButton={showDeleteButton}
            onDelete={handleDeletePhoto}
          />
        ) : (
          <div className="relative w-full h-full">
            <img 
              src={item.fileUrl}
              alt={item.originalName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
            
            {/* Delete button - show for photo owner or event owner */}
            {showDeleteButton && (
              <button
                onClick={handleDeletePhoto}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            
            {/* Permanent action bar at bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 py-3 flex items-center justify-between">
              {/* User info */}
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <span className="px-2 py-1 bg-white/90 text-gray-800 text-xs font-medium rounded-full shadow-sm truncate">
                  {item.userName}
                </span>
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center space-x-3">
                {/* Like button with count - Always visible, interactive only when logged in */}
                <button
                  onClick={handleLikeClick}
                  disabled={!currentUser}
                  className={`flex items-center space-x-1 transition-transform ${
                    currentUser ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <Heart 
                    className={`w-4 h-4 ${
                      item.isLikedByCurrentUser 
                        ? 'text-red-500 fill-red-500' 
                        : 'text-white hover:text-red-400'
                    } transition-colors`}
                  />
                  <span className="text-white text-xs font-medium">
                    {item.likeCount || 0}
                  </span>
                </button>
                
                {/* Comments button with count - Always visible, interactive only when logged in */}
                <button
                  onClick={handleCommentsClick}
                  disabled={!currentUser}
                  className={`flex items-center space-x-1 transition-transform ${
                    currentUser ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <MessageCircle className="w-4 h-4 text-white hover:text-blue-400 transition-colors" />
                  <span className="text-white text-xs font-medium">
                    {item.commentCount || 0}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="relative p-4 h-full flex flex-col justify-center text-center bg-gradient-to-br from-gray-50 to-gray-100">
          {/* Delete button - show for post owner or event owner */}
          {showDeleteButton && (
            <button
              onClick={handleDeleteTextPost}
              className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          
          <p className="text-sm text-gray-700 line-clamp-4">{item.content}</p>
          <div className="mt-3 flex items-center justify-center">
            <span className="px-2 py-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-xs font-medium rounded-full shadow-sm">
              {item.userName}
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {new Date(item.createdAt).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  );
});

export default PhotoGridItem;