import { useState } from "react";
import { usePhotoComments, useAddPhotoComment, useDeletePhotoComment } from "@/hooks/use-photo-comments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trash2, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface PhotoCommentsProps {
  photoId: string;
  currentUserId?: string;
  currentUserName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PhotoComments({ 
  photoId, 
  currentUserId, 
  currentUserName,
  isOpen,
  onClose 
}: PhotoCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();
  
  const { data: comments = [], isLoading } = usePhotoComments(photoId);
  const addComment = useAddPhotoComment();
  const deleteComment = useDeletePhotoComment();

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !currentUserId || !currentUserName) return;

    try {
      await addComment.mutateAsync({
        photoId,
        userId: currentUserId,
        userName: currentUserName,
        comment: newComment.trim()
      });
      setNewComment("");
      toast({
        title: "Comentario agregado",
        description: "Tu comentario ha sido publicado exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el comentario",
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUserId) return;

    try {
      await deleteComment.mutateAsync({
        photoId,
        commentId,
        userId: currentUserId
      });
      toast({
        title: "Comentario eliminado",
        description: "El comentario ha sido eliminado exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el comentario",
        variant: "destructive",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center md:items-center"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-lg w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Comentarios ({comments.length})
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </Button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="text-center text-gray-500 py-8">
              Cargando comentarios...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No hay comentarios aún
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 group">
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-sm">
                    {comment.userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="px-2 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-full shadow-sm">
                        {comment.userName}
                      </span>
                      {currentUserId === comment.userId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={deleteComment.isPending}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-gray-800 dark:text-gray-200 text-sm">
                      {comment.comment}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-3 mt-1 block">
                    {formatDistanceToNow(new Date(comment.createdAt), { 
                      addSuffix: true, 
                      locale: es 
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Comment */}
        {currentUserId && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <Avatar className="w-8 h-8 mt-1">
                <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-sm">
                  {currentUserName?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Escribe un comentario..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitComment();
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  className="flex-1"
                  disabled={addComment.isPending}
                  autoComplete="off"
                />
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubmitComment();
                  }}
                  disabled={!newComment.trim() || addComment.isPending}
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {addComment.isPending ? "..." : "Enviar"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}