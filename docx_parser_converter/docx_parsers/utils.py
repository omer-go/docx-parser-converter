import io
import zipfile
import xml.etree.ElementTree as ET
from typing import Union
from pydantic import BaseModel

def extract_xml_root_from_docx(docx_file: bytes, xml_filename: str) -> ET.Element:
    """
    Extracts the root element from the specified XML file within a DOCX file.

    Args:
        docx_file (bytes): The binary content of the DOCX file.
        xml_filename (str): The name of the XML file to extract (e.g., 'document.xml').

    Returns:
        ET.Element: The root element of the extracted XML file.

    Example:
        The following is an example of the structure of the XML file extracted:

        .. code-block:: xml

            <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                <!-- XML content here -->
            </w:document>
    """
    with zipfile.ZipFile(io.BytesIO(docx_file), 'r') as docx:
        with docx.open(f'word/{xml_filename}') as xml_file:
            tree = ET.parse(xml_file)
            return tree.getroot()

def read_binary_from_file_path(file_path: str) -> bytes:
    """
    Reads the binary content from the specified file path.

    Args:
        file_path (str): The path to the file to read.

    Returns:
        bytes: The binary content of the file.
    """
    with open(file_path, 'rb') as file:
        return file.read()

def convert_twips_to_points(twips: int) -> float:
    """
    Converts twips (twentieths of a point) to points.

    Args:
        twips (int): The value in twips.

    Returns:
        float: The value in points.

    Example:
        The following converts 240 twips to points:

        .. code-block:: python

            points = convert_twips_to_points(240)
            print(points)  # Output: 12.0
    """
    return twips / 20.0

def convert_half_points_to_points(half_points: int) -> float:
    """
    Converts half-points to points.

    Args:
        half_points (int): The value in half-points.

    Returns:
        float: The value in points.

    Example:
        The following converts 24 half-points to points:

        .. code-block:: python

            points = convert_half_points_to_points(24)
            print(points)  # Output: 12.0
    """
    return half_points / 2.0

def merge_properties(base_props: Union[BaseModel, None], derived_props: Union[BaseModel, None]) -> Union[BaseModel, None]:
    """
    Merges two sets of properties, with derived properties taking precedence over base properties.

    Args:
        base_props (Union[BaseModel, None]): The base properties.
        derived_props (Union[BaseModel, None]): The derived properties.

    Returns:
        Union[BaseModel, None]: The merged properties.

    Example:
        The following merges two Pydantic models:

        .. code-block:: python

            base = ParagraphProperties(spacing=SpacingProperties(before_pt=10))
            derived = ParagraphProperties(spacing=SpacingProperties(after_pt=20))
            merged = merge_properties(base, derived)
            print(merged)
    """
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
