import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Copy, Mail, Settings, TestTube, Users } from 'lucide-react';

export default function AdminEmailConfigOld() {
  const [testEmail, setTestEmail] = useState('usuario@gmail.com');
  const [testName, setTestName] = useState('Usuario de Prueba');
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const eventId = 'f2189581-088c-4aca-bd45-a8502e965f45'; // Lisa's event ID

  // Fetch current email configuration from server
  const { data: emailConfig, isLoading: configLoading } = useQuery({
    queryKey: ['/api/email-config'],
  });

  const currentMode = emailConfig?.emailForceAdmin ? 'admin' : 'direct';

  const handleTestEmail = async () => {
    if (!testEmail || !testName) {
      toast({
        title: "Error",
        description: "Por favor completa email y nombre para la prueba",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    try {
      const response = await fetch(`/api/events/${eventId}/confirm-attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: testEmail,
          userName: testName,
          userEmail: testEmail,
          userWhatsapp: '1234567890'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Email de Prueba Enviado",
          description: `QR generado: ${result.qrCode}. Revisa el email configurado.`,
        });
      } else {
        toast({
          title: "Error en la prueba",
          description: "No se pudo enviar el email de prueba",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al conectar con el servidor",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const copyConfigValue = (value: string) => {
    navigator.clipboard.writeText(value);
    toast({
      title: "Copiado",
      description: "Valor copiado al portapapeles"
    });
  };

  if (configLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p>Cargando configuración de emails...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Configuración de Emails
        </h1>
        <p className="text-muted-foreground mt-2">
          Gestiona cómo se envían los emails de confirmación de asistencia
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Estado Actual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Estado Actual
            </CardTitle>
            <CardDescription>
              Configuración actual del sistema de emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Modo de Entrega:</span>
              <Badge variant={currentMode === 'admin' ? 'secondary' : 'default'}>
                {currentMode === 'admin' ? 'Administrador' : 'Directo a Usuarios'}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <span className="text-sm font-medium">Variable de Entorno:</span>
              <div className="bg-muted p-2 rounded text-sm font-mono flex items-center justify-between">
                EMAIL_FORCE_ADMIN={currentMode === 'admin' ? 'true' : 'false'}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyConfigValue(`EMAIL_FORCE_ADMIN=${currentMode === 'admin' ? 'true' : 'false'}`)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium">Email de Administrador:</span>
              <div className="bg-muted p-2 rounded text-sm font-mono flex items-center justify-between">
                2dcommx03@gmail.com
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyConfigValue('2dcommx03@gmail.com')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Explicación de Modos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Modos Disponibles
            </CardTitle>
            <CardDescription>
              Elige cómo se entregan los emails a los usuarios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Modo Administrador</Badge>
                <span className="text-sm text-green-600">✓ Funciona siempre</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Todos los emails se envían al administrador para reenvío manual
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="default">Modo Directo</Badge>
                <span className="text-sm text-amber-600">⚠ Requiere dominio verificado</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Emails se envían directamente a usuarios (solo con dominio verificado en Resend)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Prueba de Email */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Probar Envío de Email
            </CardTitle>
            <CardDescription>
              Envía un email de prueba para verificar la configuración actual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
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
            </div>
            
            <Button 
              onClick={handleTestEmail} 
              disabled={testing}
              className="w-full md:w-auto"
            >
              {testing ? 'Enviando...' : 'Enviar Email de Prueba'}
            </Button>
            
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
              <strong>Nota:</strong> {currentMode === 'admin' 
                ? 'En modo administrador, el email llegará a 2dcommx03@gmail.com con los datos del usuario.'
                : 'En modo directo, se intentará enviar al email especificado. Si falla, se enviará al administrador.'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instrucciones de Configuración */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Instrucciones para Cambiar Modo</CardTitle>
          <CardDescription>
            Cómo configurar diferentes modos de entrega de email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Para usar Modo Administrador (Recomendado para pruebas):</h4>
            <div className="bg-muted p-3 rounded font-mono text-sm">
              En Replit Secrets, configura: EMAIL_FORCE_ADMIN=true
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Para usar Modo Directo (Requiere dominio verificado):</h4>
            <div className="bg-muted p-3 rounded font-mono text-sm">
              En Replit Secrets, configura: EMAIL_FORCE_ADMIN=false
            </div>
            <p className="text-sm text-muted-foreground">
              Además necesitas verificar un dominio en{' '}
              <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                resend.com/domains
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}