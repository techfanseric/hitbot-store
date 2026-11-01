"""Generate small, explicitly labelled fixtures for the resource UI prototype.

Requires reportlab. These are NOT HITBOT manuals or production CAD data.
"""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

root = Path(__file__).resolve().parents[1] / 'public/resources/examples'
root.mkdir(parents=True, exist_ok=True)
pdf = root / 'hitbot-resource-sample.pdf'
c = canvas.Canvas(str(pdf), pagesize=(595, 842), invariant=1)
c.setTitle('HITBOT Store - Resource download sample')
c.setAuthor('HITBOT Store prototype')
c.setFillColor(HexColor('#BD1C22'))
c.setFont('Helvetica-Bold', 15)
c.drawString(48, 780, 'HITBOT / STORE')
c.setFillColor(HexColor('#171716'))
c.setFont('Helvetica-Bold', 25)
c.drawString(48, 712, 'Product resource sample')
c.setFont('Helvetica', 12)
c.drawString(48, 683, 'PDF preview and download verification')
c.setFillColor(HexColor('#F2F2F0'))
c.roundRect(48, 552, 499, 89, 6, fill=1, stroke=0)
c.setFillColor(HexColor('#171716'))
c.setFont('Helvetica-Bold', 12)
c.drawString(64, 615, 'SAMPLE ONLY - NOT AN OFFICIAL PRODUCT MANUAL')
c.setFont('Helvetica', 11)
c.drawString(64, 591, 'This file verifies the storefront resource flow.')
c.drawString(64, 573, 'Do not use it for installation, operation, or engineering decisions.')
c.setFont('Helvetica-Bold', 14)
c.drawString(48, 505, 'What this sample verifies')
c.setFont('Helvetica', 12)
for y, line in [(475, '1. Open a PDF from the product detail page.'), (451, '2. Download it without signing in.'), (427, '3. Open the downloaded file in a PDF reader.')]:
    c.drawString(48, y, line)
c.setFillColor(HexColor('#6D6A66'))
c.setFont('Helvetica', 10)
c.drawString(48, 58, 'Replace this fixture with the approved product documentation before release.')
c.drawRightString(547, 58, '1 / 1')
c.save()

# A simple 10 mm faceted cube in STEP AP203. Deliberately not a product model.
entities = []
def add(value):
    entities.append(value)
    return f'#{len(entities)}'
app = add("APPLICATION_CONTEXT('configuration controlled 3d designs of mechanical parts and assemblies')")
add(f"APPLICATION_PROTOCOL_DEFINITION('international standard','config_control_design',1994,{app})")
prodctx = add(f"PRODUCT_CONTEXT('',{app},'mechanical')")
product = add(f"PRODUCT('SAMPLE-ONLY','10 mm cube - NOT a HITBOT product','Resource download fixture',({prodctx}))")
formation = add(f"PRODUCT_DEFINITION_FORMATION('1','',{product})")
defctx = add(f"PRODUCT_DEFINITION_CONTEXT('part definition',{app},'design')")
definition = add(f"PRODUCT_DEFINITION('design','',{formation},{defctx})")
shape = add(f"PRODUCT_DEFINITION_SHAPE('','',{definition})")
length = add("(LENGTH_UNIT() NAMED_UNIT(*) SI_UNIT(.MILLI.,.METRE.))")
angle = add("(NAMED_UNIT(*) PLANE_ANGLE_UNIT() SI_UNIT($,.RADIAN.))")
solid = add("(NAMED_UNIT(*) SI_UNIT($,.STERADIAN.) SOLID_ANGLE_UNIT())")
unc = add(f"UNCERTAINTY_MEASURE_WITH_UNIT(LENGTH_MEASURE(1.E-7),{length},'distance_accuracy_value','')")
context = add(f"(GEOMETRIC_REPRESENTATION_CONTEXT(3) GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT(({unc})) GLOBAL_UNIT_ASSIGNED_CONTEXT(({length},{angle},{solid})) REPRESENTATION_CONTEXT('',''))")
points = [add(f"CARTESIAN_POINT('',({x}.,{y}.,{z}.))") for x,y,z in [(0,0,0),(10,0,0),(10,10,0),(0,10,0),(0,0,10),(10,0,10),(10,10,10),(0,10,10)]]
faces = []
for ids in [(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]:
    loop=add("POLY_LOOP('',(" + ','.join(points[i] for i in ids) + '))')
    bound=add(f"FACE_OUTER_BOUND('',{loop},.T.)")
    faces.append(add(f"FACE('',({bound}))"))
shell = add("CLOSED_SHELL('',(" + ','.join(faces) + '))')
brep = add(f"FACETED_BREP('SAMPLE ONLY - 10 mm cube',{shell})")
rep = add(f"FACETED_BREP_SHAPE_REPRESENTATION('',({brep}),{context})")
add(f"SHAPE_DEFINITION_REPRESENTATION({shape},{rep})")
step = root / 'hitbot-model-sample.stp'
step.write_text("ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION(('SAMPLE ONLY - NOT A HITBOT PRODUCT MODEL'),'2;1');\nFILE_NAME('hitbot-model-sample.stp','2026-11-01T00:00:00',('HITBOT Store prototype'),(''),'Resource fixture','','');\nFILE_SCHEMA(('CONFIG_CONTROL_DESIGN'));\nENDSEC;\nDATA;\n" + ''.join(f'#{i}={v};\n' for i,v in enumerate(entities,1)) + 'ENDSEC;\nEND-ISO-10303-21;\n')
print({path.name: path.stat().st_size for path in (pdf, step)})
