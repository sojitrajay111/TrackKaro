import type { Metadata } from "next";
import { LegalHeader, LegalBody, LegalSection, LegalList } from "@/components/legal";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The terms that govern your use of ${SITE.name}.`,
};

const UPDATED = "22 September 2026";

export default function TermsPage() {
  return (
    <>
      <LegalHeader
        title="Terms of Service"
        updated={UPDATED}
        intro={`These Terms of Service ("Terms") govern your access to and use of ${SITE.name} (the "App"). By creating an account or using the App, you agree to these Terms. If you do not agree, please do not use the App.`}
      />
      <LegalBody>
        <LegalSection id="eligibility" n={1} title="Eligibility">
          <p>
            You must be at least 18 years old and capable of entering into a binding agreement to use{" "}
            {SITE.name}. By using the App you confirm that you meet these requirements.
          </p>
        </LegalSection>

        <LegalSection id="the-service" n={2} title="Description of the Service">
          <p>
            {SITE.name} is a personal finance tracking, budgeting, digital ledger (khata) and shared-expense
            management tool. Important clarifications:
          </p>
          <LegalList
            items={[
              `${SITE.name} is not a bank, non-banking financial company (NBFC), payment processor or SEBI-registered investment adviser.`,
              "Khata entries and group \"Settle Up\" records are bookkeeping only — they track who owes whom, but do not move real money between accounts.",
              "Any AI-generated advice, insights or deal recommendations are informational and general in nature — not professional financial, tax, investment or legal advice. Always use your own judgment for financial decisions.",
            ]}
          />
        </LegalSection>

        <LegalSection id="accounts" n={3} title="Your Account">
          <LegalList
            items={[
              "You're responsible for providing accurate registration information and for keeping your login credentials confidential.",
              "You're responsible for all activity that occurs under your account.",
              "Notify us immediately if you suspect unauthorized access — you can also revoke all active sessions yourself from Settings at any time.",
            ]}
          />
        </LegalSection>

        <LegalSection id="acceptable-use" n={4} title="Acceptable Use">
          <p>You agree not to:</p>
          <LegalList
            items={[
              "Use the App for any unlawful purpose or in violation of any applicable law.",
              "Attempt to reverse-engineer, decompile or extract source code from the App, except where permitted by law.",
              "Abuse rate-limited features (e.g. the AI assistant, receipt scanner or deal search) through automated or excessive requests.",
              "Add another person's financial or personal data (e.g. to a khata entry or expense group) without their knowledge and consent.",
              "Interfere with or disrupt the App's infrastructure or attempt to gain unauthorized access to other accounts.",
            ]}
          />
        </LegalSection>

        <LegalSection id="ai-third-party" n={5} title="AI Features & Third-Party Content">
          <LegalList
            items={[
              "AI-generated responses (financial copilot, receipt scanning, deal search) are produced by third-party AI models and may occasionally be inaccurate or incomplete — verify anything important yourself.",
              "Deals, prices, coupons and cashback figures are sourced from third-party retail platforms, change frequently, and are shown for convenience only. We don't guarantee their accuracy or availability, and purchases you make on those platforms are governed by their own terms.",
            ]}
          />
        </LegalSection>

        <LegalSection id="fees" n={6} title="Fees">
          <p>
            {SITE.name} is currently free to use. We may introduce optional paid features in the future; if
            we do, we&rsquo;ll clearly disclose pricing before you&rsquo;re charged anything.
          </p>
        </LegalSection>

        <LegalSection id="ip" n={7} title="Intellectual Property">
          <p>
            The App, its branding, design and underlying software are owned by us and protected by
            applicable intellectual property laws. You retain full ownership of the financial data and
            content you enter into the App.
          </p>
        </LegalSection>

        <LegalSection id="termination" n={8} title="Termination">
          <p>
            You may stop using the App and permanently delete your account and data at any time from Settings
            → Privacy → Delete Account. We may suspend or terminate accounts that violate these Terms or pose
            a security risk to the App or other users.
          </p>
        </LegalSection>

        <LegalSection id="warranty" n={9} title="Disclaimer of Warranties">
          <p>
            The App is provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without warranties of any kind, express or
            implied, including but not limited to accuracy, reliability, or uninterrupted availability. We do
            not warrant that AI-generated insights, deal listings or debt-simplification calculations will be
            error-free.
          </p>
        </LegalSection>

        <LegalSection id="liability" n={10} title="Limitation of Liability">
          <p>
            To the maximum extent permitted by law, {SITE.name} and its team shall not be liable for any
            indirect, incidental, or consequential damages — including financial decisions made based on data
            or insights shown in the App, or losses arising from third-party platforms or services linked
            from the App.
          </p>
        </LegalSection>

        <LegalSection id="indemnification" n={11} title="Indemnification">
          <p>
            You agree to indemnify and hold {SITE.name} harmless from any claims, losses or damages arising
            from your misuse of the App or violation of these Terms.
          </p>
        </LegalSection>

        <LegalSection id="law" n={12} title="Governing Law">
          <p>
            These Terms are governed by the laws of India, without regard to conflict-of-law principles.
          </p>
        </LegalSection>

        <LegalSection id="changes" n={13} title="Changes to These Terms">
          <p>
            We may revise these Terms from time to time. Continued use of the App after changes take effect
            constitutes acceptance of the revised Terms. Material changes will update the &ldquo;Last updated&rdquo; date
            above.
          </p>
        </LegalSection>

        <LegalSection id="contact" n={14} title="Contact Us">
          <p>
            Questions about these Terms can be sent to{" "}
            <a href={`mailto:${SITE.supportEmail}`} className="font-semibold text-primary hover:underline">
              {SITE.supportEmail}
            </a>
            .
          </p>
        </LegalSection>
      </LegalBody>
    </>
  );
}
