export function validateEmail(email: string): { valid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return { valid: false, error: 'Email is required' };
  if (!emailRegex.test(email)) return { valid: false, error: 'Invalid email format' };
  return { valid: true };
}

export function validatePhone(phone: string): { valid: boolean; error?: string } {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phone) return { valid: false, error: 'Phone number is required' };
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) return { valid: false, error: 'Invalid phone number format' };
  return { valid: true };
}

export function validateRequired<T>(value: T | null | undefined, fieldName: string): { valid: boolean; error?: string } {
  if (value === null || value === undefined || value === '') {
    return { valid: false, error: `${fieldName} is required` };
  }
  return { valid: true };
}

export function validateMinLength(value: string, min: number, fieldName: string): { valid: boolean; error?: string } {
  if (value.length < min) {
    return { valid: false, error: `${fieldName} must be at least ${min} characters` };
  }
  return { valid: true };
}

export function validateMaxLength(value: string, max: number, fieldName: string): { valid: boolean; error?: string } {
  if (value.length > max) {
    return { valid: false, error: `${fieldName} must be no more than ${max} characters` };
  }
  return { valid: true };
}

export function validateNumber(value: number | string, fieldName: string): { valid: boolean; error?: string } {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }
  return { valid: true };
}

export function validatePositiveNumber(value: number | string, fieldName: string): { valid: boolean; error?: string } {
  const validation = validateNumber(value, fieldName);
  if (!validation.valid) return validation;
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num <= 0) {
    return { valid: false, error: `${fieldName} must be a positive number` };
  }
  return { valid: true };
}