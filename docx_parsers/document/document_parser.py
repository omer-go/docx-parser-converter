import json
from typing import Optional, List, Union
from lxml import etree
from docx_parsers.helpers.common_helpers import NAMESPACE
from docx_parsers.utils import extract_xml_root_from_docx, read_binary_from_file_path
from docx_parsers.models.document_models import DocumentSchema, Paragraph, DocMargins
from docx_parsers.models.table_models import Table
from docx_parsers.document.margins_parser import MarginsParser
from docx_parsers.document.paragraph_parser import ParagraphParser
from docx_parsers.tables.tables_parser import TablesParser

class DocumentParser:
    def __init__(self, docx_file: Optional[bytes] = None):
        """
        Initializes the DocumentParser with the given DOCX file.

        Args:
            docx_file (Optional[bytes]): The binary content of the DOCX file.
        """
        if docx_file:
            self.root = extract_xml_root_from_docx(docx_file, 'document.xml')
            self.document_schema = self.parse()
        else:
            self.root = None
            self.document_schema = None

    def parse(self) -> DocumentSchema:
        """
        Parses the document XML into a DocumentSchema.

        Returns:
            DocumentSchema: The parsed document schema.
        """
        elements = self.extract_elements()
        margins = self.extract_margins()
        return DocumentSchema(elements=elements, doc_margins=margins)

    def extract_elements(self) -> List[Union[Paragraph, Table]]:
        """
        Extracts elements (paragraphs and tables) from the document XML.

        Returns:
            List[Union[Paragraph, Table]]: The list of extracted elements.
        """
        elements = []
        paragraph_parser = ParagraphParser()
        for child in self.root.find(".//w:body", namespaces=NAMESPACE):
            if child.tag.endswith("p"):
                elements.append(paragraph_parser.parse(child))
            elif child.tag.endswith("tbl"):
                tables_parser = TablesParser(child)
                elements.append(tables_parser.parse())
        return elements

    def extract_margins(self) -> Optional[DocMargins]:
        """
        Extracts margins from the document XML.

        Returns:
            Optional[Margins]: The extracted margins or None if not found.
        """
        sectPr = self.root.find(".//w:body//w:sectPr", namespaces=NAMESPACE)
        if sectPr is not None:
            return MarginsParser().parse(sectPr)
        return None

    def get_document_schema(self) -> DocumentSchema:
        """
        Gets the parsed document schema.

        Returns:
            DocumentSchema: The document schema.
        """
        return self.document_schema


if __name__ == "__main__":
    # docx_path = "C:/Users/omerh/Desktop/file-sample_1MB.docx"
    docx_path = "C:/Users/omerh/Desktop/new_docx.docx"

    docx_file = read_binary_from_file_path(docx_path)
    document_parser = DocumentParser(docx_file)
    document_schema = document_parser.get_document_schema()

    # # Iterate over the elements in the document schema and print them
    # for element in document_schema.elements:
    #     if isinstance(element, Paragraph):
    #         print("Paragraph:")
    #         # print(json.dumps(element.model_dump(exclude_none=True), indent=2))
    #     elif isinstance(element, Table):
    #         print("Table:")
    #         # print(json.dumps(element.model_dump(exclude_none=True), indent=2))

    # Output or further process the filtered schema as needed
    filtered_schema_dict = document_schema.doc_margins.model_dump(exclude_none=True)
    print(json.dumps(filtered_schema_dict, indent=2))