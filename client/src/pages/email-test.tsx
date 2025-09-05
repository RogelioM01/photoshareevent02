import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface TestEmailData {
  emailType: string;
  recipientEmail: string;
  testData?: {
    guestName?: string;
    eventTitle?: string;
    eventDate?: string;
    eventTime?: string;
    eventPlace?: string;
    eventAddress?: string;
    organizerName?: string;
    photoCount?: number;
  };
}

export default function EmailTest() {
  const [emailType, setEmailType] = useState<string>("");
  const [recipientEmail, setRecipientEmail] = useState<string>("");
  const [guestName, setGuestName] = useState<string>("María García");
  const [eventTitle, setEventTitle] = useState<string>("Fiesta de Cumpleaños");
  const { toast } = useToast();

  const testEmailMutation = useMutation({
    mutationFn: async (data: TestEmailData) => {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error enviando email");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email enviado",
        description: "El email de prueba se envió correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error enviando email",
        variant: "destructive",
      });
    },
  });

  const handleSendTest = () => {
    if (!emailType || !recipientEmail) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    const testData: TestEmailData = {
      emailType,
      recipientEmail,
      testData: {
        guestName,
        eventTitle,
        eventDate: "2025-08-15",
        eventTime: "19:00",
        eventPlace: "Casa de Lisa",
        eventAddress: "Av. Insurgentes 123, CDMX",
        organizerName: "Lisa Organizadora",
        photoCount: 5,
      },
    };

    testEmailMutation.mutate(testData);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Prueba de Sistema de Emails</CardTitle>
            <CardDescription>
              Envía emails de prueba para verificar que Resend está configurado correctamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Email</label>
              <Select value={emailType} onValueChange={setEmailType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo de email" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="registration">Confirmación de Registro</SelectItem>
                  <SelectItem value="reminder">Recordatorio de Check-in</SelectItem>
                  <SelectItem value="photo">Notificación de Nuevas Fotos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email del Destinatario</label>
              <Input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre del Invitado</label>
                <Input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="María García"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Título del Evento</label>
                <Input
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Fiesta de Cumpleaños"
                />
              </div>
            </div>

            <Button 
              onClick={handleSendTest} 
              disabled={testEmailMutation.isPending || !emailType || !recipientEmail}
              className="w-full"
            >
              {testEmailMutation.isPending ? "Enviando..." : "Enviar Email de Prueba"}
            </Button>

            {testEmailMutation.isError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200 text-sm">
                  Error: {testEmailMutation.error?.message || "Error desconocido"}
                </p>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Configuración de Resend
              </h3>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <p>• API Key: {import.meta.env.VITE_RESEND_API_KEY ? "✅ Configurada" : "❌ No configurada (servidor)"}</p>
                <p>• Dominio de envío: evento-gallery.com</p>
                <p>• Email de remitente: no-reply@evento-gallery.com</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}