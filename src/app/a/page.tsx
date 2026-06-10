import { redirect } from 'next/navigation';

export default async function AIndexPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  const resolvedSearchParams = await searchParams;
  const id = resolvedSearchParams?.id;
  
  if (id && typeof id === 'string') {
    redirect(`/a/${id}`);
  }
  
  // Si no hay ID, redirigir al inicio o a una página de error
  redirect('/');
}
