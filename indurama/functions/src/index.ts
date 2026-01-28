// Firebase Functions v2 (COMPATIBLE con firebase-functions v7)

import { onCall } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { getClient } from "./adminClient";

import { providerStatusAuditLog } from "./audit";

/**
 * Callable: asigna rol PROVEEDOR al usuario autenticado
 * Se llama UNA SOLA VEZ después del registro.
 */
/**
 * Callable: Asigna el rol inicial de forma segura (RBAC).
 * Cumple con ISO 27002 A.9 (Control de Acceso) y OWASP A01 (Broken Access Control).
 */
export const assignInitialRole = onCall(async (request) => {
  const { auth, data, app } = request;

  // App Check enforcement (rechaza llamadas sin token válido)
  // Seguridad: Firebase App Check se utiliza para atestación de la app cliente y mitiga
  // riesgos de bots o peticiones no autorizadas (ver Diseño Arquitectónico/8. Seguridad).
  // OWASP: reduce riesgo de abusos automáticos; ISO/IEC 27002: control de acceso a servicios.
  if (!app) {
    throw new Error("failed-precondition: App Check token missing o inválido.");
  }

  // 1. Autenticación Obligatoria (ISO 27001)
  // Seguridad: requerimos que la llamada incluya credenciales legítimas (request.auth).
  // Esto implementa control de acceso basado en identidad y apoya requisitos de trazabilidad.
  if (!auth) {
    throw new Error("unauthenticated: Debes iniciar sesión.");
  }

  // 2. Validación de Entrada (OWASP A03 - Injection Prevention)
  // Seguridad: validamos y normalizamos la entrada aquí para evitar inyección y escalada
  // de privilegios (por ejemplo evitar 'role: ADMIN' desde cliente). Esto es parte de
  // controles de entrada recomendados por OWASP y buena práctica para RBAC.
  const requestedRole = data.role;

  // Whitelist estricta: Solo permitimos estos roles públicos.
  // Esto evita que un atacante envíe { role: "ADMIN" } y gane privilegios.
  const allowedRoles = ["PROVEEDOR", "SOLICITANTE"];

  if (!requestedRole || !allowedRoles.includes(requestedRole)) {
    throw new Error(
      "invalid-argument: Rol no válido o intento de escalada de privilegios."
    );
  }

  try {
    // 3. Principio de Mínimo Privilegio (Preventivo)
    // Verificamos si ya tiene rol para evitar sobrescrituras maliciosas.
    const client = getClient();
    const userRecord = await client.auth().getUser(auth.uid);
    if (userRecord.customClaims && userRecord.customClaims.role) {
      throw new Error("already-exists: El usuario ya tiene un rol asignado.");
    }

    // 4. Asignación del Custom Claim (Implementación de Seguridad.md)
    // Seguridad: setCustomUserClaims modifica el token JWT del usuario y debe ser
    // usada sólo desde backend de confianza. Esto implementa RBAC a nivel de token
    // (ISO/IEC 27002 - control de acceso) y reduce riesgo de manipulación por cliente.
    await client.auth().setCustomUserClaims(auth.uid, {
      role: requestedRole,
    });

    // 5. Trazabilidad y Auditoría (ISO 8000 / Calidad de Datos.md)
    // Registro local en logs para observabilidad (Google Cloud Logging) y cumplimiento
    // de trazabilidad; además persistimos un registro en Firestore (audit_logs)
    // para auditorías forenses y reportes de cumplimiento (retención y acceso según política).
    logger.info(`AUDIT: Rol ${requestedRole} asignado al usuario ${auth.uid}`);

    // Persistimos un registro de auditoría en Firestore para trazabilidad a largo plazo
    try {
      await client.firestore().collection("audit_logs").add({
        action: "assignInitialRole",
        actorUid: auth.uid,
        targetUid: auth.uid,
        requestedRole,
        previousClaims: userRecord.customClaims || null,
        timestamp: client.FieldValue.serverTimestamp(),
      });
    } catch (auditErr) {
      logger.warn("No se pudo guardar registro de auditoría en Firestore:", auditErr);
      // No fallamos la operación principal por no poder guardar el log
    }

    return { message: `Rol ${requestedRole} asignado correctamente.` };
  } catch (error: any) {
    logger.error("Error de seguridad en asignación de rol", error);
    if (error.code === "already-exists") {
      throw new Error(error.message);
    }
    throw new Error("internal: No se pudo procesar la solicitud.");
  }
});

/**
 * Callable: ADMIN asigna roles a otros usuarios
 */
type SetUserRoleData = {
  email?: string;
  newRole?: string;
};

type TokenWithRole = {
  role?: string;
};

