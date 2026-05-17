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
diagram = ET.SubElement(root_xml, "diagram", id="ui-wireframes-desktop", name="Desktop Wireframes")
mxGraphModel = ET.SubElement(diagram, "mxGraphModel", dx="1000", dy="1000", grid="1", gridSize="10", guides="1", tooltips="1", connect="1", arrows="1", fold="1", page="1", pageScale="1", pageWidth="2400", pageHeight="2000", math="0", shadow="0")
root = ET.SubElement(mxGraphModel, "root")
ET.SubElement(root, "mxCell", id="0")
ET.SubElement(root, "mxCell", id="1", parent="0")

bg_style = "swimlane;whiteSpace=wrap;html=1;startSize=23;"
desk_w = 1024
desk_h = 768

# --- 1. Login Screen ---
sx, sy = 50, 50
create_cell(root, "screen1", "Login Screen (Desktop)", bg_style, sx, sy, desk_w, desk_h)

# Login Box in Center
box_w, box_h = 400, 400
bx, by = (desk_w - box_w) // 2, (desk_h - box_h) // 2
create_cell(root, "l_box", "", "rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#d1d5db;shadow=1;", bx, by, box_w, box_h, "screen1")
create_cell(root, "l_title", "Congregate&lt;br&gt;&lt;b&gt;Growth Forecasting&lt;/b&gt;", "text;html=1;align=center;verticalAlign=middle;fontSize=24;", bx, by + 40, box_w, 60, "screen1")
create_cell(root, "l_email", "Email Address", "rounded=1;whiteSpace=wrap;html=1;align=left;spacingLeft=15;fillColor=#f3f4f6;", bx + 50, by + 140, box_w - 100, 50, "screen1")
create_cell(root, "l_pass", "Password", "rounded=1;whiteSpace=wrap;html=1;align=left;spacingLeft=15;fillColor=#f3f4f6;", bx + 50, by + 210, box_w - 100, 50, "screen1")
create_cell(root, "l_btn", "Sign In", "rounded=1;whiteSpace=wrap;html=1;fillColor=#0f766e;fontColor=#ffffff;fontStyle=1;fontSize=16;", bx + 50, by + 290, box_w - 100, 50, "screen1")


# --- 2. Attendance Logger ---
sx, sy = 1150, 50
create_cell(root, "screen2", "Attendance Logger (Desktop)", bg_style, sx, sy, desk_w, desk_h)

# Header
create_cell(root, "a_header", "Log Attendance", "text;html=1;align=left;verticalAlign=middle;fontSize=24;fontStyle=1;", 50, 50, 300, 50, "screen2")

# Main Content Box
cx, cy, cw, ch = 50, 120, 600, 500
create_cell(root, "a_box", "", "rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#d1d5db;", cx, cy, cw, ch, "screen2")
create_cell(root, "a_group", "Select Group: Main Service v", "rounded=1;whiteSpace=wrap;html=1;align=left;spacingLeft=15;fontSize=16;", cx + 50, cy + 50, cw - 100, 50, "screen2")
create_cell(root, "a_date", "Date: May 5, 2026", "rounded=1;whiteSpace=wrap;html=1;align=left;spacingLeft=15;fontSize=16;", cx + 50, cy + 120, cw - 100, 50, "screen2")

create_cell(root, "a_headcount_lbl", "Total Headcount", "text;html=1;align=center;verticalAlign=middle;fontSize=18;", cx + 50, cy + 200, cw - 100, 30, "screen2")
create_cell(root, "a_headcount", "450", "rounded=1;whiteSpace=wrap;html=1;align=center;fontSize=48;fontStyle=1;fillColor=#f9fafb;", cx + 200, cy + 240, cw - 400, 100, "screen2")
create_cell(root, "a_submit", "SUBMIT", "rounded=1;whiteSpace=wrap;html=1;fillColor=#0f766e;fontColor=#ffffff;fontStyle=1;fontSize=18;", cx + 150, cy + 370, cw - 300, 60, "screen2")

