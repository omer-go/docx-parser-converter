import type { FontProperties, SpacingProperties, IndentationProperties } from '../../docx_parsers/models/stylesModels';
import type { DocMargins } from '../../docx_parsers/models/documentModels';

export class StyleConverter {
    /**
     * Converts bold property to CSS style.
     */
    public static convertBold(bold?: boolean): string {
        return bold ? "font-weight:bold;" : "";
    }

    /**
     * Converts italic property to CSS style.
     */
    public static convertItalic(italic?: boolean): string {
        return italic ? "font-style:italic;" : "";
    }

    /**
     * Converts underline property to CSS style.
     */
    public static convertUnderline(underline?: string): string {
        if (!underline) return "";

        const underlineMapping: Record<string, string> = {
            "single": "text-decoration:underline;",
            "double": "text-decoration:underline double;", // CSS Level 3 'text-decoration-style'
            "words": "text-decoration:underline words;", // Not standard CSS, browser dependent or needs specific handling
            "dotted": "text-decoration:underline dotted;", // CSS Level 3 'text-decoration-style'
            "dashed": "text-decoration:underline dashed;", // CSS Level 3 'text-decoration-style'
            "dot-dash": "text-decoration:underline dot-dash;", // Not standard CSS
            "dot-dot-dash": "text-decoration:underline dot-dot-dash;", // Not standard CSS
            "wavy": "text-decoration:underline wavy;", // CSS Level 3 'text-decoration-style'
            "none": "text-decoration:none;"
        };
        // For complex styles like "double", "dotted", "dashed", "wavy",
        // modern CSS might use text-decoration-line, text-decoration-style, text-decoration-color.
        // The Python version produces "text-decoration:underline <style>;".
        // We will replicate this, but note that for better CSS, one might split these.
        // For "text-decoration:underline double;", it might be better as "text-decoration-line: underline; text-decoration-style: double;"
        // However, "text-decoration: underline double;" is supported in some contexts or might be a shorthand.
        // Sticking to Python output:
        return underlineMapping[underline] || "";
    }

    /**
     * Converts color property to CSS style.
     */
    public static convertColor(color?: string): string {
        if (!color) return "";
        if (color.toLowerCase() === "auto") {
            return "color:auto;";
        }
        return `color:#${color};`;
    }

    /**
     * Converts font properties to CSS style.
     * Primarily uses the 'ascii' font if available.
     */
    public static convertFont(font?: FontProperties): string {
        let style = "";
        if (font?.ascii) {
            style += `font-family:${font.ascii.trim()};`;
        }
        // The Python version only considers font.ascii. If other font properties (hAnsi, eastAsia, cs)
        // should be used as fallbacks or in specific contexts, that logic would need to be added.
        return style;
    }

    /**
     * Converts font size property to CSS style.
     */
    public static convertSize(sizePt?: number): string {
        return sizePt !== undefined ? `font-size:${sizePt.toFixed(1)}pt;` : "";
    }

    /**
     * Converts spacing properties (margin-top, margin-bottom, line-height) to CSS style.
     */
    public static convertSpacing(spacing?: SpacingProperties): string {
        let style = "";
        if (!spacing) return style;

        if (spacing.beforePt !== undefined) {
            style += `margin-top:${spacing.beforePt}pt;`;
        }
        if (spacing.afterPt !== undefined) {
            style += `margin-bottom:${spacing.afterPt}pt;`;
        }
        if (spacing.linePt !== undefined) {
            style += `line-height:${spacing.linePt}pt;`;
        }
        return style;
    }

    /**
     * Converts indentation properties (margin-left, margin-right, text-indent) to CSS style.
     */
    public static convertIndent(indent?: IndentationProperties): string {
        let style = "";
        if (!indent) return style;

        if (indent.leftPt !== undefined) { // Handles 0 as a valid value
            style += `margin-left:${indent.leftPt}pt;`;
        }
        if (indent.rightPt !== undefined) { // Handles 0 as a valid value
            style += `margin-right:${indent.rightPt}pt;`;
        }
        if (indent.firstLinePt) { // Skips if 0, undefined, or null, as 0 means no special first-line indent
            style += `text-indent:${indent.firstLinePt}pt;`;
        }
        return style;
    }

