# Vista de Desarrollo
**"Plataforma de Gestión de Proveedores - Indurama"**

Implementamos una cultura **DevOps** apoyada en prácticas de **CI/CD** para garantizar la agilidad y calidad del software.

### ¿Qué es CI/CD?
CI/CD (Integración Continua y Entrega/Despliegue Continuo) automatiza las etapas de desarrollo, prueba y despliegue.

*   **Integración Continua (CI):** Es el proceso de integrar regularmente el código de diferentes desarrolladores en un repositorio compartido (GitHub). Incluye la ejecución automática de pruebas para identificar errores rápidamente.
*   **Entrega Continua (CD - Delivery):** Extiende la CI al automatizar la preparación de entregas. Garantiza que el código esté siempre listo para producción.
*   **Despliegue Continuo (CD - Deployment):** Automatiza el despliegue final en producción (Google Play / Web) una vez que se pasan las pruebas.

### ¿Qué es DevOps?
Es una cultura que integra a los equipos de desarrollo y operaciones. Sus beneficios clave para Indurama son:
*   Ciclos de entrega más rápidos.
*   Mayor estabilidad y calidad del software.
*   Alineación entre objetivos técnicos (código limpio) y empresariales (proveedores satisfechos).

### Pipeline DevOps

<img width="1920" height="1080" alt="devops" src="https://github.com/user-attachments/assets/22411ffe-a446-4de9-bc8d-a21df16474d8" />


### Herramientas del Ciclo

| **Fase** | **Plataformas** | **Descripción y Justificación** |
| :--- | :--- | :--- |
| **Plan** | **GitHub Projects / Jira** | Se utilizará para gestionar el desarrollo colaborativo, organizar historias de usuario y tareas mediante tableros Kanban. |
| **Code** | **React Native & Node.js** | **React Native:** Para la interfaz móvil/web eficiente. <br>**Node.js:** Para la lógica del backend en Firebase Functions. |
| **Build** | **Expo EAS Build** | Servicio en la nube que compila los binarios nativos (.apk) sin necesidad de infraestructura local compleja. |
| **Test** | **Jest & Firebase TestLab** | **Jest:** Para pruebas unitarias de componentes React. <br>**TestLab:** Para probar la app en dispositivos Android reales en la nube. |
| **Release** | **Semantic Release** | Automatiza el versionado del software (v1.0.0) y genera las notas de lanzamiento basadas en los commits. |
| **Deploy** | **Firebase Hosting & Google Play** | **Hosting:** Despliegue automático del portal web. <br>**Google Play:** Distribución de la app móvil a los usuarios finales. |
| **Operate** | **Firebase Console** | Panel centralizado para gestionar base de datos, autenticación y configuraciones remotas (*Remote Config*) sin redesplegar. |
| **Monitor** | **Discord & Crashlytics** | **Discord:** Notificaciones en tiempo real del estado del pipeline. <br>**Crashlytics:** Reporte automático de errores (crashes) en la app. |

---

## 8.4. Cronograma de Actividades

El plan de trabajo se divide en hitos entregables para asegurar el avance progresivo del Backend y Frontend.

### Backend

1.  **Diseño de modelos y endpoints**
    *   *Objetivo:* Definir esquemas NoSQL y contratos de API.
    *   *Fecha:* 27/11/2024 - 04/12/2024
2.  **Implementación de autenticación**
    *   *Objetivo:* Configurar Firebase Auth y roles (Gestor/Proveedor).
    *   *Fecha:* 11/12/2024 - 18/12/2024
3.  **Lógica de negocio (Flujos principales)**
    *   *Objetivo:* Cloud Functions para Solicitudes y Auditoría EPI.
    *   *Fecha:* 20/12/2024 - 02/01/2025
4.  **Integración servicios externos**
    *   *Objetivo:* Conexión con servicios de correo y almacenamiento.
    *   *Fecha:* 02/01/2025 - 09/01/2025
5.  **Pruebas y seguridad**
    *   *Objetivo:* Validación de reglas de seguridad Firestore.
    *   *Fecha:* 09/01/2025 - 16/01/2025

### Frontend

1.  **Componentes clave (UI)**
    *   *Objetivo:* Dashboards, Formularios y Tarjetas.
    *   *Fecha:* 04/12/2024 - 10/12/2024
2.  **Autenticación y Sesiones**
    *   *Objetivo:* Login, Registro y Recuperación de clave.
    *   *Fecha:* 11/12/2024 - 18/12/2024
3.  **Integración de APIs**
    *   *Objetivo:* Conexión de pantallas con Firebase Backend.
    *   *Fecha:* 02/01/2025 - 09/01/2025
4.  **Responsividad y Accesibilidad**
    *   *Objetivo:* Ajustes para móviles y tabletas.
    *   *Fecha:* 16/01/2025 - 20/01/2025
5.  **Pruebas Funcionales**
    *   *Objetivo:* Validación del flujo completo de usuario.
    *   *Fecha:* 20/01/2025 - 23/01/2025