create_cell(root, "a_success", "&lt;font color=&quot;#0f766e&quot;&gt;✓ Successfully logged!&lt;/font&gt;", "text;html=1;align=center;verticalAlign=middle;fontSize=16;", cx + 50, cy + 450, cw - 100, 30, "screen2")


# --- 3. Home Dashboard ---
sx, sy = 50, 850
create_cell(root, "screen3", "Home Dashboard (Desktop)", bg_style, sx, sy, desk_w, desk_h)

# Sidebar
sidebar_w = 200
create_cell(root, "d_sidebar", "", "rounded=0;whiteSpace=wrap;html=1;fillColor=#f3f4f6;strokeColor=none;", 0, 23, sidebar_w, desk_h - 23, "screen3")
create_cell(root, "d_logo", "&lt;b&gt;Congregate&lt;/b&gt;", "text;html=1;align=left;verticalAlign=middle;fontSize=18;spacingLeft=20;", 0, 40, sidebar_w, 40, "screen3")
create_cell(root, "d_nav1", "Home Dashboard", "rounded=0;whiteSpace=wrap;html=1;fillColor=#e5e7eb;strokeColor=none;align=left;spacingLeft=20;fontStyle=1;", 0, 100, sidebar_w, 40, "screen3")
create_cell(root, "d_nav2", "Log Attendance", "rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=none;align=left;spacingLeft=20;", 0, 140, sidebar_w, 40, "screen3")
create_cell(root, "d_nav3", "Groups", "rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=none;align=left;spacingLeft=20;", 0, 180, sidebar_w, 40, "screen3")

# Main Content Area
mcx = sidebar_w + 40
create_cell(root, "d_header", "Dashboard Overview", "text;html=1;align=left;verticalAlign=middle;fontSize=24;fontStyle=1;", mcx, 40, 400, 50, "screen3")

# Horizontal Cards Layout
card_w = 230
card_h = 140
card_style = "rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#d1d5db;shadow=1;"

# Card 1
create_cell(root, "d_c1", "", card_style, mcx, 120, card_w, card_h, "screen3")
create_cell(root, "d_c1_title", "&lt;b&gt;Main Service&lt;/b&gt;", "text;html=1;align=left;verticalAlign=middle;fontSize=16;", mcx + 20, 130, 150, 30, "screen3")
create_cell(root, "d_c1_hc", "Last: 450", "text;html=1;align=left;verticalAlign=middle;fontSize=14;fontColor=#4b5563;", mcx + 20, 165, 100, 30, "screen3")
create_cell(root, "d_c1_trend", "↗ 4-wk trend (+5%)", "text;html=1;align=left;verticalAlign=middle;fontSize=14;fontColor=#0f766e;fontStyle=1;", mcx + 20, 200, 150, 30, "screen3")
create_cell(root, "d_c1_alert", "2 Alerts", "rounded=1;whiteSpace=wrap;html=1;fillColor=#f59e0b;fontColor=#ffffff;fontStyle=1;strokeColor=none;", mcx + 150, 135, 60, 25, "screen3")

# Card 2
create_cell(root, "d_c2", "", card_style, mcx + card_w + 20, 120, card_w, card_h, "screen3")
create_cell(root, "d_c2_title", "&lt;b&gt;Youth Ministry&lt;/b&gt;", "text;html=1;align=left;verticalAlign=middle;fontSize=16;", mcx + card_w + 40, 130, 150, 30, "screen3")
create_cell(root, "d_c2_hc", "Last: 85", "text;html=1;align=left;verticalAlign=middle;fontSize=14;fontColor=#4b5563;", mcx + card_w + 40, 165, 100, 30, "screen3")
create_cell(root, "d_c2_trend", "→ 4-wk trend (0%)", "text;html=1;align=left;verticalAlign=middle;fontSize=14;fontColor=#6b7280;", mcx + card_w + 40, 200, 150, 30, "screen3")

