"use client";

import { useTenantSession } from "@/hooks/useTenantSession";
import { useParams } from "next/navigation";
import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

export function HeaderAuth() {
  const params = useParams();
  const tenantId = params?.tenantId as string;
  const { data: session, status } = useTenantSession();

  if (status === "loading") {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return (
      <Link
        href={`/${tenantId}/auth/signin`}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
      >
        サインイン
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-700 dark:text-gray-300">
        {session.user.email || session.user.name}
      </span>
      <LogoutButton />
    </div>
  );
}

