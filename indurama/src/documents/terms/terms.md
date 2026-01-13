
# TÉRMINOS Y CONDICIONES DE USO DE LA PLATAFORMA JESKI TECH - GESTIÓN DE PROVEEDORES INDURAMA

**Última actualización:** 12 de Enero de 2026

## 1. INTRODUCCIÓN Y ACEPTACIÓN

Bienvenido a la plataforma **JESKI Tech - Gestión de Proveedores**, propiedad de **Indurama** (en adelante, "LA ORGANIZACIÓN"). Este documento establece los términos y condiciones legales (en adelante, los "Términos") que regulan el acceso, navegación y uso del aplicativo móvil y la plataforma web asociada (en adelante, el "SISTEMA").

El acceso al SISTEMA está condicionado a la aceptación plena y sin reservas de los presentes Términos. De conformidad con la **Ley Orgánica de Protección de Datos Personales (LOPDP) de Ecuador** y los estándares de seguridad **ISO/IEC 27001**, la aceptación se perfecciona mediante el mecanismo de **Consentimiento Informado**, materializado a través de la activación de la casilla de verificación (*check-box*) no pre-marcada dispuesta en el formulario de registro, donde el USUARIO declara haber leído, entendido y aceptado las condiciones aquí expuestas.

Si usted no está de acuerdo con estos Términos, deberá abstenerse de utilizar el SISTEMA e interrumpir cualquier proceso de registro.

## 2. DEFINICIONES

Para efectos de claridad técnica y legal, alineados con el estándar **ISO/IEC/IEEE 42010** de descripción arquitectónica, se establecen las siguientes definiciones:

* **USUARIO:** Persona natural o jurídica que accede al SISTEMA. Se clasifica en roles definidos:
* **Solicitante (Personal):** Colaborador interno que requiere bienes o servicios.
* **Gestor:** Personal administrativo encargado de la validación y aprobación.
* **Proveedor:** Tercero externo que suministra bienes o servicios a LA ORGANIZACIÓN.


* **ACTIVOS DE INFORMACIÓN:** Cualquier dato, documento (RUC, certificaciones bancarias, legal) o registro almacenado en el "Banco de Proveedores" del SISTEMA.
* **CREDENCIALES:** Conjunto de correo electrónico y contraseña, gestionados a través de tokens de autenticación (JWT), que permiten el acceso único y seguro.
* **SGSI:** Sistema de Gestión de Seguridad de la Información basado en la norma ISO/IEC 27001.

## 3. OBJETO Y ALCANCE DEL SERVICIO

El SISTEMA tiene como objetivo centralizar, validar y gestionar el ciclo de vida de los proveedores de Indurama, actuando como la **Fuente Única de Verdad (Single Source of Truth)** para la organización. El servicio incluye:

1. Registro y autogestión de perfiles de proveedores.
2. Carga y validación de documentación legal y fiscal.
3. Evaluación de riesgos y desempeño mediante metodología **AMEF** (Análisis de Modo y Efecto de Falla).
4. Gestión de solicitudes de cotización y abastecimiento.

## 4. GESTIÓN DE CUENTAS, AUTENTICACIÓN Y ROLES

### 4.1. Registro y Veracidad

El USUARIO se compromete a proporcionar información veraz, exacta y completa. Conforme al estándar **ISO 8000 de Calidad de Datos**, el SISTEMA implementa validaciones de **exactitud sintáctica** en tiempo real. El USUARIO es responsable de mantener actualizados sus datos; LA ORGANIZACIÓN no se hace responsable por perjuicios derivados de datos erróneos (ej. cuentas bancarias incorrectas).

### 4.2. Seguridad de las Credenciales (Control de Acceso A.9)

El acceso al SISTEMA se rige por un estricto control basado en roles (**RBAC**).

* Las credenciales de acceso son personales, intransferibles y confidenciales.
* El SISTEMA utiliza **Firebase Authentication** para la gestión de identidad.
* El USUARIO acepta que el SISTEMA asigna "Custom Claims" (permisos inmutables) a su token de sesión, los cuales determinan técnicamente qué recursos puede leer o escribir. Cualquier intento de modificar estos permisos mediante manipulación del lado del cliente será considerado una violación grave de seguridad.

### 4.3. Validación de Dispositivo (App Check)

Por motivos de integridad (A.12), el SISTEMA implementa **Firebase App Check**. LA ORGANIZACIÓN se reserva el derecho de bloquear, sin previo aviso, cualquier petición que no provenga de una instancia legítima y firmada de la aplicación oficial (ej. peticiones desde emuladores no autorizados, scripts o bots).

## 5. PROTECCIÓN DE DATOS PERSONALES Y PRIVACIDAD (LOPDP)

En cumplimiento estricto con la **Ley Orgánica de Protección de Datos Personales de Ecuador**, LA ORGANIZACIÓN garantiza los derechos digitales de los USUARIOS (Titulares de Datos).

### 5.1. Finalidad del Tratamiento

Los datos personales, fiscales y bancarios recolectados serán utilizados **exclusivamente** para:

* Gestión administrativa, contable y fiscal de la relación comercial.
* Evaluación de proveedores y análisis de riesgos.
* Cumplimiento de obligaciones legales ante autoridades tributarias (SRI).

