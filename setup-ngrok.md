# Configuración de ngrok para URL Pública

## Paso 1: Instalar ngrok

### Opción A: Descargar desde el sitio web
1. Ve a https://ngrok.com/download
2. Descarga para Windows
3. Extrae el archivo `ngrok.exe`
4. Colócalo en una carpeta (ej: `C:\ngrok\`)

### Opción B: Usar npm (si tienes Node.js)
```bash
npm install -g ngrok
```

## Paso 2: Crear cuenta gratuita (opcional pero recomendado)

1. Ve a https://dashboard.ngrok.com/signup
2. Crea una cuenta gratuita
3. Obtén tu authtoken desde: https://dashboard.ngrok.com/get-started/your-authtoken
4. Configura el token:
   ```bash
   ngrok config add-authtoken TU_TOKEN_AQUI
   ```

## Paso 3: Iniciar la aplicación

En una terminal:
```bash
cd C:\Users\MUNDIAL DEL PC\Desktop\appfinal\appcliente1
pnpm dev
```

La app estará en: `http://localhost:3000`

## Paso 4: Iniciar ngrok

En otra terminal:
```bash
ngrok http 3000
```

O si lo descargaste manualmente:
```bash
C:\ngrok\ngrok.exe http 3000
```

## Paso 5: Obtener la URL pública

ngrok mostrará algo como:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

**Copia la URL HTTPS** (la que empieza con `https://`)

## Paso 6: Actualizar el código para usar la URL base

Necesitamos modificar el código para que use la URL de ngrok dinámicamente.


