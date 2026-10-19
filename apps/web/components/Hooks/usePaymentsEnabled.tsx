// hooks/usePaymentsEnabled.ts
import { useOrg } from '@components/Contexts/OrgContext';
import { useLHSession } from '@components/Contexts/LHSessionContext';
import useSWR from 'swr';
import { getPaymentConfigs } from '@services/payments/payments';

export function usePaymentsEnabled() {
  const org = useOrg() as any;
  const session = useLHSession() as any;
  const access_token = session?.data?.tokens?.access_token;

  const { data: paymentConfig, error, isLoading } = useSWR(
    org && access_token ? [`/payments/${org.id}/config`, access_token] : null,
    ([url, token]) => getPaymentConfigs(org.id, token),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  // True when the org has Chargily credentials stored and enabled.
  const isAnyProviderActive = !!paymentConfig?.active;

  return {
    isEnabled: isAnyProviderActive,
    isLoading,
    error
  };
}