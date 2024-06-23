import os
from docx_parsers.document_parser import Paragraph, Run, DocumentParser, TextContent, TabContent
from docx_parsers.styles_parser import ParagraphStyleProperties, RunStyleProperties, StylesParser, FontProperties, SpacingProperties, IndentationProperties, TabStop
from docx_parsers.numbering_parser import NumberingParser, NumberingLevel
from docx_parsers.styles_merger import StyleMerger
from docx_parsers.utils import read_binary_from_file_path


class DocxToHtmlConverter:
    """
    Class to convert a DOCX file to HTML.

    Attributes:
        docx_file: Binary DOCX file object.
        document_schema: Merged DocumentSchema with styles applied.
        numbering_schema: NumberingSchema for handling numbering.
        html_content: String to store the generated HTML content.
        numbering_counters: Dictionary to maintain counters for each numbering level.
        use_default_values: Boolean to determine if default values should be used for missing properties.
    """

    def __init__(self, docx_file: bytes, use_default_values: bool = True):
        """
        Initialize the converter with the binary DOCX file and process it.

        Args:
            docx_file: Binary DOCX file object.
            use_default_values: Boolean to determine if default values should be used for missing properties.
        """
        self.docx_file = docx_file
        self.document_schema = None
        self.numbering_schema = None
        self.html_content = ""
        self.numbering_counters = {}  # To maintain counters for each numbering level
        self.use_default_values = use_default_values
        self.process_docx(docx_file)

    def process_docx(self, docx_file: bytes) -> None:
        """
        Process the DOCX file, parse its components, and merge the styles.

        Args:
            docx_file: Binary DOCX file object.
        """
        styles_schema = None
        numbering_schema = None
        try:
            styles_parser = StylesParser(docx_file)
            styles_schema = styles_parser.get_styles_schema()
        except Exception as e:
            print(f"Warning: Failed to parse styles.xml. Using default styles schema. Error: {e}")
            styles_schema = self.get_default_styles_schema()

        try:
            numbering_parser = NumberingParser(docx_file)
            numbering_schema = numbering_parser.get_numbering_schema()
        except Exception as e:
            print(f"Warning: Failed to parse numbering.xml. Using default numbering schema. Error: {e}")
            numbering_schema = self.get_default_numbering_schema()

        try:
            document_parser = DocumentParser(docx_file)
            document_schema = document_parser.get_document_schema()
        except Exception as e:
            print(f"Error: Failed to parse document.xml. Conversion process cannot proceed. Error: {e}")
            raise

        style_merger = StyleMerger(
            document_schema,
            styles_schema,
            numbering_schema
        )
        self.document_schema = style_merger.document_schema
        self.numbering_schema = numbering_schema

    def get_default_styles_schema(self):
        """
        Returns a default styles schema with default values.
        """
        # TODO: Implement default styles schema
        pass

    def get_default_numbering_schema(self):
        """
        Returns a default numbering schema.
        """
        # TODO: Implement default numbering schema
        pass

    def convert_to_html(self) -> str:
        """
        Convert the merged DocumentSchema to an HTML string.

        Returns:
            str: HTML string representing the DOCX content.
        """
        self.html_content = "<html><body>"

        # Apply margins to the container div
        margins = self.document_schema.margins
        if margins:
            margin_style = f"padding-top:{margins.top_pt}pt; padding-right:{margins.right_pt}pt; padding-bottom:{margins.bottom_pt}pt; padding-left:{margins.left_pt}pt;"
            if margins.header_pt:
                margin_style += f" padding-top:{margins.header_pt}pt;"
            if margins.footer_pt:
                margin_style += f" padding-bottom:{margins.footer_pt}pt;"
            if margins.gutter_pt:
                margin_style += f" margin-left:{margins.gutter_pt}pt;"

            self.html_content += f'<div style="{margin_style}">'

        for paragraph in self.document_schema.paragraphs:
            self.html_content += self.convert_paragraph(paragraph)

        self.html_content += "</div></body></html>"
        return self.html_content

    def convert_paragraph(self, paragraph: Paragraph) -> str:
        """
        Convert a paragraph to an HTML <p> tag with styles.

        Args:
            paragraph: Paragraph object from DocumentSchema.

        Returns:
            str: HTML string for the paragraph.
        """
        paragraph_html = f"<p{self.convert_paragraph_properties(paragraph.properties)}>"
        if paragraph.numbering:
            paragraph_html += self.convert_numbering(paragraph)
        for run in paragraph.runs:
            paragraph_html += self.convert_run(run, paragraph)
        paragraph_html += "</p>"
        return paragraph_html

    def convert_paragraph_properties(self, properties: ParagraphStyleProperties) -> str:
        """
        Convert paragraph properties to corresponding CSS styles.

        Args:
            properties: ParagraphStyleProperties object.

        Returns:
            str: CSS styles string for the paragraph.
        """
        style = ""
        if properties.spacing:
            style += self.convert_spacing(properties.spacing)
        if properties.indent:
            style += self.convert_indent(properties.indent)
        if properties.justification:
            style += self.convert_justification(properties.justification)
        return f' style="{style}"' if style else ""

    def convert_run(self, run: Run, paragraph: Paragraph) -> str:
        """
        Convert a run to an HTML <span> tag with styles.

        Args:
            run: Run object from DocumentSchema.
            paragraph: Paragraph object containing the run.

        Returns:
            str: HTML string for the run.
        """
        run_html = f"<span{self.convert_run_properties(run.properties)}>"
        for content in run.contents:
            if isinstance(content.run, TabContent):
                tab_width = self.get_next_tab_width(paragraph)
                run_html += f'<span style="display:inline-block; width:{tab_width}pt;"></span>'
            elif isinstance(content.run, TextContent):
                run_html += content.run.text
        run_html += "</span>"
        return run_html
    
    def get_next_tab_width(self, paragraph: Paragraph) -> float:
        """
        Get the width of the next tab stop for the given paragraph.

        Args:
            paragraph: Paragraph object from DocumentSchema.

        Returns:
            float: Width of the next tab stop in points.
        """
        if paragraph.properties.tabs:
            for tab in paragraph.properties.tabs:
                # Return the position of the first tab stop found
                return tab.pos
        return 36.0  # Default to a reasonable width if no tab stop is found

    def convert_run_properties(self, properties: RunStyleProperties) -> str:
        """
        Convert run properties to corresponding CSS styles.

        Args:
            properties: RunStyleProperties object.

        Returns:
            str: CSS styles string for the run.
        """
        style = ""
        if properties.bold:
            style += self.convert_bold(properties.bold)
        if properties.italic:
            style += self.convert_italic(properties.italic)
        if properties.underline:
            style += self.convert_underline(properties.underline)
        if properties.color:
            style += self.convert_color(properties.color)
        if properties.font:
            style += self.convert_font(properties.font)
        if properties.size_pt:
            style += self.convert_size(properties.size_pt)
        # Add other properties as needed
        return f' style="{style}"' if style else ""

    def convert_bold(self, bold: bool) -> str:
        return "font-weight:bold;" if bold else ""

    def convert_italic(self, italic: bool) -> str:
        return "font-style:italic;" if italic else ""

    def convert_underline(self, underline: str) -> str:
        return "text-decoration:underline;" if underline else ""

    def convert_color(self, color: str) -> str:
        return f"color:{color};" if color else ""

    def convert_font(self, font: FontProperties) -> str:
        style = ""
        if font.ascii:
            style += f"font-family:{font.ascii};"
        # Add other font properties as needed
        return style

    def convert_size(self, size_pt: float) -> str:
        return f"font-size:{size_pt}pt;" if size_pt else ""

    def convert_spacing(self, spacing: SpacingProperties) -> str:
        style = ""
        if spacing.before_pt:
            style += f"margin-top:{spacing.before_pt}pt;"
        if spacing.after_pt:
            style += f"margin-bottom:{spacing.after_pt}pt;"
        if spacing.line_pt:
            style += f"line-height:{spacing.line_pt}pt;"
        return style

    #TODO: fix function to check that there's either hanging indent or firstline, but not both (maybe fix in the style merger) 
    def convert_indent(self, indent: IndentationProperties) -> str:
        style = ""
        if indent.left_pt is not None:
            style += f"margin-left:{indent.left_pt}pt;"
        if indent.hanging_pt is not None:
            style += f"text-indent:-{indent.hanging_pt}pt;"
        if indent.right_pt is not None:
            style += f"margin-right:{indent.right_pt}pt;"
        if indent.firstline_pt:
            style += f"text-indent:{indent.firstline_pt}pt;"
        # if indent.firstline_pt is not None and indent.left_pt is not None:
        #     style += f"text-indent:{indent.firstline_pt + indent.left_pt}pt;"
        # elif indent.firstline_pt is not None:
        #     style += f"text-indent:{indent.firstline_pt}pt;"
        return style

    def convert_justification(self, justification: str) -> str:
        """
        Convert justification property to corresponding CSS text-align style.

        Args:
            justification: Justification value from DOCX.

        Returns:
            str: CSS text-align style for the paragraph.
        """
        justification_map = {
            "left": "left",
            "center": "center",
            "right": "right",
            "both": "justify",
            "distribute": "justify"
            # Other types like highKashida, lowKashida, mediumKashida, thaiDistribute are ignored
        }
        return f"text-align:{justification_map.get(justification, 'left')};" if justification else ""

    def convert_numbering(self, paragraph: Paragraph) -> str:
        """
        Convert numbering properties to text representation and maintain counters.

        Args:
            paragraph: Paragraph object from DocumentSchema.

        Returns:
                str: Numbering text to prepend to the paragraph text.
        """
        numbering = paragraph.numbering
        level_key = (numbering.numId, numbering.ilvl)
        try:
            numbering_level = self.get_numbering_level(numbering.numId, numbering.ilvl)
        except ValueError as e:
            print(f"Warning: {e}")
            return self.bullet_point()  # Default bullet point for invalid numbering levels

        if level_key not in self.numbering_counters:
            self.numbering_counters[level_key] = numbering_level.start - 1
        self.numbering_counters[level_key] += 1
        counter = self.numbering_counters[level_key]

        if numbering_level.numFmt:
            numbering_text = self.format_number(counter, numbering_level.numFmt)
            lvlText = numbering_level.lvlText.replace(f"%{numbering.ilvl + 1}", numbering_text)

            # Get indentation properties in points
            indent_left_pt = numbering_level.indent.left_pt if numbering_level.indent and numbering_level.indent.left_pt else 0
            hanging_indent_pt = numbering_level.indent.hanging_pt if numbering_level.indent and numbering_level.indent.hanging_pt else 0

            # Calculate the length of the numbering text more accurately
            def get_char_width(char):
                if char.isdigit() or char.isalpha():
                    return 7.2  # Approximate width for letters and digits
                elif char in ('.', '(', ')'):
                    return 3.6  # Approximate width for punctuation characters
                return 7.2  # Default width for other characters

            numbering_text_length_pt = sum(get_char_width(c) for c in numbering_text)

            # Calculate the padding needed for the distance between numbering and text
            if numbering_level.tab_pt:
                net_padding = numbering_level.tab_pt - (indent_left_pt - hanging_indent_pt) - numbering_text_length_pt
                padding_style = f"padding-left:{max(net_padding, 7.2)}pt;"

                # Check for font properties
                if numbering_level.fonts and numbering_level.fonts.ascii:
                    font_style = f"font-family:{numbering_level.fonts.ascii};"
                    return f'<span style="{font_style}">{lvlText}</span><span style="{padding_style}"></span>'
                return f'<span>{lvlText}</span><span style="{padding_style}"></span>'

            # Check for font properties if there is no tab_pt
            if numbering_level.fonts and numbering_level.fonts.ascii:
                font_style = f"font-family:{numbering_level.fonts.ascii};"
                return f'<span style="{font_style}">{lvlText}</span><span style="padding-left:7.2pt;"></span>'
            
            return f'{lvlText}<span style="padding-left:7.2pt;"></span>'

        return ""


    def get_numbering_level(self, numId: int, ilvl: int) -> NumberingLevel:
        """
        Get the corresponding NumberingLevel from the NumberingSchema.

        Args:
            numId: Numbering ID.
            ilvl: Numbering level.

        Returns:
            NumberingLevel: The corresponding NumberingLevel object.
        """
        instance = next((inst for inst in self.numbering_schema.instances if inst.numId == numId), None)
        if instance:
            level = next((lvl for lvl in instance.levels if lvl.ilvl == ilvl), None)
            if level:
                return level
        raise ValueError(f"Numbering level not found for numId: {numId}, ilvl: {ilvl}")

    def format_number(self, counter: int, numFmt: str) -> str:
        """
        Convert the counter to the appropriate format based on numFmt.

        Args:
            counter: Current counter value.
            numFmt: Number format (e.g., decimal, lowerRoman).

        Returns:
            str: Formatted numbering text.
        """
        if numFmt == "decimal":
            return str(counter)
        elif numFmt == "lowerRoman":
            return self.to_roman(counter).lower()
        elif numFmt == "upperRoman":
            return self.to_roman(counter).upper()
        elif numFmt == "lowerLetter":
            return self.to_lower_letter(counter)
        elif numFmt == "upperLetter":
            return self.to_upper_letter(counter)
        elif numFmt == "bullet":
            return self.bullet_point()
        # Add other formats as needed
        return ""

    def to_roman(self, num: int) -> str:
        """
        Convert a number to its Roman numeral representation.

        Args:
            num: Number to convert.

        Returns:
            str: Roman numeral representation of the number.
        """
        val = [
            1000, 900, 500, 400,
            100, 90, 50, 40,
            10, 9, 5, 4,
            1
        ]
        syb = [
            "M", "CM", "D", "CD",
            "C", "XC", "L", "XL",
            "X", "IX", "V", "IV",
            "I"
        ]
        roman_num = ''
        i = 0
        while num > 0:
            for _ in range(num // val[i]):
                roman_num += syb[i]
                num -= val[i]
            i += 1
        return roman_num

    def to_upper_letter(self, num: int) -> str:
        """
        Convert a number to its upper letter representation.

        Args:
            num: Number to convert.

        Returns:
            str: Upper letter representation of the number.
        """
        return chr(64 + num)  # Convert 1 to 'A', 2 to 'B', etc.

    def to_lower_letter(self, num: int) -> str:
        """
        Convert a number to its lower letter representation.

        Args:
            num: Number to convert.

        Returns:
            str: Lower letter representation of the number.
        """
        return chr(96 + num)  # Convert 1 to 'a', 2 to 'b', etc.

    def bullet_point(self) -> str:
        """
        Return the bullet point character.

        Returns:
            str: Bullet point character.
        """
        return "•"  # Unicode for bullet point

    def insert_placeholder(self, element_type: str) -> str:
        """
        Insert placeholders for tables and images.

        Args:
            element_type: Type of element (e.g., "Table", "Image").

        Returns:
            str: Placeholder HTML string.
        """
        return f'<div class="placeholder">{element_type} Placeholder</div>'

    def save_html_to_file(self, html_content: str, output_path: str) -> None:
        """
        Save HTML content to a file.

        Args:
            html_content: HTML content as a string.
            output_path: Path to save the HTML file.
        """
        try:
            with open(output_path, 'w', encoding='utf-8') as file:
                file.write(html_content)
        except Exception as e:
            print(f"Error: Failed to save HTML file. Error: {e}")


if __name__ == "__main__":
    # Path to the DOCX file
    docx_path = "C:/Users/omerh/Desktop/Postmoney Safe - MFN Only - FINAL.docx"
    # docx_path = "C:/Users/omerh/Desktop/new_docx.docx"
    # docx_path = "C:/Users/omerh/Desktop/file-sample_1MB.docx"
    # docx_path = "C:/Users/omerh/Desktop/Employment-Contract-Template-Download-20201125.docx"
    html_output_path = "C:/Users/omerh/Desktop/new_docx.html"

    # Check if the file exists
    if not os.path.exists(docx_path):
        print(f"File not found: {docx_path}")
    else:
        # Read the DOCX file content
        try:
            docx_file_content = read_binary_from_file_path(docx_path)
        except Exception as e:
            print(f"Error: Failed to read DOCX file. Error: {e}")
        else:
            # Create an instance of the converter and process the DOCX file
            converter = DocxToHtmlConverter(docx_file_content, use_default_values=True)
            html_output = converter.convert_to_html()

            # Save the resulting HTML to a file
            converter.save_html_to_file(html_output, html_output_path)
            print(f"HTML file saved to: {html_output_path}")
