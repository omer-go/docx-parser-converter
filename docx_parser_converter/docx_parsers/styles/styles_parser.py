from typing import Optional, Union
import xml.etree.ElementTree as ET
from docx_parser_converter.docx_parsers.utils import extract_xml_root_from_docx, read_binary_from_file_path, extract_xml_root_from_string
from docx_parser_converter.docx_parsers.helpers.common_helpers import extract_element, extract_attribute, NAMESPACE
from docx_parser_converter.docx_parsers.models.styles_models import StylesSchema, Style, StyleDefaults
from docx_parser_converter.docx_parsers.styles.paragraph_properties_parser import ParagraphPropertiesParser
from docx_parser_converter.docx_parsers.styles.run_properties_parser import RunPropertiesParser
import json


class StylesParser:
    """
    A parser for extracting styles from a DOCX file.
    """

    def __init__(self, source: Optional[Union[bytes, str]] = None):
        """
        Initializes the StylesParser.

        Args:
            source (Optional[Union[bytes, str]]): Either the DOCX file as bytes or the styles.xml content as a string. Defaults to None.
        """
        if source:
            if isinstance(source, bytes):
                self.root = extract_xml_root_from_docx(source, 'styles.xml')
            else:  # string
                self.root = extract_xml_root_from_string(source)
            self.styles_schema = self.parse()
        else:
            self.root = None
            self.styles_schema = None

    def parse(self) -> StylesSchema:
        """
        Parses the styles XML and returns the StylesSchema.

        Returns:
            StylesSchema: The parsed styles schema.

        Example:
            The following is an example of a styles element in a styles.xml file:

            .. code-block:: xml

                <w:styles>
                    <w:style w:styleId="Heading1" w:type="paragraph">
                        <w:name w:val="heading 1"/>
                        <w:basedOn w:val="Normal"/>
                        <w:pPr>
                            <w:spacing w:before="240" w:after="240" w:line="360"/>
                        </w:pPr>
                        <w:rPr>
                            <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                        </w:rPr>
                    </w:style>
                    <w:docDefaults>
                        <w:rPrDefault>
                            <w:rPr>
                                <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                                <w:sz w:val="22"/>
                            </w:rPr>
                        </w:rPrDefault>
                        <w:pPrDefault>
                            <w:pPr>
                                <w:spacing w:before="120" w:after="120"/>
                            </w:pPr>
                        </w:pPrDefault>
                    </w:docDefaults>
                </w:styles>
        """
        styles = []

        doc_defaults_rpr = self.extract_doc_defaults_rpr(self.root)
        doc_defaults_ppr = self.extract_doc_defaults_ppr(self.root)
        style_type_defaults = self.extract_style_type_defaults(self.root)

        for style in self.root.findall(".//w:style", namespaces=NAMESPACE):
            styles.append(self.extract_style(style))

        styles_schema = StylesSchema(
            styles=styles,
            style_type_defaults=style_type_defaults,
            doc_defaults_rpr=doc_defaults_rpr,
            doc_defaults_ppr=doc_defaults_ppr
        )
        return styles_schema

    def extract_doc_defaults_rpr(self, root) -> RunPropertiesParser:
        """
        Extracts the default run properties from the styles XML.

        Args:
            root (ET.Element): The root element of the styles XML.

        Returns:
            RunPropertiesParser: The parsed default run properties.

        Example:
            The following is an example of default run properties in a styles.xml file:

            .. code-block:: xml

                <w:docDefaults>
                    <w:rPrDefault>
                        <w:rPr>
                            <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                            <w:sz w:val="22"/>
                        </w:rPr>
                    </w:rPrDefault>
                </w:docDefaults>
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

        Example:
            The following is an example of default paragraph properties in a styles.xml file:

            .. code-block:: xml

                <w:docDefaults>
                    <w:pPrDefault>
                        <w:pPr>
                            <w:spacing w:before="120" w:after="120"/>
                        </w:pPr>
                    </w:pPrDefault>
                </w:docDefaults>
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

        Example:
            The following is an example of default styles in a styles.xml file:

            .. code-block:: xml

                <w:styles>
                    <w:style w:styleId="DefaultParagraphFont" w:type="character" w:default="1">
                        <w:name w:val="Default Paragraph Font"/>
                    </w:style>
                    <w:style w:styleId="Normal" w:type="paragraph" w:default="1">
                        <w:name w:val="Normal"/>
                    </w:style>
                </w:styles>
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

        Example:
            The following is an example of a style element in a styles.xml file:

            .. code-block:: xml

                <w:style w:styleId="Heading1" w:type="paragraph">
                    <w:name w:val="heading 1"/>
                    <w:basedOn w:val="Normal"/>
                    <w:pPr>
                        <w:spacing w:before="240" w:after="240" w:line="360"/>
                    </w:pPr>
                    <w:rPr>
                        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                    </w:rPr>
                </w:style>
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

    def get_styles_schema(self) -> StylesSchema:
        """
        Returns the parsed styles schema.

        Returns:
            StylesSchema: The parsed styles schema.
        """
        return self.styles_schema


if __name__ == "__main__":
    # docx_path = "C:/Users/omerh/Desktop/Postmoney Safe - MFN Only - FINAL.docx"
    # docx_path = "C:/Users/omerh/Desktop/file-sample_1MB.docx"
    docx_path = "C:/Projects/Docx-html-txt-converter/docx_html_txt/docx_parser_converter_ts/tests/fixtures/minimal_for_test.docx"
    docx_file = read_binary_from_file_path(docx_path)

    styles_parser = StylesParser(docx_file)
    styles_schema = styles_parser.get_styles_schema()

    filtered_schema_dict = styles_schema.model_dump(exclude_none=True)
    output_path = "C:/Projects/Docx-html-txt-converter/docx_html_txt/docx_parser_converter_ts/tests/python_outputs/minimal_for_test_styles_schema.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(filtered_schema_dict, f, indent=2)
    print(f"JSON output saved to: {output_path}")
