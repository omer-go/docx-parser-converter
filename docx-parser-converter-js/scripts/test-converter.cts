const fs = require('fs');
const path = require('path');

// const { DocxParserConverter } = require('../src/index'); // Old require

const fixturesDir = path.join(__dirname, '../test/fixtures');
const outputDir = path.join(__dirname, '../test-outputs');
const htmlOutputDir = path.join(outputDir, 'html');
const txtOutputDir = path.join(outputDir, 'txt');

async function main() {
  console.log('Running test-converter.cts script against built output...');

  // Dynamically import the ESM module from the dist folder
  const { DocxParserConverter } = await import('../dist/index.es.js');

  // Create output directories if they don't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  if (!fs.existsSync(htmlOutputDir)) {
    fs.mkdirSync(htmlOutputDir);
  }
  if (!fs.existsSync(txtOutputDir)) {
    fs.mkdirSync(txtOutputDir);
  }

  // Instantiate the converter, explicitly enabling web workers for testing this path
  const converter = DocxParserConverter.getInstance({ useWebWorkers: true });
  // Initialize must be called to set up workers if useWebWorkers is true
  try {
    await converter.initialize(); 
    console.log('DocxParserConverter initialized for worker path.');
  } catch (initError) {
    console.error('Failed to initialize DocxParserConverter for worker path:', initError);
    // Optionally, decide if you want to exit or fall back
    // For this test, let's proceed and see if conversions fail gracefully
  }

  // Process only the Test Document.docx file for focused debugging
  const targetFile = 'Test Document.docx';
  const docxFilePath = path.join(fixturesDir, targetFile);
  
  if (!fs.existsSync(docxFilePath)) {
    console.error(`Target file not found: ${docxFilePath}`);
    return;
  }

  const baseName = path.basename(targetFile, '.docx');

  try {
    console.log(`Processing ${targetFile}...`);
    const docxBuffer = fs.readFileSync(docxFilePath);
    
    const docxFileMock = {
      name: targetFile,
      arrayBuffer: async () => docxBuffer,
      // To make it more File-like for the converter, which expects a File object:
      // size: docxBuffer.length, // Example: add size property
      // type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // Example: add type
    };

    console.log('\n=== Starting HTML conversion ===\n');
    const htmlResult = await converter.convertToHtml(docxFileMock as any);
    if (htmlResult && typeof htmlResult.html === 'string') {
      const htmlFilePath = path.join(htmlOutputDir, `${baseName}.html`);
      fs.writeFileSync(htmlFilePath, htmlResult.html);
      console.log(`\nConverted ${targetFile} to HTML: ${htmlFilePath}`);
    } else {
      console.error(`Failed to get HTML string for ${targetFile}. Result:`, htmlResult);
    }

    console.log('\n=== Starting TXT conversion ===\n');
    const txtResult = await converter.convertToTxt(docxFileMock as any);
    if (txtResult && typeof txtResult.text === 'string') {
      const txtFilePath = path.join(txtOutputDir, `${baseName}.txt`);
      fs.writeFileSync(txtFilePath, txtResult.text);
      console.log(`\nConverted ${targetFile} to TXT: ${txtFilePath}`);
    } else {
      console.error(`Failed to get TXT string for ${targetFile}. Result:`, txtResult);
    }

  } catch (error) {
    console.error(`Error processing file ${targetFile}:`, error);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('Script execution failed:', err);
    process.exit(1);
  });
} 