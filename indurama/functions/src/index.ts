// Firebase Functions v2 (COMPATIBLE con firebase-functions v7)

import {onCall} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import {getClient} from "./adminClient";

import {providerStatusAuditLog} from "./audit";

/**
 * Callable: asigna rol PROVEEDOR al usuario autenticado
 * Se llama UNA SOLA VEZ después del registro.
 */
/**
 * Callable: Asigna el rol inicial de forma segura (RBAC).
 * Cumple con ISO 27002 A.9 (Control de Acceso) y OWASP A01 (Broken Access Control).
 */
export const assignInitialRole = onCall(async (request) => {
  const {auth, data, app} = request;

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

    return {message: `Rol ${requestedRole} asignado correctamente.`};
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
  const {data, auth, app} = request;

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

  const {email, newRole} = data ?? {};
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

    return {message: `Éxito! ${email} ahora tiene el rol ${newRole}.`};
  } catch (error) {
    logger.error("Error en setUserRole:", error);
    throw new Error("internal: Ocurrió un error al procesar la solicitud.");
  }
});

/**
 * Firestore trigger (2nd gen)
 */
export {providerStatusAuditLog};
