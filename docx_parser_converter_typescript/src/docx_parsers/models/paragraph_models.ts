import { z } from 'zod';
import { ParagraphStylePropertiesModel, RunStylePropertiesModel } from './styles_models';

// Schema for Paragraph Numbering
export const NumberingModel = z.object({
  ilvl: z.number(),
  numId: z.number(),
});

// Interface for Paragraph Numbering
export type Numbering = z.infer<typeof NumberingModel>;

// Schema for Text Content
export const TextContentModel = z.object({
  text: z.string(),
});

// Interface for Text Content
export type TextContent = z.infer<typeof TextContentModel>;

// Schema for Tab Content
export const TabContentModel = z.object({
  type: z.string().default('tab'),
});

// Interface for Tab Content
export type TabContent = z.infer<typeof TabContentModel>;

// Schema for Run Content (Union of TextContent and TabContent)
export const RunContentModel = z.object({
  run: z.union([TextContentModel, TabContentModel]),
});

// Interface for Run Content
export type RunContent = z.infer<typeof RunContentModel>;

// Schema for Run
export const RunModel = z.object({
  contents: z.array(RunContentModel),
  properties: RunStylePropertiesModel.optional(),
});

// Interface for Run
export type Run = z.infer<typeof RunModel>;

// Schema for Paragraph
export const ParagraphModel = z.object({
  properties: ParagraphStylePropertiesModel,
  runs: z.array(RunModel),
  numbering: NumberingModel.optional(),
});

// Interface for Paragraph
export type Paragraph = z.infer<typeof ParagraphModel>;
