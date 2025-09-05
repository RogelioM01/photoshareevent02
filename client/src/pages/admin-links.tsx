import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, Copy, BarChart3, Plus, ExternalLink, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";
import type { BrandedLink } from "@shared/schema";

export default function AdminLinks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    originalUrl: '',
    customCode: ''
  });

  // Fetch branded links
  const { data: links = [], isLoading } = useQuery<BrandedLink[]>({
    queryKey: ["/api/admin/links"],
  });

  // Create link mutation
  const createLinkMutation = useMutation({
    mutationFn: async (linkData: { originalUrl: string; customCode?: string }) => {
      const response = await fetch("/api/admin/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(linkData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear enlace');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/links"] });
      toast({
        title: "✅ Link creado exitosamente",
        description: `${data.shortUrl} → ${formData.originalUrl}`,
      });
      setShowCreateForm(false);
      setFormData({ originalUrl: '', customCode: '' });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error al crear link",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive"
      });
    }
  });

  // Delete link mutation
  const deleteLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const response = await fetch(`/api/admin/links/${linkId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar enlace');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/links"] });
      toast({
        title: "🗑️ Link eliminado",
        description: "El link ha sido eliminado exitosamente",
      });
      setLinkToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error al eliminar link",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive"
      });
    }
  });

  const handleCreateLink = () => {
    if (!formData.originalUrl) {
      toast({
        title: "❌ URL requerida",
        description: "Por favor ingresa una URL válida",
        variant: "destructive"
      });
      return;
    }

    createLinkMutation.mutate({
      originalUrl: formData.originalUrl,
      customCode: formData.customCode || undefined
    });
  };

  const handleCopyLink = (shortCode: string) => {
    navigator.clipboard.writeText(`https://rocky.mx/s/${shortCode}`);
    toast({
      title: "📋 Link copiado",
      description: `https://rocky.mx/s/${shortCode}`,
    });
  };

  const handleDeleteLink = (id: string) => {
    deleteLinkMutation.mutate(id);
  };

  const totalClicks = links.reduce((sum, link) => sum + parseInt(link.clicks), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Link className="h-6 w-6 text-blue-600" />
                Sistema de Enlaces Rocky.mx
              </h1>
              <p className="text-gray-600 mt-1">
                Gestiona y analiza links cortos para eventos (Demo)
              </p>
            </div>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-create-link"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Link
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Links</CardTitle>
              <Link className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-links">
                {isLoading ? "..." : links.length}
              </div>
              <p className="text-xs text-muted-foreground">enlaces activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-clicks">
                {isLoading ? "..." : totalClicks.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">clicks totales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio por Link</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-avg-clicks">
                {isLoading || links.length === 0 ? "0" : Math.round(totalClicks / links.length)}
              </div>
              <p className="text-xs text-muted-foreground">clicks por enlace</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activos Hoy</CardTitle>
              <Link className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="stat-active-today">
                {isLoading ? "..." : links.filter(link => link.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">enlaces activos</p>
            </CardContent>
          </Card>
        </div>

        {/* Links Table */}
        <Card>
          <CardHeader>
            <CardTitle>Enlaces Activos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p>Cargando enlaces...</p>
              </div>
            ) : links.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Link className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No hay enlaces creados aún</p>
                <p className="text-sm">Crea tu primer enlace corto</p>
              </div>
            ) : (
              <div className="space-y-4">
                {links.map((link) => (
                <div 
                  key={link.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  data-testid={`link-item-${link.id}`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono">
                          rocky.mx/s/{link.shortCode}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyLink(link.shortCode)}
                          data-testid={`button-copy-${link.id}`}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      {link.originalUrl}
                    </div>
                    <div className="text-xs text-gray-500">
                      Creado: {new Date(link.createdAt).toLocaleDateString()} 
                      {link.lastClickedAt && ` • Último click: ${new Date(link.lastClickedAt).toLocaleDateString()}`}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600" data-testid={`clicks-${link.id}`}>
                        {parseInt(link.clicks)}
                      </div>
                      <div className="text-xs text-gray-500">clicks</div>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" data-testid={`button-edit-${link.id}`}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setLinkToDelete(link.id)}
                        data-testid={`button-delete-${link.id}`}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Success Notice */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-800">
              <BarChart3 className="h-5 w-5" />
              <strong>Sistema Activo:</strong> El sistema de enlaces cortos está funcionando. 
              Puedes crear y gestionar enlaces que redirijan a cualquier URL.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Link Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Crear Nuevo Link</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="originalUrl">URL Original</Label>
                <Input
                  id="originalUrl"
                  type="url"
                  placeholder="https://rocky.mx/evento/mi-evento"
                  value={formData.originalUrl}
                  onChange={(e) => setFormData({ ...formData, originalUrl: e.target.value })}
                  data-testid="input-original-url"
                />
              </div>
              <div>
                <Label htmlFor="customCode">Código Personalizado (opcional)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">rocky.mx/</span>
                  <Input
                    id="customCode"
                    placeholder="mi-evento-especial"
                    value={formData.customCode}
                    onChange={(e) => setFormData({ ...formData, customCode: e.target.value })}
                    data-testid="input-custom-code"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Si se deja vacío, se generará automáticamente
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
                data-testid="button-cancel-create"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateLink}
                disabled={!formData.originalUrl || createLinkMutation.isPending}
                data-testid="button-confirm-create"
              >
                {createLinkMutation.isPending ? "Creando..." : "Crear Link"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!linkToDelete} onOpenChange={() => setLinkToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar link?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El link dejará de funcionar inmediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => linkToDelete && handleDeleteLink(linkToDelete)}
              data-testid="button-confirm-delete"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}