from docx_parsers.models.document_models import Paragraph
from docx_parsers.models.numbering_models import NumberingLevel

"""
TODO:
Add style application of the numbering itself 

(requires updating the DocumentParser and the ParagraphStyleProperties to add
another property of RunStyleProperties, in addition to the RunStyleProperties
that the Run model has)
"""

class NumberingConverter:
    """
    A converter class for handling numbered paragraphs in DOCX documents.
    """

    numbering_counters = {}

    @staticmethod
    def convert_numbering(paragraph: Paragraph, numbering_schema) -> str:
        """
        Converts the numbering for a given paragraph to its HTML representation.

        Args:
            paragraph (Paragraph): The paragraph containing the numbering to convert.
            numbering_schema: The schema containing numbering definitions.

        Returns:
            str: The HTML representation of the numbering.

        Example:
            Given a paragraph with numbering, the output HTML string might look like:

            .. code-block:: html

                <span style="font-family:Times New Roman;">1.</span><span style="padding-left:7.2pt;"></span>
                <span style="font-family:Times New Roman;">I.</span><span style="padding-left:7.2pt;"></span>
        """
        numbering = paragraph.numbering
        level_key = (numbering.numId, numbering.ilvl)
        
        try:
            numbering_level = NumberingConverter.get_numbering_level(numbering_schema, numbering.numId, numbering.ilvl)
        except ValueError as e:
            print(f"Warning: {e}")
            return "•"

        if numbering.numId not in NumberingConverter.numbering_counters:
            NumberingConverter.numbering_counters[numbering.numId] = [0] * 9  # Supports up to 9 levels
        
        NumberingConverter.numbering_counters[numbering.numId][numbering.ilvl] += 1
        
        # Reset counters for deeper levels if a higher level is incremented
        for i in range(numbering.ilvl + 1, 9):
            NumberingConverter.numbering_counters[numbering.numId][i] = 0

        counters = NumberingConverter.numbering_counters[numbering.numId][:numbering.ilvl + 1]
        formatted_counters = [NumberingConverter.format_number(counters[i], numbering_level.numFmt) for i in range(numbering.ilvl + 1)]
        
        # Replace all placeholders in lvlText
        lvlText = numbering_level.lvlText
        for i in range(1, numbering.ilvl + 2):
            lvlText = lvlText.replace(f"%{i}", formatted_counters[i-1])

        indent_left_pt = numbering_level.indent.left_pt if numbering_level.indent and numbering_level.indent.left_pt else 0
        firstline_indent_pt = numbering_level.indent.firstline_pt if numbering_level.indent and numbering_level.indent.firstline_pt else 0

        def get_char_width(char):
            if char.isdigit() or char.isalpha():
                return 7.2
            elif char in ('.', '(', ')'):
                return 3.6
            return 7.2

        numbering_text_length_pt = sum(get_char_width(c) for c in lvlText)

        if numbering_level.tab_pt:
            net_padding = numbering_level.tab_pt - (indent_left_pt + firstline_indent_pt) - numbering_text_length_pt
            padding_style = f"padding-left:{max(net_padding, 7.2)}pt;"
            if numbering_level.fonts and numbering_level.fonts.ascii:
                font_style = f"font-family:{numbering_level.fonts.ascii};"
                return f'<span style="{font_style}">{lvlText}</span><span style="{padding_style}"></span>'
            return f'<span>{lvlText}</span><span style="{padding_style}"></span>'

        if numbering_level.fonts and numbering_level.fonts.ascii:
            font_style = f"font-family:{numbering_level.fonts.ascii};"
            return f'<span style="{font_style}">{lvlText}</span><span style="padding-left:7.2pt;"></span>'

        return f'{lvlText}<span style="padding-left:7.2pt;"></span>'

    @staticmethod
    def get_numbering_level(numbering_schema, numId: int, ilvl: int) -> NumberingLevel:
        """
        Retrieves the numbering level from the numbering schema.

        Args:
            numbering_schema: The schema containing numbering definitions.
            numId (int): The numbering ID.
            ilvl (int): The numbering level.

        Returns:
            NumberingLevel: The retrieved numbering level.

        Raises:
            ValueError: If the numbering level is not found.

        Example:
            The numbering level might be represented in the schema as:

            .. code-block:: xml

                <w:num w:numId="1">
                    <w:abstractNumId w:val="0"/>
                </w:num>
                <w:abstractNum w:abstractNumId="0">
                    <w:lvl w:ilvl="0">
                        <w:start w:val="1"/>
                        <w:numFmt w:val="decimal"/>
                        <w:lvlText w:val="%1."/>
                        <w:lvlJc w:val="left"/>
                        <w:pPr>
                            <w:ind w:left="720" w:hanging="360"/>
                        </w:pPr>
                        <w:rPr>
                            <w:rFonts w:ascii="Times New Roman"/>
                        </w:rPr>
                    </w:lvl>
                </w:abstractNum>
        """
        instance = next((inst for inst in numbering_schema.instances if inst.numId == numId), None)
        if instance:
            level = next((lvl for lvl in instance.levels if lvl.ilvl == ilvl), None)
            if level:
                return level
        raise ValueError(f"Numbering level not found for numId: {numId}, ilvl: {ilvl}")

    @staticmethod
    def format_number(counter: int, numFmt: str) -> str:
        """
        Formats the counter according to the specified numbering format.

        Args:
            counter (int): The current counter value.
            numFmt (str): The numbering format (e.g., "decimal", "lowerRoman").

        Returns:
            str: The formatted number.

        Example:
            The following converts a counter value to different formats:

            .. code-block:: python

                NumberingConverter.format_number(1, "decimal")  # "1"
                NumberingConverter.format_number(1, "lowerRoman")  # "i"
                NumberingConverter.format_number(1, "upperRoman")  # "I"
                NumberingConverter.format_number(1, "lowerLetter")  # "a"
                NumberingConverter.format_number(1, "upperLetter")  # "A"
                NumberingConverter.format_number(1, "bullet")  # "•"
        """
        if numFmt == "decimal":
            return str(counter)
        elif numFmt == "lowerRoman":
            return NumberingConverter.to_roman(counter).lower()
        elif numFmt == "upperRoman":
            return NumberingConverter.to_roman(counter).upper()
        elif numFmt == "lowerLetter":
            return NumberingConverter.to_lower_letter(counter)
        elif numFmt == "upperLetter":
            return NumberingConverter.to_upper_letter(counter)
        elif numFmt == "bullet":
            return "•"
        return ""

    @staticmethod
    def to_roman(num: int) -> str:
        """
        Converts a number to its Roman numeral representation.

        Args:
            num (int): The number to convert.

        Returns:
            str: The Roman numeral representation.

        Example:
            The following converts a number to Roman numeral:

            .. code-block:: python

                NumberingConverter.to_roman(1)  # "I"
        """
        val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
        syb = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"]
        roman_num = ''
        i = 0
        while num > 0:
            for _ in range(num // val[i]):
                roman_num += syb[i]
                num -= val[i]
            i += 1
        return roman_num

    @staticmethod
    def to_upper_letter(num: int) -> str:
        """
        Converts a number to its uppercase letter representation.

        Args:
            num (int): The number to convert.

        Returns:
            str: The uppercase letter representation.

        Example:
            The following converts a number to an uppercase letter:

            .. code-block:: python

                NumberingConverter.to_upper_letter(1)  # "A"
        """
        return chr(64 + num)

    @staticmethod
    def to_lower_letter(num: int) -> str:
        """
        Converts a number to its lowercase letter representation.

        Args:
            num (int): The number to convert.

        Returns:
            str: The lowercase letter representation.

        Example:
            The following converts a number to a lowercase letter:

            .. code-block:: python

                NumberingConverter.to_lower_letter(1)  # "a"
        """
        return chr(96 + num)
