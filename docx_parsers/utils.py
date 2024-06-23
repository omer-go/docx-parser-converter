import io
import zipfile
import xml.etree.ElementTree as ET


def extract_xml_root_from_docx(docx_file: bytes, xml_filename: str) -> ET.Element:
    with zipfile.ZipFile(io.BytesIO(docx_file), 'r') as docx:
        with docx.open(f'word/{xml_filename}') as xml_file:
            tree = ET.parse(xml_file)
            return tree.getroot()
        
def read_binary_from_file_path(file_path: str) -> bytes:
    with open(file_path, 'rb') as file:
        return file.read()
    
def convert_twips_to_points(twips: int) -> float:
    # Convert twips to points
    return twips / 20.0

def convert_half_points_to_points(half_points: int) -> float:
    # Convert half-points to points
    return half_points / 2.0

def merge_properties(base_props, derived_props):
    if not base_props:
        return derived_props
    if not derived_props:
        return base_props
    
    base_dict = base_props.dict(exclude_unset=True)
    derived_dict = derived_props.dict(exclude_unset=True)
    
    def deep_merge(base, derived):
        for key, value in derived.items():
            if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                base[key] = deep_merge(base[key], value)
            elif key not in base or base[key] is None:
                base[key] = value
        return base
    
    merged_dict = deep_merge(base_dict, derived_dict)
    return type(base_props)(**merged_dict)
