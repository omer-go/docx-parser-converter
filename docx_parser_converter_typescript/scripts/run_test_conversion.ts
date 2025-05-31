import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url'; // To get __dirname in ES modules

// Adjust import path based on actual structure.
// If 'dist' is the output for compiled JS and scripts are run from root:
// import { processDocx, convertDocxToHtml, convertDocxToTxt, RawXmlStrings } from '../dist/src/index.js';
// If running directly from 'src' using ts-node:
import {
    processDocx,
    convertDocxToHtml,
    convertDocxToTxt,
    RawXmlStrings,
    // Import model types if strong typing is desired for stringify, though not strictly necessary
    // DocumentModel, StylesModel, DocxNumberingModel
} from '../src/index.js'; // Assuming .js extension if type:module and compiled output

// --- Define __dirname for ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Define File Paths ---
// Relative paths from this script file in 'scripts' directory
const baseDir = path.resolve(__dirname, '..'); // Root of 'docx_parser_converter_typescript'

// Path to the test DOCX file, assuming 'docx_parser_converter_docs' is a sibling to the package root
const projectRootForDocs = path.resolve(baseDir, '..'); // Go one level up from package root
const testDocxPath = path.resolve(projectRootForDocs, 'docx_parser_converter_docs/test_files/Test Document.docx');
const logsDir = path.resolve(projectRootForDocs, 'docx_parser_converter_docs/logs');
const outputDir = path.resolve(projectRootForDocs, 'docx_parser_converter_docs/test_files');


async function runTest() {
  console.log('Starting test conversion process...');

  // Ensure output directories exist
  try {
    await fs.mkdir(logsDir, { recursive: true });
    console.log(`Ensured logs directory exists: ${logsDir}`);
    await fs.mkdir(outputDir, { recursive: true });
    console.log(`Ensured output directory exists: ${outputDir}`);
  } catch (error) {
    console.error('Error creating directories:', error);
    throw error; // Stop if we can't create dirs
  }

  // Read DOCX file
  console.log(`Reading DOCX file from: ${testDocxPath}`);
  let docxBuffer: Buffer;
  try {
    docxBuffer = await fs.readFile(testDocxPath);
  } catch (error) {
    console.error(`Failed to read DOCX file: ${testDocxPath}`, error);
    throw error;
  }
  console.log('DOCX file read successfully.');

  // Process DOCX with raw XML logging enabled
  console.log('Processing DOCX file (with raw XML logging)...');
  const processedData = await processDocx(docxBuffer.buffer as ArrayBuffer, { debugReturnRawXml: true });
  console.log('DOCX processing complete.');

  // Save Raw XML Logs
  if (processedData.rawXml) {
    console.log('Saving raw XML logs...');
    if (processedData.rawXml.documentXml) {
      await fs.writeFile(path.join(logsDir, 'document.xml'), processedData.rawXml.documentXml);
      console.log('Saved document.xml log.');
    }
    if (processedData.rawXml.stylesXml) {
      await fs.writeFile(path.join(logsDir, 'styles.xml'), processedData.rawXml.stylesXml);
      console.log('Saved styles.xml log.');
    }
    if (processedData.rawXml.numberingXml) {
      await fs.writeFile(path.join(logsDir, 'numbering.xml'), processedData.rawXml.numberingXml);
      console.log('Saved numbering.xml log.');
    }
  } else {
    console.log('No raw XML data returned for logging.');
  }

  // Save Parsed Model Logs (as JSON)
  console.log('Saving parsed model logs (JSON)...');
  try {
    await fs.writeFile(path.join(logsDir, 'parsed_document_model.json'), JSON.stringify(processedData.documentModel, null, 2));
    console.log('Saved parsed_document_model.json log.');

    await fs.writeFile(path.join(logsDir, 'parsed_styles_model.json'), JSON.stringify(processedData.rawStylesModel, null, 2));
    console.log('Saved parsed_styles_model.json log.');

    if (processedData.numberingModel) {
      await fs.writeFile(path.join(logsDir, 'parsed_numbering_model.json'), JSON.stringify(processedData.numberingModel, null, 2));
      console.log('Saved parsed_numbering_model.json log.');
    } else {
      console.log('No numbering model to save.');
    }
     await fs.writeFile(path.join(logsDir, 'resolved_styles_map.json'), JSON.stringify(Object.fromEntries(processedData.stylesMap), null, 2));
    console.log('Saved resolved_styles_map.json log.');

  } catch (error) {
      console.error('Error saving JSON model logs:', error);
      // Continue even if JSON logging fails for some models
  }


  // Generate and Save HTML Output
  // Note: convertDocxToHtml internally calls processDocx.
  // For efficiency, if processDocx result could be directly used by a generateHtml variant, it would be better.
  // However, the current public API is convertDocxToHtml(buffer).
  console.log('Generating HTML output...');
  const htmlOutput = await convertDocxToHtml(docxBuffer.buffer as ArrayBuffer);
  const htmlOutputPath = path.join(outputDir, 'Test Document.html');
  await fs.writeFile(htmlOutputPath, htmlOutput);
  console.log(`HTML output saved to: ${htmlOutputPath}`);

  // Generate and Save TXT Output
  console.log('Generating TXT output...');
  const txtOutput = await convertDocxToTxt(docxBuffer.buffer as ArrayBuffer, { applyIndentation: true, extractTables: true });
  const txtOutputPath = path.join(outputDir, 'Test Document.txt');
  await fs.writeFile(txtOutputPath, txtOutput);
  console.log(`TXT output saved to: ${txtOutputPath}`);
}

runTest()
  .then(() => console.log('\nTest conversion and logging complete.'))
  .catch(error => {
    console.error('\nError during test conversion run:', error);
    process.exit(1); // Exit with error code
  });
