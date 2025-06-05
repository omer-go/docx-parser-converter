import type { StylesSchema } from './models/stylesModels';
import type { NumberingSchema } from './models/numberingModels';
import type { DocumentSchema } from './models/documentModels';
import { StylesParser } from './styles/stylesParser';
import { NumberingParser } from './numbering/numberingParser';
import { DocumentParser } from './document/documentParser';
import { StylesMerger } from './styles/stylesMerger';
import { extractAllXmlPartsFromDocx } from './utils';
import { getDefaultStylesSchema } from './defaults/defaultStylesSchema';
import { getDefaultNumberingSchema } from './defaults/defaultNumberingSchema';
import { getDefaultDocumentSchema } from './defaults/defaultDocumentSchema';

/**
 * Options for DocxProcessor, including user-supplied defaults.
 */
export interface DocxProcessorOptions {
  stylesDefaults?: Partial<StylesSchema>;
  numberingDefaults?: Partial<NumberingSchema>;
  documentDefaults?: Partial<DocumentSchema>;
}

/**
 * High-level processor for DOCX files. Extracts, parses, and merges schemas.
 */
export class DocxProcessor {
  /**
   * Processes a DOCX file (ArrayBuffer, Uint8Array, Buffer, or File/Blob) and returns merged schemas.
   * @param source The DOCX file as binary.
   * @param options Optional user-supplied defaults.
   */
  static async processDocx(
    source: ArrayBuffer | Uint8Array | Buffer | File | Blob,
    options?: DocxProcessorOptions
  ): Promise<{ documentSchema: DocumentSchema; stylesSchema: StylesSchema; numberingSchema: NumberingSchema }> {
    let docxBuffer: Uint8Array | Buffer | ArrayBuffer;
    if (typeof File !== 'undefined' && source instanceof File) {
      docxBuffer = new Uint8Array(await source.arrayBuffer());
    } else if (typeof Blob !== 'undefined' && source instanceof Blob) {
      docxBuffer = new Uint8Array(await source.arrayBuffer());
    } else {
      docxBuffer = source as Uint8Array | Buffer | ArrayBuffer;
    }
    let documentXml = '', stylesXml = '', numberingXml = '';
    let stylesSchema: StylesSchema;
    let numberingSchema: NumberingSchema;
    let documentSchema: DocumentSchema;
    try {
      const xmls = await extractAllXmlPartsFromDocx(docxBuffer);
      documentXml = xmls.documentXml;
      stylesXml = xmls.stylesXml;
      numberingXml = xmls.numberingXml;
    } catch (e) {
      throw new Error('Failed to extract XML parts from DOCX: ' + (e as Error).message);
    }
    // Parse styles
    try {
      const stylesParser = new StylesParser(stylesXml);
      stylesSchema = stylesParser.getStylesSchema() || getDefaultStylesSchema(options?.stylesDefaults);
    } catch (e) {
      stylesSchema = getDefaultStylesSchema(options?.stylesDefaults);
    }
    // Parse numbering
    try {
      const numberingParser = await NumberingParser.create(numberingXml);
      numberingSchema = numberingParser.getNumberingSchema() || getDefaultNumberingSchema(options?.numberingDefaults);
    } catch (e) {
      numberingSchema = getDefaultNumberingSchema(options?.numberingDefaults);
    }
    // Parse document
    try {
      const documentParser = new DocumentParser(documentXml);
      documentSchema = documentParser.getDocumentSchema() || getDefaultDocumentSchema(options?.documentDefaults);
    } catch (e) {
      documentSchema = getDefaultDocumentSchema(options?.documentDefaults);
    }
    // Merge styles
    const merger = new StylesMerger(documentSchema, stylesSchema, numberingSchema);
    documentSchema = merger.documentSchema;
    return { documentSchema, stylesSchema, numberingSchema };
  }

  /**
   * Processes XML strings directly (for testing/advanced use).
   * @param xmls Object with documentXml, stylesXml, numberingXml.
   * @param options Optional user-supplied defaults.
   */
  static processXmlStrings(
    xmls: { documentXml: string; stylesXml: string; numberingXml: string },
    options?: DocxProcessorOptions
  ): { documentSchema: DocumentSchema; stylesSchema: StylesSchema; numberingSchema: NumberingSchema } {
    let stylesSchema: StylesSchema;
    let numberingSchema: NumberingSchema;
    let documentSchema: DocumentSchema;
    // Parse styles
    try {
      const stylesParser = new StylesParser(xmls.stylesXml);
      stylesSchema = stylesParser.getStylesSchema() || getDefaultStylesSchema(options?.stylesDefaults);
    } catch (e) {
      stylesSchema = getDefaultStylesSchema(options?.stylesDefaults);
    }
    // Parse numbering
    try {
      // NumberingParser.create is async for DOCX, but sync for XML string
      const numberingParser = NumberingParser.create instanceof Function && NumberingParser.create.length === 1
        ? (NumberingParser as any).create(xmls.numberingXml)
        : new (NumberingParser as any)(xmls.numberingXml);
      numberingSchema = numberingParser.getNumberingSchema() || getDefaultNumberingSchema(options?.numberingDefaults);
    } catch (e) {
      numberingSchema = getDefaultNumberingSchema(options?.numberingDefaults);
    }
    // Parse document
    try {
      const documentParser = new DocumentParser(xmls.documentXml);
      documentSchema = documentParser.getDocumentSchema() || getDefaultDocumentSchema(options?.documentDefaults);
    } catch (e) {
      documentSchema = getDefaultDocumentSchema(options?.documentDefaults);
    }
    // Merge styles
    const merger = new StylesMerger(documentSchema, stylesSchema, numberingSchema);
    documentSchema = merger.documentSchema;
    return { documentSchema, stylesSchema, numberingSchema };
  }
}

