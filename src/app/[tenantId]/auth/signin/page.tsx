import { redirect } from "next/navigation";

interface SignInPageProps {
  params: Promise<{
    tenantId: string;
  }>;
  searchParams: Promise<{
    callbackUrl?: string;
  }>;
}

/**
 * テナント固有のサインインページ
 * グローバル認証に一本化したため、/auth/signin へリダイレクト
 */
export default async function SignInPage({ params, searchParams }: SignInPageProps) {
  const { tenantId } = await params;
  const { callbackUrl } = await searchParams;

  // callbackUrl がない場合はテナントのルートをデフォルトに
  const redirectUrl = callbackUrl || `/${tenantId}/dashboard`;

  redirect(`/auth/signin?callbackUrl=${encodeURIComponent(redirectUrl)}`);
}
