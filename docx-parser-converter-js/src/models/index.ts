// Models module - TypeScript/Zod equivalents of Python Pydantic models

// Base model exports
export * from './base-model';

// Document structure exports
export * from './document-models';

// Numbering exports (full numbering schema)
export {
  NumberingSchemaModel as DocumentNumberingSchemaModel,
  NumberingInstanceModel,
  NumberingInstanceSchema,
  NumberingLevelModel,
  NumberingLevelSchema,
  NumberingSchemaSchema,
  type NumberingSchema as DocumentNumberingSchema,
  type NumberingInstance,
  type NumberingLevel,
} from './numbering-models';

// Paragraph exports (includes paragraph-level numbering)
export {
  NumberingModel,
  ParagraphModel,
  ParagraphNumberingModel,
  ParagraphNumberingSchema,
  NumberingSchema as ParagraphNumberingSchemaAlias,
  ParagraphSchema,
  RunContentModel,
  RunContentSchema,
  RunModel,
  RunSchema,
  TabContentModel,
  TabContentSchema,
  TextContentModel,
  TextContentSchema,
  type Numbering,
  type Paragraph,
  type ParagraphNumbering,
  type Run,
  type RunContent,
  type TabContent,
  type TextContent,
} from './paragraph-models';

// Styles exports
export * from './styles-models';

// Table exports
export * from './table-models';
