from typing import Optional
from docx_parsers.models.document_models import DocumentSchema, Paragraph
from docx_parsers.models.styles_models import StylesSchema, Style, ParagraphStyleProperties
from docx_parsers.models.numbering_models import NumberingSchema
from docx_parsers.document.document_parser import DocumentParser
from docx_parsers.styles.styles_parser import StylesParser
from docx_parsers.numbering.numbering_parser import NumberingParser
from docx_parsers.utils import read_binary_from_file_path, merge_properties
from docx_parsers.models.table_models import Table
import json


class StyleMerger:
    """
    A class to merge styles from styles.xml and numbering.xml into the document schema from document.xml.
    This involves resolving based-on styles, applying numbering properties, and applying default properties.

    Rules of Inheritance:
    1. Styles Inheritance:
        - Styles defined in styles.xml can be based on other styles.
        - Properties from the base styles are inherited unless overridden in the inheriting style.
        - This is resolved using the `resolve_based_on_styles` method.

    2. Numbering Properties:
        - Numbering definitions in numbering.xml can specify properties such as indentation.
        - These properties are applied to paragraphs that have associated numbering.
        - This is handled by the `apply_numbering_properties` method.

    3. Default Properties:
        - Default properties can be specified in styles.xml for paragraphs and runs.
        - These defaults are applied last, filling in any missing properties.
        - This is handled by the `apply_default_properties` method.
    """

    def __init__(self, document_schema: DocumentSchema, styles_schema: StylesSchema, numbering_schema: NumberingSchema):
        """
        Initializes the StyleMerger with document schema, styles schema, and numbering schema.
        
        Args:
            document_schema (DocumentSchema): The schema containing elements from document.xml.
            styles_schema (StylesSchema): The schema containing styles and defaults from styles.xml.
            numbering_schema (NumberingSchema): The schema containing numbering definitions from numbering.xml.
        """
        self.document_schema = document_schema
        self.styles_schema = styles_schema
        self.numbering_schema = numbering_schema
        self.resolve_based_on_styles()
        self.merge_styles()

    def resolve_based_on_styles(self):
        """
        Resolves styles that are based on other styles by merging their properties.
        This ensures that all properties from the base styles are inherited correctly.
        
        Inheritance Rule:
        - For each style that is based on another style (base style), merge the properties of the base style into the inheriting style.
        - This process continues recursively for styles based on other styles.
        """
        for style in self.styles_schema.styles:
            base_style_id = style.based_on
            while base_style_id:
                base_style = self.find_style(base_style_id)
                if not base_style:
                    break
                style.paragraph_properties = merge_properties(style.paragraph_properties, base_style.paragraph_properties)
                style.run_properties = merge_properties(style.run_properties, base_style.run_properties)
                base_style_id = base_style.based_on

    def merge_styles(self):
        """
        Merges styles into the document schema.
        This involves applying numbering properties, style properties, and default properties.
        
        Inheritance Rule:
        - Apply numbering properties first if the paragraph has associated numbering.
        - Then apply style properties defined in styles.xml.
        - Finally, apply default properties defined in styles.xml.
        """
        for element in self.document_schema.elements:
            if isinstance(element, Paragraph):
                self.merge_paragraph_styles(element)
            elif isinstance(element, Table):
                for row in element.rows:
                    for cell in row.cells:
                        for paragraph in cell.paragraphs:
                            self.merge_paragraph_styles(paragraph)

    def merge_paragraph_styles(self, paragraph: Paragraph):
        """
        Merges styles into a paragraph.
        
        Args:
            paragraph (Paragraph): The paragraph to merge styles into.
        """
        if paragraph.numbering:
            self.apply_numbering_properties(paragraph)
        self.apply_style_properties(paragraph)
        self.apply_default_properties(paragraph)

    def apply_numbering_properties(self, paragraph: Paragraph):
        """
        Applies numbering properties to a paragraph.
        
        Numbering Inheritance Rule:
        - If a paragraph has associated numbering, merge the numbering properties (e.g., indentation) from numbering.xml.
        
        Args:
            paragraph (Paragraph): The paragraph to apply numbering properties to.
        """
        num_id = paragraph.numbering.numId
        ilvl = paragraph.numbering.ilvl
        numbering_instance = next((instance for instance in self.numbering_schema.instances if instance.numId == num_id), None)
        if numbering_instance:
            numbering_level = next((level for level in numbering_instance.levels if level.ilvl == ilvl), None)
            if numbering_level:
                paragraph.properties = merge_properties(paragraph.properties, ParagraphStyleProperties(indent=numbering_level.indent))

    def apply_style_properties(self, paragraph: Paragraph):
        """
        Applies style properties to a paragraph.
        
        Style Inheritance Rule:
        - If a paragraph has a style_id, merge the properties from the corresponding style in styles.xml.
        
        Args:
            paragraph (Paragraph): The paragraph to apply style properties to.
        """
        if paragraph.properties.style_id:
            style = self.find_style(paragraph.properties.style_id)
            if style:
                paragraph.properties = merge_properties(paragraph.properties, style.paragraph_properties)
                for run in paragraph.runs:
                    run.properties = merge_properties(run.properties, style.run_properties)

    def find_style(self, style_id: str) -> Optional[Style]:
        """
        Finds a style by its ID.
        
        Args:
            style_id (str): The ID of the style to find.
        
        Returns:
            Optional[Style]: The found style, or None if not found.
        """
        for style in self.styles_schema.styles:
            if style.style_id == style_id:
                return style
        return None

    def apply_default_properties(self, paragraph: Paragraph):
        """
        Applies default properties to a paragraph.
        This includes applying the default paragraph style and document default properties.
        
        Default Properties Inheritance Rule:
        - If a paragraph does not have a style_id, apply the default paragraph style properties.
        - Merge the document default properties (doc_defaults_ppr for paragraphs and doc_defaults_rpr for runs) last to ensure all properties are filled.
        
        Args:
            paragraph (Paragraph): The paragraph to apply default properties to.
        """
        if not paragraph.properties.style_id and self.styles_schema.style_type_defaults.paragraph:
            default_paragraph_style = self.find_style(self.styles_schema.style_type_defaults.paragraph)
            if default_paragraph_style:
                paragraph.properties = merge_properties(paragraph.properties, default_paragraph_style.paragraph_properties)
                for run in paragraph.runs:
                    run.properties = merge_properties(run.properties, default_paragraph_style.run_properties)

        paragraph.properties = merge_properties(paragraph.properties, self.styles_schema.doc_defaults_ppr)
        for run in paragraph.runs:
            run.properties = merge_properties(run.properties, self.styles_schema.doc_defaults_rpr)


if __name__ == "__main__":
    # docx_path = "C:/Users/omerh/Desktop/Postmoney Safe - MFN Only - FINAL.docx"
    docx_path = "C:/Users/omerh/Desktop/file-sample_1MB.docx"
    docx_file = read_binary_from_file_path(docx_path)
    
    styles_parser = StylesParser(docx_file)
    styles_schema = styles_parser.get_styles_schema()
    
    document_parser = DocumentParser(docx_file)
    document_schema = document_parser.get_document_schema()
    
    numbering_parser = NumberingParser(docx_file)
    numbering_schema = numbering_parser.get_numbering_schema()
    
    style_merger = StyleMerger(document_schema, styles_schema, numbering_schema)

    # Print the properties of all table cells
    for element in document_schema.elements:
        if isinstance(element, Table):
            for row in element.rows:
                for cell in row.cells:
                    print("TableCell properties:")
                    print(json.dumps(cell.model_dump(exclude_none=True), indent=2))
    
    # filtered_schema_dict = style_merger.document_schema.model_dump(exclude_none=True)
    # print(json.dumps(filtered_schema_dict, indent=2))
