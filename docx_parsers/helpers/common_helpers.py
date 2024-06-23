# common_helpers.py

from lxml import etree
from typing import Optional
from xml.etree.ElementTree import Element

NAMESPACE_URI = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NAMESPACE = {'w': NAMESPACE_URI}

def extract_element(parent: Element, path: str) -> Optional[Element]:
    """
    Extracts an XML element from the parent element using the given path.
    
    Args:
        parent (Element): The parent XML element.
        path (str): The XPath to the desired child element.

    Returns:
        Optional[Element]: The extracted XML element, or None if not found.
    """
    return parent.find(path, namespaces=NAMESPACE)

def extract_attribute(element: Optional[Element], attr: str) -> Optional[str]:
    """
    Extracts an attribute value from an XML element.
    
    Args:
        element (Optional[Element]): The XML element.
        attr (str): The attribute name.

    Returns:
        Optional[str]: The attribute value, or None if not found.
    """
    if element is not None:
        return element.get(f'{{{NAMESPACE_URI}}}{attr}')
    return None

def safe_int(value: Optional[str]) -> Optional[int]:
    """
    Converts a string value to an integer safely.
    
    Args:
        value (Optional[str]): The string value to convert.

    Returns:
        Optional[int]: The integer value, or None if the input is None.
    """
    return int(value) if value is not None else None
