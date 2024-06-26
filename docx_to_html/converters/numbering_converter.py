from docx_parsers.models.document_models import Paragraph
from docx_parsers.models.numbering_models import NumberingLevel


class NumberingConverter:
    numbering_counters = {}

    @staticmethod
    def convert_numbering(paragraph: Paragraph, numbering_schema) -> str:
        numbering = paragraph.numbering
        level_key = (numbering.numId, numbering.ilvl)
        try:
            numbering_level = NumberingConverter.get_numbering_level(numbering_schema, numbering.numId, numbering.ilvl)
        except ValueError as e:
            print(f"Warning: {e}")
            return "•"

        if level_key not in NumberingConverter.numbering_counters:
            NumberingConverter.numbering_counters[level_key] = numbering_level.start - 1
        NumberingConverter.numbering_counters[level_key] += 1
        counter = NumberingConverter.numbering_counters[level_key]

        if numbering_level.numFmt:
            numbering_text = NumberingConverter.format_number(counter, numbering_level.numFmt)
            lvlText = numbering_level.lvlText.replace(f"%{numbering.ilvl + 1}", numbering_text)
            indent_left_pt = numbering_level.indent.left_pt if numbering_level.indent and numbering_level.indent.left_pt else 0
            firstline_indent_pt = numbering_level.indent.firstline_pt if numbering_level.indent and numbering_level.indent.firstline_pt else 0

            def get_char_width(char):
                if char.isdigit() or char.isalpha():
                    return 7.2
                elif char in ('.', '(', ')'):
                    return 3.6
                return 7.2

            numbering_text_length_pt = sum(get_char_width(c) for c in numbering_text)

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
        return ""

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
