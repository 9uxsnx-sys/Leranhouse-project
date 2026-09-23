# Custom Domains

> Configure one or more custom domains for your Koodook organization so your platform is accessible under your own web address instead of the default Learnhouse subdomain.

## Overview

By default, your Koodook platform is accessible at a Learnhouse-provided subdomain (e.g., `your-org.learnhouse.app`). Custom domains allow you to serve your platform from your own domain (e.g., `learn.yourorg.com`) for a professional, branded experience.

## Adding a Custom Domain

### Step 1: Navigate to Domains Settings

Go to **Admin Panel → Organization Settings → Domains**. You will see a list of currently configured domains and a button to add a new one.

### Step 2: Enter Your Domain

- Click **Add Domain** and enter the fully qualified domain name (FQDN), e.g., `learn.yourorg.com` or `courses.yourorg.com`.
- Do **not** include protocol (`https://`) or trailing slashes.
- Subdomains are supported (e.g., `academy.example.com`). Apex domains (e.g., `example.com`) are also supported but require different DNS records (see below).

### Step 3: Configure DNS Records

After entering your domain, Koodook displays the DNS records you need to create with your domain registrar or DNS provider.

| Record Type | Name/Host        | Value/Priority               | Purpose                          |
|-------------|------------------|-------------------------------|----------------------------------|
| CNAME       | `learn`          | `your-org.learnhouse.app`     | Directs traffic from the subdomain to the Koodook platform |
| A (apex)    | `@`              | `<Koodook IP address>`        | Used only for apex/root domains  |
| TXT         | `_learnhouse-verify` | `<verification token>`     | Proves domain ownership          |

- If you are adding a **subdomain** (e.g., `learn.yourorg.com`), create a **CNAME** record pointing to `your-org.learnhouse.app`.
- If you are adding an **apex domain** (e.g., `yourorg.com`), create an **A record** pointing to the Koodook platform IP address shown in the setup wizard, plus a **CNAME** for `www` if desired.
- The **TXT verification record** is required for all domains to prove ownership.

### Step 4: Verify Domain

1. After creating the DNS records, click **Verify Domain** in the Koodook admin panel.
2. Koodook checks for the TXT verification record. DNS propagation can take **a few minutes to 48 hours**, depending on your DNS provider.
3. If verification succeeds, the domain status changes to **Verified**.
4. If verification fails, Koodook shows the expected record value so you can double-check your DNS configuration.

## SSL Certificate Provisioning

Once your domain is verified, Koodook automatically provisions an SSL certificate via **Let's Encrypt**.

### Automatic Provisioning

- Koodook uses the **ACME protocol** to request a certificate from Let's Encrypt for your custom domain.
- The process is fully automated — no manual certificate generation or upload is required.
- Certificate provisioning typically completes within **1–5 minutes** after domain verification.
- During provisioning, the domain status shows **SSL Pending**. Once complete, it changes to **SSL Active**.

### Certificate Renewal

- Let's Encrypt certificates are valid for **90 days**.
- Koodook automatically renews certificates **30 days before expiry**.
- Renewal is seamless and does not require any action from you.
- If renewal fails (e.g., because the domain is no longer pointing to Koodook), you will receive an email notification.

### Custom Certificates

- Koodook does **not** support uploading custom SSL certificates at this time. All certificates are managed automatically via Let's Encrypt.

## Multiple Domains per Organization

You can add **multiple custom domains** to a single Koodook organization. This is useful if you want your platform accessible from several branded URLs.

- Each domain must be individually verified.
- Each domain gets its own Let's Encrypt certificate.
- All domains serve the **same content** — there is no per-domain content segmentation.
- There is no hard limit on the number of domains, but a practical maximum of **10 domains** is recommended for performance and management overhead.

### Primary Domain

- The first domain you add is automatically set as the **primary domain**.
- The primary domain is used as the canonical URL in SEO metadata and sitemaps.
- You can change the primary domain at any time from the domain list by clicking **Set as Primary**.
- If the primary domain's SSL certificate expires or the domain becomes unreachable, the platform falls back to the Learnhouse subdomain.

## DNS Configuration Best Practices

- **TTL (Time To Live)** — Set your DNS record TTL to **300 seconds (5 minutes)** during initial setup so changes propagate quickly. Increase to **3600 seconds (1 hour)** once everything is working.
- **CNAME flattening** — Some DNS providers (e.g., Cloudflare, DNSimple) offer CNAME flattening for apex domains. If your provider supports this, use a CNAME record instead of an A record for the apex domain.
- **Propagation check** — Use tools like `dig` or `nslookup` to verify your DNS records have propagated before clicking **Verify Domain** in Koodook.
- **DNSSEC** — If your domain uses DNSSEC, ensure the signatures are valid. Invalid DNSSEC can interfere with Let's Encrypt certificate issuance.

## Troubleshooting

### Domain Verification Fails

- Confirm the TXT record value matches exactly what Koodook displayed (case-sensitive).
- Wait for DNS propagation (try again after a few hours).
- Remove any extra quotes or spaces from the TXT record value.

### SSL Certificate Not Provisioning

- Ensure the domain resolves to the correct Koodook IP or CNAME target.
- Verify that no firewall is blocking port 80 (HTTP) — Let's Encrypt needs to access port 80 for the HTTP-01 challenge.
- If using Cloudflare, disable **Proxy (orange cloud)** mode during provisioning. Set it to **DNS Only (gray cloud)**. You can re-enable proxy mode after the certificate is active.

### Domain Works but Shows "Not Secure"

- Wait a few minutes for the SSL certificate to fully provision.
- Clear your browser cache or open an incognito window.
- Check that the domain points to the correct target in your DNS records.

## Related Sections

- [General Settings](./general.md) — Organization name and contact info
- [SEO Settings](./seo.md) — Canonical URLs and search engine metadata
- [Landing Page Builder](./landing.md) — Build your public-facing homepage served from your custom domain
