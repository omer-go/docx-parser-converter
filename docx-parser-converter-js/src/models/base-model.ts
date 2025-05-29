// src/models/base-model.ts
import { z } from 'zod';

/**
 * Base schema for common model properties.
 * This can be extended by other models if common fields like IDs or metadata are needed.
 * For now, it's minimal.
 */
export const BaseModelSchema = z.object({
  // Example: Add a common property if needed in the future
  // id: z.string().uuid().optional(), 
});

export type BaseModel = z.infer<typeof BaseModelSchema>;

// Add any base interfaces or classes if needed, not strictly tied to Zod
export interface IBaseModel {
  // Define common interface properties here
}
