/* ========================================================================== 
   CENTRAL LIFE CYCLE & INTERACTIONS — ZEITGEIST
   Static component architecture based on the GAA project.
   ========================================================================== */

function load_components(components) {
    const start = async () => {
        await Promise.all(components.map(async (component) => {
            const target = document.getElementById(component);
            if (!target) return;

            try {
                const response = await fetch(`components/${component}.html`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                target.innerHTML = await response.text();
            } catch (error) {
                console.error(`Komponente „${component}“ konnte nicht geladen werden:`, error);
            }
        }));

        init();
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        start();
    }
}

function init() {
    init_header();
    init_footer();
    init_cookies();
    init_scroll_reveal();
    init_scroll_spy();
    init_join_form();
}

function init_header() {
    const header = document.getElementById("header");
    const navToggle = document.getElementById("navToggle");
    const navbar = document.getElementById("navbarMenu");
    const navLinks = document.querySelectorAll(".nav-link");
    const brand = document.querySelector(".brand");
    const isHomePage = /(^|\/)index\.html$/.test(window.location.pathname) || window.location.pathname.endsWith("/") || !window.location.pathname.split("/").pop().includes(".");

    if (!header) return;

    if (isHomePage) {
        if (brand) brand.setAttribute("href", "#hero");
        document.querySelectorAll('a[href^="./#"]').forEach((link) => {
            link.setAttribute("href", link.getAttribute("href").replace("./", ""));
        });
    }

    const closeMenu = () => {
        if (!navbar || !navToggle) return;
        navbar.classList.remove("open");
        navToggle.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Menü öffnen");
        document.body.classList.remove("menu-open");
    };

    if (navToggle && navbar) {
        navToggle.addEventListener("click", () => {
            const isOpen = navbar.classList.toggle("open");
            navToggle.classList.toggle("open", isOpen);
            navToggle.setAttribute("aria-expanded", String(isOpen));
            navToggle.setAttribute("aria-label", isOpen ? "Menü schließen" : "Menü öffnen");
            document.body.classList.toggle("menu-open", isOpen);
        });

        navbar.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") closeMenu();
        });
    }

    const hero = document.querySelector(".hero");
    const setHeaderState = () => {
        const heroEnd = hero ? hero.offsetTop + hero.offsetHeight : 0;
        const isVisible = !isHomePage || window.scrollY >= heroEnd - 1;
        header.classList.toggle("is-visible", isVisible);
        header.classList.toggle("scrolled", isVisible);
        header.setAttribute("aria-hidden", String(!isVisible));
    };
    setHeaderState();
    window.addEventListener("scroll", setHeaderState, { passive: true });

    navLinks.forEach((link) => {
        link.addEventListener("click", () => closeMenu());
    });
}

function init_footer() {
    const year = document.getElementById("currentYear");
    if (year) year.textContent = String(new Date().getFullYear());
}

function init_scroll_reveal() {
    const elements = document.querySelectorAll(".reveal");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || !("IntersectionObserver" in window)) {
        elements.forEach((element) => element.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px" });

    elements.forEach((element) => observer.observe(element));
}

function init_scroll_spy() {
    const navLinks = [...document.querySelectorAll(".nav-link")];
    const sections = document.querySelectorAll("main section[id]");
    if (!navLinks.length || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            navLinks.forEach((link) => {
                link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
            });
        });
    }, { rootMargin: "-25% 0px -65%", threshold: 0 });

    sections.forEach((section) => observer.observe(section));
}

function init_cookies() {
    const banner = document.getElementById("databanner");
    if (!banner) return;

    let choice = null;
    try {
        choice = localStorage.getItem("zeitgeist_cookies");
    } catch (error) {
        console.warn("Cookie-Auswahl konnte nicht gelesen werden.", error);
    }

    banner.classList.toggle("visible", choice === null);
    banner.querySelectorAll("[data-cookie-choice]").forEach((button) => {
        button.addEventListener("click", () => cookies(button.dataset.cookieChoice === "true"));
    });
}

function cookies(choice) {
    try {
        localStorage.setItem("zeitgeist_cookies", choice ? "true" : "false");
    } catch (error) {
        console.warn("Cookie-Auswahl konnte nicht gespeichert werden.", error);
    }

    const banner = document.getElementById("databanner");
    if (banner) banner.classList.remove("visible");
}

function show_databanner() {
    const banner = document.getElementById("databanner");
    if (banner) banner.classList.add("visible");
}

function init_join_form() {
    const form = document.getElementById("joinForm");
    if (!form) return;

    const status = document.getElementById("formStatus");
    const submitButton = form.querySelector(".btn-form-submit");
    const requiredFields = [...form.querySelectorAll("[required]")];
    const defaultButtonMarkup = submitButton ? submitButton.innerHTML : "Anfrage senden →";

    const clearFieldError = (field) => {
        field.removeAttribute("aria-invalid");
        if (status) status.textContent = "";
    };
    requiredFields.forEach((field) => {
        field.addEventListener("input", () => clearFieldError(field));
        field.addEventListener("change", () => clearFieldError(field));
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        requiredFields.forEach(clearFieldError);
        if (status) status.textContent = "";

        if (!form.checkValidity()) {
            const invalidFields = requiredFields.filter((field) => !field.validity.valid);
            invalidFields.forEach((field) => field.setAttribute("aria-invalid", "true"));
            if (status) status.textContent = "Bitte füllen Sie alle markierten Pflichtfelder korrekt aus.";
            invalidFields[0]?.focus();
            return;
        }

        const honey = form.querySelector('input[name="_honey"]');
        if (honey && honey.value) return;

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Wird gesendet …";
        }

        const payload = {
            name: document.getElementById("formName").value.trim(),
            email: document.getElementById("formEmail").value.trim(),
            unternehmen: document.getElementById("formCompany").value.trim(),
            thema: document.getElementById("formTopic").value,
            message: document.getElementById("formMessage").value.trim(),
            _subject: "Neue Projektanfrage – zeitgeist",
            _captcha: "false",
            _template: "table"
        };

        try {
            const response = await fetch("https://formsubmit.co/ajax/niki.mitlaender@gmail.com", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`FormSubmit antwortete mit ${response.status}`);

            const formContainer = document.getElementById("formContainer");
            if (formContainer) {
                formContainer.innerHTML = `
                    <div class="success-overlay" role="status" tabindex="-1">
                        <span class="success-kicker">✓ Nachricht unterwegs</span>
                        <h2>Danke.</h2>
                        <p>Wir melden uns bei Ihnen. Unverbindlich, pragmatisch und ohne Verkaufsgespräch.</p>
                    </div>`;
                formContainer.querySelector(".success-overlay")?.focus();
            }
        } catch (error) {
            console.error("Fehler beim Senden des Formulars:", error);
            if (status) status.textContent = "Das hat gerade nicht funktioniert. Bitte versuchen Sie es erneut oder schreiben Sie direkt per E-Mail.";
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = defaultButtonMarkup;
            }
        }
    });
}

window.cookies = cookies;
window.show_databanner = show_databanner;
