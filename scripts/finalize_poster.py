from __future__ import annotations

from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path("/Users/firozkhanpatan/Downloads/FIROZPP.pptx")
OUTPUT = ROOT / "Poster_Patan.pptx"

NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships",
    "dc": "http://purl.org/dc/elements/1.1/",
}

for prefix, uri in NS.items():
    if prefix != "rel":
        ET.register_namespace(prefix, uri)

MEDIA_FILES = {
    "ppt/media/workflow-large.svg": ROOT / "generated" / "previews" / "workflow-large.svg",
    "ppt/media/components-small.svg": ROOT / "generated" / "previews" / "components-small.svg",
}


TEXT_REPLACEMENTS = {
    "15": "KEY TAKEAWAYS",
    "19": "TECH STACK",
    "21": "FUTURE DIRECTIONS",
    "22": (
        "• Add resume version comparison and exportable feedback reports.\n"
        "• Improve explainability for every score and recommendation.\n"
        "• Validate the system with larger datasets and recruiter review."
    ),
    "33": "WHAT IS THE RESUME ANALYZER?",
    "34": (
        "Resume Analyzer AI is a web-based application that helps users evaluate resumes against "
        "a target job description using AI-generated feedback. It accepts a PDF resume, analyzes "
        "it across ATS compatibility, tone and style, content, structure, and skills, and returns "
        "structured suggestions to improve resume quality and job alignment."
    ),
    "1074": "CONCEPTUAL WORKFLOW",
    "1095": "RESUME EVALUATION DIMENSIONS",
    "1099": "CURRENT LIMITATIONS",
    "1100": (
        "• Feedback quality depends on the clarity of the uploaded resume and target job description.\n"
        "• AI-generated scores may vary and still need broader benchmarking.\n"
        "• The current system has not yet been validated through formal recruiter studies."
    ),
}


BULLET_PARAGRAPHS = {
    "56": [
        "React Router + TypeScript for the application framework",
        "React 19 and Zustand for UI and state management",
        "PDF.js for resume preview and PDF processing",
        "AI services for resume scoring and feedback generation",
        "File storage and key-value persistence for saved analyses",
    ],
    "1090": [
        "Analyzes resumes against a target job instead of giving generic feedback",
        "Returns structured section scores for ATS, content, structure, tone, and skills",
        "Creates a faster and more repeatable review workflow for job seekers",
    ],
}


def replace_plain_text(sp: ET.Element, replacement: str) -> None:
    text_nodes = sp.findall(".//a:t", NS)
    if not text_nodes:
        return
    text_nodes[0].text = replacement
    for node in text_nodes[1:]:
        node.text = ""


def base_rpr(sp: ET.Element) -> ET.Element:
    found = sp.find(".//a:rPr", NS)
    if found is not None:
        return ET.fromstring(ET.tostring(found))
    return ET.Element(f"{{{NS['a']}}}rPr", {"lang": "en-US", "sz": "2800"})


def clear_text_body(sp: ET.Element) -> ET.Element | None:
    tx_body = sp.find("./p:txBody", NS)
    if tx_body is None:
        return None
    for p in list(tx_body.findall("a:p", NS)):
        tx_body.remove(p)
    return tx_body


def set_bullet_lines(sp: ET.Element, lines: list[str], size: str = "2600") -> None:
    tx_body = clear_text_body(sp)
    if tx_body is None:
        return

    for line in lines:
        p = ET.SubElement(tx_body, f"{{{NS['a']}}}p")
        r = ET.SubElement(p, f"{{{NS['a']}}}r")
        rpr = base_rpr(sp)
        rpr.set("sz", size)
        r.append(rpr)
        t = ET.SubElement(r, f"{{{NS['a']}}}t")
        t.text = f"• {line}"


def find_shape(root: ET.Element, shape_id: str) -> ET.Element | None:
    for sp in root.findall(".//p:sp", NS):
        nv = sp.find("./p:nvSpPr/p:cNvPr", NS)
        if nv is not None and nv.get("id") == shape_id:
            return sp
    return None


