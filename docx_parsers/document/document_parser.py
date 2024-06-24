# document_parser.py

import json
from typing import Optional, List
from docx_parsers.helpers.common_helpers import extract_element, NAMESPACE
from docx_parsers.utils import extract_xml_root_from_docx, read_binary_from_file_path
from docx_parsers.models.document_models import DocumentSchema, Paragraph
from docx_parsers.document.margins_parser import MarginsParser
from docx_parsers.document.paragraph_parser import ParagraphParser

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
        sectPr = extract_element(self.root, ".//w:sectPr")
        margins = MarginsParser().parse(sectPr)
        paragraphs = self.extract_paragraphs()
        return DocumentSchema(paragraphs=paragraphs, margins=margins)

    def extract_paragraphs(self) -> List[Paragraph]:
        """
        Extracts paragraphs from the document XML.

        Returns:
            List[Paragraph]: The list of extracted paragraphs.
        """
        paragraphs = []
        paragraph_parser = ParagraphParser()
        for p in self.root.findall(".//w:p", namespaces=NAMESPACE):
            paragraphs.append(paragraph_parser.parse(p))
        return paragraphs

    def get_document_schema(self) -> DocumentSchema:
        """
        Gets the parsed document schema.

        Returns:
            DocumentSchema: The document schema.
        """
        return self.document_schema


if __name__ == "__main__":
    # docx_path = "C:/Users/omerh/Desktop/Postmoney Safe - MFN Only - FINAL.docx"
    docx_path = "C:/Users/omerh/Desktop/file-sample_1MB.docx"

    docx_file = read_binary_from_file_path(docx_path)
    document_parser = DocumentParser(docx_file)
    document_schema = document_parser.get_document_schema()

    # Convert the document schema to a dictionary excluding null properties
    filtered_schema_dict = document_schema.model_dump(exclude_none=True)

    # Output or further process the filtered schema as needed
    print(json.dumps(filtered_schema_dict, indent=2))
