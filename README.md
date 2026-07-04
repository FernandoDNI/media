# 📋 Prompt Manager — Administrador de Prompts

Una SPA (Single Page Application) moderna para gestionar tus prompts de IA, conectada a Google Sheets como base de datos a través de Google Apps Script.

## 🚀 Guía de Despliegue

### Paso 1: Crear el proyecto en Google Apps Script

1. Abre tu Google Drive y crea (o abre) una hoja de cálculo de Google Sheets
2. Ve a **Extensiones > Apps Script**
3. Se abrirá el editor de Apps Script

### Paso 2: Configurar el código backend

1. En el editor de Apps Script, borra el contenido del archivo `Código.gs` (o `Code.gs`)
2. Copia y pega **todo** el contenido del archivo `google-apps-script/Code.gs` de este proyecto
3. Guarda el archivo (Ctrl+S)

### Paso 3: Crear la estructura de la hoja

1. En el editor de Apps Script, selecciona la función **`setupSheet`** en el dropdown de funciones
2. Haz clic en **▶ Ejecutar**
3. La primera vez te pedirá permisos — haz clic en:
   - "Revisar permisos"
   - Selecciona tu cuenta de Google
   - "Avanzado" → "Ir a [nombre del proyecto]"
   - "Permitir"
4. Verás un mensaje confirmando que se crearon las columnas:
   - **A**: Categoría
   - **B**: Nombre prompt
   - **C**: Prompt
   - **D**: Ejemplos

### Paso 4: Desplegar como Web App

1. En el editor de Apps Script, haz clic en **Implementar > Nueva implementación**
2. Junto a "Seleccionar tipo", haz clic en el ícono de ⚙️ y selecciona **App web**
3. Configura:
   - **Descripción**: Prompt Manager API
   - **Ejecutar como**: Yo (tu correo)
   - **Quién tiene acceso**: **Cualquier persona**
4. Haz clic en **Implementar**
5. **Copia la URL** del Web App que aparece (empieza con `https://script.google.com/macros/s/...`)

### Paso 5: Conectar el frontend

1. Abre el archivo `app.js` de este proyecto
2. En la línea 8, reemplaza `'TU_URL_DE_WEB_APP_AQUI'` con la URL que copiaste:
   ```javascript
   const API_URL = 'https://script.google.com/macros/s/AKfyc.../exec';
   ```
3. Guarda el archivo

### Paso 6: Abrir la aplicación

1. Abre `index.html` en tu navegador (doble clic o arrastra al navegador)
2. ¡Listo! La aplicación se conectará a tu Google Sheets

---

## 💡 Modo Demo

Si abres `index.html` **sin configurar** la URL del API, la app funciona en **modo demo** con datos de ejemplo locales. Esto te permite explorar todas las funcionalidades sin necesidad de configurar el backend.

---

## 🌙 Tema Oscuro / Claro

- Usa el **toggle** ☀️/🌙 en la esquina superior derecha
- El tema se guarda automáticamente en tu navegador (localStorage)
- Detecta la preferencia de tema de tu sistema operativo

---

## 📁 Estructura del Proyecto

```
Diplomado/
├── index.html                   # Estructura HTML de la SPA
├── style.css                    # Estilos con temas claro/oscuro
├── app.js                       # Lógica de la aplicación
├── README.md                    # Esta guía
└── google-apps-script/
    └── Code.gs                  # Código para Google Apps Script
```

---

## ⚠️ Notas Importantes

- **Después de cada cambio** en el código de Apps Script, debes crear una **nueva implementación** para que los cambios surtan efecto
- Las filas eliminadas en Google Sheets a través de la app **no se pueden recuperar**
- El Web App tiene un límite de ejecución de ~6 minutos por llamada (más que suficiente para CRUD)
- Si el API devuelve errores de CORS, verifica que el acceso esté configurado como "Cualquier persona"
