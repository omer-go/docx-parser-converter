#!/usr/bin/env node

import { convertDocxToHtml } from './index.js';
import fs from 'fs';

async function debugFontSizes() {
    try {
        const docxPath = "C:/Users/omerh/Desktop/Docx Test Files/Test Document.docx";
        console.log("🔍 Debugging font sizes...");
        
        // Read the DOCX file
        const docxBuffer = fs.readFileSync(docxPath);
        console.log(`✅ File read successfully, size: ${docxBuffer.length} bytes`);
        
        // Convert to HTML
        const html = await convertDocxToHtml(docxBuffer);
        
        // Extract font sizes from the HTML
        const fontSizeRegex = /font-size:(\d+\.?\d*)pt/g;
        const fontSizes = [];
        let match;
        
        while ((match = fontSizeRegex.exec(html)) !== null) {
            fontSizes.push(parseFloat(match[1]));
        }
        
        // Get unique font sizes
        const uniqueFontSizes = [...new Set(fontSizes)].sort((a, b) => b - a);
        
        console.log(`\n📊 Font sizes found in HTML output:`);
        uniqueFontSizes.forEach(size => {
            const count = fontSizes.filter(s => s === size).length;
            console.log(`   ${size}pt (used ${count} times)`);
        });
        
        // Check for title specifically
        const titleMatch = html.match(/<span[^>]*>Document Title Style<\/span>/);
        if (titleMatch) {
            console.log(`\n🎯 Title element found:`);
            console.log(`   ${titleMatch[0]}`);
            
            const titleFontSize = titleMatch[0].match(/font-size:(\d+\.?\d*)pt/);
            if (titleFontSize) {
                console.log(`   Title font size: ${titleFontSize[1]}pt`);
                if (titleFontSize[1] !== '28.0') {
                    console.log(`   ❌ Expected: 28.0pt, Got: ${titleFontSize[1]}pt`);
                } else {
                    console.log(`   ✅ Correct font size!`);
                }
            }
        }
        
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    debugFontSizes().catch(console.error);
} 