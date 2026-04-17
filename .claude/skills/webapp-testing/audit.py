"""
Full PRC Management System audit script.
Assumes server already running at http://localhost:5174
"""
import os, sys, time
from playwright.sync_api import sync_playwright, Error as PWError

# Force UTF-8 output to handle emoji in console messages
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

def safe_str(s, limit=130):
    return s[:limit].encode("ascii", "replace").decode("ascii")

BASE = "http://localhost:5174"
SHOT_DIR = "/tmp/prc_audit"
os.makedirs(SHOT_DIR, exist_ok=True)

results = {}
console_log = {}

def shot(page, name):
    try:
        p = f"{SHOT_DIR}/{name}.png"
        page.screenshot(path=p, full_page=True)
        return p
    except:
        return None

def wait(page, timeout=6000):
    try:
        page.wait_for_load_state("networkidle", timeout=timeout)
    except:
        pass
    time.sleep(0.4)

def new_page_with_console(ctx, key):
    pg = ctx.new_page()
    errs = []
    pg.on("console", lambda m: errs.append(f"[{m.type}] {m.text}") if m.type in ("error", "warning") else None)
    pg.on("pageerror", lambda e: errs.append(f"[pageerror] {e}"))
    console_log[key] = errs
    return pg, errs

def safe_goto(page, url, key):
    """Navigate with crash recovery — returns True on success."""
    try:
        page.goto(url, timeout=15000)
        wait(page)
        return True
    except PWError as e:
        msg = str(e)
        if "crashed" in msg.lower():
            console_log.setdefault(key, []).append("[pageerror] Page crashed on navigation")
        else:
            console_log.setdefault(key, []).append(f"[nav-error] {msg[:120]}")
        return False

def login(ctx, username, password):
    pg, errs = new_page_with_console(ctx, f"login_{username}")
    safe_goto(pg, f"{BASE}/login", f"login_{username}")
    try:
        # Listen for network responses during login
        login_responses = []
        pg.on("response", lambda r: login_responses.append(f"{r.status} {r.url[-60:]}") if "auth" in r.url else None)
        pg.locator('input[name="username"]').first.fill(username)
        pg.locator('input[type="password"]').first.fill(password)
        pg.locator('button[type="submit"]').first.click()
        wait(pg, 8000)
        shot(pg, f"login_{username}_result")
        # Capture any error messages shown on page
        try:
            err_el = pg.locator(".error-message, .alert-error, [class*='error']").first
            if err_el.count() > 0 and err_el.is_visible():
                errs.append(f"[login-ui-error] {err_el.inner_text()[:80]}")
        except: pass
        if login_responses:
            errs.append(f"[login-api] {login_responses[-1]}")
    except Exception as e:
        errs.append(f"[login-error] {e}")
    return pg, errs

def record(key, url, redirected, notes, errs):
    results[key] = {
        "url": url,
        "redirected_to": redirected,
        "notes": notes,
        "errors": errs,
    }

