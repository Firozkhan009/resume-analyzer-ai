from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape
import zipfile


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "Poster_Patan.pptx"

SLIDE_W = 12_192_000
SLIDE_H = 6_858_000


TITLE = "AI-Powered Resume Analyzer: ATS and Job-Fit Feedback"
AUTHORS = "Firoz Khan Patan"
FACULTY_ADVISOR = "Dr. Krzysztof J. Kochut"
ABSTRACT = (
    "AI-Powered Resume Analyzer is a web application for job seekers who want a clearer read on a "
    "resume before sending it to an employer. The user uploads a PDF resume, enters "
    "the target company, role, and job description, and receives a structured review "
    "across ATS readiness, writing tone, content strength, layout, skill match, and "
    "overall job fit. The app uses React Router, TypeScript, Zustand, PDF processing, "
    "and Puter services for authentication, file storage, key-value persistence, and "
    "AI-assisted feedback. The Resume Analyzer is designed as a practical review aid: it "
    "highlights what already works, points out weak or missing evidence, and helps "
    "users revise a resume for a specific opportunity rather than relying on one "
    "generic version."
)


def emu(value: float) -> int:
    return int(value)


def paragraph_xml(text: str, font_size: int = 1800, bold: bool = False, color: str = "1F2937") -> str:
    bold_attr = ' b="1"' if bold else ""
    return (
        "<a:p>"
        f'<a:r><a:rPr lang="en-US" sz="{font_size}"{bold_attr} dirty="0" smtClean="0">'
        f'<a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
        "</a:rPr>"
        f"<a:t>{escape(text)}</a:t></a:r>"
        "</a:p>"
    )


def textbox_xml(
    shape_id: int,
    name: str,
    x: int,
    y: int,
    cx: int,
    cy: int,
    paragraphs: list[str],
    fill: str | None = None,
    preset: str = "rect",
) -> str:
    fill_xml = "<a:noFill/>" if fill is None else f"<a:solidFill><a:srgbClr val=\"{fill}\"/></a:solidFill>"
    return f"""
    <p:sp>
      <p:nvSpPr>
        <p:cNvPr id="{shape_id}" name="{escape(name)}"/>
        <p:cNvSpPr txBox="1"/>
        <p:nvPr/>
      </p:nvSpPr>
      <p:spPr>
        <a:xfrm>
          <a:off x="{x}" y="{y}"/>
          <a:ext cx="{cx}" cy="{cy}"/>
        </a:xfrm>
        <a:prstGeom prst="{preset}"><a:avLst/></a:prstGeom>
        {fill_xml}
        <a:ln><a:noFill/></a:ln>
      </p:spPr>
      <p:txBody>
        <a:bodyPr wrap="square" lIns="91440" tIns="45720" rIns="91440" bIns="45720" anchor="t"/>
        <a:lstStyle/>
        {''.join(paragraphs)}
      </p:txBody>
    </p:sp>
    """


def shape_xml(
    shape_id: int,
    name: str,
    x: int,
    y: int,
    cx: int,
    cy: int,
    fill: str,
    preset: str = "rect",
    line_fill: str | None = None,
    line_width: int = 9525,
) -> str:
    line_xml = (
        "<a:ln><a:noFill/></a:ln>"
        if line_fill is None
        else f'<a:ln w="{line_width}"><a:solidFill><a:srgbClr val="{line_fill}"/></a:solidFill></a:ln>'
    )
    return f"""
    <p:sp>
      <p:nvSpPr>
        <p:cNvPr id="{shape_id}" name="{escape(name)}"/>
        <p:cNvSpPr/>
        <p:nvPr/>
      </p:nvSpPr>
      <p:spPr>
        <a:xfrm>
          <a:off x="{x}" y="{y}"/>
          <a:ext cx="{cx}" cy="{cy}"/>
        </a:xfrm>
        <a:prstGeom prst="{preset}"><a:avLst/></a:prstGeom>
        <a:solidFill><a:srgbClr val="{fill}"/></a:solidFill>
        {line_xml}
      </p:spPr>
      <p:txBody>
        <a:bodyPr/>
        <a:lstStyle/>
        <a:p/>
      </p:txBody>
    </p:sp>
    """


