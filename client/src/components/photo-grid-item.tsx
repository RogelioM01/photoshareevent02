import React, { memo, useCallback } from 'react';
import { Heart, MessageCircle, Trash2, PartyPopper, Gift, Users, Coffee, Music, Camera, Star } from 'lucide-react';
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

// Theme detection system
interface MessageTheme {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  bgGradient: string;
}

const MESSAGE_THEMES: Record<string, MessageTheme> = {
  celebration: {
    name: 'Celebración',
    icon: PartyPopper,
    gradient: 'from-yellow-400 via-orange-500 to-red-500',
    bgGradient: 'from-yellow-50 via-orange-50 to-red-50'
  },
  gratitude: {
    name: 'Agradecimiento',
    icon: Gift,
    gradient: 'from-purple-400 via-pink-500 to-red-500',
    bgGradient: 'from-purple-50 via-pink-50 to-red-50'
  },
  social: {
    name: 'Social',
    icon: Users,
    gradient: 'from-blue-400 via-cyan-500 to-teal-500',
    bgGradient: 'from-blue-50 via-cyan-50 to-teal-50'
  },
  food: {
    name: 'Comida',
    icon: Coffee,
    gradient: 'from-amber-400 via-orange-500 to-yellow-500',
    bgGradient: 'from-amber-50 via-orange-50 to-yellow-50'
  },
  music: {
    name: 'Música',
    icon: Music,
    gradient: 'from-violet-400 via-purple-500 to-indigo-500',
    bgGradient: 'from-violet-50 via-purple-50 to-indigo-50'
  },
  photo: {
    name: 'Fotografía',
    icon: Camera,
    gradient: 'from-gray-400 via-gray-500 to-slate-500',
    bgGradient: 'from-gray-50 via-gray-50 to-slate-50'
  },
  special: {
    name: 'Especial',
    icon: Star,
    gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
    bgGradient: 'from-emerald-50 via-teal-50 to-cyan-50'
  }
};

const THEME_KEYWORDS = {
  celebration: ['feliz', 'celebrar', 'fiesta', 'cumpleaños', 'aniversario', 'boda', 'graduación', 'éxito', 'logro', 'victoria', 'wow', 'increíble', 'genial', 'perfecto', 'hermoso', 'espectacular'],
  gratitude: ['gracias', 'agradezco', 'agradecido', 'bendecido', 'afortunado', 'privilegio', 'honor', 'aprecio', 'reconozco', 'valoro'],
  social: ['amigos', 'familia', 'juntos', 'equipo', 'grupo', 'reunión', 'encuentro', 'compañía', 'unidos', 'nosotros', 'todos'],
  food: ['comida', 'comer', 'delicioso', 'rico', 'sabroso', 'cocinar', 'chef', 'plato', 'cena', 'almuerzo', 'desayuno', 'brindis', 'vino', 'bebida'],
  music: ['música', 'cantar', 'bailar', 'concierto', 'banda', 'canción', 'melodía', 'ritmo', 'dj', 'baile', 'danza'],
  photo: ['foto', 'fotografía', 'imagen', 'recuerdo', 'momento', 'capturar', 'instantánea', 'selfie', 'retrato'],
  special: ['especial', 'único', 'maravilloso', 'extraordinario', 'mágico', 'inolvidable', 'memorable', 'sorprendente', 'fantástico', 'sublime']
};

function detectMessageTheme(content: string): MessageTheme {
  const normalizedContent = content.toLowerCase().trim();
  
  // Check each theme's keywords
  for (const [themeKey, keywords] of Object.entries(THEME_KEYWORDS)) {
    if (keywords.some(keyword => normalizedContent.includes(keyword))) {
      return MESSAGE_THEMES[themeKey];
    }
  }
  
  // Default theme for unmatched content
  return {
    name: 'General',
    icon: MessageCircle,
    gradient: 'from-blue-500 via-purple-500 to-pink-500',
    bgGradient: 'from-blue-50 via-purple-50 to-pink-50'
  };
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
    onItemClick(item);
  }, [item, onItemClick]);

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
                
                {/* Comments button with count - Always visible and interactive */}
                <button
                  onClick={handleCommentsClick}
                  className="flex items-center space-x-1 transition-transform hover:scale-110 cursor-pointer"
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
        <div className="relative p-6 h-full flex flex-col justify-center text-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50">
          {/* Delete button - show for post owner or event owner */}
          {showDeleteButton && (
            <button
              onClick={handleDeleteTextPost}
              className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          
          <p className="text-base font-medium text-gray-800 line-clamp-4 leading-relaxed mb-2">{item.content}</p>
          <div className="mt-3 flex items-center justify-center">
            <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-sm font-semibold rounded-full shadow-md hover:shadow-lg transition-shadow duration-200">
              {item.userName}
            </span>
          </div>
          <div className="text-sm text-gray-500 mt-2 font-medium">
            {new Date(item.createdAt).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  );
});

export default PhotoGridItem;