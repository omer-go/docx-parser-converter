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
} from '../../docx_parsers/models/index'; // Adjusted path assuming models are in docx_parsers
import { DEFAULT_ATTRIBUTES_GROUP_NAME } from '../../docx_parsers/helpers/common_helpers';


// --- Constants for XML Paths ---
const DOCUMENT_XML_PATH = "word/document.xml";
const STYLES_XML_PATH = "word/styles.xml";
const NUMBERING_XML_PATH = "word/numbering.xml";
// TODO: Add THEME_XML_PATH = "word/theme/theme1.xml";
// TODO: Add FONT_TABLE_XML_PATH = "word/fontTable.xml";
// TODO: Add SETTINGS_XML_PATH = "word/settings.xml";


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
  // TODO: Add themeModel, fontTable, settings, etc.
}

/**
 * Processes a DOCX file buffer to extract and parse key XML components.
 * @param docxFileBuffer The ArrayBuffer content of the .docx file.
 * @returns A Promise resolving to ProcessedDocxData.
 * @throws Error if essential XML parts like document.xml are missing or fail to parse.
 */
export async function processDocx(docxFileBuffer: ArrayBuffer): Promise<ProcessedDocxData> {
  // Styles Parsing
  const stylesXml = await getXmlFileContent(docxFileBuffer, STYLES_XML_PATH);
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
    console.warn("styles.xml not found, using default empty styles model.");
    stylesModel = getDefaultStylesModel();
  }

  // Numbering Parsing
  const numberingXml = await getXmlFileContent(docxFileBuffer, NUMBERING_XML_PATH);
  let numberingModel: DocxNumberingModel | undefined = undefined;
  if (numberingXml) {
    const parsedNumbering = parseNumberingXml(numberingXml, DEFAULT_ATTRIBUTES_GROUP_NAME);
    if (parsedNumbering) {
      numberingModel = parsedNumbering;
    } else {
      // If numbering.xml exists but fails to parse, we might use a default or none.
      console.warn("Failed to parse numbering.xml, using default empty numbering model. Lists may not render correctly.");
      numberingModel = getDefaultNumberingModel();
    }
  } else {
    // numbering.xml is optional, so it's fine if it's not present.
    // numberingModel remains undefined.
    console.info("numbering.xml not found. Proceeding without numbering definitions.");
  }

  // Document Parsing (document.xml is essential)
  const documentXml = await getXmlFileContent(docxFileBuffer, DOCUMENT_XML_PATH);
  if (!documentXml) {
    throw new Error(`Essential file "${DOCUMENT_XML_PATH}" not found or is empty in the DOCX archive.`);
  }

  // parseDocumentXml uses DEFAULT_ATTRIBUTES_GROUP_NAME and default preserveOrderElementName ("$$")
  const documentModel = parseDocumentXml(documentXml, DEFAULT_ATTRIBUTES_GROUP_NAME, "$$");
  if (!documentModel) {
    throw new Error(`Failed to parse "${DOCUMENT_XML_PATH}". Document processing cannot continue.`);
  }

  // Resolve Style Hierarchy
  // This step merges basedOn styles and document defaults into each style.
  const stylesMap = resolveStyleHierarchy(stylesModel);

  return {
    documentModel,
    stylesMap,
    numberingModel,
    rawStylesModel: stylesModel, // Include the original parsed styles for reference or advanced use
  };
}
