import type { 
    Table, TableProperties, TableGrid, TableRow, TableRowProperties, 
    TableCell, TableCellProperties, MarginProperties
} from '../../docx_parsers/models/tableModels';
import type { NumberingSchema } from '../../docx_parsers/models/numberingModels';
import { ParagraphConverter } from './paragraphConverter';

export class TableConverter {

    private static readonly EMPTY_NUMBERING_SCHEMA: NumberingSchema = { instances: [] };

    public static convertTable(table: Table): string {
        const tablePropertiesStyle = TableConverter.convertTableProperties(table.properties);
        let tableHtml = `<table style="${tablePropertiesStyle}">`;

        if (table.grid) {
            tableHtml += TableConverter.convertGrid(table.grid);
        }
        
        tableHtml += TableConverter.convertRows(table.rows, table.properties?.tblCellMar, TableConverter.EMPTY_NUMBERING_SCHEMA);
        
        tableHtml += "</table>";
        return tableHtml;
    }

    public static convertTableProperties(properties?: TableProperties): string {
        const styles: string[] = ["border-collapse: collapse;"];
        if (!properties) return styles.join(" ");

        if (properties.tblW?.width !== undefined) {
            styles.push(`width:${properties.tblW.width}pt;`);
        }
        if (properties.justification) {
            styles.push(`text-align:${properties.justification};`);
        }
        if (properties.tblInd?.width !== undefined) {
            styles.push(`margin-left:${properties.tblInd.width}pt;`);
        }
        // Note: Python version applies tblCellMar padding to the table style itself.
        // This is unusual; cell padding is typically on <td> or <th>.
        // Replicating Python logic:
        if (properties.tblCellMar) {
            const mar = properties.tblCellMar;
            styles.push(`padding: ${mar.top ?? 0}pt ${mar.right ?? 0}pt ${mar.bottom ?? 0}pt ${mar.left ?? 0}pt;`);
        }
        if (properties.tblLayout) {
            styles.push(`table-layout:${properties.tblLayout};`);
        }
        return styles.join(" ");
    }

    public static convertGrid(grid: TableGrid): string {
        let colgroupHtml = "<colgroup>";
        for (const width of grid.columns) {
            colgroupHtml += `<col style="width:${width}pt;">`;
        }
        colgroupHtml += "</colgroup>";
        return colgroupHtml;
    }

    public static convertRows(rows: TableRow[], tblCellMar?: MarginProperties, numberingSchema?: NumberingSchema): string {
        let tbodyHtml = "<tbody>";
        for (const row of rows) {
            tbodyHtml += TableConverter.convertRow(row, tblCellMar, numberingSchema ?? TableConverter.EMPTY_NUMBERING_SCHEMA);
        }
        tbodyHtml += "</tbody>";
        return tbodyHtml;
    }

    public static convertRow(row: TableRow, tblCellMar?: MarginProperties, numberingSchema?: NumberingSchema): string {
        const rowPropertiesStyle = TableConverter.convertRowProperties(row.properties);
        let trHtml = `<tr style="${rowPropertiesStyle}">`;
        trHtml += TableConverter.convertCells(row.cells, tblCellMar, numberingSchema ?? TableConverter.EMPTY_NUMBERING_SCHEMA);
        trHtml += "</tr>";
        return trHtml;
    }

    public static convertRowProperties(properties?: TableRowProperties): string {
        const styles: string[] = [];
        if (!properties) return "";

        if (properties.trHeight) {
            const height = parseFloat(properties.trHeight); // In points
            if (!isNaN(height)) {
                styles.push(`height:${height}pt;`);
            }
        }
        if (properties.tblHeader) {
            styles.push("font-weight:bold;");
        }
        return styles.join(" ");
    }

    public static convertCells(cells: TableCell[], tblCellMar?: MarginProperties, numberingSchema?: NumberingSchema): string {
        let cellsHtml = "";
        for (const cell of cells) {
            const cellPropertiesStyle = TableConverter.convertCellProperties(cell.properties, tblCellMar);
            cellsHtml += `<td style="${cellPropertiesStyle}">`;
            
            if (TableConverter.isCellEmpty(cell)) {
                cellsHtml += "&nbsp;"; // Non-breaking space for empty cells
            } else {
                for (const paragraph of cell.paragraphs) {
                    cellsHtml += ParagraphConverter.convertParagraph(paragraph, numberingSchema ?? TableConverter.EMPTY_NUMBERING_SCHEMA);
                }
            }
            cellsHtml += "</td>";
        }
        return cellsHtml;
    }

