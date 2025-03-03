"""
Module for converting tables to plain text format.
"""
from docx_parser_converter.docx_parsers.models.table_models import Table, TableRow, TableCell
from docx_parser_converter.docx_to_txt.converters.paragraph_converter import ParagraphConverter


class TableConverter:
    """
    Class to convert tables to plain text format.
    """

    @staticmethod
    def convert_table(table: Table, numbering_schema=None, indent: bool = False) -> str:
        """
        Convert a table to plain text format.

        Args:
            table (Table): The table to convert.
            numbering_schema: The numbering schema to use for paragraphs within the table.
            indent (bool): Whether to apply indentation to paragraphs within the table.

        Returns:
            str: Plain text representation of the table.
        """
        if not table or not table.rows:
            return ""

        table_text = ""
        
        # Add a newline before the table
        table_text += "\n"
        
        # Process each row
        for row_index, row in enumerate(table.rows):
            row_text = TableConverter.convert_row(row, numbering_schema, indent)
            table_text += row_text
            
            # Add a separator line between rows
            if row_index < len(table.rows) - 1:
                table_text += "\n"
        
        # Add a newline after the table
        table_text += "\n"
        
        return table_text

    @staticmethod
    def convert_row(row: TableRow, numbering_schema=None, indent: bool = False) -> str:
        """
        Convert a table row to plain text format.

        Args:
            row (TableRow): The table row to convert.
            numbering_schema: The numbering schema to use for paragraphs within the row.
            indent (bool): Whether to apply indentation to paragraphs within the row.

        Returns:
            str: Plain text representation of the row.
        """
        if not row or not row.cells:
            return ""

        row_text = ""
        
        # Process each cell
        for cell_index, cell in enumerate(row.cells):
            cell_text = TableConverter.convert_cell(cell, numbering_schema, indent)
            
            # Add cell text
            row_text += cell_text
            
            # Add a separator between cells
            if cell_index < len(row.cells) - 1:
                row_text += " | "
        
        return row_text

    @staticmethod
    def convert_cell(cell: TableCell, numbering_schema=None, indent: bool = False) -> str:
        """
        Convert a table cell to plain text format.

        Args:
            cell (TableCell): The table cell to convert.
            numbering_schema: The numbering schema to use for paragraphs within the cell.
            indent (bool): Whether to apply indentation to paragraphs within the cell.

        Returns:
            str: Plain text representation of the cell.
        """
        if not cell or not cell.paragraphs:
            return ""

        cell_text = ""
        
        # Process each paragraph in the cell
        for para_index, paragraph in enumerate(cell.paragraphs):
            para_text = ParagraphConverter.convert_paragraph(paragraph, numbering_schema, indent)
            cell_text += para_text
            
            # Add a space between paragraphs in the same cell
            if para_index < len(cell.paragraphs) - 1:
                cell_text += " "
        
        return cell_text