export const setUserRole = onCall<SetUserRoleData>(async (request) => {
  const { data, auth, app } = request;

  // App Check enforcement (rechaza llamadas sin token válido)
  // Seguridad: App Check protege el backend de clientes no autorizados (bots/scripts).
  // Referencia: Diseño Arquitectónico/8. Seguridad - App Check (MASVS / Google Play Integrity).
  if (!app) {
    throw new Error("failed-precondition: App Check token missing o inválido.");
  }

  // Control de permiso administrativo (RBAC)
  // Seguridad: Solo los usuarios con claim 'ADMIN' pueden ejecutar esta operación.
  // OWASP: Broken Access Control mitigated by enforcing server-side role checks.
  const role = (auth?.token as TokenWithRole | undefined)?.role;
  if (!auth || role !== "ADMIN") {
    throw new Error(
      "permission-denied: Esta función solo puede ser ejecutada por un administrador."
    );
  }

  const { email, newRole } = data ?? {};
  const validRoles = new Set([
    "ADMIN",
    "GESTOR",
    "PROVEEDOR",
    "SOLICITANTE",
  ]);

  if (!email || !newRole || !validRoles.has(newRole)) {
    throw new Error(
      "invalid-argument: Se requiere un 'email' y un 'newRole' válido."
    );
  }

  try {
    const client = getClient();
    const userToUpdate = await client.auth().getUserByEmail(email);
    await client.auth().setCustomUserClaims(userToUpdate.uid, {
      role: newRole,
    });

    // Auditoría: guardar actividad y loguear
    // Seguridad: este registro permite trazar cambios de privilegios (principio de separación de funciones)
    // y soporta requerimientos de ISO/OWASP en términos de registro y respuesta ante incidentes.
    logger.info(`ADMIN AUDIT: ${auth.uid} asignó rol ${newRole} a ${email}`);
    try {
      await client.firestore().collection("audit_logs").add({
        action: "setUserRole",
        actorUid: auth.uid,
        targetUid: userToUpdate.uid,
        targetEmail: email,
        newRole,
        timestamp: client.FieldValue.serverTimestamp(),
      });
    } catch (auditErr) {
      logger.warn("No se pudo guardar registro de auditoría en Firestore (setUserRole):", auditErr);
    }

    return { message: `Éxito! ${email} ahora tiene el rol ${newRole}.` };
  } catch (error) {
    logger.error("Error en setUserRole:", error);
    throw new Error("internal: Ocurrió un error al procesar la solicitud.");
  }
});

/**
 * Firestore trigger (2nd gen)
 */
export { providerStatusAuditLog };

/**
 * Email Notification Triggers
 * Estos triggers envían notificaciones por email en eventos clave del flujo de solicitudes
 */
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { EmailService } from "./emailService";

/**
 * Trigger: Nueva solicitud creada
 * Notifica a todos los gestores cuando se crea una nueva solicitud
 */
export const onRequestCreated = onDocumentCreated(
  "requests/{requestId}",
  async (event) => {
    try {
      const requestData = event.data?.data();
      if (!requestData) return;

      const client = getClient();

      // Obtener todos los gestores
      const usersSnapshot = await client.firestore()
        .collection("users")
        .where("role", "==", "gestor")
        .get();

      const gestorEmails: string[] = [];
      usersSnapshot.forEach((doc: any) => {
        const userData = doc.data();
        if (userData.email) {
          gestorEmails.push(userData.email);
        }
      });

      if (gestorEmails.length > 0) {
        await EmailService.sendNewRequestNotification(gestorEmails, {
          code: requestData.code || "N/A",
          title: requestData.title || "Sin título",
          userName: requestData.userName || "Usuario",
          department: requestData.department || "N/A",
          priority: requestData.priority || "media",
        });
        logger.info(`Email de nueva solicitud enviado a ${gestorEmails.length} gestores`);
      }
    } catch (error) {
      logger.error("Error en onRequestCreated trigger:", error);
    }
  }
);

/**
 * Trigger: Solicitud actualizada
 * Detecta cambios de estado y envía notificaciones apropiadas
 */
export const onRequestUpdated = onDocumentUpdated(
  "requests/{requestId}",
  async (event) => {
    try {
      const beforeData = event.data?.before.data();
      const afterData = event.data?.after.data();

      if (!beforeData || !afterData) return;

      const client = getClient();

      // Caso 1: Solicitud aprobada (cambio a 'in_progress' o 'approved')
      if (
        beforeData.status !== afterData.status &&
        (afterData.status === "in_progress" || afterData.status === "approved")
      ) {
        const solicitanteEmail = afterData.userEmail;
        if (solicitanteEmail) {
          await EmailService.sendRequestApprovedNotification(
            solicitanteEmail,
            {
              code: afterData.code || "N/A",
              title: afterData.title || "Sin título",
              reviewedByName: afterData.reviewedByName,
            }
          );
          logger.info(`Email de aprobación enviado a ${solicitanteEmail}`);
        }
      }

      // Caso 2: Recepción confirmada (receivedAt se establece)
      if (!beforeData.receivedAt && afterData.receivedAt) {
        // Obtener email del proveedor ganador
        let proveedorEmail = "";
        let supplierName = "Proveedor";

        if (afterData.winnerId) {
          const supplierDoc = await client.firestore()
            .collection("users")
            .doc(afterData.winnerId)
            .get();

          if (supplierDoc.exists) {
            const supplierData = supplierDoc.data();
            proveedorEmail = supplierData?.email || "";
            supplierName = `${supplierData?.firstName || ""} ${supplierData?.lastName || ""}`.trim() ||
              supplierData?.companyName || "Proveedor";
          }
        }

        // Obtener emails de gestores
        const gestoresSnapshot = await client.firestore()
          .collection("users")
          .where("role", "==", "gestor")
          .get();

        const recipients: string[] = [];
        if (proveedorEmail) recipients.push(proveedorEmail);

        gestoresSnapshot.forEach((doc: any) => {
          const userData = doc.data();
          if (userData.email) recipients.push(userData.email);
        });

        if (recipients.length > 0) {
          await EmailService.sendReceiptConfirmedNotification(
            recipients,
            {
              code: afterData.code || "N/A",
              title: afterData.title || "Sin título",
              supplierName,
              confirmedBy: afterData.userName || "Usuario",
            }
          );
          logger.info(`Email de recepción confirmada enviado a ${recipients.length} destinatarios`);
        }
      }
    } catch (error) {
      logger.error("Error en onRequestUpdated trigger:", error);
    }
  }
);

