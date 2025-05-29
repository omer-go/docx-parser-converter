import { z } from 'zod';

/**
 * Validation utilities using Zod for type-safe data validation
 * Provides schemas and validation functions for DOCX parsing
 */

/**
 * Base validation schemas
 */
export const BaseSchemas = {
  // String that can be empty
  optionalString: z.string().optional(),

  // Non-empty string
  nonEmptyString: z.string().min(1),

  // Positive number
  positiveNumber: z.number().positive(),

  // Non-negative number
  nonNegativeNumber: z.number().min(0),

  // Boolean value
  boolean: z.boolean(),

  // Color value (hex format)
  hexColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format'),

  // Measurement value (number with optional unit)
  measurement: z.union([
    z.number(),
    z.string().regex(/^-?\d*\.?\d+(pt|px|in|cm|mm|em|rem|%)?$/, 'Invalid measurement format'),
  ]),

  // XML attribute value
  xmlAttribute: z.union([z.string(), z.number(), z.boolean()]),

  // File path
  filePath: z.string().min(1),

  // MIME type
  mimeType: z
    .string()
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_.]*$/,
      'Invalid MIME type'
    ),
} as const;

/**
 * Font-related validation schemas
 */
export const FontSchemas = {
  fontName: z.string().min(1).max(100),
  fontSize: z.number().min(1).max(1000),
  fontWeight: z.union([
    z.number().min(100).max(900),
    z.enum(['normal', 'bold', 'bolder', 'lighter']),
  ]),
  fontStyle: z.enum(['normal', 'italic', 'oblique']),
  textDecoration: z.enum(['none', 'underline', 'line-through', 'overline']),
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']),
} as const;

/**
 * Color validation schemas
 */
export const ColorSchemas = {
  hexColor: BaseSchemas.hexColor,
  rgbColor: z.string().regex(/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/, 'Invalid RGB color format'),
  rgbaColor: z
    .string()
    .regex(
      /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[01]?\.?\d*\s*\)$/,
      'Invalid RGBA color format'
    ),
  namedColor: z.string().min(1).max(50),
  anyColor: z.union([
    BaseSchemas.hexColor,
    z.string().regex(/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/),
    z.string().regex(/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[01]?\.?\d*\s*\)$/),
    z.string().min(1).max(50), // Named colors
  ]),
} as const;

/**
 * Spacing and measurement validation schemas
 */
export const SpacingSchemas = {
  measurement: BaseSchemas.measurement,
  spacing: z.object({
    top: BaseSchemas.measurement.optional(),
    right: BaseSchemas.measurement.optional(),
    bottom: BaseSchemas.measurement.optional(),
    left: BaseSchemas.measurement.optional(),
  }),
  margin: z.object({
    top: BaseSchemas.measurement.optional(),
    right: BaseSchemas.measurement.optional(),
    bottom: BaseSchemas.measurement.optional(),
    left: BaseSchemas.measurement.optional(),
  }),
  padding: z.object({
    top: BaseSchemas.measurement.optional(),
    right: BaseSchemas.measurement.optional(),
    bottom: BaseSchemas.measurement.optional(),
    left: BaseSchemas.measurement.optional(),
  }),
  border: z.object({
    width: BaseSchemas.measurement.optional(),
    style: z.string().optional(),
    color: ColorSchemas.anyColor.optional(),
  }),
} as const;

/**
 * Alignment validation schemas
 */
export const AlignmentSchemas = {
  textAlign: z.enum(['left', 'center', 'right', 'justify', 'distribute']),
  verticalAlign: z.enum(['top', 'middle', 'bottom', 'baseline']),
  alignment: z.object({
    horizontal: z.enum(['left', 'center', 'right', 'justify', 'distribute']).optional(),
    vertical: z.enum(['top', 'middle', 'bottom', 'baseline']).optional(),
  }),
} as const;

/**
 * File validation schemas
 */
export const FileSchemas = {
  fileName: z.string().min(1).max(255),
  fileExtension: z.string().regex(/^[a-zA-Z0-9]+$/, 'Invalid file extension'),
  filePath: BaseSchemas.filePath,
  mimeType: BaseSchemas.mimeType,
  fileSize: BaseSchemas.nonNegativeNumber,
  fileContent: z.string(),
  binaryContent: z.instanceof(ArrayBuffer),
} as const;

/**
 * XML validation schemas
 */
