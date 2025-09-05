import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Camera, CameraOff, Scan, User, Mail, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRScannerProps {
  eventId: string;
  onScanSuccess: (attendeeData: any) => void;
}

export function QRScanner({ eventId, onScanSuccess }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [lastScanResult, setLastScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  // Start camera scanning
  const startScanning = async () => {
    try {
      setScanError("");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
        
        // Start QR detection simulation
        // In a real implementation, you'd use a QR detection library like jsQR
        startQRDetection();
      }
    } catch (error) {
      setScanError("No se pudo acceder a la cámara. Usa el ingreso manual.");
      console.error("Camera access error:", error);
    }
  };

  // Simulate QR detection (in production, use jsQR or similar)
  const startQRDetection = () => {
    // This is a placeholder for QR detection
    // In a real app, you'd use jsQR to detect QR codes from the video stream
    console.log("QR detection started - use manual input for testing");
  };

  // Stop camera scanning
  const stopScanning = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  // Process scanned QR code
  const processQRCode = async (qrCode: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/events/${eventId}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrCode: qrCode.trim(),
          checkedInBy: 'scanner' // Could be current user ID
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setLastScanResult({
          success: true,
          attendee: result,
          message: "Check-in exitoso",
          timestamp: new Date().toLocaleTimeString()
        });
        
        toast({
          title: "✅ Check-in exitoso",
          description: `${result.guestName || result.userId || 'Asistente'} registrado correctamente`,
        });
        
        onScanSuccess(result);
      } else {
        setLastScanResult({
          success: false,
          message: result.message || "Error en check-in",
          timestamp: new Date().toLocaleTimeString()
        });
        
        toast({
          title: "❌ Error en check-in",
          description: result.message || "Código QR inválido",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Check-in error:", error);
      setLastScanResult({
        success: false,
        message: "Error de conexión",
        timestamp: new Date().toLocaleTimeString()
      });
      
      toast({
        title: "Error",
        description: "No se pudo procesar el check-in",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Manual QR code submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim() && !isProcessing) {
      processQRCode(manualCode);
      setManualCode("");
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5 text-blue-600" />
          Scanner QR Check-in
        </CardTitle>
        <CardDescription>
          Escanea códigos QR de invitados para registrar asistencia en tiempo real
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Camera Scanner Section */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              onClick={isScanning ? stopScanning : startScanning}
              variant={isScanning ? "destructive" : "default"}
              className="flex-1"
              disabled={isProcessing}
            >
              {isScanning ? (
                <>
                  <CameraOff className="h-4 w-4 mr-2" />
                  Detener cámara
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Activar cámara
                </>
              )}
            </Button>
          </div>

          {/* Video Preview */}
          {isScanning && (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-48 bg-black rounded-lg object-cover"
              />
              <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                {/* QR targeting overlay */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-blue-400"></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-blue-400"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-blue-400"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-blue-400"></div>
                
                {/* Center crosshair */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 border border-blue-400 bg-blue-500/10 rounded"></div>
                </div>
              </div>
              
              {/* Instructions overlay */}
              <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-xs p-2 rounded">
                Centra el código QR en la cámara o usa el ingreso manual
              </div>
            </div>
          )}

          {scanError && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">{scanError}</p>
            </div>
          )}
        </div>

        {/* Manual Input Section */}
        <div className="space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ingreso manual de código
              </span>
            </div>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-2">
            <Label htmlFor="manual-qr">Código QR del invitado</Label>
            <div className="flex gap-2">
              <Input
                id="manual-qr"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="QR_GUEST_52082480_juan_..."
                className="flex-1 font-mono text-sm"
                disabled={isProcessing}
              />
              <Button 
                type="submit" 
                disabled={!manualCode.trim() || isProcessing}
                className="min-w-[100px]"
              >
                {isProcessing ? "..." : "Check-in"}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Copia y pega el código QR exacto del invitado
            </p>
          </form>
        </div>

        {/* Last Scan Result */}
        {lastScanResult && (
          <div className={`p-4 rounded-lg border-2 ${
            lastScanResult.success 
              ? "bg-green-50 border-green-200" 
              : "bg-red-50 border-red-200"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {lastScanResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${
                lastScanResult.success ? "text-green-800" : "text-red-800"
              }`}>
                {lastScanResult.message}
              </span>
              <span className="text-xs text-gray-500 ml-auto">
                {lastScanResult.timestamp}
              </span>
            </div>
            
            {lastScanResult.success && lastScanResult.attendee && (
              <div className="space-y-2 text-sm">
                {lastScanResult.attendee.guestName && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span><strong>Nombre:</strong> {lastScanResult.attendee.guestName}</span>
                  </div>
                )}
                {lastScanResult.attendee.guestEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span><strong>Email:</strong> {lastScanResult.attendee.guestEmail}</span>
                  </div>
                )}
                {lastScanResult.attendee.guestWhatsapp && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span><strong>WhatsApp:</strong> {lastScanResult.attendee.guestWhatsapp}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant={lastScanResult.attendee.status === 'present' ? 'default' : 'secondary'}>
                    {lastScanResult.attendee.status === 'present' ? 'Presente' : lastScanResult.attendee.status}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Los invitados deben mostrar su código QR personalizado</p>
          <p>• El check-in se registra automáticamente en el sistema</p>
          <p>• Los códigos QR solo funcionan una vez por evento</p>
        </div>
      </CardContent>
    </Card>
  );
}