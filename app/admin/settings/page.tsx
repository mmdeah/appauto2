'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const [ngrokUrl, setNgrokUrl] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Cargar URL guardada
    if (typeof window !== 'undefined') {
      const savedUrl = localStorage.getItem('ngrok_public_url') || '';
      setNgrokUrl(savedUrl);
    }
  }, []);

  const handleSave = () => {
    if (!ngrokUrl.trim()) {
      setError('Por favor ingresa una URL válida');
      return;
    }

    // Validar formato de URL
    try {
      new URL(ngrokUrl);
    } catch {
      setError('URL inválida. Debe ser una URL completa (ej: https://abc123.ngrok-free.app)');
      return;
    }

    // Guardar en localStorage
    localStorage.setItem('ngrok_public_url', ngrokUrl.trim());
    setSaved(true);
    setError('');
    
    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };

  const handleTest = () => {
    if (!ngrokUrl.trim()) {
      setError('Por favor ingresa una URL primero');
      return;
    }

    // Abrir la URL en una nueva pestaña para probar
    window.open(ngrokUrl, '_blank');
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout title="Configuración">
        <div className="space-y-6">
          <Button variant="ghost" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Panel
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Configuración de URL Pública</CardTitle>
              <CardDescription>
                Configura la URL pública para que los enlaces de WhatsApp funcionen desde cualquier dispositivo.
                Si estás usando ngrok, ingresa la URL que te proporcionó (ej: https://abc123.ngrok-free.app)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ngrok-url">URL Pública (ngrok o dominio)</Label>
                <Input
                  id="ngrok-url"
                  type="url"
                  placeholder="https://abc123.ngrok-free.app"
                  value={ngrokUrl}
                  onChange={(e) => {
                    setNgrokUrl(e.target.value);
                    setSaved(false);
                    setError('');
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Esta URL se usará para generar los enlaces que se envían por WhatsApp.
                  Debe ser accesible desde internet (no localhost).
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {saved && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>URL guardada correctamente</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar URL
                </Button>
                <Button variant="outline" onClick={handleTest}>
                  Probar URL
                </Button>
              </div>

              <div className="mt-6 space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">🌐 Opciones de Túnel:</h4>
                  
                  <div className="space-y-3 mt-3">
                    <div className="p-3 bg-background rounded border">
                      <h5 className="font-semibold text-sm mb-1">1. Cloudflare Tunnel (⭐ Recomendado)</h5>
                      <p className="text-xs text-muted-foreground mb-2">Gratis, sin límites, URL permanente</p>
                      <code className="text-xs block bg-muted p-2 rounded">cloudflared tunnel --url http://localhost:3000</code>
                    </div>

                    <div className="p-3 bg-background rounded border">
                      <h5 className="font-semibold text-sm mb-1">2. LocalTunnel (Simple)</h5>
                      <p className="text-xs text-muted-foreground mb-2">Muy fácil de usar</p>
                      <code className="text-xs block bg-muted p-2 rounded">lt --port 3000</code>
                    </div>

                    <div className="p-3 bg-background rounded border">
                      <h5 className="font-semibold text-sm mb-1">3. ngrok (Popular)</h5>
                      <p className="text-xs text-muted-foreground mb-2">Muy confiable, interfaz web</p>
                      <code className="text-xs block bg-muted p-2 rounded">ngrok http 3000</code>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mt-3">
                    💡 También puedes usar los scripts en la carpeta <code className="bg-background px-1 rounded">scripts/</code> para iniciar los túneles fácilmente.
                  </p>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold mb-2 text-sm">📋 Pasos:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
                    <li>Inicia tu aplicación: <code className="bg-background px-1 rounded">pnpm dev</code></li>
                    <li>En otra terminal, ejecuta uno de los comandos de arriba</li>
                    <li>Copia la URL HTTPS que te muestra el túnel</li>
                    <li>Pégala en el campo de arriba y guarda</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

