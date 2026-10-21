"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useTheme } from "@/components/theme-provider";
import { Segmented } from "@/components/ui/segmented";
import { useI18n } from "@/i18n";
import type { Lang } from "@/i18n/translations";
import type { Theme } from "@/components/theme-provider";
import { useAppDispatch, useAppSelector } from "@/store";
import { useSignOut, useUpdateProfileMutation } from "@/store/api/authApi";
import { transactionsApi } from "@/store/api/transactionsApi";
import { khataApi } from "@/store/api/khataApi";
import { budgetsApi } from "@/store/api/budgetsApi";
import { remindersApi } from "@/store/api/remindersApi";
import { groupsApi } from "@/store/api/groupsApi";

type SectionId = "profile" | "appearance" | "notifications" | "data";
type Hue = "emerald" | "blue" | "indigo" | "purple" | "pink" | "orange" | "teal" | "danger";

/* -------------------------------------------------------------------------- */
/* Icons (24px grid, stroked)                                                 */
/* -------------------------------------------------------------------------- */

function Icon({ d, size = 18, children }: { d?: string; size?: number; children?: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {d ? <path d={d} /> : children}
    </svg>
  );
}

const ICONS = {
  user: (
    <Icon>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20c.8-3.8 3.8-6 7.5-6s6.7 2.2 7.5 6" />
    </Icon>
  ),
  mail: (
    <Icon>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </Icon>
  ),
  phone: <Icon d="M5 4.5h3l1.5 4-2 1.3a10 10 0 0 0 6.7 6.7l1.3-2 4 1.5v3a2 2 0 0 1-2 2A15.5 15.5 0 0 1 3 6.5a2 2 0 0 1 2-2Z" />,
  bell: (
    <Icon>
      <path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </Icon>
  ),
  palette: (
    <Icon>
      <path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.4-1.3-1.6-1.3-2.8 0-.9.7-1.5 1.6-1.5h2.2a4.2 4.2 0 0 0 4.2-4.2c0-3.8-3.8-6.8-8.5-6.8Z" />
      <circle cx="7.8" cy="11" r="1.1" />
      <circle cx="10.5" cy="7.4" r="1.1" />
      <circle cx="15" cy="7.8" r="1.1" />
    </Icon>
  ),
  layers: (
    <Icon>
      <path d="m12 4 8.5 4.5L12 13 3.5 8.5z" />
      <path d="m3.5 12.5 8.5 4.5 8.5-4.5M3.5 16.5 12 21l8.5-4.5" />
    </Icon>
  ),
  moon: <Icon d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z" size={16} />,
  sun: (
    <Icon size={16}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </Icon>
  ),
  auto: (
    <Icon size={16}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5v17a8.5 8.5 0 0 0 0-17Z" fill="currentColor" stroke="none" />
    </Icon>
  ),
  globe: (
    <Icon>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5s1.2-6.1 3.5-8.5Z" />
    </Icon>
  ),
  flag: <Icon d="M5.5 21V4.5M5.5 4.5h11l-2 4 2 4h-11" />,
  calendar: (
    <Icon>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </Icon>
  ),
  inbox: (
    <Icon>
      <path d="M4 13.5 6.3 6a2 2 0 0 1 1.9-1.5h7.6A2 2 0 0 1 17.7 6l2.3 7.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M4 13.5h4.5l1.5 2.5h4l1.5-2.5H20" />
    </Icon>
  ),
  download: <Icon d="M12 4v11.5M7 10.5l5 5 5-5M5 20h14" />,
  shield: <Icon d="M12 3.5 19 6v5.5c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6z" />,
  doc: (
    <Icon>
      <path d="M7 3.5h7l4.5 4.5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-13.5a2 2 0 0 1 2-2Z" />
      <path d="M14 3.5V8h4.5M8.5 13h7M8.5 16.5h5" />
    </Icon>
  ),
  logout: <Icon d="M14.5 4.5h3a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-3M10 16.5 5.5 12 10 7.5M5.5 12h10" />,
  chevron: <Icon d="m9.5 6 6 6-6 6" size={16} />,
};

/* -------------------------------------------------------------------------- */
/* Building blocks                                                            */
/* -------------------------------------------------------------------------- */