# Card 3
create_cell(root, "d_c3", "", card_style, mcx + (card_w + 20)*2, 120, card_w, card_h, "screen3")
create_cell(root, "d_c3_title", "&lt;b&gt;Children&#39;s Church&lt;/b&gt;", "text;html=1;align=left;verticalAlign=middle;fontSize=16;", mcx + (card_w + 20)*2 + 20, 130, 150, 30, "screen3")
create_cell(root, "d_c3_hc", "Last: 120", "text;html=1;align=left;verticalAlign=middle;fontSize=14;fontColor=#4b5563;", mcx + (card_w + 20)*2 + 20, 165, 100, 30, "screen3")
create_cell(root, "d_c3_trend", "↘ 4-wk trend (-2%)", "text;html=1;align=left;verticalAlign=middle;fontSize=14;fontColor=#4b5563;", mcx + (card_w + 20)*2 + 20, 200, 150, 30, "screen3")
create_cell(root, "d_c3_alert", "1 Alert", "rounded=1;whiteSpace=wrap;html=1;fillColor=#f59e0b;fontColor=#ffffff;fontStyle=1;strokeColor=none;", mcx + (card_w + 20)*2 + 150, 135, 60, 25, "screen3")

# Large Chart placeholder on Dashboard
create_cell(root, "d_chart", "Overall Growth (12 Weeks)", "rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#d1d5db;align=center;verticalAlign=middle;color=#9ca3af;fontSize=20;", mcx, 300, 730, 400, "screen3")


# --- 4. Group Detail Page ---
sx, sy = 1150, 850
create_cell(root, "screen4", "Group Detail (Desktop)", bg_style, sx, sy, desk_w, desk_h)

# Sidebar
create_cell(root, "gd_sidebar", "", "rounded=0;whiteSpace=wrap;html=1;fillColor=#f3f4f6;strokeColor=none;", 0, 23, sidebar_w, desk_h - 23, "screen4")
create_cell(root, "gd_logo", "&lt;b&gt;Congregate&lt;/b&gt;", "text;html=1;align=left;verticalAlign=middle;fontSize=18;spacingLeft=20;", 0, 40, sidebar_w, 40, "screen4")
create_cell(root, "gd_nav1", "Home Dashboard", "rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=none;align=left;spacingLeft=20;", 0, 100, sidebar_w, 40, "screen4")
create_cell(root, "gd_nav2", "Log Attendance", "rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=none;align=left;spacingLeft=20;", 0, 140, sidebar_w, 40, "screen4")
create_cell(root, "gd_nav3", "Groups", "rounded=0;whiteSpace=wrap;html=1;fillColor=#e5e7eb;strokeColor=none;align=left;spacingLeft=20;fontStyle=1;", 0, 180, sidebar_w, 40, "screen4")
create_cell(root, "gd_nav_sub1", "&gt; Main Service", "text;html=1;align=left;verticalAlign=middle;fontSize=14;fontColor=#0f766e;spacingLeft=30;", 0, 220, sidebar_w, 30, "screen4")


# Main Content Area
create_cell(root, "gd_back", "&lt; Back to Groups", "text;html=1;align=left;verticalAlign=middle;fontSize=14;fontColor=#0f766e;", mcx, 40, 150, 30, "screen4")
create_cell(root, "gd_header", "Main Service", "text;html=1;align=left;verticalAlign=middle;fontSize=28;fontStyle=1;", mcx, 70, 300, 40, "screen4")

# Alert Banner - Full Width
create_cell(root, "gd_alert", "⚠ Expected high attendance next week (+15%).", "rounded=1;whiteSpace=wrap;html=1;fillColor=#fef3c7;strokeColor=#f59e0b;fontColor=#b45309;align=left;spacingLeft=20;fontSize=16;", mcx, 130, 750, 60, "screen4")

