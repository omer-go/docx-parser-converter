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