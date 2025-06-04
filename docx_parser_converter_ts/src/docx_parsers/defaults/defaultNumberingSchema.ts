import type { NumberingSchema, NumberingInstance, NumberingLevel } from '../models/numberingModels';

/**
 * Returns a default NumberingSchema, allowing user overrides.
 * @param overrides Optional partial overrides for the default schema.
 */
export function getDefaultNumberingSchema(overrides?: Partial<NumberingSchema>): NumberingSchema {
  const defaultLevel: NumberingLevel = {
    numId: 1,
    ilvl: 0,
    start: 1,
    numFmt: 'decimal',
    lvlText: '%1.',
    lvlJc: 'left',
  };

  const defaultInstance: NumberingInstance = {
    numId: 1,
    levels: [defaultLevel],
  };

  const schema: NumberingSchema = {
    instances: [defaultInstance],
  };

  return { ...schema, ...overrides };
} 