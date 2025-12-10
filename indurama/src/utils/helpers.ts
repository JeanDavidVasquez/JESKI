/**
 * Utilidades generales para la aplicación Indurama
 */

/**
 * Formatea un número como moneda peruana
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(amount);
};

/**
 * Formatea una fecha en español
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

/**
 * Formatea una fecha de forma relativa (hace X tiempo)
 */
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'hace unos segundos';
  if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} minutos`;
  if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} horas`;
  if (diffInSeconds < 2592000) return `hace ${Math.floor(diffInSeconds / 86400)} días`;
  if (diffInSeconds < 31536000) return `hace ${Math.floor(diffInSeconds / 2592000)} meses`;
  return `hace ${Math.floor(diffInSeconds / 31536000)} años`;
};

/**
 * Valida si un email es válido
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida si un RUC peruano es válido
 */
export const isValidRUC = (ruc: string): boolean => {
  if (!/^\d{11}$/.test(ruc)) return false;

  const digits = ruc.split('').map(Number);
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  
  const sum = digits.slice(0, 10).reduce((acc, digit, index) => {
    return acc + digit * weights[index];
  }, 0);

  const remainder = sum % 11;
  const checkDigit = remainder < 2 ? remainder : 11 - remainder;

  return checkDigit === digits[10];
};

/**
 * Genera un ID único
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Capitaliza la primera letra de cada palabra
 */
export const capitalizeWords = (text: string): string => {
  return text.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Trunca un texto a una longitud específica
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength).trim() + '...';
};

/**
 * Valida si un teléfono peruano es válido
 */
export const isValidPeruvianPhone = (phone: string): boolean => {
  // Acepta formatos: +51999888777, 999888777, 01999888777
  const phoneRegex = /^(\+51|51)?[9][0-9]{8}$/;
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  return phoneRegex.test(cleanPhone);
};

/**
 * Calcula el promedio de un array de números
 */
export const calculateAverage = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return sum / numbers.length;
};

/**
 * Convierte una calificación numérica a estrellas
 */
export const getRatingStars = (rating: number): string => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;

  return '★'.repeat(fullStars) + 
         '☆'.repeat(halfStar) + 
         '☆'.repeat(emptyStars);
};

/**
 * Debounce función para optimizar búsquedas
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Convierte bytes a formato legible
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};