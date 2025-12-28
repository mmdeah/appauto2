'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Car, Wrench } from 'lucide-react';
import { getExpenses, getRevenues, getServiceOrders } from '@/lib/db';
import { formatCurrency } from '@/lib/utils-service';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import type { Expense, Revenue, ServiceOrder } from '@/lib/types';

// Componente simple de gráfico de barras
const BarChart = ({ data, labels, title }: { data: number[], labels: string[], title: string }) => {
  const maxValue = Math.max(...data, 1);
  
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
      <div className="space-y-2">
        {data.map((value, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>{labels[index]}</span>
              <span className="font-medium">{formatCurrency(value)}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary rounded-full h-2 transition-all"
                style={{ width: `${(value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente de gráfico de barras comparativo
const ComparisonChart = ({ revenues, expenses, labels }: { revenues: number[], expenses: number[], labels: string[] }) => {
  const maxValue = Math.max(...revenues, ...expenses, 1);
  
  return (
    <div className="space-y-4">
      <div className="relative h-64 flex items-end justify-between gap-1">
        {revenues.map((revValue, index) => {
          const expValue = expenses[index] || 0;
          const revHeight = (revValue / maxValue) * 100;
          const expHeight = (expValue / maxValue) * 100;
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col items-center justify-end h-full gap-0.5">
                <div
                  className="w-full bg-green-500 rounded-t transition-all hover:bg-green-600"
                  style={{ height: `${revHeight}%`, minHeight: revValue > 0 ? '2px' : '0' }}
                  title={`${labels[index]} - Ingresos: ${formatCurrency(revValue)}`}
                />
                <div
                  className="w-full bg-red-500 rounded-t transition-all hover:bg-red-600"
                  style={{ height: `${expHeight}%`, minHeight: expValue > 0 ? '2px' : '0' }}
                  title={`${labels[index]} - Gastos: ${formatCurrency(expValue)}`}
                />
              </div>
              <span className="text-xs text-muted-foreground mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">
                {labels[index]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function StatisticsPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [expensesData, revenuesData, ordersData] = await Promise.all([
        getExpenses(),
        getRevenues(),
        getServiceOrders(),
      ]);
      
      setExpenses(expensesData);
      setRevenues(revenuesData);
      setOrders(ordersData);
    } catch (error) {
      console.error('[v0] Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Obtener años disponibles
  const availableYears = Array.from(
    new Set([
      ...expenses.map(e => new Date(e.date || e.created_at).getFullYear()),
      ...revenues.map(r => new Date(r.date || r.created_at).getFullYear()),
      ...orders.map(o => new Date(o.createdAt).getFullYear()),
    ])
  ).sort((a, b) => b - a);

  // Filtrar datos por año seleccionado
  const filteredExpenses = expenses.filter(e => {
    const date = new Date(e.date || e.created_at);
    return date.getFullYear() === selectedYear;
  });

  const filteredRevenues = revenues.filter(r => {
    const date = new Date(r.date || r.created_at);
    return date.getFullYear() === selectedYear;
  });

  const filteredOrders = orders.filter(o => {
    const date = new Date(o.createdAt);
    return date.getFullYear() === selectedYear;
  });

  // Agrupar por mes
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  
  const monthlyData = months.map((month, index) => {
    const monthExpenses = filteredExpenses.filter(e => {
      const date = new Date(e.date || e.created_at);
      return date.getMonth() === index;
    });
    
    const monthRevenues = filteredRevenues.filter(r => {
      const date = new Date(r.date || r.created_at);
      return date.getMonth() === index;
    });
    
    const monthOrders = filteredOrders.filter(o => {
      const date = new Date(o.createdAt);
      return date.getMonth() === index;
    });

    const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalRevenues = monthRevenues.reduce((sum, r) => sum + r.amount, 0);
    const profit = totalRevenues - totalExpenses;
    const ordersCount = monthOrders.length;
    const completedOrders = monthOrders.filter(o => o.state === 'delivered' || o.state === 'completed').length;

    return {
      month,
      expenses: totalExpenses,
      revenues: totalRevenues,
      profit,
      ordersCount,
      completedOrders,
    };
  });

  // Totales del año
  const yearTotalExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0);
  const yearTotalRevenues = monthlyData.reduce((sum, m) => sum + m.revenues, 0);
  const yearTotalProfit = yearTotalRevenues - yearTotalExpenses;
  const yearTotalOrders = monthlyData.reduce((sum, m) => sum + m.ordersCount, 0);
  const yearCompletedOrders = monthlyData.reduce((sum, m) => sum + m.completedOrders, 0);

  // Datos para gráficos
  const expensesData = monthlyData.map(m => m.expenses);
  const revenuesData = monthlyData.map(m => m.revenues);
  const profitData = monthlyData.map(m => m.profit);
  const ordersData = monthlyData.map(m => m.ordersCount);
  const monthLabels = monthlyData.map(m => m.month.substring(0, 3));

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <DashboardLayout>
          <div className="text-center py-12 text-muted-foreground">Cargando estadísticas...</div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Estadísticas Mensuales</h1>
              <p className="text-muted-foreground">Análisis de ingresos, gastos y órdenes por mes</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Link>
            </Button>
          </div>

          {/* Selector de año */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Label>Año:</Label>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Resumen del año */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Ingresos</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(yearTotalRevenues)}</p>
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
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(yearTotalExpenses)}</p>
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
                    <p className={`text-2xl font-bold ${yearTotalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(yearTotalProfit)}
                    </p>
                  </div>
                  <DollarSign className={`h-8 w-8 ${yearTotalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Órdenes</p>
                    <p className="text-2xl font-bold">{yearTotalOrders}</p>
                  </div>
                  <Wrench className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Órdenes Completadas</p>
                    <p className="text-2xl font-bold">{yearCompletedOrders}</p>
                  </div>
                  <Car className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ingresos vs Gastos */}
            <Card>
              <CardHeader>
                <CardTitle>Ingresos vs Gastos</CardTitle>
                <CardDescription>Comparación mensual de ingresos y gastos</CardDescription>
              </CardHeader>
              <CardContent>
                <ComparisonChart
                  revenues={revenuesData}
                  expenses={expensesData}
                  labels={monthLabels}
                />
                <div className="mt-4 flex gap-4 justify-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-xs">Ingresos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-xs">Gastos</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ganancia Neta */}
            <Card>
              <CardHeader>
                <CardTitle>Ganancia Neta Mensual</CardTitle>
                <CardDescription>Ganancia o pérdida por mes</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={profitData}
                  labels={monthLabels}
                  title=""
                />
              </CardContent>
            </Card>

            {/* Órdenes por mes */}
            <Card>
              <CardHeader>
                <CardTitle>Órdenes por Mes</CardTitle>
                <CardDescription>Cantidad de órdenes creadas cada mes</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={ordersData}
                  labels={monthLabels}
                  title=""
                />
              </CardContent>
            </Card>

            {/* Tabla detallada */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen Mensual Detallado</CardTitle>
                <CardDescription>Desglose completo por mes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Mes</th>
                        <th className="text-right p-2">Ingresos</th>
                        <th className="text-right p-2">Gastos</th>
                        <th className="text-right p-2">Ganancia</th>
                        <th className="text-right p-2">Órdenes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.map((data, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-medium">{data.month}</td>
                          <td className="text-right p-2 text-green-600">{formatCurrency(data.revenues)}</td>
                          <td className="text-right p-2 text-red-600">{formatCurrency(data.expenses)}</td>
                          <td className={`text-right p-2 font-semibold ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(data.profit)}
                          </td>
                          <td className="text-right p-2">{data.ordersCount}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t font-bold">
                        <td className="p-2">Total {selectedYear}</td>
                        <td className="text-right p-2 text-green-600">{formatCurrency(yearTotalRevenues)}</td>
                        <td className="text-right p-2 text-red-600">{formatCurrency(yearTotalExpenses)}</td>
                        <td className={`text-right p-2 ${yearTotalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(yearTotalProfit)}
                        </td>
                        <td className="text-right p-2">{yearTotalOrders}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

