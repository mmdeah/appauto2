'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Trash2, Plus, Calendar } from 'lucide-react';
import { getExpenses, getRevenues, createExpense, deleteExpense, deleteRevenue } from '@/lib/db';
import { formatCurrency } from '@/lib/utils-service';
import { useAuth } from '@/lib/auth-context';
import { CurrencyInput } from '@/components/currency-input';
import Link from 'next/link';
import type { Expense, Revenue } from '@/lib/types';

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

type PeriodType = '7d' | '30d' | '3m' | '12m' | 'custom';

// Componente de gráfico de líneas
const LineChart = ({ 
  data, 
  labels, 
  title, 
  color = 'blue',
  height = 200 
}: { 
  data: number[], 
  labels: string[], 
  title: string,
  color?: string,
  height?: number
}) => {
  const maxValue = Math.max(...data, 1);
  const minValue = Math.min(...data, 0);
  const range = maxValue - minValue || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1 || 1)) * 100;
    const y = 100 - ((value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const colorClasses: Record<string, string> = {
    green: 'stroke-green-500 fill-green-500',
    red: 'stroke-red-500 fill-red-500',
    blue: 'stroke-blue-500 fill-blue-500',
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
      <div className="relative" style={{ height: `${height}px` }}>
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-muted opacity-20"
            />
          ))}
          {/* Area under curve */}
          <polygon
            points={`0,100 ${points} 100,100`}
            className={`${colorClasses[color]} opacity-20`}
          />
          {/* Line */}
          <polyline
            points={points}
            fill="none"
            strokeWidth="2"
            className={colorClasses[color]}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Data points */}
          {data.map((value, index) => {
            const x = (index / (data.length - 1 || 1)) * 100;
            const y = 100 - ((value - minValue) / range) * 100;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="1.5"
                className={colorClasses[color]}
              />
            );
          })}
        </svg>
        {/* Labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground">
          {labels.map((label, index) => (
            <span key={index} className="transform -rotate-45 origin-top-left">
              {label}
            </span>
          ))}
        </div>
      </div>
      {/* Values */}
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Min: {formatCurrency(minValue)}</span>
        <span className="text-muted-foreground">Max: {formatCurrency(maxValue)}</span>
      </div>
    </div>
  );
};