function PIcon({ hue, children }: { hue: Hue; children: ReactNode }) {
  return (
    <span className={`picon hue--${hue}`} aria-hidden="true">
      {children}
    </span>
  );
}

function SettingsGroup({
  id,
  title,
  subtitle,
  children,
}: {
  id: SectionId;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section
      id={`set-${id}`}
      aria-labelledby={`set-${id}-t`}
      className="glass glass--card glass-specular rounded-[28px] p-5 sm:p-6 scroll-mt-24"
    >
      <header className="mb-3 px-1">
        <h2 id={`set-${id}-t`} className="font-display font-medium text-lg sm:text-xl text-foreground">
          {title}
        </h2>
        <p className="text-xs text-foreground-muted mt-0.5">{subtitle}</p>
      </header>
      {children}
    </section>
  );
}

/** One row: tinted icon, label + hint, control on the right. */
function Cell({
  hue,
  icon,
  label,
  hint,
  htmlFor,
  block,
  children,
}: {
  hue: Hue;
  icon: ReactNode;
  label: string;
  hint?: ReactNode;
  htmlFor?: string;
  block?: boolean;
  children?: ReactNode;
}) {
  const Text = htmlFor ? "label" : "span";
  return (
    <li className="flex items-start gap-3.5 py-3 px-1">
      <PIcon hue={hue}>{icon}</PIcon>
      <div
        className={`flex-1 min-w-0 flex gap-3 ${
          block ? "flex-col" : "flex-col sm:flex-row sm:items-center sm:justify-between"
        } min-h-[2.125rem] justify-center`}
      >
        <Text htmlFor={htmlFor} className="min-w-0">
          <b className="block text-[13px] sm:text-sm font-semibold text-foreground">{label}</b>
          {hint && <small className="block text-[11px] sm:text-xs text-foreground-muted mt-0.5">{hint}</small>}
        </Text>
        {children && <div className="shrink-0">{children}</div>}
      </div>
    </li>
  );
}

/** Tappable row that acts as a button or link, with a trailing chevron. */
function LinkCell({
  hue,
  icon,
  label,
  hint,
  onClick,
  href,
  danger,
  disabled,
}: {
  hue: Hue;
  icon: ReactNode;
  label: string;
  hint?: ReactNode;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
  disabled?: boolean;
}) {
  const inner = (
    <>
      <PIcon hue={hue}>{icon}</PIcon>
      <span className="flex-1 min-w-0 text-left">
        <b className={`block text-[13px] sm:text-sm font-semibold ${danger ? "text-[#EF4444]" : "text-foreground"}`}>
          {label}
        </b>
        {hint && <small className="block text-[11px] sm:text-xs text-foreground-muted mt-0.5">{hint}</small>}
      </span>
      <span className="text-foreground-muted">{ICONS.chevron}</span>
    </>
  );
  const cls =
    "w-full flex items-center gap-3.5 py-3 px-1 -mx-0 rounded-2xl transition hover:bg-surface-muted/50 disabled:opacity-60";
  return (
    <li>
      {href ? (
        <Link href={href} className={cls}>
          {inner}
        </Link>
      ) : (
        <button type="button" onClick={onClick} disabled={disabled} className={cls}>
          {inner}
        </button>
      )}
    </li>
  );
}

const inputCls =
  "h-9 w-full sm:w-60 rounded-xl bg-surface-muted/70 px-3 text-[13px] font-medium text-foreground sm:text-right placeholder:text-foreground-muted/60 border-0 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-border)_80%,transparent)] focus:outline-none focus:shadow-[inset_0_0_0_2px_var(--color-primary)] focus:text-left transition";

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

interface NotifPrefs {
  budgetAlerts: boolean;
  billReminders: boolean;
  dailyDigest: boolean;
}

const NOTIF_PREFS_KEY = "trackkaro_notification_prefs";
const DEFAULT_NOTIF_PREFS: NotifPrefs = { budgetAlerts: true, billReminders: true, dailyDigest: false };

function loadNotifPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem(NOTIF_PREFS_KEY);
    return raw ? { ...DEFAULT_NOTIF_PREFS, ...(JSON.parse(raw) as Partial<NotifPrefs>) } : DEFAULT_NOTIF_PREFS;
  } catch {
    return DEFAULT_NOTIF_PREFS;
  }
}

