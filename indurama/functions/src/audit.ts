import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import {logger} from "firebase-functions";
import {getClient} from "./adminClient";

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
    before: {status: beforeData?.status},
    after: {status: afterData?.status},
  };

  // Escribe el log en Google Cloud Logging
  // Comentario: Google Cloud Logging proporciona un registro centralizado para monitoreo
  // y alertas; es la primera capa para revisar eventos de seguridad y detectar anomalías.
  logger.log("Provider Status Change", logData);

  // Guardar registro de auditoría en Firestore para trazabilidad permanente
  // Comentario: audit_logs almacena registros para auditoría forense y reportes de cumplimiento
  // (por ejemplo retención y acceso restringido conforme a políticas ISO/IEC 27002).
  try {
    const db = getClient().firestore();
    db.collection("audit_logs").add({
      action: "providerStatusChange",
      providerId: event.params.providerId,
      actorUid,
      before: beforeData?.status,
      after: afterData?.status,
      timestamp: event.time,
    }).catch((e: any) => logger.warn("No se pudo escribir audit log en Firestore", e));
  } catch (e) {
    logger.warn("Error intentando guardar audit log en Firestore", e);
  }
});

