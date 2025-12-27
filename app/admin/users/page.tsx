'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Users, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { getUsers, saveUser } from '@/lib/db';
import { generateId } from '@/lib/utils-service';
import type { User, UserRole } from '@/lib/types';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'client' as UserRole,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allUsers = getUsers();
    setUsers(allUsers);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'client',
    });
    setEditingUser(null);
    setError('');
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || (!editingUser && !formData.password)) {
      setError('Por favor complete todos los campos requeridos');
      return;
    }

    const emailExists = users.some(
      u => u.email === formData.email && u.id !== editingUser?.id
    );
    if (emailExists) {
      setError('Ya existe un usuario con ese correo electrónico');
      return;
    }

    const user: User = {
      id: editingUser?.id || generateId(),
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password || editingUser?.password || '',
      role: formData.role,
      createdAt: editingUser?.createdAt || new Date().toISOString(),
    };

    saveUser(user);
    loadData();
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (userId: string) => {
    if (confirm('¿Está seguro de eliminar este usuario?')) {
      const updatedUsers = users.filter(u => u.id !== userId);
      localStorage.setItem('workshop_users', JSON.stringify(updatedUsers));
      loadData();
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      client: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      technician: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'quality-control': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    };
    const labels = {
      admin: 'Administrador',
      client: 'Cliente',
      technician: 'Técnico',
      'quality-control': 'Control de Calidad',
    };
    return <Badge className={colors[role]}>{labels[role]}</Badge>;
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout title="Gestión de Usuarios">
        <div className="space-y-6">
          <Button variant="ghost" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Panel
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Usuarios del Sistema</CardTitle>
                  <CardDescription>
                    Administra los usuarios y sus permisos
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Usuario
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                      </DialogTitle>
                      <DialogDescription>
                        Complete los datos del usuario
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre Completo *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="Juan Pérez"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Correo Electrónico *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="usuario@ejemplo.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">
                          Contraseña {editingUser && '(dejar vacío para mantener)'}
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                          }
                          placeholder={editingUser ? 'Nueva contraseña' : 'Contraseña'}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role">Rol *</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value: UserRole) =>
                            setFormData({ ...formData, role: value })
                          }
                        >
                          <SelectTrigger id="role">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="client">Cliente</SelectItem>
                            <SelectItem value="technician">Técnico</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="quality-control">Control de Calidad</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {error && (
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit">
                          {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <Input
                  placeholder="Buscar por nombre o correo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
                <Select
                  value={roleFilter}
                  onValueChange={(value: UserRole | 'all') => setRoleFilter(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    <SelectItem value="admin">Administradores</SelectItem>
                    <SelectItem value="client">Clientes</SelectItem>
                    <SelectItem value="technician">Técnicos</SelectItem>
                    <SelectItem value="quality-control">Control de Calidad</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>
                    {searchTerm || roleFilter !== 'all'
                      ? 'No se encontraron usuarios'
                      : 'No hay usuarios registrados'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{user.name}</h4>
                          {getRoleBadge(user.role)}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Creado: {new Date(user.createdAt).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(user.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
