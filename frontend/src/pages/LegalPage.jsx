import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const POLICY_VERSION = '2026-10-29';
const PRIVACY_EMAIL = 'harshit.work009@gmail.com';

function PolicyShell({ title, children }) {
  return (
    <article className="max-w-3xl mx-auto bg-canvas border border-border rounded-[18px] p-5 sm:p-8 shadow-sm">
      <div className="mb-8">
        <Link to="/" className="text-sm font-semibold text-primary hover:underline">
          Back to IKTIS
        </Link>
        <p className="text-xs text-ink-muted mt-5">IKTIS operator · Version {POLICY_VERSION}</p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink mt-1">{title}</h1>
      </div>
      <div className="space-y-7 text-sm leading-6 text-ink">
        {children}
      </div>
      <div className="mt-10 pt-5 border-t border-border text-sm text-ink-muted">
        Questions, rights requests, or complaints: <a className="text-primary hover:underline" href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>
      </div>
    </article>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-ink mb-2">{title}</h2>
      {children}
    </section>
  );
}

export default function LegalPage() {
  const { pathname } = useLocation();

  if (pathname === '/terms') {
    return (
      <PolicyShell title="Terms of Service">
        <p>These terms describe use of IKTIS, a rental-management tool for landlords and property operators. By creating an account, you agree to use the service lawfully and to these terms.</p>
        <Section title="The service">
          <p>IKTIS provides tools to manage properties, rooms, tenants, tenancies, rent charges, payment records, receipts, and reports. You are responsible for the accuracy of records you enter and for decisions made using reports.</p>
        </Section>
        <Section title="Your account and acceptable use">
          <p>Keep your credentials confidential, use a unique password, and notify us promptly about suspected unauthorised access. Do not misuse the service, attempt to access another operator’s records, upload unlawful content, or interfere with the service or its security controls.</p>
        </Section>
        <Section title="Your data and tenant information">
          <p>You must have an appropriate basis and any required notices or permissions before entering another person’s personal information. Only enter information necessary for legitimate rental-management purposes. You remain responsible for meeting obligations that apply to your landlord or business activities.</p>
        </Section>
        <Section title="Payments and records">
          <p>IKTIS records payment information supplied by you; it does not process or hold funds for you. You are responsible for verifying payment details, maintaining supporting records, and complying with applicable tax, tenancy, consumer, and accounting requirements.</p>
        </Section>
        <Section title="Availability, support, and changes">
          <p>We aim to keep IKTIS available and secure but do not promise uninterrupted operation. We may update the service or these terms to reflect changes in functionality, law, or security. Material changes will be communicated through the service where practical.</p>
        </Section>
        <Section title="Contact and complaints">
          <p>Contact <a className="text-primary hover:underline" href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a> for support, privacy questions, or complaints. Nothing in these terms limits rights that cannot lawfully be excluded.</p>
        </Section>
      </PolicyShell>
    );
  }

  return (
    <PolicyShell title="Privacy Policy">
      <p>This policy explains how the IKTIS operator handles personal information in the IKTIS rental-management application. It was last reviewed on 29 October 2026.</p>
      <Section title="Information we collect">
        <p>When you create an account, we collect your name, email address, password hash, policy acceptance records, session information, and password-reset information. In the application, you may enter property names and addresses, room details, tenant names, phone numbers, email addresses and notes, tenancy dates and rent, rent charges, and payment details such as amount, date, method, reference, notes, and void reasons.</p>
      </Section>
      <Section title="Why we use it">
        <p>We use information to authenticate you, provide rental-management features, preserve tenant and financial history, generate reports and receipts, prevent unauthorised access, respond to support or privacy requests, recover accounts when enabled, and meet legal or security obligations. We do not currently use advertising pixels, behavioural tracking, or optional marketing communications in this application.</p>
      </Section>
      <Section title="Sharing and service providers">
        <p>Information may be processed by infrastructure providers that host the application and database, and by an email provider only when password recovery is enabled. Providers receive only what is needed to operate the relevant service and are expected to apply appropriate safeguards. We do not sell personal information.</p>
      </Section>
      <Section title="Retention">
        <p>Account and rental records are retained while needed to provide the service and preserve financial or tenancy history. Archived records may remain to maintain that history. Sessions expire after 30 days or earlier when revoked. Password-reset tokens are short-lived and single-use. We review retention and deletion needs when an account is closed or a legal obligation ends.</p>
      </Section>
      <Section title="Cookies and tracking">
        <p>IKTIS uses an essential HTTP-only session cookie and a CSRF protection cookie to secure authenticated actions. These are necessary for the service and are not used for advertising or cross-site tracking. We do not load optional analytics or marketing scripts.</p>
      </Section>
      <Section title="Security">
        <p>We use HTTPS in production, secure session cookies, CSRF protection, password hashing, rate limiting, security headers, access controls, and tenant-isolated database queries. No online system is risk-free. Report suspected security incidents immediately to <a className="text-primary hover:underline" href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>.</p>
      </Section>
      <Section title="Your choices and requests">
        <p>You may contact us to ask about access, correction, deletion, or other privacy concerns. We may need to verify your identity before acting. Requests are reviewed against applicable law, contractual needs, security requirements, and record-retention obligations.</p>
      </Section>
      <Section title="Children">
        <p>IKTIS is a landlord-focused business tool and is not directed at children. Do not create an account for a child or enter children’s information unless you have a lawful, necessary reason and any required permissions.</p>
      </Section>
      <Section title="Policy changes">
        <p>We will update the version date when this policy changes. If a change materially affects how information is used, we will provide an appropriate notice and, where required, obtain a new acknowledgement.</p>
      </Section>
    </PolicyShell>
  );
}
