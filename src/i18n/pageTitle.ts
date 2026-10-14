import { t } from "@/i18n";

// Route titles come from static `metadata` (English, fixed at build time).
// Each " - " separated part is translated on the client when it is known.
const titleKeys = {
  "NetBird Dashboard": "titles:netbirdDashboard",
  Installation: "titles:installation",
  "Accept Invite": "titles:acceptInvite",
  "Instance Setup": "titles:instanceSetup",
  Servers: "titles:servers",
  Peers: "titles:peers",
  "User Devices": "titles:userDevices",
  Group: "titles:group",
  User: "titles:user",
  Team: "titles:team",
  "Service Users": "titles:serviceUsers",
  Users: "titles:users",
  Groups: "titles:groups",
  Settings: "titles:settings",
  Peer: "titles:peer",
  Nameservers: "titles:nameservers",
  DNS: "titles:dns",
  Zones: "titles:zones",
  "Setup Keys": "titles:setupKeys",
  "Access Control": "titles:accessControl",
  Networks: "titles:networks",
  "Network Routes": "titles:networkRoutes",
  "Activity Events": "titles:activityEvents",
  Network: "titles:network",
  "Posture Checks": "titles:postureChecks",
  "Audit Events": "titles:auditEvents",
  "Traffic Events": "titles:trafficEvents",
  Activity: "titles:activity",
  "Control Center": "titles:controlCenter",
  Integrations: "titles:integrations",
} as const;

export function translateTitle(title: string): string {
  return title
    .split(" - ")
    .map((part) =>
      part in titleKeys
        ? String(t(titleKeys[part as keyof typeof titleKeys]))
        : part,
    )
    .join(" - ");
}

/** Keeps document.title translated while Next.js updates it on navigation. */
export function watchDocumentTitle(): () => void {
  const apply = () => {
    const next = translateTitle(document.title);
    if (next !== document.title) document.title = next;
  };
  apply();
  const observer = new MutationObserver(apply);
  observer.observe(document.head, {
    subtree: true,
    childList: true,
    characterData: true,
  });
  return () => observer.disconnect();
}
