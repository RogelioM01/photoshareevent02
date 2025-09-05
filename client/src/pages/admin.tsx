import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Database, Users, Plus, Edit, Trash2, Save, X, Eye, Power, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useLocation } from "wouter";
import { getAuthUser } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo } from "react";
import type { User as UserType } from "@shared/schema";

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const currentUser = getAuthUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // DEBUG: Deployment Version Tracking - UPDATED
  const deploymentVersion = "v2.0.CRITICAL.SYNC.TEST";
  const buildId = Date.now();
  console.log("🚀 ADMIN PANEL DEPLOYMENT VERSION:", deploymentVersion);
  console.log("🆔 BUILD ID:", buildId);
  console.log("🌐 Current URL:", window.location.href);
  console.log("📅 Build Timestamp:", new Date().toISOString());
  
  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    isAdmin: false,
    isActive: true
  });

  // DEBUG NOTE #1: Critical Security Fix - Admin Redirect Logic
  // PROBLEM SOLVED: Moved redirect from render to useEffect to avoid React warning:
  // "Cannot update during render" - redirects during render are anti-patterns
  // DEBUGGING: If admin access fails, check: currentUser.isAdmin value and localStorage auth data
  useEffect(() => {
    if (currentUser && !currentUser.isAdmin) {
      console.debug("🚫 Non-admin user detected, redirecting to home:", currentUser.username);
      setLocation("/");
    }
  }, [currentUser, setLocation]);

  // DEBUG NOTE #2: React Query with Strong TypeScript Typing
  // IMPROVEMENT: Explicit UserType[] typing eliminates TypeScript errors and provides intellisense
  // DEBUGGING: If users don't load, check network tab for /api/users endpoint response
  // DEBUGGING: Verify database connection and app_users table exists with proper schema
  const { data: users = [], isLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
    // Default empty array prevents undefined errors during initial load
  });

  // DEBUG NOTE #3: Performance Optimization with useMemo
  // PERFORMANCE FIX: Statistics calculated only when users array changes
  // WITHOUT useMemo: Stats recalculated on every render (expensive for large user lists)
  // DEBUGGING: If stats are incorrect, log users array and check filter logic
  const stats = useMemo(() => {
    const activeUsers = users.filter((user) => user.isActive).length;
    const adminUsers = users.filter((user) => user.isAdmin).length;
    const totalUsers = users.length;
    console.debug("📊 Admin Panel Stats Calculated:", { total: totalUsers, active: activeUsers, admins: adminUsers });
    return { total: totalUsers, active: activeUsers, admins: adminUsers };
  }, [users]);

  // Return null if user is not admin while useEffect handles redirect
  if (!currentUser?.isAdmin) {
    return null;
  }

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof formData) => {
      return await apiRequest("/api/users", "POST", userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowAddForm(false);
      setFormData({ username: '', email: '', fullName: '', password: '', isAdmin: false, isActive: true });
      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear usuario",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<UserType> }) => {
      return await apiRequest(`/api/users/${id}`, "PUT", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditingUser(null);
      toast({
        title: "Usuario actualizado",
        description: "El usuario ha sido actualizado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar usuario",
        variant: "destructive",
      });
    },
  });

  // DEBUG NOTE #4: Critical Fix - Database CASCADE Deletion with Optimistic Updates
  // MAJOR ISSUE SOLVED: Foreign key constraint "photo_likes_photo_id_fkey" violation
  // ROOT CAUSE: Database lacked CASCADE deletion - when user deleted, child records remained
  // SOLUTION IMPLEMENTED: ON DELETE CASCADE on all foreign keys in database schema
  // CASCADE CHAIN: User → Events → Event_Users → Photos → Photo_Likes → Text_Posts
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      console.debug("🗑️ Starting CASCADE user deletion:", id);
      const result = await apiRequest(`/api/users/${id}`, "DELETE");
      console.debug("✅ CASCADE deletion completed successfully for user:", id);
      return result;
    },
    // OPTIMISTIC UPDATE: UI responds instantly while server processes CASCADE deletion
    // DEBUGGING: If user reappears after deletion, check server logs for CASCADE errors
    onMutate: async (userIdToDelete) => {
      console.debug("⚡ Optimistic update: Removing user from UI immediately:", userIdToDelete);
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ["/api/users"] });

      // Snapshot previous value for potential rollback on error
      const previousUsers = queryClient.getQueryData<UserType[]>(["/api/users"]);

      // Optimistically update cache by removing the user immediately
      queryClient.setQueryData<UserType[]>(
        ["/api/users"],
        (old) => old?.filter((user) => user.id !== userIdToDelete) ?? []
      );

      // Return context for potential rollback if server deletion fails
      return { previousUsers };
    },
    onSuccess: () => {
      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado exitosamente.",
      });
    },
    onError: (error: any, variables, context) => {
      // ROLLBACK MECHANISM: If server deletion fails, restore original user list
      // DEBUGGING: If user keeps reappearing, check server logs for specific error details
      if (context?.previousUsers) {
        console.debug("🔄 Rolling back optimistic update due to server error");
        queryClient.setQueryData(["/api/users"], context.previousUsers);
      }
      console.error("❌ CASCADE deletion failed on server:", error);
      toast({
        title: "Error",
        description: error.message || "Error al eliminar usuario",
        variant: "destructive",
      });
    },
    // Always refetch to ensure data consistency (success or error)
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });

  // Form handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, updates: formData });
    } else {
      createUserMutation.mutate(formData);
    }
  };

  const handleEdit = (user: UserType) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      fullName: user.fullName || '',
      password: '', // Empty password means keep current password
      isAdmin: user.isAdmin,
      isActive: user.isActive
    });
    setShowAddForm(true);
  };

  // Fix #2: Replace window.confirm with modern modal dialog
  const handleDelete = (user: UserType) => {
    if (user.id === currentUser.id) {
      toast({
        title: "Error",
        description: "No puedes eliminar tu propia cuenta",
        variant: "destructive",
      });
      return;
    }
    
    // Set user to delete, which will trigger the confirmation dialog
    setUserToDelete(user);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
      setUserToDelete(null);
    }
  };

  const handleViewUserEvent = (user: UserType) => {
    setLocation(`/evento/${user.username}-album`);
  };

  const handleToggleUserStatus = (user: UserType) => {
    updateUserMutation.mutate({ 
      id: user.id, 
      updates: { isActive: !user.isActive } 
    });
    
    toast({
      title: user.isActive ? "Usuario desactivado" : "Usuario activado",
      description: `${user.username} ha sido ${user.isActive ? 'desactivado' : 'activado'} exitosamente.`,
    });
  };

  const resetForm = () => {
    setFormData({ username: '', email: '', fullName: '', password: '', isAdmin: false, isActive: true });
    setEditingUser(null);
    setShowAddForm(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p>Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-8 h-8 text-pink-500" />
              Admin
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setLocation("/admin/links")}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
              data-testid="button-nav-links"
            >
              <Link className="w-4 h-4 mr-2" />
              Sistema de Enlaces
            </Button>
            <Button
              onClick={() => setShowAddForm(true)}
              className="event-gradient text-white"
              data-testid="button-create-user"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Usuario
            </Button>
            <Button
              onClick={() => setLocation("/admin/email-config")}
              variant="secondary"
            >
              Configurar Emails
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Usuarios</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                </div>
                <User className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Administradores</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
                </div>
                <Shield className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add/Edit User Form */}
        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{editingUser ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                      disabled={!!editingUser}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingUser}
                      placeholder={editingUser ? "Leave blank to keep current password" : "Enter password"}
                    />
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isAdmin"
                        checked={formData.isAdmin}
                        onCheckedChange={(checked) => setFormData({ ...formData, isAdmin: checked })}
                      />
                      <Label htmlFor="isAdmin">Admin</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      />
                      <Label htmlFor="isActive">Active</Label>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    className="event-gradient text-white"
                    disabled={createUserMutation.isPending || updateUserMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingUser ? 'Update' : 'Create'} User
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Lista de Usuarios Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium text-gray-600">User</th>
                    <th className="text-left p-3 font-medium text-gray-600">Email</th>
                    <th className="text-left p-3 font-medium text-gray-600">Role</th>
                    <th className="text-left p-3 font-medium text-gray-600">Status</th>
                    <th className="text-left p-3 font-medium text-gray-600">Created</th>
                    <th className="text-left p-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(user => user.isActive).map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center space-x-3">
                          {user.isAdmin ? (
                            <Shield className="w-5 h-5 text-blue-500" />
                          ) : (
                            <User className="w-5 h-5 text-gray-400" />
                          )}
                          <div>
                            <div className="font-medium">
                              {user.fullName || user.username}
                            </div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-gray-600">{user.email}</td>
                      <td className="p-3">
                        {user.isAdmin ? (
                          <Badge variant="secondary">Admin</Badge>
                        ) : (
                          <Badge variant="outline">User</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant="default">Active</Badge>
                      </td>
                      <td className="p-3 text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewUserEvent(user)}
                            title={`Ver galería de ${user.username}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(user)}
                            title="Editar usuario"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleUserStatus(user)}
                            title="Desactivar usuario"
                            className="text-orange-600 hover:text-orange-700"
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user)}
                            disabled={user.id === currentUser.id}
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Inactive Users Table */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Lista de Usuarios Inactivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium text-gray-600">User</th>
                    <th className="text-left p-3 font-medium text-gray-600">Email</th>
                    <th className="text-left p-3 font-medium text-gray-600">Role</th>
                    <th className="text-left p-3 font-medium text-gray-600">Status</th>
                    <th className="text-left p-3 font-medium text-gray-600">Created</th>
                    <th className="text-left p-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(user => !user.isActive).map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50 opacity-75">
                      <td className="p-3">
                        <div className="flex items-center space-x-3">
                          {user.isAdmin ? (
                            <Shield className="w-5 h-5 text-blue-500" />
                          ) : (
                            <User className="w-5 h-5 text-gray-400" />
                          )}
                          <div>
                            <div className="font-medium">
                              {user.fullName || user.username}
                            </div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-gray-600">{user.email}</td>
                      <td className="p-3">
                        {user.isAdmin ? (
                          <Badge variant="secondary">Admin</Badge>
                        ) : (
                          <Badge variant="outline">User</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant="destructive">Inactive</Badge>
                      </td>
                      <td className="p-3 text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewUserEvent(user)}
                            title={`Ver galería de ${user.username}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(user)}
                            title="Editar usuario"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleUserStatus(user)}
                            title="Activar usuario"
                            className="text-green-600 hover:text-green-700"
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user)}
                            disabled={user.id === currentUser.id}
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.filter(user => !user.isActive).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No hay usuarios inactivos
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fix #2: Modern confirmation dialog replacing window.confirm */}
        <AlertDialog open={userToDelete !== null} onOpenChange={() => setUserToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de que quieres eliminar a <strong>{userToDelete?.username}</strong>? 
                Esta acción no se puede deshacer y se eliminarán todos los datos asociados con este usuario.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Eliminar Usuario
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}