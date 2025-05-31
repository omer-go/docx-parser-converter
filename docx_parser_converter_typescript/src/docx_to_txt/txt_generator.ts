import {
  DocumentModel,
  ParagraphModel,
  TableModel,
  NumberingModel as DocxNumberingModel,
} from '../../../docx_parsers/models/index';
import { convertParagraphToTxt, ConvertParagraphToTxtOptions } from './converters/paragraph_converter';
import { convertTableToTxt } from './converters/table_converter';
import { TxtNumberingStateService } from './converters/numbering_converter';

// Type guards
function isParagraphModel(element: any): element is ParagraphModel {
  return element && Array.isArray(element.runs);
}

function isTableModel(element: any): element is TableModel {
  return element && Array.isArray(element.rows) && element.grid;
}

/**
 * Options for generating plain text output.
 * Currently extends options for paragraph conversion.
 */
export interface GenerateTxtOptions extends ConvertParagraphToTxtOptions {
  /** Whether to include text content from tables. Defaults to true. */
  extractTables?: boolean;
}

/**
 * Generates the plain text content for the body of the DOCX document.
 * Iterates through document elements (paragraphs and tables) and converts them to text.
 * @param documentModel The parsed DocumentModel.
 * @param numberingModel The parsed NumberingModel (from numbering.xml), if available.
 * @param numberingStateService An instance of TxtNumberingStateService to manage list states.
 * @param options Configuration options for text generation.
 * @returns Plain text string representing the body content.
 */
function generateTxtBodyContent(
  documentModel: DocumentModel,
  numberingModel: DocxNumberingModel | undefined,
  numberingStateService: TxtNumberingStateService,
  options: GenerateTxtOptions
): string {
  const parts: string[] = [];

  if (documentModel.elements) {
    documentModel.elements.forEach(element => {
      let elementText = "";
      if (isParagraphModel(element)) {
        elementText = convertParagraphToTxt(
          element as ParagraphModel,
          numberingModel,
          numberingStateService,
          options
        );
      } else if (isTableModel(element)) {
        if (options.extractTables !== false) { // Default to true if undefined
          elementText = convertTableToTxt(
            element as TableModel,
            numberingModel,
            numberingStateService,
            options
          );
        }
      }
      parts.push(elementText);
    });
  }

  numberingStateService.notifyContextChange(null, null);
  return parts.join("\n");
}

/**
 * Generates a plain text string from a DocumentModel.
 * @param documentModel The parsed DocumentModel (from document.xml).
 * @param numberingModel The parsed NumberingModel (from numbering.xml), if available.
 * @param options Configuration options for text generation (e.g., applyIndentation, extractTables).
 * @returns A string representing the plain text content of the document.
 */
export function generateTxt(
  documentModel: DocumentModel,
  numberingModel: DocxNumberingModel | undefined,
  options: GenerateTxtOptions = { applyIndentation: true, extractTables: true } // Default options
): string {
  if (!documentModel) {
    console.error("DocumentModel is null or undefined. Cannot generate TXT.");
    return "";
  }

  const numberingStateService = new TxtNumberingStateService();
  // resetAllCounters is implicitly handled by new TxtNumberingStateService() constructor
  // as counters are initialized to {} and currentNumId/Ilvl to null/-1.

  const bodyContent = generateTxtBodyContent(
    documentModel,
    numberingModel,
    numberingStateService,
    options
  );

  return bodyContent;
}
