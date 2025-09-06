import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getAuthUser } from "@/lib/auth";
import { 
  ArrowLeft, 
  Settings, 
  Calendar, 
  MapPin, 
  Upload, 
  Loader2, 
  Users, 
  Bell,
  Palette,
  User,
  MessageSquare,
  UserCheck,
  CalendarIcon,
  Clock,
  Globe,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  Download,
  Image,
  Edit,
  QrCode
} from "lucide-react";
import BackgroundSelector from "@/components/background-selector";
import { usePersonalEvent, type PersonalEventFormData } from "@/hooks/usePersonalEvent";
import { AttendeeStats } from "@/components/attendee-stats";
import { QRScanner } from "@/components/qr-scanner";
import QRModal from "@/components/qr-modal";
import EventNotificationsSettings from "@/components/event-notifications-settings";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import { rockyButtonStyles, rockyLoadingStyles } from "@/styles/button-variants";

export default function EventSettings() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<PersonalEventFormData>({
    title: "",
    description: "",
    coverImageUrl: "",
    backgroundType: "gradient",
    backgroundValue: "from-white to-gray-300",
    eventDate: "",
    eventTime: "",
    timezone: "America/Mexico_City",
    eventPlace: "",
    eventAddress: "",
    enableAutoRedirect: false,
    maxCompanions: "2"
  });
  const [activeTab, setActiveTab] = useState("basico");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // TIMEZONE UTILITIES: Detect user's timezone automatically
  const getUserTimezone = () => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "America/Mexico_City"; // Fallback
    }
  };

  // DATE UTILITIES: Handle date conversions and formatting
  const parseEventDate = (dateString: string): Date | undefined => {
    if (!dateString) return undefined;
    try {
      const date = new Date(dateString + 'T00:00:00');
      return isNaN(date.getTime()) ? undefined : date;
    } catch {
      return undefined;
    }
  };

  const formatEventDate = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
  };

  const currentUser = getAuthUser();

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

  // Redirect if not authenticated - use useEffect to prevent infinite renders
  useEffect(() => {
    if (!currentUser) {
      setLocation("/");
    }
  }, [currentUser, setLocation]);

  // UTILITY FUNCTIONS for Registration Link Section
  const constructRegistrationUrl = () => {
    if (!currentUser?.username) return "";
    return `${window.location.origin}/evento/${currentUser.username}/registro`;
  };

  const copyRegistrationLink = async () => {
    const url = constructRegistrationUrl();
    if (!url) {
      toast({
        title: "Error",
        description: "No se pudo generar el enlace de registro",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "¡Enlace copiado!",
        description: "El enlace de registro se copió al portapapeles",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error al copiar",
        description: "No se pudo copiar el enlace al portapapeles",
        variant: "destructive",
      });
    }
  };

  const openRegistrationPage = () => {
    if (!currentUser?.username) return;
    const url = `/evento/${currentUser.username}/registro`;
    setLocation(url);
  };

  const openPhotoManagement = () => {
    if (!currentUser?.username) return;
    const url = `/evento/${currentUser.username}-album`;
    setLocation(url);
  };

  // AUTO-DETECT TIMEZONE: Set user's timezone on first load
  useEffect(() => {
    const userTimezone = getUserTimezone();
    setFormData(prev => ({
      ...prev,
      timezone: prev.timezone || userTimezone
    }));
  }, []);

  if (!currentUser) {
    return null;
  }

  // ⚠️ CRITICAL: SUPABASE-ONLY DATA LOADING - NO LOCALSTORAGE ALLOWED
  // 
  // MIGRATION COMPLETED JULY 27, 2025: All fields now from Supabase PostgreSQL only
  // 
  // 🚨 CRITICAL BUG PREVENTION:
  // - enableAutoRedirect MUST only come from personalEvent object (database)
  // - NEVER mix localStorage with database data for toggle fields
  // - Any localStorage usage for enableAutoRedirect breaks URL consistency
  //
  // ✅ VERIFIED WORKING ARCHITECTURE:
  // personalEvent.enableAutoRedirect → form state → handleSave → database
  // 
  // 🔧 DEBUGGING TOGGLE INCONSISTENCY:
  // 1. Check console for "✅ DATABASE: Loading all settings from Supabase"
  // 2. Verify enableAutoRedirect comes from personalEvent, not localStorage
  // 3. Check React Query cache invalidation after save operations
  const formDataWithStoredDates = useMemo(() => {
    if (!personalEvent || !currentUser) return null;

    // SUPABASE MIGRATION COMPLETE: All data loaded from database
    // Database now contains all date fields: eventDate, eventTime, timezone, enableAutoRedirect
    let eventData = {
      title: personalEvent.title || "",
      description: personalEvent.description || "",
      coverImageUrl: personalEvent.coverImageUrl || "",
      backgroundType: personalEvent.backgroundType || "gradient",
      backgroundValue: personalEvent.backgroundValue || "from-white to-gray-300",
      eventDate: personalEvent.eventDate || "", // Loaded from Supabase
      eventTime: personalEvent.eventTime || "", // Loaded from Supabase
      timezone: personalEvent.timezone || "America/Mexico_City", // Loaded from Supabase
      eventPlace: personalEvent.eventPlace ?? "", // Loaded from Supabase
      eventAddress: personalEvent.eventAddress ?? "", // Loaded from Supabase
      enableAutoRedirect: personalEvent.enableAutoRedirect || false // Loaded from Supabase
    };

    console.log('✅ DATABASE: Loading all settings from Supabase:', eventData);
    
    return eventData;
  }, [personalEvent?.id, personalEvent?.title, personalEvent?.description, personalEvent?.coverImageUrl, personalEvent?.backgroundType, personalEvent?.backgroundValue, personalEvent?.eventPlace, personalEvent?.eventAddress, personalEvent?.eventDate, personalEvent?.eventTime, personalEvent?.timezone, personalEvent?.enableAutoRedirect, currentUser?.username]);

  // FORM DATA SYNCHRONIZATION: Update form state when computed data changes
  //
  // DEBUGGING NOTES:
  // - This useEffect only runs when formDataWithStoredDates changes (memoized)
  // - If form doesn't update: Check if formDataWithStoredDates is null or unchanged
  // - If multiple updates occur: Check useMemo dependencies for unnecessary changes
  // - Console log shows final merged data: server + localStorage date overrides
  useEffect(() => {
    if (formDataWithStoredDates) {
      console.log('📝 FORM DATA: Setting final form data:', formDataWithStoredDates);
      setFormData(formDataWithStoredDates);
    }
  }, [formDataWithStoredDates]);

  // Update form when cover upload completes
  useEffect(() => {
    if (coverUploadResult?.url) {
      setFormData(prev => ({
        ...prev,
        coverImageUrl: coverUploadResult.url
      }));
    }
  }, [coverUploadResult]);

  // SUPABASE COMPLETE PERSISTENCE: All data saved to database
  //
  // MIGRATION COMPLETE: Database now contains all fields including dates and toggle
  // All settings (title, description, dates, timezone, enableAutoRedirect) saved to Supabase
  //
  // DEBUGGING CHECKLIST:
  // - If save fails: Check updateEvent mutation and server logs for database errors
  // - If UI doesn't update: Check React Query cache invalidation after server save
  // - If toggle inconsistent: Verify enableAutoRedirect is included in server update
  const handleSave = async () => {
    if (!personalEvent || !currentUser) return;

    try {
      console.log('💾 SAVING: Starting complete database save...', formData);
      console.log('🔍 SAVE DEBUG: Specific field values:', {
        eventDate: formData.eventDate,
        eventTime: formData.eventTime,
        eventPlace: formData.eventPlace,
        eventAddress: formData.eventAddress,
        timezone: formData.timezone
      });
      
      // SINGLE DATABASE SAVE: All settings including dates and toggle
      const completeUpdate = {
        title: formData.title,
        description: formData.description,
        coverImageUrl: formData.coverImageUrl,
        backgroundType: formData.backgroundType,
        backgroundValue: formData.backgroundValue,
        eventDate: formData.eventDate || null, // Explicit null for empty values
        eventTime: formData.eventTime || null, // Explicit null for empty values
        timezone: formData.timezone,
        eventPlace: formData.eventPlace || null, // Explicit null for empty values
        eventAddress: formData.eventAddress || null, // Explicit null for empty values
        enableAutoRedirect: formData.enableAutoRedirect
      };
      
      console.log('📤 SENDING TO SERVER:', completeUpdate);
      
      // Send complete update to server (triggers React Query cache invalidation)
      await updateEvent(completeUpdate);
      console.log('✅ SAVED: All settings to database successfully');
      
      toast({
        title: "¡Configuración guardada!",
        description: "Los cambios se han guardado correctamente en la base de datos.",
        duration: 3000
      });
      
    } catch (error) {
      console.error('❌ ERROR: Saving settings failed:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios. Inténtalo nuevamente.",
        variant: "destructive"
      });
    }
  };

  const handleCoverImageUpload = (file: File) => {
    if (!currentUser) return;
    uploadCover(file);
  };

  // ENHANCED DATE HANDLERS: Support for react-day-picker
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        eventDate: formatEventDate(date)
      }));
    }
    setIsDatePickerOpen(false);
  };

  const handleTimezoneAutoDetect = () => {
    const userTimezone = getUserTimezone();
    setFormData(prev => ({
      ...prev,
      timezone: userTimezone
    }));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando configuración...</span>
        </div>
      </div>
    );
  }

  if (!personalEvent) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p>No se pudo cargar la configuración del evento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header with breadcrumb */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Panel
        </Button>
        
        <div className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-lg p-6 text-white">
          <div className="flex items-center space-x-4">
            <QrCode 
              className="h-8 w-8 cursor-pointer hover:scale-110 transition-transform duration-200" 
              onClick={() => setIsQRModalOpen(true)}
            />
            <div>
              <h1 className="text-2xl font-bold">Mi evento</h1>
              <p className="text-gray-300">{personalEvent.title}</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basico" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Básico</span>
          </TabsTrigger>
          <TabsTrigger value="herramientas" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Herramientas</span>
          </TabsTrigger>
          <TabsTrigger value="apariencia" className="flex items-center space-x-2">
            <Palette className="w-4 h-4" />
            <span>Apariencia</span>
          </TabsTrigger>
          <TabsTrigger value="asistencia" className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4" />
            <span>Asistencia</span>
          </TabsTrigger>
          <TabsTrigger value="notificaciones" className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>Notificaciones</span>
          </TabsTrigger>
        </TabsList>

        {/* Pestaña Básico */}
        <TabsContent value="basico">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título del Evento</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Título del evento"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descripción del evento"
                      rows={4}
                    />
                  </div>

                  {/* HYBRID DATE-TIME SELECTOR: Horizontal layout with smart time dropdown */}
                  <div>
                    <Label className="text-base font-medium mb-3 block flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-2 text-blue-600" />
                      Fecha y Hora del Evento
                    </Label>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                      {/* Date Picker */}
                      <div>
                        <Label className="text-sm text-gray-600 mb-2 block">Fecha</Label>
                        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal h-10",
                                !formData.eventDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.eventDate ? (
                                parseEventDate(formData.eventDate) ? 
                                  format(parseEventDate(formData.eventDate)!, 'dd/MM/yyyy', { locale: es }) :
                                  formData.eventDate
                              ) : (
                                "Seleccionar fecha"
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <DayPicker
                              mode="single"
                              selected={formData.eventDate ? parseEventDate(formData.eventDate) : undefined}
                              onSelect={handleDateSelect}
                              locale={es}
                              disabled={{ before: new Date() }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Smart Time Selector */}
                      <div>
                        <Label className="text-sm text-gray-600 mb-2 block">Hora</Label>
                        <select
                          value={formData.eventTime}
                          onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                          className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="">Seleccionar hora</option>
                          
                          {/* Mañana */}
                          <optgroup label="🌅 Mañana">
                            <option value="09:00">09:00 AM</option>
                            <option value="10:00">10:00 AM</option>
                            <option value="11:00">11:00 AM</option>
                            <option value="12:00">12:00 PM</option>
                          </optgroup>
                          
                          {/* Tarde */}
                          <optgroup label="☀️ Tarde">
                            <option value="13:00">01:00 PM</option>
                            <option value="14:00">02:00 PM</option>
                            <option value="15:00">03:00 PM</option>
                            <option value="16:00">04:00 PM</option>
                            <option value="17:00">05:00 PM</option>
                            <option value="18:00">06:00 PM</option>
                          </optgroup>
                          
                          {/* Noche */}
                          <optgroup label="🌙 Noche">
                            <option value="19:00">07:00 PM</option>
                            <option value="20:00">08:00 PM</option>
                            <option value="21:00">09:00 PM</option>
                            <option value="22:00">10:00 PM</option>
                            <option value="23:00">11:00 PM</option>
                          </optgroup>
                          
                          {/* Personalizada */}
                          <optgroup label="⚙️ Personalizada">
                            <option value="custom">Hora personalizada...</option>
                          </optgroup>
                        </select>
                        
                        {/* Custom Time Input - shows when "custom" is selected */}
                        {formData.eventTime === "custom" && (
                          <div className="mt-2">
                            <Label className="text-xs text-gray-500 mb-1 block">Hora exacta</Label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                type="time"
                                onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                                className="pl-10 h-9"
                                placeholder="HH:MM"
                              />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Formato 24 horas (ej: 14:30)</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Selecciona cuando se realizará el evento (opcional pero recomendado)</p>
                  </div>

                  {/* TIMEZONE SELECTOR: Hidden as requested by user */}
                  <div className="hidden">
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="timezone">Zona Horaria</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleTimezoneAutoDetect}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        <Globe className="w-3 h-3 mr-1" />
                        Auto-detectar
                      </Button>
                    </div>
                    <select
                      id="timezone"
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="America/Mexico_City">Ciudad de México (UTC-6)</option>
                      <option value="America/New_York">Nueva York (UTC-5)</option>
                      <option value="America/Los_Angeles">Los Ángeles (UTC-8)</option>
                      <option value="America/Chicago">Chicago (UTC-6)</option>
                      <option value="America/Denver">Denver (UTC-7)</option>
                      <option value="America/Phoenix">Phoenix (UTC-7)</option>
                      <option value="America/Vancouver">Vancouver (UTC-8)</option>
                      <option value="America/Toronto">Toronto (UTC-5)</option>
                      <option value="Europe/Madrid">Madrid (UTC+1)</option>
                      <option value="Europe/London">Londres (UTC+0)</option>
                      <option value="Europe/Paris">París (UTC+1)</option>
                      <option value="Europe/Rome">Roma (UTC+1)</option>
                      <option value="Europe/Berlin">Berlín (UTC+1)</option>
                      <option value="Asia/Tokyo">Tokio (UTC+9)</option>
                      <option value="Asia/Shanghai">Shanghai (UTC+8)</option>
                      <option value="Asia/Dubai">Dubai (UTC+4)</option>
                      <option value="Australia/Sydney">Sídney (UTC+11)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Zona horaria del evento para coordinación global</p>
                  </div>

                  {/* LOCATION FIELDS: Lugar y Dirección - Nuevos campos implementados */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="eventPlace">Lugar</Label>
                      <Input
                        id="eventPlace"
                        value={formData.eventPlace || ""}
                        onChange={(e) => setFormData({ ...formData, eventPlace: e.target.value })}
                        placeholder="Ej: Casa de María, Restaurante El Jardín, Parque Central"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">Nombre o tipo de lugar donde se realizará el evento</p>
                    </div>

                    <div>
                      <Label htmlFor="eventAddress">Dirección</Label>
                      <Input
                        id="eventAddress"
                        value={formData.eventAddress || ""}
                        onChange={(e) => setFormData({ ...formData, eventAddress: e.target.value })}
                        placeholder="Dirección específica o detalles de ubicación"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">Dirección o detalles específicos del lugar (opcional)</p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Imagen de Perfil</Label>
                  <div className="space-y-4">
                    {formData.coverImageUrl && (
                      <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                        <img
                          src={formData.coverImageUrl}
                          alt="Vista previa"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleCoverImageUpload(file);
                      }}
                      className="hidden"
                    />
                    
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingCover}
                      className="w-full"
                    >
                      {isUploadingCover ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Subir Imagen
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500">JPG, PNG, GIF (máx. 5MB)</p>
                  </div>
                </div>
              </div>


              <Separator />
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleSave} 
                  disabled={isUpdating}
                  className={rockyButtonStyles.primary}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className={rockyLoadingStyles.spinner} />
                      <span className={rockyLoadingStyles.text}>Guardando...</span>
                    </>
                  ) : (
                    <span className="text-white font-semibold">Guardar Cambios</span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña Herramientas */}
        <TabsContent value="herramientas">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Herramientas de Gestión
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Download Gallery Section */}
              <div className="border border-blue-200 rounded-lg p-6 bg-blue-50/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <Download className="w-6 h-6 text-blue-600 mr-3" />
                      <Label className="text-lg font-semibold text-blue-900">
                        Descargar Galería Completa
                      </Label>
                    </div>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      Descarga todas las fotos y publicaciones de texto de tu evento en un archivo ZIP. 
                      Incluye imágenes en alta calidad y un documento con todos los mensajes de texto compartidos.
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-center pt-4 border-t border-blue-200">
                  <Button 
                    onClick={downloadZip}
                    disabled={isDownloadingZip}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                    size="lg"
                    data-testid="button-download-gallery-zip"
                  >
                    {isDownloadingZip ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                        Preparando descarga...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 mr-3" />
                        Descargar Galería (ZIP)
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Photo Management Section */}
              <div className="border border-orange-200 rounded-lg p-6 bg-orange-50/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <Image className="w-6 h-6 text-orange-600 mr-3" />
                      <Label className="text-lg font-semibold text-orange-900">
                        Administrar Fotos y Videos
                      </Label>
                    </div>
                    <p className="text-sm text-orange-700 leading-relaxed">
                      Accede a la galería completa de tu evento para administrar, editar y eliminar fotos y videos. 
                      Tienes control total sobre el contenido compartido en tu evento.
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-center pt-4 border-t border-orange-200">
                  <Button 
                    onClick={openPhotoManagement}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 text-base font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                    size="lg"
                    data-testid="button-manage-photos"
                  >
                    <Edit className="w-5 h-5 mr-3" />
                    Administrar Fotos
                  </Button>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="border border-purple-200 rounded-lg p-6 bg-purple-50/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <QrCode className="w-6 h-6 text-purple-600 mr-3" />
                      <Label className="text-lg font-semibold text-purple-900">
                        QR de mi Evento
                      </Label>
                    </div>
                    <p className="text-sm text-purple-700 leading-relaxed">
                      Genera y comparte el código QR de tu evento para que los invitados puedan acceder fácilmente. 
                      Incluye opciones para descargar el código QR y compartir el enlace.
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-center pt-4 border-t border-purple-200">
                  <div className="w-full max-w-sm">
                    <QRModal 
                      eventUrl={`${window.location.origin}/evento/${currentUser?.username}`}
                      eventTitle={personalEvent?.title || "Mi Evento"}
                      buttonVariant="default"
                      buttonText="Generar QR de mi Evento"
                      buttonIcon={true}
                      data-testid="qr-modal-trigger"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña Apariencia */}
        <TabsContent value="apariencia">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="w-5 h-5 mr-2" />
                Personalización Visual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-semibold">Fondo de la Página</Label>
                <p className="text-sm text-gray-600 mb-4">Selecciona el fondo para tu página de evento</p>
                <BackgroundSelector
                  backgroundType={formData.backgroundType}
                  backgroundValue={formData.backgroundValue}
                  onBackgroundChange={(type, value) => {
                    setFormData(prev => ({
                      ...prev,
                      backgroundType: type,
                      backgroundValue: value
                    }));
                  }}
                  onImageUpload={async (file) => {
                    // This would need implementation for background image upload
                    return "";
                  }}
                />
              </div>


              
              <div className="flex justify-end">
                <Button 
                  onClick={handleSave} 
                  disabled={isUpdating}
                  className={rockyButtonStyles.primary}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className={rockyLoadingStyles.spinner} />
                      <span className={rockyLoadingStyles.text}>Guardando...</span>
                    </>
                  ) : (
                    <span className="text-white font-semibold">Guardar Cambios</span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña Asistencia */}
        <TabsContent value="asistencia">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCheck className="w-5 h-5 mr-2" />
                Gestión de Asistencia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Companions Configuration */}
              <div className="border border-purple-200 rounded-lg p-4 bg-purple-50/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <Label htmlFor="max-companions" className="text-base font-medium">
                      Máximo de Acompañantes
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Establece el número máximo de acompañantes que cada invitado puede traer al evento.
                    </p>
                  </div>
                  <div className="w-20">
                    <Input
                      id="max-companions"
                      type="number"
                      min="0"
                      max="10"
                      value={formData.maxCompanions || "2"}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, maxCompanions: e.target.value }));
                      }}
                      className="text-center"
                    />
                  </div>
                </div>
                
                {/* Save Button for Companions */}
                <div className="flex justify-end pt-3 border-t border-purple-200">
                  <Button 
                    onClick={handleSave}
                    disabled={isUpdating}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2"
                    size="sm"
                  >
                    {isUpdating ? "Guardando..." : "Guardar Límite"}
                  </Button>
                </div>
              </div>

              {/* Auto-redirect Configuration */}
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <Label htmlFor="auto-redirect" className="text-base font-medium">
                      Redirección Automática a Registro
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Cuando esté activada, los visitantes serán redirigidos automáticamente 
                      a la página de registro de asistencia antes de la fecha del evento.
                    </p>
                  </div>
                  <Switch
                    id="auto-redirect"
                    checked={formData.enableAutoRedirect || false}
                    onCheckedChange={(checked) => {
                      setFormData(prev => ({ ...prev, enableAutoRedirect: checked }));
                    }}
                  />
                </div>
                
                {/* Save Button for Auto-redirect */}
                <div className="flex justify-end pt-3 border-t border-blue-200">
                  <Button 
                    onClick={handleSave}
                    disabled={isUpdating}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
                    size="sm"
                  >
                    {isUpdating ? "Guardando..." : "Guardar Redirección"}
                  </Button>
                </div>
              </div>

              {/* Registration Link Section */}
              <div className="border border-green-200 rounded-lg p-4 bg-green-50/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <Label className="text-base font-medium">
                      Enlace Directo de Registro
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Comparte este enlace con tus invitados para que puedan registrarse directamente 
                      a tu evento sin necesidad de buscar tu página.
                    </p>
                  </div>
                  <LinkIcon className="w-6 h-6 text-green-600" />
                </div>
                
                {/* Registration URL Display */}
                <div className="mb-4 p-3 bg-white rounded-lg border border-green-200">
                  <p className="text-sm text-gray-500 mb-1">URL de Registro:</p>
                  <p className="text-sm font-mono text-green-700 break-all">
                    {constructRegistrationUrl()}
                  </p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3 pt-3 border-t border-green-200">
                  <Button 
                    onClick={openRegistrationPage}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 flex-1"
                    size="sm"
                    data-testid="button-open-registration"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir Página de Registro
                  </Button>
                  
                  <Button 
                    onClick={copyRegistrationLink}
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-100 px-4 py-2"
                    size="sm"
                    data-testid="button-copy-registration-link"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Enlace
                  </Button>
                </div>
              </div>

              <div className="text-center py-8">
                <UserCheck className="w-16 h-16 mx-auto text-blue-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Control de Asistencia Completo</h3>
                <p className="text-gray-600 mb-6">
                  Accede a la página completa de gestión de asistencia con scanner QR, 
                  lista de invitados y estadísticas en tiempo real.
                </p>
                
                <Button 
                  onClick={() => setLocation(`/evento/${currentUser?.username}/checkin`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
                  size="lg"
                >
                  <UserCheck className="w-5 h-5 mr-2" />
                  Ir a Check-in Completo
                </Button>
              </div>
              
              {personalEvent?.id && (
                <div className="border-t pt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Vista Previa Rápida</h4>
                  <AttendeeStats 
                    eventId={personalEvent.id}
                    eventTitle={personalEvent.title}
                    onShowCheckIn={() => setLocation(`/evento/${currentUser?.username}/checkin`)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña Notificaciones */}
        <TabsContent value="notificaciones">
          <EventNotificationsSettings eventId={personalEvent?.id} />
        </TabsContent>
      </Tabs>

      {/* QR Scanner Modal */}
      {showQRScanner && personalEvent?.id && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Scanner QR - Check-in</h3>
              <Button
                variant="outline"
                onClick={() => setShowQRScanner(false)}
                className="ml-4"
              >
                Cerrar
              </Button>
            </div>
            <div className="p-4">
              <QRScanner 
                eventId={personalEvent.id}
                eventTitle={personalEvent.title}
              />
            </div>
          </div>
        </div>
      )}

      {/* QR Modal controlado desde el header */}
      {isQRModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-modal-title"
          aria-describedby="qr-modal-description"
        >
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 relative">
            {/* Close button */}
            <button
              onClick={() => setIsQRModalOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 z-10"
              aria-label="Cerrar modal del código QR"
              aria-describedby="qr-modal-title"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Modal content */}
            <div className="p-6">
              <h2 id="qr-modal-title" className="text-lg font-semibold text-center mb-4">Código QR de tu evento</h2>
              <p id="qr-modal-description" className="text-sm text-gray-600 text-center mb-4">
                Escanea este código QR para acceder al evento
              </p>
              
              <div className="flex flex-col items-center space-y-4">
                {/* QR Code */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/evento/${currentUser?.username}`)}`}
                    alt="Código QR del evento" 
                    className="w-48 h-48 object-contain mx-auto"
                  />
                </div>
                
                {/* Event Info */}
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-base">{personalEvent?.title || "Mi Evento"}</h3>
                  <p className="text-xs text-gray-600 break-all leading-tight px-2">{`${window.location.origin}/evento/${currentUser?.username}`}</p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col gap-2 w-full">
                  <Button 
                    variant="outline" 
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(`${window.location.origin}/evento/${currentUser?.username}`);
                        toast({
                          title: "¡Copiado!",
                          description: "El enlace de tu evento ha sido copiado al portapapeles",
                        });
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "No se pudo copiar el enlace",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="text-sm h-9"
                    size="sm"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar enlace
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/evento/${currentUser?.username}`)}`;
                      link.download = `qr-${(personalEvent?.title || "Mi Evento").replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="text-sm h-9"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar QR
                  </Button>
                  <Button 
                    variant="default" 
                    onClick={async () => {
                      const eventUrl = `${window.location.origin}/evento/${currentUser?.username}`;
                      if (navigator.share) {
                        try {
                          await navigator.share({
                            title: `Evento: ${personalEvent?.title || "Mi Evento"}`,
                            text: `¡Únete a mi evento! ${personalEvent?.title || "Mi Evento"}`,
                            url: eventUrl,
                          });
                        } catch (error) {
                          console.log("Error sharing:", error);
                          try {
                            await navigator.clipboard.writeText(eventUrl);
                            toast({
                              title: "¡Copiado!",
                              description: "El enlace de tu evento ha sido copiado al portapapeles",
                            });
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "No se pudo copiar el enlace",
                              variant: "destructive",
                            });
                          }
                        }
                      } else {
                        try {
                          await navigator.clipboard.writeText(eventUrl);
                          toast({
                            title: "¡Copiado!",
                            description: "El enlace de tu evento ha sido copiado al portapapeles",
                          });
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "No se pudo copiar el enlace",
                            variant: "destructive",
                          });
                        }
                      }
                    }}
                    className="text-sm h-9"
                    size="sm"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Compartir
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}