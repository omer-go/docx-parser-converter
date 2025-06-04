import type { Paragraph } from '../../docx_parsers/models/paragraphModels';
import type { NumberingSchema, NumberingLevel } from '../../docx_parsers/models/numberingModels';
// NOTE: FontProperties and IndentationProperties are used by NumberingLevel via stylesModels,
// so they are indirectly imported/available on the NumberingLevel type.

/*
TODO:
Add style application of the numbering itself 

(requires updating the DocumentParser and the ParagraphStyleProperties to add
another property of RunStyleProperties, in addition to the RunStyleProperties
that the Run model has)
*/

export class NumberingConverter {
    private static numberingCounters: Record<number, number[]> = {};

    public static resetCounters(): void {
        NumberingConverter.numberingCounters = {};
    }

    public static convertNumbering(paragraph: Paragraph, numberingSchema: NumberingSchema): string {
        const numbering = paragraph.numbering;

        if (!numbering) {
            // This behavior mimics the Python script's broad try-except block
            // which would catch an AttributeError if numbering was None and return "•".
            return "•";
        }

        let numberingLevel: NumberingLevel;
        try {
            numberingLevel = NumberingConverter.getNumberingLevel(numberingSchema, numbering.numId, numbering.ilvl);
        } catch (e: any) {
            console.warn(`Warning: ${e.message || e}`);
            return "•"; // Default bullet as in Python
        }

        if (!NumberingConverter.numberingCounters[numbering.numId]) {
            NumberingConverter.numberingCounters[numbering.numId] = new Array(9).fill(0); // Supports up to 9 levels
        }
        
        NumberingConverter.numberingCounters[numbering.numId][numbering.ilvl]++;
        
        // Reset counters for deeper levels if a higher level is incremented
        for (let i = numbering.ilvl + 1; i < 9; i++) {
            if (NumberingConverter.numberingCounters[numbering.numId]) { // Ensure array exists
                 NumberingConverter.numberingCounters[numbering.numId][i] = 0;
            }
        }

        const currentCounters = NumberingConverter.numberingCounters[numbering.numId].slice(0, numbering.ilvl + 1);
        
        const formattedCounters: string[] = [];
        for (let i = 0; i <= numbering.ilvl; i++) {
            // This replicates the Python logic where the numFmt of the *current* level
            // is used to format all placeholders (%1, %2, etc.)
            formattedCounters.push(NumberingConverter.formatNumber(currentCounters[i], numberingLevel.numFmt));
        }
        
        let lvlText = numberingLevel.lvlText;
        for (let i = 1; i <= numbering.ilvl + 1; i++) {
            const placeholder = `%${i}`;
            // formattedCounters is 0-indexed, placeholders %N are 1-indexed (N corresponds to i here)
            if (formattedCounters[i - 1] !== undefined) {
                 lvlText = lvlText.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&'), 'g'), formattedCounters[i - 1]);
            }
        }
        
        const indentLeftPt = numberingLevel.indent?.leftPt ?? 0;
        // Assuming IndentationProperties has 'firstLinePt' based on Python's 'firstline_pt'
        const firstlineIndentPt = numberingLevel.indent?.firstLinePt ?? 0; 

        const getCharWidth = (char: string): number => {
            if (/\d/.test(char) || /[a-zA-Z]/.test(char)) { // isdigit or isalpha
                return 7.2;
            } else if (['.', '(', ')'].includes(char)) {
                return 3.6;
            }
            return 7.2; // Default width for other characters
        };

        const numberingTextLengthPt = lvlText.split('').reduce((sum, char) => sum + getCharWidth(char), 0);

        if (numberingLevel.tabPt !== undefined && numberingLevel.tabPt !== null) {
            const netPadding = numberingLevel.tabPt - (indentLeftPt + firstlineIndentPt) - numberingTextLengthPt;
            // In Python, max(net_padding, 7.2) implies a minimum padding.
            const paddingStyle = `padding-left:${Math.max(netPadding, 7.2)}pt;`;
            
            if (numberingLevel.fonts?.ascii) {
                const fontStyle = `font-family:${numberingLevel.fonts.ascii};`;
                return `<span style="${fontStyle}">${lvlText}</span><span style="${paddingStyle}"></span>`;
            }
            return `<span>${lvlText}</span><span style="${paddingStyle}"></span>`;
        }

        // Default padding if tab_pt is not defined, as per Python's fallback
        const defaultPadding = "padding-left:7.2pt;";
        if (numberingLevel.fonts?.ascii) {
            const fontStyle = `font-family:${numberingLevel.fonts.ascii};`;
            return `<span style="${fontStyle}">${lvlText}</span><span style="${defaultPadding}"></span>`;
        }

        return `${lvlText}<span style="${defaultPadding}"></span>`;
    }