def make_pic(pic_id: int, name: str, rid: str, x: int, y: int, cx: int, cy: int) -> ET.Element:
    p_uri = NS["p"]
    a_uri = NS["a"]
    r_uri = NS["r"]

    pic = ET.Element(f"{{{p_uri}}}pic")
    nv_pic_pr = ET.SubElement(pic, f"{{{p_uri}}}nvPicPr")
    ET.SubElement(nv_pic_pr, f"{{{p_uri}}}cNvPr", {"id": str(pic_id), "name": name})
    c_nv_pic_pr = ET.SubElement(nv_pic_pr, f"{{{p_uri}}}cNvPicPr")
    ET.SubElement(c_nv_pic_pr, f"{{{a_uri}}}picLocks", {"noChangeAspect": "1"})
    ET.SubElement(nv_pic_pr, f"{{{p_uri}}}nvPr")

    blip_fill = ET.SubElement(pic, f"{{{p_uri}}}blipFill")
    ET.SubElement(blip_fill, f"{{{a_uri}}}blip", {f"{{{r_uri}}}embed": rid})
    ET.SubElement(blip_fill, f"{{{a_uri}}}srcRect")
    stretch = ET.SubElement(blip_fill, f"{{{a_uri}}}stretch")
    ET.SubElement(stretch, f"{{{a_uri}}}fillRect")

    sp_pr = ET.SubElement(pic, f"{{{p_uri}}}spPr")
    xfrm = ET.SubElement(sp_pr, f"{{{a_uri}}}xfrm")
    ET.SubElement(xfrm, f"{{{a_uri}}}off", {"x": str(x), "y": str(y)})
    ET.SubElement(xfrm, f"{{{a_uri}}}ext", {"cx": str(cx), "cy": str(cy)})
    prst = ET.SubElement(sp_pr, f"{{{a_uri}}}prstGeom", {"prst": "rect"})
    ET.SubElement(prst, f"{{{a_uri}}}avLst")
    return pic


def update_slide_xml(source: bytes) -> bytes:
    root = ET.fromstring(source)

    for shape_id, replacement in TEXT_REPLACEMENTS.items():
        sp = find_shape(root, shape_id)
        if sp is not None:
            replace_plain_text(sp, replacement)

    for shape_id, lines in BULLET_PARAGRAPHS.items():
        sp = find_shape(root, shape_id)
        if sp is not None:
            set_bullet_lines(sp, lines)

    sp_tree = root.find("./p:cSld/p:spTree", NS)
    if sp_tree is not None:
        sp_tree.append(
            make_pic(
                2001,
                "Workflow Diagram",
                "rId2",
                13550000,
                8350000,
                14900000,
                14550000,
            )
        )
        sp_tree.append(
            make_pic(
                2002,
                "Evaluation Dimensions Diagram",
                "rId3",
                29250000,
                7500000,
                11900000,
                7700000,
            )
        )

    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def update_slide_rels(source: bytes) -> bytes:
    root = ET.fromstring(source)
    ET.register_namespace("", NS["rel"])

    existing = {rel.attrib.get("Id") for rel in root.findall("rel:Relationship", NS)}
    additions = [
        ("rId2", "../media/workflow-large.svg"),
        ("rId3", "../media/components-small.svg"),
    ]
    for rid, target in additions:
        if rid not in existing:
            ET.SubElement(
                root,
                f"{{{NS['rel']}}}Relationship",
                {
                    "Id": rid,
                    "Type": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
                    "Target": target,
                },
            )
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def update_content_types(source: bytes) -> bytes:
    root = ET.fromstring(source)
    ns = root.tag.split("}")[0].strip("{")
    if not any(el.attrib.get("Extension") == "svg" for el in root.findall(f"{{{ns}}}Default")):
        ET.SubElement(
            root,
            f"{{{ns}}}Default",
            {"Extension": "svg", "ContentType": "image/svg+xml"},
        )
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def update_core_xml(source: bytes) -> bytes:
    root = ET.fromstring(source)
    title = root.find("./dc:title", NS)
    creator = root.find("./dc:creator", NS)
    if title is not None:
        title.text = "AI-Powered Resume Analyzer for ATS Optimization"
    if creator is not None:
        creator.text = "Firoz Khan Patan"
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def build() -> None:
    for media in MEDIA_FILES.values():
        if not media.exists():
            raise FileNotFoundError(media)

    with ZipFile(SOURCE, "r") as src, ZipFile(OUTPUT, "w", compression=ZIP_DEFLATED) as dst:
        copied = set()

        for item in src.infolist():
            data = src.read(item.filename)
            if item.filename == "ppt/slides/slide1.xml":
                data = update_slide_xml(data)
            elif item.filename == "ppt/slides/_rels/slide1.xml.rels":
                data = update_slide_rels(data)
            elif item.filename == "[Content_Types].xml":
                data = update_content_types(data)
            elif item.filename == "docProps/core.xml":
                data = update_core_xml(data)

            dst.writestr(item.filename, data)
            copied.add(item.filename)

        for target, path in MEDIA_FILES.items():
            if target not in copied:
                dst.writestr(target, path.read_bytes())


if __name__ == "__main__":
    build()