# ─────────────────────────────────────────────────────────────────────────────
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])

    # ── PUBLIC ────────────────────────────────────────────────────────────────
    ctx = browser.new_context(viewport={"width": 1400, "height": 900})

    pg, errs = new_page_with_console(ctx, "landing")
    safe_goto(pg, BASE, "landing")
    shot(pg, "01_landing")
    broken = pg.evaluate("() => [...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src)")
    notes = [f"Broken images ({len(broken)}): {broken[:3]}"] if broken else []
    record("landing", BASE, pg.url, notes, errs)

    pg, errs = new_page_with_console(ctx, "login_page")
    safe_goto(pg, f"{BASE}/login", "login_page")
    shot(pg, "02_login")
    record("login_page", f"{BASE}/login", pg.url, [], errs)
    ctx.close()

    # ── ADMIN SESSION ─────────────────────────────────────────────────────────
    ctx = browser.new_context(viewport={"width": 1400, "height": 900})
    admin_pg, _ = login(ctx, "admin", "123")
    landed = admin_pg.url
    record("admin_login", f"{BASE}/login", landed,
           [] if "/admin" in landed else [f"Didn't reach admin, got: {landed}"], [])
    shot(admin_pg, "03_admin_dashboard")
    admin_pg.close()

    ADMIN_PAGES = [
        ("admin_dashboard",     "/admin/dashboard"),
        ("admin_events",        "/admin/events"),
        ("admin_announcements", "/admin/announcements"),
        ("admin_training",      "/admin/training"),
        ("admin_training_req",  "/admin/training-requests"),
        ("admin_users",         "/admin/users"),
        ("admin_volunteers",    "/admin/volunteers"),
        ("admin_blood_bank",    "/admin/blood-bank"),
        ("admin_inventory",     "/admin/inventory"),
        ("admin_merchandise",   "/admin/merchandise"),
        ("admin_donations",     "/admin/donations"),
        ("admin_reports",       "/admin/reports"),
    ]

    for idx, (key, path) in enumerate(ADMIN_PAGES):
        # Fresh page each time to avoid crash propagation
        pg, errs = new_page_with_console(ctx, key)
        ok = safe_goto(pg, f"{BASE}{path}", key)
        notes = []

        if not ok:
            notes.append("Page crashed or failed to load")
            shot(pg, f"{str(idx+4).zfill(2)}_{key}_crashed")
            record(key, f"{BASE}{path}", pg.url, notes, errs)
            pg.close()
            continue

        redirected = pg.url
        if path not in redirected:
            notes.append(f"REDIRECTED to: {redirected}")

        body_text = pg.inner_text("body")[:1000] if ok else ""
        if "404" in body_text[:300]:
            notes.append("404 visible in page")

        # Dashboard: test tabs
        if key == "admin_dashboard":
            tab_btns = pg.locator(".db-tabs__btn").all()
            notes.append(f"Stat tabs: {len(tab_btns)}")
            for tab in tab_btns:
                try:
                    tab.click(); time.sleep(0.3)
                except: pass
            shot(pg, f"{str(idx+4).zfill(2)}_{key}")

        # Reports: test all tabs + Export/Template buttons
        elif key == "admin_reports":
            shot(pg, f"{str(idx+4).zfill(2)}_{key}_overview")
            tab_btns = pg.locator(".ar-tab-btn").all()
            notes.append(f"Report tabs found: {len(tab_btns)}")
            for tab in tab_btns[1:]:
                try:
                    tab_label = tab.inner_text().strip()
                    tab.click(); wait(pg, 4000)
                    has_export   = pg.locator(".ar-btn--primary").count() > 0
                    has_template = pg.locator(".ar-btn--ghost").count() > 0
                    row_count    = pg.locator(".ar-table tbody tr").count()
                    notes.append(f"  '{tab_label}': export={has_export}, template={has_template}, rows={row_count}")
                    shot(pg, f"{str(idx+4).zfill(2)}_{key}_{tab_label.lower()}")
                except Exception as e:
                    notes.append(f"  Tab error: {e}")
        else:
            shot(pg, f"{str(idx+4).zfill(2)}_{key}")
            # Try clicking first "Add/Create/New" button
            create_btn = pg.locator("button:has-text('Add'), button:has-text('Create'), button:has-text('New')").first
            if create_btn.count() > 0 and create_btn.is_visible():
                try:
                    create_btn.click(); wait(pg, 3000)
                    shot(pg, f"{str(idx+4).zfill(2)}_{key}_modal")
                    notes.append("Create modal opened successfully")
                    pg.keyboard.press("Escape"); wait(pg, 1000)
                except Exception as e:
                    notes.append(f"Create btn error: {e}")

        record(key, f"{BASE}{path}", redirected, notes, errs)
        pg.close()

    # Notifications (admin)
    pg, errs = new_page_with_console(ctx, "admin_notif")
    safe_goto(pg, f"{BASE}/admin/dashboard", "admin_notif")
    bell = pg.locator(".notif__bell").first
    notif_notes = []
    if bell.count() > 0:
        try:
            bell.click(); time.sleep(0.8)
            shot(pg, "16_admin_notif_open")
            dropdown = pg.locator(".notif__dropdown").first
            items = pg.locator(".notif__item").count()
            notif_notes.append(f"Dropdown visible: {dropdown.is_visible()}, items: {items}")
            # Check mark-all button
            mark_all = pg.locator(".notif__mark-all").first
            notif_notes.append(f"Mark-all button: {'found' if mark_all.count()>0 else 'not found'}")
        except Exception as e:
            notif_notes.append(f"Bell click error: {e}")
    else:
        notif_notes.append("Bell button NOT found (.notif__bell)")
    record("admin_notif", f"{BASE}/admin/dashboard", pg.url, notif_notes, errs)
    pg.close()

    # Floating chat (admin)
    pg, errs = new_page_with_console(ctx, "admin_chat")
    safe_goto(pg, f"{BASE}/admin/dashboard", "admin_chat")
    chat_notes = []
    # Look for chat toggle by various selectors
    chat_toggle = pg.locator("[class*='fc-toggle'], [class*='chat-toggle'], .floating-chat button, [class*='FloatingChat'] button").first
    if chat_toggle.count() == 0:
        # Fallback: any button with chat icon
        btns = pg.locator("button").all()
        for btn in btns:
            cls = btn.get_attribute("class") or ""
            if "chat" in cls.lower():
                chat_toggle = btn
                break
    if chat_toggle and hasattr(chat_toggle, 'click'):
        try:
            chat_toggle.click(); time.sleep(1)
            shot(pg, "17_admin_chat_open")
            chat_notes.append("Chat widget opened")
        except Exception as e:
            chat_notes.append(f"Chat click error: {e}")
    else:
        chat_notes.append("Chat toggle button not found")
        shot(pg, "17_admin_chat_not_found")
    record("admin_chat", f"{BASE}/admin/dashboard", pg.url, chat_notes, errs)
    pg.close()
    ctx.close()

    # ── USER SESSION ──────────────────────────────────────────────────────────
    ctx = browser.new_context(viewport={"width": 1400, "height": 900})
    user_pg, _ = login(ctx, "test", "123")
    landed = user_pg.url
    record("user_login", f"{BASE}/login", landed,
           [] if "/user" in landed else [f"Didn't reach user dashboard, got: {landed}"], [])
    shot(user_pg, "20_user_dashboard_initial")
    user_pg.close()

    USER_PAGES = [
        ("user_dashboard",     "/user/dashboard"),
        ("user_events",        "/user/events"),
        ("user_training",      "/user/training"),
        ("user_announcements", "/user/announcements"),
        ("user_merchandise",   "/user/merchandise"),
        ("user_donations",     "/user/donations"),
        ("user_profile",       "/user/profile"),
    ]

    for idx, (key, path) in enumerate(USER_PAGES):
        pg, errs = new_page_with_console(ctx, key)
        ok = safe_goto(pg, f"{BASE}{path}", key)
        notes = []
        if not ok:
            notes.append("Page crashed or failed to load")
            record(key, f"{BASE}{path}", pg.url, notes, errs)
            pg.close()
            continue
        redirected = pg.url
        if path not in redirected:
            notes.append(f"REDIRECTED to: {redirected}")
        body_text = pg.inner_text("body")[:500]
        if "404" in body_text[:200]:
            notes.append("404 visible in page")
        # Count interactive elements
        btns = pg.locator("button:visible").count()
        links = pg.locator("a:visible").count()
        notes.append(f"Visible: {btns} buttons, {links} links")
        shot(pg, f"{str(idx+21).zfill(2)}_{key}")
        record(key, f"{BASE}{path}", redirected, notes, errs)
        pg.close()

    # User notifications
    pg, errs = new_page_with_console(ctx, "user_notif")
    safe_goto(pg, f"{BASE}/user/dashboard", "user_notif")
    bell = pg.locator(".notif__bell").first
    notif_notes = []
    if bell.count() > 0:
        try:
            bell.click(); time.sleep(0.8)
            shot(pg, "28_user_notif_open")
            dropdown = pg.locator(".notif__dropdown").first
            items = pg.locator(".notif__item").count()
            notif_notes.append(f"Dropdown: {dropdown.is_visible()}, items: {items}")
        except Exception as e:
            notif_notes.append(f"Error: {e}")
    else:
        notif_notes.append("Bell NOT found")
    record("user_notif", "", pg.url, notif_notes, errs)
    pg.close()
    ctx.close()
    browser.close()

