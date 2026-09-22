import { redirect } from 'next/navigation';

export default async function RegulationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/regulations/${id}/requirements`);
}
