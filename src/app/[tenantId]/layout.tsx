import { ReactNode } from "react";

interface TenantLayoutProps {
    children: ReactNode;
    params: Promise<{
        tenantId: string;
    }>;
}

export default async function TenantLayout({
    children,
    params,
}: TenantLayoutProps) {
    const { tenantId } = await params;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            テナント: {tenantId}
                        </h1>
                    </div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}

