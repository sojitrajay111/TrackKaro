import type { Metadata } from "next";
import { LegalHeader, LegalBody, LegalSection, LegalList } from "@/components/legal";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE.name} collects, uses and protects your data.`,
};

const UPDATED = "22 September 2026";

export default function PrivacyPolicyPage() {
  return (
    <>
      <LegalHeader
        title="Privacy Policy"
        updated={UPDATED}
        intro={`This policy explains what data ${SITE.name} ("we", "our", "the app") collects when you use our mobile and web application, why we collect it, and the choices you have. We built ${SITE.name} to be privacy-first: your financial records are yours, we don't sell data, and we don't run third-party ad networks.`}
      />
      <LegalBody>
        <LegalSection id="data-we-collect" n={1} title="Data We Collect">
          <p>We collect the following categories of data, only as needed to provide the app&rsquo;s features:</p>
          <LegalList
            items={[
              <>
                <strong className="text-foreground">Account data</strong> — name, email address, phone
                number, and a securely hashed password. We never store your password in plain text.
              </>,
              <>
                <strong className="text-foreground">Financial records you create</strong> — transactions,
                category budgets, digital khata (debt/credit) ledger entries, shared expense groups and
                their members, bill reminders, subscriptions, tracked deals and price alerts.
              </>,
              <>
                <strong className="text-foreground">Khata &amp; group contact details</strong> — names and
                phone numbers of people you add to a ledger or expense group. If you use the optional
                contacts-import feature, that lookup happens on your device; we only store what you
                explicitly add to an entry.
              </>,
              <>
                <strong className="text-foreground">Receipt &amp; bill images</strong> — photos you capture
                or upload for AI-assisted scanning are sent to our receipt-parsing service for that single
                request and are not retained by us afterward.
              </>,
              <>
                <strong className="text-foreground">Authentication tokens</strong> — a short-lived access
                token and a rotating refresh token used to keep you signed in securely.
              </>,
              <>
                <strong className="text-foreground">Technical &amp; usage data</strong> — basic request
                metadata (timestamps, IP address, device/browser type) used for security, rate-limiting and
                abuse prevention.
              </>,
            ]}
          />
        </LegalSection>

        <LegalSection id="how-we-use-it" n={2} title="How We Use Your Data">
          <LegalList
            items={[
              "To provide the core features you use — tracking expenses, maintaining your khata ledger, splitting group expenses, budgets, reminders and subscriptions.",
              "To power AI features — your recent spending summary (not raw account credentials) is sent to Google's Gemini API to generate the financial assistant's replies; receipt photos are sent to Gemini Vision solely to extract merchant, amount, category and date.",
              "To send you a one-time password (OTP) by email when you request a password reset, via Gmail SMTP.",
              "To detect and prevent fraud, abuse and unauthorized access, including rate-limiting sensitive endpoints.",
              "To generate reports you explicitly request via the in-app Download Report (CSV/PDF export) feature — this data is generated on your device / on request and is not separately stored by us afterward.",
            ]}
          />
        </LegalSection>

        <LegalSection id="third-parties" n={3} title="Third-Party Services We Rely On">
          <p>We use a small number of trusted service providers to operate the app, and we share only the minimum data each needs:</p>
          <LegalList
            items={[
              <><strong className="text-foreground">Google Gemini API</strong> — processes AI assistant prompts, receipt images and deal-search queries. Subject to Google&rsquo;s own privacy terms.</>,
              <><strong className="text-foreground">Gmail SMTP</strong> — delivers password-reset OTP emails to the address you registered with.</>,
              <><strong className="text-foreground">MongoDB Atlas</strong> — hosts our database; data is encrypted in transit (TLS/HTTPS).</>,
              <>Deal &amp; shopping links to third-party platforms (e.g. Amazon, Flipkart, Myntra, Swiggy, Zomato) — these are external sites with their own privacy policies; we don&rsquo;t control or receive data back from them.</>,
            ]}
          />
          <p>We do <strong className="text-foreground">not</strong> sell your data, and we do not integrate third-party advertising networks.</p>
        </LegalSection>

        <LegalSection id="security" n={4} title="How We Protect Your Data">
          <LegalList
            items={[
              "Passwords are hashed (never stored in plain text); authentication uses short-lived JWT access tokens with rotating, reuse-detected refresh tokens.",
              "All data owned by an account is scoped to that account on our servers — no user can query another user's records.",
              "Sensitive endpoints (login, password reset, OTP requests) are rate-limited to prevent brute-force attempts.",
              "Security headers are enforced on every API response, and all traffic is served over HTTPS.",
              "You can revoke every active session at once at any time from Settings (\"Log out of all devices\").",
            ]}
          />
        </LegalSection>

        <LegalSection id="permissions" n={5} title="Device Permissions">
          <p>The app may request the following permissions, each used only for the stated purpose and never collected silently in the background:</p>
          <LegalList
            items={[
              <><strong className="text-foreground">Camera / Photo Library</strong> — to scan a receipt or bill.</>,
              <><strong className="text-foreground">Contacts</strong> — optional, to help you search your phonebook when adding a khata entry; contact data stays on your device unless you choose to add it to an entry.</>,
              <><strong className="text-foreground">Notifications</strong> — for local bill-due and price-drop reminders, generated and shown entirely on your device.</>,
            ]}
          />
        </LegalSection>

        <LegalSection id="your-rights" n={6} title="Your Rights & Choices">
          <LegalList
            items={[
              "Access & export — download your financial data at any time as CSV or PDF from Settings → Export Data.",
              "Correction — edit your profile, transactions and any record directly in the app.",
              "Deletion — permanently erase your account and every record we hold for it from Settings → Privacy → Delete Account. This action cannot be undone.",
              "Session control — revoke all logged-in sessions from Settings.",
            ]}
          />
        </LegalSection>

        <LegalSection id="retention" n={7} title="Data Retention">
          <p>
            We retain your data for as long as your account is active. Password-reset OTP codes expire after
            10 minutes and can only be used once. If you delete your account, all data associated with it is
            permanently removed from our production database; some anonymized, aggregated log data may be
            retained briefly for security auditing.
          </p>
        </LegalSection>

        <LegalSection id="children" n={8} title="Children's Privacy">
          <p>
            {SITE.name} is not directed at children, and we do not knowingly collect data from anyone under
            18. If you believe a child has provided us with personal data, contact us and we will remove it.
          </p>
        </LegalSection>

        <LegalSection id="international" n={9} title="International Data Transfers">
          <p>
            Our infrastructure and the third-party providers listed above (Google, MongoDB Atlas) may process
            data outside of India. Where this happens, we rely on those providers&rsquo; own security and
            compliance safeguards.
          </p>
        </LegalSection>

        <LegalSection id="changes" n={10} title="Changes to This Policy">
          <p>
            We may update this policy as the app evolves. Material changes will be reflected by updating the
            &ldquo;Last updated&rdquo; date above, and where appropriate, an in-app notice.
          </p>
        </LegalSection>

        <LegalSection id="contact" n={11} title="Contact Us">
          <p>
            Questions about this policy or a request to access, correct or delete your data can be sent to{" "}
            <a href={`mailto:${SITE.privacyEmail}`} className="font-semibold text-primary hover:underline">
              {SITE.privacyEmail}
            </a>
            .
          </p>
        </LegalSection>
      </LegalBody>
    </>
  );
}