    /**
     * Converts justification property to CSS style.
     */
    public static convertJustification(justification?: string): string {
        if (!justification) {
            return "";
        }
        const justificationMap: Record<string, string> = {
            "left": "left",
            "center": "center",
            "right": "right",
            "both": "justify",      // Standard CSS for 'both'
            "distribute": "justify" // 'distribute' often implies a form of justification
        };
        // Python's .get(justification, 'left') behavior:
        // If justification is a key in map, use its value.
        // Else, use 'left'.
        const textAlignValue = justificationMap[justification] || justificationMap["left"];
        return `text-align:${textAlignValue};`;
    }

    /**
     * Converts document margins to CSS style for the body or a main container.
     * Note: CSS padding for header/footer can be complex. This mirrors Python's direct conversion.
     */
    public static convertDocMargins(margins?: DocMargins): string {
        if (!margins) return "";

        let style = "";
        // Python's f-string formatting implies these are present.
        // If truly optional and can be undefined, `?? 0` provides a default.
        // Or, conditionally add them if defined. Let's assume they should output 0pt if not specified.
        style += `padding-top:${margins.topPt ?? 0}pt;`;
        style += `padding-right:${margins.rightPt ?? 0}pt;`;
        style += `padding-bottom:${margins.bottomPt ?? 0}pt;`;
        style += `padding-left:${margins.leftPt ?? 0}pt;`;

        // Python's `if margins.header_pt:` checks for truthiness (non-zero).
        if (margins.headerPt) {
            style += `padding-top:${margins.headerPt}pt;`; // This may override the previous padding-top
        }
        if (margins.footerPt) {
            style += `padding-bottom:${margins.footerPt}pt;`; // This may override the previous padding-bottom
        }
        if (margins.gutterPt) {
            style += `margin-left:${margins.gutterPt}pt;`; // Gutter is typically margin
        }
        return style;
    }
}

