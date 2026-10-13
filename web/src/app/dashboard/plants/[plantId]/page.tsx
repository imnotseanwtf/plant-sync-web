import { redirect } from 'next/navigation';

// Filament had no read-only plant page; the edit page holds the widgets.
export default async function PlantPage({ params }: { params: Promise<{ plantId: string }> }) {
  const { plantId } = await params;
  redirect(`/dashboard/plants/${encodeURIComponent(plantId)}/edit`);
}
