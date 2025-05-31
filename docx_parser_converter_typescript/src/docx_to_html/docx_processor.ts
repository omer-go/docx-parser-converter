import { getXmlFileContent } from '../../docx_parsers/utils';
import { StylesParser as parseStylesXmlInternal } from '../../docx_parsers/styles/styles_parser'; // Renamed to avoid clash
import { parseNumberingXml } from '../../docx_parsers/numbering/numbering_parser';
import { parseDocumentXml } from '../../docx_parsers/document/document_parser';
import { resolveStyleHierarchy } from '../../docx_parsers/styles/style_resolver';
import {
  DocumentModel,
  StylesModel,
  NumberingModel as DocxNumberingModel, // Alias for clarity
  StyleModel,
  ParagraphStylePropertiesModel, // For default styles
  RunStylePropertiesModel,       // For default styles
  StyleDefaultsModel,            // For default styles
} from '../../docx_parsers/models/index';
import { DEFAULT_ATTRIBUTES_GROUP_NAME } from '../../docx_parsers/helpers/common_helpers';


// --- Constants for XML Paths ---
const DOCUMENT_XML_PATH = "word/document.xml";
const STYLES_XML_PATH = "word/styles.xml";
const NUMBERING_XML_PATH = "word/numbering.xml";
// TODO: Add THEME_XML_PATH = "word/theme/theme1.xml";
// TODO: Add FONT_TABLE_XML_PATH = "word/fontTable.xml";
// TODO: Add SETTINGS_XML_PATH = "word/settings.xml";


/**
 * Interface for providing raw XML strings directly, bypassing ZIP extraction.
 */
export interface RawXmlStrings {
    documentXml: string;
    stylesXml?: string;
    numberingXml?: string;
    // TODO: Potentially add other XMLs like theme, fontTable if they become relevant
}

// Wrapper for StylesParser class
function parseStylesXml(xmlString: string): StylesModel | undefined {
    try {
        const parser = new parseStylesXmlInternal(xmlString); // Uses DEFAULT_ATTRIBUTES_GROUP_NAME internally
        return parser.parse();
    } catch (error) {
        console.error("Error parsing styles.xml:", error);
        return undefined;
    }
}


/**
 * Provides a default, valid empty StylesModel.
 * @returns An empty StylesModel.
 */
function getDefaultStylesModel(): StylesModel {
  const defaultPPr = ParagraphStylePropertiesModel.parse({});
  const defaultRPr = RunStylePropertiesModel.parse({});
  const defaultStyleTypeDefaults = StyleDefaultsModel.parse({});

  return StylesModel.parse({
    styles: [],
    doc_defaults_ppr: defaultPPr,
    doc_defaults_rpr: defaultRPr,
    style_type_defaults: defaultStyleTypeDefaults,
  });
}

/**
 * Provides a default, valid empty DocxNumberingModel.
 * @returns An empty DocxNumberingModel.
 */
function getDefaultNumberingModel(): DocxNumberingModel {
  return DocxNumberingModel.parse({
    instances: [],
  });
}

/**
 * Interface for the processed DOCX data.
 */
export interface ProcessedDocxData {
  documentModel: DocumentModel;
  stylesMap: Map<string, StyleModel>;
  numberingModel?: DocxNumberingModel;
  rawStylesModel: StylesModel; // Keep the original parsed styles too
  // For logging/debugging
  rawXml?: { // Present if requested by options
      documentXml: string;
      stylesXml?: string;
      numberingXml?: string;
  };
  // TODO: Add themeModel, fontTable, settings, etc.
}

/**
 * Processes a DOCX file buffer or raw XML strings to extract and parse key XML components.
 * @param source The ArrayBuffer content of the .docx file or an object containing raw XML strings.
 * @param options Optional parameters, e.g., for debugging.
 * @returns A Promise resolving to ProcessedDocxData.
 * @throws Error if essential XML parts like document.xml are missing or fail to parse.
 */
export async function processDocx(
    source: ArrayBuffer | RawXmlStrings,
    options?: { debugReturnRawXml?: boolean }
): Promise<ProcessedDocxData> {
  const isBuffer = source instanceof ArrayBuffer || source instanceof Uint8Array;

  // Styles Parsing
  const stylesXml = isBuffer
    ? await getXmlFileContent(source as ArrayBuffer, STYLES_XML_PATH)
    : (source as RawXmlStrings).stylesXml;
  let stylesModel: StylesModel;
  if (stylesXml) {
    const parsedStyles = parseStylesXml(stylesXml);
    if (parsedStyles) {
      stylesModel = parsedStyles;
    } else {
      console.warn("Failed to parse styles.xml, using default empty styles model.");
      stylesModel = getDefaultStylesModel();
    }
  } else {
    console.warn("styles.xml not found or provided, using default empty styles model.");
    stylesModel = getDefaultStylesModel();
  }

  // Numbering Parsing
  const numberingXml = isBuffer
    ? await getXmlFileContent(source as ArrayBuffer, NUMBERING_XML_PATH)
    : (source as RawXmlStrings).numberingXml;
  let numberingModel: DocxNumberingModel | undefined = undefined;
  if (numberingXml) {
    const parsedNumbering = parseNumberingXml(numberingXml, DEFAULT_ATTRIBUTES_GROUP_NAME);
    if (parsedNumbering) {
      numberingModel = parsedNumbering;
    } else {
      console.warn("Failed to parse numbering.xml, using default empty numbering model. Lists may not render correctly.");
      numberingModel = getDefaultNumberingModel();
    }
  } else {
    console.info("numbering.xml not found or provided. Proceeding without numbering definitions.");
  }

  // Document Parsing (document.xml is essential)
  const documentXml = isBuffer
    ? await getXmlFileContent(source as ArrayBuffer, DOCUMENT_XML_PATH)
    : (source as RawXmlStrings).documentXml;

  if (!documentXml) { // This covers both cases: null from getXmlFileContent or not provided in RawXmlStrings
    throw new Error(`Essential document.xml content not found or provided.`);
  }

  const documentModel = parseDocumentXml(documentXml, DEFAULT_ATTRIBUTES_GROUP_NAME, "$$");
  if (!documentModel) {
    throw new Error(`Failed to parse document.xml. Document processing cannot continue.`);
  }

  // Resolve Style Hierarchy
  // This step merges basedOn styles and document defaults into each style.
  const stylesMap = resolveStyleHierarchy(stylesModel);

  const result: ProcessedDocxData = {
    documentModel,
    stylesMap,
    numberingModel,
    rawStylesModel: stylesModel,
  };

  if (options?.debugReturnRawXml) {
    result.rawXml = {
      documentXml: documentXml, // documentXml is guaranteed to be a string here due to earlier checks
      stylesXml: stylesXml || undefined, // Store if available
      numberingXml: numberingXml || undefined, // Store if available
    };
  }

  return result;
}
