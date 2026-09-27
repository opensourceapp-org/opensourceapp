import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export async function writeAuditLog(params: {
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata,
    },
  });
}
