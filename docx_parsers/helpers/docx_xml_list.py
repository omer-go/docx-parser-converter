import zipfile
from pathlib import Path
from xml.dom.minidom import parseString

def extract_docx_xml(docx_path):
    # Ensure the given path is a .docx file
    if not docx_path.endswith('.docx'):
        raise ValueError("The provided file must be a .docx file")

    # Get the directory of the .docx file
    docx_dir = Path(docx_path).parent
    docx_name = Path(docx_path).stem
    
    # Create an output directory based on the document name within the same directory
    output_dir = docx_dir / docx_name
    output_dir.mkdir(exist_ok=True)

    # Open the .docx file as a zip archive
    with zipfile.ZipFile(docx_path, 'r') as docx_zip:
        # Iterate over the file names in the zip archive
        for file_info in docx_zip.infolist():
            # Check if the file is an XML file
            if file_info.filename.endswith('.xml'):
                # Extract the XML content
                xml_content = docx_zip.read(file_info.filename)
                
                # Pretty print the XML content
                dom = parseString(xml_content)
                pretty_xml_as_string = dom.toprettyxml()

                # Save the pretty printed XML content to a .txt file
                output_file = output_dir / (file_info.filename.replace('/', '_') + '.txt')
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(pretty_xml_as_string)

                print(f"Extracted: {file_info.filename} to {output_file}")


if __name__ == "__main__":
    # docx_path = "C:/Users/omerh/Desktop/Postmoney Safe - Discount Only - FINAL.docx"
    # docx_path = "C:/Users/omerh/Desktop/file-sample_1MB.docx"
    # docx_path = "C:/Users/omerh/Desktop/new_docx.docx"
    # docx_path = "C:/Users/omerh/Desktop/Postmoney Safe - MFN Only - FINAL.docx"
    docx_path = "C:/Users/omerh/Desktop/Sponsor Voting Agreement.docx"
    extract_docx_xml(docx_path)
