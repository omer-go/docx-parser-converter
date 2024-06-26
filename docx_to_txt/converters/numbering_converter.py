from docx_parsers.models.document_models import Paragraph
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
        :param paragraph: The paragraph object.
        :param numbering_schema: The numbering schema.
        :return: Plain text representation of the numbering.
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
        instance = next((inst for inst in numbering_schema.instances if inst.numId == numId), None)
        if instance:
            level = next((lvl for lvl in instance.levels if lvl.ilvl == ilvl), None)
            if level:
                return level
        raise ValueError(f"Numbering level not found for numId: {numId}, ilvl: {ilvl}")

    @staticmethod
    def format_number(counter: int, numFmt: str) -> str:
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
        return chr(64 + num)

    @staticmethod
    def to_lower_letter(num: int) -> str:
        return chr(96 + num)
