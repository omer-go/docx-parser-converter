import { convertDocxToHtml, convertDocxToText } from './index.js';
import fs from 'fs/promises';
import path from 'path';

async function testDocxConverter() {
  // CHANGE THIS PATH to point to your test DOCX file
  const docxFilePath = "C:/Users/omerh/Desktop/Docx Test Files/Test Document.docx";
  
  try {
    console.log('🔄 Reading DOCX file from:', docxFilePath);
    
    // Check if file exists
    try {
      await fs.access(docxFilePath);
    } catch (error) {
      console.error('❌ File not found:', docxFilePath);
      console.log('📝 Please update the docxFilePath variable in this script to point to your DOCX file');
      return;
    }
    
    // Read the DOCX file into an ArrayBuffer
    const nodeBuffer = await fs.readFile(docxFilePath);
    const arrayBuffer = nodeBuffer.buffer.slice(
      nodeBuffer.byteOffset,
      nodeBuffer.byteOffset + nodeBuffer.byteLength
    );
    
    console.log('✅ File loaded successfully, size:', nodeBuffer.length, 'bytes');
    console.log('');
    
    // Convert to HTML
    console.log('🔄 Converting to HTML...');
    const htmlOutput = await convertDocxToHtml(arrayBuffer);
    console.log('✅ HTML conversion completed');
    
    // Save HTML output
    const htmlOutputPath = path.join(process.cwd(), 'output.html');
    await fs.writeFile(htmlOutputPath, htmlOutput);
    console.log('💾 HTML saved to:', htmlOutputPath);
    console.log('');
    
    // Convert to Text with options
    console.log('🔄 Converting to plain text...');
    const textOutput = await convertDocxToText(arrayBuffer, {
      lineWidth: 80,           // Wrap lines at 80 characters
      paragraphBreak: "\n\n",  // Two newlines between paragraphs
      listItemIndent: "  "     // Two spaces for list indentation
    });
    console.log('✅ Text conversion completed');
    
    // Save text output
    const textOutputPath = path.join(process.cwd(), 'output.txt');
    await fs.writeFile(textOutputPath, textOutput);
    console.log('💾 Text saved to:', textOutputPath);
    console.log('');
    
    // Display preview of outputs
    console.log('📄 HTML Preview (first 500 characters):');
    console.log('─'.repeat(50));
    console.log(htmlOutput.substring(0, 500) + (htmlOutput.length > 500 ? '...' : ''));
    console.log('─'.repeat(50));
    console.log('');
    
    console.log('📄 Text Preview (first 500 characters):');
    console.log('─'.repeat(50));
    console.log(textOutput.substring(0, 500) + (textOutput.length > 500 ? '...' : ''));
    console.log('─'.repeat(50));
    console.log('');
    
    console.log('🎉 Conversion completed successfully!');
    console.log('📁 Output files created:');
    console.log('   - HTML:', htmlOutputPath);
    console.log('   - Text:', textOutputPath);
    
  } catch (error) {
    console.error('❌ Error during conversion:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testDocxConverter(); 