import {
  DocumentModel,
  ParagraphModel,
  TableModel,
  NumberingModel as DocxNumberingModel,
  StyleModel,
  // DocMarginsModel, // Type inferred
} from '../../../docx_parsers/models/index';
import { convertParagraphToHtml } from './converters/paragraph_converter';
import { convertTableToHtml } from './converters/table_converter';
import { convertDocMarginsToCss, aggregateCss } from './converters/style_converter';
import { NumberingStateService, closeAnyOpenLists } from './converters/numbering_converter';

/**
 * Generates the HTML content for the body of the DOCX document.
 * Iterates through document elements (paragraphs and tables) and converts them to HTML.
 * @param documentModel The parsed DocumentModel.
 * @param numberingModel The parsed NumberingModel (from numbering.xml), if available.
 * @param stylesMap A map of resolved StyleModels.
 * @param numberingStateService An instance of NumberingStateService to manage list states.
 * @returns HTML string representing the body content.
 */
function generateHtmlBodyContent(
  documentModel: DocumentModel,
  numberingModel: DocxNumberingModel | undefined,
  stylesMap: Map<string, StyleModel>, // stylesMap is not used in current implementation but might be needed for style resolution if not pre-resolved
  numberingStateService: NumberingStateService
): string {
  let bodyContentHtml = "";

  if (documentModel.elements) {
    for (const element of documentModel.elements) {
      if ('runs' in element) { // Type guard for ParagraphModel
        bodyContentHtml += convertParagraphToHtml(
          element as ParagraphModel,
          numberingModel,
          numberingStateService
        );
      } else if ('rows' in element) { // Type guard for TableModel
        bodyContentHtml += convertTableToHtml(
          element as TableModel,
          numberingModel,
          numberingStateService,
          stylesMap // Pass stylesMap down, might be used by nested table conversions if they apply styles
        );
      }
    }
  }

  // After processing all elements, close any lists that are still open.
  bodyContentHtml += closeAnyOpenLists(numberingStateService);
  return bodyContentHtml;
}

/**
 * Generates a full HTML document string from a DocumentModel.
 * @param documentModel The parsed DocumentModel (from document.xml).
 * @param numberingModel The parsed NumberingModel (from numbering.xml), if available.
 * @param stylesMap A map of resolved StyleModels (key: styleId, value: StyleModel).
 * @returns A string representing the full HTML document.
 */
export function generateHtml(
  documentModel: DocumentModel,
  numberingModel: DocxNumberingModel | undefined,
  stylesMap: Map<string, StyleModel> // stylesMap passed for potential future use in converters
): string {
  if (!documentModel) {
    console.error("DocumentModel is null or undefined. Cannot generate HTML.");
    return "";
  }

  const numberingStateService = new NumberingStateService();
  // resetAllCounters is called by constructor implicitly if counters is initialized to {}
  // but explicit call is fine if constructor doesn't do it or for clarity/reset.
  // For now, assuming constructor initializes it sufficiently.

  // Document Margins for the body/page container
  const docMarginsCss = documentModel.docMargins
    ? convertDocMarginsToCss(documentModel.docMargins)
    : "";

  // Basic body styles
  const bodyStyles = aggregateCss(docMarginsCss, 'word-wrap:break-word;');

  // Generate main content
  const bodyContent = generateHtmlBodyContent(
    documentModel,
    numberingModel,
    stylesMap,
    numberingStateService
  );

  // Assemble the full HTML document
  // Using template literals for readability.
  // Ensure proper newlines and indentation if "pretty-printed" byte-for-byte matching is critical.
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Document</title>
    <style>
        /* Basic global styles for elements if not overridden by inline styles */
        /* Example: body { font-family: sans-serif; } */
        /* table { border-collapse: collapse; margin-bottom: 1em; } */
        /* td, th { border: 1px solid #ccc; padding: 0.25em; vertical-align: top; } */
        /* p { margin: 0 0 1em 0; } */
        /* li { margin-bottom: 0.5em; } */
        /* .list-item-marker { display: inline-block; padding-right: 0.5em; } */ /* Basic marker styling */
    </style>
</head>
<body${bodyStyles ? ' style="' + bodyStyles.trim() + '"' : ''}>
    <div class="docx-document-render">
        ${bodyContent.trim()}
    </div>
</body>
</html>
`;

  return fullHtml;
}
