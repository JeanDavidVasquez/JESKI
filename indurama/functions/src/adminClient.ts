import * as admin from "firebase-admin";

// Inicializa si no está inicializado (evita doble inicialización en tests/despliegues)
if (!admin.apps || admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * getClient: punto centralizado de acceso a Firebase Admin SDK
 *
 * - Permite controlar y sustituir el cliente en tests (inyección) mediante
 *   `globalThis.__ADMIN_CLIENT_OVERRIDE__` para evitar stubbing directo de ESM.
 * - Seguridad: centralizar llamadas a admin SDK facilita auditoría, rotación de
 *   credenciales y la implementación futura de controles (por ejemplo un adaptador
 *   que aplique validaciones extra o redacte datos sensibles antes de persistir).
 * - Referencia: Uso de un adaptador favorece principios de diseño seguro (separación de responsabilidades).
 *
 * @return {object} Un objeto con métodos `auth()`, `firestore()` y `FieldValue` que delegan al SDK de admin.
 */
export function getClient() {
  const override = (globalThis as any).__ADMIN_CLIENT_OVERRIDE__;
  if (override) return override;
  return {
    auth: () => admin.auth(),
    firestore: () => admin.firestore(),
    FieldValue: admin.firestore.FieldValue,
  };
}

