import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Settings, Sliders, Camera, UserCheck, MessageSquare, Clock, 
  Shield, Check, AlertTriangle, Activity 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface GlobalFeatureSettings {
  id?: string;
  attendeeConfirmationsEnabled: boolean;
  eventRemindersEnabled: boolean;
  defaultAttendeeConfirmationsEnabled: boolean;
  defaultEventRemindersEnabled: boolean;
  defaultAttendeeConfirmationsThreshold?: number;
  defaultReminderDaysBefore?: string;
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
  });

  // Update local settings when data changes
  useEffect(() => {
    if (settings && !localSettings) {
      setLocalSettings(settings);
    }
  }, [settings, localSettings]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settingsData: Partial<GlobalFeatureSettings>) => {
      const response = await fetch("/api/global-features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar configuración');
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      // Invalidate all related queries to force refresh across the app
      queryClient.invalidateQueries({ queryKey: ["/api/global-features"] });
      // Also invalidate event notification queries to refresh admin panels
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "✅ Configuración actualizada",
        description: "Los cambios se han guardado exitosamente",
      });
      if (data.settings) {
        setLocalSettings(data.settings);
      }
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
    attendeeConfirmationsEnabled: true,
    eventRemindersEnabled: true,
    defaultAttendeeConfirmationsEnabled: true,
    defaultEventRemindersEnabled: true,
    defaultAttendeeConfirmationsThreshold: 10,
    defaultReminderDaysBefore: "3"
  };

  const handleSettingChange = (key: keyof GlobalFeatureSettings, value: boolean | number | string) => {
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

        {/* Configuraciones Específicas Predeterminadas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sliders className="w-5 h-5" />
              <span>Configuraciones Predeterminadas Globales</span>
            </CardTitle>
            <CardDescription>
              Establece los valores específicos que se aplicarán por defecto a todos los nuevos eventos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Umbral de Confirmaciones */}
            {currentSettings.attendeeConfirmationsEnabled && (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <UserCheck className="w-5 h-5 text-green-500" />
                  <div>
                    <Label className="text-base font-medium">Umbral de Confirmaciones</Label>
                    <p className="text-sm text-muted-foreground">
                      Número predeterminado de confirmaciones para enviar notificación
                    </p>
                  </div>
                </div>
                <div className="ml-8">
                  <Select 
                    value={currentSettings.defaultAttendeeConfirmationsThreshold?.toString() || "10"}
                    onValueChange={(value) => handleSettingChange('defaultAttendeeConfirmationsThreshold', parseInt(value))}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 confirmaciones</SelectItem>
                      <SelectItem value="10">10 confirmaciones</SelectItem>
                      <SelectItem value="20">20 confirmaciones</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {currentSettings.attendeeConfirmationsEnabled && currentSettings.eventRemindersEnabled && (
              <Separator />
            )}

            {/* Días de Recordatorio */}
            {currentSettings.eventRemindersEnabled && (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <div>
                    <Label className="text-base font-medium">Días de Recordatorio</Label>
                    <p className="text-sm text-muted-foreground">
                      Días predeterminados antes del evento para enviar recordatorios
                    </p>
                  </div>
                </div>
                <div className="ml-8">
                  <Select 
                    value={currentSettings.defaultReminderDaysBefore || "3"}
                    onValueChange={(value) => handleSettingChange('defaultReminderDaysBefore', value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 día antes</SelectItem>
                      <SelectItem value="2">2 días antes</SelectItem>
                      <SelectItem value="3">3 días antes</SelectItem>
                      <SelectItem value="5">5 días antes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
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
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <Badge variant={currentSettings.attendeeConfirmationsEnabled ? "default" : "secondary"}>
                {currentSettings.attendeeConfirmationsEnabled ? "Activo" : "Inactivo"}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">Asistencias</p>
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