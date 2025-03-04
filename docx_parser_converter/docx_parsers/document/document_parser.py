import json
from typing import Optional, List, Union
from docx_parser_converter.docx_parsers.helpers.common_helpers import NAMESPACE
from docx_parser_converter.docx_parsers.utils import extract_xml_root_from_docx, read_binary_from_file_path, extract_xml_root_from_string
from docx_parser_converter.docx_parsers.models.paragraph_models import Paragraph
from docx_parser_converter.docx_parsers.models.document_models import DocumentSchema, DocMargins
from docx_parser_converter.docx_parsers.models.table_models import Table
from docx_parser_converter.docx_parsers.document.margins_parser import MarginsParser
from docx_parser_converter.docx_parsers.document.paragraph_parser import ParagraphParser
from docx_parser_converter.docx_parsers.tables.tables_parser import TablesParser

class DocumentParser:
    """
    Parses the main document.xml part of a DOCX file.

    This class handles the extraction and parsing of the document.xml file
    within a DOCX file, converting it into a structured DocumentSchema.
    """

    def __init__(self, source: Optional[Union[bytes, str]] = None):
        """
        Initializes the DocumentParser with the given DOCX file or document XML content.

        Args:
            source (Optional[Union[bytes, str]]): Either the binary content of the DOCX file
                                                 or the document.xml content as a string.
        """
        if source:
            if isinstance(source, bytes):
                self.root = extract_xml_root_from_docx(source, 'document.xml')
            else:  # string
                self.root = extract_xml_root_from_string(source)
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

        Example:
            The following is an example of the body element in a document.xml file:

            .. code-block:: xml

                <w:body>
                    <w:p>
                        <!-- Paragraph properties and content here -->
                    </w:p>
                    <w:tbl>
                        <!-- Table properties and content here -->
                    </w:tbl>
                </w:body>
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
            Optional[DocMargins]: The extracted margins or None if not found.

        Example:
            The following is an example of the section properties with margins in a document.xml file:

            .. code-block:: xml

                <w:sectPr>
                    <w:pgMar w:left="1134" w:right="1134" w:gutter="0" w:header="0" w:top="1134" w:footer="0" w:bottom="1134"/>
                </w:sectPr>
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
    # Example usage of the DocumentParser
    docx_path = "C:/Users/omerh/Desktop/Docx Test Files/file-sample_1MB.docx"
    # docx_path = "C:/Users/omerh/Desktop/new_docx.docx"
    # docx_path = "C:/Users/omerh/Desktop/docx_test.docx"

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
    filtered_schema_dict = document_schema.model_dump(exclude_none=True)
    print(json.dumps(filtered_schema_dict, indent=2))
