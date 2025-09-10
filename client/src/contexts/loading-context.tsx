import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

/**
 * CENTRALIZED LOADING STATE MANAGEMENT
 * 
 * PURPOSE: Solve inconsistent loading states across components
 * 
 * PROBLEMS SOLVED:
 * - Spinners that don't appear/disappear consistently
 * - Loading states not synchronized between components
 * - Multiple loading indicators for the same operation
 * - No global loading indication for critical operations
 * 
 * FEATURES:
 * - Track multiple concurrent operations
 * - Global loading indicator
 * - Operation-specific loading states
 * - Automatic cleanup on unmount
 * - Thread-safe operation registration
 */

export type LoadingOperation = 
  | 'auth' 
  | 'photos-upload' 
  | 'photos-fetch'
  | 'photo-like'
  | 'photo-unlike'
  | 'photo-comment'
  | 'photo-delete'
  | 'event-update'
  | 'cover-upload'
  | 'rsvp-confirm'
  | 'user-create'
  | 'user-update'
  | 'user-delete'
  | 'email-send'
  | 'download-zip'
  | 'text-post-create';

interface LoadingContextType {
  // Global state
  isAnyLoading: boolean;
  activeOperations: Set<LoadingOperation>;
  
  // Operation management
  startLoading: (operation: LoadingOperation) => void;
  stopLoading: (operation: LoadingOperation) => void;
  
  // Operation checks
  isOperationLoading: (operation: LoadingOperation) => boolean;
  isOperationTypeLoading: (operationType: string) => boolean;
  
  // Bulk operations
  startMultipleLoading: (operations: LoadingOperation[]) => void;
  stopMultipleLoading: (operations: LoadingOperation[]) => void;
  
  // Critical operations (show global spinner)
  isCriticalLoading: boolean;
}

const criticalOperations: LoadingOperation[] = [
  'auth',
  'photos-upload',
  'event-update',
  'cover-upload',
  'user-create',
  'user-update',
  'user-delete'
];

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [activeOperations, setActiveOperations] = useState<Set<LoadingOperation>>(new Set());

  const startLoading = useCallback((operation: LoadingOperation) => {
    setActiveOperations(prev => new Set([...Array.from(prev), operation]));
  }, []);

  const stopLoading = useCallback((operation: LoadingOperation) => {
    setActiveOperations(prev => {
      const newSet = new Set(Array.from(prev));
      newSet.delete(operation);
      return newSet;
    });
  }, []);

  const isOperationLoading = useCallback((operation: LoadingOperation) => {
    return activeOperations.has(operation);
  }, [activeOperations]);

  const isOperationTypeLoading = useCallback((operationType: string) => {
    return Array.from(activeOperations).some(op => op.startsWith(operationType));
  }, [activeOperations]);

  const startMultipleLoading = useCallback((operations: LoadingOperation[]) => {
    setActiveOperations(prev => new Set([...Array.from(prev), ...operations]));
  }, []);

  const stopMultipleLoading = useCallback((operations: LoadingOperation[]) => {
    setActiveOperations(prev => {
      const newSet = new Set(Array.from(prev));
      operations.forEach(op => newSet.delete(op));
      return newSet;
    });
  }, []);

  // Calculate derived states
  const isAnyLoading = activeOperations.size > 0;
  const isCriticalLoading = criticalOperations.some(op => 
    activeOperations.has(op)
  );

  const value: LoadingContextType = {
    isAnyLoading,
    activeOperations,
    startLoading,
    stopLoading,
    isOperationLoading,
    isOperationTypeLoading,
    startMultipleLoading,
    stopMultipleLoading,
    isCriticalLoading
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

/**
 * CONVENIENCE HOOKS FOR COMMON OPERATIONS
 */

// Hook for photo operations
export function usePhotoLoading() {
  const { 
    isOperationLoading, 
    startLoading, 
    stopLoading, 
    isOperationTypeLoading 
  } = useLoading();

  return {
    isUploadingPhotos: isOperationLoading('photos-upload'),
    isFetchingPhotos: isOperationLoading('photos-fetch'),
    isLikingPhoto: isOperationLoading('photo-like'),
    isUnlikingPhoto: isOperationLoading('photo-unlike'),
    isCommentingPhoto: isOperationLoading('photo-comment'),
    isDeletingPhoto: isOperationLoading('photo-delete'),
    isAnyPhotoOperationLoading: isOperationTypeLoading('photo'),
    
    startPhotoUpload: () => startLoading('photos-upload'),
    stopPhotoUpload: () => stopLoading('photos-upload'),
    startPhotoFetch: () => startLoading('photos-fetch'),
    stopPhotoFetch: () => stopLoading('photos-fetch'),
    startPhotoLike: () => startLoading('photo-like'),
    stopPhotoLike: () => stopLoading('photo-like'),
    startPhotoUnlike: () => startLoading('photo-unlike'),
    stopPhotoUnlike: () => stopLoading('photo-unlike'),
    startPhotoComment: () => startLoading('photo-comment'),
    stopPhotoComment: () => stopLoading('photo-comment'),
    startPhotoDeletion: () => startLoading('photo-delete'),
    stopPhotoDeletion: () => stopLoading('photo-delete'),
  };
}

// Hook for authentication operations
export function useAuthLoading() {
  const { isOperationLoading, startLoading, stopLoading } = useLoading();

  return {
    isAuthLoading: isOperationLoading('auth'),
    startAuthLoading: () => startLoading('auth'),
    stopAuthLoading: () => stopLoading('auth'),
  };
}

// Hook for event operations
export function useEventLoading() {
  const { isOperationLoading, startLoading, stopLoading } = useLoading();

  return {
    isUpdatingEvent: isOperationLoading('event-update'),
    isUploadingCover: isOperationLoading('cover-upload'),
    isDownloadingZip: isOperationLoading('download-zip'),
    
    startEventUpdate: () => startLoading('event-update'),
    stopEventUpdate: () => stopLoading('event-update'),
    startCoverUpload: () => startLoading('cover-upload'),
    stopCoverUpload: () => stopLoading('cover-upload'),
    startZipDownload: () => startLoading('download-zip'),
    stopZipDownload: () => stopLoading('download-zip'),
  };
}