export const XmlSchemas = {
  xmlString: z.string().min(1),
  xmlElement: z.record(z.string(), z.unknown()),
  xmlAttribute: BaseSchemas.xmlAttribute,
  xmlAttributes: z.record(z.string(), BaseSchemas.xmlAttribute),
  namespace: z.string().regex(/^[a-zA-Z][a-zA-Z0-9]*$/, 'Invalid namespace format'),
  qualifiedName: z
    .string()
    .regex(/^[a-zA-Z][a-zA-Z0-9]*:[a-zA-Z][a-zA-Z0-9]*$/, 'Invalid qualified name format'),
} as const;

/**
 * Validation error class
 */
export class ValidationError extends Error {
  public readonly issues: z.ZodIssue[];

  constructor(message: string, issues: z.ZodIssue[]) {
    super(message);
    this.name = 'ValidationError';
    this.issues = issues;
  }

  /**
   * Get formatted error message with all issues
   * @returns Formatted error message
   */
  public getFormattedMessage(): string {
    const issueMessages = this.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`);
    return `${this.message}\nIssues:\n${issueMessages.join('\n')}`;
  }
}

/**
 * Validate data against a Zod schema
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param errorMessage - Custom error message
 * @returns Validated data
 * @throws ValidationError if validation fails
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  errorMessage: string = 'Validation failed'
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new ValidationError(errorMessage, result.error.issues);
  }

  return result.data;
}

/**
 * Safely validate data without throwing errors
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result object
 */
export function safeValidateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: ValidationError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return {
      success: false,
      error: new ValidationError('Validation failed', result.error.issues),
    };
  }
}

/**
 * Validate and transform measurement value
 * @param value - Measurement value to validate
 * @param defaultUnit - Default unit if none specified
 * @returns Validated measurement object
 */
export function validateMeasurement(
  value: unknown,
  defaultUnit: string = 'pt'
): { value: number; unit: string } {
  const validated = validateData(BaseSchemas.measurement, value, 'Invalid measurement value');

  if (typeof validated === 'number') {
    return { value: validated, unit: defaultUnit };
  }

  // Parse string measurement
  const match = validated.match(/^(-?\d*\.?\d+)([a-zA-Z%]*)$/);
  if (!match) {
    throw new ValidationError('Invalid measurement format', []);
  }

  const numValue = parseFloat(match[1]!);
  const unit = match[2] || defaultUnit;

  return { value: numValue, unit };
}

/**
 * Validate color value and normalize to hex format
 * @param value - Color value to validate
 * @returns Normalized hex color
 */
export function validateColor(value: unknown): string {
  const validated = validateData(ColorSchemas.anyColor, value, 'Invalid color value');

  // If already hex, return as-is
  if (validated.startsWith('#')) {
    return validated;
  }

  // Convert RGB to hex (simplified implementation)
  const rgbMatch = validated.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]!, 10);
    const g = parseInt(rgbMatch[2]!, 10);
    const b = parseInt(rgbMatch[3]!, 10);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // For named colors, return as-is (would need color name mapping in real implementation)
  return validated;
}

/**
 * Validate file name and sanitize if needed
 * @param fileName - File name to validate
 * @returns Sanitized file name
 */
export function validateFileName(fileName: unknown): string {
  const validated = validateData(FileSchemas.fileName, fileName, 'Invalid file name');

  // Sanitize the file name
  return validated
    .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters
    .replace(/\s+/g, '_') // Replace spaces
    .replace(/_{2,}/g, '_') // Remove multiple underscores
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
}

/**
 * Create a validation schema for arrays with minimum length
 * @param itemSchema - Schema for array items
 * @param minLength - Minimum array length
 * @returns Array schema with minimum length validation
 */
export function arrayWithMinLength<T>(
  itemSchema: z.ZodSchema<T>,
  minLength: number = 1
): z.ZodArray<z.ZodSchema<T>> {
  return z.array(itemSchema).min(minLength);
}

/**
 * Utility function to validate object properties
 * @param obj - Object to validate
 * @param propertySchemas - Schemas for each property
 * @returns Validated object
 */
export function validateObjectProperties<T extends Record<string, unknown>>(
  obj: unknown,
  propertySchemas: { [K in keyof T]: z.ZodSchema<T[K]> }
): T {
  if (!obj || typeof obj !== 'object') {
    throw new ValidationError('Expected object', []);
  }

  const result: Partial<T> = {};
  const errors: z.ZodIssue[] = [];

  for (const [key, schema] of Object.entries(propertySchemas)) {
    try {
      const value = (obj as Record<string, unknown>)[key];
      result[key as keyof T] = validateData(schema, value);
    } catch (error) {
      if (error instanceof ValidationError) {
        errors.push(
          ...error.issues.map(issue => ({
            ...issue,
            path: [key, ...issue.path],
          }))
        );
      }
    }
  }

  if (errors.length > 0) {
    throw new ValidationError('Object validation failed', errors);
  }

  return result as T;
}
