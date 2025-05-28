#!/usr/bin/env node

import { StylesParser } from './src/parsers/styles_parser.js';
import fs from 'fs';

async function debugStyles() {
    try {
        const docxPath = "C:/Users/omerh/Desktop/Docx Test Files/Test Document.docx";
        
        console.log("🔍 Debugging styles schema...");
        console.log(`📁 Reading file: ${docxPath}`);
        
        // Read and parse the DOCX file
        const docxBuffer = fs.readFileSync(docxPath);
        console.log(`✅ File read successfully, size: ${docxBuffer.length} bytes`);
        
        console.log("🔄 Parsing styles...");
        const stylesParser = new StylesParser(docxBuffer);
        const stylesSchema = await stylesParser.getStylesSchema();
        console.log("✅ Styles parsing completed");
        
        console.log(`\n📊 Styles Schema Summary:`);
        console.log(`   Document defaults:`, JSON.stringify(stylesSchema.docDefaults, null, 2));
        console.log(`   Style type defaults:`, JSON.stringify(stylesSchema.styleTypeDefaults, null, 2));
        console.log(`   Number of styles: ${Object.keys(stylesSchema.styles).length}`);
        
        console.log(`\n📋 All Styles:`);
        for (const [styleId, style] of Object.entries(stylesSchema.styles)) {
            console.log(`   Style ID: "${styleId}"`);
            console.log(`     Name: "${style.name}"`);
            console.log(`     Type: "${style.type}"`);
            console.log(`     Default: ${style.default}`);
            if (style.runProperties) {
                console.log(`     Run Properties:`, JSON.stringify(style.runProperties, null, 2));
            }
            if (style.paragraphProperties) {
                console.log(`     Paragraph Properties:`, JSON.stringify(style.paragraphProperties, null, 2));
            }
            console.log('');
        }
        
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    debugStyles().catch(console.error);
} 