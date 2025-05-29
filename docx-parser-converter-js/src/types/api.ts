// src/types/api.ts
import { z } from 'zod';

/**
 * Defines the input options for the DOCX conversion process.
 */
export const ConversionOptionsSchema = z.object({
  // Example option: whether to include default styles
  includeDefaultStyles: z.boolean().optional().default(true),
  // Example option: custom style map
  customStyleMap: z.record(z.string()).optional(), 
  // Add more conversion options as the API is defined
});
export type ConversionOptions = z.infer<typeof ConversionOptionsSchema>;


/**
 * Defines the structure of the output when converting to HTML.
 */
export interface HtmlOutput {
  html: string;
  styles: string; // Or an array of style rules, TBD
  metadata?: Record<string, any>; // Optional metadata
}

/**
 * Defines the structure of the output when converting to TXT.
 */
export interface TxtOutput {
  text: string;
  metadata?: Record<string, any>; // Optional metadata
}

/**
 * Represents the result of a parsing operation, before conversion.
 * This will be refined as models are built.
 */
export interface ParsedDocument {
    // Placeholder for the parsed document structure
    // This will eventually reference the main Document model
    content: any; // Replace 'any' with actual model type later
    styles: any;  // Replace 'any' with actual style model type later
}

// Add more API-related types as the library's interface is developed
