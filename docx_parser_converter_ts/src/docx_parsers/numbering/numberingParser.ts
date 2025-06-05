import type { NumberingLevel, NumberingInstance, NumberingSchema } from '../models/numberingModels';
import type { FontProperties, IndentationProperties } from '../models/stylesModels';
import { extractElement, extractAttribute, NAMESPACE } from '../helpers/commonHelpers';
import { extractXmlRootFromDocx, convertTwipsToPoints, extractXmlRootFromString } from '../utils';
import { ParagraphPropertiesParser } from '../styles/paragraphPropertiesParser';

/**
 * Parses the numbering definitions from a DOCX file.
 *
 * This class extracts and parses the numbering definitions found in the 
 * numbering.xml file of a DOCX document, converting them into structured 
 * TypeScript interfaces for further processing or conversion to other formats.
 */
export class NumberingParser {
    private root: Element;
    private numberingSchema: NumberingSchema;

    /**
     * Creates a new instance of NumberingParser.
     * 
     * @param source - Either the binary content of the DOCX file
     *                 or the numbering.xml content as a string.
     * @returns A Promise that resolves to a new NumberingParser instance.
     */
    public static async create(source: Uint8Array | ArrayBuffer | string | Element): Promise<NumberingParser> {
        const parser = new NumberingParser();
        await parser.initialize(source);
        return parser;
    }

    private constructor() {
        // Private constructor to enforce using the static create method
        this.root = {} as Element;
        this.numberingSchema = { instances: [] };
    }

    /**
     * Initializes the parser with the given source.
     * 
     * @param source - Either the binary content of the DOCX file,
     *                 the numbering.xml content as a string,
     *                 or a pre-parsed XML Element.
     */
    private async initialize(source: Uint8Array | ArrayBuffer | string | Element): Promise<void> {
        if (source instanceof Element) {
            this.root = source;
        } else if (typeof source === 'string') {
            this.root = extractXmlRootFromString(source);
        } else if (source instanceof Uint8Array || source instanceof ArrayBuffer) {
            this.root = await extractXmlRootFromDocx(source, 'numbering.xml');
        } else {
            // This case should ideally not be reached if type hints are respected.
            // If it is, it means 'source' is not an Element, string, Uint8Array, or ArrayBuffer.
            throw new Error('Invalid source type provided to NumberingParser. Expected Element, string, Uint8Array, or ArrayBuffer.');
        }
        this.numberingSchema = this.parse();
    }

    /**
     * Parses the numbering XML into a NumberingSchema.
     *
     * @returns The parsed numbering schema.
     */
    private parse(): NumberingSchema {
        const instances: NumberingInstance[] = [];
        const nums = this.root.getElementsByTagNameNS(NAMESPACE.w, 'num');

        for (let i = 0; i < nums.length; i++) {
            const num = nums[i];
            const numIdStr = extractAttribute(num, 'numId');
            if (!numIdStr) continue; // Skip if no numId

            const numId = parseInt(numIdStr, 10);
            const abstractNumIdEl = extractElement(num, './/w:abstractNumId');
            const abstractNumIdStr = abstractNumIdEl ? extractAttribute(abstractNumIdEl, 'val') : null;
            if (!abstractNumIdStr) continue; // Skip if no abstractNumId

            const abstractNumId = parseInt(abstractNumIdStr, 10);
            const levels = this.extractLevels(abstractNumId);
            const instance: NumberingInstance = { numId, levels };
            instances.push(instance);
        }

        return { instances };
    }

    /**
     * Extracts the levels for a given abstract numbering ID.
     *
     * @param abstractNumId - The abstract numbering ID.
     * @returns The list of extracted numbering levels.
     */
    private extractLevels(abstractNumId: number): NumberingLevel[] {
        const levels: NumberingLevel[] = [];
        const abstractNum = extractElement(this.root, `//w:abstractNum[@w:abstractNumId='${abstractNumId}']`);

        if (abstractNum) {
            const lvls = abstractNum.getElementsByTagNameNS(NAMESPACE.w, 'lvl');
            for (let i = 0; i < lvls.length; i++) {
                const lvl = lvls[i];
                const level = this.extractLevel(abstractNumId, lvl);
                if (level) {
                    levels.push(level);
                }
            }
        }

        return levels;
    }

