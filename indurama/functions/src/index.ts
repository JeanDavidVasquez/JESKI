// Firebase Functions v2 (COMPATIBLE con firebase-functions v7)

import {onCall} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import * as admin from "firebase-admin";

import {providerStatusAuditLog} from "./audit";

admin.initializeApp();

/**
 * Callable: asigna rol PROVEEDOR al usuario autenticado
 * Se llama UNA SOLA VEZ después del registro.
 */
export const assignDefaultProviderRole = onCall(async (request) => {
  const {auth} = request;

  if (!auth) {
    throw new Error("unauthenticated: Debes iniciar sesión.");
  }

  try {
    await admin.auth().setCustomUserClaims(auth.uid, {
      role: "PROVEEDOR",
    });

    logger.info(`Rol PROVEEDOR asignado al usuario ${auth.uid}`);

    return {message: "Rol PROVEEDOR asignado correctamente."};
  } catch (error) {
    logger.error("Error asignando rol por defecto", error);
    throw new Error("internal: No se pudo asignar el rol.");
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
  const {data, auth} = request;

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
    const userToUpdate = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(userToUpdate.uid, {
      role: newRole,
    });

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
