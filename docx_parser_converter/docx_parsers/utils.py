import io
import zipfile
import base64
import xml.etree.ElementTree as ET
from typing import Union, Optional, Dict
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

def extract_xml_root_from_string(xml_content: str) -> ET.Element:
    """
    Extracts the root element from an XML string.

    Args:
        xml_content (str): The XML content as a string.

    Returns:
        ET.Element: The root element of the parsed XML.
    """
    return ET.fromstring(xml_content)

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

def convert_emu_to_pixels(emu: int, dpi: int = 96) -> float:
    """
    Converts EMU (English Metric Units) to pixels.
    
    EMU is used in Office Open XML for measurements.
    1 inch = 914400 EMU
    
    Args:
        emu (int): The value in EMU.
        dpi (int): Dots per inch for the conversion (default is 96).
    
    Returns:
        float: The value in pixels.
    
    Example:
        The following converts 914400 EMU to pixels at 96 DPI:
        
        .. code-block:: python
        
            pixels = convert_emu_to_pixels(914400)
            print(pixels)  # Output: 96.0
    """
    inches = emu / 914400.0
    return inches * dpi

def convert_emu_to_points(emu: int) -> float:
    """
    Converts EMU (English Metric Units) to points.
    
    1 inch = 914400 EMU
    1 inch = 72 points
    
    Args:
        emu (int): The value in EMU.
    
    Returns:
        float: The value in points.
    
    Example:
        The following converts 914400 EMU to points:
        
        .. code-block:: python
        
            points = convert_emu_to_points(914400)
            print(points)  # Output: 72.0
    """
    return (emu / 914400.0) * 72.0

def extract_relationships_from_docx(docx_file: bytes) -> Dict[str, str]:
    """
    Extracts the relationship mappings from document.xml.rels within a DOCX file.
    
    Args:
        docx_file (bytes): The binary content of the DOCX file.
    
    Returns:
        Dict[str, str]: A dictionary mapping relationship IDs to their targets.
                       Example: {'rId1': 'media/image1.png', 'rId2': 'media/image2.jpg'}
    
    Example:
        The following extracts relationships from a DOCX file:
        
        .. code-block:: python
        
            rels = extract_relationships_from_docx(docx_bytes)
            print(rels['rId4'])  # Output: 'media/image1.png'
    """
    relationships = {}
    try:
        with zipfile.ZipFile(io.BytesIO(docx_file), 'r') as docx:
            try:
                with docx.open('word/_rels/document.xml.rels') as rels_file:
                    tree = ET.parse(rels_file)
                    root = tree.getroot()
                    
                    # Namespace for relationships
                    ns = {'rel': 'http://schemas.openxmlformats.org/package/2006/relationships'}
                    
                    for rel in root.findall('rel:Relationship', namespaces=ns):
                        rel_id = rel.get('Id')
                        target = rel.get('Target')
                        rel_type = rel.get('Type')
                        
                        # Only store image relationships
                        if rel_type and 'image' in rel_type and rel_id and target:
                            relationships[rel_id] = target
            except KeyError:
                # document.xml.rels doesn't exist, no relationships to extract
                pass
    except Exception:
        # If anything goes wrong, return empty dict
        pass
    
    return relationships

def extract_image_from_docx(docx_file: bytes, image_path: str) -> Optional[bytes]:
    """
    Extracts an image binary data from a DOCX file.
    
    Args:
        docx_file (bytes): The binary content of the DOCX file.
        image_path (str): The path to the image within the DOCX (e.g., 'media/image1.png').
    
    Returns:
        Optional[bytes]: The binary content of the image, or None if not found.
    
    Example:
        The following extracts an image from a DOCX file:
        
        .. code-block:: python
        
            image_data = extract_image_from_docx(docx_bytes, 'media/image1.png')
            if image_data:
                with open('output.png', 'wb') as f:
                    f.write(image_data)
    """
    try:
        with zipfile.ZipFile(io.BytesIO(docx_file), 'r') as docx:
            try:
                with docx.open(f'word/{image_path}') as image_file:
                    return image_file.read()
            except KeyError:
                # Image file doesn't exist
                return None
    except Exception:
        return None

def encode_image_to_base64(image_data: bytes, mime_type: str = 'image/png') -> str:
    """
    Encodes image binary data to a base64 data URI.
    
    Args:
        image_data (bytes): The binary content of the image.
        mime_type (str): The MIME type of the image (default is 'image/png').
    
    Returns:
        str: A base64-encoded data URI string.
    
    Example:
        The following encodes image data to base64:
        
        .. code-block:: python
        
            data_uri = encode_image_to_base64(image_bytes, 'image/jpeg')
            print(data_uri)  # Output: 'data:image/jpeg;base64,/9j/4AAQ...'
    """
    base64_data = base64.b64encode(image_data).decode('utf-8')
    return f"data:{mime_type};base64,{base64_data}"

def get_image_mime_type(filename: str) -> str:
    """
    Determines the MIME type of an image based on its filename extension.
    
    Args:
        filename (str): The filename or path of the image.
    
    Returns:
        str: The MIME type of the image.
    
    Example:
        The following gets the MIME type for different image extensions:
        
        .. code-block:: python
        
            mime = get_image_mime_type('image.jpg')
            print(mime)  # Output: 'image/jpeg'
    """
    extension = filename.lower().split('.')[-1]
    mime_types = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'bmp': 'image/bmp',
        'svg': 'image/svg+xml',
        'webp': 'image/webp',
        'tiff': 'image/tiff',
        'tif': 'image/tiff'
    }
    return mime_types.get(extension, 'image/png')
