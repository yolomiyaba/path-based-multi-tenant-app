import { redirect } from "next/navigation";

interface TenantPageProps {
    params: Promise<{
        tenantId: string;
    }>;
}

export default async function TenantPage({ params }: TenantPageProps) {
    const { tenantId } = await params;
    redirect(`/${tenantId}/dashboard`);
}

