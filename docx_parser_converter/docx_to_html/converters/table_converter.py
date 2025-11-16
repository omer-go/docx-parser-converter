from typing import List, Optional, Sequence, cast
from lxml import etree, html  # type: ignore
from docx_parser_converter.docx_parsers.models.table_models import (
    MarginProperties,
    Table,
    TableCell,
    TableCellProperties,
    TableProperties,
    TableRow,
    TableRowProperties,
)
from docx_parser_converter.docx_to_html.converters.paragraph_converter import (
    ParagraphConverter,
)
from docx_parser_converter.docx_to_html.converters.style_converter import (
    StyleConverter,
)

class TableConverter:
    """
    A converter class for converting DOCX tables to HTML.
    """

    @staticmethod
    def convert_table(table: Table) -> str:
        """
        Converts a table to its HTML representation.

        Args:
            table (Table): The table to convert.

        Returns:
            str: The HTML representation of the table.

        Example:
            Given a table with properties, the output HTML string might look like:

            .. code-block:: html

                <table style="border-collapse: collapse; width:500pt;">
                    <colgroup>
                        <col style="width:250pt;">
                        <col style="width:250pt;">
                    </colgroup>
                    <tbody>
                        <tr style="height:20pt;">
                            <td style="width:250pt; padding:5pt 5pt 5pt 5pt;">Cell 1</td>
                            <td style="width:250pt; padding:5pt 5pt 5pt 5pt;">Cell 2</td>
                        </tr>
                    </tbody>
                </table>
        """
        table_html = etree.Element("table")
        properties = table.properties or TableProperties.model_validate({})
        table_properties_html = TableConverter.convert_table_properties(properties)
        table_html.set("style", table_properties_html)

        if table.grid and table.grid.columns:
            table_grid_html = TableConverter.convert_grid(table.grid.columns)
            table_html.append(html.fragment_fromstring(table_grid_html))

        rows_html = TableConverter.convert_rows(table.rows, properties.tblCellMar)
        table_html.append(rows_html)

        return cast(
            str, html.tostring(table_html, pretty_print=True, encoding="unicode")
        )

    @staticmethod
    def convert_table_properties(properties: Optional[TableProperties]) -> str:
        """
        Converts table properties to an HTML style attribute.

        Args:
            properties: The table properties to convert.

        Returns:
            str: The HTML style attribute representing the table properties.

        Example:
            The output style attribute might look like:

            .. code-block:: css

                'border-collapse: collapse; width:500pt; text-align:center; margin-left:20pt; padding: 5pt 5pt 5pt 5pt;'
        """
        props = properties or TableProperties.model_validate({})
        styles = ["border-collapse: collapse;"]  # Ensure borders collapse
        if props.tblW and props.tblW.width is not None:
            styles.append(f"width:{props.tblW.width}pt;")
        if props.justification:
            justification_style = StyleConverter.convert_justification(
                props.justification
            )
            if justification_style:
                styles.append(justification_style)
        if props.tblInd and props.tblInd.width is not None:
            styles.append(f"margin-left:{props.tblInd.width}pt;")
        if props.tblCellMar:
            styles.append(
                f"padding: {props.tblCellMar.top}pt {props.tblCellMar.right}pt "
                f"{props.tblCellMar.bottom}pt {props.tblCellMar.left}pt;"
            )
        if props.tblLayout:
            styles.append(f"table-layout:{props.tblLayout};")
        return " ".join(styles)

    @staticmethod
    def convert_grid(columns: Sequence[float]) -> str:
        """
        Converts table grid columns to HTML.

        Args:
            columns: The grid columns widths.

        Returns:
            str: The HTML colgroup element representing the grid columns.

        Example:
            The output HTML colgroup might look like:

            .. code-block:: html

                <colgroup>
                    <col style="width:250pt;">
                    <col style="width:250pt;">
                </colgroup>
        """
        colgroup = etree.Element("colgroup")
        for width in columns:
            etree.SubElement(colgroup, "col", style=f"width:{width}pt;")
        return cast(
            str, html.tostring(colgroup, pretty_print=True, encoding="unicode")
        )

    @staticmethod
    def convert_rows(
        rows: Sequence[TableRow], tblCellMar: Optional[MarginProperties]
    ) -> etree.Element:
        """
        Converts table rows to HTML.

        Args:
            rows: The list of table rows to convert.
            tblCellMar: The table cell margins to apply.

        Returns:
            etree.Element: The HTML tbody element representing the rows.

        Example:
            The output HTML tbody might look like:

            .. code-block:: html

                <tbody>
                    <tr style="height:20pt;">
                        <td style="width:250pt; padding:5pt 5pt 5pt 5pt;">Cell 1</td>
                        <td style="width:250pt; padding:5pt 5pt 5pt 5pt;">Cell 2</td>
                    </tr>
                </tbody>
        """
        tbody = etree.Element("tbody")
        for row in rows:
            row_html = TableConverter.convert_row(row, tblCellMar)
            tbody.append(row_html)
        return tbody

    @staticmethod
    def convert_row(row: TableRow, tblCellMar: Optional[MarginProperties]) -> etree.Element:
        """
        Converts a table row to HTML.

        Args:
            row: The row to convert.
            tblCellMar: The table cell margins to apply.

        Returns:
            etree.Element: The HTML tr element representing the row.

        Example:
            The output HTML tr might look like:

            .. code-block:: html

                <tr style="height:20pt;">
                    <td style="width:250pt; padding:5pt 5pt 5pt 5pt;">Cell 1</td>
                    <td style="width:250pt; padding:5pt 5pt 5pt 5pt;">Cell 2</td>
                </tr>
        """
        tr = etree.Element("tr")
        row_properties_html = TableConverter.convert_row_properties(row.properties)
        if row_properties_html:
            tr.set("style", row_properties_html)

        cells_html = TableConverter.convert_cells(row.cells, tblCellMar)
        for cell_html in cells_html:
            tr.append(cell_html)
        
        return tr

    @staticmethod
    def convert_row_properties(
        properties: Optional[TableRowProperties],
    ) -> str:
        """
        Converts row properties to an HTML style attribute.

        Args:
            properties: The row properties to convert.

        Returns:
            str: The HTML style attribute representing the row properties.

        Example:
            The output style attribute might look like:

            .. code-block:: css

                'height:20pt; font-weight:bold;'
        """
        row_props = properties or TableRowProperties.model_validate({})
        styles: List[str] = []
        if row_props.trHeight:
            tr_height = (
                float(row_props.trHeight)
                if isinstance(row_props.trHeight, str)
                else row_props.trHeight
            )
            if tr_height is not None:
                styles.append(f"height:{tr_height}pt;")
        if row_props.tblHeader:
            styles.append("font-weight:bold;")
        return " ".join(styles)

    @staticmethod
    def convert_cells(
        cells: Sequence[TableCell], tblCellMar: Optional[MarginProperties]
    ) -> list:
        """
        Converts table cells to HTML.

        Args:
            cells: The list of cells to convert.
            tblCellMar: The table cell margins to apply.

        Returns:
            list: The list of HTML td elements representing the cells.

        Example:
            The output HTML td elements might look like:

            .. code-block:: html

                <td style="width:250pt; padding:5pt 5pt 5pt 5pt;">Cell 1</td>
                <td style="width:250pt; padding:5pt 5pt 5pt 5pt;">Cell 2</td>
        """
        cell_elements = []
        for cell in cells:
            td = etree.Element("td")
            cell_properties_html = TableConverter.convert_cell_properties(cell.properties, tblCellMar)
            td.set("style", cell_properties_html)
            
            if TableConverter.is_cell_empty(cell):  # Check if the cell is empty
                td.text = "\u00A0"
            else:
                for paragraph in cell.paragraphs:
                    paragraph_html = ParagraphConverter.convert_paragraph(paragraph, None)
                    td.append(html.fragment_fromstring(paragraph_html))
            
            cell_elements.append(td)
        return cell_elements

    @staticmethod
    def is_cell_empty(cell) -> bool:
        """
        Check if a cell is empty by verifying if all runs in all paragraphs have no contents.

        Args:
            cell: The cell to check.

        Returns:
            bool: True if the cell is empty, False otherwise.

        Example:
            .. code-block:: python

                if TableConverter.is_cell_empty(cell):
                    print("Cell is empty")
                else:
                    print("Cell is not empty")
        """
        for paragraph in cell.paragraphs:
            for run in paragraph.runs:
                if run.contents:
                    return False
        return True

    @staticmethod
    def convert_cell_properties(properties, tblCellMar) -> str:
        """
        Converts cell properties to an HTML style attribute.

        Args:
            properties: The cell properties to convert.
            tblCellMar: The table cell margins to apply.

        Returns:
            str: The HTML style attribute representing the cell properties.

        Defaults:
            - Word wrapping is enabled with "word-wrap: break-word;" and "word-break: break-all;".
            - Overflow handling is enabled with "overflow-wrap: break-word;" and "overflow: hidden;".
            - Vertical alignment defaults to "top".

        Example:
            The output style attribute might look like:

            .. code-block:: css

                'width:250pt; border-top:1pt solid #000000; border-left:1pt solid #000000; border-bottom:1pt solid #000000; border-right:1pt solid #000000; background-color:#FFFFFF; padding:5pt 5pt 5pt 5pt; vertical-align:top;'
        """
        cell_properties = properties or TableCellProperties.model_validate({})
        styles = [
            "word-wrap: break-word;",       # Allow words to be broken at arbitrary points
            "word-break: break-all;",       # Ensure long words break and wrap into next line
            "overflow-wrap: break-word;",   # Handle long words in tables
            "overflow: hidden;"             # Hide overflow content
        ]
        if cell_properties.tcW and cell_properties.tcW.width is not None:
            styles.append(f"width:{cell_properties.tcW.width}pt;")
        if cell_properties.tcBorders:
            borders = cell_properties.tcBorders
            if borders.top and borders.top.size is not None:
                styles.append(
                    f"border-top:{borders.top.size / 8}pt "
                    f"{TableConverter.map_border_style(borders.top.val)} #{borders.top.color};"
                )
            if borders.left and borders.left.size is not None:
                styles.append(
                    f"border-left:{borders.left.size / 8}pt "
                    f"{TableConverter.map_border_style(borders.left.val)} #{borders.left.color};"
                )
            if borders.bottom and borders.bottom.size is not None:
                styles.append(
                    f"border-bottom:{borders.bottom.size / 8}pt "
                    f"{TableConverter.map_border_style(borders.bottom.val)} #{borders.bottom.color};"
                )
            if borders.right and borders.right.size is not None:
                styles.append(
                    f"border-right:{borders.right.size / 8}pt "
                    f"{TableConverter.map_border_style(borders.right.val)} #{borders.right.color};"
                )
        if cell_properties.shd and cell_properties.shd.fill:
            styles.append(f"background-color:#{cell_properties.shd.fill};")
        if tblCellMar:
            styles.append(
                f"padding: {tblCellMar.top}pt {tblCellMar.right}pt "
                f"{tblCellMar.bottom}pt {tblCellMar.left}pt;"
            )
        alignment_value = getattr(cell_properties, "verticalAlignment", None)
        if not alignment_value and cell_properties.vAlign:
            alignment_value = cell_properties.vAlign
        if alignment_value:
            styles.append(
                f"vertical-align:{TableConverter.map_vertical_alignment(alignment_value)};"
            )
        else:
            styles.append("vertical-align:top;")

        text_alignment = getattr(cell_properties, "textAlignment", None)
        if text_alignment:
            styles.append(f"text-align:{text_alignment};")
        return " ".join(styles)

    @staticmethod
    def map_border_style(val) -> str:
        """
        Maps DOCX border style to CSS border style.

        Args:
            val: The DOCX border style.

        Returns:
            str: The CSS border style.

        Example:
            The output CSS border style might look like:

            .. code-block:: css

                'solid'
        """
        mapping = {
            "single": "solid",
            "double": "double",
            "dashed": "dashed",
            # Add more mappings as needed
        }
        return mapping.get(val, "solid")  # Default to solid if style is unknown

    @staticmethod
    def map_vertical_alignment(val) -> str:
        """
        Maps DOCX vertical alignment to CSS vertical alignment.

        Args:
            val: The DOCX vertical alignment.

        Returns:
            str: The CSS vertical alignment.

        Example:
            The output CSS vertical alignment might look like:

            .. code-block:: css

                'top'
        """
        mapping = {
            "top": "top",
            "center": "middle",
            "bottom": "bottom",
            # Add more mappings as needed
        }
        return mapping.get(val, "top")  # Default to top if alignment is unknown