def slide_xml() -> str:
    shapes: list[str] = []

    shapes.append(shape_xml(2, "Background", 0, 0, SLIDE_W, SLIDE_H, "F4F0E8"))
    shapes.append(shape_xml(3, "Top Wash", 0, 0, SLIDE_W, 1_080_000, "E7EFEA"))
    shapes.append(shape_xml(4, "Header Band", 0, 0, SLIDE_W, 900_000, "173F43"))
    shapes.append(shape_xml(5, "Accent Dot Left", -180_000, 910_000, 1_350_000, 1_350_000, "D8E6E1", preset="ellipse"))
    shapes.append(shape_xml(6, "Accent Dot Right", 10_950_000, 5_150_000, 1_500_000, 1_500_000, "E7D7C4", preset="ellipse"))
    shapes.append(shape_xml(7, "Footer Line", 0, 6_430_000, SLIDE_W, 80_000, "A56A43"))
    shapes.append(
        shape_xml(
            8,
            "Title Card",
            330_000,
            130_000,
            11_520_000,
            710_000,
            "173F43",
            preset="roundRect",
        )
    )

    shapes.append(
        textbox_xml(
            9,
            "Title",
            420_000,
            140_000,
            10_900_000,
            620_000,
            [
                paragraph_xml(TITLE, font_size=2360, bold=True, color="FFFFFF"),
                paragraph_xml(f"Author: {AUTHORS}", font_size=1160, color="DCE9E5"),
                paragraph_xml(f"Faculty Advisor: {FACULTY_ADVISOR}", font_size=1080, color="DCE9E5"),
            ],
        )
    )

    col_w = 3_560_000
    gutter = 210_000
    left_x = 330_000
    mid_x = left_x + col_w + gutter
    right_x = mid_x + col_w + gutter
    top_y = 1_180_000
    box_h = 1_450_000
    lower_y = top_y + box_h + 220_000

    def add_panel(shape_base: int, x: int, y: int, title: str, body_lines: list[str], accent: str) -> None:
        shapes.append(
            shape_xml(
                shape_base,
                f"{title} Card",
                x,
                y,
                col_w,
                box_h,
                "FCFBF8",
                preset="roundRect",
                line_fill="D7D2C8",
                line_width=12700,
            )
        )
        shapes.append(shape_xml(shape_base + 1, f"{title} Accent", x, y, col_w, 110_000, accent, preset="roundRect"))
        paragraphs = [paragraph_xml(title, font_size=1560, bold=True, color="173F43")]
        paragraphs.extend(paragraph_xml(line, font_size=1020, color="334155") for line in body_lines)
        shapes.append(
            textbox_xml(
                shape_base + 2,
                f"{title} Text",
                x + 90_000,
                y + 130_000,
                col_w - 180_000,
                box_h - 180_000,
                paragraphs,
            )
        )

    add_panel(
        10,
        left_x,
        top_y,
        "Problem",
        [
            "Many applicants send the same resume to every role.",
            "ATS requirements are hard to judge before an application is submitted.",
        ],
        "9C6644",
    )
    add_panel(
        13,
        mid_x,
        top_y,
        "Solution",
        [
            "The Resume Analyzer checks an uploaded PDF against a real job description.",
            "It returns section scores, fit signals, and revision notes.",
        ],
        "3E6B6F",
    )
    add_panel(
        16,
        right_x,
        top_y,
        "System Design",
        [
            "Frontend: React Router + TypeScript + Zustand.",
            "Services: Puter auth, file storage, KV persistence, and AI feedback APIs.",
            "PDFs are converted into preview images before analysis.",
        ],
        "6F8C69",
    )
    add_panel(
        19,
        left_x,
        lower_y,
        "Workflow",
        [
            "1. User signs in and uploads a resume PDF.",
            "2. App captures company, job title, and job description.",
            "3. AI returns structured JSON feedback and overall scoring.",
        ],
        "7B6D8D",
    )
    add_panel(
        22,
        mid_x,
        lower_y,
        "Key Outputs",
        [
            "ATS score",
            "Tone and style score",
            "Content, structure, and skills feedback",
            "Actionable tips shown in the review dashboard",
        ],
        "4F7C82",
    )
    add_panel(
        25,
        right_x,
        lower_y,
        "Impact",
        [
            "Turns resume review into a guided and repeatable process.",
            "Helps users revise resumes around role-specific evidence.",
        ],
        "B07A4F",
    )

    shapes.append(
        shape_xml(
            28,
            "Abstract Card",
            330_000,
            5_180_000,
            11_520_000,
            1_050_000,
            "FFFDF8",
            preset="roundRect",
            line_fill="DDD5C9",
            line_width=12700,
        )
    )
    shapes.append(
        textbox_xml(
            29,
            "Abstract",
            420_000,
            5_250_000,
            11_300_000,
            980_000,
            [
                paragraph_xml("Abstract", font_size=1480, bold=True, color="173F43"),
                paragraph_xml(ABSTRACT, font_size=980, color="374151"),
            ],
        )
    )

    shape_tree = "".join(shapes)
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
      {shape_tree}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>
"""


def presentation_xml() -> str:
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
 saveSubsetFonts="1" autoCompressPictures="0">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId2"/>
  </p:sldIdLst>
  <p:sldSz cx="{SLIDE_W}" cy="{SLIDE_H}"/>
  <p:notesSz cx="6858000" cy="9144000"/>
  <p:defaultTextStyle/>
</p:presentation>
"""


def content_types_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>
"""


def root_rels_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>
"""


def presentation_rels_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
</Relationships>
"""


def slide_rels_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>
"""


def slide_layout_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
 type="blank" preserve="1">
  <p:cSld name="Blank">
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>
"""


def slide_layout_rels_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>
"""


