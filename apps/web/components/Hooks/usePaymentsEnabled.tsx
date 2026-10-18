// hooks/usePaymentsEnabled.ts
import { useOrg } from '@components/Contexts/OrgContext';
import { useLHSession } from '@components/Contexts/LHSessionContext';
import useSWR from 'swr';
import { getPaymentConfigs } from '@services/payments/payments';

export function usePaymentsEnabled() {
  const org = useOrg() as any;
  const session = useLHSession() as any;
  const access_token = session?.data?.tokens?.access_token;

  const { data: paymentConfigs, error, isLoading } = useSWR(
    org && access_token ? [`/payments/${org.id}/config`, access_token] : null,
    ([url, token]) => getPaymentConfigs(org.id, token),
    // The config endpoint does not exist in this build; stop SWR from retrying
    // the 404 forever, which made the payments tabs flash between states.
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  // True if any payment provider is active — not tied to a specific provider
  const isAnyProviderActive = paymentConfigs?.some((config: any) => config.active);

  return {
    isEnabled: !!isAnyProviderActive,
    isLoading,
    error
  };
}