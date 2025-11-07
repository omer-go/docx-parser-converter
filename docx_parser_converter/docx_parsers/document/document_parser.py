import json
from typing import Optional, List, Union, Dict
from docx_parser_converter.docx_parsers.helpers.common_helpers import NAMESPACE
from docx_parser_converter.docx_parsers.utils import (
    extract_xml_root_from_docx, 
    read_binary_from_file_path, 
    extract_xml_root_from_string,
    extract_relationships_from_docx,
    extract_image_from_docx,
    encode_image_to_base64,
    get_image_mime_type
)
from docx_parser_converter.docx_parsers.models.paragraph_models import Paragraph, ImageContent
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
        self.docx_file = None
        self.relationships = {}
        
        if source:
            if isinstance(source, bytes):
                self.docx_file = source
                self.root = extract_xml_root_from_docx(source, 'document.xml')
                self.relationships = extract_relationships_from_docx(source)
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
        document_schema = DocumentSchema(elements=elements, doc_margins=margins)
        
        # Process images if we have the docx file
        if self.docx_file and self.relationships:
            self.process_images(document_schema)
        
        return document_schema

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

    def process_images(self, document_schema: DocumentSchema) -> None:
        """
        Processes images in the document by extracting their binary data and encoding as base64.
        
        Args:
            document_schema (DocumentSchema): The document schema to process.
        
        This method iterates through all paragraphs and their runs to find ImageContent,
        then extracts the actual image data from the DOCX file and encodes it as base64.
        """
        for element in document_schema.elements:
            if isinstance(element, Paragraph):
                self._process_paragraph_images(element)
            elif isinstance(element, Table):
                # Process images in table cells
                for row in element.rows:
                    for cell in row.cells:
                        for cell_element in cell.elements:
                            if isinstance(cell_element, Paragraph):
                                self._process_paragraph_images(cell_element)
    
    def _process_paragraph_images(self, paragraph: Paragraph) -> None:
        """
        Processes images in a single paragraph.
        
        Args:
            paragraph (Paragraph): The paragraph to process.
        """
        for run in paragraph.runs:
            for content in run.contents:
                if isinstance(content.run, ImageContent):
                    self._load_image_data(content.run)
    
    def _load_image_data(self, image_content: ImageContent) -> None:
        """
        Loads the binary image data and encodes it as base64.
        
        Args:
            image_content (ImageContent): The image content to load data for.
        """
        # Get the image path from the relationship
        image_path = self.relationships.get(image_content.rId)
        if not image_path:
            return
        
        # Extract the image binary data
        image_data = extract_image_from_docx(self.docx_file, image_path)
        if not image_data:
            return
        
        # Encode as base64
        mime_type = get_image_mime_type(image_path)
        image_content.image_data = encode_image_to_base64(image_data, mime_type)

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
