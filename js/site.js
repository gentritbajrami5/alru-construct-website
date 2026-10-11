let CONTACT_EMAIL = "alruconstruct@gmail.com";

document.getElementById("year").textContent = String(new Date().getFullYear());

const setContactEmail = (value) => {
  CONTACT_EMAIL = value || "alruconstruct@gmail.com";
  document.querySelectorAll(".contact-email, #contact-email-display").forEach((el) => {
    el.textContent = CONTACT_EMAIL;
    if (el.tagName === "A") el.setAttribute("href", "mailto:" + CONTACT_EMAIL);
  });
};
setContactEmail(CONTACT_EMAIL);

fetch("/api/config")
  .then((res) => (res.ok ? res.json() : null))
  .then((data) => {
    if (data?.email) setContactEmail(data.email);
  })
  .catch(() => {});

const header = document.getElementById("site-header");
const toggle = document.getElementById("menu-toggle");
const mobileMenu = document.getElementById("mobiel-menu");
const overlay = document.getElementById("menu-overlay");
const form = document.getElementById("offerte-form");
const success = document.getElementById("form-success");
const menuLinks = mobileMenu.querySelectorAll("a");

const onScroll = () => {
  if (window.scrollY > 16 || mobileMenu.classList.contains("is-open")) {
    header.classList.add("bg-ink/95", "shadow-lg", "shadow-black/20", "backdrop-blur");
  } else {
    header.classList.remove("bg-ink/95", "shadow-lg", "shadow-black/20", "backdrop-blur");
  }
};
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

const setMenuOpen = (open) => {
  mobileMenu.classList.toggle("is-open", open);
  mobileMenu.classList.toggle("border-white/10", open);
  mobileMenu.setAttribute("aria-hidden", open ? "false" : "true");
  mobileMenu.inert = !open;
  toggle.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
  toggle.setAttribute("aria-label", open ? "Menu sluiten" : "Menu openen");
  overlay.classList.toggle("is-open", open);
  overlay.setAttribute("aria-hidden", open ? "false" : "true");
  document.body.classList.toggle("menu-open", open);
  menuLinks.forEach((link) => {
    link.tabIndex = open ? 0 : -1;
  });
  onScroll();
};

setMenuOpen(false);

toggle.addEventListener("click", () => {
  setMenuOpen(!mobileMenu.classList.contains("is-open"));
});
overlay.addEventListener("click", () => setMenuOpen(false));
menuLinks.forEach((link) => link.addEventListener("click", () => setMenuOpen(false)));
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenuOpen(false);
});
window.addEventListener("resize", () => {
  if (window.matchMedia("(min-width: 768px)").matches) setMenuOpen(false);
});

document.querySelectorAll(".reveal").forEach((el, index) => {
  el.style.transitionDelay = `${(index % 4) * 0.08}s`;
});
const revealer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-in");
        revealer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);
document.querySelectorAll(".reveal").forEach((el) => revealer.observe(el));

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const showPage = () => {
  document.body.classList.remove("is-leaving");
  document.body.classList.add("is-ready");
};
requestAnimationFrame(showPage);
window.addEventListener("pageshow", showPage);

const visit = (href) => {
  if (prefersReduced) {
    window.location.href = href;
    return;
  }
  document.body.classList.remove("is-ready");
  document.body.classList.add("is-leaving");
  window.setTimeout(() => {
    window.location.href = href;
  }, 150);
};

document.querySelectorAll("a[href]").forEach((link) => {
  const raw = link.getAttribute("href");
  if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) return;
  if (link.target === "_blank" || link.hasAttribute("download")) return;

  let dest;
  try {
    dest = new URL(link.href, window.location.href);
  } catch {
    return;
  }
  if (dest.origin !== window.location.origin) return;
  if (dest.pathname === window.location.pathname && dest.hash) return;

  link.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (dest.pathname === window.location.pathname && !dest.hash) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    visit(dest.href);
  });
});

const TYPE_LABELS = {
  "algemene-bouwwerken": "Algemene bouwwerken",
  betonwerken: "Alle betonwerken",
  infra: "Infra",
  combinatie: "Combinatie / volledige werf"
};

if (form && success) {
  const formError = document.getElementById("form-error");
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    success.classList.add("hidden");
    formError?.classList.add("hidden");
    if (submitBtn) submitBtn.disabled = true;

    const data = new FormData(form);
    const honey = String(data.get("_honey") || "").trim();
    const payload = {
      naam: String(data.get("naam") || "").trim(),
      email: String(data.get("email") || "").trim(),
      type: String(data.get("type") || "").trim(),
      bericht: String(data.get("bericht") || "").trim()
    };
    const typeLabel = TYPE_LABELS[payload.type] || payload.type;

    try {
      if (honey) {
        form.reset();
        success.classList.remove("hidden");
        return;
      }

      const res = await fetch("https://formsubmit.co/ajax/" + encodeURIComponent(CONTACT_EMAIL), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          naam: payload.naam,
          email: payload.email,
          type: typeLabel,
          bericht: payload.bericht,
          _subject: "Offerte Alru Construct: " + typeLabel,
          _template: "table",
          _captcha: "false"
        })
      });
      const result = await res.json().catch(() => ({}));
      const ok = result.success === true || result.success === "true";
      const message = String(result.message || "");
      if (/activat/i.test(message)) {
        success.textContent =
          "Bijna klaar. Open de inbox van alruconstruct@gmail.com en klik op de activatielink van FormSubmit. Daarna komen offerteaanvragen gewoon binnen.";
        success.classList.remove("hidden");
        return;
      }
      if (!ok) {
        throw new Error(message || "Verzenden is mislukt.");
      }
      form.reset();
      success.textContent = "Dank u. Uw aanvraag is verstuurd. We nemen zo snel mogelijk contact op.";
      success.classList.remove("hidden");
    } catch {
      if (formError) {
        formError.textContent =
          "Verzenden is mislukt. Probeer het later opnieuw of stuur een email naar " + CONTACT_EMAIL + ".";
        formError.classList.remove("hidden");
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

const CONSENT_KEY = "alru_consent";
const CONSENT_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 365;
const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap";

const readConsent = () => {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.v !== 1 || !data.ts) return null;
    if (Date.now() - Date.parse(data.ts) > CONSENT_MAX_AGE_MS) return null;
    return data;
  } catch {
    return null;
  }
};

