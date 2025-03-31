import { Suspense } from 'react';
import InventoryDetailClient from './InventoryDetailClient';

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

interface Props {
  params: Params;
  searchParams: SearchParams;
}

export default async function Page({ params }: Props) {
  const { id } = await params;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InventoryDetailClient id={id} />
    </Suspense>
  );
} 