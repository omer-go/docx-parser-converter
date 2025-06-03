import type { Run, RunContent, TextContent, TabContent } from '../models/paragraphModels';
import type { RunStyleProperties } from '../models/stylesModels';
import { extractElement, NAMESPACE_URI } from '../helpers/commonHelpers';
import { RunPropertiesParser } from '../styles/runPropertiesParser';

/**
 * A parser for extracting run elements from the DOCX document structure.
 *
 * This class handles the extraction of run properties and contents within a 
 * run element, converting them into a structured Run object for further 
 * processing or conversion to other formats like HTML.
 */
export class RunParser {
    /**
     * Parses a run from the given XML element.
     *
     * @param r - The run XML element.
     * @returns The parsed run.
     *
     * @example
     * The following is an example of a run element in a document.xml file:
     * ```xml
     * <w:r>
     *     <w:rPr>
     *         <w:b/>
     *         <w:color w:val="FF0000"/>
     *     </w:rPr>
     *     <w:t>Example text</w:t>
     * </w:r>
     * ```
     */
    public parse(r: Element): Run {
        const rPr = extractElement(r, ".//w:rPr");
        const runProperties = rPr ? new RunPropertiesParser().parse(rPr) : {} as RunStyleProperties;
        const contents = this.extractRunContents(r);
        return {
            contents,
            properties: runProperties
        };
    }

    /**
     * Extracts run contents from the given run XML element.
     *
     * @param r - The run XML element.
     * @returns The list of extracted run contents.
     *
     * @example
     * The following is an example of run contents in a document.xml file:
     * ```xml
     * <w:r>
     *     <w:tab/>
     *     <w:t>Example text</w:t>
     * </w:r>
     * ```
     */
    private extractRunContents(r: Element): RunContent[] {
        const contents: RunContent[] = [];
        
        for (const elem of Array.from(r.children)) {
            const fullTag = `{${NAMESPACE_URI}}${elem.localName}`;
            
            if (fullTag === `{${NAMESPACE_URI}}tab`) {
                contents.push({
                    type: 'tab'
                } as TabContent);
            } else if (fullTag === `{${NAMESPACE_URI}}t`) {
                contents.push({
                    type: 'text',
                    text: elem.textContent || ''
                } as TextContent);
            }
        }
        
        return contents;
    }
} 