const writeConsent = (fonts) => {
  const data = {
    v: 1,
    necessary: true,
    fonts: Boolean(fonts),
    ts: new Date().toISOString()
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(data));
  return data;
};

const loadFonts = () => {
  if (document.getElementById("alru-fonts")) return;
  const pre1 = document.createElement("link");
  pre1.rel = "preconnect";
  pre1.href = "https://fonts.googleapis.com";
  const pre2 = document.createElement("link");
  pre2.rel = "preconnect";
  pre2.href = "https://fonts.gstatic.com";
  pre2.crossOrigin = "anonymous";
  const sheet = document.createElement("link");
  sheet.id = "alru-fonts";
  sheet.rel = "stylesheet";
  sheet.href = FONT_HREF;
  document.head.append(pre1, pre2, sheet);
};

const unloadFonts = () => {
  document.getElementById("alru-fonts")?.remove();
};

const applyConsent = (data) => {
  if (data && data.fonts) loadFonts();
  else unloadFonts();
};

const hideBanner = () => {
  document.getElementById("cookie-banner")?.remove();
};

const showBanner = (existing) => {
  hideBanner();
  const fontsOn = Boolean(existing?.fonts);
  const banner = document.createElement("div");
  banner.id = "cookie-banner";
  banner.className = "cookie-banner";
  banner.innerHTML = `
    <div class="cookie-panel" role="dialog" aria-modal="true" aria-labelledby="cookie-title">
      <h2 id="cookie-title" class="text-lg font-extrabold tracking-tight">Cookies en privacy</h2>
      <p class="mt-2 text-sm leading-relaxed text-white/70">
        Wij gebruiken alleen noodzakelijke opslag om uw keuze te onthouden. Google Fonts laden wij niet zonder toestemming.
        Weigeren is even eenvoudig als aanvaarden. Meer info in het
        <a href="privacy.html" class="font-semibold text-brand underline">privacybeleid</a> en het
        <a href="cookies.html" class="font-semibold text-brand underline">cookiebeleid</a>.
      </p>
      <div id="cookie-prefs" class="mt-4 hidden space-y-3 rounded-2xl border border-white/10 p-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-bold">Noodzakelijk</p>
            <p class="mt-1 text-xs text-white/55">Bewaart uw cookiekeuze. Altijd actief.</p>
          </div>
          <button type="button" class="consent-switch" aria-checked="true" aria-label="Noodzakelijk, altijd aan" disabled></button>
        </div>
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-bold">Lettertypes</p>
            <p class="mt-1 text-xs text-white/55">Google Fonts. Optioneel. IP adres kan naar Google gaan.</p>
          </div>
          <button type="button" id="consent-fonts" class="consent-switch" role="switch" aria-checked="${fontsOn ? "true" : "false"}" aria-label="Google Fonts toestaan"></button>
        </div>
      </div>
      <div class="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button type="button" id="cookie-accept" class="tap min-h-11 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-ink">Alles aanvaarden</button>
        <button type="button" id="cookie-reject" class="tap min-h-11 rounded-full border border-white/25 px-5 py-2.5 text-sm font-bold text-white">Alles weigeren</button>
        <button type="button" id="cookie-customize" class="tap min-h-11 rounded-full px-5 py-2.5 text-sm font-bold text-white/80 underline decoration-white/30 underline-offset-4">Voorkeuren</button>
        <button type="button" id="cookie-save" class="tap hidden min-h-11 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-ink">Voorkeuren opslaan</button>
      </div>
    </div>
  `;
  document.body.append(banner);

  const fontsBtn = banner.querySelector("#consent-fonts");
  const prefs = banner.querySelector("#cookie-prefs");
  const saveBtn = banner.querySelector("#cookie-save");
  const customBtn = banner.querySelector("#cookie-customize");

  fontsBtn.addEventListener("click", () => {
    const next = fontsBtn.getAttribute("aria-checked") !== "true";
    fontsBtn.setAttribute("aria-checked", next ? "true" : "false");
  });

  const finish = (fonts) => {
    applyConsent(writeConsent(fonts));
    hideBanner();
  };

  banner.querySelector("#cookie-accept").addEventListener("click", () => finish(true));
  banner.querySelector("#cookie-reject").addEventListener("click", () => finish(false));
  customBtn.addEventListener("click", () => {
    prefs.classList.remove("hidden");
    saveBtn.classList.remove("hidden");
    customBtn.classList.add("hidden");
  });
  saveBtn.addEventListener("click", () => {
    finish(fontsBtn.getAttribute("aria-checked") === "true");
  });
};

const storedConsent = readConsent();
if (storedConsent) applyConsent(storedConsent);
else showBanner(null);

document.querySelectorAll(".js-cookie-settings").forEach((btn) => {
  btn.addEventListener("click", () => showBanner(readConsent() || { fonts: false }));
});