    /**
     * Extracts a single numbering level.
     *
     * @param numId - The numbering ID.
     * @param lvl - The XML element representing the numbering level.
     * @returns The extracted numbering level.
     */
    private extractLevel(numId: number, lvl: Element): NumberingLevel | null {
        const ilvlStr = extractAttribute(lvl, 'ilvl');
        if (!ilvlStr) return null;
        const ilvl = parseInt(ilvlStr, 10);

        const startEl = extractElement(lvl, './/w:start');
        const startStr = startEl ? extractAttribute(startEl, 'val') : '1';
        const start = parseInt(startStr || '1', 10);

        const numFmtEl = extractElement(lvl, './/w:numFmt');
        const numFmt = numFmtEl ? extractAttribute(numFmtEl, 'val') : 'decimal';

        const lvlTextEl = extractElement(lvl, './/w:lvlText');
        const lvlText = lvlTextEl ? extractAttribute(lvlTextEl, 'val') : '';

        const lvlJcEl = extractElement(lvl, './/w:lvlJc');
        const lvlJc = lvlJcEl ? extractAttribute(lvlJcEl, 'val') : 'left';

        const indent = this.extractIndentation(lvl);
        const tabPt = this.extractTab(lvl);
        const fonts = this.extractFonts(lvl);

        return {
            numId,
            ilvl,
            start,
            numFmt: numFmt || 'decimal',
            lvlText: lvlText || '',
            lvlJc: lvlJc || 'left',
            ...(indent && { indent }),
            ...(tabPt !== undefined && { tabPt }),
            ...(fonts && { fonts })
        };
    }

    /**
     * Extracts indentation properties from a numbering level.
     *
     * @param lvl - The XML element representing the numbering level.
     * @returns The extracted indentation properties.
     */
    private extractIndentation(lvl: Element): IndentationProperties | undefined {
        const pPr = extractElement(lvl, './/w:pPr');
        if (pPr) {
            const parser = new ParagraphPropertiesParser();
            const props = parser.parse(pPr);
            return props.indent;
        }
        return undefined;
    }

    /**
     * Extracts tab stop properties from a numbering level.
     *
     * @param lvl - The XML element representing the numbering level.
     * @returns The tab stop position in points.
     */
    private extractTab(lvl: Element): number | undefined {
        const pPr = extractElement(lvl, './/w:pPr');
        if (pPr) {
            const tabEl = extractElement(pPr, './/w:tab');
            if (tabEl) {
                const pos = extractAttribute(tabEl, 'pos');
                if (pos && !isNaN(parseInt(pos, 10))) {
                    return convertTwipsToPoints(parseInt(pos, 10));
                }
            }
        }
        return undefined;
    }

    /**
     * Extracts font properties from a numbering level.
     *
     * @param lvl - The XML element representing the numbering level.
     * @returns The extracted font properties.
     */
    private extractFonts(lvl: Element): FontProperties | undefined {
        const rPr = extractElement(lvl, './/w:rPr');
        if (rPr) {
            const rFonts = extractElement(rPr, 'w:rFonts');
            if (rFonts) {
                const ascii = extractAttribute(rFonts, 'ascii') || undefined;
                const hAnsi = extractAttribute(rFonts, 'hAnsi') || undefined;
                const eastAsia = extractAttribute(rFonts, 'eastAsia') || undefined;
                const cs = extractAttribute(rFonts, 'cs') || undefined;
                
                if (ascii || hAnsi || eastAsia || cs) {
                    return { ascii, hAnsi, eastAsia, cs };
                }
            }
        }
        return undefined;
    }

    /**
     * Gets the parsed numbering schema.
     *
     * @returns The parsed numbering schema.
     */
    public getNumberingSchema(): NumberingSchema {
        return this.numberingSchema;
    }
}

