import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Bell, Camera, Users, MessageSquare, Clock, Mail, Zap, CheckCircle, AlertCircle } from "lucide-react";

interface EventNotificationSettings {
  adminEmail: string;
  newPhotosEnabled: boolean;
  newPhotosThreshold: string;
  attendeeConfirmationsEnabled: boolean;
  attendeeConfirmationsThreshold: string;
  newCommentsEnabled: boolean;
  newCommentsThreshold: string;
  includeCommentsInEmail: boolean;
  eventReminderEnabled: boolean;
  reminderDaysBefore: string;
}

interface EventNotificationsSettingsProps {
  eventId?: string;
}

export default function EventNotificationsSettings({ eventId }: EventNotificationsSettingsProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<EventNotificationSettings>({
    adminEmail: '',
    newPhotosEnabled: true,
    newPhotosThreshold: '30',
    attendeeConfirmationsEnabled: true,
    attendeeConfirmationsThreshold: '5',
    newCommentsEnabled: true,
    newCommentsThreshold: '15',
    includeCommentsInEmail: true,
    eventReminderEnabled: true,
    reminderDaysBefore: '1,2'
  });

  // Fetch existing notification settings
  const { data: notificationSettings, isLoading } = useQuery({
    queryKey: [`/api/events/${eventId}/notification-settings`],
    enabled: !!eventId,
  });

  // Load settings when data is available
  useEffect(() => {
    if (notificationSettings) {
      setSettings(prev => ({ ...prev, ...notificationSettings }));
    }
  }, [notificationSettings]);

  // Save notification settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: () => fetch(`/api/events/${eventId}/notification-settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "¡Configuración guardada!",
        description: "Las notificaciones se han configurado correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/notification-settings`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al guardar",
        description: error.message || "No se pudo guardar la configuración.",
        variant: "destructive",
      });
    }
  });

  // Test notification mutation
  const testNotificationMutation = useMutation({
    mutationFn: ({ type, testEmail }: { type: string; testEmail?: string }) => 
      fetch(`/api/events/${eventId}/test-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationType: type,
          testEmail: testEmail || settings.adminEmail
        })
      }).then(res => res.json()),
    onSuccess: (response: any) => {
      toast({
        title: "¡Notificación enviada!",
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error en prueba",
        description: error.message || "No se pudo enviar la notificación de prueba.",
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    if (!eventId) {
      toast({
        title: "Error",
        description: "ID del evento no disponible.",
        variant: "destructive",
      });
      return;
    }

    if (!settings.adminEmail) {
      toast({
        title: "Email requerido",
        description: "Por favor ingresa un email de administrador.",
        variant: "destructive",
      });
      return;
    }

    saveSettingsMutation.mutate();
  };

  const handleTestNotification = (type: string) => {
    testNotificationMutation.mutate({ type });
  };

  const updateSetting = (key: keyof EventNotificationSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Bell className="w-8 h-8 mx-auto mb-2 animate-pulse" />
            <p>Cargando configuración de notificaciones...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!eventId) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <p>Event ID no disponible. Guarda el evento primero.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Configuración de Notificaciones
          </CardTitle>
          <CardDescription>
            Configure notificaciones automáticas para administradores del evento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuración de Email de Administrador */}
          <div>
            <Label htmlFor="adminEmail" className="text-base font-semibold">Email de Administrador</Label>
            <p className="text-sm text-gray-600 mb-3">Email donde se recibirán todas las notificaciones del evento</p>
            <Input
              id="adminEmail"
              type="email"
              value={settings.adminEmail}
              onChange={(e) => updateSetting('adminEmail', e.target.value)}
              placeholder="admin@miempresa.com"
              className="max-w-md"
            />
          </div>

          <Separator />

          {/* Notificaciones de Fotos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-blue-500" />
                <div>
                  <Label className="text-base font-semibold">Notificaciones de Nuevas Fotos</Label>
                  <p className="text-sm text-gray-600">Recibir email cuando se suban nuevas fotos a la galería</p>
                </div>
              </div>
              <Switch
                checked={settings.newPhotosEnabled}
                onCheckedChange={(checked) => updateSetting('newPhotosEnabled', checked)}
                className="data-[state=checked]:bg-green-600"
              />
            </div>
            
            {settings.newPhotosEnabled && (
              <div className="ml-7 space-y-2">
                <Label className="text-sm font-medium">Notificar cada:</Label>
                <Select 
                  value={settings.newPhotosThreshold}
                  onValueChange={(value) => updateSetting('newPhotosThreshold', value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 fotos</SelectItem>
                    <SelectItem value="20">20 fotos</SelectItem>
                    <SelectItem value="30">30 fotos</SelectItem>
                    <SelectItem value="50">50 fotos</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestNotification('newPhotos')}
                  disabled={testNotificationMutation.isPending}
                  className="ml-2"
                >
                  <Mail className="w-4 h-4 mr-1" />
                  Probar
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Notificaciones de Confirmaciones */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-green-500" />
                <div>
                  <Label className="text-base font-semibold">Confirmaciones de Asistencia</Label>
                  <p className="text-sm text-gray-600">Recibir email cuando se confirmen asistencias en grupo</p>
                </div>
              </div>
              <Switch
                checked={settings.attendeeConfirmationsEnabled}
                onCheckedChange={(checked) => updateSetting('attendeeConfirmationsEnabled', checked)}
                className="data-[state=checked]:bg-green-600"
              />
            </div>
            
            {settings.attendeeConfirmationsEnabled && (
              <div className="ml-7 space-y-2">
                <Label className="text-sm font-medium">Notificar cada:</Label>
                <Select 
                  value={settings.attendeeConfirmationsThreshold}
                  onValueChange={(value) => updateSetting('attendeeConfirmationsThreshold', value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 confirmaciones</SelectItem>
                    <SelectItem value="10">10 confirmaciones</SelectItem>
                    <SelectItem value="20">20 confirmaciones</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestNotification('attendeeConfirmation')}
                  disabled={testNotificationMutation.isPending}
                  className="ml-2"
                >
                  <Mail className="w-4 h-4 mr-1" />
                  Probar
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Notificaciones de Comentarios */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-purple-500" />
                <div>
                  <Label className="text-base font-semibold">Notificaciones de Comentarios</Label>
                  <p className="text-sm text-gray-600">Recibir email con nuevos comentarios en fotos</p>
                </div>
              </div>
              <Switch
                checked={settings.newCommentsEnabled}
                onCheckedChange={(checked) => updateSetting('newCommentsEnabled', checked)}
                className="data-[state=checked]:bg-green-600"
              />
            </div>
            
            {settings.newCommentsEnabled && (
              <div className="ml-7 space-y-3">
                <div className="flex items-center space-x-4">
                  <div>
                    <Label className="text-sm font-medium">Notificar cada:</Label>
                    <Select 
                      value={settings.newCommentsThreshold}
                      onValueChange={(value) => updateSetting('newCommentsThreshold', value)}
                    >
                      <SelectTrigger className="w-40 mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 comentarios</SelectItem>
                        <SelectItem value="10">10 comentarios</SelectItem>
                        <SelectItem value="15">15 comentarios</SelectItem>
                        <SelectItem value="20">20 comentarios</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestNotification('newComments')}
                    disabled={testNotificationMutation.isPending}
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    Probar
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2 mt-2">
                  <Switch
                    checked={settings.includeCommentsInEmail}
                    onCheckedChange={(checked) => updateSetting('includeCommentsInEmail', checked)}
                    className="data-[state=checked]:bg-green-600"
                  />
                  <Label className="text-sm">Incluir comentarios completos en el email</Label>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Recordatorios de Evento */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <div>
                  <Label className="text-base font-semibold">Recordatorios de Evento</Label>
                  <p className="text-sm text-gray-600">Enviar recordatorio antes del evento a los asistentes confirmados</p>
                </div>
              </div>
              <Switch
                checked={settings.eventReminderEnabled}
                onCheckedChange={(checked) => updateSetting('eventReminderEnabled', checked)}
                className="data-[state=checked]:bg-green-600"
              />
            </div>
            
            {settings.eventReminderEnabled && (
              <div className="ml-7 space-y-3">
                <div className="flex items-center space-x-4">
                  <div>
                    <Label className="text-sm font-medium">Días antes del evento:</Label>
                    <Select 
                      value={settings.reminderDaysBefore}
                      onValueChange={(value) => updateSetting('reminderDaysBefore', value)}
                    >
                      <SelectTrigger className="w-40 mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 día antes</SelectItem>
                        <SelectItem value="2">2 días antes</SelectItem>
                        <SelectItem value="1,2">1 y 2 días antes</SelectItem>
                        <SelectItem value="1,3">1 y 3 días antes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestNotification('eventReminder')}
                    disabled={testNotificationMutation.isPending}
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    Probar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Acciones */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Button 
              onClick={handleSave}
              disabled={saveSettingsMutation.isPending || !settings.adminEmail}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2"
            >
              {saveSettingsMutation.isPending ? "Guardando..." : "Guardar Configuración"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}