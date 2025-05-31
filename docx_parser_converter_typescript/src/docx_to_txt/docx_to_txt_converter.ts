import { processDocx, ProcessedDocxData, RawXmlStrings } from '../docx_to_html/docx_processor'; // Using the shared processor
import { generateTxt, GenerateTxtOptions } from './txt_generator';

/**
 * Options for DOCX to TXT conversion, extending basic TXT generation options.
 */
export interface ConvertDocxToTxtOptions extends GenerateTxtOptions {
  // Currently, this interface inherits all options from GenerateTxtOptions.
  // It can be expanded with options specific to the overall docx-to-txt conversion process
  // that are not just about the final text generation step.
}

/**
 * Converts a DOCX file (as an ArrayBuffer or RawXmlStrings object) into a plain text string.
 * This is the main entry point for the DOCX to TXT conversion process.
 *
 * @param source The ArrayBuffer content of the .docx file or an object (`RawXmlStrings`) containing raw XML strings.
 * @param options Configuration options for the TXT conversion (e.g., applyIndentation, extractTables).
 * @returns A Promise that resolves to the generated plain text string.
 * @throws Error if the input source is invalid, or if critical parts of the DOCX (like document.xml) cannot be processed.
 */
export async function convertDocxToTxt(
  source: ArrayBuffer | RawXmlStrings,
  options: ConvertDocxToTxtOptions = { applyIndentation: true, extractTables: true }
): Promise<string> {
  if (!source) {
    throw new Error("Invalid source provided: source cannot be null or undefined.");
  }
  if (source instanceof ArrayBuffer && source.byteLength === 0) {
    throw new Error("Invalid ArrayBuffer provided: buffer is empty.");
  }
  if (!(source instanceof ArrayBuffer) && !(source instanceof Uint8Array) && !source.documentXml) {
    // Check if it's RawXmlStrings-like and if documentXml is missing
    throw new Error("Invalid RawXmlStrings provided: documentXml is missing.");
  }


  try {
    // 1. Process the DOCX source to get structured models
    // ProcessedDocxData contains: documentModel, stylesMap, numberingModel (optional), rawStylesModel
    const processedData: ProcessedDocxData = await processDocx(source);

    // 2. Generate TXT from the structured models
    // generateTxt primarily uses documentModel and numberingModel.
    // stylesMap and rawStylesModel are not directly used by generateTxt but are available from processedData.
    const txtString = generateTxt(
      processedData.documentModel,
      processedData.numberingModel,
      options // Pass along the conversion options
    );

    return txtString;
  } catch (error) {
    console.error("Error during DOCX to TXT conversion:", error);
    // Re-throw the error or return a specific error string/handle as appropriate
    // For now, re-throwing to let the caller handle it.
    throw error;
  }
}
