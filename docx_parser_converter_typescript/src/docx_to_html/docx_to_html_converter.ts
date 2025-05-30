import { processDocx, ProcessedDocxData } from './docx_processor';
import { generateHtml } from './html_generator';

/**
 * Converts a DOCX file (as an ArrayBuffer) into an HTML string.
 * This is the main entry point for the DOCX to HTML conversion process.
 *
 * @param docxFileBuffer The ArrayBuffer content of the .docx file.
 * @returns A Promise that resolves to the generated HTML string.
 * @throws Error if the input buffer is invalid, or if critical parts of the DOCX (like document.xml) cannot be processed.
 */
export async function convertDocxToHtml(docxFileBuffer: ArrayBuffer): Promise<string> {
  if (!docxFileBuffer || docxFileBuffer.byteLength === 0) {
    console.error("Input DOCX file buffer is invalid or empty.");
    // Depending on desired behavior, either throw or return a specific error/empty HTML.
    // Throwing an error is often better for clearly indicating a problem.
    throw new Error("Invalid or empty DOCX file buffer provided.");
  }

  try {
    // 1. Process the DOCX file to get structured models
    // ProcessedDocxData contains: documentModel, stylesMap, numberingModel (optional), rawStylesModel
    const processedData: ProcessedDocxData = await processDocx(docxFileBuffer);

    // 2. Generate HTML from the structured models
    // generateHtml currently uses documentModel, numberingModel, and stylesMap.
    // rawStylesModel is available in processedData if needed for more advanced style features later.
    const htmlString = generateHtml(
      processedData.documentModel,
      processedData.numberingModel,
      processedData.stylesMap
    );

    return htmlString;
  } catch (error) {
    console.error("Error during DOCX to HTML conversion:", error);
    // Re-throw the error or return a specific error HTML string
    // For now, re-throwing to let the caller handle it.
    throw error;
  }
}
