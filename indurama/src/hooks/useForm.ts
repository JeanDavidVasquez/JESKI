import { useState, useCallback } from 'react';

/**
 * Hook para manejar estados de formularios
 */
export const useForm = <T extends Record<string, any>>(
  initialValues: T,
  validationRules?: Partial<Record<keyof T, (value: any) => string | undefined>>
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouchedState] = useState<Partial<Record<keyof T, boolean>>>({});

  const setValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({
      ...prev,
      [name]: value,
    }));

    // Validar el campo si hay reglas de validación
    if (validationRules && validationRules[name]) {
      const error = validationRules[name]!(value);
      setErrors(prev => ({
        ...prev,
        [name]: error,
      }));
    }
  }, [validationRules]);

  const setTouched = useCallback((name: keyof T) => {
    setTouchedState(prev => ({
      ...prev,
      [name]: true,
    }));
  }, []);

  const validate = useCallback(() => {
    if (!validationRules) return true;

    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(validationRules).forEach((key) => {
      const fieldName = key as keyof T;
      const rule = validationRules[fieldName];
      if (rule) {
        const error = rule(values[fieldName]);
        if (error) {
          newErrors[fieldName] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validationRules]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouchedState({});
  }, [initialValues]);

  const handleSubmit = useCallback((onSubmit: (values: T) => void | Promise<void>) => {
    return async () => {
      const isValid = validate();
      if (isValid) {
        await onSubmit(values);
      }
    };
  }, [values, validate]);

  return {
    values,
    errors,
    touched,
    setValue,
    setTouched,
    validate,
    reset,
    handleSubmit,
    isValid: Object.keys(errors).length === 0,
  };
};