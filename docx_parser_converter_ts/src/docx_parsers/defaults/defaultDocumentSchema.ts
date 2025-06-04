import type { DocumentSchema } from '../models/documentModels';

/**
 * Returns a default DocumentSchema, allowing user overrides.
 * @param overrides Optional partial overrides for the default schema.
 */
export function getDefaultDocumentSchema(overrides?: Partial<DocumentSchema>): DocumentSchema {
  const schema: DocumentSchema = {
    elements: [],
    docMargins: undefined,
  };
  return { ...schema, ...overrides };
} 