const SECTIONS: { id: SectionId; label: string; hue: Hue; icon: ReactNode }[] = [
  { id: "profile", label: "Profile", hue: "blue", icon: ICONS.user },
  { id: "appearance", label: "Appearance", hue: "purple", icon: ICONS.palette },
  { id: "notifications", label: "Notifications", hue: "pink", icon: ICONS.bell },
  { id: "data", label: "Data & privacy", hue: "teal", icon: ICONS.layers },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { lang, setLang } = useI18n();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { signOut, isSigningOut } = useSignOut();
  const [updateProfile, { isLoading: isSavingProfile }] = useUpdateProfileMutation();

  // Profile (saved to the server with PATCH /users/me)
  const [profileName, setProfileName] = useState(user?.name ?? "");
  const [profilePhone, setProfilePhone] = useState(user?.phone ?? "");
  const [profileStatus, setProfileStatus] = useState<"idle" | "saved" | "error">("idle");
  const profileDirty =
    profileName.trim() !== (user?.name ?? "") || profilePhone.trim() !== (user?.phone ?? "");

  // Notification toggles, remembered on this browser
  const [prefs, setPrefs] = useState<NotifPrefs>(loadNotifPrefs);
  const setPref = (key: keyof NotifPrefs, value: boolean) => {
    setPrefs((p) => {
      const next = { ...p, [key]: value };
      try {
        localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(next));
      } catch {
        // storage blocked (private mode) — the toggle still works for this visit
      }
      return next;
    });
  };

  // Export Feedback
  const [exportStatus, setExportStatus] = useState<"idle" | "working" | "done" | "error">("idle");

  // Section nav highlights whichever group is in view
  const [active, setActive] = useState<SectionId>("profile");

  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(`set-${s.id}`)).filter(
      (el): el is HTMLElement => el !== null
    );
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id.replace("set-", "") as SectionId);
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const goTo = (id: SectionId) => {
    setActive(id);
    document.getElementById(`set-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim()) return;
    setProfileStatus("idle");
    try {
      await updateProfile({ name: profileName.trim(), phone: profilePhone.trim() || undefined }).unwrap();
      setProfileStatus("saved");
    } catch {
      setProfileStatus("error");
    }
  };

  const handleExportData = async () => {
    setExportStatus("working");
    // Fetch (or reuse cached) data from every domain, then release the subscriptions.
    const subs = [
      dispatch(transactionsApi.endpoints.getTransactions.initiate()),
      dispatch(khataApi.endpoints.getKhataEntries.initiate()),
      dispatch(budgetsApi.endpoints.getBudgets.initiate()),
      dispatch(remindersApi.endpoints.getReminders.initiate()),
      dispatch(groupsApi.endpoints.getGroups.initiate()),
    ] as const;
    try {
      const [transactions, khata, budgets, billReminders, groups] = await Promise.all(
        subs.map((s) => s.unwrap())
      );
      const backup = {
        exportedAt: new Date().toISOString(),
        app: "TrackKaro Web",
        user: { name: user?.name, email: user?.email, phone: user?.phone },
        transactions,
        khata,
        budgets,
        billReminders,
        groups,
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TrackKaro-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus("done");
      setTimeout(() => setExportStatus("idle"), 3000);
    } catch {
      setExportStatus("error");
    } finally {
      subs.forEach((s) => s.unsubscribe());
    }
  };

  const initials = (profileName || user?.name || "")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const email = user?.email ?? "";

  const themeOptions: { value: Theme; label: string; icon: ReactNode }[] = [
    { value: "light", label: "Light", icon: ICONS.sun },
    { value: "dark", label: "Dark", icon: ICONS.moon },
    { value: "system", label: "Auto", icon: ICONS.auto },
  ];

  const languageOptions: { value: Lang; label: string }[] = [
    { value: "en", label: "English" },
    { value: "hi", label: "हिंदी" },
    { value: "gu", label: "ગુજરાતી" },
  ];

  const avatar = (size: "md" | "xl") => (
    <span className="relative shrink-0">
      <span
        className={`flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white font-display font-semibold shadow-[0_8px_20px_-8px_rgba(5,150,105,0.6)] ${
          size === "xl" ? "h-20 w-20 text-2xl" : "h-12 w-12 text-base"
        }`}
      >
        {initials || "👤"}
      </span>
      <i
        className={`absolute rounded-full bg-emerald-400 ring-[3px] ring-[var(--glass-fill-card)] ${
          size === "xl" ? "right-0.5 bottom-0.5 h-4 w-4" : "right-0 bottom-0 h-3 w-3"
        }`}
        title="Online"
      />
    </span>
  );

  return (
    <div className="pb-16">
      {/* Header */}
      <header className="mb-6 sm:mb-8">
        <h1 className="font-display font-normal text-[26px] sm:text-[32px] lg:text-[38px] tracking-[-0.02em] text-foreground leading-tight mb-1.5">
          Settings
        </h1>
        <p className="text-xs sm:text-sm font-medium text-foreground-muted">
          Your profile, the look of TrackKaro, and when it nudges you
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6 items-start">
        {/* Section nav */}
        <nav
          aria-label="Settings sections"
          className="glass glass--card glass-specular rounded-[28px] p-3 lg:sticky lg:top-24"
        >
          <button
            type="button"
            onClick={() => goTo("profile")}
            className="w-full flex items-center gap-3 p-2.5 mb-2 rounded-2xl text-left hover:bg-surface-muted/50 transition"
          >
            {avatar("md")}
            <span className="min-w-0">
              <b className="block text-sm font-semibold text-foreground truncate">{profileName}</b>
              <small className="block text-xs text-foreground-muted truncate">{email}</small>
            </span>
          </button>

          <div className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
            {SECTIONS.map((s) => {
              const isActive = active === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goTo(s.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={`shrink-0 flex items-center gap-3 rounded-2xl px-2.5 py-2 text-left text-[13px] sm:text-sm font-semibold transition ${
                    isActive
                      ? "bg-[var(--glass-fill-card)] text-foreground shadow-[0_4px_14px_-6px_rgba(10,48,28,0.25),inset_0_1px_0_rgba(255,255,255,0.8)] dark:bg-emerald-400/12 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                      : "text-foreground-sub hover:bg-surface-muted/50"
                  }`}
                >
                  <PIcon hue={s.hue}>{s.icon}</PIcon>
                  <span className="flex-1 pr-1">{s.label}</span>
                  <span className="hidden lg:inline text-foreground-muted">{ICONS.chevron}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="space-y-6 min-w-0">
          {/* Profile */}
          <SettingsGroup id="profile" title="Profile" subtitle="How your ledgers and groups see you">
            <div className="flex items-center gap-4 rounded-[22px] bg-surface-muted/40 p-4 mb-2">
              {avatar("xl")}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <b className="font-display font-medium text-xl text-foreground truncate">{profileName}</b>
                  <span className="rounded-full bg-emerald-500/15 text-[#059669] dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                    PRO
                  </span>
                </div>
                <span className="block text-xs text-foreground-sub mt-0.5">{profilePhone}</span>
                <small className="block text-xs text-foreground-muted font-mono truncate">{email}</small>
              </div>
            </div>

            <ul className="cells">
              <Cell hue="blue" icon={ICONS.user} label="Name" htmlFor="set-name">
                <input
                  id="set-name"
                  type="text"
                  autoComplete="name"
                  spellCheck={false}
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className={inputCls}
                />
              </Cell>
              <Cell hue="indigo" icon={ICONS.mail} label="Email" hint="Used to sign in">
                <span className="text-[13px] font-medium text-foreground-sub font-mono">{email}</span>
              </Cell>
              <Cell hue="emerald" icon={ICONS.phone} label="Phone" htmlFor="set-phone">
                <input
                  id="set-phone"
                  type="tel"
                  autoComplete="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className={inputCls}
                />
              </Cell>
            </ul>
            <div className="mt-2 flex flex-wrap items-center justify-end gap-3 px-1" aria-live="polite">
              {profileStatus === "saved" && !profileDirty && (
                <span className="text-xs font-semibold text-[#059669] dark:text-emerald-400">Profile saved</span>
              )}
              {profileStatus === "error" && (
                <span className="text-xs font-semibold text-[#DC2626] dark:text-red-400">
                  Couldn&apos;t save. Check your connection and try again.
                </span>
              )}
              {!profileName.trim() && (
                <span className="text-xs text-[#DC2626] dark:text-red-400">Name can&apos;t be empty</span>
              )}
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={!profileDirty || !profileName.trim() || isSavingProfile}
                className="inline-flex h-9 items-center rounded-full bg-primary px-5 text-[13px] font-bold text-white transition hover:bg-primary-strong disabled:opacity-40 dark:text-emerald-950"
              >
                {isSavingProfile ? "Saving…" : "Save changes"}
              </button>
            </div>
          </SettingsGroup>

          {/* Appearance */}
          <SettingsGroup
            id="appearance"
            title="Appearance"
            subtitle="The whole app re-tints through its glass"
          >
            <ul className="cells">
              <Cell hue="indigo" icon={ICONS.moon} label="Theme" hint="Auto follows your system">
                <Segmented label="Theme" options={themeOptions} value={theme} onChange={setTheme} />
              </Cell>
              <Cell
                hue="blue"
                icon={ICONS.globe}
                label="Language"
                hint="Ledgers, alerts and voice log"
              >
                <Segmented label="Language" options={languageOptions} value={lang} onChange={setLang} />
              </Cell>
            </ul>
          </SettingsGroup>

          {/* Notifications */}
          <SettingsGroup
            id="notifications"
            title="Notifications"
            subtitle="What TrackKaro taps you on the shoulder for. Saved on this browser."
          >
            <ul className="cells">
              <Cell
                hue="orange"
                icon={ICONS.flag}
                label="Budget warnings"
                hint="When a category reaches 75% and 100% of its limit"
                htmlFor="set-n-budget"
              >
                <input
                  id="set-n-budget"
                  type="checkbox"
                  role="switch"
                  className="switch"
                  checked={prefs.budgetAlerts}
                  onChange={(e) => setPref("budgetAlerts", e.target.checked)}
                />
              </Cell>
              <Cell
                hue="pink"
                icon={ICONS.calendar}
                label="Bill reminders"
                hint="3 days before rent, utilities and subscriptions"
                htmlFor="set-n-bills"
              >
                <input
                  id="set-n-bills"
                  type="checkbox"
                  role="switch"
                  className="switch"
                  checked={prefs.billReminders}
                  onChange={(e) => setPref("billReminders", e.target.checked)}
                />
              </Cell>
              <Cell
                hue="teal"
                icon={ICONS.inbox}
                label="Evening digest"
                hint="Day's spending and net udhar change at 8:00 PM"
                htmlFor="set-n-digest"
              >
                <input
                  id="set-n-digest"
                  type="checkbox"
                  role="switch"
                  className="switch"
                  checked={prefs.dailyDigest}
                  onChange={(e) => setPref("dailyDigest", e.target.checked)}
                />
              </Cell>
            </ul>
          </SettingsGroup>

          {/* Data & privacy */}
          <SettingsGroup
            id="data"
            title="Data & privacy"
            subtitle="Your records are private. We never sell user data."
          >
            <ul className="cells">
              <LinkCell
                hue="emerald"
                icon={ICONS.download}
                label={
                  exportStatus === "working"
                    ? "Preparing backup…"
                    : exportStatus === "done"
                      ? "Downloaded"
                      : exportStatus === "error"
                        ? "Export failed. Try again"
                        : "Export backup as JSON"
                }
                hint="Transactions, khata, budgets, bill reminders and groups"
                onClick={handleExportData}
                disabled={exportStatus === "working"}
              />
              <Cell
                hue="teal"
                icon={ICONS.shield}
                label="End-to-end encrypted sync"
                hint="256-bit encryption. Your data belongs to you."
              >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-2.5 py-1 text-[11px] font-bold text-[#059669] dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </Cell>
              <LinkCell hue="indigo" icon={ICONS.doc} label="Privacy policy" href="/privacy" />
              <LinkCell hue="purple" icon={ICONS.doc} label="Terms of service" href="/terms" />
              <LinkCell
                hue="danger"
                icon={ICONS.logout}
                label={isSigningOut ? "Signing out…" : "Sign out"}
                hint="Ends this session on the server too"
                onClick={() => void signOut()}
                disabled={isSigningOut}
                danger
              />
            </ul>
            <p className="mt-3 px-1 text-[11px] text-foreground-muted">TrackKaro v1.0.0 · Web Edition</p>
          </SettingsGroup>
        </div>
      </div>
    </div>
  );
}