    private static getNumberingLevel(numberingSchema: NumberingSchema, numId: number, ilvl: number): NumberingLevel {
        const instance = numberingSchema.instances.find(inst => inst.numId === numId);
        if (instance) {
            const level = instance.levels.find(lvl => lvl.ilvl === ilvl);
            if (level) {
                return level;
            }
        }
        throw new Error(`Numbering level not found for numId: ${numId}, ilvl: ${ilvl}`);
    }

    private static formatNumber(counter: number, numFmt: string): string {
        switch (numFmt) {
            case "decimal":
                return String(counter);
            case "lowerRoman":
                return NumberingConverter.toRoman(counter).toLowerCase();
            case "upperRoman":
                return NumberingConverter.toRoman(counter).toUpperCase();
            case "lowerLetter":
                return NumberingConverter.toLowerLetter(counter);
            case "upperLetter":
                return NumberingConverter.toUpperLetter(counter);
            case "bullet":
                return "•";
            default:
                // As per Python script, return empty string for unknown formats
                return ""; 
        }
    }

    private static toRoman(num: number): string {
        if (num <= 0) return String(num); // Roman numerals are typically for positive integers
        const val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
        const syb = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];
        let romanNum = '';
        let currentNum = num;
        let i = 0;
        while (currentNum > 0 && i < val.length) {
            const count = Math.floor(currentNum / val[i]);
            for (let k = 0; k < count; k++) {
                romanNum += syb[i];
                currentNum -= val[i];
            }
            i++;
        }
        return romanNum;
    }

    private static toUpperLetter(num: number): string {
        // Replicates Python's chr(64 + num)
        // A=1, B=2 ...
        // For num=0 -> '@', num=27 -> '[' etc.
        return String.fromCharCode(64 + num); 
    }

    private static toLowerLetter(num: number): string {
        // Replicates Python's chr(96 + num)
        // a=1, b=2 ...
        // For num=0 -> '\`', num=27 -> '{' etc.
        return String.fromCharCode(96 + num);
    }
}

