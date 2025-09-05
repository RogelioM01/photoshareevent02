import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface BackgroundSelectorProps {
  backgroundType: string;
  backgroundValue: string;
  onBackgroundChange: (type: string, value: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
  isUploading?: boolean;
}

// Predefined gradient options
const GRADIENT_OPTIONS = [
  { name: "Elegante", value: "from-white to-gray-300", preview: "bg-gradient-to-r from-white to-gray-300" },
  { name: "Rosa Clásico", value: "from-pink-500 to-pink-600", preview: "bg-gradient-to-r from-pink-500 to-pink-600" },
  { name: "Atardecer", value: "from-orange-400 to-pink-600", preview: "bg-gradient-to-r from-orange-400 to-pink-600" },
  { name: "Océano", value: "from-blue-400 to-blue-600", preview: "bg-gradient-to-r from-blue-400 to-blue-600" },
  { name: "Bosque", value: "from-green-400 to-green-600", preview: "bg-gradient-to-r from-green-400 to-green-600" },
  { name: "Lavanda", value: "from-purple-400 to-purple-600", preview: "bg-gradient-to-r from-purple-400 to-purple-600" },
  { name: "Dorado", value: "from-yellow-400 to-orange-500", preview: "bg-gradient-to-r from-yellow-400 to-orange-500" },
  { name: "Cereza", value: "from-red-400 to-red-600", preview: "bg-gradient-to-r from-red-400 to-red-600" },
  { name: "Cielo Suave", value: "from-sky-200 to-white", preview: "bg-gradient-to-r from-sky-200 to-white" },
  { name: "Rosa Suave", value: "from-pink-300 to-purple-400", preview: "bg-gradient-to-r from-pink-300 to-purple-400" },
  { name: "Violeta", value: "from-indigo-500 to-purple-600", preview: "bg-gradient-to-r from-indigo-500 to-purple-600" },
  { name: "Coral", value: "from-red-300 to-pink-400", preview: "bg-gradient-to-r from-red-300 to-pink-400" }
];

export default function BackgroundSelector({ 
  backgroundType, 
  backgroundValue, 
  onBackgroundChange, 
  onImageUpload,
  isUploading 
}: BackgroundSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  


  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      try {
        const imageUrl = await onImageUpload(file);
        onBackgroundChange("image", imageUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Fondo del Evento</Label>
      
      {/* Tab Buttons */}
      <div className="flex rounded-lg border border-gray-200 p-1">
        <button
          onClick={() => {
            // Only change if switching from image to gradient
            if (backgroundType !== "gradient") {
              onBackgroundChange("gradient", GRADIENT_OPTIONS[0].value);
            }
          }}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            backgroundType === "gradient" 
              ? "bg-white text-gray-900 shadow-sm" 
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Gradientes
        </button>
        <button
          onClick={() => {
            // Only change type, keep existing image value
            if (backgroundType !== "image") {
              onBackgroundChange("image", backgroundValue.startsWith("http") ? backgroundValue : "");
            }
          }}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            backgroundType === "image" 
              ? "bg-white text-gray-900 shadow-sm" 
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Imagen Personalizada
        </button>
      </div>
      
      {/* Content */}
      {backgroundType === "gradient" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {GRADIENT_OPTIONS.map((gradient) => (
              <button
                key={gradient.value}
                onClick={() => {
                  // Only change if different value
                  if (backgroundType !== "gradient" || backgroundValue !== gradient.value) {
                    onBackgroundChange("gradient", gradient.value);
                  }
                }}
                className={`relative h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  backgroundType === "gradient" && backgroundValue === gradient.value
                    ? "border-pink-500 ring-2 ring-pink-200" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`w-full h-full ${gradient.preview}`} />
                {backgroundType === "gradient" && backgroundValue === gradient.value && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                  {gradient.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              {backgroundType === "image" && backgroundValue && backgroundValue.startsWith("http") ? (
                <div className="space-y-4">
                  <div className="w-full h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                    <img
                      src={backgroundValue}
                      alt="Fondo personalizado"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full"
                  >
                    {isUploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {isUploading ? "Subiendo..." : "Cambiar Imagen"}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Sube una imagen personalizada para el fondo</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {isUploading ? "Subiendo..." : "Seleccionar Imagen"}
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    JPG, PNG, GIF (máx. 5MB)
                  </p>
                </div>
              )}
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}