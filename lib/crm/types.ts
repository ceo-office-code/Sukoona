export const STAGES = [
  "new",
  "contacted",
  "interested",
  "follow_up",
  "won",
  "lost",
  "dnd",
] as const;
export const PRIORITIES = ["hot", "warm", "cold"] as const;
export const INQUIRIES = [
  "product",
  "bulk",
  "partnership",
  "callback",
  "privacy",
] as const;
export const OUTCOMES = [
  "connected",
  "no_answer",
  "busy",
  "callback_requested",
  "not_interested",
  "wrong_number",
] as const;
export type Member = {
  id: string;
  email: string;
  name: string;
  role: "owner" | "manager" | "agent";
  active: boolean;
};
export type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  inquiry: string;
  product: string;
  pack: string;
  stage: string;
  priority: string;
  source: string;
  attribution: Record<string, string>;
  consent: boolean;
  assignee_id: string | null;
  follow_up_at: string | null;
  last_outcome: string | null;
  lost_reason: string | null;
  customer_id: string | null;
  order_id: string | null;
  submission_count: number;
  version: number;
  archived_at: string | null;
  created_at: string;
  last_seen_at: string;
  updated_at: string;
};
export type Activity = {
  id: string;
  actor_id: string | null;
  kind: string;
  note: string;
  metadata: {
    patch?: Record<string, unknown>;
    source?: string;
    repeat?: boolean;
  };
  created_at: string;
};
export type Overview = {
  total: number;
  new: number;
  interested: number;
  won: number;
  today: number;
  overdue: number;
  due_today: number;
  unassigned: number;
  visits?: number;
  views?: number;
  whatsapp_clicks?: number;
  customers?: number;
  orders?: number;
  stages: { stage: string; count: number }[];
  sources: { source: string; count: number }[];
  daily: { day: string; count: number }[];
};
export function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
