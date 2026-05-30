import { useEffect, useState, type ElementType, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Globe,
  Lock,
  LogOut,
  Mail,
  Monitor,
  Palette,
  Shield,
  Smartphone,
  Tablet,
  Trash2,
  User,
} from "lucide-react";
import { usersApi } from "../../api";

type SettingsTab = "profile" | "security" | "notifications" | "appearance" | "language";

function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { score: 1, label: "Weak", color: "#ef4444" },
    { score: 2, label: "Fair", color: "#f59e0b" },
    { score: 3, label: "Good", color: "#6366f1" },
    { score: 4, label: "Strong", color: "#10b981" },
  ];

  return levels[score - 1] || { score: 0, label: "", color: "" };
}

function SettingsInput({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  badge,
  icon: Icon,
  rightSlot,
  disabled = false,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  badge?: ReactNode;
  icon?: ElementType;
  rightSlot?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {badge}
      </div>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        )}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full rounded-lg border border-border bg-input-background py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all disabled:cursor-not-allowed disabled:opacity-70 ${Icon ? "pl-10" : "pl-3.5"} ${rightSlot ? "pr-10" : "pr-3.5"}`}
        />
        {rightSlot && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>}
      </div>
    </div>
  );
}

function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  if (!password) return null;

  return (
    <div className="flex flex-col gap-1.5 mt-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: index <= strength.score ? strength.color : "#334155" }}
          />
        ))}
      </div>
      {strength.label && (
        <p className="text-xs" style={{ color: strength.color }}>
          {strength.label} password
        </p>
      )}
    </div>
  );
}

function ProfileTab() {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["current-user-profile"],
    queryFn: usersApi.getMe,
  });

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saved, setSaved] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!profileQuery.data) return;
    setFullName(profileQuery.data.fullName);
    setAvatarUrl(profileQuery.data.avatarUrl ?? "");
  }, [profileQuery.data]);

  const updateProfileMutation = useMutation({
    mutationFn: () =>
      usersApi.updateMe({
        fullName: fullName.trim(),
        avatarUrl: avatarUrl.trim() || null,
      }),
    onSuccess: async () => {
      setSubmitError("");
      setSaved(true);
      await queryClient.invalidateQueries({ queryKey: ["current-user-profile"] });
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (error) => {
      setSubmitError(error instanceof Error ? error.message : "Unable to update profile");
    },
  });

  const removeAvatarMutation = useMutation({
    mutationFn: usersApi.removeAvatar,
    onSuccess: async () => {
      setAvatarUrl("");
      setSubmitError("");
      await queryClient.invalidateQueries({ queryKey: ["current-user-profile"] });
    },
    onError: (error) => {
      setSubmitError(error instanceof Error ? error.message : "Unable to remove avatar");
    },
  });

  const profile = profileQuery.data;
  const initials = (fullName || profile?.fullName || "TF")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Profile Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Manage your public profile and personal information.</p>
      </div>

      <div className="flex flex-col gap-4 p-6 rounded-xl border border-border bg-card">
        <p className="text-sm font-medium text-foreground">Profile Photo</p>
        <div className="flex items-center gap-6">
          <div
            className="h-24 w-24 rounded-full border-2 border-border overflow-hidden flex items-center justify-center text-white select-none flex-shrink-0"
            style={{ backgroundColor: "#6366f1" }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-semibold">{initials}</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">{profile?.fullName ?? "Loading..."}</p>
            <p className="text-xs text-muted-foreground">{profile?.role ?? "Member"}</p>
            {avatarUrl ? (
              <button
                onClick={() => removeAvatarMutation.mutate()}
                disabled={removeAvatarMutation.isPending}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-[#ef4444] transition-colors px-1 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {removeAvatarMutation.isPending ? "Removing..." : "Remove Photo"}
              </button>
            ) : (
              <p className="text-xs text-muted-foreground px-1">Add an avatar URL to show your photo across the app.</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-6 rounded-xl border border-border bg-card">
        <p className="text-sm font-medium text-foreground">Personal Information</p>

        <SettingsInput
          label="Full Name"
          value={fullName}
          onChange={(value) => {
            setFullName(value);
            setSubmitError("");
          }}
          placeholder="Your full name"
          icon={User}
        />

        <SettingsInput
          label="Email"
          type="email"
          value={profile?.email ?? ""}
          onChange={() => {}}
          disabled
          placeholder="you@company.com"
          icon={Mail}
          badge={
            <span className="inline-flex items-center gap-1 rounded-full bg-[#10b981]/12 px-2 py-0.5 text-[10px] font-semibold text-[#10b981]">
              <CheckCircle2 className="h-3 w-3" />
              Verified
            </span>
          }
        />

        <SettingsInput
          label="Avatar URL"
          value={avatarUrl}
          onChange={(value) => {
            setAvatarUrl(value);
            setSubmitError("");
          }}
          placeholder="https://..."
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => updateProfileMutation.mutate()}
          disabled={profileQuery.isLoading || updateProfileMutation.isPending}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 active:scale-[0.99] transition-all shadow-lg shadow-primary/25 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saved ? <CheckCircle2 className="h-4 w-4" /> : null}
          {updateProfileMutation.isPending ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
        {submitError && <p className="text-sm text-[#ef4444]">{submitError}</p>}
        {saved && <p className="text-sm text-[#10b981]">Your profile has been updated.</p>}
      </div>
    </div>
  );
}

const SESSIONS = [
  { id: "s1", device: "MacBook Pro 16in", location: "San Francisco, CA", browser: "Chrome 124", icon: Monitor, lastActive: "Active now", current: true },
  { id: "s2", device: "iPhone 15 Pro", location: "San Francisco, CA", browser: "Safari 17", icon: Smartphone, lastActive: "2 hours ago", current: false },
  { id: "s3", device: "iPad Air", location: "New York, NY", browser: "Safari 17", icon: Tablet, lastActive: "3 days ago", current: false },
];

function SecurityTab() {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmErr, setConfirmErr] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [sessions, setSessions] = useState(SESSIONS);

  const changePasswordMutation = useMutation({
    mutationFn: () =>
      usersApi.changePassword({
        currentPassword: currentPw,
        newPassword: newPw,
        confirmPassword: confirmPw,
      }),
    onSuccess: () => {
      setSubmitError("");
      setSaved(true);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (error) => {
      setSubmitError(error instanceof Error ? error.message : "Unable to change password");
    },
  });

  function handleUpdate() {
    if (newPw !== confirmPw) {
      setConfirmErr("Passwords do not match");
      return;
    }

    setConfirmErr("");
    setSubmitError("");
    changePasswordMutation.mutate();
  }

  function revokeSession(id: string) {
    setSessions((prev) => prev.filter((session) => session.id !== id));
  }

  function EyeButton({ show, toggle }: { show: boolean; toggle: () => void }) {
    return (
      <button type="button" onClick={toggle} className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Security</h2>
        <p className="mt-1 text-sm text-muted-foreground">Manage your password and active sessions.</p>
      </div>

      <div className="flex flex-col gap-5 p-6 rounded-xl border border-border bg-card">
        <p className="text-sm font-medium text-foreground">Change Password</p>

        <SettingsInput
          label="Current Password"
          type={showCurrent ? "text" : "password"}
          value={currentPw}
          onChange={setCurrentPw}
          placeholder="Enter current password"
          icon={Lock}
          rightSlot={<EyeButton show={showCurrent} toggle={() => setShowCurrent((value) => !value)} />}
        />

        <div className="flex flex-col gap-1.5">
          <SettingsInput
            label="New Password"
            type={showNew ? "text" : "password"}
            value={newPw}
            onChange={setNewPw}
            placeholder="Create a new password"
            icon={Lock}
            rightSlot={<EyeButton show={showNew} toggle={() => setShowNew((value) => !value)} />}
          />
          <PasswordStrengthMeter password={newPw} />
        </div>

        <div className="flex flex-col gap-1.5">
          <SettingsInput
            label="Confirm New Password"
            type={showConfirm ? "text" : "password"}
            value={confirmPw}
            onChange={(value) => {
              setConfirmPw(value);
              if (confirmErr) setConfirmErr("");
            }}
            placeholder="Repeat your new password"
            icon={Lock}
            rightSlot={<EyeButton show={showConfirm} toggle={() => setShowConfirm((value) => !value)} />}
          />
          {confirmErr && <p className="text-xs text-[#ef4444]">{confirmErr}</p>}
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleUpdate}
            disabled={changePasswordMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 active:scale-[0.99] transition-all shadow-lg shadow-primary/25 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saved ? <CheckCircle2 className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
            {changePasswordMutation.isPending ? "Updating..." : saved ? "Password Updated!" : "Update Password"}
          </button>
          {submitError && <p className="text-xs text-[#ef4444]">{submitError}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-4 p-6 rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Active Sessions</p>
            <p className="text-xs text-muted-foreground mt-0.5">Devices where you are currently signed in</p>
          </div>
          <button
            onClick={() => setSessions((prev) => prev.filter((session) => session.current))}
            className="text-xs text-[#ef4444] hover:text-[#ef4444]/80 font-medium transition-colors flex items-center gap-1"
          >
            <LogOut className="h-3.5 w-3.5" />
            Revoke all others
          </button>
        </div>

        <div className="flex flex-col divide-y divide-border/60">
          {sessions.map((session) => {
            const DeviceIcon = session.icon;
            return (
              <div key={session.id} className="flex items-center gap-4 py-4 first:pt-2 last:pb-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/50 flex-shrink-0">
                  <DeviceIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{session.device}</p>
                    {session.current && (
                      <span className="inline-flex items-center rounded-full bg-[#10b981]/12 px-2 py-0.5 text-[10px] font-semibold text-[#10b981] flex-shrink-0">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {session.browser} · {session.location}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <p className="text-xs text-muted-foreground hidden sm:block">{session.lastActive}</p>
                  {!session.current && (
                    <button
                      onClick={() => revokeSession(session.id)}
                      className="text-xs text-muted-foreground hover:text-[#ef4444] font-medium transition-colors border border-border rounded-md px-2.5 py-1 hover:border-[#ef4444]/40"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative h-5 w-9 rounded-full transition-colors flex-shrink-0 ${enabled ? "bg-primary" : "bg-secondary"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-4" : "translate-x-0"}`}
      />
    </button>
  );
}

