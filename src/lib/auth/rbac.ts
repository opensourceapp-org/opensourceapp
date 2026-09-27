import { UserRole } from "@/generated/prisma";

const roleRank: Record<UserRole, number> = {
  USER: 0,
  MODERATOR: 1,
  ADMIN: 2,
};

export function hasMinimumRole(
  userRole: UserRole,
  required: UserRole,
): boolean {
  return roleRank[userRole] >= roleRank[required];
}

export function isModerator(role: UserRole): boolean {
  return hasMinimumRole(role, UserRole.MODERATOR);
}
