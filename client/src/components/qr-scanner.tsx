import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Camera, CameraOff, Scan, User, Mail, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsQR from "jsqr";

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
  const scanIntervalRef = useRef<number | null>(null);
  const { toast } = useToast();

  // Start camera scanning with extensive logging
  const startScanning = async () => {
    try {
      setScanError("");
      console.log("🚀 === ENHANCED CAMERA START DEBUG === (Attempt)");
      
      // Step 1: Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia not supported");
      }
      console.log("✅ getUserMedia is available");
      
      // Step 2: Request media stream
      console.log("📹 Requesting camera permissions...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      console.log("✅ Camera permission granted - stream obtained");
      console.log("🎬 Stream details:", {
        active: stream.active,
        tracks: stream.getTracks().length,
        videoTracks: stream.getVideoTracks().length
      });
      
      // Step 3: Check video element with retry mechanism
      console.log("🔍 Initial video element check:", !!videoRef.current);
      
      if (!videoRef.current) {
        console.log("⏳ Video element not ready, waiting for DOM...");
        
        // Wait for video element to be ready (retry mechanism)
        let retryCount = 0;
        const maxRetries = 10;
        
        while (!videoRef.current && retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 100));
          retryCount++;
          console.log(`🔄 Retry ${retryCount}/10 - Video element:`, !!videoRef.current);
        }
        
        if (!videoRef.current) {
          console.error("❌ CRITICAL: videoRef.current still NULL after retries");
          throw new Error("Video element not found after waiting");
        }
      }
      console.log("✅ Video element exists and ready");
      
      // Step 4: Assign stream and wait for ready state
      console.log("📹 Assigning stream to video element...");
      videoRef.current.srcObject = stream;
      
      // Step 5: Wait for video to be ready and force play
      const video = videoRef.current;
      
      // Add event listeners for debugging
      video.addEventListener('loadstart', () => console.log("🎬 Video loadstart"));
      video.addEventListener('loadedmetadata', () => console.log("🎬 Video metadata loaded"));
      video.addEventListener('loadeddata', () => console.log("🎬 Video data loaded"));
      video.addEventListener('canplay', () => console.log("🎬 Video can play"));
      video.addEventListener('canplaythrough', () => console.log("🎬 Video can play through"));
      video.addEventListener('playing', () => console.log("🎬 Video is PLAYING!"));
      video.addEventListener('play', () => console.log("🎬 Video play event"));
      video.addEventListener('error', (e) => console.error("🚫 Video error:", e));
      
      // Force play after a short delay
      setTimeout(async () => {
        try {
          console.log("🚀 Force calling video.play()...");
          await video.play();
          console.log("▶️ video.play() SUCCESS!");
        } catch (playError) {
          console.error("🚫 video.play() FAILED:", playError);
          console.log("🔍 Trying user interaction prompt...");
          setScanError("Toca la pantalla para iniciar la cámara (requerido por el navegador)");
        }
      }, 100);
      
      setIsScanning(true);
      console.log("🎯 setIsScanning(true) completed");
      
      // Start real QR detection
      setTimeout(() => {
        if (video.readyState >= 2) {
          startQRDetection();
        } else {
          // Wait for video to be ready
          video.addEventListener('canplay', startQRDetection, { once: true });
        }
      }, 500);
      
    } catch (error: any) {
      console.error("🚨 CAMERA START ERROR:", error);
      console.log("🔍 Error details:", {
        name: error.name,
        message: error.message,
        code: error.code
      });
      
      if (error.name === 'NotAllowedError') {
        setScanError("Permisos de cámara denegados. Permite el acceso en la configuración del navegador.");
      } else if (error.name === 'NotFoundError') {
        setScanError("No se encontró una cámara en este dispositivo.");
      } else if (error.name === 'NotReadableError') {
        setScanError("La cámara está ocupada por otra aplicación.");
      } else {
        setScanError(`Error de cámara: ${error.message}. Usa el ingreso manual.`);
      }
      console.error("Camera access error:", error);
    }
  };

  // Real QR detection using jsQR with enhanced debugging
  const detectQRCode = useCallback(() => {
    if (!videoRef.current || !isScanning) return;
    
    try {
      const video = videoRef.current;
      
      // Enhanced video state logging (only every 10th scan to avoid spam)
      if (Math.random() < 0.1) {
        console.log("🔍 QR Detection attempt:", {
          readyState: video.readyState,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          currentTime: video.currentTime,
          paused: video.paused,
          ended: video.ended
        });
      }
      
      // Check if video is ready
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        return;
      }
      
      // Check if video has valid dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.log("⚠️ Video has no dimensions yet");
        return;
      }
      
      // Create canvas and get image data
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        console.error("❌ Failed to get canvas context");
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data for QR detection
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Log canvas data occasionally for debugging
      if (Math.random() < 0.05) {
        console.log("📊 Canvas data sample:", {
          width: canvas.width,
          height: canvas.height,
          dataLength: imageData.data.length,
          firstPixels: Array.from(imageData.data.slice(0, 12))
        });
      }
      
      // Detect QR code
      const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert", // Try without inversion first for speed
      });
      
      if (qrCode) {
        console.log("🎯 QR Code detected:", qrCode.data);
        console.log("📸 Canvas dimensions:", canvas.width, "x", canvas.height);
        console.log("🎬 Video dimensions:", video.videoWidth, "x", video.videoHeight);
        console.log("📍 QR Location:", qrCode.location);
        
        // Stop scanning to prevent multiple detections
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current);
          scanIntervalRef.current = null;
        }
        
        // Process the detected QR code
        processQRCode(qrCode.data);
      }
    } catch (error) {
      console.error("🚫 QR detection error:", error);
    }
  }, [isScanning]);

  const startQRDetection = () => {
    console.log("🔍 Starting real QR detection with jsQR...");
    
    // Clear any existing interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    
    // Start detection interval (scan every 200ms for faster detection)
    scanIntervalRef.current = window.setInterval(detectQRCode, 200);
    console.log("✅ QR detection interval started (every 200ms)");
    
    // Also run a manual test detection after 1 second
    setTimeout(() => {
      console.log("🧪 Running test QR detection...");
      detectQRCode();
    }, 1000);
  };

  // Stop camera scanning
  const stopScanning = () => {
    console.log("🛑 Stopping camera and QR detection...");
    
    // Clear QR detection interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    // Stop video stream
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
    console.log("✅ Camera and QR detection stopped");
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
            {isScanning && (
              <Button
                onClick={() => {
                  console.log("🧪 MANUAL TEST QR DETECTION");
                  detectQRCode();
                }}
                variant="outline"
                size="sm"
                disabled={isProcessing}
              >
                <Scan className="h-4 w-4 mr-1" />
                Escanear
              </Button>
            )}
            
            <Button
              onClick={isScanning ? stopScanning : startScanning}
              variant={isScanning ? "destructive" : "default"}
              className="flex-1"
              disabled={isProcessing}
            >
              {isScanning ? (
                <>
                  <CameraOff className="h-4 w-4 mr-2" />
                  Detener
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Activar cámara
                </>
              )}
            </Button>
          </div>

          {/* Video Preview - Always render to ensure ref exists */}
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-48 bg-black rounded-lg object-cover ${!isScanning ? 'hidden' : ''}`}
            />
            
            {/* Video overlay - only show when scanning */}
            {isScanning && (
              <>
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
              </>
            )}
          </div>

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