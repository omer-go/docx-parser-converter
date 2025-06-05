import type {
    StylesSchema,
    Style,
    StyleDefaults,
    RunStyleProperties,
    ParagraphStyleProperties
} from '../models/stylesModels';
import {
    extractElement,
    extractAttribute,
    // extractBooleanAttribute,
    NAMESPACE
} from '../helpers/commonHelpers';
import { ParagraphPropertiesParser } from './paragraphPropertiesParser';
import { RunPropertiesParser } from './runPropertiesParser';
import { extractXmlRootFromDocx, extractXmlRootFromString } from '../utils';

// Type guard for Buffer (Node.js environment)
function isBuffer(value: any): value is Buffer {
    return typeof Buffer !== 'undefined' && value instanceof Buffer;
}

/**
 * A parser for extracting styles from a DOCX file.
 */
export class StylesParser {
    private root: Element | null;
    private stylesSchema: StylesSchema | null;

    /**
     * Initializes the StylesParser.
     *
     * @param source - Either the DOCX file as bytes (Buffer/Uint8Array) or the styles.xml content as a string.
     */
    constructor(source?: string | Buffer | Uint8Array) {
        this.root = null;
        this.stylesSchema = null;
        if (source) {
            if (typeof source === 'string') {
                this.root = extractXmlRootFromString(source);
                this.stylesSchema = this.parse();
            } else if (source instanceof Uint8Array || isBuffer(source)) {
                // Initialize with null, will be set by initializeFromDocx
                this.initializeFromDocx(source);
            }
        }
    }

    /**
     * Initializes the parser from a DOCX file asynchronously.
     * 
     * @param docxContent - The DOCX file content as bytes.
     */
    private async initializeFromDocx(docxContent: Buffer | Uint8Array): Promise<void> {
        this.root = await extractXmlRootFromDocx(docxContent, 'styles.xml');
        this.stylesSchema = this.parse();
    }

    /**
     * Parses the styles XML and returns the StylesSchema.
     *
     * @returns The parsed styles schema.
     *
     * @example
     * The following is an example of a styles element in a styles.xml file:
     * ```xml
     * <w:styles>
     *     <w:style w:styleId="Heading1" w:type="paragraph">
     *         <w:name w:val="heading 1"/>
     *         <w:basedOn w:val="Normal"/>
     *         <w:pPr>
     *             <w:spacing w:before="240" w:after="240" w:line="360"/>
     *         </w:pPr>
     *         <w:rPr>
     *             <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
     *         </w:rPr>
     *     </w:style>
     *     <w:docDefaults>
     *         <w:rPrDefault>
     *             <w:rPr>
     *                 <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
     *                 <w:sz w:val="22"/>
     *             </w:rPr>
     *         </w:rPrDefault>
     *         <w:pPrDefault>
     *             <w:pPr>
     *                 <w:spacing w:before="120" w:after="120"/>
     *             </w:pPr>
     *         </w:pPrDefault>
     *     </w:docDefaults>
     * </w:styles>
     * ```
     */
    public parse(): StylesSchema {
        const styles: Style[] = [];

        const docDefaultsRpr = this.extractDocDefaultsRpr(this.root);
        const docDefaultsPpr = this.extractDocDefaultsPpr(this.root);
        const styleTypeDefaults = this.extractStyleTypeDefaults(this.root);

        if (this.root) {
            const styleElements = this.root.getElementsByTagNameNS(NAMESPACE.w, 'style');
            for (let i = 0; i < styleElements.length; i++) {
                styles.push(this.extractStyle(styleElements[i]));
            }
        }

        const stylesSchema: StylesSchema = {
            styles,
            styleTypeDefaults,
            docDefaultsRpr,
            docDefaultsPpr
        };

        return stylesSchema;
    }

