"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Modal, ModalField, ModalFooter, ModalSegmentedPicker } from "@/components/ui/modal";
import { useTheme } from "@/components/theme-provider";
import { useI18n } from "@/i18n";
import type { Lang } from "@/i18n/translations";
import type { Theme } from "@/components/theme-provider";
import { useAppDispatch, useAppSelector } from "@/store";
import { logOut } from "@/store/slices/authSlice";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { lang, setLang, t } = useI18n();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  // Profile Edit Modal State
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || "Jay");
  const [profilePhone, setProfilePhone] = useState(user?.phone || "+91 98765 43210");
  const [workingHours, setWorkingHours] = useState<number>(8);

  // Notification Toggles
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [billReminders, setBillReminders] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(false);

  // Export Feedback
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const themeOptions: {
    id: Theme;
    title: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "light",
      title: "Light Mode",
      description: "Clean daylight surface with high contrast",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ),
    },
    {
      id: "dark",
      title: "Dark Mode",
      description: "Obsidian dark aesthetic with emerald mint glow",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
        </svg>
      ),
    },
    {
      id: "system",
      title: "System Default",
      description: "Automatically matches your device OS setting",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect width="20" height="14" x="2" y="3" rx="2" />
          <line x1="8" x2="16" y1="21" y2="21" />
          <line x1="12" x2="12" y1="17" y2="21" />
        </svg>
      ),
    },
  ];

  const languageOptions: {
    id: Lang;
    label: string;
    nativeName: string;
    description: string;
  }[] = [
    {
      id: "en",
      label: "English",
      nativeName: "English",
      description: "Default language across ledger reports and alerts",
    },
    {
      id: "hi",
      label: "Hindi",
      nativeName: "हिंदी",
      description: "खर्च, बही खाता, ग्रुप्स, और नोटिफिकेशन हिंदी में",
    },
    {
      id: "gu",
      label: "Gujarati",
      nativeName: "ગુજરાતી",
      description: "ખાતાવહી, ખર્ચ, બજેટ અને સૂચનાઓ ગુજરાતીમાં",
    },
  ];

  const handleExportData = () => {
    setIsExporting(true);
    setTimeout(() => {
      const exportBlob = new Blob(
        [
          JSON.stringify(
            {
              exportedAt: new Date().toISOString(),
              user: { name: profileName, email: user?.email, phone: profilePhone },
              app: "TrackKaro Web Edition v1.0.0",
              format: "Verified Financial Ledger Backup",
            },
            null,
            2
          ),
        ],
        { type: "application/json" }
      );
      const url = URL.createObjectURL(exportBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TrackKaro-Financial-Backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setIsExporting(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    }, 600);
  };

  const handleProfileSave = (e: FormEvent) => {
    e.preventDefault();
    setShowEditProfileModal(false);
  };

  const initials = (profileName || user?.name || "Jay")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header Row (Matching Coterie Styling & Outfit Font) */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="font-display font-normal text-[26px] sm:text-[32px] lg:text-[38px] tracking-[-0.02em] text-foreground leading-tight mb-1.5">
            Settings & Preferences
          </h1>
          <p className="text-xs sm:text-sm font-medium text-foreground-muted">
            Manage your profile, theme appearance, trilingual localization, and data privacy.
          </p>
        </div>

        {/* Quick Action Button */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowEditProfileModal(true)}
            className="flex items-center gap-2 rounded-full px-5 py-2 text-xs sm:text-[13px] font-bold bg-[#0E1F16] text-white hover:bg-black dark:bg-emerald-400 dark:text-emerald-950 transition shadow-xs hover:scale-[1.02]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* 2. Top Profile Summary Card */}
      <div className="p-6 sm:p-7 rounded-[28px] bg-surface/90 border border-border/80 card-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-16 w-16 rounded-2xl bg-emerald-500/15 text-[#059669] dark:text-emerald-400 font-display font-bold text-2xl flex items-center justify-center shrink-0 shadow-inner">
            {initials || "👤"}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h2 className="font-display font-medium text-xl sm:text-2xl text-foreground truncate">
                {profileName}
              </h2>
              <span className="rounded-full bg-emerald-500/15 text-[#059669] dark:text-emerald-400 px-2.5 py-0.5 text-[10px] font-bold">
                PRO ACTIVE
              </span>
            </div>
            <p className="text-xs text-foreground-muted font-mono mt-0.5 truncate">
              {user?.email || "jay@trackkaro.com"}
            </p>
            <p className="text-xs text-foreground-sub mt-0.5">
              Phone: {profilePhone} • Working Day: {workingHours} hrs
            </p>
          </div>
        </div>

        {/* Security & Sync Pill Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3 py-1.5 rounded-full bg-surface-muted border border-border text-xs font-semibold text-foreground flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>256-Bit Encrypted</span>
          </div>

          <div className="px-3 py-1.5 rounded-full bg-surface-muted border border-border text-xs font-semibold text-foreground flex items-center gap-1.5">
            <span>⚡</span>
            <span>Realtime Cloud Sync</span>
          </div>

          <button
            type="button"
            onClick={() => dispatch(logOut())}
            className="px-4 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-[#EF4444] text-xs font-bold transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* 3. Settings Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Appearance & Theme */}
        <div className="p-6 rounded-[28px] bg-surface/90 border border-border/80 card-shadow flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-display font-medium text-lg sm:text-xl text-foreground">
                Appearance & Theme
              </h3>
              <span className="text-xs font-semibold text-foreground-muted">Live Preview</span>
            </div>
            <p className="text-xs text-foreground-muted mb-4">
              Choose how TrackKaro renders on your desktop and mobile displays.
            </p>

            <div className="space-y-2.5">
              {themeOptions.map((opt) => {
                const isSelected = theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTheme(opt.id)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-[16px] border text-left transition ${
                      isSelected
                        ? "border-[#0E1F16] dark:border-emerald-400 bg-surface-muted/90 shadow-xs"
                        : "border-border/70 bg-surface hover:bg-surface-muted/60"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] transition ${
                          isSelected
                            ? "bg-[#0E1F16] text-white dark:bg-emerald-400 dark:text-emerald-950"
                            : "bg-surface-muted text-foreground-sub"
                        }`}
                      >
                        {opt.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-[13px] font-bold text-foreground truncate">{opt.title}</p>
                        <p className="text-[11px] text-foreground-muted truncate">{opt.description}</p>
                      </div>
                    </div>

                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition ${
                        isSelected
                          ? "bg-[#0E1F16] text-white dark:bg-emerald-400 dark:text-emerald-950"
                          : "border border-border text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 2: Language & Regional */}
        <div className="p-6 rounded-[28px] bg-surface/90 border border-border/80 card-shadow flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-display font-medium text-lg sm:text-xl text-foreground">
                Language & Regional
              </h3>
              <span className="text-xs font-semibold text-primary font-mono">Trilingual</span>
            </div>
            <p className="text-xs text-foreground-muted mb-4">
              Select your preferred regional language across ledgers and voice log.
            </p>

            <div className="space-y-2.5">
              {languageOptions.map((opt) => {
                const isSelected = lang === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLang(opt.id)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-[16px] border text-left transition ${
                      isSelected
                        ? "border-[#0E1F16] dark:border-emerald-400 bg-surface-muted/90 shadow-xs"
                        : "border-border/70 bg-surface hover:bg-surface-muted/60"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] font-mono text-xs font-bold transition ${
                          isSelected
                            ? "bg-[#0E1F16] text-white dark:bg-emerald-400 dark:text-emerald-950"
                            : "bg-surface-muted text-foreground-sub"
                        }`}
                      >
                        {opt.id.toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs sm:text-[13px] font-bold text-foreground">{opt.label}</p>
                          <span className="text-xs text-primary font-semibold">({opt.nativeName})</span>
                        </div>
                        <p className="text-[11px] text-foreground-muted truncate">{opt.description}</p>
                      </div>
                    </div>

                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition ${
                        isSelected
                          ? "bg-[#0E1F16] text-white dark:bg-emerald-400 dark:text-emerald-950"
                          : "border border-border text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 3: Notifications & Alert Preferences */}
        <div className="p-6 rounded-[28px] bg-surface/90 border border-border/80 card-shadow flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-display font-medium text-lg sm:text-xl text-foreground">
                Proactive Alerts & Alarms
              </h3>
              <span className="text-xs font-semibold text-foreground-muted">Push Notifications</span>
            </div>
            <p className="text-xs text-foreground-muted mb-4">
              Configure automated reminders for pending bills, debts, and budgets.
            </p>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 rounded-[16px] bg-surface-muted/70 border border-border/70 cursor-pointer">
                <div>
                  <span className="text-xs sm:text-[13px] font-bold text-foreground block">
                    Budget Ceiling Warning Badges
                  </span>
                  <span className="text-[11px] text-foreground-muted block mt-0.5">
                    Proactive alerts when any category reaches 75% & 100% of target limit.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={budgetAlerts}
                  onChange={(e) => setBudgetAlerts(e.target.checked)}
                  className="h-4 w-4 rounded accent-[#059669] cursor-pointer shrink-0 ml-3"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-[16px] bg-surface-muted/70 border border-border/70 cursor-pointer">
                <div>
                  <span className="text-xs sm:text-[13px] font-bold text-foreground block">
                    Bill Due Date Reminders
                  </span>
                  <span className="text-[11px] text-foreground-muted block mt-0.5">
                    Receive notification 3 days before upcoming utilities, rent, and subscriptions.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={billReminders}
                  onChange={(e) => setBillReminders(e.target.checked)}
                  className="h-4 w-4 rounded accent-[#059669] cursor-pointer shrink-0 ml-3"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-[16px] bg-surface-muted/70 border border-border/70 cursor-pointer">
                <div>
                  <span className="text-xs sm:text-[13px] font-bold text-foreground block">
                    Daily Financial Evening Digest
                  </span>
                  <span className="text-[11px] text-foreground-muted block mt-0.5">
                    Summary of day&apos;s spending and net udhar change at 8:00 PM.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={dailyDigest}
                  onChange={(e) => setDailyDigest(e.target.checked)}
                  className="h-4 w-4 rounded accent-[#059669] cursor-pointer shrink-0 ml-3"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Card 4: Data Privacy & Encrypted Vault */}
        <div className="p-6 rounded-[28px] bg-surface/90 border border-border/80 card-shadow flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-display font-medium text-lg sm:text-xl text-foreground">
                Data Privacy & Vault
              </h3>
              <span className="text-xs font-semibold text-[#059669] dark:text-emerald-400">Zero-Data Selling</span>
            </div>
            <p className="text-xs text-foreground-muted mb-4">
              Your financial records are 100% private. We never monetize or sell user data.
            </p>

            <div className="space-y-3">
              <div className="p-4 rounded-[18px] bg-surface-muted/70 border border-border/70 space-y-2">
                <span className="text-xs font-bold text-foreground block">
                  Export Complete Cloud Backup
                </span>
                <p className="text-[11px] text-foreground-muted leading-relaxed">
                  Download a cryptographically verified JSON copy of all transactions, digital khata books, and group expense records.
                </p>

                <button
                  type="button"
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="mt-1 w-full h-9 rounded-full bg-surface border border-border hover:border-primary text-xs font-bold text-foreground transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" x2="12" y1="15" y2="3" />
                  </svg>
                  <span>
                    {isExporting ? "Generating..." : exportSuccess ? "Downloaded Successfully!" : "Download Backup (JSON)"}
                  </span>
                </button>
              </div>

              <div className="p-3.5 rounded-[16px] bg-emerald-500/10 border border-emerald-500/20 text-xs">
                <span className="font-bold text-[#059669] dark:text-emerald-400 block">
                  🛡️ TrackKaro Security Promise
                </span>
                <span className="text-[11px] text-foreground-muted mt-0.5 block leading-relaxed">
                  End-to-end encrypted ledger sync. Data strictly belongs to you.
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-foreground-muted">
            <span>TrackKaro v1.0.0 Web Edition</span>
            <div className="flex items-center gap-2">
              <Link href="/privacy" className="hover:text-foreground underline">Privacy</Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-foreground underline">Terms</Link>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: EDIT WORKSPACE / PROFILE (EXACT COTERIE SPECS) */}
      <Modal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        title="Workspace settings"
        description="Configure your account greeting and daily working hours."
        maxWidth="md"
      >
        <form onSubmit={handleProfileSave} className="space-y-3.5">
          <ModalField
            label="Your first name"
            description="Used in the greeting on Overview."
          >
            <input
              type="text"
              required
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="h-9 w-full rounded-[10px] bg-[#EAF3EE] dark:bg-[#14291F] text-[#14231A] dark:text-[#F1FBF6] placeholder:text-[#6B8B79]/60 px-3 text-xs sm:text-[13px] font-medium border-0 shadow-[inset_0_0_0_1px_rgba(18,60,38,0.12)] focus:outline-none focus:shadow-[inset_0_0_0_2px_#059669] transition"
            />
          </ModalField>

          <ModalField label="Phone number">
            <input
              type="tel"
              value={profilePhone}
              onChange={(e) => setProfilePhone(e.target.value)}
              className="h-9 w-full rounded-[10px] bg-[#EAF3EE] dark:bg-[#14291F] text-[#14231A] dark:text-[#F1FBF6] placeholder:text-[#6B8B79]/60 px-3 text-xs sm:text-[13px] font-medium border-0 shadow-[inset_0_0_0_1px_rgba(18,60,38,0.12)] focus:outline-none focus:shadow-[inset_0_0_0_2px_#059669] transition"
            />
          </ModalField>

          {/* Working Day Segmented Choice (Matching Coterie exact Working Day [6h, 7h, 8h, 9h]) */}
          <ModalField
            label="Working day"
            description="The time tracker's dial fills against this."
          >
            <ModalSegmentedPicker
              options={[
                { value: 6, label: "6 h" },
                { value: 7, label: "7 h" },
                { value: 8, label: "8 h" },
                { value: 9, label: "9 h" },
              ]}
              selected={workingHours}
              onChange={(val) => setWorkingHours(val as number)}
            />
          </ModalField>

          <ModalFooter
            onCancel={() => setShowEditProfileModal(false)}
            confirmLabel="Save changes"
          />
        </form>
      </Modal>
    </div>
  );
}
