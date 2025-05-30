import { z } from 'zod';
import { FontPropertiesModel, IndentationPropertiesModel } from './styles_models';

// Schema for Numbering Level
export const NumberingLevelModel = z.object({
  numId: z.number(),
  ilvl: z.number(),
  start: z.number(),
  numFmt: z.string(),
  lvlText: z.string(),
  lvlJc: z.string(),
  counter: z.number().optional(),
  // indent: IndentationPropertiesModel.optional(), // Replaced by paragraph_properties
  // tab_pt: z.number().optional(), // Potentially part of paragraph_properties.tabs
  // fonts: FontPropertiesModel.optional(), // Replaced by run_properties
  paragraph_properties: ParagraphStylePropertiesModel.optional(),
  run_properties: RunStylePropertiesModel.optional(),
});

// Interface for Numbering Level
export type NumberingLevel = z.infer<typeof NumberingLevelModel>;

// Schema for Numbering Instance
export const NumberingInstanceModel = z.object({
  numId: z.number(),
  levels: z.array(NumberingLevelModel),
});

// Interface for Numbering Instance
export type NumberingInstance = z.infer<typeof NumberingInstanceModel>;

// Schema for Overall Numbering Schema
export const NumberingModel = z.object({
  instances: z.array(NumberingInstanceModel),
});

// Interface for Overall Numbering Schema
export type NumberingSchema = z.infer<typeof NumberingModel>;
