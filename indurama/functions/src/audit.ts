import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import {logger} from "firebase-functions";
import * as admin from 'firebase-admin';
// Inicialización segura en caso de que no exista (evita errores en despliegues/paralelos)
if (!admin.apps || admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Se dispara cada vez que un documento en la colección 'providers' es actualizado.
 * Registra un log de auditoría si el campo 'status' cambia.
 * (Versión actualizada para firebase-functions v2)
 */
export const providerStatusAuditLog = onDocumentUpdated("providers/{providerId}", (event) => {
  // Intentar obtener UID del actor si está disponible en el evento (usamos any para evitar errores de tipado)
  const actorUid = (event as any)?.auth?.uid ?? "system";

  const beforeData = event.data?.before.data();
  const afterData = event.data?.after.data();

  // Continuar solo si el status ha cambiado
  if (beforeData?.status === afterData?.status) {
    return;
  }

  const logData = {
    message: `El estado del proveedor ${event.params.providerId} cambió de '${beforeData?.status}' a '${afterData?.status}'.`,
    actorUid: actorUid,
    timestamp: event.time, // Usamos el timestamp del evento
    before: { status: beforeData?.status },
    after: { status: afterData?.status },
  };

  // Escribe el log en Google Cloud Logging
  logger.log("Provider Status Change", logData);

  // Guardar registro de auditoría en Firestore para trazabilidad permanente
  try {
    const db = admin.firestore();
    db.collection('audit_logs').add({
      action: 'providerStatusChange',
      providerId: event.params.providerId,
      actorUid,
      before: beforeData?.status,
      after: afterData?.status,
      timestamp: event.time,
    }).catch(e => logger.warn('No se pudo escribir audit log en Firestore', e));
  } catch (e) {
    logger.warn('Error intentando guardar audit log en Firestore', e);
  }
});

