import { useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAuthUser } from "@/lib/auth";
import { Settings, User, Calendar, ArrowLeft, Upload, Image, Download, Loader2 } from "lucide-react";
import QRInline from "@/components/qr-inline";
import QRModal from "@/components/qr-modal";
import BackgroundSelector from "@/components/background-selector";
import { usePersonalEvent, type PersonalEventFormData } from "@/hooks/usePersonalEvent";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  /* 
    REACT QUERY MIGRATION: Simplified state management
    - Removed personalEvent, loading, saving, uploadingCover, downloadingZip states
    - All data fetching and mutations now handled by usePersonalEvent hook
    - Single source of truth with automatic cache management
    - Eliminated useEffect for data fetching
  */
  const [formData, setFormData] = useState<PersonalEventFormData>({
    title: "",
    description: "",
    coverImageUrl: "",
    backgroundType: "gradient",
    backgroundValue: "from-white to-gray-300"
  });
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = getAuthUser();

  // React Query hook replaces useEffect and manual state management
  const {
    personalEvent,
    isLoading,
    updateEvent,
    uploadCover,
    downloadZip,
    isUpdating,
    isUploadingCover,
    isDownloadingZip,
    coverUploadResult
  } = usePersonalEvent(currentUser?.username);

  // Redirect if not authenticated
  if (!currentUser) {
    setLocation("/");
    return null;
  }



  const handleSave = async () => {
    // Prevent multiple clicks during save
    if (isUpdating) return;
    
    console.log("Dashboard: handleSave started", { formData, currentUser: currentUser?.username });
    
    // Use React Query mutation instead of manual fetch
    updateEvent(formData);
    
    // Close modals on successful save (handled by mutation success callback)
    setIsEditing(false);
    setIsCustomizing(false);
  };

  const handleCoverImageUpload = async (file: File) => {
    if (!currentUser) return;

    setUploadingCover(true);
    
    try {
      const formData = new FormData();
      formData.append('coverImage', file);

      const response = await fetch(`/api/evento/${currentUser.username}/cover-image`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update the personal event with the new cover image
        setPersonalEvent(result.event);
        setFormData(prev => ({
          ...prev,
          coverImageUrl: result.url
        }));
        
        toast({
          title: "Éxito",
          description: "Imagen de portada actualizada correctamente",
        });
      } else {
        throw new Error("Failed to upload cover image");
      }
    } catch (error) {
      console.error("Error uploading cover image:", error);
      toast({
        title: "Error",
        description: "No se pudo subir la imagen de portada",
        variant: "destructive",
      });
    } finally {
      setUploadingCover(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Solo se permiten archivos de imagen",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "El archivo es demasiado grande. Máximo 5MB",
          variant: "destructive",
        });
        return;
      }
      
      handleCoverImageUpload(file);
    }
  };

  const handleBackgroundImageUpload = async (file: File): Promise<string> => {
    setUploadingBackground(true);
    
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: uploadFormData,
      });

      if (response.ok) {
        const { url } = await response.json();
        toast({
          title: "Éxito",
          description: "Imagen de fondo subida correctamente",
        });
        return url;
      } else {
        throw new Error('Error al subir la imagen de fondo');
      }
    } catch (error) {
      console.error('Error uploading background image:', error);
      toast({
        title: "Error",
        description: "No se pudo subir la imagen de fondo",
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploadingBackground(false);
    }
  };

  const handleBackgroundChange = (type: string, value: string) => {
    // Only update if values actually changed
    if (formData.backgroundType !== type || formData.backgroundValue !== value) {
      setFormData(prev => ({
        ...prev,
        backgroundType: type,
        backgroundValue: value
      }));
    }
  };

  const handleViewEvent = () => {
    setLocation(`/evento/${currentUser?.username}`);
  };

  const handleDownloadZip = async () => {
    if (!personalEvent) return;
    
    setDownloadingZip(true);
    try {
      const response = await fetch(`/api/events/${personalEvent.id}/download-zip`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al descargar');
      }
      
      // Create blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${personalEvent.title.replace(/[^a-zA-Z0-9]/g, '_')}_galeria.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Éxito",
        description: "Galería descargada correctamente",
      });
    } catch (error) {
      console.error('Error downloading ZIP:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo descargar la galería",
        variant: "destructive",
      });
    } finally {
      setDownloadingZip(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => setLocation(`/evento/${currentUser?.username}`)}
            className="mb-6 bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-gray-50/90 hover:border-gray-300 shadow-sm transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Mi Evento
          </Button>
          
          <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <span className="text-xl font-bold">
                  {currentUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">{currentUser.fullName}</h1>
                <p className="text-gray-300 text-sm">Panel de Control</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Event Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Tu Evento Personal</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {personalEvent && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src={personalEvent.coverImageUrl}
                        alt="Event cover"
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold">{personalEvent.title}</h3>
                        <p className="text-gray-600 text-sm">{personalEvent.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button onClick={handleViewEvent} className="flex-1 bg-sky-400 hover:bg-sky-500 text-white">
                        Ver Tu Evento
                      </Button>
                      {/* 
                        ADMIN PHOTOS BUTTON: Navigate to user's personal gallery with admin privileges
                        
                        URL FORMAT: /evento/{username}-album
                        - Uses new URL structure for direct gallery access
                        - Automatically enables admin mode for authenticated event owners
                        - Gallery component detects ownership by comparing URL username with authUser
                        
                        DEBUG NOTES:
                        - If admin mode not working: verify currentUser.username matches URL parameter
                        - Gallery should show "Administrador" indicator and delete buttons when working
                        - Check browser localStorage for 'authUser' if admin detection fails
                      */}
                      <Button 
                        onClick={() => setLocation(`/evento/${currentUser?.username}-album`)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                      >
                        Administrar fotos
                      </Button>
                    </div>
                    
                    {/* Edit Button - moved above QR */}
                    <div className="pt-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          /* 
                            SINGLE SOURCE OF TRUTH: personalEvent data copied to formData only when modal opens
                            - This ensures form always starts with latest server data  
                            - Prevents synchronization issues between server state and form state
                            - personalEvent remains the authoritative source for display
                          */
                          if (personalEvent) {
                            setFormData({
                              title: personalEvent.title || "",
                              description: personalEvent.description || "",
                              coverImageUrl: personalEvent.coverImageUrl || "",
                              backgroundType: personalEvent.backgroundType || "gradient",
                              backgroundValue: personalEvent.backgroundValue || "from-white to-gray-300"
                            });
                          }
                          setIsEditing(true);
                        }}
                        className="w-full justify-start"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Editar detalles
                      </Button>
                    </div>
                    

                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Settings Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Acciones Rápidas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      /* 
                        FIXED: Single source of truth for customization modal
                        - Copy latest personalEvent data when opening customization modal
                        - Both edit and customize modals now use identical data initialization logic
                        - Unified approach prevents data inconsistencies
                      */
                      if (personalEvent) {
                        setFormData({
                          title: personalEvent.title || "",
                          description: personalEvent.description || "",
                          coverImageUrl: personalEvent.coverImageUrl || "",
                          backgroundType: personalEvent.backgroundType || "gradient",
                          backgroundValue: personalEvent.backgroundValue || "from-white to-gray-300"
                        });
                      }
                      setIsCustomizing(true);
                    }}
                  >
                    <Image className="w-4 h-4 mr-2" />
                    Personalizar Página
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-sky-600 hover:text-sky-700 border-sky-200 hover:border-sky-300 hover:bg-sky-50"
                    onClick={handleViewEvent}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Ver Página del Evento
                  </Button>
                  
                  {/* 
                    FIXED: Unified URL format for admin photos access
                    - Changed from legacy /event/title format to new /evento/username-album format  
                    - Now matches the other "Administrar fotos" button for consistency
                    - Ensures admin mode detection works properly
                  */}
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    onClick={() => setLocation(`/evento/${currentUser?.username}-album`)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Administrar fotos
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-green-600 hover:text-green-700 border-green-200 hover:border-green-300 hover:bg-green-50"
                    onClick={handleDownloadZip}
                    disabled={downloadingZip}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {downloadingZip ? "Creando ZIP..." : "Descargar Todo (ZIP)"}
                  </Button>
                  
                  {/* QR Code Section */}
                  {personalEvent && (
                    <QRInline 
                      eventUrl={`${window.location.origin}/evento/${currentUser?.username}`}
                      eventTitle={personalEvent.title}
                      buttonVariant="outline"
                      buttonText="QR de mi evento"
                      buttonIcon={true}
                      showQRPermanently={true}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Editar Tu Evento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Título del Evento</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ingresa el título del evento"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ingresa la descripción del evento"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="coverImage">Imagen de Portada</Label>
                  <div className="space-y-2">
                    {/* Current cover image preview */}
                    {formData.coverImageUrl && (
                      <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                        <img
                          src={formData.coverImageUrl}
                          alt="Vista previa de portada"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {/* File input and upload button */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingCover}
                        className="flex items-center space-x-2"
                      >
                        {uploadingCover ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        <span>
                          {uploadingCover ? "Subiendo..." : "Seleccionar Imagen"}
                        </span>
                      </Button>
                      <span className="text-sm text-gray-500">
                        JPG, PNG, GIF (máx. 5MB)
                      </span>
                    </div>
                  </div>
                </div>


                
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="flex-1 bg-sky-400 hover:bg-sky-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    disabled={saving}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Background Customization Modal */}
        {isCustomizing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Personalizar Página del Evento</CardTitle>
              </CardHeader>
              <CardContent>
                <BackgroundSelector
                  backgroundType={formData.backgroundType}
                  backgroundValue={formData.backgroundValue}
                  onBackgroundChange={handleBackgroundChange}
                  onImageUpload={handleBackgroundImageUpload}
                  isUploading={uploadingBackground}
                />
                
                <div className="flex space-x-2 mt-6">
                  <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="flex-1 bg-sky-400 hover:bg-sky-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCustomizing(false)}
                    disabled={saving}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}