    public static isCellEmpty(cell: TableCell): boolean {
        if (!cell.paragraphs || cell.paragraphs.length === 0) return true;
        for (const paragraph of cell.paragraphs) {
            if (paragraph.runs && paragraph.runs.length > 0) {
                for (const run of paragraph.runs) {
                    if (run.contents && run.contents.length > 0) {
                        // Check if any content is actual text and not just empty objects or tabs
                        const hasText = run.contents.some(content => content.type === 'text' && content.text.trim() !== '');
                        if(hasText) return false;
                        // If it contains only tabs or empty text, it might still be considered empty for rendering purposes
                        // However, original python checks for any content. So if contents array is not empty, it is not empty.
                        // Replicating python: if run.contents: return False
                        if(run.contents.length > 0) return false;
                    }
                }
            }
        }
        return true;
    }

    public static convertCellProperties(properties?: TableCellProperties, tblCellMar?: MarginProperties): string {
        const styles: string[] = [
            "word-wrap: break-word;",
            "word-break: break-all;", 
            "overflow-wrap: break-word;",
            "overflow: hidden;" 
        ];
        
        if (!properties && !tblCellMar) return styles.join(" "); // Minimal default styles

        if (properties?.tcW?.width !== undefined) {
            styles.push(`width:${properties.tcW.width}pt;`);
        }
        if (properties?.tcBorders) {
            const { top, left, bottom, right } = properties.tcBorders;
            if (top?.val) {
                styles.push(`border-top:${(top.size ?? 0) / 8}pt ${TableConverter.mapBorderStyle(top.val)} #${top.color || '000000'};`);
            }
            if (left?.val) {
                styles.push(`border-left:${(left.size ?? 0) / 8}pt ${TableConverter.mapBorderStyle(left.val)} #${left.color || '000000'};`);
            }
            if (bottom?.val) {
                styles.push(`border-bottom:${(bottom.size ?? 0) / 8}pt ${TableConverter.mapBorderStyle(bottom.val)} #${bottom.color || '000000'};`);
            }
            if (right?.val) {
                styles.push(`border-right:${(right.size ?? 0) / 8}pt ${TableConverter.mapBorderStyle(right.val)} #${right.color || '000000'};`);
            }
        }
        if (properties?.shd?.fill) {
            styles.push(`background-color:#${properties.shd.fill};`);
        }
        
        // Cell-specific margins (tcMar) take precedence over table-wide cell margins (tblCellMar)
        const cellMarginToApply = properties?.tcMar || tblCellMar;
        if (cellMarginToApply) {
            const mar = cellMarginToApply;
            styles.push(`padding: ${mar.top ?? 0}pt ${mar.right ?? 0}pt ${mar.bottom ?? 0}pt ${mar.left ?? 0}pt;`);
        }

        if (properties?.vAlign) {
            styles.push(`vertical-align:${TableConverter.mapVerticalAlignment(properties.vAlign)};`);
        } else {
            styles.push("vertical-align: top;"); // Default
        }
        
        // textAlignment on cell properties is not in the TS model TableCellProperties.
        // If needed, it should be handled by paragraph properties inside the cell.
        // Python script: if hasattr(properties, 'textAlignment'): styles.append(f"text-align:{properties.textAlignment};")
        // This is omitted as it's not in the model.

        return styles.join(" ");
    }

    public static mapBorderStyle(val?: string): string {
        if (!val) return "solid"; // Default
        const mapping: Record<string, string> = {
            "single": "solid",
            "double": "double",
            "dashed": "dashed",
            // TODO: Add more DOCX border styles to CSS mappings if needed
            // e.g., dotted, dashDot, dashDotDot, etc.
        };
        return mapping[val.toLowerCase()] || "solid";
    }

    public static mapVerticalAlignment(val?: string): string {
        if (!val) return "top"; // Default
        const mapping: Record<string, string> = {
            "top": "top",
            "center": "middle",
            "bottom": "bottom",
            // "both" (justify) is not a standard CSS vertical-align value for table cells directly.
        };
        return mapping[val.toLowerCase()] || "top";
    }
}

