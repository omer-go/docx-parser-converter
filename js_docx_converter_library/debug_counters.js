import fs from 'fs/promises';
import { convertDocxToHtml } from './index.js';

async function debugCounters() {
  const docxFilePath = 'C:/Users/omerh/Desktop/Docx Test Files/Test Document.docx';
  
  try {
    const nodeBuffer = await fs.readFile(docxFilePath);
    const arrayBuffer = nodeBuffer.buffer.slice(nodeBuffer.byteOffset, nodeBuffer.byteOffset + nodeBuffer.byteLength);
    
    console.log('🔍 Debugging Hierarchical Counters...');
    
    // Add some debug logging to the HTML converter
    const originalConsoleLog = console.log;
    console.log = function(...args) {
      if (args[0] && args[0].includes && (args[0].includes('hierarchicalCounters') || args[0].includes('Counter'))) {
        originalConsoleLog.apply(console, args);
      }
    };
    
    const html = await convertDocxToHtml(arrayBuffer);
    
    // Restore console.log
    console.log = originalConsoleLog;
    
    console.log('✅ Debug completed');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugCounters(); 