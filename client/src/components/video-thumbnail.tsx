import { useState } from "react";
import { Play, Trash2 } from "lucide-react";

interface VideoThumbnailProps {
  videoUrl: string;
  fileName: string;
  userName: string;
  onClick?: () => void;
  className?: string;
  onDelete?: () => void;
  showDeleteButton?: boolean;
}

export default function VideoThumbnail({ 
  videoUrl, 
  fileName, 
  userName, 
  onClick,
  className = "",
  onDelete,
  showDeleteButton = false
}: VideoThumbnailProps) {
  const [thumbnailError, setThumbnailError] = useState(false);
  
  // Extract public_id from Cloudinary URL for thumbnail generation
  const getCloudinaryPublicId = (url: string): string | null => {
    try {
      // Match Cloudinary URL pattern: https://res.cloudinary.com/[cloud_name]/[resource_type]/upload/[public_id]
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.([^.]+)$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  // Generate thumbnail URL using Cloudinary video thumbnail transformation
  const getThumbnailUrl = (videoUrl: string): string => {
    const publicId = getCloudinaryPublicId(videoUrl);
    
    if (!publicId) {
      return getPlaceholderThumbnail();
    }

    // Create thumbnail URL using Cloudinary transformation
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME; // Get from environment
    return `https://res.cloudinary.com/${cloudName}/video/upload/w_400,h_300,c_fill,q_auto,f_jpg,so_2/${publicId}.jpg`;
  };

  // Fallback placeholder thumbnail
  const getPlaceholderThumbnail = (): string => {
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#f3f4f6"/>
        <g transform="translate(200, 150)">
          <circle cx="0" cy="0" r="30" fill="#9ca3af"/>
          <polygon points="-10,-12 -10,12 15,0" fill="white"/>
        </g>
        <text x="200" y="200" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" fill="#6b7280">
          Video
        </text>
      </svg>
    `)}`;
  };

  const thumbnailUrl = thumbnailError ? getPlaceholderThumbnail() : getThumbnailUrl(videoUrl);

  return (
    <div 
      className={`relative w-full h-full cursor-pointer group ${className}`}
      onClick={onClick}
    >
      <img 
        src={thumbnailUrl}
        alt={`Thumbnail de ${fileName}`}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        onError={() => setThumbnailError(true)}
      />
      
      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-black bg-opacity-50 rounded-full p-3 group-hover:bg-opacity-70 transition-all duration-200">
          <Play className="w-6 h-6 text-white fill-white" />
        </div>
      </div>
      
      {/* Delete button - only show for video owner */}
      {showDeleteButton && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      
      {/* Video indicator badge */}
      <div className="absolute top-2 left-2 bg-event-secondary text-white rounded-full p-1">
        <Play className="w-3 h-3" />
      </div>
      
      {/* Info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-200">
        <div className="flex items-center space-x-2 mb-1">
          <span className="px-2 py-1 bg-white text-gray-800 text-xs font-medium rounded-full shadow-sm">
            {userName}
          </span>
        </div>
        <p className="text-white text-xs truncate">
          {fileName}
        </p>
      </div>
    </div>
  );
}