// Gráfico combinado de múltiples líneas
const MultiLineChart = ({
  revenues,
  expenses,
  profits,
  labels,
  height = 300
}: {
  revenues: number[],
  expenses: number[],
  profits: number[],
  labels: string[],
  height?: number
}) => {
  const allValues = [...revenues, ...expenses, ...profits];
  const maxValue = Math.max(...allValues, 1);
  const minValue = Math.min(...allValues, 0);
  const range = maxValue - minValue || 1;

  const revenuePoints = revenues.map((value, index) => {
    const x = (index / (revenues.length - 1 || 1)) * 100;
    const y = 100 - ((value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const expensePoints = expenses.map((value, index) => {
    const x = (index / (expenses.length - 1 || 1)) * 100;
    const y = 100 - ((value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const profitPoints = profits.map((value, index) => {
    const x = (index / (profits.length - 1 || 1)) * 100;
    const y = 100 - ((value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative" style={{ height: `${height}px` }}>
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-muted opacity-20"
          />
        ))}
        
        {/* Revenue area */}
        <polygon
          points={`0,100 ${revenuePoints} 100,100`}
          className="fill-green-500 opacity-10"
        />
        {/* Revenue line */}
        <polyline
          points={revenuePoints}
          fill="none"
          strokeWidth="2"
          className="stroke-green-500"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Expense area */}
        <polygon
          points={`0,100 ${expensePoints} 100,100`}
          className="fill-red-500 opacity-10"
        />
        {/* Expense line */}
        <polyline
          points={expensePoints}
          fill="none"
          strokeWidth="2"
          className="stroke-red-500"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Profit line */}
        <polyline
          points={profitPoints}
          fill="none"
          strokeWidth="2"
          strokeDasharray="4 4"
          className="stroke-blue-500"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {revenues.map((value, index) => {
          const x = (index / (revenues.length - 1 || 1)) * 100;
          const y = 100 - ((value - minValue) / range) * 100;
          return (
            <circle key={`rev-${index}`} cx={x} cy={y} r="1.5" className="fill-green-500" />
          );
        })}
        {expenses.map((value, index) => {
          const x = (index / (expenses.length - 1 || 1)) * 100;
          const y = 100 - ((value - minValue) / range) * 100;
          return (
            <circle key={`exp-${index}`} cx={x} cy={y} r="1.5" className="fill-red-500" />
          );
        })}
        {profits.map((value, index) => {
          const x = (index / (profits.length - 1 || 1)) * 100;
          const y = 100 - ((value - minValue) / range) * 100;
          return (
            <circle key={`prof-${index}`} cx={x} cy={y} r="1.5" className="fill-blue-500" />
          );
        })}
      </svg>
      {/* Labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground px-2">
        {labels.map((label, index) => (
          <span key={index} className="transform -rotate-45 origin-top-left whitespace-nowrap">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default function StatisticsPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodType, setPeriodType] = useState<PeriodType>('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Formulario de gastos
  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    category: 'Materiales',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, [periodType, customStartDate, customEndDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [expensesData, revenuesData] = await Promise.all([
        getExpenses(),
        getRevenues(),
      ]);
      setExpenses(expensesData);
      setRevenues(revenuesData);
    } catch (error) {
      console.error('[v0] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular fechas según el periodo seleccionado
  const getDateRange = () => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    let start = new Date();

    if (periodType === 'custom') {
      if (customStartDate && customEndDate) {
        start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        end.setTime(new Date(customEndDate).getTime());
        end.setHours(23, 59, 59, 999);
      } else {
        // Si no hay fechas personalizadas, usar último mes
        start.setMonth(start.getMonth() - 1);
      }
    } else if (periodType === '7d') {
      start.setDate(start.getDate() - 7);
    } else if (periodType === '30d') {
      start.setMonth(start.getMonth() - 1);
    } else if (periodType === '3m') {
      start.setMonth(start.getMonth() - 3);
    } else if (periodType === '12m') {
      start.setFullYear(start.getFullYear() - 1);
    }

    return { start, end };
  };

  // Filtrar datos por periodo
  const { start, end } = getDateRange();
  const filteredExpenses = expenses.filter(e => {
    const date = new Date(e.date || e.created_at);
    return date >= start && date <= end;
  });

  const filteredRevenues = revenues.filter(r => {
    const date = new Date(r.date || r.created_at);
    return date >= start && date <= end;
  });

  // Agrupar por día/semana/mes según el periodo
  const getGroupedData = () => {
    const groups: Record<string, { expenses: number; revenues: number; date: Date }> = {};
    
    filteredExpenses.forEach(expense => {
      const date = new Date(expense.date || expense.created_at);
      let key = '';
      
      if (periodType === '7d' || periodType === '30d') {
        key = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      } else {
        key = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
      }
      
      if (!groups[key]) {
        groups[key] = { expenses: 0, revenues: 0, date };
      }
      groups[key].expenses += expense.amount;
    });

    filteredRevenues.forEach(revenue => {
      const date = new Date(revenue.date || revenue.created_at);
      let key = '';
      
      if (periodType === '7d' || periodType === '30d') {
        key = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      } else {
        key = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
      }
      
      if (!groups[key]) {
        groups[key] = { expenses: 0, revenues: 0, date };
      }
      groups[key].revenues += revenue.amount;
    });

    // Ordenar por fecha
    return Object.entries(groups)
      .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
      .map(([key, value]) => ({
        label: key,
        expenses: value.expenses,
        revenues: value.revenues,
        profit: value.revenues - value.expenses,
        date: value.date,
      }));
  };

  const groupedData = getGroupedData();
  const revenuesData = groupedData.map(g => g.revenues);
  const expensesData = groupedData.map(g => g.expenses);
  const profitsData = groupedData.map(g => g.profit);
  const labels = groupedData.map(g => g.label);

  // Agrupar por mes para el resumen mensual
  const getMonthlySummary = () => {
    const months: Record<string, { expenses: number; revenues: number; count: number }> = {};
    
    filteredExpenses.forEach(expense => {
      const date = new Date(expense.date || expense.created_at);
      const key = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      if (!months[key]) {
        months[key] = { expenses: 0, revenues: 0, count: 0 };
      }
      months[key].expenses += expense.amount;
    });

    filteredRevenues.forEach(revenue => {
      const date = new Date(revenue.date || revenue.created_at);
      const key = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      if (!months[key]) {
        months[key] = { expenses: 0, revenues: 0, count: 0 };
      }
      months[key].revenues += revenue.amount;
      months[key].count += 1;
    });

    return Object.entries(months)
      .sort((a, b) => {
        const dateA = new Date(a[0]);
        const dateB = new Date(b[0]);
        return dateB.getTime() - dateA.getTime();
      })
      .map(([month, data]) => ({
        month,
        expenses: data.expenses,
        revenues: data.revenues,
        profit: data.revenues - data.expenses,
        count: data.count,
      }));
  };

  const monthlySummary = getMonthlySummary();

  // Totales del periodo
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRevenues = filteredRevenues.reduce((sum, r) => sum + r.amount, 0);
  const totalProfit = totalRevenues - totalExpenses;

  // Handlers
  const handleSubmitExpense = async (e: React.FormEvent) => {
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

      await loadData();
    } catch (error) {
      console.error('[v0] Error creating expense:', error);
      alert('Error al crear el gasto. Por favor intenta nuevamente.');
    }
  };

  const handleDeleteRevenue = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este ingreso? Esta acción no se puede deshacer.')) return;

    try {
      await deleteRevenue(id);
      await loadData();
    } catch (error) {
      console.error('[v0] Error deleting revenue:', error);
      alert('Error al eliminar el ingreso. Por favor intenta nuevamente.');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este gasto? Esta acción no se puede deshacer.')) return;

    try {
      await deleteExpense(id);
      await loadData();
    } catch (error) {
      console.error('[v0] Error deleting expense:', error);
      alert('Error al eliminar el gasto. Por favor intenta nuevamente.');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <DashboardLayout title="Estadísticas y Reportes">
          <div className="text-center py-12 text-muted-foreground">Cargando estadísticas...</div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout title="Estadísticas y Reportes">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">Estadísticas y Reportes</h1>
              <p className="text-muted-foreground">Análisis de ingresos, gastos y ganancias</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Link>
            </Button>
          </div>

          {/* Selector de Periodo */}
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Periodo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant={periodType === '7d' ? 'default' : 'outline'}
                  onClick={() => setPeriodType('7d')}
                  className="w-full sm:w-auto"
                >
                  Últimos 7 días
                </Button>
                <Button
                  variant={periodType === '30d' ? 'default' : 'outline'}
                  onClick={() => setPeriodType('30d')}
                  className="w-full sm:w-auto"
                >
                  Últimos 30 días
                </Button>
                <Button
                  variant={periodType === '3m' ? 'default' : 'outline'}
                  onClick={() => setPeriodType('3m')}
                  className="w-full sm:w-auto"
                >
                  Últimos 3 meses
                </Button>
                <Button
                  variant={periodType === '12m' ? 'default' : 'outline'}
                  onClick={() => setPeriodType('12m')}
                  className="w-full sm:w-auto"
                >
                  Últimos 12 meses
                </Button>
                <Button
                  variant={periodType === 'custom' ? 'default' : 'outline'}
                  onClick={() => setPeriodType('custom')}
                  className="w-full sm:w-auto"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Personalizado
                </Button>
              </div>

              {periodType === 'custom' && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Fecha Inicio</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">Fecha Fin</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumen del Periodo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Ingresos</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenues)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Gastos</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ganancia Neta</p>
                    <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(totalProfit)}
                    </p>
                  </div>
                  <DollarSign className={`h-8 w-8 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumen Mensual Detallado */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen Mensual Detallado</CardTitle>
              <CardDescription>Desglose de ingresos y gastos por mes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold">Mes</th>
                      <th className="text-right p-2 font-semibold">Ingresos</th>
                      <th className="text-right p-2 font-semibold">Gastos</th>
                      <th className="text-right p-2 font-semibold">Ganancia</th>
                      <th className="text-right p-2 font-semibold"># Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlySummary.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center p-4 text-muted-foreground">
                          No hay datos para el periodo seleccionado
                        </td>
                      </tr>
                    ) : (
                      monthlySummary.map((month, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-medium">{month.month}</td>
                          <td className="p-2 text-right text-green-600">{formatCurrency(month.revenues)}</td>
                          <td className="p-2 text-right text-red-600">{formatCurrency(month.expenses)}</td>
                          <td className={`p-2 text-right font-semibold ${month.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(month.profit)}
                          </td>
                          <td className="p-2 text-right text-muted-foreground">{month.count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Listado de Ingresos */}
            <Card>
              <CardHeader>
                <CardTitle>Listado de Ingresos</CardTitle>
                <CardDescription>Ingresos registrados en el periodo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredRevenues.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No hay ingresos en este periodo</p>
                  ) : (
                    filteredRevenues
                      .sort((a, b) => new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime())
                      .map((revenue) => (
                        <div key={revenue.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50">
                          <div className="flex-1">
                            <p className="font-medium">{revenue.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(revenue.date || revenue.created_at).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-green-600">{formatCurrency(revenue.amount)}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRevenue(revenue.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Eliminar ingreso"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Listado de Gastos */}
            <Card>
              <CardHeader>
                <CardTitle>Listado de Gastos</CardTitle>
                <CardDescription>Gastos registrados en el periodo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredExpenses.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No hay gastos en este periodo</p>
                  ) : (
                    filteredExpenses
                      .sort((a, b) => new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime())
                      .map((expense) => (
                        <div key={expense.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50">
                          <div className="flex-1">
                            <p className="font-medium">{expense.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm text-muted-foreground">
                                {new Date(expense.date || expense.created_at).toLocaleDateString('es-ES', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                              {expense.category && (
                                <>
                                  <span className="text-muted-foreground">•</span>
                                  <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                                    {expense.category}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-red-600">{formatCurrency(expense.amount)}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Eliminar gasto"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

            {/* Registrar Gastos */}
            <Card>
              <CardHeader>
                <CardTitle>Registrar Gastos</CardTitle>
                <CardDescription>Agrega un nuevo gasto al sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitExpense} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="expense-description">Descripción *</Label>
                    <Textarea
                      id="expense-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Ej: Compra de herramientas..."
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expense-amount">Monto *</Label>
                      <CurrencyInput
                        value={formData.amount}
                        onChange={(value) => setFormData({ ...formData, amount: value })}
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expense-category">Categoría *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger id="expense-category">
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expense-date">Fecha *</Label>
                    <Input
                      id="expense-date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={!formData.description || formData.amount === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Gasto
                  </Button>
                </form>
              </CardContent>
            </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
