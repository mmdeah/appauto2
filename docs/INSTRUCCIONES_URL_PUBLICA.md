# 📱 Instrucciones para Hacer Funcional la URL Pública

## ⚠️ IMPORTANTE: Problema con localStorage

**La aplicación actualmente usa localStorage**, que solo funciona en el navegador del usuario. Esto significa que:

- ✅ Los datos se guardan en tu navegador
- ❌ Si alguien accede desde otro dispositivo, **NO verá los datos** porque están en tu localStorage

**Para que funcione realmente desde cualquier dispositivo**, necesitas exponer tu servidor a internet.

---

## 🚀 Solución: Usar ngrok

**ngrok** crea un túnel seguro desde internet a tu servidor local, permitiendo que cualquier persona acceda a tu aplicación.

### Paso 1: Instalar ngrok

#### Opción A: Descargar (Recomendado)
1. Ve a: https://ngrok.com/download
2. Descarga la versión para Windows
3. Extrae el archivo `ngrok.exe`
4. Colócalo en una carpeta fácil de acceder (ej: `C:\ngrok\`)

#### Opción B: Usar npm
```bash
npm install -g ngrok
```

### Paso 2: Crear cuenta gratuita (Opcional pero recomendado)

1. Ve a: https://dashboard.ngrok.com/signup
2. Crea una cuenta gratuita
3. Obtén tu authtoken desde: https://dashboard.ngrok.com/get-started/your-authtoken
4. Configura el token en tu terminal:
   ```bash
   ngrok config add-authtoken TU_TOKEN_AQUI
   ```

**Nota**: Con cuenta gratuita, la URL cambia cada vez que reinicias ngrok. Con cuenta paga puedes tener una URL fija.

### Paso 3: Iniciar tu aplicación

En una terminal, ejecuta:
```bash
cd C:\Users\MUNDIAL DEL PC\Desktop\appfinal\appcliente1
pnpm dev
```

Espera a que veas: `✓ Ready on http://localhost:3000`

### Paso 4: Iniciar ngrok

**Abre otra terminal** (deja la primera corriendo) y ejecuta:

Si instalaste ngrok globalmente:
```bash
ngrok http 3000
```

Si lo descargaste manualmente:
```bash
C:\ngrok\ngrok.exe http 3000
```

### Paso 5: Obtener la URL pública

ngrok mostrará algo como:
```
Session Status                online
Account                       Tu Nombre (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       45ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3000
```

**Copia la URL HTTPS** (la que dice `Forwarding`, ejemplo: `https://abc123.ngrok-free.app`)

### Paso 6: Configurar la URL en la aplicación

1. Abre tu aplicación en el navegador: http://localhost:3000
2. Inicia sesión como administrador
3. Ve a: **Configuración** (botón en el panel de admin)
4. Pega la URL de ngrok en el campo "URL Pública"
5. Haz clic en **Guardar URL**

### Paso 7: Probar

1. Ve a cualquier orden de servicio
2. Haz clic en **"Enviar WhatsApp (Primera vez)"**
3. El mensaje incluirá la URL pública que funciona desde cualquier dispositivo

---

## 🔄 Mantener ngrok corriendo

**IMPORTANTE**: 
- ngrok debe estar corriendo **todo el tiempo** que quieras que la URL funcione
- Si cierras ngrok, la URL dejará de funcionar
- Si reinicias ngrok, obtendrás una nueva URL (a menos que tengas cuenta paga)

### Recomendación:

1. Deja ambas terminales abiertas:
   - Terminal 1: `pnpm dev` (tu aplicación)
   - Terminal 2: `ngrok http 3000` (el túnel)

2. Cada vez que reinicies ngrok, actualiza la URL en la página de Configuración

---

## 🌐 Alternativa: Desplegar en Vercel (Permanente)

Si quieres una solución permanente sin tener que mantener ngrok corriendo:

1. **Desplegar en Vercel** (gratis):
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

2. **Obtendrás una URL permanente** como: `https://tu-app.vercel.app`

3. **Configurar la URL** en la página de Configuración

**Ventajas**:
- ✅ URL permanente
- ✅ No necesitas mantener nada corriendo
- ✅ Funciona 24/7

**Desventajas**:
- ⚠️ Requiere migrar de localStorage a base de datos real (Supabase) para que los datos sean compartidos

---

## ❓ Preguntas Frecuentes

### ¿Por qué no funciona la URL desde otro dispositivo?

Porque la aplicación usa **localStorage**, que solo funciona en el navegador del usuario. Los datos están guardados en tu navegador, no en un servidor compartido.

### ¿La URL de ngrok cambia?

Sí, con cuenta gratuita la URL cambia cada vez que reinicias ngrok. Con cuenta paga puedes tener una URL fija.

### ¿Puedo usar mi propia IP pública?

Sí, pero necesitas:
- IP pública (no privada)
- Configurar tu router para redirigir el puerto 3000
- Configurar firewall
- Es más complejo que ngrok

### ¿Hay una solución permanente?

Sí, desplegar en Vercel y migrar a Supabase para que los datos estén en una base de datos real compartida.

---

## 📞 Soporte

Si tienes problemas:
1. Verifica que tu aplicación esté corriendo en `http://localhost:3000`
2. Verifica que ngrok esté corriendo y mostrando la URL
3. Verifica que hayas guardado la URL en la página de Configuración
4. Prueba abrir la URL de ngrok directamente en el navegador


