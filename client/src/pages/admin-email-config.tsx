import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, Mail, TestTube, Copy, CheckCircle, XCircle, Zap, Shield, 
  Users, Camera, Bell, Clock, UserCheck, Activity, AlertTriangle 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface EmailNotificationSettings {
  attendanceConfirmation: boolean;
  eventReminders: boolean;
}

interface EmailSystemStatus {
  primary: 'emailit-api' | 'emailit-smtp' | 'resend';
  secondary: 'emailit-api' | 'emailit-smtp' | 'resend' | 'none';
  tertiary: 'emailit-api' | 'emailit-smtp' | 'resend' | 'none';
  status: 'active' | 'degraded' | 'error';
  lastTest: string;
}

interface EmailConfig {
  services?: {
    primary: 'emailit-api' | 'emailit-smtp' | 'resend';
    secondary: 'emailit-api' | 'emailit-smtp' | 'resend' | 'none';
    tertiary: 'emailit-api' | 'emailit-smtp' | 'resend' | 'none';
  };
  status?: 'active' | 'degraded' | 'error';
  lastTest?: string;
}

export default function AdminEmailConfig() {
  const [testEmail, setTestEmail] = useState('2dcommx01@gmail.com');
  const [testName, setTestName] = useState('Usuario de Prueba');
  const [testing, setTesting] = useState(false);
  const [selectedService, setSelectedService] = useState<'primary' | 'secondary' | 'tertiary'>('primary');
  const { toast } = useToast();

  // Configuración por defecto de notificaciones
  const [notifications, setNotifications] = useState<EmailNotificationSettings>({
    attendanceConfirmation: true,
    eventReminders: true
  });

  // Fetch email configuration con datos reales del sistema
  const { data: emailConfig, isLoading: configLoading } = useQuery<EmailConfig>({
    queryKey: ['/api/email-config'],
  });

  // Estado del sistema basado en datos reales
  const systemStatus: EmailSystemStatus = emailConfig ? {
    primary: emailConfig.services?.primary || 'resend',
    secondary: emailConfig.services?.secondary || 'none',
    tertiary: emailConfig.services?.tertiary || 'none',
    status: emailConfig.status || 'active',
    lastTest: emailConfig.lastTest || new Date().toISOString()
  } : {
    primary: 'resend',
    secondary: 'none',
    tertiary: 'none',
    status: 'active',
    lastTest: new Date().toISOString()
  };

  // Mutation para guardar configuración
  const saveConfigMutation = useMutation({
    mutationFn: async (config: EmailNotificationSettings) => {
      const response = await fetch('/api/email-config/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Configuración Guardada',
        description: 'Las configuraciones de notificaciones han sido actualizadas'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/email-config'] });
    }
  });

  // Test específico por servicio
  const testServiceMutation = useMutation({
    mutationFn: async ({ service, email, name }: { service: string, email: string, name: string }) => {
      const response = await fetch('/api/email/test-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, email, name })
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Email de Prueba Enviado',
        description: `Email enviado exitosamente via ${variables.service}`
      });
    },
    onError: (error) => {
      toast({
        title: 'Error en Prueba',
        description: `Error al enviar email: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  const handleSaveConfig = () => {
    saveConfigMutation.mutate(notifications);
  };

  const handleTestService = () => {
    if (!testEmail || !testName) {
      toast({
        title: 'Error',
        description: 'Completa email y nombre para la prueba',
        variant: 'destructive'
      });
      return;
    }

    const serviceMap = {
      primary: systemStatus.primary,
      secondary: systemStatus.secondary,
      tertiary: systemStatus.tertiary
    };

    testServiceMutation.mutate({
      service: serviceMap[selectedService],
      email: testEmail,
      name: testName
    });
  };

  const updateNotification = (key: keyof EmailNotificationSettings, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const getServiceLabel = (service: string) => {
    const serviceNames = {
      'emailit-api': 'Emailit REST API',
      'emailit-smtp': 'Emailit SMTP',
      'resend': 'Resend',
      'none': 'Ninguno'
    };
    return (serviceNames as any)[service] || service;
  };

  const getServiceBadge = (service: string, status: 'primary' | 'secondary' | 'tertiary') => {
    const colors = {
      primary: 'bg-green-100 text-green-800 border-green-200',
      secondary: 'bg-blue-100 text-blue-800 border-blue-200', 
      tertiary: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const serviceNames = {
      'emailit-api': 'Emailit REST API',
      'emailit-smtp': 'Emailit SMTP',
      'resend': 'Resend',
      'none': 'Ninguno'
    };

    return (
      <Badge className={colors[status]}>
        {(serviceNames as any)[service]} ({status === 'primary' ? '1°' : status === 'secondary' ? '2°' : '3°'})
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Configuración Avanzada de Emails
        </h1>
        <p className="text-muted-foreground mt-2">
          Gestiona el sistema híbrido de emails y configuraciones de notificaciones
        </p>
      </div>

      <div className="grid gap-6">

        {/* Configuración de Notificaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Configuración de Notificaciones
            </CardTitle>
            <CardDescription>
              Controla cuándo se envían emails automáticamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">

              {/* Confirmación de Asistencia */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Confirmación de Asistencia
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Email de confirmación al registrarse al evento
                  </p>
                </div>
                <Switch
                  checked={notifications.attendanceConfirmation}
                  onCheckedChange={(checked) => updateNotification('attendanceConfirmation', checked)}
                />
              </div>

              {/* Recordatorios de Evento */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recordatorios de Evento
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Enviar recordatorio antes del evento a los asistentes
                  </p>
                </div>
                <Switch
                  checked={notifications.eventReminders}
                  onCheckedChange={(checked) => updateNotification('eventReminders', checked)}
                />
              </div>
            </div>

            <Separator />

            <Button 
              onClick={handleSaveConfig} 
              className="w-full"
              disabled={saveConfigMutation.isPending}
            >
              {saveConfigMutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </CardContent>
        </Card>

        {/* Pruebas del Sistema */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Pruebas del Sistema de Email
            </CardTitle>
            <CardDescription>
              Prueba cada servicio individualmente o el sistema completo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="testEmail">Email de Prueba</Label>
                <Input
                  id="testEmail"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="usuario@ejemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testName">Nombre de Usuario</Label>
                <Input
                  id="testName"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="Usuario de Prueba"
                />
              </div>
              <div className="space-y-2">
                <Label>Servicio a Probar</Label>
                <Select value={selectedService} onValueChange={(value: any) => setSelectedService(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primario (Emailit API)</SelectItem>
                    <SelectItem value="secondary">Secundario (Emailit SMTP)</SelectItem>
                    <SelectItem value="tertiary">Terciario (Resend)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={handleTestService}
                disabled={testServiceMutation.isPending}
                className="flex-1"
              >
                {testServiceMutation.isPending ? 'Enviando...' : `Probar ${selectedService}`}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  // Test completo del sistema híbrido
                  testServiceMutation.mutate({
                    service: 'hybrid',
                    email: testEmail,
                    name: testName
                  });
                }}
                disabled={testServiceMutation.isPending}
                className="flex-1"
              >
                Probar Sistema Completo
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}