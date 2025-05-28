import fs from 'fs/promises';
import { DocumentParser } from './src/parsers/document_parser.js';
import { StylesParser } from './src/parsers/styles_parser.js';
import { NumberingParser } from './src/parsers/numbering_parser.js';
import { StyleEnhancer } from './src/enhancers/style_enhancer.js';

async function debugNumbering() {
  const docxFilePath = 'C:/Users/omerh/Desktop/Docx Test Files/Test Document.docx';
  
  try {
    const nodeBuffer = await fs.readFile(docxFilePath);
    const arrayBuffer = nodeBuffer.buffer.slice(nodeBuffer.byteOffset, nodeBuffer.byteOffset + nodeBuffer.byteLength);
    
    console.log('🔍 Debugging Numbering Parser...');
    
    const documentParser = new DocumentParser(arrayBuffer);
    const stylesParser = new StylesParser(arrayBuffer);
    const numberingParser = new NumberingParser(arrayBuffer);

    const [initialDocumentSchema, stylesSchema, numberingDefinitions] = await Promise.all([
      documentParser.parse(),
      stylesParser.getStylesSchema(),
      numberingParser.getNumberingDefinitions(),
    ]);
    
    console.log('\n📊 Numbering Definitions Summary:');
    console.log('Abstract Nums:', numberingDefinitions.abstractNums.length);
    console.log('Num Instances:', numberingDefinitions.numInstances.length);
    
    console.log('\n📋 Abstract Numbering Definitions:');
    numberingDefinitions.abstractNums.forEach((abstractNum, index) => {
      console.log(`  [${index}] Abstract ID: ${abstractNum.abstractNumId}`);
      console.log(`      Name: ${abstractNum.name || 'N/A'}`);
      console.log(`      Levels: ${abstractNum.levels.length}`);
      abstractNum.levels.forEach(level => {
        console.log(`        Level ${level.level}: format=${level.format}, text="${level.text}"`);
      });
    });
    
    console.log('\n🔢 Numbering Instances:');
    numberingDefinitions.numInstances.forEach((instance, index) => {
      console.log(`  [${index}] Num ID: ${instance.numId} -> Abstract ID: ${instance.abstractNumId}`);
    });
    
    // Check the enhanced document
    console.log('\n🔧 Checking Enhanced Document...');
    const styleEnhancer = new StyleEnhancer(stylesSchema, numberingDefinitions);
    const enhancedDocument = styleEnhancer.enhanceDocument(initialDocumentSchema);
    
    console.log('Enhanced document has numberingDefinitions?', !!enhancedDocument.numberingDefinitions);
    if (enhancedDocument.numberingDefinitions) {
      console.log('Enhanced numInstances:', enhancedDocument.numberingDefinitions.numInstances.length);
      enhancedDocument.numberingDefinitions.numInstances.forEach((instance, index) => {
        console.log(`  [${index}] Enhanced Num ID: ${instance.numId} -> Abstract ID: ${instance.abstractNumId}`);
      });
    }
    
    // Check what paragraphs have numbering
    console.log('\n📄 Checking Document Paragraphs with Numbering...');
    let numberingParagraphs = 0;
    enhancedDocument.elements.forEach((element, index) => {
      if (element.type === 'paragraph' && element.properties?.numPr) {
        numberingParagraphs++;
        console.log(`  Paragraph ${index}: numId=${element.properties.numPr.numId}, ilvl=${element.properties.numPr.ilvl}`);
      }
    });
    
    console.log(`\n📈 Total paragraphs with numbering: ${numberingParagraphs}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugNumbering(); 