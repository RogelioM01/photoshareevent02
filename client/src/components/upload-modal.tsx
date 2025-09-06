import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { X, ArrowLeft, Camera, Upload, FileText, PenTool } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useUploadPhotos, useCreateTextPost } from "@/hooks/use-photos";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import type { Event, EventUser } from "@shared/schema";

interface UploadModalProps {
  event: Event;
  onClose: () => void;
}

export default function UploadModal({ event, onClose }: UploadModalProps) {
  /* 
    ENHANCED GUEST USER HANDLING: Uses AuthContext directly for better synchronization
    This prevents the issue where users have to enter their name twice
  */
  const [dragActive, setDragActive] = useState(false);
  const [showTextPost, setShowTextPost] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Use AuthContext directly for better synchronization
  const { currentUser, isLoading: authLoading, setCurrentUser, refreshAuth } = useAuth();
  
  // Guest user form state - Initialize with proper check
  const [showGuestForm, setShowGuestForm] = useState(() => {
    // On initial load, check if there's a currentUser in localStorage
    const storedUser = localStorage.getItem("currentUser");
    return !storedUser;
  });
  const [guestName, setGuestName] = useState("");
  const [tempUser, setTempUser] = useState<EventUser | null>(null);
  
  const { toast } = useToast();
  const uploadPhotos = useUploadPhotos();
  const createTextPost = useCreateTextPost();

  // ENHANCED SYNCHRONIZATION: React to currentUser changes from AuthContext
  useEffect(() => {
    // Force a refresh of auth state when modal opens to catch any localStorage changes
    refreshAuth();
  }, []); // Run once when modal mounts

  useEffect(() => {
    // Only show guest form if we have no currentUser and auth is not loading
    if (!authLoading) {
      // Double-check localStorage as final verification
      const storedUser = localStorage.getItem("currentUser");
      const hasStoredUser = !!storedUser;
      const shouldShowForm = !currentUser && !hasStoredUser;
      
      setShowGuestForm(shouldShowForm);
      setTempUser(currentUser);
    }
  }, [currentUser, authLoading, refreshAuth]);

  // Handle guest user form submission
  const handleGuestSubmit = () => {
    if (!guestName.trim()) {
      toast({
        title: "Nombre requerido",
        description: "Por favor ingresa tu nombre para continuar",
        variant: "destructive",
      });
      return;
    }

    // Create a temporary user for this session
    const newTempUser: EventUser = {
      id: `guest-${Date.now()}`, // Temporary ID for session
      name: guestName.trim(),
      eventId: event.id,
      createdAt: new Date() // Add required createdAt field
    };

    // Store in localStorage and update AuthContext
    localStorage.setItem("currentUser", JSON.stringify(newTempUser));
    setCurrentUser(newTempUser); // Update AuthContext directly
    
    setTempUser(newTempUser);
    setShowGuestForm(false);
    
    toast({
      title: "¡Bienvenido!",
      description: "Ahora puedes subir fotos y crear publicaciones",
      variant: "default",
    });
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFiles = async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/mov', 'video/quicktime'];
      const maxSize = 20 * 1024 * 1024; // 20MB
      return validTypes.includes(file.type) && file.size <= maxSize;
    });

    if (validFiles.length === 0) {
      toast({
        title: "Archivos inválidos",
        description: "Por favor selecciona archivos de imagen o video válidos (máximo 20MB cada uno)",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 10;
      });
    }, 200);

    try {
      const userToUse = tempUser || currentUser;
      if (!userToUse) {
        setShowGuestForm(true);
        setIsUploading(false);
        clearInterval(progressInterval);
        return;
      }

      // Create a new DataTransfer object and add files properly
      const dataTransfer = new DataTransfer();
      validFiles.forEach(file => {
        dataTransfer.items.add(file);
      });

      console.log("🚀 Starting photo upload...", {
        eventId: event.id,
        userId: userToUse.id,
        userName: userToUse.name,
        fileCount: dataTransfer.files.length,
        files: Array.from(dataTransfer.files).map(f => ({ name: f.name, size: f.size, type: f.type }))
      });

      const uploadResult = await uploadPhotos.mutateAsync({
        eventId: event.id,
        userId: userToUse.id,
        files: dataTransfer.files,
      });

      console.log("✅ Upload mutation completed successfully", uploadResult);

      setUploadProgress(100);
      toast({
        title: "¡Éxito!",
        description: "Fotos subidas exitosamente",
      });
      
      setTimeout(() => {
        onClose();
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Upload error:", error);
      toast({
        title: "Error al subir",
        description: error instanceof Error ? error.message : "Error al subir las fotos. Por favor intenta de nuevo.",
        variant: "destructive",
      });
      setIsUploading(false);
      setUploadProgress(0);
    }
    
    clearInterval(progressInterval);
  };

  const handleTextPost = async () => {
    if (!textContent.trim()) return;

    const userToUse = tempUser || currentUser;
    if (!userToUse) {
      setShowGuestForm(true);
      return;
    }

    try {
      await createTextPost.mutateAsync({
        eventId: event.id,
        userId: userToUse.id,
        userName: userToUse.name,
        content: textContent.trim(),
      });

      toast({
        title: "¡Éxito!",
        description: "Publicación de texto compartida exitosamente",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error al publicar",
        description: "Por favor intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onClose}
              className="flex items-center space-x-2 text-event-secondary hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Volver al álbum</span>
            </button>
            <button
              onClick={onClose}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Event Info - Hidden per user request */}
          <div className="text-center mb-8" style={{display: 'none'}}>
            <h2 className="text-xl font-bold text-gray-800">{event.title}</h2>
          </div>

          {showGuestForm ? (
            /* Guest User Form */
            <div className="space-y-6">
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="guestName">Tu nombre</Label>
                  <Input
                    id="guestName"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Ingresa tu nombre..."
                    className="mt-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleGuestSubmit();
                      }
                    }}
                  />
                </div>
                
                <Button
                  onClick={handleGuestSubmit}
                  disabled={!guestName.trim()}
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                >
                  ¡Continuar!
                </Button>
              </div>
            </div>
          ) : isUploading ? (
            /* Upload Progress */
            <div className="space-y-4">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-gray-600 text-center">
                Subiendo... {Math.round(uploadProgress)}%
              </p>
            </div>
          ) : showTextPost ? (
            /* Text Post Area */
            <div className="space-y-4">
              <Textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Comparte tus pensamientos, recuerdos o mensajes..."
                className="min-h-32 resize-none"
              />
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setShowTextPost(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleTextPost}
                  disabled={!textContent.trim() || createTextPost.isPending}
                  className="flex-1 bg-event-secondary hover:bg-gray-700 text-white"
                >
                  {createTextPost.isPending ? "Publicando..." : "Publicar"}
                </Button>
              </div>
            </div>
          ) : (
            /* Upload Area */
            <div className="space-y-6">
              <div
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${
                  dragActive 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-blue-300 bg-blue-50/50 hover:bg-blue-100/50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.multiple = true;
                  input.accept = "image/*,video/*";
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files) handleFiles(files);
                  };
                  input.click();
                }}
              >
                <div className="w-16 h-16 bg-blue-400 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-blue-700 mb-2">
                  Agrega tus Fotos
                </h3>
              </div>

              {/* Text Post Option */}
              <div
                className="border-2 border-dashed border-gray-300 bg-gray-50/50 hover:bg-gray-100/50 rounded-2xl p-4 transition-colors cursor-pointer flex items-center justify-center"
                onClick={() => setShowTextPost(true)}
              >
                <PenTool className="w-5 h-5 text-gray-600 mr-3" />
                <span className="text-gray-700 font-medium">Escribe un mensaje</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
