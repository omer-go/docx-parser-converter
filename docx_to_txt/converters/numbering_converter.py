from docx_parsers.models.paragraph_models import Paragraph
from docx_parsers.models.numbering_models import NumberingLevel


class NumberingConverter:
    """
    Class to convert numbering to plain text.
    """

    numbering_counters = {}

    @staticmethod
    def convert_numbering(paragraph: Paragraph, numbering_schema) -> str:
        """
        Convert numbering to plain text.

        Args:
            paragraph (Paragraph): The paragraph object.
            numbering_schema: The numbering schema.

        Returns:
            str: Plain text representation of the numbering.

        Example:
            .. code-block:: python

                paragraph = Paragraph(
                    properties=properties,
                    runs=runs,
                    numbering=numbering
                )
                numbering_text = NumberingConverter.convert_numbering(paragraph, numbering_schema)
                print(numbering_text)
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

        return lvlText + " "

    @staticmethod
    def get_numbering_level(numbering_schema, numId: int, ilvl: int) -> NumberingLevel:
        """
        Get the numbering level from the numbering schema.

        Args:
            numbering_schema: The numbering schema.
            numId (int): The numbering ID.
            ilvl (int): The indent level.

        Returns:
            NumberingLevel: The corresponding numbering level.

        Raises:
            ValueError: If the numbering level is not found.

        Example:
            .. code-block:: python

                numbering_level = NumberingConverter.get_numbering_level(numbering_schema, numId, ilvl)
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
        Format the counter according to the specified numbering format.

        Args:
            counter (int): The counter value.
            numFmt (str): The numbering format.

        Returns:
            str: The formatted number.

        Example:
            .. code-block:: python

                formatted_number = NumberingConverter.format_number(1, 'decimal')
                print(formatted_number)  # Output: '1'
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
        Convert an integer to a Roman numeral.

        Args:
            num (int): The integer to convert.

        Returns:
            str: The Roman numeral representation.

        Example:
            .. code-block:: python

                roman_number = NumberingConverter.to_roman(5)
                print(roman_number)  # Output: 'V'
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
        Convert an integer to an uppercase letter (A-Z).

        Args:
            num (int): The integer to convert.

        Returns:
            str: The uppercase letter representation.

        Example:
            .. code-block:: python

                letter = NumberingConverter.to_upper_letter(1)
                print(letter)  # Output: 'A'
        """
        return chr(64 + num)

    @staticmethod
    def to_lower_letter(num: int) -> str:
        """
        Convert an integer to a lowercase letter (a-z).

        Args:
            num (int): The integer to convert.

        Returns:
            str: The lowercase letter representation.

        Example:
            .. code-block:: python

                letter = NumberingConverter.to_lower_letter(1)
                print(letter)  # Output: 'a'
        """
        return chr(96 + num)
