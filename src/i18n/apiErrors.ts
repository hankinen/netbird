import { t } from "@/i18n";

/**
 * Maps English error messages of the management API (status.Errorf in
 * netbirdio/netbird management) to translated text. The first match wins, so
 * specific patterns come before generic ones. With keep: true the original
 * server text is appended, because it carries details (names, IDs).
 * Unknown messages are returned unchanged.
 */
const patterns = [
  {
    match: /^token expired$/i,
    key: "common:apiError.tokenExpired",
    keep: false,
  },
  {
    match: /^token invalid$/i,
    key: "common:apiError.tokenInvalid",
    keep: false,
  },
  {
    match: /^no valid authentication provided$/i,
    key: "common:apiError.noAuth",
    keep: false,
  },
  {
    match: /^internal server error$/i,
    key: "common:apiError.internal",
    keep: false,
  },
  {
    match: /^user pending approval cannot add peers$/i,
    key: "common:apiError.userPendingApprovalPeers",
    keep: false,
  },
  {
    match: /pending approval/i,
    key: "common:apiError.pendingApproval",
    keep: false,
  },
  {
    match: /^group has been linked to/i,
    key: "common:apiError.groupLinked",
    keep: true,
  },
  {
    match: /^peer is linked to a network router/i,
    key: "common:apiError.peerLinkedRouter",
    keep: true,
  },
  {
    match:
      /^posture checks have been linked to policy|^posture check exists and is linked/i,
    key: "common:apiError.postureLinked",
    keep: true,
  },
  {
    match: /^updating group ALL is not allowed$/i,
    key: "common:apiError.groupAllReadOnly",
    keep: false,
  },
  {
    match:
      /^group name shouldn't be empty$|^name can't be empty$|^name is required$|^token name can't be empty$/i,
    key: "common:apiError.nameRequired",
    keep: false,
  },
  {
    match: /^unable to block owner user$/i,
    key: "common:apiError.blockOwner",
    keep: false,
  },
  {
    match: /^self deletion is not allowed$/i,
    key: "common:apiError.selfDeletion",
    keep: false,
  },
  {
    match: /^only owners can (add|remove) owner role/i,
    key: "common:apiError.ownerRoleOnly",
    keep: false,
  },
  {
    match: /^only admins and owners can update users$/i,
    key: "common:apiError.adminsOnlyUsers",
    keep: false,
  },
  {
    match: /^user is not allowed to delete account/i,
    key: "common:apiError.ownerOnlyDeleteAccount",
    keep: false,
  },
  {
    match:
      /^user with this email already exists$|^can't invite a user with an existing NetBird account$/i,
    key: "common:apiError.userExists",
    keep: false,
  },
  {
    match: /^invite already exists for this email$/i,
    key: "common:apiError.inviteExists",
    keep: false,
  },
  {
    match: /^invite has expired$/i,
    key: "common:apiError.inviteExpired",
    keep: false,
  },
  {
    match: /^invite expiration must be at least 1 hour$/i,
    key: "common:apiError.inviteExpiration",
    keep: false,
  },
  {
    match: /^invalid email format$/i,
    key: "common:apiError.invalidEmail",
    keep: false,
  },
  {
    match: /^password must be at least 8 characters/i,
    key: "common:apiError.passwordLength",
    keep: false,
  },
  {
    match: /^password must be at most 72 characters$/i,
    key: "common:apiError.passwordMax",
    keep: false,
  },
  {
    match: /^password must contain at least one uppercase letter$/i,
    key: "common:apiError.passwordUpper",
    keep: false,
  },
  {
    match: /^password must contain at least one digit$/i,
    key: "common:apiError.passwordDigit",
    keep: false,
  },
  {
    match: /^password must contain at least one special character$/i,
    key: "common:apiError.passwordSpecial",
    keep: false,
  },
  {
    match: /^old password is required$/i,
    key: "common:apiError.oldPasswordRequired",
    keep: false,
  },
  {
    match: /^setup already completed$/i,
    key: "common:apiError.setupCompleted",
    keep: false,
  },
  {
    match: /^local user creation is disabled/i,
    key: "common:apiError.localUsersDisabled",
    keep: false,
  },
  {
    match: /^peer login expiration can't be smaller than one hour$/i,
    key: "common:apiError.expirationMin",
    keep: false,
  },
  {
    match: /^peer login expiration can't be larger than 180 days$/i,
    key: "common:apiError.expirationMax",
    keep: false,
  },
  {
    match: /^this peer hasn't been added with the SSO login/i,
    key: "common:apiError.notSsoPeer",
    keep: false,
  },
  {
    match: /^non-linux peers are not supported as network routes$/i,
    key: "common:apiError.nonLinuxRoute",
    keep: false,
  },
  {
    match: /^peer with hostname .* is already registered$/i,
    key: "common:apiError.hostnameTaken",
    keep: true,
  },
  {
    match: /^peer already has pending job$/i,
    key: "common:apiError.pendingJob",
    keep: false,
  },
  {
    match: /^valid port value is in 1\.\.65535 range$/i,
    key: "common:apiError.portRange",
    keep: false,
  },
  {
    match: /^geo location database is not initialized/i,
    key: "common:apiError.geoDb",
    keep: false,
  },
  {
    match: /^invite links are only available with embedded identity provider$/i,
    key: "common:apiError.inviteEmbeddedOnly",
    keep: false,
  },
  {
    match:
      /^password change is only available with embedded identity provider$/i,
    key: "common:apiError.passwordEmbeddedOnly",
    keep: false,
  },
  {
    match: /^token is in use$/i,
    key: "common:apiError.tokenInUse",
    keep: false,
  },
  {
    match: /permission denied|not allowed|forbidden/i,
    key: "common:apiError.permissionDenied",
    keep: true,
  },
  {
    match: /already exists?/i,
    key: "common:apiError.alreadyExists",
    keep: true,
  },
  { match: /not found/i, key: "common:apiError.notFound", keep: true },
  {
    match: /^failed to fetch$|network ?error/i,
    key: "common:apiError.network",
    keep: false,
  },
  {
    match: /^something went wrong/i,
    key: "common:apiError.unknown",
    keep: false,
  },
] as const;

export function translateApiError(message?: string): string | undefined {
  if (!message) return message;
  const text = message.trim();
  const hit = patterns.find((p) => p.match.test(text));
  if (!hit) return message;
  const translated = String(t(hit.key));
  return hit.keep ? `${translated} (${message})` : translated;
}
