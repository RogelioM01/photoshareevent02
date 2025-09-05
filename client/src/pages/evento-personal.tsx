import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { usePersonalEvent } from "@/hooks/usePersonalEvent";

interface PersonalEvent {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  ownerId: string;
  backgroundType: string;
  backgroundValue: string;
  eventDate?: string;
  eventTime?: string;
  timezone?: string;
  shouldRedirectToRSVP?: boolean;
}

export default function EventoPersonal() {
  const [, setLocation] = useLocation();
  const { param } = useParams<{ param: string }>();
  // IMPORTANT: param here is just username (e.g., "javier"), NOT "username-album"
  // The router logic in App.tsx ensures only non-album routes reach this component
  const username = param; 
  
  /* 
    DEBUG NOTES:
    - If personal event page doesn't load, verify param contains username only
    - Routes ending in '-album' should never reach this component
    - Check App.tsx routing logic if album pages appear here incorrectly
  */
  const [name, setName] = useState("");
  const { toast } = useToast();
  
  // Use the hook that properly sends localStorage params to backend
  const { personalEvent, isLoading: loading } = usePersonalEvent(username);

  // Helper function to get background class (for gradients only)
  const getBackgroundClass = () => {
    if (personalEvent?.backgroundType === 'gradient' && personalEvent.backgroundValue) {
      return `bg-gradient-to-br ${personalEvent.backgroundValue}`;
    }
    // Fallback to default
    return 'event-gradient';
  };

  // Helper function to get background style (for images)
  const getBackgroundStyle = () => {
    if (personalEvent?.backgroundType === 'image' && personalEvent.backgroundValue) {
      return {
        backgroundImage: `url(${personalEvent.backgroundValue})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }
    return {};
  };

  // Helper function to determine if we should use inline styles vs classes
  const shouldUseInlineStyle = () => {
    return personalEvent?.backgroundType === 'image' && personalEvent.backgroundValue;
  };

  // Helper function to format event date and time
  const formatEventDateTime = () => {
    if (!personalEvent?.eventDate) return null;
    
    try {
      const eventDateTime = personalEvent.eventTime 
        ? new Date(`${personalEvent.eventDate}T${personalEvent.eventTime}`)
        : new Date(`${personalEvent.eventDate}T00:00:00`);
      
      const now = new Date();
      const isUpcoming = eventDateTime > now;
      
      const dateOptions: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: personalEvent.timezone || 'America/Mexico_City'
      };
      
      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: personalEvent.timezone || 'America/Mexico_City'
      };
      
      const formattedDate = eventDateTime.toLocaleDateString('es-ES', dateOptions);
      const formattedTime = personalEvent.eventTime 
        ? eventDateTime.toLocaleTimeString('es-ES', timeOptions)
        : null;
      
      return {
        date: formattedDate,
        time: formattedTime,
        isUpcoming,
        full: eventDateTime
      };
    } catch (error) {
      console.error('Error formatting event date:', error);
      return null;
    }
  };



  // ⚠️ CRITICAL: AUTO-REDIRECT LOGIC - SUPABASE MIGRATION VERIFIED JULY 27, 2025
  // 
  // 🚨 BREAKING CHANGE PREVENTION:
  // - shouldRedirectToRSVP flag comes ONLY from backend calculation (never localStorage)
  // - Backend uses calculateShouldRedirect() with database enableAutoRedirect field
  // - Any localStorage usage here will break URL consistency
  //
  // ✅ VERIFIED WORKING CHAIN:
  // personalEvent.enableAutoRedirect (database) → calculateShouldRedirect() → shouldRedirectToRSVP → redirect
  //
  // 🔧 DEBUGGING REDIRECT ISSUES:
  // 1. Check backend logs for "REDIRECT CHECK START" to see enableAutoRedirect value
  // 2. Verify personalEvent.shouldRedirectToRSVP comes from API response, not localStorage
  // 3. Confirm redirect only happens when both enableAutoRedirect=true AND current time < eventDate
  useEffect(() => {
    if (personalEvent?.shouldRedirectToRSVP) {
      console.log('🔄 AUTO-REDIRECT: Redirecting to RSVP page based on server decision');
      setLocation(`/evento/${username}/registro`);
    }
  }, [personalEvent?.shouldRedirectToRSVP, username, setLocation]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !personalEvent) return;

    try {
      // Join the personal event using the existing join endpoint
      const response = await fetch(`/api/events/${personalEvent.id}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (response.ok) {
        const userData = await response.json();
        
        // Store current user data in localStorage
        localStorage.setItem("currentUser", JSON.stringify(userData));
        
        // Add small delay to ensure localStorage is written before navigation
        setTimeout(() => {
          setLocation(`/evento/${username}-album`);
        }, 100);
      } else {
        toast({
          title: "Error",
          description: "Error al unirse al evento",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error joining event:", error);
      toast({
        title: "Error",
        description: "Error al unirse al evento",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div 
        className={`min-h-screen ${!shouldUseInlineStyle() ? getBackgroundClass() : ''} flex items-center justify-center p-4`}
        style={shouldUseInlineStyle() ? getBackgroundStyle() : {}}
      >
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Cargando evento personal...</p>
        </div>
      </div>
    );
  }

  if (!personalEvent) {
    return (
      <div 
        className={`min-h-screen ${!shouldUseInlineStyle() ? getBackgroundClass() : ''} flex items-center justify-center p-4`}
        style={shouldUseInlineStyle() ? getBackgroundStyle() : {}}
      >
        <Card className="w-full max-w-md shadow-2xl">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Evento No Encontrado
            </h1>
            <p className="text-gray-600 mb-6">
              El evento personal de @{username} no pudo ser encontrado.
            </p>
            <Button 
              onClick={() => setLocation("/")}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen ${!shouldUseInlineStyle() ? getBackgroundClass() : ''}`}
      style={shouldUseInlineStyle() ? getBackgroundStyle() : {}}
    >
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardContent className="p-8">
            {/* Event Profile Section */}
            <div className="text-center mb-8">
              <div className="w-24 h-24 rounded-full bg-white p-1 mx-auto mb-4">
                <img 
                  src={personalEvent.coverImageUrl}
                  alt={personalEvent.title}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                {personalEvent.title}
              </h1>
              <p className="text-gray-600 text-sm text-center">
                {personalEvent.description}
              </p>

              {/* EVENT DATE AND TIME DISPLAY */}
              {formatEventDateTime() && (
                <div className="mt-4 bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center justify-center text-blue-800">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">
                      {formatEventDateTime()!.date}
                    </span>
                  </div>
                  {formatEventDateTime()!.time && (
                    <div className="flex items-center justify-center text-blue-700 mt-1">
                      <Clock className="w-3 h-3 mr-2" />
                      <span className="text-xs">
                        {formatEventDateTime()!.time}
                        {personalEvent.timezone && (
                          <span className="ml-1 text-blue-600">
                            ({personalEvent.timezone.split('/')[1].replace('_', ' ')})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {formatEventDateTime()!.isUpcoming && (
                    <div className="text-center mt-2">
                      <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        ¡Próximamente!
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Name Input Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Tu Nombre
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ingresa tu nombre"
                  className="mt-2 text-lg py-3 rounded-xl border-gray-300 focus:border-event-primary focus:ring-event-primary"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-blue-500 hover:bg-blue-700 text-white py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                disabled={!name.trim()}
              >
                ¡Vamos!
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}