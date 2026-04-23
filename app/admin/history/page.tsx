'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, History, ArrowLeft, Download, RefreshCw, FileText } from 'lucide-react';
import { searchHistoryLogs } from '@/lib/db';
import Link from 'next/link';

export default function HistoryLogPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async (searchTerm: string = '') => {
    setLoading(true);
    try {
      const data = await searchHistoryLogs(searchTerm);
      setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(query);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([logs.join('\n')], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `bitacora_revisiones_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout title="Bitácora Histórica">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 p-2 rounded-lg">
                <History className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Bitácora Histórica</h1>
                <p className="text-muted-foreground text-sm">Registro de texto plano de todas las revisiones generales</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => fetchLogs(query)} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Link>
              </Button>
            </div>
          </div>

          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar por placa, marca o falla encontrada..." 
                    className="pl-10 bg-white"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <Button type="submit" className="bg-slate-800 hover:bg-slate-900">
                  Buscar
                </Button>
              </form>
            </CardHeader>
            <CardContent className="p-0">
              <div className="bg-[#1e1e1e] text-[#d4d4d4] font-mono text-[13px] p-4 min-h-[60vh] max-h-[75vh] overflow-y-auto custom-scrollbar">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-2 font-sans">
                     <RefreshCw className="h-8 w-8 animate-spin" />
                     <p>Escaneando bitácora de texto...</p>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-20 text-slate-500 font-sans">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No se encontraron registros para tu búsqueda.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {logs.map((line, idx) => (
                      <div key={idx} className="hover:bg-slate-800 py-1 px-2 rounded group flex items-start gap-4 transition-colors">
                        <span className="text-slate-600 select-none w-8 text-right shrink-0">{logs.length - idx}</span>
                        <span className="break-all whitespace-pre-wrap">{line}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <div className="p-4 bg-slate-50 border-t flex justify-between items-center text-xs text-muted-foreground font-medium">
               <span>Total de registros encontrados: {logs.length}</span>
               <Button variant="ghost" size="sm" className="h-8 text-xs hover:bg-slate-200" onClick={handleDownload} disabled={logs.length === 0}>
                  <Download className="h-3 w-3 mr-1" /> Descargar Historial (.txt)
               </Button>
            </div>
          </Card>

          <style jsx global>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: #1e1e1e;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #333;
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #444;
            }
          `}</style>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
