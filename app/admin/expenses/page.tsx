'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, DollarSign, ArrowLeft } from 'lucide-react';
import { getExpenses, createExpense, deleteExpense, type Expense } from '@/lib/db';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency } from '@/lib/utils-service';
import { CurrencyInput } from '@/components/currency-input';
import Link from 'next/link';

const EXPENSE_CATEGORIES = [
  'Materiales',
  'Herramientas',
  'Servicios Externos',
  'Mantenimiento',
  'Alquiler',
  'Servicios Públicos',
  'Salarios',
  'Otros',
];

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    category: 'Materiales',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (error) {
      console.error('[v0] Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await createExpense({
        description: formData.description,
        amount: formData.amount,
        category: formData.category,
        date: formData.date,
        createdBy: user.id,
      });

      setFormData({
        description: '',
        amount: 0,
        category: 'Materiales',
        date: new Date().toISOString().split('T')[0],
      });

      await loadExpenses();
    } catch (error) {
      console.error('[v0] Error creating expense:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este gasto?')) return;

    try {
      await deleteExpense(id);
      await loadExpenses();
    } catch (error) {
      console.error('[v0] Error deleting expense:', error);
    }
  };

  const totalByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout title="Historial de Gastos">
        <div className="space-y-6">
          <Button variant="ghost" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Panel
            </Link>
          </Button>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Gastos
                    </p>
                    <h3 className="text-2xl font-bold mt-2">
                      {formatCurrency(totalExpenses)}
                    </h3>
                  </div>
                  <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/20">
                    <DollarSign className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {Object.entries(totalByCategory).slice(0, 3).map(([category, amount]) => (
              <Card key={category}>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-muted-foreground">
                    {category}
                  </p>
                  <h3 className="text-2xl font-bold mt-2">
                    {formatCurrency(amount)}
                  </h3>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add Expense Form */}
          <Card>
            <CardHeader>
              <CardTitle>Agregar Gasto</CardTitle>
              <CardDescription>
                Registra un nuevo gasto del taller
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Ej: Compra de herramientas"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Monto (COP)</Label>
                    <CurrencyInput
                      value={formData.amount}
                      onChange={(value) => setFormData({ ...formData, amount: value })}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger id="category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Fecha</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <Button type="submit">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Gasto
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Expenses List */}
          <Card>
            <CardHeader>
              <CardTitle>Listado de Gastos</CardTitle>
              <CardDescription>
                Todos los gastos registrados en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Cargando gastos...
                </div>
              ) : expenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay gastos registrados
                </div>
              ) : (
                <div className="space-y-2">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold">{expense.description}</h4>
                          <span className="text-xs px-2 py-1 bg-muted rounded">
                            {expense.category}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-red-600 dark:text-red-400">
                          {formatCurrency(expense.amount)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(expense.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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
