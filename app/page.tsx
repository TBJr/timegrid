import { HomePage } from "@/components/HomePage";
import { parseSharedStateFromParams, parseShareModeFromParams } from "@/lib/share-state";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const protectedParam = params.protected;
  const initialProtectedPayload = Array.isArray(protectedParam) ? protectedParam[0] : protectedParam;
  const initialUrlState = initialProtectedPayload ? {} : parseSharedStateFromParams(params);
  const initialShareMode = parseShareModeFromParams(params);
  return <HomePage initialUrlState={initialUrlState} initialShareMode={initialShareMode} initialProtectedPayload={initialProtectedPayload} />;
}
