"""A002 browser smoke test. Requires playwright Python + Chromium.
Runs local sources inlined into set_content when sandbox navigation is blocked.
The inline adapter replaces only the ES module import with the same field.mjs code;
it does not verify HTTP module loading or a production deployment.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / "index.html").read_text()
css = (ROOT / "style.css").read_text()
js = (ROOT / "app.js").read_text()
field = (ROOT / "field.mjs").read_text().replace("export const", "const").replace("export function", "function")
js = js.replace("import {flowAt, integratePassage, clamp} from './field.mjs';", field)
html = html.replace('<link rel="stylesheet" href="./style.css">', "<style>" + css + "</style>")
html = html.replace('<script type="module" src="./app.js"></script>', "")
html = html.replace("</body>", "<script>" + js + "</script></body>")

with sync_playwright() as p:
    browser = p.chromium.launch()
    for name, width, height, mobile, motion in [
        ("desktop", 1440, 900, False, "no-preference"),
        ("mobile-emulation", 390, 844, True, "no-preference"),
        ("reduced-motion", 900, 700, False, "reduce"),
    ]:
        context = browser.new_context(
            viewport={"width": width, "height": height},
            is_mobile=mobile, has_touch=mobile, reduced_motion=motion,
        )
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.set_content(html, wait_until="load")
        page.locator("#energy").fill("0")
        assert page.locator("#drift").inner_text() == "0.0"
        page.locator("#bearing").fill("90")
        page.locator("#pause").click()
        page.locator("#plot").click()
        page.locator("#sea").scroll_into_view_if_needed()
        bounds = page.locator("#sea").bounding_box()
        page.mouse.click(bounds["x"] + bounds["width"] * .25, bounds["y"] + bounds["height"] * .5)
        page.mouse.click(bounds["x"] + bounds["width"] * .72, bounds["y"] + bounds["height"] * .4)
        assert page.locator("#plot").get_attribute("aria-pressed") == "false"
        page.locator("#sea").focus()
        page.keyboard.press("ArrowRight")
        assert not page.evaluate("document.documentElement.scrollWidth > innerWidth")
        assert not errors, (name, errors)
        print(name, "PASS (emulated browser; not physical device)")
        context.close()
    browser.close()
