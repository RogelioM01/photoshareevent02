import { useLoading } from "@/contexts/loading-context";
import { Loader2 } from "lucide-react";

/**
 * GLOBAL LOADING INDICATOR
 * 
 * Shows a persistent loading indicator when critical operations are in progress.
 * Positioned at the top of the screen to provide consistent feedback without blocking UI.
 */
export default function GlobalLoading() {
  const { isCriticalLoading, isAnyLoading, activeOperations } = useLoading();

  if (!isCriticalLoading) {
    return null;
  }

  const operationLabels: Record<string, string> = {
    'auth': 'Autenticando...',
    'photos-upload': 'Subiendo fotos...',
    'event-update': 'Actualizando evento...',
    'cover-upload': 'Subiendo portada...',
    'user-create': 'Creando usuario...',
    'user-update': 'Actualizando usuario...',
    'user-delete': 'Eliminando usuario...',
  };

  const currentOperation = Array.from(activeOperations)[0];
  const label = operationLabels[currentOperation] || 'Cargando...';

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white px-4 py-2 shadow-lg">
      <div className="flex items-center justify-center space-x-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}