// Example Usage (equivalent to Python's if __name__ == "__main__")
/*
import { RunConverter } from './runConverter'; // For NumberingConverter.resetCounters if used in test setup for paragraphs
import { NumberingConverter } from './numberingConverter'; // For NumberingConverter.resetCounters

function testTableConverter() {
    console.log("--- Testing TableConverter ---");
    NumberingConverter.resetCounters(); // Reset for any paragraph numbering within cells

    // --- Mock Data Setup ---
    const sampleTable: Table = {
        properties: {
            tblW: { width: 500, type: "pt" },
            justification: "center",
            tblCellMar: { top: 5, right: 5, bottom: 5, left: 5 }, // Default cell margins for the table
            tblLayout: "fixed",
            tblBorders: { // Table-level borders (usually for outer borders)
                top: { val: "single", size: 8, color: "0000FF" }, // Blue top border for table
                bottom: { val: "single", size: 8, color: "0000FF" },
            }
        },
        grid: {
            columns: [150, 200, 150] // Three columns
        },
        rows: [
            {
                properties: { trHeight: "20", tblHeader: true }, // Row height in points, is a header row
                cells: [
                    {
                        properties: { tcW: { width: 150 }, vAlign: "center" }, 
                        paragraphs: [{ properties: {}, runs: [{ contents: [{ type: 'text', text: "Header 1" }] }] }]
                    },
                    {
                        properties: { tcW: { width: 200 }, tcBorders: { bottom: { val: "dashed", size: 16, color: "FF0000" } } }, 
                        paragraphs: [{ properties: {}, runs: [{ contents: [{ type: 'text', text: "Header 2 (Red Dashed Bottom)" }] }] }]
                    },
                    {
                        properties: { tcW: { width: 150 }, shd: { fill: "DDDDDD" } }, // Shaded cell
                        paragraphs: [{ properties: {}, runs: [{ contents: [{ type: 'text', text: "Header 3 (Shaded)" }] }] }]
                    }
                ]
            },
            {
                cells: [
                    {
                        // Cell with specific margin overriding table default
                        properties: { tcMar: { top: 10, right: 10, bottom: 10, left: 10 } }, 
                        paragraphs: [
                            { properties: { justification: "right" }, runs: [{ contents: [{ type: 'text', text: "Row 2, Cell 1 (Right Aligned Para)" }] }] },
                            { properties: {}, runs: [{ contents: [{ type: 'text', text: "Second para in cell"}]}]}
                        ]
                    },
                    {
                        paragraphs: [{ properties: {}, runs: [{ contents: [{ type: 'text', text: "Row 2, Cell 2" }] }] }]
                    },
                    { 
                        // Empty cell test
                        paragraphs: [{ properties: {}, runs: [{ contents: []}]}]
                    }
                ]
            }
        ]
    };

    // --- Test Execution ---
    console.log("\n--- Full Table HTML ---");
    const htmlOutput = TableConverter.convertTable(sampleTable);
    console.log(htmlOutput);
    // Manual inspection of the complex HTML output is needed here.
    // Key things to check based on mock:
    // - Table style: border-collapse, width:500pt, text-align:center, padding for tblCellMar, table-layout:fixed
    // - Colgroup: <col style="width:150pt;"><col style="width:200pt;"><col style="width:150pt;">
    // - Row 1: style="height:20pt; font-weight:bold;"
    //   - Cell 1.1: style includes width:150pt, default padding from tblCellMar, vertical-align:middle.
    //   - Cell 1.2: style includes width:200pt, border-bottom:2pt dashed #FF0000.
    //   - Cell 1.3: style includes width:150pt, background-color:#DDDDDD.
    // - Row 2:
    //   - Cell 2.1: style includes padding:10pt 10pt 10pt 10pt. Paragraph inside should be <p style="text-align:right;">...
    //   - Cell 2.3: should contain &nbsp;

    console.log("\n--- Testing isCellEmpty ---");
    const emptyCell: TableCell = { paragraphs: [{ properties: {}, runs: [{ contents: [] }] }] };
    console.log(`isCellEmpty for empty cell: ${TableConverter.isCellEmpty(emptyCell)} (Expected: true)`);
    const nonEmptyCell: TableCell = { paragraphs: [{ properties: {}, runs: [{ contents: [{ type: 'text', text: "Hi" }] }] }] };
    console.log(`isCellEmpty for non-empty cell: ${TableConverter.isCellEmpty(nonEmptyCell)} (Expected: false)`);
    const cellWithEmptyText: TableCell = { paragraphs: [{ properties: {}, runs: [{ contents: [{ type: 'text', text: " " }] }] }] };
    // Current isCellEmpty logic (replicating python `if run.contents: return False`) will consider this non-empty if text node exists, even if whitespace.
    // If stricter definition of empty (e.g. no visible characters) is needed, isCellEmpty logic would need adjustment.
    console.log(`isCellEmpty for cell with whitespace text: ${TableConverter.isCellEmpty(cellWithEmptyText)} (Expected based on strict content check: false)`);

    console.log("\n--- Testing Specific Property Converters ---");
    const tblProps: TableProperties = { tblW: { width: 300 }, justification: "left" };
    console.log(`convertTableProperties: "${TableConverter.convertTableProperties(tblProps)}"`);

    const rowProps: TableRowProperties = { trHeight: "50.5", tblHeader: true };
    console.log(`convertRowProperties: "${TableConverter.convertRowProperties(rowProps)}"`);

    const cellProps: TableCellProperties = {
        tcW: { width: 100 },
        tcBorders: { top: { val: "double", size: 4, color: "ABCDEF" } },
        shd: { fill: "EEEEEE" },
        vAlign: "bottom"
    };
    console.log(`convertCellProperties: "${TableConverter.convertCellProperties(cellProps, { top:3,left:3,bottom:3,right:3 })}"`);
}

// To run the test:
// 1. Ensure ts-node is installed.
// 2. Ensure other converter files (ParagraphConverter.ts) are available.
// 3. All model types must be correctly defined and imported.
// 4. Uncomment the line below and run (e.g., `ts-node path/to/tableConverter.ts`)
// testTableConverter();
*/ 