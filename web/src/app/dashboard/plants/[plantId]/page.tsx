import { redirect } from 'next/navigation';

// The plant's page is its edit page (stats, charts, form and readings together).
export default async function PlantPage({ params }: { params: Promise<{ plantId: string }> }) {
  const { plantId } = await params;
  redirect(`/dashboard/plants/${encodeURIComponent(plantId)}/edit`);
}
