/**
 * Comprime una imagen antes de convertirla a base64
 * @param file - Archivo de imagen a comprimir
 * @param maxWidth - Ancho máximo en píxeles (default: 1920)
 * @param maxHeight - Alto máximo en píxeles (default: 1920)
 * @param quality - Calidad de compresión 0-1 (default: 0.8)
 * @param maxSizeKB - Tamaño máximo en KB (default: 500)
 * @returns Promise<string> - Base64 de la imagen comprimida
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.8,
  maxSizeKB: number = 500
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo la proporción
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        // Crear canvas para redimensionar y comprimir
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto del canvas'));
          return;
        }
        
        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir a base64 con compresión
        let compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        
        // Si aún es muy grande, reducir calidad progresivamente
        let currentQuality = quality;
        while (compressedBase64.length > maxSizeKB * 1024 && currentQuality > 0.1) {
          currentQuality -= 0.1;
          compressedBase64 = canvas.toDataURL('image/jpeg', currentQuality);
        }
        
        resolve(compressedBase64);
      };
      
      img.onerror = () => {
        reject(new Error('Error al cargar la imagen'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Comprime múltiples imágenes
 * @param files - Array de archivos de imagen
 * @param options - Opciones de compresión
 * @returns Promise<string[]> - Array de base64 comprimidos
 */
export async function compressImages(
  files: File[],
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    maxSizeKB?: number;
  }
): Promise<string[]> {
  return Promise.all(
    files.map(file => compressImage(
      file,
      options?.maxWidth,
      options?.maxHeight,
      options?.quality,
      options?.maxSizeKB
    ))
  );
}

/**
 * Convierte blob URL a base64 comprimido
 * @param blobUrl - URL del blob
 * @param options - Opciones de compresión
 * @returns Promise<string> - Base64 comprimido
 */
export async function compressBlobToBase64(
  blobUrl: string,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    maxSizeKB?: number;
  }
): Promise<string> {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  
  // Crear File desde Blob para usar la función de compresión
  const file = new File([blob], 'image.jpg', { type: blob.type || 'image/jpeg' });
  
  return compressImage(
    file,
    options?.maxWidth,
    options?.maxHeight,
    options?.quality,
    options?.maxSizeKB
  );
}

