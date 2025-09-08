import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, Sliders, Camera, UserCheck, MessageSquare, Clock, 
  Shield, Check, AlertTriangle, Activity 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface GlobalFeatureSettings {
  id?: string;
  newPhotosNotificationEnabled: boolean;
  attendeeConfirmationsEnabled: boolean;
  commentsNotificationEnabled: boolean;
  eventRemindersEnabled: boolean;
  defaultNewPhotosEnabled: boolean;
  defaultAttendeeConfirmationsEnabled: boolean;
  defaultCommentsEnabled: boolean;
  defaultEventRemindersEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminGlobalFeatures() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState<GlobalFeatureSettings | null>(null);

  // Fetch current global feature settings
  const { data: settings, isLoading } = useQuery<GlobalFeatureSettings>({
    queryKey: ["/api/global-features"],
    onSuccess: (data) => {
      setLocalSettings(data);
    }
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settingsData: Partial<GlobalFeatureSettings>) => {
      return await apiRequest("/api/global-features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsData),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/global-features"] });
      toast({
        title: "✅ Configuración actualizada",
        description: "Los cambios se han guardado exitosamente",
      });
      setLocalSettings(data.settings);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error al guardar",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive"
      });
    }
  });

  const currentSettings = localSettings || settings || {
    newPhotosNotificationEnabled: true,
    attendeeConfirmationsEnabled: true,
    commentsNotificationEnabled: true,
    eventRemindersEnabled: true,
    defaultNewPhotosEnabled: true,
    defaultAttendeeConfirmationsEnabled: true,
    defaultCommentsEnabled: true,
    defaultEventRemindersEnabled: true
  };

  const handleSettingChange = (key: keyof GlobalFeatureSettings, value: boolean) => {
    setLocalSettings(prev => ({
      ...currentSettings,
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    if (localSettings) {
      saveSettingsMutation.mutate(localSettings);
    }
  };

  const hasUnsavedChanges = localSettings && settings && JSON.stringify(localSettings) !== JSON.stringify(settings);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Activity className="w-6 h-6 animate-spin mr-2" />
          <span>Cargando configuración global...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold" data-testid="page-title">
              Configuración Global de Características
            </h1>
            <p className="text-muted-foreground">
              Controla qué características están disponibles para los administradores de eventos
            </p>
          </div>
        </div>
        {hasUnsavedChanges && (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <AlertTriangle className="w-4 h-4 mr-1" />
            Cambios sin guardar
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Control de Características */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sliders className="w-5 h-5" />
              <span>Control de Características</span>
            </CardTitle>
            <CardDescription>
              Activa o desactiva características que aparecerán en el dashboard de administradores de eventos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Notificaciones de Nuevas Fotos */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Camera className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium">Notificaciones de Nuevas Fotos</p>
                  <p className="text-sm text-muted-foreground">
                    Permite configurar alertas cuando se suben fotos
                  </p>
                </div>
              </div>
              <Switch
                checked={currentSettings.newPhotosNotificationEnabled}
                onCheckedChange={(value) => handleSettingChange('newPhotosNotificationEnabled', value)}
                data-testid="switch-new-photos"
              />
            </div>

            <Separator />

            {/* Confirmaciones de Asistencia */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <UserCheck className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium">Confirmaciones de Asistencia</p>
                  <p className="text-sm text-muted-foreground">
                    Control de notificaciones por nuevos asistentes
                  </p>
                </div>
              </div>
              <Switch
                checked={currentSettings.attendeeConfirmationsEnabled}
                onCheckedChange={(value) => handleSettingChange('attendeeConfirmationsEnabled', value)}
                data-testid="switch-attendee-confirmations"
              />
            </div>

            <Separator />

            {/* Notificaciones de Comentarios */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="font-medium">Notificaciones de Comentarios</p>
                  <p className="text-sm text-muted-foreground">
                    Alertas cuando se añaden comentarios a fotos
                  </p>
                </div>
              </div>
              <Switch
                checked={currentSettings.commentsNotificationEnabled}
                onCheckedChange={(value) => handleSettingChange('commentsNotificationEnabled', value)}
                data-testid="switch-comments"
              />
            </div>

            <Separator />

            {/* Recordatorios de Evento */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="font-medium">Recordatorios de Evento</p>
                  <p className="text-sm text-muted-foreground">
                    Envío de recordatorios antes del evento
                  </p>
                </div>
              </div>
              <Switch
                checked={currentSettings.eventRemindersEnabled}
                onCheckedChange={(value) => handleSettingChange('eventRemindersEnabled', value)}
                data-testid="switch-event-reminders"
              />
            </div>
          </CardContent>
        </Card>

        {/* Valores por Defecto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Valores por Defecto</span>
            </CardTitle>
            <CardDescription>
              Define qué características están activadas por defecto cuando se crean nuevos eventos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Default Nuevas Fotos */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Camera className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium">Nuevas Fotos (por defecto)</p>
                  <p className="text-sm text-muted-foreground">
                    Activo en nuevos eventos por defecto
                  </p>
                </div>
              </div>
              <Switch
                checked={currentSettings.defaultNewPhotosEnabled}
                onCheckedChange={(value) => handleSettingChange('defaultNewPhotosEnabled', value)}
                disabled={!currentSettings.newPhotosNotificationEnabled}
                data-testid="switch-default-new-photos"
              />
            </div>

            <Separator />

            {/* Default Confirmaciones */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <UserCheck className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium">Confirmaciones (por defecto)</p>
                  <p className="text-sm text-muted-foreground">
                    Activo en nuevos eventos por defecto
                  </p>
                </div>
              </div>
              <Switch
                checked={currentSettings.defaultAttendeeConfirmationsEnabled}
                onCheckedChange={(value) => handleSettingChange('defaultAttendeeConfirmationsEnabled', value)}
                disabled={!currentSettings.attendeeConfirmationsEnabled}
                data-testid="switch-default-confirmations"
              />
            </div>

            <Separator />

            {/* Default Comentarios */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="font-medium">Comentarios (por defecto)</p>
                  <p className="text-sm text-muted-foreground">
                    Activo en nuevos eventos por defecto
                  </p>
                </div>
              </div>
              <Switch
                checked={currentSettings.defaultCommentsEnabled}
                onCheckedChange={(value) => handleSettingChange('defaultCommentsEnabled', value)}
                disabled={!currentSettings.commentsNotificationEnabled}
                data-testid="switch-default-comments"
              />
            </div>

            <Separator />

            {/* Default Recordatorios */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="font-medium">Recordatorios (por defecto)</p>
                  <p className="text-sm text-muted-foreground">
                    Activo en nuevos eventos por defecto
                  </p>
                </div>
              </div>
              <Switch
                checked={currentSettings.defaultEventRemindersEnabled}
                onCheckedChange={(value) => handleSettingChange('defaultEventRemindersEnabled', value)}
                disabled={!currentSettings.eventRemindersEnabled}
                data-testid="switch-default-reminders"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Guardar Cambios */}
      {hasUnsavedChanges && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Tienes cambios sin guardar</p>
                  <p className="text-sm text-muted-foreground">
                    Los cambios no se aplicarán hasta que los guardes
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setLocalSettings(settings)}
                  data-testid="button-cancel-changes"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saveSettingsMutation.isPending}
                  data-testid="button-save-changes"
                >
                  {saveSettingsMutation.isPending ? (
                    <>
                      <Activity className="w-4 h-4 animate-spin mr-2" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Estado del Sistema</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Badge variant={currentSettings.newPhotosNotificationEnabled ? "default" : "secondary"}>
                {currentSettings.newPhotosNotificationEnabled ? "Activo" : "Inactivo"}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">Fotos</p>
            </div>
            <div className="text-center">
              <Badge variant={currentSettings.attendeeConfirmationsEnabled ? "default" : "secondary"}>
                {currentSettings.attendeeConfirmationsEnabled ? "Activo" : "Inactivo"}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">Asistencias</p>
            </div>
            <div className="text-center">
              <Badge variant={currentSettings.commentsNotificationEnabled ? "default" : "secondary"}>
                {currentSettings.commentsNotificationEnabled ? "Activo" : "Inactivo"}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">Comentarios</p>
            </div>
            <div className="text-center">
              <Badge variant={currentSettings.eventRemindersEnabled ? "default" : "secondary"}>
                {currentSettings.eventRemindersEnabled ? "Activo" : "Inactivo"}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">Recordatorios</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}