type NotifRow = { id: string; label: string; desc: string; enabled: boolean };

function NotifPrefsTab() {
  const [rows, setRows] = useState<NotifRow[]>([
    { id: "n1", label: "Task assigned to me", desc: "When someone assigns a task to you", enabled: true },
    { id: "n2", label: "Task status changes", desc: "When a task you own moves to a new column", enabled: true },
    { id: "n3", label: "Comments on my tasks", desc: "When someone comments on a task you own", enabled: true },
    { id: "n4", label: "Mentions", desc: "When someone @mentions you in a comment", enabled: true },
    { id: "n5", label: "Board updates", desc: "General activity on boards you are a member of", enabled: false },
    { id: "n6", label: "Weekly digest", desc: "Summary email of your tasks every Monday", enabled: false },
  ]);

  function toggle(id: string) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, enabled: !row.enabled } : row)));
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Notification Preferences</h2>
        <p className="mt-1 text-sm text-muted-foreground">Choose what you get notified about.</p>
      </div>
      <div className="flex flex-col gap-1 p-6 rounded-xl border border-border bg-card divide-y divide-border/60">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center justify-between gap-4 py-4 first:pt-2 last:pb-0">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{row.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{row.desc}</p>
            </div>
            <Toggle enabled={row.enabled} onToggle={() => toggle(row.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function AppearanceTab() {
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");
  const [accent, setAccent] = useState("#6366f1");
  const accents = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
        <p className="mt-1 text-sm text-muted-foreground">Customize how TaskFlow looks for you.</p>
      </div>

      <div className="flex flex-col gap-6 p-6 rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-foreground">Theme</p>
          <div className="grid grid-cols-3 gap-3">
            {(["dark", "light", "system"] as const).map((item) => (
              <button
                key={item}
                onClick={() => setTheme(item)}
                className={`flex flex-col items-center gap-2.5 rounded-lg border p-4 transition-all ${theme === item ? "border-primary bg-primary/8" : "border-border bg-secondary/20 hover:border-border/60"}`}
              >
                <div className={`h-8 w-full rounded-md border ${item === "dark" ? "bg-[#0f172a] border-[#334155]" : item === "light" ? "bg-white border-gray-200" : "bg-gradient-to-r from-[#0f172a] to-white border-[#334155]"}`} />
                <span className={`text-xs font-medium capitalize ${theme === item ? "text-primary" : "text-muted-foreground"}`}>{item}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-foreground">Accent Color</p>
          <div className="flex items-center gap-2.5">
            {accents.map((color) => (
              <button
                key={color}
                onClick={() => setAccent(color)}
                className="h-7 w-7 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                style={{ backgroundColor: color }}
                title={color}
              >
                {accent === color && <span className="h-3 w-3 rounded-full bg-white/90 shadow" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const LANGUAGES = [
  { code: "en", label: "English", region: "United States" },
  { code: "es", label: "Espanol", region: "Espana" },
  { code: "fr", label: "Francais", region: "France" },
  { code: "de", label: "Deutsch", region: "Deutschland" },
  { code: "ja", label: "Japanese", region: "Japan" },
  { code: "zh", label: "Chinese", region: "China" },
];

function LanguageTab() {
  const [language, setLanguage] = useState("en");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Language</h2>
        <p className="mt-1 text-sm text-muted-foreground">Choose your preferred display language.</p>
      </div>
      <div className="flex flex-col divide-y divide-border/60 rounded-xl border border-border bg-card overflow-hidden">
        {LANGUAGES.map((languageOption) => (
          <button
            key={languageOption.code}
            onClick={() => setLanguage(languageOption.code)}
            className="flex items-center justify-between px-5 py-4 hover:bg-secondary/20 transition-colors text-left"
          >
            <div>
              <p className={`text-sm font-medium ${language === languageOption.code ? "text-primary" : "text-foreground"}`}>{languageOption.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{languageOption.region}</p>
            </div>
            {language === languageOption.code ? (
              <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

const MENU_SECTIONS = [
  {
    label: "Account",
    items: [
      { id: "profile" as SettingsTab, label: "Profile", icon: User },
      { id: "security" as SettingsTab, label: "Security", icon: Shield },
      { id: "notifications" as SettingsTab, label: "Notification Preferences", icon: Bell },
    ],
  },
  {
    label: "Preferences",
    items: [
      { id: "appearance" as SettingsTab, label: "Appearance", icon: Palette },
      { id: "language" as SettingsTab, label: "Language", icon: Globe },
    ],
  },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <nav className="w-[220px] min-w-[220px] flex-shrink-0 border-r border-border bg-card/50 px-3 py-6 overflow-y-auto">
        {MENU_SECTIONS.map((section) => (
          <div key={section.label} className="mb-6">
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {section.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {section.items.map(({ id, label, icon: Icon }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                      isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                    }`}
                  >
                    <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-[640px]">
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "notifications" && <NotifPrefsTab />}
          {activeTab === "appearance" && <AppearanceTab />}
          {activeTab === "language" && <LanguageTab />}
        </div>
      </div>
    </div>
  );
}
