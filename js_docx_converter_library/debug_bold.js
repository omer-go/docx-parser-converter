#!/usr/bin/env node

import { DocumentParser } from './src/parsers/document_parser.js';
import { StylesParser } from './src/parsers/styles_parser.js';
import { NumberingParser } from './src/parsers/numbering_parser.js';
import { StyleEnhancer } from './src/enhancers/style_enhancer.js';
import fs from 'fs';

async function debugBoldContent() {
    try {
        const docxPath = "C:/Users/omerh/Desktop/Docx Test Files/Test Document.docx";
        
        console.log("🔍 Debugging BOLD CONTENT styling...");
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
        
        let foundBoldContent = false;
        let boldTexts = [];
        let totalRuns = 0;
        
        // Search through all elements
        for (let i = 0; i < enhancedDocument.elements.length; i++) {
            const element = enhancedDocument.elements[i];
            console.log(`🔍 Processing element ${i}: ${element.type}`);
            
            if (element.type === 'paragraph') {
                // Search paragraph runs
                for (let runIndex = 0; runIndex < element.runs.length; runIndex++) {
                    const run = element.runs[runIndex];
                    totalRuns++;
                    
                    // Check for bold property
                    if (run.properties?.b === true) {
                        boldTexts.push({
                            location: `Paragraph ${i}, Run ${runIndex}`,
                            text: run.text,
                            properties: run.properties
                        });
                    }
                    
                    // Check for "BOLD" text specifically
                    if (run.text && (run.text.includes('BOLD') || run.text.includes('bold'))) {
                        console.log(`\n🎯 Found text containing "BOLD" at Paragraph ${i}, Run ${runIndex}:`);
                        console.log(`   Text: "${run.text}"`);
                        console.log(`   Bold property: ${run.properties?.b}`);
                        console.log(`   Properties:`, JSON.stringify(run.properties, null, 2));
                        foundBoldContent = true;
                    }
                }
            } else if (element.type === 'table') {
                console.log(`\n🔍 Found table at element ${i} with ${element.rows.length} rows`);
                
                // Search through table rows and cells
                for (let rowIndex = 0; rowIndex < element.rows.length; rowIndex++) {
                    const row = element.rows[rowIndex];
                    
                    for (let cellIndex = 0; cellIndex < row.cells.length; cellIndex++) {
                        const cell = row.cells[cellIndex];
                        
                        // Search through cell elements (paragraphs)
                        for (let cellElementIndex = 0; cellElementIndex < cell.elements.length; cellElementIndex++) {
                            const cellElement = cell.elements[cellElementIndex];
                            
                            if (cellElement.type === 'paragraph') {
                                // Search through runs in the paragraph
                                for (let runIndex = 0; runIndex < cellElement.runs.length; runIndex++) {
                                    const run = cellElement.runs[runIndex];
                                    totalRuns++;
                                    
                                    // Check for bold property
                                    if (run.properties?.b === true) {
                                        boldTexts.push({
                                            location: `Table ${i}, Row ${rowIndex}, Cell ${cellIndex}, Paragraph ${cellElementIndex}, Run ${runIndex}`,
                                            text: run.text,
                                            properties: run.properties
                                        });
                                    }
                                    
                                    // Check for "BOLD" text specifically
                                    if (run.text && (run.text.includes('BOLD') || run.text.includes('bold'))) {
                                        console.log(`\n🎯 Found text containing "BOLD" at:`);
                                        console.log(`   Table ${i}, Row ${rowIndex}, Cell ${cellIndex}, Paragraph ${cellElementIndex}, Run ${runIndex}`);
                                        console.log(`   Text: "${run.text}"`);
                                        console.log(`   Bold property: ${run.properties?.b}`);
                                        console.log(`   Properties:`, JSON.stringify(run.properties, null, 2));
                                        foundBoldContent = true;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        console.log(`\n📊 Summary:`);
        console.log(`   Total runs processed: ${totalRuns}`);
        console.log(`   Found ${boldTexts.length} runs with bold=true`);
        console.log(`   Found BOLD text: ${foundBoldContent}`);
        
        if (boldTexts.length > 0) {
            console.log(`\n✅ All bold texts found:`);
            boldTexts.forEach((item, index) => {
                console.log(`   ${index + 1}. ${item.location}: "${item.text}"`);
            });
        }
        
        if (!foundBoldContent) {
            console.log("\n❌ Could not find any text containing 'BOLD' in the document");
        }
        
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    debugBoldContent().catch(console.error);
} 