/**
 * Callable Function: Enviar emails de cotización
 * Permite al cliente enviar emails relacionados con cotizaciones
 */
type SendQuotationEmailData = {
  type: 'invitation' | 'winner' | 'supplier_selected' | 'quotation_started';
  requestId: string;
  requestCode?: string;
  requestTitle?: string;
  requestDescription?: string;
  supplierIds?: string[];
  supplierId?: string;
  solicitanteEmail?: string;
  dueDate?: string;
  amount?: number;
  currency?: string;
  supplierCount?: number;
};

export const sendQuotationEmail = onCall<SendQuotationEmailData>(async (request) => {
  const { data, auth } = request;

  if (!auth) {
    throw new Error("unauthenticated: Debes iniciar sesión.");
  }

  try {
    const client = getClient();

    switch (data.type) {
      case 'invitation':
        // Enviar invitaciones a proveedores
        if (data.supplierIds && data.requestCode && data.requestTitle) {
          for (const supplierId of data.supplierIds) {
            const supplierDoc = await client.firestore()
              .collection("users")
              .doc(supplierId)
              .get();

            if (supplierDoc.exists) {
              const supplierData = supplierDoc.data();
              const supplierEmail = supplierData?.email;
              const supplierName = `${supplierData?.firstName || ""} ${supplierData?.lastName || ""}`.trim() ||
                supplierData?.companyName || "Proveedor";

              if (supplierEmail) {
                await EmailService.sendQuotationInvitationNotification(
                  supplierEmail,
                  supplierName,
                  {
                    code: data.requestCode,
                    title: data.requestTitle,
                    description: data.requestDescription || "",
                    dueDate: data.dueDate || "Por definir",
                  }
                );
              }
            }
          }
        }
        break;

      case 'quotation_started':
        // Notificar al solicitante que comenzó la cotización
        if (data.solicitanteEmail && data.requestCode && data.requestTitle) {
          await EmailService.sendQuotationStartedNotification(
            data.solicitanteEmail,
            {
              code: data.requestCode,
              title: data.requestTitle,
              supplierCount: data.supplierCount || 0,
            }
          );
        }
        break;

      case 'winner':
        // Notificar al proveedor ganador
        if (data.supplierId && data.requestCode && data.requestTitle) {
          const supplierDoc = await client.firestore()
            .collection("users")
            .doc(data.supplierId)
            .get();

          if (supplierDoc.exists) {
            const supplierData = supplierDoc.data();
            const supplierEmail = supplierData?.email;
            const supplierName = `${supplierData?.firstName || ""} ${supplierData?.lastName || ""}`.trim() ||
              supplierData?.companyName || "Proveedor";

            if (supplierEmail) {
              await EmailService.sendWinnerNotification(
                supplierEmail,
                supplierName,
                {
                  code: data.requestCode,
                  title: data.requestTitle,
                  amount: data.amount || 0,
                  currency: data.currency || "USD",
                }
              );
            }
          }
        }
        break;

      case 'supplier_selected':
        // Notificar al solicitante sobre proveedor seleccionado
        if (data.solicitanteEmail && data.requestCode && data.requestTitle && data.supplierId) {
          const supplierDoc = await client.firestore()
            .collection("users")
            .doc(data.supplierId)
            .get();

          let supplierName = "Proveedor";
          if (supplierDoc.exists) {
            const supplierData = supplierDoc.data();
            supplierName = `${supplierData?.firstName || ""} ${supplierData?.lastName || ""}`.trim() ||
              supplierData?.companyName || "Proveedor";
          }

          await EmailService.sendSupplierSelectedNotification(
            data.solicitanteEmail,
            {
              code: data.requestCode,
              title: data.requestTitle,
              supplierName,
              amount: data.amount || 0,
              currency: data.currency || "USD",
            }
          );
        }
        break;
    }

    return { success: true, message: "Email enviado correctamente" };
  } catch (error) {
    logger.error("Error en sendQuotationEmail:", error);
    throw new Error("internal: Error al enviar email");
  }
});


