import xml.etree.ElementTree as ET

def create_cell(parent, id_val, value, style, x, y, width, height, parent_id="1", vertex="1", edge=None):
    attribs = {"id": id_val, "value": value, "style": style, "parent": parent_id}
    if vertex:
        attribs["vertex"] = "1"
    if edge:
        attribs["edge"] = "1"
    cell = ET.SubElement(parent, "mxCell", **attribs)
    if edge:
        geom = ET.SubElement(cell, "mxGeometry", relative="1", **{"as": "geometry"})
    else:
        geom = ET.SubElement(cell, "mxGeometry", x=str(x), y=str(y), width=str(width), height=str(height), **{"as": "geometry"})
    return cell, geom

root_xml = ET.Element("mxfile", host="Electron", modified="2024-05-05T00:00:00.000Z", agent="Mozilla/5.0", version="24.2.5", type="device")
diagram = ET.SubElement(root_xml, "diagram", id="ui-wireframes", name="Wireframes")
mxGraphModel = ET.SubElement(diagram, "mxGraphModel", dx="1000", dy="1000", grid="1", gridSize="10", guides="1", tooltips="1", connect="1", arrows="1", fold="1", page="1", pageScale="1", pageWidth="1600", pageHeight="1200", math="0", shadow="0")
root = ET.SubElement(mxGraphModel, "root")
ET.SubElement(root, "mxCell", id="0")
ET.SubElement(root, "mxCell", id="1", parent="0")

# --- 1. Login Screen ---
bg_style = "swimlane;whiteSpace=wrap;html=1;startSize=23;"
create_cell(root, "screen1", "Login Screen", bg_style, 50, 50, 300, 600)
create_cell(root, "l_title", "Congregate&lt;br&gt;&lt;b&gt;Growth Forecasting&lt;/b&gt;", "text;html=1;align=center;verticalAlign=middle;fontSize=20;", 25, 120, 250, 60, "screen1")
create_cell(root, "l_email", "Email Address", "rounded=1;whiteSpace=wrap;html=1;align=left;spacingLeft=10;fillColor=#f3f4f6;", 25, 250, 250, 40, "screen1")
create_cell(root, "l_pass", "Password", "rounded=1;whiteSpace=wrap;html=1;align=left;spacingLeft=10;fillColor=#f3f4f6;", 25, 310, 250, 40, "screen1")
create_cell(root, "l_btn", "Sign In", "rounded=1;whiteSpace=wrap;html=1;fillColor=#0f766e;fontColor=#ffffff;fontStyle=1", 25, 380, 250, 40, "screen1")

# --- 2. Attendance Logger ---
create_cell(root, "screen2", "Attendance Logger", bg_style, 400, 50, 300, 600)
create_cell(root, "a_header", "Log Attendance", "text;html=1;align=center;verticalAlign=middle;fontSize=18;fontStyle=1;", 25, 50, 250, 40, "screen2")
create_cell(root, "a_group", "Select Group: Main Service v", "rounded=1;whiteSpace=wrap;html=1;align=left;spacingLeft=10;", 25, 120, 250, 40, "screen2")
create_cell(root, "a_date", "Date: May 5, 2026", "rounded=1;whiteSpace=wrap;html=1;align=left;spacingLeft=10;", 25, 180, 250, 40, "screen2")
create_cell(root, "a_headcount_lbl", "Total Headcount", "text;html=1;align=center;verticalAlign=middle;fontSize=14;", 25, 250, 250, 20, "screen2")
create_cell(root, "a_headcount", "450", "rounded=1;whiteSpace=wrap;html=1;align=center;fontSize=36;fontStyle=1;fillColor=#f9fafb;", 75, 280, 150, 80, "screen2")
create_cell(root, "a_submit", "SUBMIT", "rounded=1;whiteSpace=wrap;html=1;fillColor=#0f766e;fontColor=#ffffff;fontStyle=1;fontSize=16;", 25, 400, 250, 60, "screen2")
create_cell(root, "a_success", "&lt;font color=&quot;#0f766e&quot;&gt;✓ Successfully logged!&lt;/font&gt;", "text;html=1;align=center;verticalAlign=middle;fontSize=14;", 25, 480, 250, 30, "screen2")

