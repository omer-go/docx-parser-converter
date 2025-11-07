from docx_parser_converter.docx_parsers.models.paragraph_models import Run, Paragraph, TextContent, TabContent, ImageContent
from docx_parser_converter.docx_parsers.models.styles_models import RunStyleProperties
from docx_parser_converter.docx_to_html.converters.style_converter import StyleConverter
from docx_parser_converter.docx_parsers.utils import convert_emu_to_points
import html


class RunConverter:
    """
    A converter class for converting DOCX runs to HTML.
    """

    @staticmethod
    def convert_run(run: Run, paragraph: Paragraph) -> str:
        """
        Converts a run to its HTML representation.

        Args:
            run (Run): The run to convert.
            paragraph (Paragraph): The paragraph containing the run.

        Returns:
            str: The HTML representation of the run.

        Example:
            Given a run with bold text and a tab, the output HTML string might look like:

            .. code-block:: html

                <span style="font-weight:bold;">This is bold text</span>
                <span style="display:inline-block; width:36pt;"></span>
        """
        run_html = f"<span{RunConverter.convert_run_properties(run.properties)}>"
        for content in run.contents:
            if isinstance(content.run, TabContent):
                tab_width = RunConverter.get_next_tab_width(paragraph)
                run_html += f'<span style="display:inline-block; width:{tab_width}pt;"></span>'
            elif isinstance(content.run, TextContent):
                run_html += content.run.text
            elif isinstance(content.run, ImageContent):
                run_html += RunConverter.convert_image(content.run)
        run_html += "</span>"
        return run_html

    @staticmethod
    def get_next_tab_width(paragraph: Paragraph) -> float:
        """
        Gets the width of the next tab stop for the paragraph.

        Args:
            paragraph (Paragraph): The paragraph containing the tab stop.

        Returns:
            float: The width of the next tab stop in points.

        Example:
            The following gets the next tab width:

            .. code-block:: python

                tab_width = RunConverter.get_next_tab_width(paragraph)
                print(tab_width)  # Output: 36.0
        """
        if paragraph.properties.tabs:
            for tab in paragraph.properties.tabs:
                return tab.pos
        return 36.0

    @staticmethod
    def convert_run_properties(properties: RunStyleProperties) -> str:
        """
        Converts run properties to an HTML style attribute.

        Args:
            properties (RunStyleProperties): The run style properties to convert.

        Returns:
            str: The HTML style attribute representing the run properties.

        Example:
            The output style attribute might look like:

            .. code-block:: html

                ' style="font-weight:bold;font-style:italic;color:#FF0000;font-family:Arial;font-size:12pt;"'
        """
        style = ""
        if properties.bold:
            style += StyleConverter.convert_bold(properties.bold)
        if properties.italic:
            style += StyleConverter.convert_italic(properties.italic)
        if properties.underline:
            style += StyleConverter.convert_underline(properties.underline)
        if properties.color:
            style += StyleConverter.convert_color(properties.color)
        if properties.font:
            style += StyleConverter.convert_font(properties.font)
        if properties.size_pt:
            style += StyleConverter.convert_size(properties.size_pt)
        return f' style="{style}"' if style else ""

    @staticmethod
    def convert_image(image: ImageContent) -> str:
        """
        Converts an ImageContent to an HTML <img> tag.

        Args:
            image (ImageContent): The image content to convert.

        Returns:
            str: The HTML representation of the image.

        Example:
            The output HTML might look like:

            .. code-block:: html

                <img src="data:image/png;base64,iVBORw0KG..." 
                     style="width:100pt;height:100pt;" 
                     alt="Image description" 
                     title="Image title"/>
        """
        # If no image data, return empty string
        if not image.image_data:
            return ""
        
        # Build the img tag
        img_html = f'<img src="{image.image_data}"'
        
        # Add style for dimensions if available
        style_parts = []
        if image.width_emu:
            width_pt = convert_emu_to_points(image.width_emu)
            style_parts.append(f"width:{width_pt}pt")
        if image.height_emu:
            height_pt = convert_emu_to_points(image.height_emu)
            style_parts.append(f"height:{height_pt}pt")
        
        if style_parts:
            img_html += f' style="{";".join(style_parts)};"'
        
        # Add alt text if available (properly escape HTML special characters)
        if image.alt_text:
            alt_text = html.escape(image.alt_text, quote=True)
            img_html += f' alt="{alt_text}"'
        else:
            img_html += ' alt="Image"'
        
        # Add title if available (properly escape HTML special characters)
        if image.title:
            title = html.escape(image.title, quote=True)
            img_html += f' title="{title}"'
        
        img_html += '/>'
        return img_html
