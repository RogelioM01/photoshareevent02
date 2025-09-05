import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QrCode, Copy, Download, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRModalProps {
  eventUrl: string;
  eventTitle: string;
  buttonVariant?: "default" | "outline" | "secondary" | "ghost";
  buttonText?: string;
  buttonIcon?: boolean;
}

export default function QRModal({ 
  eventUrl, 
  eventTitle, 
  buttonVariant = "default", 
  buttonText = "QR de mi evento",
  buttonIcon = true 
}: QRModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  
  // Generate QR code URL using a free API service
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(eventUrl)}`;
  
  const handleCopyUrl = async () => {
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
  };

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qr-${eventTitle.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareQR = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Evento: ${eventTitle}`,
          text: `¡Únete a mi evento! ${eventTitle}`,
          url: eventUrl,
        });
      } catch (error) {
        console.log("Error sharing:", error);
        handleCopyUrl();
      }
    } else {
      handleCopyUrl();
    }
  };

  return (
    <>
      <Button 
        variant={buttonVariant} 
        size="default" 
        className="w-full justify-start"
        onClick={() => setIsOpen(true)}
      >
        {buttonIcon && <QrCode className="w-4 h-4 mr-2" />}
        {buttonText}
      </Button>
      
      {isOpen && (
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
              onClick={() => setIsOpen(false)}
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
                    src={qrCodeUrl} 
                    alt="Código QR del evento" 
                    className="w-48 h-48 object-contain mx-auto"
                  />
                </div>
                
                {/* Event Info */}
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-base">{eventTitle}</h3>
                  <p className="text-xs text-gray-600 break-all leading-tight px-2">{eventUrl}</p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col gap-2 w-full">
                  <Button 
                    variant="outline" 
                    onClick={handleCopyUrl}
                    className="text-sm h-9"
                    size="sm"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar enlace
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleDownloadQR}
                    className="text-sm h-9"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar QR
                  </Button>
                  <Button 
                    variant="default" 
                    onClick={handleShareQR}
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
    </>
  );
}