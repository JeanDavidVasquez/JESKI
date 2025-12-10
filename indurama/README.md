<<<<<<< HEAD
# Indurama - Sistema de Gestión de Proveedores

## Descripción
Sistema de administración de proveedores para la empresa Indurama, desarrollado con React Native, Expo, Firebase y TypeScript.

## Características Principales
- 🔐 **Autenticación**: Login y registro con Firebase Auth
- 📱 **Responsive**: Funciona en móviles y web
- 🎨 **Diseño Moderno**: Basado en el branding de Indurama
- 📊 **Dashboard**: Estadísticas y métricas de proveedores
- 📋 **Gestión de Proveedores**: CRUD completo de proveedores
- ⭐ **Evaluaciones**: Sistema de calificación de proveedores
- 🔔 **Tiempo Real**: Updates en tiempo real con Firestore

## Estructura del Proyecto

```
indurama/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── AppContainer.tsx
│   │   ├── AppText.tsx
│   │   ├── AppButton.tsx
│   │   ├── AppInput.tsx
│   │   └── index.ts
│   ├── screens/            # Pantallas principales
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── SupplierListScreen.tsx
│   │   └── index.ts
│   ├── navigation/         # Configuración de navegación
│   │   ├── types.ts
│   │   ├── AuthStack.tsx
│   │   ├── MainTabs.tsx
│   │   └── AppNavigator.tsx
│   ├── services/          # Servicios y APIs
│   │   ├── firebaseConfig.ts
│   │   └── authService.ts
│   ├── hooks/             # Hooks personalizados
│   │   ├── useLoading.ts
│   │   ├── useFirestore.ts
│   │   ├── useForm.ts
│   │   └── index.ts
│   ├── context/           # Contextos globales
│   │   └── AuthContext.tsx
│   ├── styles/            # Estilos y tema
│   │   └── theme.ts
│   ├── types/             # Interfaces TypeScript
│   │   └── index.ts
│   └── utils/             # Utilidades
├── assets/                # Recursos estáticos
├── DOCUMENTACION/         # Documentación del proyecto
└── package.json
```

## Instalación y Configuración

### 1. Prerequisitos
- Node.js 20.19.2 o superior
- npm o yarn
- Expo CLI: `npm install -g @expo/cli`
- Cuenta de Firebase

### 2. Clonar e Instalar Dependencias
```bash
cd indurama
npm install
```

### 3. Configuración de Firebase

