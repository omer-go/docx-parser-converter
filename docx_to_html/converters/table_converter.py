from lxml import etree, html
from docx_parsers.models.table_models import Table
from docx_to_html.converters.paragraph_converter import ParagraphConverter

class TableConverter:
    @staticmethod
    def convert_table(table: Table) -> str:
        table_html = etree.Element("table")
        table_properties_html = TableConverter.convert_table_properties(table.properties)
        table_html.set("style", table_properties_html)
        
        table_grid_html = TableConverter.convert_grid(table.grid.columns)
        table_html.append(html.fragment_fromstring(table_grid_html))
        
        rows_html = TableConverter.convert_rows(table.rows, table.properties.tblCellMar)  # Pass tblCellMar to rows
        table_html.append(rows_html)
        
        return html.tostring(table_html, pretty_print=True, encoding="unicode")

    @staticmethod
    def convert_table_properties(properties) -> str:
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
        colgroup = etree.Element("colgroup")
        for width in columns:
            col = etree.SubElement(colgroup, "col", style=f"width:{width}pt;")
        return html.tostring(colgroup, pretty_print=True, encoding="unicode")

    @staticmethod
    def convert_rows(rows, tblCellMar) -> etree.Element:  # Accept tblCellMar as a parameter
        tbody = etree.Element("tbody")
        for row in rows:
            row_html = TableConverter.convert_row(row, tblCellMar)
            tbody.append(row_html)
        return tbody

    @staticmethod
    def convert_row(row, tblCellMar) -> etree.Element:  # Accept tblCellMar as a parameter
        tr = etree.Element("tr")
        row_properties_html = TableConverter.convert_row_properties(row.properties)
        tr.set("style", row_properties_html)
        
        cells_html = TableConverter.convert_cells(row.cells, tblCellMar)
        for cell_html in cells_html:
            tr.append(cell_html)
        
        return tr

    @staticmethod
    def convert_row_properties(properties) -> str:
        styles = []
        if properties.trHeight:
            tr_height = float(properties.trHeight) if isinstance(properties.trHeight, str) else properties.trHeight
            styles.append(f"height:{tr_height}pt;")
        if properties.tblHeader:
            styles.append("font-weight:bold;")
        return " ".join(styles)

    @staticmethod
    def convert_cells(cells, tblCellMar) -> list:  # Accept tblCellMar as a parameter
        cell_elements = []
        for cell in cells:
            td = etree.Element("td")
            cell_properties_html = TableConverter.convert_cell_properties(cell.properties, tblCellMar)
            td.set("style", cell_properties_html)
            
            for paragraph in cell.paragraphs:
                paragraph_html = ParagraphConverter.convert_paragraph(paragraph, None)  # Adjust numbering_schema as needed
                td.append(html.fragment_fromstring(paragraph_html))
            
            cell_elements.append(td)
        return cell_elements

    @staticmethod
    def convert_cell_properties(properties, tblCellMar) -> str:  # Accept tblCellMar as a parameter
        styles = []
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
        if tblCellMar:  # Apply tblCellMar margins if available
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
        mapping = {
            "single": "solid",
            "double": "double",
            "dashed": "dashed",
            # Add more mappings as needed
        }
        return mapping.get(val, "solid")  # Default to solid if style is unknown

    @staticmethod
    def map_vertical_alignment(val) -> str:
        mapping = {
            "top": "top",
            "center": "middle",
            "bottom": "bottom",
            # Add more mappings as needed
        }
        return mapping.get(val, "top")  # Default to top if alignment is unknown