// Example Usage (equivalent to Python's if __name__ == "__main__")
/*
function testStyleConverter() {
    console.log("--- Testing StyleConverter ---");

    // Test bold
    console.log(\`Bold true: "${StyleConverter.convertBold(true)}" (Expected: font-weight:bold;)\`);
    console.log(\`Bold false: "${StyleConverter.convertBold(false)}" (Expected: )\`);
    console.log(\`Bold undefined: "${StyleConverter.convertBold()}" (Expected: )\`);

    // Test italic
    console.log(\`Italic true: "${StyleConverter.convertItalic(true)}" (Expected: font-style:italic;)\`);
    console.log(\`Italic false: "${StyleConverter.convertItalic(false)}" (Expected: )\`);

    // Test underline
    console.log(\`Underline single: "${StyleConverter.convertUnderline("single")}" (Expected: text-decoration:underline;)\`);
    console.log(\`Underline double: "${StyleConverter.convertUnderline("double")}" (Expected: text-decoration:underline double;)\`);
    console.log(\`Underline none: "${StyleConverter.convertUnderline("none")}" (Expected: text-decoration:none;)\`);
    console.log(\`Underline unknown: "${StyleConverter.convertUnderline("unknown")}" (Expected: )\`);
    console.log(\`Underline undefined: "${StyleConverter.convertUnderline()}" (Expected: )\`);

    // Test color
    console.log(\`Color #FF0000: "${StyleConverter.convertColor("#FF0000")}" (Expected: color:#FF0000;)\`);
    console.log(\`Color undefined: "${StyleConverter.convertColor()}" (Expected: )\`);

    // Test font
    const font1: FontProperties = { ascii: "Arial" };
    console.log(\`Font Arial: "${StyleConverter.convertFont(font1)}" (Expected: font-family:Arial;)\`);
    const font2: FontProperties = { ascii: "Times New Roman" };
    console.log(\`Font Times New Roman: "${StyleConverter.convertFont(font2)}" (Expected: font-family:Times New Roman;)\`);
    const font3: FontProperties = { hAnsi: "Calibri" }; // ascii is primary
    console.log(\`Font no ascii: "${StyleConverter.convertFont(font3)}" (Expected: )\`);
    console.log(\`Font undefined: "${StyleConverter.convertFont()}" (Expected: )\`);

    // Test size
    console.log(\`Size 12pt: "${StyleConverter.convertSize(12)}" (Expected: font-size:12.0pt;)\`);
    console.log(\`Size 0pt: "${StyleConverter.convertSize(0)}" (Expected: font-size:0.0pt;)\`);
    console.log(\`Size undefined: "${StyleConverter.convertSize()}" (Expected: )\`);

    // Test spacing
    const spacing1: SpacingProperties = { beforePt: 10, afterPt: 5, linePt: 15 };
    console.log(\`Spacing 1: "${StyleConverter.convertSpacing(spacing1)}" (Expected: margin-top:10pt;margin-bottom:5pt;line-height:15pt;)\`);
    const spacing2: SpacingProperties = { beforePt: 10 };
    console.log(\`Spacing 2: "${StyleConverter.convertSpacing(spacing2)}" (Expected: margin-top:10pt;)\`);
    const spacing3: SpacingProperties = { linePt: 0 }; // line-height:0pt; is valid
    console.log(\`Spacing 3: "${StyleConverter.convertSpacing(spacing3)}" (Expected: line-height:0pt;)\`);
    console.log(\`Spacing undefined: "${StyleConverter.convertSpacing()}" (Expected: )\`);

    // Test indent
    const indent1: IndentationProperties = { leftPt: 36, rightPt: 0, firstLinePt: 18 };
    console.log(\`Indent 1: "${StyleConverter.convertIndent(indent1)}" (Expected: margin-left:36pt;margin-right:0pt;text-indent:18pt;)\`);
    const indent2: IndentationProperties = { firstLinePt: -18 }; // Hanging indent
    console.log(\`Indent 2: "${StyleConverter.convertIndent(indent2)}" (Expected: text-indent:-18pt;)\`);
    const indent3: IndentationProperties = { leftPt: 0 };
    console.log(\`Indent 3: "${StyleConverter.convertIndent(indent3)}" (Expected: margin-left:0pt;)\`);
    const indent4: IndentationProperties = { firstLinePt: 0 }; // No text-indent for 0
    console.log(\`Indent 4: "${StyleConverter.convertIndent(indent4)}" (Expected: )\`);
    console.log(\`Indent undefined: "${StyleConverter.convertIndent()}" (Expected: )\`);

    // Test justification
    console.log(\`Justify left: "${StyleConverter.convertJustification("left")}" (Expected: text-align:left;)\`);
    console.log(\`Justify center: "${StyleConverter.convertJustification("center")}" (Expected: text-align:center;)\`);
    console.log(\`Justify both: "${StyleConverter.convertJustification("both")}" (Expected: text-align:justify;)\`);
    console.log(\`Justify unknown: "${StyleConverter.convertJustification("unknown")}" (Expected: text-align:left;)\`);
    console.log(\`Justify undefined: "${StyleConverter.convertJustification()}" (Expected: )\`);

    // Test document margins
    const margins1: DocMargins = { topPt: 72, rightPt: 72, bottomPt: 72, leftPt: 72, headerPt: 36, footerPt: 36, gutterPt: 18 };
    console.log(\`DocMargins 1: "${StyleConverter.convertDocMargins(margins1)}" (Expected: padding-top:72pt;padding-right:72pt;padding-bottom:72pt;padding-left:72pt;padding-top:36pt;padding-bottom:36pt;margin-left:18pt;)\`);
    const margins2: DocMargins = { topPt: 72, rightPt: 72, bottomPt: 72, leftPt: 72 }; // No header/footer/gutter
    console.log(\`DocMargins 2: "${StyleConverter.convertDocMargins(margins2)}" (Expected: padding-top:72pt;padding-right:72pt;padding-bottom:72pt;padding-left:72pt;)\`);
     const margins3: DocMargins = { topPt: 0, rightPt: 0, bottomPt: 0, leftPt: 0, headerPt:0, footerPt:0, gutterPt:0}; // All zeros
    console.log(\`DocMargins 3 (all zeros): "${StyleConverter.convertDocMargins(margins3)}" (Expected: padding-top:0pt;padding-right:0pt;padding-bottom:0pt;padding-left:0pt;)\`);
    console.log(\`DocMargins undefined: "${StyleConverter.convertDocMargins()}" (Expected: )\`);
}

// To run the test:
// 1. Ensure you have ts-node installed (npm install -g ts-node) or use your project's runner.
// 2. Define or import related types if not using this file in a project context where types are resolved.
// 3. Uncomment the line below and run the file (e.g., using ts-node)
// testStyleConverter();
*/ 