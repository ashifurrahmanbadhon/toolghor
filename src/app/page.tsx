import { getPublicSiteData } from '@/lib/siteData';
import HomeClient from './HomeClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page() {
  const initialData = await getPublicSiteData();

  // Safely inject initial creator & API config for window globals
  const creatorConfigScript = initialData?.creatorAbout
    ? `window.CREATOR_CONFIG = ${JSON.stringify(initialData.creatorAbout)};`
    : '';

  return (
    <>
      {creatorConfigScript && (
        <script
          dangerouslySetInnerHTML={{
            __html: creatorConfigScript,
          }}
        />
      )}
      <HomeClient initialData={initialData} />
    </>
  );
}
