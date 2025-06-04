import type { Paragraph } from '../../docx_parsers/models/paragraphModels';
import type { NumberingSchema, NumberingLevel } from '../../docx_parsers/models/numberingModels';

/**
 * Converts DOCX numbering to plain text for TXT output, preserving the logic of the Python implementation.
 */
export class NumberingConverter {
    private static numberingCounters: Record<number, number[]> = {};

    public static resetCounters(): void {
        NumberingConverter.numberingCounters = {};
    }

    public static convertNumbering(paragraph: Paragraph, numberingSchema: NumberingSchema): string {
        const numbering = paragraph.numbering;
        if (!numbering) {
            // Python: broad try-except returns bullet if numbering is missing
            return '• ';
        }

        let numberingLevel: NumberingLevel;
        try {
            numberingLevel = NumberingConverter.getNumberingLevel(numberingSchema, numbering.numId, numbering.ilvl);
        } catch (e: any) {
            // Python: print warning and return bullet
            if (typeof console !== 'undefined') {
                console.warn(`Warning: ${e.message || e}`);
            }
            return '• ';
        }

        if (!NumberingConverter.numberingCounters[numbering.numId]) {
            NumberingConverter.numberingCounters[numbering.numId] = new Array(9).fill(0); // Up to 9 levels
        }
        NumberingConverter.numberingCounters[numbering.numId][numbering.ilvl]++;

        // Reset counters for deeper levels if a higher level is incremented
        for (let i = numbering.ilvl + 1; i < 9; i++) {
            NumberingConverter.numberingCounters[numbering.numId][i] = 0;
        }

        const counters = NumberingConverter.numberingCounters[numbering.numId].slice(0, numbering.ilvl + 1);
        const formattedCounters: string[] = [];
        for (let i = 0; i <= numbering.ilvl; i++) {
            formattedCounters.push(NumberingConverter.formatNumber(counters[i], numberingLevel.numFmt));
        }

        let lvlText = numberingLevel.lvlText;
        for (let i = 1; i <= numbering.ilvl + 1; i++) {
            const placeholder = `%${i}`;
            if (formattedCounters[i - 1] !== undefined) {
                lvlText = lvlText.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), formattedCounters[i - 1]);
            }
        }
        return lvlText + ' ';
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
            case 'decimal':
                return String(counter);
            case 'lowerRoman':
                return NumberingConverter.toRoman(counter).toLowerCase();
            case 'upperRoman':
                return NumberingConverter.toRoman(counter).toUpperCase();
            case 'lowerLetter':
                return NumberingConverter.toLowerLetter(counter);
            case 'upperLetter':
                return NumberingConverter.toUpperLetter(counter);
            case 'bullet':
                return '•';
            default:
                return '';
        }
    }

    private static toRoman(num: number): string {
        if (num <= 0) return String(num);
        const val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
        const syb = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
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
        return String.fromCharCode(64 + num);
    }

    private static toLowerLetter(num: number): string {
        return String.fromCharCode(96 + num);
    }
} 