### 5.2. Seguridad del Tratamiento (ISO/IEC 27002)

Para garantizar la confidencialidad e integridad de los datos, LA ORGANIZACIÓN implementa:

* **Cifrado en Tránsito:** Todas las comunicaciones se realizan obligatoriamente bajo protocolo **HTTPS con TLS 1.2 o superior**.
* **Cifrado en Reposo:** Las bases de datos y archivos documentales se almacenan cifrados mediante el estándar **AES-256**.
* **Segregación de Datos:** Mediante reglas de seguridad en la base de datos (Firestore Rules), se garantiza matemáticamente que un USUARIO con rol de *Proveedor* solo pueda acceder a los documentos vinculados a su propio ID (`request.auth.uid == resource.data.uid`).

### 5.3. Derechos del Titular

El USUARIO puede ejercer sus derechos de acceso, rectificación, actualización, eliminación y oposición contactando al Delegado de Protección de Datos a través de los canales oficiales de Indurama.

### 5.4. Notificación de Brechas (Incident Response Plan)

En el improbable caso de una vulneración de seguridad que afecte sus datos personales, LA ORGANIZACIÓN se compromete a notificar a la Autoridad de Protección de Datos y al USUARIO afectado en un plazo no mayor a **72 horas**, conforme al Plan de Respuesta a Incidentes (IRP) establecido.

## 6. PROHIBICIONES Y SEGURIDAD TÉCNICA (OWASP)

Queda estrictamente prohibido al USUARIO realizar cualquier acción que comprometa la seguridad o disponibilidad del SISTEMA, incluyendo pero no limitado a:

1. **Ingeniería Inversa:** Descompilar, desensamblar o intentar obtener el código fuente de la App Móvil (React Native) o del Backend.
2. **Ataques de Inyección:** Intentar manipular consultas a la base de datos (Inyección NoSQL) o insertar código malicioso en los campos de formulario. El SISTEMA cuenta con validación estricta de tipos de datos y esquemas para mitigar estos riesgos.
3. **Elusión de Controles:** Intentar evadir los mecanismos de autenticación, autorización o las validaciones de *App Check*.
4. **Uso en Dispositivos Comprometidos:** Se recomienda no utilizar la aplicación en dispositivos con privilegios de superusuario (*root* o *jailbreak*), ya que esto vulnera los controles de almacenamiento seguro (**OWASP MASVS-STORAGE**) implementados en la App.

## 7. PROPIEDAD INTELECTUAL

Todo el contenido del SISTEMA, incluyendo el diseño arquitectónico (Vistas Lógica, Procesos, Despliegue), código fuente, interfaces gráficas, logotipos y documentación, es propiedad exclusiva de **Indurama** o de sus licenciantes, protegidos por las leyes de propiedad intelectual nacionales e internacionales. El uso del SISTEMA no otorga al USUARIO ningún derecho de propiedad sobre los mismos.

## 8. DISPONIBILIDAD Y LIMITACIÓN DE RESPONSABILIDAD

El servicio se presta bajo una arquitectura en la nube (Serverless) diseñada para alta disponibilidad. Sin embargo:

* LA ORGANIZACIÓN no garantiza la disponibilidad ininterrumpida del servicio ante fallas de proveedores de infraestructura (Google Cloud Platform), fuerza mayor o mantenimiento programado.
* LA ORGANIZACIÓN no será responsable por daños indirectos, lucro cesante o pérdida de oportunidades de negocio derivados del uso o la imposibilidad de uso del SISTEMA.

## 9. GOBIERNO DE DATOS Y AUDITORÍA

Conforme al marco **DAMA-DMBOK**, el USUARIO reconoce que el SISTEMA actúa como registro maestro. Cualquier cambio en datos críticos (Razón Social, RUC, Cuentas Bancarias) quedará registrado en logs de auditoría inmutables para garantizar la **trazabilidad**, registrando quién realizó el cambio y cuándo.

## 10. MODIFICACIONES A LOS TÉRMINOS

LA ORGANIZACIÓN se reserva el derecho de modificar estos Términos en cualquier momento para adaptarlos a novedades legislativas o mejoras de seguridad (ej. actualizaciones de la norma ISO 27001 o nuevas versiones de OWASP). Las modificaciones serán notificadas a través del aplicativo y requerirán una nueva aceptación para continuar utilizando el servicio.

## 11. LEGISLACIÓN APLICABLE Y JURISDICCIÓN

Los presentes Términos se rigen e interpretan de acuerdo con las leyes de la **República del Ecuador**. Para cualquier controversia que pudiera derivarse del acceso o uso del SISTEMA, las partes se someten a la jurisdicción exclusiva de los jueces y tribunales competentes de la ciudad de Cuenca o Loja, Ecuador, renunciando a cualquier otro fuero que pudiera corresponderles.

---

**AL MARCAR LA CASILLA DE ACEPTACIÓN, USTED RECONOCE QUE HA LEÍDO Y COMPRENDIDO ESTOS TÉRMINOS Y CONDICIONES DE SEGURIDAD Y USO, Y ACEPTA VINCULARSE LEGALMENTE A ELLOS.**