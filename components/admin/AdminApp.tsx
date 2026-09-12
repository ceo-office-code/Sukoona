"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Download,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShoppingBag,
  Users,
  X,
  Inbox,
  Phone,
  MessageCircle,
  Archive,
  Check,
} from "lucide-react";
import {
  STAGES,
  PRIORITIES,
  OUTCOMES,
  label,
  type Member,
  type Lead,
  type Activity,
  type Overview,
} from "@/lib/crm/types";
import { LeadForm } from "@/components/LeadCapture";
async function api(path: string, method = "GET", data?: unknown) {
  const r = await fetch("/api/admin/" + path, {
    method,
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
    cache: "no-store",
  });
  const v = await r.json();
  if (!r.ok) {
    if (r.status === 401 && path !== "session" && !path.startsWith("auth"))
      window.dispatchEvent(new Event("admin-expired"));
    throw Error(v.error || "Please try again.");
  }
  return v;
}
const date = (v: string | null) =>
  v
    ? new Date(v).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      })
    : "—";
const nav = [
  ["overview", "Overview", LayoutDashboard],
  ["leads", "All leads", Inbox],
  ["followups", "Follow-ups", CalendarClock],
  ["reports", "Reports", BarChart3],
  ["customers", "Customers", Users],
  ["orders", "Orders", ShoppingBag],
  ["team", "Team", Users],
  ["settings", "Settings", Settings],
] as const;
export default function AdminApp() {
  const [me, setMe] = useState<Member | null>(null),
    [loading, setLoading] = useState(true),
    [tab, setTab] = useState("overview"),
    [mobile, setMobile] = useState(false),
    [error, setError] = useState(""),
    [refresh, setRefresh] = useState(0),
    [members, setMembers] = useState<Member[]>([]),
    [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    api("session")
      .then((v) => setMe(v.member))
      .catch(() => {
        if (new URLSearchParams(location.search).get("login") === "expired")
          setError("Please sign in with your email and password.");
      })
      .finally(() => setLoading(false));
    const expire = () => {
      setMe(null);
      setError("Your session expired. Please sign in again.");
    };
    window.addEventListener("admin-expired", expire);
    return () => window.removeEventListener("admin-expired", expire);
  }, []);
  useEffect(() => {
    if (me)
      api("members")
        .then(setMembers)
        .catch((e) => setError(e.message));
  }, [me, refresh]);
  function go(v: string) {
    setTab(v);
    setSelected(null);
    setMobile(false);
    setError("");
  }
  if (loading)
    return (
      <main className="admin-app admin-loading">Opening your workspace…</main>
    );
  if (!me)
    return (
      <Login
        initialError={error}
        onLogin={async () => {
          const value = await api("session");
          setMe(value.member);
          setError("");
        }}
      />
    );
  return (
    <main className="admin-app" id="main-content">
      <aside className={"admin-sidebar " + (mobile ? "is-open" : "")}>
        <Link href="/" className="admin-brand">
          sukoona<span>WORKSPACE</span>
        </Link>
        <div className="workspace-tag">
          <span className="status-dot" />
          Sukoona · Live workspace
        </div>
        <nav aria-label="Admin navigation">
          {nav
            .filter(
              ([id]) =>
                me.role !== "agent" ||
                !["customers", "orders", "team", "settings"].includes(id),
            )
            .map(([id, title, Icon]) => (
              <button
                key={id}
                className={tab === id ? "active" : ""}
                onClick={() => go(id)}
              >
                <Icon size={18} />
                {title}
                {id === "followups" && <span className="nav-dot" />}
              </button>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/" target="_blank">
            View website <ArrowUpRight size={16} />
          </Link>
          <div className="admin-profile">
            <span>{me.name.slice(0, 1)}</span>
            <div>
              <strong>{me.name}</strong>
              <small>{label(me.role)}</small>
            </div>
            <button
              aria-label="Sign out"
              onClick={async () => {
                try {
                  await api("auth/logout", "POST", {});
                  setMe(null);
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <section className="admin-main">
        <header className="admin-topbar">
          <button
            className="mobile-menu"
            aria-label="Toggle navigation"
            onClick={() => setMobile(!mobile)}
          >
            <Menu />
          </button>
          <span>
            Workspace <span className="crumb">/</span>{" "}
            <strong>{nav.find((n) => n[0] === tab)?.[1]}</strong>
          </span>
          <div>
            <span className="timezone">All times in IST</span>
            <button
              className="icon-button"
              aria-label="Refresh"
              onClick={() => setRefresh((x) => x + 1)}
            >
              <RefreshCw size={17} />
            </button>
          </div>
        </header>
        <div className="admin-content">
          {error && (
            <div className="admin-alert" role="alert">
              {error}
              <button aria-label="Dismiss error" onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {["overview", "reports"].includes(tab) && (
            <Dashboard
              key={tab + refresh}
              reports={tab === "reports"}
              onOpen={() => go("followups")}
            />
          )}
          {["leads", "followups"].includes(tab) && (
            <Leads
              key={tab + refresh}
              followups={tab === "followups"}
              members={members}
              me={me}
              onSelect={setSelected}
            />
          )}
          {["customers", "orders"].includes(tab) && (
            <Records key={tab + refresh} resource={tab} />
          )}
          {tab === "team" && (
            <Team
              key={refresh}
              me={me}
              members={members}
              reload={() => setRefresh((x) => x + 1)}
            />
          )}
          {tab === "settings" && <SettingsPanel me={me} />}
        </div>
      </section>
      {selected && (
        <LeadDetail
          id={selected}
          me={me}
          members={members}
          onClose={() => {
            setSelected(null);
            setRefresh((x) => x + 1);
          }}
        />
      )}
    </main>
  );
}
function Login({
  initialError,
  onLogin,
}: {
  initialError: string;
  onLogin: () => Promise<void>;
}) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [showPassword, setShowPassword] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(initialError);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("auth/login", "POST", { email, password });
      setPassword("");
      await onLogin();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="admin-app admin-login">
      <section className="login-story">
        <Link href="/" className="admin-brand">
          sukoona
        </Link>
        <div>
          <span className="login-orbit">☾</span>
          <span className="eyebrow">THE PEOPLE BEHIND THE PAUSE</span>
          <h1>
            Good conversations.
            <br />
            <em>Thoughtful follow-ups.</em>
          </h1>
          <p>
            A little care goes a long way. Your Sukoona workspace brings every
            enquiry and next step together.
          </p>
        </div>
        <small>THE SUKOONA WORKSPACE</small>
      </section>
      <section className="login-form-wrap">
        <form onSubmit={submit} className="login-form">
          <span className="admin-kicker">WELCOME BACK</span>
          <h2>Your workspace awaits.</h2>
          <p>Sign in with your team email and password.</p>
          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              disabled={busy}
            />
          </label>
          <label>
            Password
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              maxLength={256}
              autoComplete="current-password"
              disabled={busy}
            />
          </label>
          <button
            type="button"
            className="text-button password-visibility"
            aria-pressed={showPassword}
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? "Hide password" : "Show password"}
          </button>
          {error && (
            <div role="alert" className="admin-alert">
              {error}
            </div>
          )}
          <button className="admin-primary" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
            <ArrowUpRight size={18} />
          </button>
          <small>
            Access is limited to the Sukoona team.
            <br />
            Your session lasts 12 hours.
          </small>
          <Link href="/" className="back-to-site">
            ← Back to Sukoona
          </Link>
        </form>
      </section>
    </main>
  );
}
function Dashboard({
  reports,
  onOpen,
}: {
  reports: boolean;
  onOpen: () => void;
}) {
  const [now] = useState(() => Date.now());
  const [data, setData] = useState<Overview | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    api("overview")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <>
      <PageTitle
        eyebrow={reports ? "INSIGHTS & ATTRIBUTION" : "YOUR DAILY PULSE"}
        title={reports ? "Every conversation counts." : "A fresh perspective."}
        subtitle={
          reports
            ? "See where enquiries begin and how they move through your pipeline."
            : "A clear view of your leads, your customers and what needs attention."
        }
      />
      {error ? (
        <Notice message={error} />
      ) : !data ? (
        <Loading />
      ) : (
        <>
          <div className="metric-grid">
            {[
              ["Total leads", data.total, "Active records"],
              ["New enquiries", data.new, data.today + " received today"],
              ["Follow-ups overdue", data.overdue, "Ready for your attention"],
              ["Won leads", data.won, "Linked to a paid order"],
            ].map(([title, value, note]) => (
              <div className="metric-card" key={title}>
                <span>{title}</span>
                <strong>{value}</strong>
                <small>{note}</small>
              </div>
            ))}
          </div>
          {!reports && (
            <div className="followup-banner">
              <div className="banner-icon">
                <CalendarClock />
              </div>
              <div>
                <h3>Make time for the next conversation.</h3>
                <p>
                  {data.due_today} upcoming today · {data.overdue} overdue ·{" "}
                  {data.unassigned} unassigned
                </p>
              </div>
              <button className="admin-primary" onClick={onOpen}>
                Open follow-ups <ArrowUpRight size={17} />
              </button>
            </div>
          )}
          <div className="admin-two-col">
            <section className="admin-panel">
              <PanelHead
                title="Lead pipeline"
                note="Active records by current stage"
              />
              <div className="pipeline">
                {STAGES.map((s) => (
                  <div key={s}>
                    <span>
                      <i className={"stage-dot " + s} />
                      {label(s)}
                    </span>
                    <div className="bar-track">
                      <i
                        style={{
                          width:
                            Math.max(
                              0,
                              ((data.stages.find((x) => x.stage === s)?.count ||
                                0) /
                                (data.total || 1)) *
                                100,
                            ) + "%",
                        }}
                      />
                    </div>
                    <strong>
                      {data.stages.find((x) => x.stage === s)?.count || 0}
                    </strong>
                  </div>
                ))}
              </div>
            </section>
            <section className="admin-panel">
              <PanelHead
                title="Where people find you"
                note="First enquiry source · all time"
              />
              {data.sources.length ? (
                <div className="source-list">
                  {data.sources.map((s) => (
                    <div key={s.source}>
                      <span>{label(s.source)}</span>
                      <strong>{s.count}</strong>
                      <small>
                        {Math.round((s.count / (data.total || 1)) * 100)}%
                      </small>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty
                  title="Your first connection is ahead."
                  text="Sources will appear as people send enquiries."
                />
              )}
            </section>
          </div>
          <div className="admin-two-col">
            <section className="admin-panel">
              <PanelHead
                title="Enquiries over time"
                note="Last 14 days · includes archived enquiries"
              />
              <div className="daily-chart">
                {Array.from({ length: 14 }, (_, i) => {
                  const d = new Date(
                      now - (13 - i) * 86400000,
                    ).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }),
                    n = data.daily.find((x) => x.day === d)?.count || 0,
                    max = Math.max(1, ...data.daily.map((x) => x.count));
                  return (
                    <div key={d} title={d + ": " + n + " enquiries"}>
                      <span>{n || ""}</span>
                      <i style={{ height: Math.max(2, (n / max) * 115) }} />
                      <small>{d.slice(-2)}</small>
                    </div>
                  );
                })}
              </div>
            </section>
            <section className="admin-panel">
              <PanelHead
                title="Website & customer activity"
                note="Website activity: last 30 days"
              />
              {data.visits !== undefined ? (
                <div className="activity-stats">
                  {[
                    ["Website sessions", data.visits],
                    ["Page views", data.views],
                    ["WhatsApp clicks", data.whatsapp_clicks],
                    ["Customers · all time", data.customers],
                    ["Orders · all time", data.orders],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <span>{k}</span>
                      <strong>{v}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="panel-note">
                  Website totals are available to managers.
                </p>
              )}
              <p className="panel-note">
                Anonymous visits and WhatsApp clicks are activity, not
                identified leads.
              </p>
            </section>
          </div>
        </>
      )}
    </>
  );
}
function Leads({
  followups,
  members,
  me,
  onSelect,
}: {
  followups: boolean;
  members: Member[];
  me: Member;
  onSelect: (id: string) => void;
}) {
  const [now] = useState(() => Date.now());
  const [filters, setFilters] = useState({
      q: "",
      stage: "",
      priority: "",
      assignee: "",
      source: "",
      archived: "",
      due: followups ? "all" : "",
      from: "",
      to: "",
    }),
    [page, setPage] = useState(1),
    [data, setData] = useState<{ leads: Lead[]; count: number } | null>(null),
    [error, setError] = useState(""),
    [manual, setManual] = useState(false);
  const query = new URLSearchParams({
    ...filters,
    page: String(page),
  }).toString();
  useEffect(() => {
    let live = true;
    const t = setTimeout(() => {
      setError("");
      api("leads?" + query)
        .then((v) => {
          if (live) setData(v);
        })
        .catch((e) => {
          if (live) setError(e.message);
        });
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [query]);
  function filter(key: string, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
    setData(null);
  }
  return (
    <>
      <PageTitle
        eyebrow={
          followups ? "YOUR NEXT CONVERSATIONS" : "CONTACTS & CONVERSATIONS"
        }
        title={followups ? "A little follow-through." : "Your lead collection."}
        subtitle={
          followups
            ? "Scheduled conversations, earliest first. All times are shown in IST."
            : "Every enquiry in one place. Open a lead to manage the next step."
        }
      >
        <a className="admin-secondary" href={"/api/admin/export?" + query}>
          <Download size={16} />
          Export
        </a>
        {me.role !== "agent" && (
          <button className="admin-primary" onClick={() => setManual(true)}>
            <Plus size={16} />
            Add lead
          </button>
        )}
      </PageTitle>
      <section className="admin-panel">
        <div className="lead-filters">
          <label className="search-field">
            <Search size={17} />
            <input
              aria-label="Search leads"
              placeholder="Search name, phone or email"
              value={filters.q}
              onChange={(e) => filter("q", e.target.value)}
            />
          </label>
          <select
            aria-label="Stage"
            value={filters.stage}
            onChange={(e) => filter("stage", e.target.value)}
          >
            <option value="">All stages</option>
            {STAGES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            aria-label="Priority"
            value={filters.priority}
            onChange={(e) => filter("priority", e.target.value)}
          >
            <option value="">All priorities</option>
            {PRIORITIES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          {me.role !== "agent" && (
            <select
              aria-label="Assigned to"
              value={filters.assignee}
              onChange={(e) => filter("assignee", e.target.value)}
            >
              <option value="">All owners</option>
              <option value="unassigned">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                  {!m.active ? " (inactive)" : ""}
                </option>
              ))}
            </select>
          )}
          <select
            aria-label="Source"
            value={filters.source}
            onChange={(e) => filter("source", e.target.value)}
          >
            <option value="">All sources</option>
            {[
              "enquiry",
              "product",
              "whatsapp",
              "journal",
              "callback",
              "bulk",
              "manual",
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            aria-label="Archive status"
            value={filters.archived}
            onChange={(e) => filter("archived", e.target.value)}
          >
            <option value="">Active leads</option>
            <option value="true">Archived leads</option>
          </select>
          {followups && (
            <select
              aria-label="Follow-up timing"
              value={filters.due}
              onChange={(e) => filter("due", e.target.value)}
            >
              <option value="all">All scheduled</option>
              <option value="overdue">Overdue</option>
            </select>
          )}
          <label>
            From
            <input
              type="date"
              value={filters.from}
              onChange={(e) => filter("from", e.target.value)}
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={filters.to}
              onChange={(e) => filter("to", e.target.value)}
            />
          </label>
        </div>
        {error ? (
          <Notice message={error} />
        ) : !data ? (
          <Loading />
        ) : data.leads.length ? (
          <>
            <div className="table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    {[
                      "Lead",
                      "Stage",
                      "Priority",
                      "Source / owner",
                      "Follow-up",
                      "Last enquiry",
                      "",
                    ].map((s, i) => (
                      <th key={i}>{s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.leads.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <button
                          className="lead-name"
                          onClick={() => onSelect(l.id)}
                        >
                          {l.name}
                        </button>
                        <small>{l.phone}</small>
                      </td>
                      <td>
                        <span className={"badge " + l.stage}>
                          {label(l.stage)}
                        </span>
                      </td>
                      <td>
                        <span className={"priority " + l.priority}>
                          <i />
                          {label(l.priority)}
                        </span>
                      </td>
                      <td>
                        {label(l.source)}
                        <small>
                          {members.find((m) => m.id === l.assignee_id)?.name ||
                            "Unassigned"}
                        </small>
                      </td>
                      <td
                        className={
                          l.follow_up_at && Date.parse(l.follow_up_at) < now
                            ? "overdue"
                            : ""
                        }
                      >
                        {date(l.follow_up_at)}
                      </td>
                      <td>
                        {date(l.last_seen_at)}
                        <small>
                          {l.submission_count > 1
                            ? l.submission_count + " enquiries"
                            : "First enquiry"}
                        </small>
                      </td>
                      <td>
                        <button
                          aria-label={"Open " + l.name}
                          className="icon-button"
                          onClick={() => onSelect(l.id)}
                        >
                          <ArrowUpRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} count={data.count} setPage={setPage} />
          </>
        ) : (
          <Empty
            title="No leads here yet."
            text="Enquiries from the website will appear here. Try adjusting your filters."
          />
        )}
      </section>
      {manual && (
        <div className="drawer-backdrop">
          <section className="admin-drawer">
            <div className="drawer-heading">
              <h2>Add an enquiry</h2>
              <button onClick={() => setManual(false)} aria-label="Close">
                <X />
              </button>
            </div>
            <p>
              Use this form with the customer’s contact permission. It saves
              directly to the enquiry inbox.
            </p>
            <LeadForm source="manual" manual />
          </section>
        </div>
      )}
    </>
  );
}
function LeadDetail({
  id,
  me,
  members,
  onClose,
}: {
  id: string;
  me: Member;
  members: Member[];
  onClose: () => void;
}) {
  const [data, setData] = useState<{
      lead: Lead;
      activities: Activity[];
      submissions: {
        id: string;
        payload: Record<string, string>;
        created_at: string;
      }[];
    } | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [wa, setWa] = useState("");
  const load = useCallback(
    () =>
      api("leads/" + id)
        .then(setData)
        .catch((e) => setError(e.message)),
    [id],
  );
  useEffect(() => {
    void load();
    fetch("/api/settings")
      .then((r) => r.json())
      .then((v) => setWa(v.whatsapp_number))
      .catch(() => {});
  }, [load]);
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [onClose]);
  async function save(patch: Record<string, unknown>) {
    if (!data) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api("leads/" + id, "PATCH", {
        version: data.lead.version,
        patch,
        request_id: crypto.randomUUID(),
      });
      await load();
      setNotice("Saved.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const l = data?.lead;
  return (
    <div className="drawer-backdrop">
      <section
        className="admin-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Lead details"
      >
        <div className="drawer-heading">
          <div>
            <span className="admin-kicker">LEAD DETAILS</span>
            <h2>{l?.name || "Loading…"}</h2>
          </div>
          <button aria-label="Close lead" onClick={onClose}>
            <X />
          </button>
        </div>
        {error && <Notice message={error} />}
        <span role="status" className="save-status">
          {notice}
        </span>
        {l && data && (
          <>
            <div className="lead-contact">
              <span className={"badge " + l.stage}>{label(l.stage)}</span>
              <p>
                <span>{l.phone}</span>
                {l.email && (
                  <>
                    {" "}
                    · <a href={"mailto:" + l.email}>{l.email}</a>
                  </>
                )}
              </p>
              <small>
                {l.city || "City not provided"} · {label(l.inquiry)} ·{" "}
                {l.pack === "not_sure" ? "Pack undecided" : l.pack + " gummies"}
              </small>
              <div className="contact-actions">
                {l.stage !== "dnd" && (
                  <>
                    <a className="admin-secondary" href={"tel:" + l.phone}>
                      <Phone size={15} />
                      Call
                    </a>
                    {wa && (
                      <a
                        className="admin-secondary"
                        target="_blank"
                        rel="noopener noreferrer"
                        href={
                          "https://wa.me/" +
                          l.phone.replace("+", "") +
                          "?text=" +
                          encodeURIComponent(
                            "Hello " +
                              l.name +
                              ", this is the Sukoona team following up on your enquiry.",
                          )
                        }
                      >
                        <MessageCircle size={15} />
                        WhatsApp
                      </a>
                    )}
                  </>
                )}
                <button
                  className="admin-secondary"
                  disabled={busy}
                  onClick={() =>
                    save({ kind: "archive", archived: !l.archived_at })
                  }
                >
                  <Archive size={15} />
                  {l.archived_at ? "Restore" : "Archive"}
                </button>
              </div>
              {l.stage === "dnd" && (
                <p className="admin-alert">Do not contact. {l.lost_reason}</p>
              )}
            </div>
            <form
              key={l.version}
              onSubmit={(e) => {
                e.preventDefault();
                const v = Object.fromEntries(new FormData(e.currentTarget));
                const patch: Record<string, unknown> = {
                  kind: "update",
                  stage: v.stage,
                  priority: v.priority,
                  lost_reason: v.lost_reason,
                  order_id: v.order_id || null,
                  follow_up_at: v.follow_up_at
                    ? new Date(String(v.follow_up_at) + "+05:30").toISOString()
                    : null,
                };
                if (me.role !== "agent")
                  patch.assignee_id = v.assignee_id || null;
                void save(patch);
              }}
            >
              <h3>Next step</h3>
              <div className="form-grid">
                <label>
                  Stage
                  <select name="stage" defaultValue={l.stage}>
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {label(s)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Priority
                  <select name="priority" defaultValue={l.priority}>
                    {PRIORITIES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                {me.role !== "agent" && (
                  <label>
                    Assigned to
                    <select
                      name="assignee_id"
                      defaultValue={l.assignee_id || ""}
                    >
                      <option value="">Unassigned</option>
                      {members
                        .filter((m) => m.active || m.id === l.assignee_id)
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                    </select>
                  </label>
                )}
                <label>
                  Follow-up · IST
                  <input
                    type="datetime-local"
                    name="follow_up_at"
                    defaultValue={
                      l.follow_up_at
                        ? new Date(Date.parse(l.follow_up_at) + 19800000)
                            .toISOString()
                            .slice(0, 16)
                        : ""
                    }
                  />
                </label>
              </div>
              <label>
                Reason for lost / do not contact
                <input
                  name="lost_reason"
                  defaultValue={l.lost_reason || ""}
                  maxLength={1000}
                />
              </label>
              <label>
                Paid order ID <small>(required for won)</small>
                <input
                  name="order_id"
                  defaultValue={l.order_id || ""}
                  placeholder="Order UUID"
                />
              </label>
              <button className="admin-primary" disabled={busy}>
                <Check size={16} />
                {busy ? "Saving…" : "Save changes"}
              </button>
            </form>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget,
                  v = Object.fromEntries(new FormData(form));
                await save({
                  kind: v.kind,
                  note: v.note,
                  ...(v.kind === "call" ? { outcome: v.outcome } : {}),
                });
              }}
            >
              <h3>Log a conversation</h3>
              <div className="form-grid">
                <label>
                  Activity
                  <select name="kind">
                    <option value="note">Note</option>
                    <option value="call">Call</option>
                  </select>
                </label>
                <label>
                  Call outcome
                  <select name="outcome">
                    {OUTCOMES.map((s) => (
                      <option key={s} value={s}>
                        {label(s)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                What happened?
                <textarea name="note" required rows={3} maxLength={3000} />
              </label>
              <button disabled={busy} className="admin-secondary">
                Add activity
              </button>
            </form>
            <h3>Enquiry details</h3>
            <div className="detail-facts">
              <p>
                Created <strong>{date(l.created_at)}</strong>
              </p>
              <p>
                Source <strong>{label(l.source)}</strong>
              </p>
              <p>
                Contact permission{" "}
                <strong>{l.consent ? "Recorded" : "Not recorded"}</strong>
              </p>
              {Object.entries(l.attribution)
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <p key={k}>
                    {label(k)}
                    <strong>{v}</strong>
                  </p>
                ))}
            </div>
            <details>
              <summary>All enquiry submissions ({l.submission_count})</summary>
              {data.submissions.map((s) => (
                <div className="timeline-item" key={s.id}>
                  <strong>{date(s.created_at)}</strong>
                  <p>
                    {s.payload.name} · {s.payload.phone} · {s.payload.email}
                  </p>
                  <p>{s.payload.message || "No message provided."}</p>
                </div>
              ))}
              {l.submission_count > 100 && (
                <p>Showing the latest 100 submissions.</p>
              )}
            </details>
            <h3>Activity timeline</h3>
            <div className="timeline">
              {data.activities.map((a) => (
                <div className="timeline-item" key={a.id}>
                  <i />
                  <div>
                    <strong>
                      {label(a.kind)}{" "}
                      <small>
                        ·{" "}
                        {a.actor_id
                          ? members.find((m) => m.id === a.actor_id)?.name ||
                            "Team member"
                          : "Website visitor"}
                      </small>
                    </strong>
                    <p>{a.note || "Record updated."}</p>
                    {a.metadata.patch && (
                      <div className="audit-changes">
                        {Object.entries(a.metadata.patch)
                          .filter(([k]) => !["note", "kind"].includes(k))
                          .map(([k, v]) => (
                            <span key={k}>
                              {label(k)}:{" "}
                              {v === null
                                ? "Cleared"
                                : k === "assignee_id"
                                  ? members.find((m) => m.id === v)?.name ||
                                    String(v)
                                  : String(v)}
                            </span>
                          ))}
                      </div>
                    )}
                    <small>{date(a.created_at)}</small>
                  </div>
                </div>
              ))}
            </div>
            {data.activities.length === 200 && (
              <small>Showing the latest 200 activities.</small>
            )}
          </>
        )}
      </section>
    </div>
  );
}
function Records({ resource }: { resource: string }) {
  const [data, setData] = useState<{
      rows: Record<string, unknown>[];
      count: number;
    } | null>(null),
    [page, setPage] = useState(1),
    [error, setError] = useState("");
  useEffect(() => {
    api(resource + "?page=" + page)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [resource, page]);
  const keys =
    resource === "customers"
      ? ["full_name", "email", "phone", "created_at"]
      : [
          "id",
          "contact_email",
          "status",
          "payment_status",
          "total_minor",
          "created_at",
        ];
  return (
    <>
      <PageTitle
        eyebrow="CUSTOMER RECORDS"
        title={
          resource === "customers"
            ? "People, all in one place."
            : "Your order book."
        }
        subtitle={
          resource === "customers"
            ? "Customers saved in your separate Supabase database."
            : "Confirmed database records. Enquiries become won leads only when linked to a paid order."
        }
      />
      <section className="admin-panel">
        {error ? (
          <Notice message={error} />
        ) : !data ? (
          <Loading />
        ) : !data.rows.length ? (
          <Empty
            title={"No " + resource + " yet."}
            text="There is no active checkout on the current product preview. Records will appear when customers and orders are created."
          />
        ) : (
          <>
            <div className="table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    {keys.map((k) => (
                      <th key={k}>{label(k)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r, i) => (
                    <tr key={i}>
                      {keys.map((k) => (
                        <td key={k}>
                          {k === "created_at"
                            ? date(String(r[k]))
                            : k === "total_minor"
                              ? new Intl.NumberFormat("en-IN", {
                                  style: "currency",
                                  currency: "INR",
                                }).format(Number(r[k]) / 100)
                              : String(r[k] ?? "—")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} count={data.count} setPage={setPage} />
          </>
        )}
      </section>
    </>
  );
}
function Team({
  me,
  members,
  reload,
}: {
  me: Member;
  members: Member[];
  reload: () => void;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(
        "members",
        "POST",
        Object.fromEntries(new FormData(e.currentTarget)),
      );
      reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="PEOPLE & ACCESS"
        title="A team that follows through."
        subtitle="Owners manage access. Managers see all leads. Agents see only their assigned leads."
      />
      <section className="admin-panel">
        {error && <Notice message={error} />}
        <div className="team-list">
          {members.map((m) => (
            <div key={m.id}>
              <span className="avatar">{m.name[0]}</span>
              <div>
                <strong>{m.name}</strong>
                <small>{m.email}</small>
              </div>
              <span className="badge">{m.role}</span>
              <span>{m.active ? "Active" : "Disabled"}</span>
              {me.role === "owner" && m.role !== "owner" && (
                <button
                  className="admin-secondary"
                  onClick={async () => {
                    try {
                      await api("members/" + m.id, "PATCH", {
                        active: !m.active,
                        role: m.role,
                      });
                      reload();
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  {m.active ? "Disable" : "Enable"}
                </button>
              )}
            </div>
          ))}
        </div>
        {me.role === "owner" && (
          <form className="team-form" onSubmit={add}>
            <h3>Add a team member</h3>
            <div className="form-grid">
              <label>
                Name
                <input name="name" required maxLength={120} />
              </label>
              <label>
                Email
                <input name="email" type="email" required autoComplete="off" />
              </label>
              <label>
                Initial password
                <input
                  name="password"
                  type="password"
                  minLength={12}
                  maxLength={256}
                  required
                  autoComplete="new-password"
                />
              </label>
              <label>
                Role
                <select name="role">
                  <option value="agent">Agent · assigned leads only</option>
                  <option value="manager">Manager · all leads</option>
                </select>
              </label>
            </div>
            <button className="admin-primary" disabled={busy}>
              Create access <Plus size={16} />
            </button>
            <p className="panel-note">
              Create a password for this member and share it with them securely.
              They can sign in immediately; no email link is required.
            </p>
          </form>
        )}
      </section>
    </>
  );
}
function SettingsPanel({ me }: { me: Member }) {
  const [number, setNumber] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    api("settings")
      .then((v) => setNumber(v.whatsapp_number))
      .catch((e) => setMessage(e.message));
  }, []);
  return (
    <>
      <PageTitle
        eyebrow="WORKSPACE SETTINGS"
        title="The details that connect."
        subtitle="Manage how customers reach the Sukoona team."
      />
      <section className="admin-panel settings-panel">
        <h3>WhatsApp enquiries</h3>
        <p>Visitors save their enquiry before continuing to WhatsApp.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await api("settings", "PATCH", { whatsapp_number: number });
              setMessage("Settings saved.");
            } catch (e) {
              setMessage((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            WhatsApp number · with country code
            <input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              disabled={me.role !== "owner"}
              placeholder="917017138349"
            />
          </label>
          <p className="panel-note">
            Leave empty to disable the WhatsApp link.
          </p>
          {me.role === "owner" && (
            <button disabled={busy} className="admin-primary">
              Save settings
            </button>
          )}
          <p role="status">{message}</p>
        </form>
        <hr />
        <h3>Connected services</h3>
        <div className="detail-facts">
          <p>
            Website<strong>sukoona.com · Vercel</strong>
          </p>
          <p>
            Customer database<strong>Supabase</strong>
          </p>
          <p>
            Sign-in<strong>Email and password · 12-hour session</strong>
          </p>
          <p>
            Reporting timezone<strong>India · Asia/Kolkata</strong>
          </p>
        </div>
      </section>
    </>
  );
}
function PageTitle({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="admin-page-title">
      <div>
        <span className="admin-kicker">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  );
}
function PanelHead({ title, note }: { title: string; note: string }) {
  return (
    <div className="panel-head">
      <h3>{title}</h3>
      <p>{note}</p>
    </div>
  );
}
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="admin-empty">
      <Inbox size={30} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
function Loading() {
  return (
    <div className="admin-empty" role="status">
      Loading records…
    </div>
  );
}
function Notice({ message }: { message: string }) {
  return (
    <p className="admin-alert" role="alert">
      {message}
    </p>
  );
}
function Pagination({
  page,
  count,
  setPage,
}: {
  page: number;
  count: number;
  setPage: (n: number) => void;
}) {
  return (
    <div className="pagination">
      <span>
        {count} records · Page {page} of {Math.max(1, Math.ceil(count / 25))}
      </span>
      <div>
        <button
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          <ChevronLeft size={18} />
        </button>
        <button
          aria-label="Next page"
          disabled={page * 25 >= count}
          onClick={() => setPage(page + 1)}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