# --- 3. Home Dashboard ---
create_cell(root, "screen3", "Home Dashboard", bg_style, 750, 50, 350, 700)
create_cell(root, "d_header", "Dashboard", "text;html=1;align=left;verticalAlign=middle;fontSize=20;fontStyle=1;", 25, 40, 300, 40, "screen3")

# Card 1
card_style = "rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#d1d5db;"
create_cell(root, "d_c1", "", card_style, 25, 100, 300, 120, "screen3")
create_cell(root, "d_c1_title", "&lt;b&gt;Main Service&lt;/b&gt;", "text;html=1;align=left;verticalAlign=middle;fontSize=16;", 40, 110, 150, 30, "screen3")
create_cell(root, "d_c1_hc", "Last: 450", "text;html=1;align=left;verticalAlign=middle;fontSize=14;fontColor=#4b5563;", 40, 140, 100, 30, "screen3")
create_cell(root, "d_c1_trend", "↗ 4-wk trend (+5%)", "text;html=1;align=left;verticalAlign=middle;fontSize=14;fontColor=#0f766e;fontStyle=1;", 40, 170, 150, 30, "screen3")
create_cell(root, "d_c1_alert", "2 Alerts", "rounded=1;whiteSpace=wrap;html=1;fillColor=#f59e0b;fontColor=#ffffff;fontStyle=1;strokeColor=none;", 240, 115, 60, 25, "screen3")

# Card 2
create_cell(root, "d_c2", "", card_style, 25, 240, 300, 120, "screen3")
create_cell(root, "d_c2_title", "&lt;b&gt;Youth Ministry&lt;/b&gt;", "text;html=1;align=left;verticalAlign=middle;fontSize=16;", 40, 250, 150, 30, "screen3")
create_cell(root, "d_c2_hc", "Last: 85", "text;html=1;align=left;verticalAlign=middle;fontSize=14;fontColor=#4b5563;", 40, 280, 100, 30, "screen3")
create_cell(root, "d_c2_trend", "→ 4-wk trend (0%)", "text;html=1;align=left;verticalAlign=middle;fontSize=14;fontColor=#6b7280;", 40, 310, 150, 30, "screen3")

# Card 3
create_cell(root, "d_c3", "", card_style, 25, 380, 300, 120, "screen3")
create_cell(root, "d_c3_title", "&lt;b&gt;Children&#39;s Church&lt;/b&gt;", "text;html=1;align=left;verticalAlign=middle;fontSize=16;", 40, 390, 150, 30, "screen3")
create_cell(root, "d_c3_hc", "Last: 120", "text;html=1;align=left;verticalAlign=middle;fontSize=14;fontColor=#4b5563;", 40, 420, 100, 30, "screen3")
create_cell(root, "d_c3_trend", "↘ 4-wk trend (-2%)", "text;html=1;align=left;verticalAlign=middle;fontSize=14;fontColor=#4b5563;", 40, 450, 150, 30, "screen3")
create_cell(root, "d_c3_alert", "1 Alert", "rounded=1;whiteSpace=wrap;html=1;fillColor=#f59e0b;fontColor=#ffffff;fontStyle=1;strokeColor=none;", 240, 395, 60, 25, "screen3")

# Nav
create_cell(root, "d_nav", "Home | Log | Groups", "rounded=0;whiteSpace=wrap;html=1;fillColor=#f3f4f6;strokeColor=none;", 0, 650, 350, 50, "screen3")


# --- 4. Group Detail Page ---
create_cell(root, "screen4", "Group Detail", bg_style, 1150, 50, 350, 700)
create_cell(root, "gd_back", "&lt; Back", "text;html=1;align=left;verticalAlign=middle;fontSize=14;fontColor=#0f766e;", 20, 40, 60, 30, "screen4")
create_cell(root, "gd_header", "Main Service", "text;html=1;align=center;verticalAlign=middle;fontSize=20;fontStyle=1;", 80, 40, 190, 30, "screen4")