1. **Crear proyecto en Firebase Console**:
   - Ve a [Firebase Console](https://console.firebase.google.com)
   - Crea un nuevo proyecto llamado "indurama-suppliers"
   - Habilita Authentication y Firestore Database

2. **Configurar Authentication**:
   - Ve a Authentication > Sign-in method
   - Habilita "Email/Password"

3. **Configurar Firestore**:
   - Ve a Firestore Database
   - Crea la base de datos en modo de prueba
   - Estructura sugerida:
   ```
   /users/{userId}
   /suppliers/{supplierId}
   /evaluations/{evaluationId}
   /contracts/{contractId}
   ```

4. **Obtener credenciales**:
   - Ve a Project Settings > Your apps
   - Agrega una app web
   - Copia la configuración

5. **Actualizar firebaseConfig.ts**:
   ```typescript
   const firebaseConfig = {
     apiKey: "tu-api-key",
     authDomain: "indurama-suppliers.firebaseapp.com",
     projectId: "indurama-suppliers",
     storageBucket: "indurama-suppliers.appspot.com",
     messagingSenderId: "123456789",
     appId: "tu-app-id"
   };
   ```

### 4. Ejecutar el Proyecto

```bash
# Desarrollo web
npm run web

# Desarrollo móvil (requiere Expo Go app)
npm start

# Android (requiere Android Studio)
npm run android

# iOS (requiere Xcode - solo Mac)
npm run ios
```

## Tecnologías Utilizadas

- **Frontend**: React Native, Expo
- **Lenguaje**: TypeScript
- **Navegación**: React Navigation v6
- **Backend**: Firebase (Auth, Firestore, Storage)
- **UI/UX**: Sistema de diseño personalizado basado en Indurama
- **Estado**: Context API + useReducer

## Funcionalidades Implementadas

### ✅ Completado
- [x] Estructura de carpetas profesional
- [x] Sistema de estilos global con tema de Indurama
- [x] Componentes base reutilizables
- [x] Configuración de TypeScript
- [x] Interfaces y tipos de datos
- [x] Configuración de Firebase
- [x] Contexto de autenticación
- [x] Hooks personalizados
- [x] Pantallas principales (Login, Register, Dashboard, Suppliers)
- [x] Navegación básica

### 🚧 En Desarrollo
- [ ] Integración completa con Firebase Auth
- [ ] CRUD completo de proveedores
- [ ] Sistema de evaluaciones
- [ ] Gestión de documentos
- [ ] Notificaciones push
- [ ] Filtros avanzados
- [ ] Reportes y exportación

### 📋 Por Hacer
- [ ] Tests unitarios
- [ ] Tests de integración
- [ ] Optimización de performance
- [ ] Modo offline
- [ ] Internacionalización (i18n)

## Estructura de Datos

### Usuario
```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole; // admin, employee, manager
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Proveedor
```typescript
interface Supplier {
  id: string;
  businessName: string;
  contactPerson: string;
  email: string;
  phoneNumber: string;
  address: Address;
  category: SupplierCategory;
  status: SupplierStatus;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## Scripts Disponibles

- `npm start`: Inicia el servidor de desarrollo
- `npm run web`: Ejecuta en navegador web
- `npm run android`: Ejecuta en Android
- `npm run ios`: Ejecuta en iOS
- `npm run build`: Construye la app para producción

## Contribución

1. Fork el repositorio
2. Crea una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## Licencia

Este proyecto es privado y pertenece a Indurama.

## Soporte

Para soporte técnico, contacta al equipo de desarrollo.

---

## 📋 Estado Actual del Proyecto (Nov 2024)

### ✅ **Completado y Funcionando**

1. **📁 Estructura de Carpetas**: Organización profesional completa
2. **🎨 Sistema de Estilos**: Tema global con paleta de Indurama  
3. **🧩 Componentes Base**: AppContainer, AppText, AppButton, AppInput
4. **📱 Pantallas Principales**: Login, Register, Dashboard, SupplierList
5. **🔧 TypeScript**: Configuración y tipos completos
6. **🔥 Firebase**: Configuración base (requiere credenciales)
7. **⚛️ Contextos y Hooks**: AuthContext y hooks personalizados
8. **🛠️ Utilidades**: Helpers para validaciones y formato

### 🚧 **Navegación Temporal**

**Importante**: Actualmente usamos un `SimpleNavigator` debido a incompatibilidades con React Navigation v7.

- Los archivos `AuthStack.tsx`, `MainTabs.tsx` y `AppNavigator.tsx` están comentados temporalmente
- Se puede navegar entre pantallas usando los botones de debug en la parte inferior
- Una vez resueltas las incompatibilidades de React Navigation, se restaurará la navegación completa

### 🚀 **Cómo Ejecutar el Proyecto**

```bash
cd indurama
npm install
npm start
```

### 🔐 **Cuentas de Prueba**

Para probar la aplicación, puedes usar estas cuentas preconfiguradas:

| Rol | Email | Contraseña | Descripción |
|-----|-------|------------|-------------|
| **Solicitante** | `solicitante@indurama.com` | `password123` | Empleado que crea solicitudes |
| **Aprobador** | `aprobador@indurama.com` | `password123` | Usuario que aprueba solicitudes |
| **Proveedor** | `proveedor@indurama.com` | `password123` | Proveedor que completa evaluaciones EPI |
| **Administrador** | `admin@indurama.com` | `password123` | Acceso completo al sistema |

**Nota**: Todas las cuentas usan la misma contraseña temporal: `password123`

### 📱 **Funcionalidades Disponibles**

#### ✅ **Completamente Funcional**
- [x] Pantalla de Login con diseño de Indurama
- [x] Pantalla de Register con formulario completo  
- [x] Dashboard con estadísticas mockup
- [x] Lista de proveedores con filtros
- [x] Sistema de estilos consistente
- [x] Componentes reutilizables
- [x] Navegación temporal entre pantallas

#### 🔄 **Próximos Pasos**
- [ ] Resolver incompatibilidades React Navigation v7
- [ ] Integrar Firebase Authentication real
- [ ] Implementar CRUD de proveedores
- [ ] Agregar sistema de evaluaciones
=======
# 🌐 **JESKI Tech**

> *Innovando el futuro, un código a la vez.*

---
## **Descripción del Proyecto**

**JESKI Tech** es una empresa de desarrollo de software dedicada a crear **soluciones digitales personalizadas**, diseñadas para responder de manera precisa a las necesidades de cada cliente.

Nuestro enfoque se centra en la **calidad, la innovación y la excelencia técnica**, asegurando que cada producto desarrollado sea **escalable, seguro** y contribuya activamente a la **transformación digital** y al **crecimiento tecnológico** de quienes confían en nosotros.

---

## **Misión**

Desarrollar soluciones tecnológicas innovadoras que integren **eficiencia, escalabilidad y un diseño centrado en el usuario**, impulsando el avance digital mediante productos **confiables, sostenibles y de alta calidad**.

---

## **Visión**

Convertirnos en una **empresa líder en el desarrollo de software en la nube**, destacando por la **creatividad, compromiso e innovación** de nuestras aplicaciones, tanto a nivel nacional como internacional.

---

## **Integrantes del Equipo**

<table>
  <tr>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/dba58d44-a031-47bd-a45f-68a8ef8d9dfb" width="170" alt="Foto de Iam Estrella">
      <br>
      <strong>Iam Estrella</strong>
      <br>
      <em>Backend Developer</em>
    </td>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/15c96ff8-cb25-406e-9666-57cd3c0c58fa" width="150" alt="Foto de Jean Vásquez">
      <br>
      <strong>Jean Vásquez</strong>
      <br>
      <em>Diseñador UX/UI</em>
    </td>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/270828c4-40a5-4b45-849d-018b9dfcff27" width="180" alt="Foto de Santiago Riofrío">
      <br>
      <strong>Santiago Riofrío</strong>
      <br>
      <em>Backend Developer</em>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/aeb42a78-9da8-4d86-969c-2518263901ed" width="150" alt="Foto de Kelvin Sarango">
      <br>
      <strong>Kelvin Sarango</strong>
      <br>
      <em>Frontend Developer</em>
    </td>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/8ae18d16-9658-40e2-99c4-2b07d98a3ec8" width="170" alt="Foto de Edison Chamba">
      <br>
      <strong>Edison Chamba</strong>
      <br>
      <em>Security Developer</em>
    </td>
    <td align="center" style="border: none;">
      </td>
  </tr>
</table>

---

# Gestión de Proveedores – Indurama

## Problemática  
Indurama enfrenta un desafío crítico en la **eficiencia y agilidad** de su cadena de suministro, originado en su actual proceso de gestión de proveedores.

La problemática central radica en la **ausencia de una plataforma tecnológica unificada (Web y Móvil)** que brinde soporte integral a los procesos de identificación, evaluación, cotización y registro de su red de proveedores.

### Puntos Clave:

* **Silos de Información y Falta de Trazabilidad:** La información de proveedores está dispersa, dificultando la colaboración entre departamentos (Compras, Calidad, Finanzas) y creando serios **problemas de integración**.
* **Visibilidad Nula en Tiempo Real:** Existe una incapacidad para monitorear el ciclo de vida completo de un proveedor, lo que deriva en **procesos manuales lentos** y propensos a errores.
* **Brecha de Accesibilidad (Web/Móvil):** La gerencia carece de *dashboards* centralizados para la toma de **decisiones estratégicas (Web)**, mientras que los equipos en campo no pueden registrar o validar datos en tiempo real **(Móvil)**.
* **Impacto en el Negocio:** Esta desconexión operativa genera **riesgos directos de retrasos** en la adquisición de materiales, **aumenta los costos operativos** y limita la capacidad de Indurama para tomar **decisiones de abastecimiento ágiles**, limitando su competitividad.

---

## Solución Propuesta  
Desarrollar una **aplicación web y móvil** para la gestión integral de proveedores en Indurama, empleando **servicios en la nube** para un control centralizado y un registro en tiempo real.  
La aplicación permitirá:  
- Identificar, evaluar y registrar proveedores de forma estructurada.  
- Monitorear el ciclo de vida de los proveedores: desde la búsqueda hasta la aprobación.  
- Facilitar la colaboración entre áreas y departamentos mediante acceso móvil y remoto.  
- Optimizar los tiempos y calidad de las decisiones de abastecimiento, fortaleciendo la **cadena de valor** de Indurama.

---

## Prototipo Figma 

Hemos diseñado la experiencia de usuario (UX/UI) de esta plataforma en Figma. Puedes explorar el prototipo navegable usando el enlace directo o el código QR a continuación, y revisando nuestra guía de acceso en PDF.

### Acceso Directo al Prototipo

[**Ver Prototipo Interactivo de Figma**](https://www.figma.com/proto/dbYilff7VbIO9PZq7TNrCU/INDURAMA?node-id=7-185&p=f&t=BbIOkJFB7PGRaNUD-1&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=7%3A185)

<table>
    <tr>
        <td align="center">
            <img src="https://github.com/user-attachments/assets/dda2dd67-0c88-4b26-b57b-90de71c72f92" width="250" alt="Código QR del Prototipo Figma">
            <br>
            <small>Escanea para acceder al prototipo</small>
        </td>
    </tr>
</table>

### Guía de Acceso

Puedes descargar la guía detallada con los pasos para navegar el prototipo desde el siguiente enlace:

[📄 **Descargar Guía de Navegación del Prototipo**](https://github.com/user-attachments/files/23499830/GUIA.INDURAMA.pdf)
>>>>>>> 38e597ab2e374ee9c0b8c7b4679d027ea87ba5f0
