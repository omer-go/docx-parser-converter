from docx_parsers.models.document_models import Paragraph
from docx_parsers.models.numbering_models import NumberingSchema, NumberingLevel

class NumberingConverter:
    def __init__(self, numbering_schema: NumberingSchema):
        self.numbering_schema = numbering_schema
        self.numbering_counters = {}

    def convert_numbering(self, paragraph: Paragraph) -> str:
        numbering = paragraph.numbering
        level_key = (numbering.numId, numbering.ilvl)
        try:
            numbering_level = self.get_numbering_level(numbering.numId, numbering.ilvl)
        except ValueError as e:
            print(f"Warning: {e}")
            return self.bullet_point()

        if level_key not in self.numbering_counters:
            self.numbering_counters[level_key] = numbering_level.start - 1
        self.numbering_counters[level_key] += 1
        counter = self.numbering_counters[level_key]

        if numbering_level.numFmt:
            numbering_text = self.format_number(counter, numbering_level.numFmt)
            lvlText = numbering_level.lvlText.replace(f"%{numbering.ilvl + 1}", numbering_text)

            indent_left_pt = numbering_level.indent.left_pt if numbering_level.indent and numbering_level.indent.left_pt else 0
            hanging_indent_pt = numbering_level.indent.hanging_pt if numbering_level.indent and numbering_level.indent.hanging_pt else 0

            def get_char_width(char):
                if char.isdigit() or char.isalpha():
                    return 7.2
                elif char in ('.', '(', ')'):
                    return 3.6
                return 7.2

            numbering_text_length_pt = sum(get_char_width(c) for c in numbering_text)

            if numbering_level.tab_pt:
                net_padding = numbering_level.tab_pt - (indent_left_pt - hanging_indent_pt) - numbering_text_length_pt
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

    def get_numbering_level(self, numId: int, ilvl: int) -> NumberingLevel:
        instance = next((inst for inst in self.numbering_schema.instances if inst.numId == numId), None)
        if instance:
            level = next((lvl for lvl in instance.levels if lvl.ilvl == ilvl), None)
            if level:
                return level
        raise ValueError(f"Numbering level not found for numId: {numId}, ilvl: {ilvl}")

    def format_number(self, counter: int, numFmt: str) -> str:
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
        return ""

    def to_roman(self, num: int) -> str:
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

    def to_upper_letter(self, num: int) -> str:
        return chr(64 + num)

    def to_lower_letter(self, num: int) -> str:
        return chr(96 + num)

    def bullet_point(self) -> str:
        return "•"