    /**
     * Extracts the default run properties from the styles XML.
     *
     * @param root - The root element of the styles XML.
     * @returns The parsed default run properties.
     *
     * @example
     * ```xml
     * <w:docDefaults>
     *     <w:rPrDefault>
     *         <w:rPr>
     *             <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
     *             <w:sz w:val="22"/>
     *         </w:rPr>
     *     </w:rPrDefault>
     * </w:docDefaults>
     * ```
     */
    private extractDocDefaultsRpr(root: Element | null): RunStyleProperties {
        const rPrDefault = extractElement(root, ".//w:rPrDefault//w:rPr");
        return new RunPropertiesParser().parse(rPrDefault);
    }

    /**
     * Extracts the default paragraph properties from the styles XML.
     *
     * @param root - The root element of the styles XML.
     * @returns The parsed default paragraph properties.
     *
     * @example
     * ```xml
     * <w:docDefaults>
     *     <w:pPrDefault>
     *         <w:pPr>
     *             <w:spacing w:before="120" w:after="120"/>
     *         </w:pPr>
     *     </w:pPrDefault>
     * </w:docDefaults>
     * ```
     */
    private extractDocDefaultsPpr(root: Element | null): ParagraphStyleProperties {
        const pPrDefault = extractElement(root, ".//w:pPrDefault//w:pPr");
        return new ParagraphPropertiesParser().parse(pPrDefault);
    }

    /**
     * Extracts the default styles from the styles XML.
     *
     * @param root - The root element of the styles XML.
     * @returns The extracted default styles.
     *
     * @example
     * ```xml
     * <w:styles>
     *     <w:style w:styleId="DefaultParagraphFont" w:type="character" w:default="1">
     *         <w:name w:val="Default Paragraph Font"/>
     *     </w:style>
     *     <w:style w:styleId="Normal" w:type="paragraph" w:default="1">
     *         <w:name w:val="Normal"/>
     *     </w:style>
     * </w:styles>
     * ```
     */
    private extractStyleTypeDefaults(root: Element | null): StyleDefaults {
        const defaults: StyleDefaults = {};

        if (root) {
            const styleElements = root.getElementsByTagNameNS(NAMESPACE.w, 'style');
            for (let i = 0; i < styleElements.length; i++) {
                const style = styleElements[i];
                if (extractAttribute(style, 'default') === "1") {
                    const styleType = extractAttribute(style, 'type');
                    const styleId = extractAttribute(style, 'styleId') || 'Unknown StyleId';
                    switch (styleType) {
                        case "paragraph":
                            defaults.paragraph = styleId;
                            break;
                        case "character":
                            defaults.character = styleId;
                            break;
                        case "numbering":
                            defaults.numbering = styleId;
                            break;
                        case "table":
                            defaults.table = styleId;
                            break;
                    }
                }
            }
        }

        return defaults;
    }

    /**
     * Extracts a single style from the styles XML element.
     *
     * @param styleElement - The style XML element.
     * @returns The extracted style.
     *
     * @example
     * ```xml
     * <w:style w:styleId="Heading1" w:type="paragraph">
     *     <w:name w:val="heading 1"/>
     *     <w:basedOn w:val="Normal"/>
     *     <w:pPr>
     *         <w:spacing w:before="240" w:after="240" w:line="360"/>
     *     </w:pPr>
     *     <w:rPr>
     *         <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
     *     </w:rPr>
     * </w:style>
     * ```
     */
    private extractStyle(styleElement: Element): Style {
        const styleId = extractAttribute(styleElement, 'styleId') || 'Unknown StyleId';
        const nameElement = extractElement(styleElement, ".//w:name");
        const name = extractAttribute(nameElement, 'val') || 'Unknown Name';

        const basedOnElement = extractElement(styleElement, ".//w:basedOn");
        const basedOn = extractAttribute(basedOnElement, 'val') || undefined;

        const paragraphProperties = new ParagraphPropertiesParser().parse(
            extractElement(styleElement, ".//w:pPr")
        );
        const runProperties = new RunPropertiesParser().parse(
            extractElement(styleElement, ".//w:rPr")
        );

        return {
            styleId,
            name,
            basedOn,
            paragraphProperties,
            runProperties
        };
    }

    /**
     * Returns the parsed styles schema.
     *
     * @returns The parsed styles schema.
     */
    public getStylesSchema(): StylesSchema | null {
        return this.stylesSchema;
    }
}
