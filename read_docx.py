import zipfile
import xml.etree.ElementTree as ET

try:
    docx = zipfile.ZipFile(r'C:\Users\victo\Downloads\My Project 13thMay.docx')
    xml_content = docx.read('word/document.xml')
    tree = ET.XML(xml_content)
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    text = '\n'.join([node.text for node in tree.iterfind('.//w:t', ns) if node.text])
    
    with open('c:/Users/victo/.gemini/antigravity/scratch/congregate/docx_content.txt', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Successfully wrote to docx_content.txt")
except Exception as e:
    print(f"Error: {e}")
