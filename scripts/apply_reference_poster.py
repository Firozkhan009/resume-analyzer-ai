from __future__ import annotations

from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
REFERENCE = Path("/Users/firozkhanpatan/Downloads/Poster_Shaik.pptx")
# If this helper is used for a class submission, cite the original poster/template
# owner or replace the source deck with an original layout before submitting.
OUTPUT = ROOT / "Poster_Patan.pptx"

NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "cp": "http://schemas.openxmlformats.org/package/2006/metadata/core-properties",
    "dc": "http://purl.org/dc/elements/1.1/",
}

for prefix, uri in NS.items():
    ET.register_namespace(prefix, uri)

TEXT_BY_SHAPE_ID = {
    "2": "Resume Analyzer AI",
    "4": "Resume Review with ATS and Job-Fit Feedback",
    "5": "Firoz Khan Patan",
    "6": "PROJECT OVERVIEW",
    "10": "Faculty Advisor",
    "11": "Dr. Krzysztof J. Kochut",
    "15": "KEY FEATURES",
    "17": "",
    "19": "TECH STACK",
    "21": "FUTURE ENHANCEMENTS",
    "22": (
        "Benchmark the scoring pipeline on larger resume datasets. Add side-by-side resume version "
        "comparison, stronger recruiter-facing explanations, and broader model support for evaluation."
    ),
    "33": "WHAT IS RESUMIND?",
    "34": (
        "The Resume Analyzer reviews a PDF resume against a specific job posting. It combines authentication, "
        "file handling, PDF conversion, saved analysis records, and structured AI-assisted feedback "
        "in one workflow."
    ),
    "1074": "",
    "1090": "",
    "1095": "Project Screens and Resume Preview",
    "1099": "CURRENT LIMITATIONS",
    "1100": (
        "Feedback quality depends on the input job description and AI response consistency. The current "
        "evaluation is product-focused rather than benchmark-driven, and recruiter validation is still needed."
    ),
}

IMAGE_REPLACEMENTS = {
    "ppt/media/image3.png": ROOT / "generated" / "project-home.png",
    "ppt/media/image4.png": ROOT / "generated" / "project-upload.png",
}


def replace_text_in_shape(sp: ET.Element, replacement: str) -> None:
    text_nodes = sp.findall(".//a:t", NS)
    if not text_nodes:
        return

    text_nodes[0].text = replacement
    for node in text_nodes[1:]:
        node.text = ""


def clone_run_properties(sp: ET.Element) -> ET.Element:
    first_rpr = sp.find(".//a:r/a:rPr", NS)
    if first_rpr is not None:
        return ET.fromstring(ET.tostring(first_rpr))

    return ET.Element(f"{{{NS['a']}}}rPr", {"lang": "en-US"})


def clear_paragraphs(tx_body: ET.Element) -> None:
    for paragraph in list(tx_body.findall("a:p", NS)):
        tx_body.remove(paragraph)


def set_rich_paragraphs(sp: ET.Element, paragraphs: list[list[tuple[str, bool]]]) -> None:
    tx_body = sp.find("./p:txBody", NS)
    if tx_body is None:
        return

    clear_paragraphs(tx_body)

    for runs in paragraphs:
        p = ET.SubElement(tx_body, f"{{{NS['a']}}}p")
        ET.SubElement(
            p,
            f"{{{NS['a']}}}pPr",
            {"marL": "228600", "indent": "-228600", "lvl": "0"},
        )
        ET.SubElement(p, f"{{{NS['a']}}}buChar", {"char": "•"})

        for text, bold in runs:
            r = ET.SubElement(p, f"{{{NS['a']}}}r")
            rpr = clone_run_properties(sp)
            if bold:
                rpr.set("b", "1")
            else:
                rpr.attrib.pop("b", None)
            r.append(rpr)
            t = ET.SubElement(r, f"{{{NS['a']}}}t")
            t.text = text


def set_overview_shape(sp: ET.Element) -> None:
    paragraphs = [
        [
            ("Overview: ", True),
            (
                "This project builds a web application that reviews resumes against a target role "
                "and returns structured revision feedback.",
                False,
            ),
        ],
        [
            ("Motivation: ", True),
            (
                "Applicants often reuse one resume and have little visibility into ATS or role-fit "
                "issues before applying.",
                False,
            ),
        ],
        [
            ("Contribution: ", True),
            (
                "The system combines PDF handling, image conversion, saved records, AI-assisted "
                "review, and an interactive dashboard for repeatable resume revision.",
                False,
            ),
        ],
    ]
    set_rich_paragraphs(sp, paragraphs)


def updated_slide_xml(source: bytes) -> bytes:
    root = ET.fromstring(source)
    for sp in root.findall(".//p:sp", NS):
        c_nv_pr = sp.find("./p:nvSpPr/p:cNvPr", NS)
        if c_nv_pr is None:
            continue
        shape_id = c_nv_pr.get("id")
        if shape_id == "12":
            set_overview_shape(sp)
            continue
        replacement = TEXT_BY_SHAPE_ID.get(shape_id)
        if replacement is not None:
            replace_text_in_shape(sp, replacement)
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def updated_core_xml(source: bytes) -> bytes:
    root = ET.fromstring(source)
    title = root.find("./dc:title", NS)
    creator = root.find("./dc:creator", NS)
    if title is not None:
        title.text = "AI-Powered Resume Analyzer: ATS and Job-Fit Feedback"
    if creator is not None:
        creator.text = "Firoz Khan Patan"
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def build_output() -> None:
    if not REFERENCE.exists():
        raise FileNotFoundError(f"Reference poster not found: {REFERENCE}")

    missing = [str(path) for path in IMAGE_REPLACEMENTS.values() if not path.exists()]
    if missing:
        raise FileNotFoundError(f"Missing replacement images: {', '.join(missing)}")

    with ZipFile(REFERENCE, "r") as src, ZipFile(OUTPUT, "w", compression=ZIP_DEFLATED) as dst:
        for item in src.infolist():
            data = src.read(item.filename)

            if item.filename == "ppt/slides/slide1.xml":
                data = updated_slide_xml(data)
            elif item.filename == "docProps/core.xml":
                data = updated_core_xml(data)
            elif item.filename in IMAGE_REPLACEMENTS:
                data = IMAGE_REPLACEMENTS[item.filename].read_bytes()

            dst.writestr(item.filename, data)


if __name__ == "__main__":
    build_output()
