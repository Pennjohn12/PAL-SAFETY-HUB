const STAGING_HOSTS = new Set([
  "pal-safety-hub-staging.web.app",
  "pal-safety-hub-staging.firebaseapp.com",
  "localhost",
  "127.0.0.1",
  ""
]);

const PRODUCTION_HOSTS = new Set([
  "pal.jobsiteresources.com",
  "pal-safety-hub.web.app",
  "pal-safety-hub.firebaseapp.com"
]);

const hostname = window.location.hostname.toLowerCase();

export const PAL_ENVIRONMENT = STAGING_HOSTS.has(hostname) || window.location.protocol === "file:"
  ? "staging"
  : PRODUCTION_HOSTS.has(hostname)
    ? "production"
    : "blocked";

export const PAL_IS_STAGING = PAL_ENVIRONMENT === "staging";

export function assertKnownPalEnvironment() {
  if (PAL_ENVIRONMENT === "blocked") {
    throw new Error(`PAL Safety Hub blocked an unrecognized host: ${hostname || "unknown"}`);
  }
}

export function showStagingEnvironmentBanner() {
  if (!PAL_IS_STAGING) return;

  const render = () => {
    if (!document.body || document.getElementById("pal-staging-environment-banner")) return;
    document.documentElement.classList.add("pal-staging-environment");

    const style = document.createElement("style");
    style.textContent = `
      .pal-staging-environment body { padding-top: 38px !important; }
      .pal-staging-environment .header { top: 38px !important; }
      .pal-staging-environment .tabs { top: 102px !important; }
      #pal-staging-environment-banner {
        position: fixed; inset: 0 0 auto 0; z-index: 2147483647;
        min-height: 38px; padding: 8px 14px; text-align: center;
        background: #8a2600; color: #fff; border-bottom: 3px solid #ffcf33;
        font: 900 14px/19px "Segoe UI", system-ui, sans-serif;
        letter-spacing: .04em; box-shadow: 0 2px 8px rgba(0,0,0,.3);
      }
    `;
    document.head.appendChild(style);

    const banner = document.createElement("div");
    banner.id = "pal-staging-environment-banner";
    banner.setAttribute("role", "status");
    banner.textContent = "STAGING — TEST DATA ONLY — NEVER ENTER REAL PAL OR EMPLOYEE INFORMATION";
    document.body.prepend(banner);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render, { once: true });
  else render();
}

assertKnownPalEnvironment();
showStagingEnvironmentBanner();
