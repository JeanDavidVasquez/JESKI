# Indurama Supplier Management App

Aplicación móvil para la gestión de proveedores de Indurama.

## Requisitos

*   Node.js (LTS)
*   Dispositivo móvil con Expo Go (opcional para pruebas físicas)

## Configuración Inicial

1.  **Instalar dependencias**:
    ```bash
    npm install
    ```
    Esto solucionará los errores de configuración de TypeScript.

2.  **Configurar Variables de Entorno**:
    *   Duplica el archivo `.env.example` y renómbralo a `.env`.
    *   Solicita las claves de API al administrador del proyecto y agrégalas en el archivo `.env`.
    *   **Nota:** El archivo `.env` nunca debe subirse al repositorio.

## Ejecución

Para iniciar el servidor de desarrollo:

```bash
npx expo start
```

*   Presiona `a` para Android (requiere emulador).
*   Presiona `w` para Web.
*   Escanea el QR con Expo Go para probar en tu dispositivo.

## Estructura del Proyecto

*   `src/components`: Componentes reutilizables UI.
*   `src/screens`: Pantallas principales de la aplicación.
*   `src/services`: Conexión con APIs y Firebase (`api.ts`).
*   `src/hooks`: Lógica de negocio reutilizable (`useAuth.ts`).
*   `src/context`: Estado global de la aplicación.
