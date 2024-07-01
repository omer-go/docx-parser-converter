from lxml import etree, html
from docx_parser_converter.docx_parsers.models.table_models import Table
from docx_parser_converter.docx_to_html.converters.paragraph_converter import ParagraphConverter

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
        table_properties_html = TableConverter.convert_table_properties(table.properties)
        table_html.set("style", table_properties_html)
        
        table_grid_html = TableConverter.convert_grid(table.grid.columns)
        table_html.append(html.fragment_fromstring(table_grid_html))
        
        rows_html = TableConverter.convert_rows(table.rows, table.properties.tblCellMar)
        table_html.append(rows_html)
        
        return html.tostring(table_html, pretty_print=True, encoding="unicode")

    @staticmethod
    def convert_table_properties(properties) -> str:
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
        styles = ["border-collapse: collapse;"]  # Ensure borders collapse
        if properties.tblW:
            styles.append(f"width:{properties.tblW.width}pt;")
        if properties.justification:
            styles.append(f"text-align:{properties.justification};")
        if properties.tblInd:
            styles.append(f"margin-left:{properties.tblInd.width}pt;")
        if properties.tblCellMar:
            styles.append(f"padding: {properties.tblCellMar.top}pt {properties.tblCellMar.right}pt {properties.tblCellMar.bottom}pt {properties.tblCellMar.left}pt;")
        if properties.tblLayout:
            styles.append(f"table-layout:{properties.tblLayout};")
        return " ".join(styles)

    @staticmethod
    def convert_grid(columns) -> str:
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
            col = etree.SubElement(colgroup, "col", style=f"width:{width}pt;")
        return html.tostring(colgroup, pretty_print=True, encoding="unicode")

    @staticmethod
    def convert_rows(rows, tblCellMar) -> etree.Element:
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
    def convert_row(row, tblCellMar) -> etree.Element:
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
        tr.set("style", row_properties_html)
        
        cells_html = TableConverter.convert_cells(row.cells, tblCellMar)
        for cell_html in cells_html:
            tr.append(cell_html)
        
        return tr

    @staticmethod
    def convert_row_properties(properties) -> str:
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
        styles = []
        if properties.trHeight:
            tr_height = float(properties.trHeight) if isinstance(properties.trHeight, str) else properties.trHeight
            styles.append(f"height:{tr_height}pt;")
        if properties.tblHeader:
            styles.append("font-weight:bold;")
        return " ".join(styles)

    @staticmethod
    def convert_cells(cells, tblCellMar) -> list:
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
        styles = [
            "word-wrap: break-word;",       # Allow words to be broken at arbitrary points
            "word-break: break-all;",       # Ensure long words break and wrap into next line
            "overflow-wrap: break-word;",   # Handle long words in tables
            "overflow: hidden;"             # Hide overflow content
        ]
        if properties.tcW:
            styles.append(f"width:{properties.tcW.width}pt;")
        if properties.tcBorders:
            if properties.tcBorders.top:
                styles.append(f"border-top:{properties.tcBorders.top.size / 8}pt {TableConverter.map_border_style(properties.tcBorders.top.val)} #{properties.tcBorders.top.color};")
            if properties.tcBorders.left:
                styles.append(f"border-left:{properties.tcBorders.left.size / 8}pt {TableConverter.map_border_style(properties.tcBorders.left.val)} #{properties.tcBorders.left.color};")
            if properties.tcBorders.bottom:
                styles.append(f"border-bottom:{properties.tcBorders.bottom.size / 8}pt {TableConverter.map_border_style(properties.tcBorders.bottom.val)} #{properties.tcBorders.bottom.color};")
            if properties.tcBorders.right:
                styles.append(f"border-right:{properties.tcBorders.right.size / 8}pt {TableConverter.map_border_style(properties.tcBorders.right.val)} #{properties.tcBorders.right.color};")
        if properties.shd:
            styles.append(f"background-color:#{properties.shd.fill};")
        if tblCellMar:
            styles.append(f"padding: {tblCellMar.top}pt {tblCellMar.right}pt {tblCellMar.bottom}pt {tblCellMar.left}pt;")
        if hasattr(properties, 'verticalAlignment'):
            styles.append(f"vertical-align:{TableConverter.map_vertical_alignment(properties.verticalAlignment)};")
        else:
            styles.append("vertical-align: top;")  # Default to top if not specified
        if hasattr(properties, 'textAlignment'):
            styles.append(f"text-align:{properties.textAlignment};")
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
