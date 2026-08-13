import sys

try:
    import pdfplumber
    with pdfplumber.open("SOP_Perizinan_Keluar_dan_Pulang_Asrama.pdf") as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text:
                print(f"\n=== HALAMAN {i+1} ===")
                print(text)
except ImportError:
    print("pdfplumber not found, trying PyPDF2...")
    try:
        import PyPDF2
        with open("SOP_Perizinan_Keluar_dan_Pulang_Asrama.pdf", "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for i, page in enumerate(reader.pages):
                print(f"\n=== HALAMAN {i+1} ===")
                print(page.extract_text())
    except ImportError:
        print("No PDF library available. Trying to install pdfplumber...")
        import subprocess
        subprocess.run(["pip", "install", "pdfplumber", "-q"])
