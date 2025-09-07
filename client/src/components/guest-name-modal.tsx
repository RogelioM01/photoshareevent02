import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import type { EventUser } from '@shared/schema';

interface GuestNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  onSuccess?: () => void;
}

export function GuestNameModal({ isOpen, onClose, eventId, onSuccess }: GuestNameModalProps) {
  const [guestName, setGuestName] = useState("");
  const { toast } = useToast();
  const { setCurrentUser } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!guestName.trim()) {
      toast({
        title: "Nombre requerido",
        description: "Por favor ingresa tu nombre para continuar",
        variant: "destructive",
      });
      return;
    }

    // Create a temporary user for this session with name embedded in ID
    const sanitizedName = guestName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z-]/g, '');
    const newTempUser: EventUser = {
      id: `guest-${sanitizedName}-${Date.now()}`, // Include name for proper identification
      name: guestName.trim(),
      eventId: eventId,
      createdAt: new Date() // Add required createdAt field
    };

    // Store in localStorage and update AuthContext
    localStorage.setItem("currentUser", JSON.stringify(newTempUser));
    setCurrentUser(newTempUser); // Update AuthContext directly
    
    toast({
      title: "¡Bienvenido!",
      description: `Hola ${guestName.trim()}! Ahora puedes ver y agregar comentarios`,
      variant: "default",
    });

    onClose();
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">¡Únete al evento!</h2>
            <button
              onClick={onClose}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Name Input Form */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="guestName">Tu nombre</Label>
                <Input
                  id="guestName"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Ingresa tu nombre..."
                  className="mt-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSubmit();
                    }
                  }}
                  autoFocus
                />
              </div>
              
              <Button
                onClick={handleSubmit}
                disabled={!guestName.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                ¡Continuar!
              </Button>

              <p className="text-sm text-gray-500 text-center">
                Solo necesitas tu nombre para ver y agregar comentarios
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}