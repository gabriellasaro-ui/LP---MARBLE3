const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector("#nav-links");

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("menu-open", isOpen);
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
    });
  });
}

function maskCNPJ(value) {
  return value
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function isValidCNPJ(value) {
  const cnpj = value.replace(/\D/g, "");

  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const calcCheckDigit = (base) => {
    let sum = 0;
    let pos = base.length - 7;
    for (let i = base.length; i >= 1; i--) {
      sum += Number(base.charAt(base.length - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    const result = sum % 11;
    return result < 2 ? 0 : 11 - result;
  };

  const digits = cnpj.slice(-2);
  const firstDigit = calcCheckDigit(cnpj.slice(0, 12));
  if (firstDigit !== Number(digits.charAt(0))) return false;

  const secondDigit = calcCheckDigit(cnpj.slice(0, 13));
  if (secondDigit !== Number(digits.charAt(1))) return false;

  return true;
}

const contactForm = document.querySelector("#contact-form");
const cnpjField = document.querySelector("#cnpj-field");
const cnpjError = document.querySelector("#cnpj-error");

if (cnpjField) {
  cnpjField.addEventListener("input", () => {
    cnpjField.value = maskCNPJ(cnpjField.value);
    cnpjField.classList.remove("invalid");
    if (cnpjError) cnpjError.hidden = true;
  });
}

if (contactForm) {
  const formNote = document.querySelector(".form-note");
  const submitButton = contactForm.querySelector("button[type='submit']");

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (cnpjField && !isValidCNPJ(cnpjField.value)) {
      cnpjField.classList.add("invalid");
      if (cnpjError) cnpjError.hidden = false;
      cnpjField.focus();
      return;
    }

    const data = new FormData(contactForm);
    const payload = {};
    data.forEach((value, key) => {
      payload[key] = typeof value === "string" ? value.trim() : value;
    });

    if (submitButton) submitButton.disabled = true;
    if (formNote) formNote.textContent = "Enviando...";

    try {
      const response = await fetch("https://n8n.v4lisboatech.com.br/webhook/marvex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Falha no envio");

      contactForm.reset();
      if (formNote) formNote.textContent = "Recebemos seus dados! Em breve entraremos em contato.";
    } catch (error) {
      if (formNote) formNote.textContent = "Não foi possível enviar agora. Tente novamente em instantes.";
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}
