from typing import Optional
from docx_parsers.document_parser import DocumentParser, DocumentSchema, Paragraph
from docx_parsers.styles_parser import StylesParser, StylesSchema, Style, ParagraphStyleProperties, RunStyleProperties
from docx_parsers.numbering_parser import NumberingParser, NumberingSchema
from docx_parsers.utils import read_binary_from_file_path, merge_properties 
import json

class StyleMerger:
    def __init__(self, document_schema: DocumentSchema, styles_schema: StylesSchema, numbering_schema: NumberingSchema):
        self.document_schema = document_schema
        self.styles_schema = styles_schema
        self.numbering_schema = numbering_schema
        self.merge_styles()

    def merge_styles(self):
        for paragraph in self.document_schema.paragraphs:
            # Apply numbering properties if applicable
            if paragraph.numbering:
                self.apply_numbering_properties(paragraph)

            # Apply style properties from styles.xml
            self.apply_style_properties(paragraph)

            # Apply default properties lastly
            self.apply_default_properties(paragraph)

    def apply_numbering_properties(self, paragraph: Paragraph):
        num_id = paragraph.numbering.numId
        ilvl = paragraph.numbering.ilvl

        # Find the corresponding numbering instance and level
        numbering_instance = next((instance for instance in self.numbering_schema.instances if instance.numId == num_id), None)
        if numbering_instance:
            numbering_level = next((level for level in numbering_instance.levels if level.ilvl == ilvl), None)
            if numbering_level:
                # Apply indentation from numbering if paragraph indentation is None
                paragraph.properties = merge_properties(paragraph.properties, ParagraphStyleProperties(indent=numbering_level.indent))

    def apply_style_properties(self, paragraph: Paragraph):
        if paragraph.properties.style_id:
            style = self.find_style(paragraph.properties.style_id)
            if style:
                paragraph.properties = merge_properties(paragraph.properties, style.paragraph_properties)
                for run in paragraph.runs:
                    run.properties = merge_properties(run.properties, style.run_properties)

    def find_style(self, style_id: str) -> Optional[Style]:
        for style in self.styles_schema.styles:
            if style.style_id == style_id:
                return style
        return None

    def apply_default_properties(self, paragraph: Paragraph):
        if not paragraph.properties.style_id and self.styles_schema.defaults.paragraph:
            default_paragraph_style = self.find_style(self.styles_schema.defaults.paragraph)
            if default_paragraph_style:
                paragraph.properties = merge_properties(paragraph.properties, default_paragraph_style.paragraph_properties)
                # print("Default Style:", default_paragraph_style.model_dump(exclude_none=True))
                # print("Merged:", paragraph.properties.model_dump(exclude_none=True))
                for run in paragraph.runs:
                    run.properties = merge_properties(run.properties, default_paragraph_style.run_properties)

        paragraph.properties = merge_properties(paragraph.properties, self.styles_schema.default_ppr)
        for run in paragraph.runs:
            run.properties = merge_properties(run.properties, self.styles_schema.default_rpr)

if __name__ == "__main__":
    # docx_path = "C:/Users/omerh/Desktop/new_docx.docx"
    # docx_path = "C:/Users/omerh/Desktop/file-sample_1MB.docx"
    docx_path = "C:/Users/omerh/Desktop/Postmoney Safe - MFN Only - FINAL.docx"

    docx_file = read_binary_from_file_path(docx_path)
    styles_parser = StylesParser(docx_file)
    styles_schema = styles_parser.get_styles_schema()
    document_parser = DocumentParser(docx_file)
    document_schema = document_parser.get_document_schema()
    numbering_parser = NumberingParser(docx_file)
    numbering_schema = numbering_parser.get_numbering_schema()

    # Create an instance of StyleMerger and merge the styles
    style_merger = StyleMerger(document_schema, styles_schema, numbering_schema)

    filtered_schema_dict = style_merger.document_schema.model_dump(exclude_none=True)

    # Output or further process the merged document schema as needed
    print(json.dumps(filtered_schema_dict, indent=2))
