import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import {logger} from "firebase-functions";

/**
 * Se dispara cada vez que un documento en la colección 'providers' es actualizado.
 * Registra un log de auditoría si el campo 'status' cambia.
 * (Versión actualizada para firebase-functions v2)
 */
export const providerStatusAuditLog = onDocumentUpdated("providers/{providerId}", (event) => {
  // El UID del usuario que hizo el cambio está en event.auth
  const actorUid = "system";

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
  };

  // Escribe el log en Google Cloud Logging
  logger.log("Provider Status Change", logData);
});