# Chart Area
chart_w = 750
chart_h = 350
create_cell(root, "gd_chart_bg", "", "rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#d1d5db;", mcx, 220, chart_w, chart_h, "screen4")
create_cell(root, "gd_chart_title", "12-Week History &amp; Forecast", "text;html=1;align=left;verticalAlign=middle;fontSize=16;fontColor=#4b5563;spacingLeft=20;", mcx, 230, 310, 30, "screen4")

# Mock Chart Lines - WIDER
hx, hy = mcx, 220
c1, g1 = create_cell(root, "gd_chart_line1", "", "endArrow=none;html=1;strokeColor=#6b7280;strokeWidth=3;", 0, 0, 0, 0, "screen4", vertex=None, edge="1")
ET.SubElement(g1, "mxPoint", x=str(hx+50), y=str(hy+250), **{"as": "sourcePoint"})
ET.SubElement(g1, "mxPoint", x=str(hx+200), y=str(hy+180), **{"as": "targetPoint"})

c2, g2 = create_cell(root, "gd_chart_line2", "", "endArrow=none;html=1;strokeColor=#6b7280;strokeWidth=3;", 0, 0, 0, 0, "screen4", vertex=None, edge="1")
ET.SubElement(g2, "mxPoint", x=str(hx+200), y=str(hy+180), **{"as": "sourcePoint"})
ET.SubElement(g2, "mxPoint", x=str(hx+400), y=str(hy+150), **{"as": "targetPoint"})

# Forecast line (dashed)
c3, g3 = create_cell(root, "gd_chart_line3", "", "endArrow=none;html=1;strokeColor=#0f766e;strokeWidth=3;dashed=1;", 0, 0, 0, 0, "screen4", vertex=None, edge="1")
ET.SubElement(g3, "mxPoint", x=str(hx+400), y=str(hy+150), **{"as": "sourcePoint"})
ET.SubElement(g3, "mxPoint", x=str(hx+650), y=str(hy+60), **{"as": "targetPoint"})

create_cell(root, "gd_chart_label_hist", "History", "text;html=1;align=center;verticalAlign=middle;fontSize=14;fontColor=#6b7280;", hx+180, hy+270, 80, 20, "screen4")
create_cell(root, "gd_chart_label_fcast", "Forecast", "text;html=1;align=center;verticalAlign=middle;fontSize=14;fontColor=#0f766e;", hx+500, hy+270, 80, 20, "screen4")


# Recommendation Card
create_cell(root, "gd_rec_bg", "", "rounded=1;whiteSpace=wrap;html=1;fillColor=#f0fdf4;strokeColor=#86efac;", mcx, 600, 750, 100, "screen4")
create_cell(root, "gd_rec_title", "&lt;b&gt;Recommendation&lt;/b&gt;", "text;html=1;align=left;verticalAlign=middle;fontSize=16;fontColor=#166534;", mcx+20, 610, 200, 30, "screen4")
create_cell(root, "gd_rec_text", "Consider opening the balcony overflow seating. Ensure 3 extra ushers are scheduled for the expected influx.", "text;html=1;align=left;verticalAlign=top;fontSize=14;fontColor=#166534;whiteSpace=wrap;", mcx+20, 640, 500, 40, "screen4")
create_cell(root, "gd_rec_dismiss", "Dismiss", "rounded=1;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#166534;fontColor=#166534;fontStyle=1;fontSize=14;", mcx+630, 635, 100, 40, "screen4")


tree = ET.ElementTree(root_xml)
ET.indent(tree, space="  ", level=0)
with open("c:\\Users\\victo\\.gemini\\antigravity\\scratch\\congregate\\scratch\\wireframes_desktop.drawio", "wb") as f:
    tree.write(f, encoding="utf-8", xml_declaration=True)

print("Generated wireframes_desktop.drawio successfully!")
