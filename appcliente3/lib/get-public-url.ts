/**
 * Obtiene la URL base pública de la aplicación
 * 
 * En desarrollo local con ngrok, detecta automáticamente la URL de ngrok
 * En producción, usa la URL del dominio
 */
export function getPublicUrl(): string {
  // Si estamos en el cliente (navegador)
  if (typeof window !== 'undefined') {
    // En desarrollo, intentar detectar si estamos usando ngrok
    const hostname = window.location.hostname
    
    // Si es localhost, intentar obtener la URL de ngrok desde localStorage
    // (el admin puede configurarla manualmente)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const ngrokUrl = localStorage.getItem('ngrok_public_url')
      if (ngrokUrl) {
        return ngrokUrl
      }
      // Si no hay ngrok configurado, usar localhost (solo funcionará localmente)
      return window.location.origin
    }
    
    // En producción o con dominio real, usar la URL actual
    return window.location.origin
  }
  
  // En el servidor, intentar obtener de variable de entorno
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }
  
  // Fallback
  return 'http://localhost:3000'
}


