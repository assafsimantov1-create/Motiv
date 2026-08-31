/* =========================================================================
   MOTIV — לוגיקת החנות
   כל מה שצריך לערוך לפני העלייה לאוויר נמצא ב-STORE_CONFIG שלמטה.
   ========================================================================= */

const STORE_CONFIG = {
  brandName: "MOTIV",

  /* ---- תמחור ---- */
  singlePrice: 34.99,          // המחיר שמשלמים בפועל — יחידה אחת
  doublePrice: 49.99,          // לא בשימוש — אופציית 2 היחידות הוסרה מהדף (ראו README)
  currency: "$",               // הסמל שמוצג בדף
  currencyCode: "USD",         // קוד המטבע שנשלח לפיקסל ולאנליטיקס (USD / ILS / EUR)

  /* ---- תצוגת המחיר ----
     discountBadge = התג הצבעוני שמופיע ליד המחיר. null מסתיר אותו.
     compareAtSingle / compareAtDouble = מחיר מחוק ("לפני ההנחה").
     הם null בכוונה: מחיר השקה הוא הצהרה על מחיר עתידי גבוה יותר ולא על מחיר
     שנגבה בעבר, ולכן אין מה למחוק. אם בעתיד תעלו מחיר ותרצו להציג מבצע אמיתי —
     מלאו כאן את המחיר שנגבה בפועל, והמחיר המחוק יופיע לבד בכל הדף. */
  discountBadge: "מחיר השקה מיוחד",
  compareAtSingle: null,
  compareAtDouble: null,

  /* ---- צ'ק-אאוט ----
     עמוד המוצר ב-Fourthwall. המידה והכמות שהלקוח בחר נוספות אוטומטית
     כפרמטרים בכתובת: ?size=M&qty=2 — כך שאפשר לראות אותן בדוחות התנועה.
     כל עוד הערך הוא "#", הכפתור גולל לאזור ההזמנה ולא שולח לשום מקום. */
  checkoutUrl: "https://motiv-shop.fourthwall.com/products/new-product",

  /* ---- טקסטים שדורשים מדיניות אמיתית שלכם ----
     כל עוד הערך null — האלמנט מוסתר לגמרי מהאתר ולא מוצגת שום הבטחה.
     מלאו טקסט אמיתי כדי להציג אותו. */
  shippingText: null,          // לדוגמה: "משלוח עד הבית תוך 3–7 ימי עסקים."
  returnPolicyText: null,      // לדוגמה: "ניתן להחזיר מוצר באריזתו המקורית תוך 14 יום."
  returnPolicyShort: null,     // לדוגמה: "החזרה תוך 14 יום"
  announceText: null,          // לדוגמה: "משלוח חינם בהזמנה מעל ₪150"

  /* ---- יצירת קשר ---- */
  supportEmail: null,          // לדוגמה: "hello@yourdomain.com"
  whatsappNumber: null,        // בפורמט בינלאומי בלי + ובלי מקפים, לדוגמה: "972500000000"

  /* ---- מדידה ---- */
  metaPixelId: null,           // לדוגמה: "1234567890"  (או הפעילו את הבלוק ב-index.html)
  googleAnalyticsId: null,     // לדוגמה: "G-XXXXXXX"

  /* ---- ביקורות אמיתיות בלבד ----
     השאירו ריק עד שיהיו לכם ביקורות אמיתיות שקיבלתם אישור לפרסם.
     פורמט: { name: "שם", text: "תוכן", stars: 5 }
     כל עוד המערך ריק — מקטע הביקורות מוסתר לחלוטין. */
  reviews: []
};

/* ========================================================================= */

