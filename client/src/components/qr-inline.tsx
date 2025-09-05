// CRITICAL COMPONENT: QRInline - QR Code Display Component
// WARNING: Do not modify QR parameters without updating download functions
// This component uses QR Server API for consistent QR generation across the app

interface QRInlineProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRInline({ value, size = 200, className = "" }: QRInlineProps) {
  // IMPORTANT: QR parameters must match those used in downloadQR function
  // margin=3: Minimal margin for compact display (reduced from 10)
  // format=png: Required for browser compatibility and download functionality
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&format=png&margin=3`;

  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      <div className="bg-white p-1 rounded-lg shadow-sm border">
        <img
          src={qrUrl}
          alt={`QR Code for ${value}`}
          width={size}
          height={size}
          className="rounded"
          onError={(e) => {
            console.error('QR image failed to load:', e);
            // Fallback: show the QR text
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
      <p className="text-xs text-gray-600 font-mono break-all text-center max-w-full px-2">
        {value}
      </p>
    </div>
  );
}