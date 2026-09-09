import { getApiKeys } from '@/lib/api';
import { ApiKeysList } from '@/components/settings/api-keys-list';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'API Keys | Regulation Compiler',
};

export default async function ApiKeysPage() {
  const keysData = await getApiKeys().catch(() => ({ data: [] }));
  const keys = keysData?.data || (Array.isArray(keysData) ? keysData : []);

  return (
    <div className="flex flex-col w-full w-full mx-auto">
      <ApiKeysList initialKeys={keys} />
    </div>
  );
}
