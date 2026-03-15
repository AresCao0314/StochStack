import { redirect } from 'next/navigation';

export default function NextGenSiteFeasibilityIndex({
  params
}: {
  params: { locale: string };
}) {
  redirect(`/${params.locale}/ventures/next-gen-site-feasibility/dashboard`);
}

