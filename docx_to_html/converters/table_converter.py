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
        
        rows_html = TableConverter.convert_rows(table.rows)
        table_html.append(rows_html)
        
        return html.tostring(table_html, pretty_print=True, encoding="unicode")

    @staticmethod
    def convert_table_properties(properties) -> str:
        styles = []
        if properties.tblW:
            styles.append(f"width:{properties.tblW.width}px;")
        if properties.justification:
            styles.append(f"text-align:{properties.justification};")
        if properties.tblInd:
            styles.append(f"margin-left:{properties.tblInd.width}px;")
        if properties.tblCellMar:
            styles.append(f"padding: {properties.tblCellMar.top}px {properties.tblCellMar.right}px {properties.tblCellMar.bottom}px {properties.tblCellMar.left}px;")
        if properties.tblLayout:
            styles.append(f"table-layout:{properties.tblLayout};")
        return " ".join(styles)

    @staticmethod
    def convert_grid(columns) -> str:
        colgroup = etree.Element("colgroup")
        for width in columns:
            col = etree.SubElement(colgroup, "col", style=f"width:{width}px;")
        return html.tostring(colgroup, pretty_print=True, encoding="unicode")

    @staticmethod
    def convert_rows(rows) -> etree.Element:
        tbody = etree.Element("tbody")
        for row in rows:
            row_html = TableConverter.convert_row(row)
            tbody.append(row_html)
        return tbody

    @staticmethod
    def convert_row(row) -> etree.Element:
        tr = etree.Element("tr")
        row_properties_html = TableConverter.convert_row_properties(row.properties)
        tr.set("style", row_properties_html)
        
        cells_html = TableConverter.convert_cells(row.cells)
        for cell_html in cells_html:
            tr.append(cell_html)
        
        return tr

    @staticmethod
    def convert_row_properties(properties) -> str:
        styles = []
        if properties.trHeight:
            styles.append(f"height:{properties.trHeight}px;")
        if properties.tblHeader:
            styles.append("font-weight:bold;")
        return " ".join(styles)

    @staticmethod
    def convert_cells(cells) -> list:
        cell_elements = []
        for cell in cells:
            td = etree.Element("td")
            cell_properties_html = TableConverter.convert_cell_properties(cell.properties)
            td.set("style", cell_properties_html)
            
            for paragraph in cell.paragraphs:
                paragraph_html = ParagraphConverter.convert_paragraph(paragraph, None)  # Adjust numbering_schema as needed
                td.append(html.fragment_fromstring(paragraph_html))
            
            cell_elements.append(td)
        return cell_elements

    @staticmethod
    def convert_cell_properties(properties) -> str:
        styles = []
        if properties.tcW:
            styles.append(f"width:{properties.tcW.width}px;")
        if properties.tcBorders:
            if properties.tcBorders.top:
                styles.append(f"border-top:{properties.tcBorders.top.size}px {properties.tcBorders.top.val} #{properties.tcBorders.top.color};")
            if properties.tcBorders.left:
                styles.append(f"border-left:{properties.tcBorders.left.size}px {properties.tcBorders.left.val} #{properties.tcBorders.left.color};")
            if properties.tcBorders.bottom:
                styles.append(f"border-bottom:{properties.tcBorders.bottom.size}px {properties.tcBorders.bottom.val} #{properties.tcBorders.bottom.color};")
            if properties.tcBorders.right:
                styles.append(f"border-right:{properties.tcBorders.right.size}px {properties.tcBorders.right.val} #{properties.tcBorders.right.color};")
        if properties.shd:
            styles.append(f"background-color:#{properties.shd.fill};")
        return " ".join(styles)