# ─── REPORT ──────────────────────────────────────────────────────────────────
SEP = "=" * 70
print(f"\n{SEP}")
print("  PRC MANAGEMENT SYSTEM — FULL AUDIT REPORT")
print(SEP)

critical, warn_list, ok_list = [], [], []
for key, data in results.items():
    errs   = data.get("errors", [])
    notes  = data.get("notes", [])
    redir  = data.get("redirected_to", "")
    url    = data.get("url", "")

    is_critical = (
        any("crash" in n.lower() or "REDIRECT" in n or "404" in n or "Didn't reach" in n for n in notes)
        or any("pageerror" in e for e in errs)
    )
    has_warn = bool(errs) or any("error" in n.lower() for n in notes)

    if is_critical:
        critical.append((key, notes, errs))
    elif has_warn:
        warn_list.append((key, notes, errs))
    else:
        ok_list.append((key, notes))

print("\n[!!]  CRITICAL ISSUES")
print("-" * 60)
if critical:
    for key, notes, errs in critical:
        print(f"\n  - {key}")
        for n in notes: print(f"      {safe_str(n)}")
        for e in errs[:4]: print(f"      ERR: {safe_str(e)}")
else:
    print("  None detected.")

print("\n[WW]   WARNINGS / CONSOLE ERRORS")
print("-" * 60)
if warn_list:
    for key, notes, errs in warn_list:
        print(f"\n  - {key}")
        for n in notes: print(f"      {safe_str(n)}")
        for e in errs[:5]: print(f"      WARN: {safe_str(e)}")
else:
    print("  None detected.")

print("\n[OK]  WORKING / CLEAN")
print("-" * 60)
for key, notes in ok_list:
    info = f"  - {key}"
    extras = [n for n in notes if "Visible" in n or "tab" in n.lower() or "row" in n]
    if extras: info += f"  ({extras[0]})"
    print(info)

print(f"\n[IMG]  Screenshots → {SHOT_DIR}")
try:
    files = sorted(os.listdir(SHOT_DIR))
    for f in files: print(f"   {f}")
except: pass

print(f"\n{SEP}")