# Alert Banner
create_cell(root, "gd_alert", "⚠ Expected high attendance next week (+15%).", "rounded=1;whiteSpace=wrap;html=1;fillColor=#fef3c7;strokeColor=#f59e0b;fontColor=#b45309;align=left;spacingLeft=10;", 20, 90, 310, 50, "screen4")

# Chart Area
create_cell(root, "gd_chart_bg", "", "rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#d1d5db;", 20, 160, 310, 200, "screen4")
create_cell(root, "gd_chart_title", "12-Week History &amp; Forecast", "text;html=1;align=center;verticalAlign=middle;fontSize=12;fontColor=#6b7280;", 20, 170, 310, 20, "screen4")

# Mock Chart Line
c1, g1 = create_cell(root, "gd_chart_line1", "", "endArrow=none;html=1;strokeColor=#6b7280;strokeWidth=2;", 0, 0, 0, 0, "screen4", vertex=None, edge="1")
ET.SubElement(g1, "mxPoint", x="40", y="320", **{"as": "sourcePoint"})
ET.SubElement(g1, "mxPoint", x="110", y="280", **{"as": "targetPoint"})

c2, g2 = create_cell(root, "gd_chart_line2", "", "endArrow=none;html=1;strokeColor=#6b7280;strokeWidth=2;", 0, 0, 0, 0, "screen4", vertex=None, edge="1")
ET.SubElement(g2, "mxPoint", x="110", y="280", **{"as": "sourcePoint"})
ET.SubElement(g2, "mxPoint", x="180", y="260", **{"as": "targetPoint"})

# Forecast line (dashed)
c3, g3 = create_cell(root, "gd_chart_line3", "", "endArrow=none;html=1;strokeColor=#0f766e;strokeWidth=2;dashed=1;", 0, 0, 0, 0, "screen4", vertex=None, edge="1")
ET.SubElement(g3, "mxPoint", x="180", y="260", **{"as": "sourcePoint"})
ET.SubElement(g3, "mxPoint", x="310", y="190", **{"as": "targetPoint"})

create_cell(root, "gd_chart_label_hist", "History", "text;html=1;align=center;verticalAlign=middle;fontSize=10;fontColor=#6b7280;", 80, 330, 60, 20, "screen4")
create_cell(root, "gd_chart_label_fcast", "Forecast", "text;html=1;align=center;verticalAlign=middle;fontSize=10;fontColor=#0f766e;", 220, 330, 60, 20, "screen4")


# Recommendation Card
create_cell(root, "gd_rec_bg", "", "rounded=1;whiteSpace=wrap;html=1;fillColor=#f0fdf4;strokeColor=#86efac;", 20, 380, 310, 120, "screen4")
create_cell(root, "gd_rec_title", "&lt;b&gt;Recommendation&lt;/b&gt;", "text;html=1;align=left;verticalAlign=middle;fontSize=14;fontColor=#166534;", 35, 390, 150, 30, "screen4")
create_cell(root, "gd_rec_text", "Consider opening the balcony overflow seating. Ensure 3 extra ushers are scheduled.", "text;html=1;align=left;verticalAlign=top;fontSize=12;fontColor=#166534;whiteSpace=wrap;", 35, 420, 280, 40, "screen4")
create_cell(root, "gd_rec_dismiss", "Dismiss", "rounded=1;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#166534;fontColor=#166534;fontStyle=1;fontSize=12;", 230, 460, 80, 30, "screen4")


tree = ET.ElementTree(root_xml)
ET.indent(tree, space="  ", level=0)
with open("c:\\Users\\victo\\.gemini\\antigravity\\scratch\\congregate\\scratch\\wireframes.drawio", "wb") as f:
    tree.write(f, encoding="utf-8", xml_declaration=True)

print("Generated wireframes.drawio successfully!")
