from docx_parser_converter.docx_parsers.models.paragraph_models import Run, Paragraph, TextContent, TabContent
from docx_parser_converter.docx_parsers.models.styles_models import RunStyleProperties
from docx_parser_converter.docx_to_html.converters.style_converter import StyleConverter


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
