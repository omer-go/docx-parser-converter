/**
 * Main entry point for the DOCX Parser Converter TypeScript library.
 *
 * Exports the primary conversion functions and their associated option types.
 */

// HTML Conversion
export {
    convertDocxToHtml
} from './docx_to_html/docx_to_html_converter';
// export type { ConvertDocxToHtmlOptions } from './docx_to_html/docx_to_html_converter'; // convertDocxToHtml currently doesn't take an options object

// TXT Conversion
export {
    convertDocxToTxt
} from './docx_to_txt/docx_to_txt_converter';
export type {
    ConvertDocxToTxtOptions
} from './docx_to_txt/docx_to_txt_converter';


// Shared types / interfaces for input
export type {
    RawXmlStrings
} from './docx_to_html/docx_processor'; // For providing raw XML input

// Core models (for users who might want to inspect or use the parsed structures)
export type {
    DocumentModel,
    StylesModel,
    NumberingModel as DocxNumberingModel, // Alias for clarity
    ParagraphModel,
    RunModel,
    TextContentModel,
    TabContentModel,
    RunContentModel,
    TableModel,
    TableRowModel,
    TableCellModel,
    // Add other specific models if they are key parts of the public data structure
} from './docx_parsers/models/index';

// Main processing function and its output type (for advanced use)
export { processDocx } from './docx_to_html/docx_processor';
export type { ProcessedDocxData } from './docx_to_html/docx_processor';


// console.log("DOCX Parser/Converter Library Loaded"); // Optional: for basic confirmation
