import { AuthService } from './authService';

/**
 * [CONEXIÓN: NODOS LOAD BALANCER & API MANAGER]
 * Servicios que realizan las peticiones HTTP/REST hacia el Backend (API Manager).
 * Gateway central para todas las peticiones externas.
 */

// URL Base del API Manager (o del Load Balancer)
// En desarrollo puede apuntar a local o ambiente de pruebas
export const API_BASE_URL = 'https://api.indurama.com/v1';

/**
 * Configuración estándar para las peticiones (Headers, Timeouts, etc.)
 */
const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

/**
 * Clase estática para manejar las llamadas al API
 */
export class Api {
  
  /**
   * Wrapper para peticiones GET
   */
  static async get<T>(endpoint: string): Promise<T> {
    // Aquí iría la lógica real de fetch/axios con tokens interceptados
    console.log(`[GET] ${API_BASE_URL}${endpoint}`);
    // Por ahora simulamos o llamamos a servicios específicos si es necesario
    throw new Error('Method not implemented.');
  }

  /**
   * Wrapper para peticiones POST
   */
  static async post<T>(endpoint: string, body: any): Promise<T> {
    console.log(`[POST] ${API_BASE_URL}${endpoint}`, body);
    throw new Error('Method not implemented.');
  }

  // ... PUT, DELETE, ETC.

  /**
   * Referencia al servicio de Auth para compatibilidad
   * Esto permite importar 'Api' y acceder a todo.
   */
  static Auth = AuthService;
}

export default Api;
