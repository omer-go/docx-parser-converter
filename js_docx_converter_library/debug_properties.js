#!/usr/bin/env node

import { DocumentParser } from './src/parsers/document_parser.js';
import { StylesParser } from './src/parsers/styles_parser.js';
import { NumberingParser } from './src/parsers/numbering_parser.js';
import { StyleEnhancer } from './src/enhancers/style_enhancer.js';
import fs from 'fs';

async function debugProperties() {
    try {
        const docxPath = "C:/Users/omerh/Desktop/Docx Test Files/Test Document.docx";
        
        console.log("🔍 Debugging properties parsing...");
        console.log(`📁 Reading file: ${docxPath}`);
        
        // Read and parse the DOCX file
        const docxBuffer = fs.readFileSync(docxPath);
        console.log(`✅ File read successfully, size: ${docxBuffer.length} bytes`);
        
        console.log("🔄 Parsing document...");
        const documentParser = new DocumentParser(docxBuffer);
        const stylesParser = new StylesParser(docxBuffer);
        const numberingParser = new NumberingParser(docxBuffer);

        // Concurrently load all necessary XML parts and parse their schemas
        const [initialDocumentSchema, stylesSchema, numberingDefinitions] = await Promise.all([
          documentParser.parse(), // Main document content
          stylesParser.getStylesSchema(),
          numberingParser.getNumberingDefinitions(),
        ]);
        console.log("✅ Parsing completed");

        console.log("🔄 Enhancing with styles...");
        const styleEnhancer = new StyleEnhancer(stylesSchema, numberingDefinitions);
        const enhancedDocument = styleEnhancer.enhanceDocument(initialDocumentSchema);
        console.log("✅ Style enhancement completed");
        
        console.log(`\n📄 Document has ${enhancedDocument.elements.length} elements`);
        
        // Look for specific content
        for (let i = 0; i < enhancedDocument.elements.length; i++) {
            const element = enhancedDocument.elements[i];
            
            if (element.type === 'paragraph') {
                // Check each run for specific text
                for (let runIndex = 0; runIndex < element.runs.length; runIndex++) {
                    const run = element.runs[runIndex];
                    
                    // Look for title
                    if (run.text && run.text.includes('Document Title Style')) {
                        console.log(`\n🎯 TITLE FOUND at Paragraph ${i}, Run ${runIndex}:`);
                        console.log(`   Text: "${run.text}"`);
                        console.log(`   Properties:`, JSON.stringify(run.properties, null, 2));
                        console.log(`   Paragraph properties:`, JSON.stringify(element.properties, null, 2));
                    }
                    
                    // Look for "BOLD CONTENT"
                    if (run.text && run.text.includes('BOLD CONTENT')) {
                        console.log(`\n🎯 BOLD CONTENT FOUND at Paragraph ${i}, Run ${runIndex}:`);
                        console.log(`   Text: "${run.text}"`);
                        console.log(`   Properties:`, JSON.stringify(run.properties, null, 2));
                    }
                    
                    // Look for the word "bold"
                    if (run.text && run.text.trim() === 'bold') {
                        console.log(`\n🎯 WORD "bold" FOUND at Paragraph ${i}, Run ${runIndex}:`);
                        console.log(`   Text: "${run.text}"`);
                        console.log(`   Properties:`, JSON.stringify(run.properties, null, 2));
                    }
                }
            } else if (element.type === 'table') {
                // Search through table content
                for (let rowIndex = 0; rowIndex < element.rows.length; rowIndex++) {
                    const row = element.rows[rowIndex];
                    
                    for (let cellIndex = 0; cellIndex < row.cells.length; cellIndex++) {
                        const cell = row.cells[cellIndex];
                        
                        for (let cellElementIndex = 0; cellElementIndex < cell.elements.length; cellElementIndex++) {
                            const cellElement = cell.elements[cellElementIndex];
                            
                            if (cellElement.type === 'paragraph') {
                                for (let runIndex = 0; runIndex < cellElement.runs.length; runIndex++) {
                                    const run = cellElement.runs[runIndex];
                                    
                                    if (run.text && run.text.includes('BOLD CONTENT')) {
                                        console.log(`\n🎯 BOLD CONTENT FOUND in Table ${i}, Row ${rowIndex}, Cell ${cellIndex}:`);
                                        console.log(`   Text: "${run.text}"`);
                                        console.log(`   Properties:`, JSON.stringify(run.properties, null, 2));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    debugProperties().catch(console.error);
} 