def slide_master_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld name="Office Theme">
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst>
    <p:sldLayoutId id="2147483649" r:id="rId1"/>
  </p:sldLayoutIdLst>
  <p:txStyles>
    <p:titleStyle/>
    <p:bodyStyle/>
    <p:otherStyle/>
  </p:txStyles>
</p:sldMaster>
"""


def slide_master_rels_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>
"""


def theme_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Custom Theme">
  <a:themeElements>
    <a:clrScheme name="Custom">
      <a:dk1><a:srgbClr val="000000"/></a:dk1>
      <a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="1F2937"/></a:dk2>
      <a:lt2><a:srgbClr val="F9FAFB"/></a:lt2>
      <a:accent1><a:srgbClr val="0F3D3E"/></a:accent1>
      <a:accent2><a:srgbClr val="D97706"/></a:accent2>
      <a:accent3><a:srgbClr val="2563EB"/></a:accent3>
      <a:accent4><a:srgbClr val="16A34A"/></a:accent4>
      <a:accent5><a:srgbClr val="DC2626"/></a:accent5>
      <a:accent6><a:srgbClr val="7C3AED"/></a:accent6>
      <a:hlink><a:srgbClr val="2563EB"/></a:hlink>
      <a:folHlink><a:srgbClr val="7C3AED"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Custom">
      <a:majorFont>
        <a:latin typeface="Aptos Display"/>
        <a:ea typeface=""/>
        <a:cs typeface=""/>
      </a:majorFont>
      <a:minorFont>
        <a:latin typeface="Aptos"/>
        <a:ea typeface=""/>
        <a:cs typeface=""/>
      </a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Custom">
      <a:fillStyleLst>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:gradFill rotWithShape="1">
          <a:gsLst>
            <a:gs pos="0"><a:schemeClr val="phClr"/></a:gs>
            <a:gs pos="100000"><a:schemeClr val="phClr"/></a:gs>
          </a:gsLst>
          <a:lin ang="5400000" scaled="0"/>
        </a:gradFill>
      </a:fillStyleLst>
      <a:lnStyleLst>
        <a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
      </a:lnStyleLst>
      <a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
      <a:bgFillStyleLst>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
      </a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
  <a:objectDefaults/>
  <a:extraClrSchemeLst/>
</a:theme>
"""


def app_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
 xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Microsoft Office PowerPoint</Application>
  <PresentationFormat>On-screen Show (16:9)</PresentationFormat>
  <Slides>1</Slides>
  <Notes>0</Notes>
  <HiddenSlides>0</HiddenSlides>
  <MMClips>0</MMClips>
  <ScaleCrop>false</ScaleCrop>
  <HeadingPairs>
    <vt:vector size="2" baseType="variant">
      <vt:variant><vt:lpstr>Theme</vt:lpstr></vt:variant>
      <vt:variant><vt:i4>1</vt:i4></vt:variant>
    </vt:vector>
  </HeadingPairs>
  <TitlesOfParts>
    <vt:vector size="1" baseType="lpstr">
      <vt:lpstr>Poster</vt:lpstr>
    </vt:vector>
  </TitlesOfParts>
  <Company></Company>
  <LinksUpToDate>false</LinksUpToDate>
  <SharedDoc>false</SharedDoc>
  <HyperlinksChanged>false</HyperlinksChanged>
  <AppVersion>16.0000</AppVersion>
</Properties>
"""


def core_xml() -> str:
    timestamp = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
 xmlns:dc="http://purl.org/dc/elements/1.1/"
 xmlns:dcterms="http://purl.org/dc/terms/"
 xmlns:dcmitype="http://purl.org/dc/dcmitype/"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>{escape(TITLE)}</dc:title>
  <dc:creator>{escape(AUTHORS)}</dc:creator>
  <cp:lastModifiedBy>{escape(AUTHORS)}</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">{timestamp}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">{timestamp}</dcterms:modified>
</cp:coreProperties>
"""


def build_pptx() -> None:
    files = {
        "[Content_Types].xml": content_types_xml(),
        "_rels/.rels": root_rels_xml(),
        "docProps/app.xml": app_xml(),
        "docProps/core.xml": core_xml(),
        "ppt/presentation.xml": presentation_xml(),
        "ppt/_rels/presentation.xml.rels": presentation_rels_xml(),
        "ppt/slides/slide1.xml": slide_xml(),
        "ppt/slides/_rels/slide1.xml.rels": slide_rels_xml(),
        "ppt/slideLayouts/slideLayout1.xml": slide_layout_xml(),
        "ppt/slideLayouts/_rels/slideLayout1.xml.rels": slide_layout_rels_xml(),
        "ppt/slideMasters/slideMaster1.xml": slide_master_xml(),
        "ppt/slideMasters/_rels/slideMaster1.xml.rels": slide_master_rels_xml(),
        "ppt/theme/theme1.xml": theme_xml(),
    }

    with zipfile.ZipFile(OUTPUT, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for path, content in files.items():
            zf.writestr(path, content)


if __name__ == "__main__":
    build_pptx()
