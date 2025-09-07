  /*
  * IMPORTANT: Check setDeleteDialog state reset
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
            {/* Fotos y Videos Section */}
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

            {/* Separator for Messages */}
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

                {/* Messages Section */}
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