// Example Usage (equivalent to Python's if __name__ == "__main__")
/*
async function testNumberingConverter() {
    // --- Mock Data Setup ---
    // This requires detailed mock objects for Paragraph and NumberingSchema.
    // The structure of these objects can be complex.

    // Example NumberingLevel (assuming FontProperties and IndentationProperties types exist)
    const sampleLevel0: NumberingLevel = {
        numId: 1, // Belongs to abstractNumId which links to instance
        ilvl: 0,
        start: 1,
        numFmt: "decimal", // e.g., 1, 2, 3
        lvlText: "%1.",    // e.g., "1."
        lvlJc: "left",
        // indent: { leftPt: 720 / 20, firstLinePt: -360 / 20 }, // Example: 36pt left, -18pt firstLine (hanging)
        // fonts: { ascii: "Calibri" } // Example font
    };
    
    const sampleLevel1: NumberingLevel = {
        numId: 1,
        ilvl: 1,
        start: 1,
        numFmt: "lowerLetter", // e.g., a, b, c
        lvlText: "%2)",       // e.g., "a)"
        lvlJc: "left",
        // indent: { leftPt: 1080 / 20, firstLinePt: -360 / 20 }, // Example: 54pt left, -18pt firstLine
        // fonts: { ascii: "Calibri" }
    };

    // Example NumberingInstance
    const sampleNumberingInstance: NumberingInstance = {
        numId: 1, // This is the w:num@w:numId that a paragraph refers to
        levels: [sampleLevel0, sampleLevel1] // Contains levels from an abstractNum, possibly overridden
    };

    // Example NumberingSchema
    const sampleNumberingSchema: NumberingSchema = {
        instances: [sampleNumberingInstance]
    };

    // Example Paragraph with numbering
    const sampleParagraph1: Paragraph = {
        properties: {
            // mock paragraph properties
        },
        runs: [
            { contents: [{ type: 'text', text: "First item" }] }
        ],
        numbering: { numId: 1, ilvl: 0 } // Refers to numId 1, level 0
    };

    const sampleParagraph2: Paragraph = {
        properties: {},
        runs: [
            { contents: [{ type: 'text', text: "Second item (level 0)" }] }
        ],
        numbering: { numId: 1, ilvl: 0 } // Continues numId 1, level 0
    };
    
    const sampleParagraph3: Paragraph = {
        properties: {},
        runs: [
            { contents: [{ type: 'text', text: "Sub-item a" }] }
        ],
        numbering: { numId: 1, ilvl: 1 } // Switches to level 1 of numId 1
    };

    const sampleParagraph4: Paragraph = {
        properties: {},
        runs: [
            { contents: [{ type: 'text', text: "Sub-item b" }] }
        ],
        numbering: { numId: 1, ilvl: 1 } // Continues level 1
    };
        
    const sampleParagraph5: Paragraph = {
        properties: {},
        runs: [
            { contents: [{ type: 'text', text: "Third item (back to level 0)" }] }
        ],
        numbering: { numId: 1, ilvl: 0 } // Back to level 0
    };


    // --- Test Execution ---
    NumberingConverter.resetCounters(); // Important for fresh test runs

    console.log("--- Testing Numbering Conversion ---");

    let htmlOutput = NumberingConverter.convertNumbering(sampleParagraph1, sampleNumberingSchema);
    console.log(\`Para 1 (1. First item): ${htmlOutput} -> Expected something like <span...>1.</span>...\`);

    htmlOutput = NumberingConverter.convertNumbering(sampleParagraph2, sampleNumberingSchema);
    console.log(\`Para 2 (2. Second item): ${htmlOutput} -> Expected something like <span...>2.</span>...\`);
    
    htmlOutput = NumberingConverter.convertNumbering(sampleParagraph3, sampleNumberingSchema);
    console.log(\`Para 3 (a) Sub-item a): ${htmlOutput} -> Expected something like <span...>a)</span>...\`);

    htmlOutput = NumberingConverter.convertNumbering(sampleParagraph4, sampleNumberingSchema);
    console.log(\`Para 4 (b) Sub-item b): ${htmlOutput} -> Expected something like <span...>b)</span>...\`);
    
    htmlOutput = NumberingConverter.convertNumbering(sampleParagraph5, sampleNumberingSchema);
    console.log(\`Para 5 (3. Third item): ${htmlOutput} -> Expected something like <span...>3.</span>...\`);

    // Test with a different numbering ID to ensure counters are separate
    const sampleLevelAlt: NumberingLevel = {
        numId: 2, ilvl: 0, start: 1, numFmt: "upperRoman", lvlText: "%1)", lvlJc: "left"
    };
    const sampleNumberingInstanceAlt: NumberingInstance = {
        numId: 2, levels: [sampleLevelAlt]
    };
    const sampleNumberingSchemaWithAlt: NumberingSchema = {
        instances: [sampleNumberingInstance, sampleNumberingInstanceAlt]
    };
    const sampleParagraphAlt: Paragraph = {
        properties: {},
        runs: [{ contents: [{ type: 'text', text: "Alt list item I" }] }],
        numbering: { numId: 2, ilvl: 0 }
    };
    htmlOutput = NumberingConverter.convertNumbering(sampleParagraphAlt, sampleNumberingSchemaWithAlt);
    console.log(\`Para Alt (I. Alt list item): ${htmlOutput} -> Expected something like <span...>I)</span>...\`);
    
    // Test reset counters
    NumberingConverter.resetCounters();
    htmlOutput = NumberingConverter.convertNumbering(sampleParagraph1, sampleNumberingSchema); // Should restart from 1.
    console.log(\`Para 1 after reset (1. First item): ${htmlOutput} -> Expected something like <span...>1.</span>...\`);

    // Test bullet
     const sampleBulletLevel: NumberingLevel = {
        numId: 3, ilvl: 0, start: 1, numFmt: "bullet", lvlText: "•", lvlJc: "left" // lvlText for bullet is often the bullet char itself
    };
    const sampleNumberingInstanceBullet: NumberingInstance = {
        numId: 3, levels: [sampleBulletLevel]
    };
     const sampleNumberingSchemaWithBullet: NumberingSchema = {
        instances: [sampleNumberingInstanceBullet]
    };
    const sampleParagraphBullet: Paragraph = {
        properties: {},
        runs: [{ contents: [{ type: 'text', text: "Bullet item" }] }],
        numbering: { numId: 3, ilvl: 0 }
    };
    htmlOutput = NumberingConverter.convertNumbering(sampleParagraphBullet, sampleNumberingSchemaWithBullet);
    console.log(\`Para Bullet (• Bullet item): ${htmlOutput} -> Expected "•<span style=\\"padding-left:7.2pt;\\"></span>" or similar if lvlText is "•"\`);
}

// To run the test:
// 1. Ensure you have ts-node installed (npm install -g ts-node) or use your project's runner.
// 2. You'll need to define or import `FontProperties` and `IndentationProperties` if not globally available
//    or if the mock `NumberingLevel` objects need them explicitly and they are not optional with fallbacks.
//    The current `NumberingLevel` model makes `indent` and `fonts` optional, so this should work.
// 3. Uncomment the line below and run the file (e.g., `ts-node C:\Projects\Docx-html-txt-converter\docx_html_txt\docx_parser_converter_ts\src\docx_to_html\converters\numberingConverter.ts`)

// testNumberingConverter().catch(console.error);
*/ 