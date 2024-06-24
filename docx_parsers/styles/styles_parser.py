# styles_parser.py

from typing import Optional, Tuple
import xml.etree.ElementTree as ET
from docx_parsers.utils import extract_xml_root_from_docx, read_binary_from_file_path
from docx_parsers.helpers.common_helpers import extract_element, extract_attribute, NAMESPACE
from docx_parsers.models.styles_models import StylesSchema, Style, StyleDefaults
from docx_parsers.styles.paragraph_properties_parser import ParagraphPropertiesParser
from docx_parsers.styles.run_properties_parser import RunPropertiesParser
import json

class StylesParser:
    """
    A parser for extracting styles from a DOCX file.
    """

    def __init__(self, docx_file: Optional[bytes] = None):
        """
        Initializes the StylesParser.

        Args:
            docx_file (Optional[bytes]): The DOCX file as bytes. Defaults to None.
        """
        if docx_file:
            self.root = extract_xml_root_from_docx(docx_file, 'styles.xml')
            self.styles_schema = self.parse()
        else:
            self.root = None
            self.styles_schema = None

    def parse(self) -> StylesSchema:
        """
        Parses the styles XML and returns the StylesSchema.

        Returns:
            StylesSchema: The parsed styles schema.
        """
        styles = []

        doc_defaults_rpr = self.extract_doc_defaults_rpr(self.root)
        doc_defaults_ppr = self.extract_doc_defaults_ppr(self.root)
        style_type_defaults = self.extract_style_type_defaults(self.root)

        for style in self.root.findall(".//w:style", namespaces=NAMESPACE):
            styles.append(self.extract_style(style))

        styles_schema = StylesSchema(
            styles=styles,
            defaults=style_type_defaults,
            default_rpr=doc_defaults_rpr,
            default_ppr=doc_defaults_ppr
        )
        self.resolve_based_on_styles(styles_schema)
        return styles_schema

    def extract_doc_defaults_rpr(self, root) -> RunPropertiesParser:
        """
        Extracts the default run properties from the styles XML.

        Args:
            root (ET.Element): The root element of the styles XML.

        Returns:
            RunPropertiesParser: The parsed default run properties.
        """
        rPr_default = extract_element(root, ".//w:rPrDefault//w:rPr")
        return RunPropertiesParser().parse(rPr_default) if rPr_default is not None else RunPropertiesParser().parse(None)

    def extract_doc_defaults_ppr(self, root) -> ParagraphPropertiesParser:
        """
        Extracts the default paragraph properties from the styles XML.

        Args:
            root (ET.Element): The root element of the styles XML.

        Returns:
            ParagraphPropertiesParser: The parsed default paragraph properties.
        """
        pPr_default = extract_element(root, ".//w:pPrDefault//w:pPr")
        return ParagraphPropertiesParser().parse(pPr_default) if pPr_default is not None else ParagraphPropertiesParser().parse(None)

    def extract_style_type_defaults(self, root) -> StyleDefaults:
        """
        Extracts the default styles from the styles XML.

        Args:
            root (ET.Element): The root element of the styles XML.

        Returns:
            StyleDefaults: The extracted default styles.
        """
        defaults = StyleDefaults()

        for style in root.findall(".//w:style", namespaces=NAMESPACE):
            if extract_attribute(style, 'default') == "1":
                style_type = extract_attribute(style, 'type')
                style_id = extract_attribute(style, 'styleId') or 'Unknown StyleId'
                if style_type == "paragraph":
                    defaults.paragraph = style_id
                elif style_type == "character":
                    defaults.character = style_id
                elif style_type == "numbering":
                    defaults.numbering = style_id
                elif style_type == "table":
                    defaults.table = style_id

        return defaults

    def extract_style(self, style_element: ET.Element) -> Style:
        """
        Extracts a single style from the styles XML element.

        Args:
            style_element (ET.Element): The style XML element.

        Returns:
            Style: The extracted style.
        """
        style_id = extract_attribute(style_element, 'styleId') or 'Unknown StyleId'
        name_element = extract_element(style_element, ".//w:name")
        name = extract_attribute(name_element, 'val') if name_element is not None else 'Unknown Name'
        
        based_on_element = extract_element(style_element, ".//w:basedOn")
        based_on = extract_attribute(based_on_element, 'val') if based_on_element is not None else None
        
        paragraph_properties = ParagraphPropertiesParser().parse(extract_element(style_element, ".//w:pPr"))
        run_properties = RunPropertiesParser().parse(extract_element(style_element, ".//w:rPr"))

        return Style(
            style_id=style_id,
            name=name,
            based_on=based_on,
            paragraph_properties=paragraph_properties,
            run_properties=run_properties
        )

    def resolve_based_on_styles(self, styles_schema: StylesSchema) -> None:
        """
        Resolves the based-on styles, merging properties from base styles into derived styles.

        Args:
            styles_schema (StylesSchema): The styles schema to resolve.
        """
        styles_dict = {style.style_id: style for style in styles_schema.styles}

        def merge_properties(base_props, derived_props):
            if not base_props:
                return derived_props
            if not derived_props:
                return base_props
            base_dict = base_props.dict(exclude_unset=True)
            derived_dict = derived_props.dict(exclude_unset=True)
            merged_dict = {**base_dict, **derived_dict}
            return type(base_props)(**merged_dict)

        def resolve_style(style):
            if style.based_on:
                base_style = styles_dict.get(style.based_on)
                if base_style:
                    resolve_style(base_style)
                    style.paragraph_properties = merge_properties(base_style.paragraph_properties, style.paragraph_properties)
                    style.run_properties = merge_properties(base_style.run_properties, style.run_properties)

        for style in styles_schema.styles:
            resolve_style(style)
    
    def get_styles_schema(self) -> StylesSchema:
        """
        Returns the parsed styles schema.

        Returns:
            StylesSchema: The parsed styles schema.
        """
        return self.styles_schema


if __name__ == "__main__":
    docx_path = "C:/Users/omerh/Desktop/Postmoney Safe - MFN Only - FINAL.docx"

    docx_file = read_binary_from_file_path(docx_path)
    styles_parser = StylesParser(docx_file)

    # Convert the document schema to a dictionary excluding null properties
    filtered_schema_dict = styles_parser.get_styles_schema().model_dump(exclude_none=True)

    # Output or further process the filtered schema as needed
    print(json.dumps(filtered_schema_dict, indent=2))
