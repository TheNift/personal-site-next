import { headers } from 'next/headers';
import { checkIsPersonal } from '@/utils/host';

export async function getIsPersonalServer() {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  return checkIsPersonal(host);
}