(function () {
  "use strict";

  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const C  = STORE_CONFIG;

  const money = n =>
    C.currency + n.toFixed(2).replace(/\.00$/, "");

  /* ---------------- מדידה ---------------- */
  function track(event, data) {
    try { if (typeof fbq === "function") fbq("track", event, data || {}); } catch (e) {}
    try { if (typeof gtag === "function") gtag("event", event, data || {}); } catch (e) {}
  }
  // טעינת פיקסל דרך ה-config (חלופה לבלוק שב-index.html)
  (function initPixels() {
    if (C.metaPixelId && typeof fbq !== "function") {
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
      document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', C.metaPixelId);
      fbq('track', 'PageView');
    }
    if (C.googleAnalyticsId && typeof gtag !== "function") {
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://www.googletagmanager.com/gtag/js?id=" + C.googleAnalyticsId;
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { dataLayer.push(arguments); };
      gtag("js", new Date());
      gtag("config", C.googleAnalyticsId);
    }
  })();

  /* ---------------- מצב ---------------- */
  const state = { qty: 1, size: null };

  const priceFor = q => (q === 2 ? C.doublePrice : C.singlePrice);

  /* ---------------- הזרקת מחירים ---------------- */
  // מציג מחיר "לפני הנחה" רק אם הוגדר בקונפיג וגבוה מהמחיר בפועל
  function setCompare(el, val) {
    if (!val) { el.hidden = true; return; }
    el.hidden = false;
    el.textContent = money(val);
  }

  function paintPrices() {
    const perUnit = Math.round((C.doublePrice / 2) * 100) / 100;
    const save = Math.round((C.singlePrice * 2 - C.doublePrice) * 100) / 100;
    $$('[data-price]').forEach(el => {
      switch (el.dataset.price) {
        case "single":  el.textContent = money(C.singlePrice); break;
        case "double":  el.textContent = money(C.doublePrice); break;
        case "perUnit": el.textContent = money(perUnit); break;
        case "save":    el.textContent = money(save); break;
        case "current": el.textContent = money(priceFor(state.qty)); break;
        case "compareSingle": setCompare(el, C.compareAtSingle); break;
        case "compareDouble": setCompare(el, C.compareAtDouble); break;
        case "compareCurrent":
          setCompare(el, state.qty === 2 ? C.compareAtDouble : C.compareAtSingle); break;
      }
    });
  }

  /* ---------------- טקסטים מה-config ---------------- */
  function paintConfigText() {
    $$('[data-cfg]').forEach(el => {
      const v = C[el.dataset.cfg];
      if (v) { el.textContent = v; return; }
      // תג ההנחה יושב בתוך בלוק המחיר — מסתירים רק אותו, לא את המחיר כולו
      if (el.classList.contains("pl-off")) { el.hidden = true; return; }
      if (el.parentElement) el.parentElement.hidden = true;
    });

    if (C.announceText) { $("#announce").hidden = false; }

    if (C.returnPolicyShort) $$(".trust-returns").forEach(el => (el.hidden = false));
    if (C.shippingText || C.returnPolicyText) {
      const f = $(".faq-shipping");
      if (f) f.hidden = false;
    }

    const mail = $(".foot-mail");
    if (mail && C.supportEmail) {
      mail.href = "mailto:" + C.supportEmail;
      mail.hidden = false;
    }
    const wa = $(".foot-wa");
    if (wa && C.whatsappNumber) {
      wa.href = "https://wa.me/" + String(C.whatsappNumber).replace(/\D/g, "");
      wa.hidden = false;
    }
    const y = $("#year");
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------------- בחירת כמות ---------------- */
  function syncOffers(val, fire) {
    state.qty = Number(val);
    $$('input[name="offer"], input[name="offer2"]').forEach(i => {
      i.checked = i.value === String(val);
      i.closest(".offer").classList.toggle("is-on", i.checked);
    });
    paintPrices();
    refreshCheckoutLinks();
    if (fire) track("SelectOffer", { quantity: state.qty, value: priceFor(state.qty), currency: C.currencyCode });
  }
  $$('input[name="offer"], input[name="offer2"]').forEach(i =>
    i.addEventListener("change", () => syncOffers(i.value, true))
  );

  /* ---------------- בחירת מידה ---------------- */
  function syncSize(val, fire) {
    state.size = val;
    $$('input[name="size"], input[name="size2"]').forEach(i => { i.checked = i.value === val; });
    $$("#szCurrent, .szCurrent").forEach(el => (el.textContent = val || "—"));
    const sb = $("#sbSize");
    if (sb) sb.textContent = val ? "מידה " + val : "בחרו מידה";
    const hint = $("#szHint");
    if (hint) { hint.textContent = "בחרו מידה לפי היקף המדידה בטבלה"; hint.classList.remove("warn"); }
    refreshCheckoutLinks();
    if (fire) track("SelectSize", { size: val });
  }
  $$('input[name="size"], input[name="size2"]').forEach(i =>
    i.addEventListener("change", () => syncSize(i.value, true))
  );

  /* ---------------- גלריה ---------------- */
  const main = $("#galMain");
  $$(".thumb").forEach(t =>
    t.addEventListener("click", () => {
      $$(".thumb").forEach(o => { o.classList.remove("is-on"); o.setAttribute("aria-selected", "false"); });
      t.classList.add("is-on"); t.setAttribute("aria-selected", "true");
      main.src = t.dataset.src;
      main.alt = t.dataset.alt || "";
    })
  );

  /* ---------------- מודאל מידות ---------------- */
  const modal = $("#sizeModal");
  const openModal = () => { modal.hidden = false; document.body.style.overflow = "hidden"; };
  const closeModal = () => { modal.hidden = true; document.body.style.overflow = ""; };
  $$("[data-open-size]").forEach(b => b.addEventListener("click", openModal));
  modal.addEventListener("click", e => {
    if (e.target === modal || e.target.closest("[data-close-size]")) closeModal();
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !modal.hidden) closeModal(); });

  /* ---------------- צ'ק-אאוט ---------------- */
  // הכפתורים הם קישורים אמיתיים (<a>), כדי שהניווט יעבוד גם בתוך iframe/תצוגה מוטמעת
  // וכדי שאפשר יהיה לפתוח אותם בלשונית חדשה עם Cmd/Ctrl. ה-href מתעדכן בכל בחירה.
  function buildCheckoutUrl() {
    if (!C.checkoutUrl || C.checkoutUrl === "#") return "#offer";
    var url;
    try { url = new URL(C.checkoutUrl, location.href); }
    catch (e) { return C.checkoutUrl; }
    if (state.size) url.searchParams.set("size", state.size);
    url.searchParams.set("qty", String(state.qty));
    return url.toString();
  }
  function refreshCheckoutLinks() {
    $$("[data-checkout]").forEach(function (el) {
      if (el.tagName === "A") el.href = buildCheckoutUrl();
    });
  }

  function goCheckout(ev) {
    if (!state.size) {
      if (ev) ev.preventDefault();
      const hint = $("#szHint");
      if (hint) { hint.textContent = "רגע — צריך לבחור מידה לפני שממשיכים"; hint.classList.add("warn"); }
      const target = $("#offer");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
      const first = $('input[name="size2"]');
      if (first) setTimeout(() => first.focus(), 400);
      return;
    }
    track("InitiateCheckout", {
      value: priceFor(state.qty), currency: C.currencyCode,
      contents: [{ id: "motiv-shoulder", quantity: state.qty, size: state.size }]
    });
    if (!C.checkoutUrl || C.checkoutUrl === "#") {
      if (ev) ev.preventDefault();
      $("#offer").scrollIntoView({ behavior: "smooth", block: "start" });
      console.warn("[MOTIV] checkoutUrl עדיין לא הוגדר ב-STORE_CONFIG. ראו README.");
      return;
    }
    // הקישור עצמו כבר מצביע ליעד הנכון — הדפדפן מנווט לבד.
    // אם מסיבה כלשהי מדובר בכפתור ולא בקישור, מנווטים ידנית:
    var el = ev && ev.currentTarget;
    if (!el || el.tagName !== "A") window.location.href = buildCheckoutUrl();
  }
  $$("[data-checkout]").forEach(b => b.addEventListener("click", goCheckout));
  refreshCheckoutLinks();
  $$("[data-scroll-offer]").forEach(b =>
    b.addEventListener("click", () => {
      $("#offer").scrollIntoView({ behavior: "smooth", block: "start" });
      const first = $('input[name="size2"]');
      if (!state.size && first) setTimeout(() => first.focus(), 500);
    })
  );

  /* ---------------- סרגל רכישה דביק במובייל ---------------- */
  const sticky = $("#stickyBuy");
  const hero = $(".hero");
  if (sticky && hero && "IntersectionObserver" in window) {
    sticky.hidden = false;
    const io = new IntersectionObserver(
      entries => {
        const past = !entries[0].isIntersecting;
        sticky.classList.toggle("show", past);
        document.body.classList.toggle("has-sticky", past);
      },
      { rootMargin: "-60px 0px 0px 0px", threshold: 0 }
    );
    io.observe(hero);
    // אל תסתיר את אזור ההזמנה עצמו
    const offerSec = $("#offer");
    if (offerSec) {
      new IntersectionObserver(
        e => { if (e[0].isIntersecting) { sticky.classList.remove("show"); document.body.classList.remove("has-sticky"); } },
        { threshold: 0.25 }
      ).observe(offerSec);
    }
  }

  /* ---------------- ביקורות אמיתיות בלבד ---------------- */
  function paintReviews() {
    const sec = $("#reviews");
    const grid = $("#reviewsGrid");
    if (!sec || !grid || !Array.isArray(C.reviews) || C.reviews.length === 0) return;
    grid.innerHTML = C.reviews.map(r => {
      const stars = Math.max(1, Math.min(5, Number(r.stars) || 5));
      return '<article class="rcard"><div class="stars" aria-label="' + stars + ' מתוך 5">' +
        "★".repeat(stars) + "☆".repeat(5 - stars) + '</div>' +
        '<p class="txt">' + String(r.text || "").replace(/</g, "&lt;") + '</p>' +
        '<p class="who">' + String(r.name || "").replace(/</g, "&lt;") + '</p></article>';
    }).join("");
    sec.hidden = false;
  }

  /* ---------------- ViewContent ---------------- */
  let viewed = false;
  function fireViewContent() {
    if (viewed) return;
    viewed = true;
    track("ViewContent", {
      content_name: "MOTIV Shoulder Support",
      content_type: "product",
      value: C.singlePrice, currency: C.currencyCode
    });
  }
  if ("requestIdleCallback" in window) requestIdleCallback(fireViewContent, { timeout: 2500 });
  else setTimeout(fireViewContent, 1200);

  /* ---------------- init ---------------- */
  paintPrices();
  paintConfigText();
  paintReviews();
  syncOffers(1, false);
  syncSize(null, false);
})();
