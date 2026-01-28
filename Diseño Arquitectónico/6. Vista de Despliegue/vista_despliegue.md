# Diagrama de Despliegue

## ¿Qué es un diagrama de despliegue?

Un **diagrama de despliegue** permite representar la **estructura física** de un sistema de software orientado a objetos. Describe, desde una perspectiva estática, cómo se organiza el sistema en tiempo de ejecución y muestra la forma en que los distintos componentes de la aplicación se distribuyen e interconectan. Generalmente, este tipo de diagrama combina la representación del **hardware** con los **componentes de software** que se ejecutan sobre él, facilitando la comprensión de su arquitectura física.

---

### Descripción de la Arquitectura de Despliegue

El diagrama ilustra una **arquitectura Cloud-Native Serverless** diseñada para alta disponibilidad y escalabilidad automática, utilizando la infraestructura de Google Cloud Platform (GCP). El sistema se organiza en cuatro niveles principales:

1.  **Nivel de Cliente (Frontend):**
    * **Móvil:** Soporte para dispositivos Android (12.0+) e iOS (16.0+) mediante la `App-Indurama.apk`, optimizada para procesadores ARM64.
    * **Web:** Acceso para gestores desde PC (Windows/macOS) a través de un `Portal Web (SPA)` compatible con navegadores modernos (Chrome/Edge).

2.  **Gestión de Tráfico y Seguridad (Gateway & Auth):**
    * El punto de entrada es un **Google Cloud Load Balancer** (Capa 7) que distribuye el tráfico HTTPS/JSON globalmente.
    * Se utiliza un **API Manager** como puerta de enlace centralizada para gestionar el tráfico, las claves y la publicación de APIs.
    * La seguridad y autenticación se delegan a un **Identity Server** basado en **Firebase Auth**, utilizando el protocolo OAuth 2.0.

3.  **Lógica de Negocio (Backend Serverless):**
    * El `Application Server` opera sobre un entorno **Node.js 20 (LTS)** utilizando **Cloud Functions Gen 2**.
    * La lógica está desacoplada en microservicios independientes: *Gestión de Necesidades, Cotizaciones, Proveedores y Evaluación EPI*, comunicándose vía REST/TCP.

4.  **Persistencia de Datos (Data Tier):**
    * Se utiliza **Google Cloud Firestore** (modo nativo) como base de datos NoSQL orientada a documentos, con replicación multi-región para asegurar la disponibilidad.
    * Los esquemas están separados por dominios (`Necesidades`, `Cotizaciones`, `Proveedores`, `EPI`).
    * Incluye un **File Server** dedicado para el almacenamiento de documentos adjuntos.

Esta arquitectura garantiza que el sistema pueda escalar automáticamente ("Elastic") según la demanda, soportando miles de peticiones por segundo sin necesidad de administrar servidores físicos.

---

## Diagrama de Despliegue (Gestión de Proveedores Indurama)

<img width="100%" alt="Diagrama de Despliegue - Arquitectura Cloud" src="https://github.com/user-attachments/assets/fc2a909b-ba0e-4740-96eb-20d256144ede" />
