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

  const files = fs.readdirSync(fixturesDir);

  for (const file of files) {
    if (path.extname(file) === '.docx') {
      const docxFilePath = path.join(fixturesDir, file);
      const baseName = path.basename(file, '.docx');

      try {
        console.log(`Processing ${file}...`);
        const docxBuffer = fs.readFileSync(docxFilePath);
        
        const docxFileMock = {
          name: file,
          arrayBuffer: async () => docxBuffer,
          // To make it more File-like for the converter, which expects a File object:
          // size: docxBuffer.length, // Example: add size property
          // type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // Example: add type
        };

        const htmlResult = await converter.convertToHtml(docxFileMock as any);
        if (htmlResult && typeof htmlResult.html === 'string') {
          const htmlFilePath = path.join(htmlOutputDir, `${baseName}.html`);
          fs.writeFileSync(htmlFilePath, htmlResult.html);
          console.log(`Converted ${file} to HTML: ${htmlFilePath}`);
        } else {
          console.error(`Failed to get HTML string for ${file}. Result:`, htmlResult);
        }

        const txtResult = await converter.convertToTxt(docxFileMock as any);
        if (txtResult && typeof txtResult.text === 'string') {
          const txtFilePath = path.join(txtOutputDir, `${baseName}.txt`);
          fs.writeFileSync(txtFilePath, txtResult.text);
          console.log(`Converted ${file} to TXT: ${txtFilePath}`);
        } else {
          console.error(`Failed to get TXT string for ${file}. Result:`, txtResult);
        }

      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    }
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('Script execution failed:', err);
    process.exit(1);
  });
} 