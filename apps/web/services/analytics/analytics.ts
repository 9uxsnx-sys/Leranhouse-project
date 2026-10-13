import { getAPIUrl } from '@services/config/config'

// lgtm[js/hardcoded-credentials] -- not a secret, just a sessionStorage key name
const SESSION_KEY = 'lh_analytics_session_id'
// Persisted (not per-tab) so "new vs returning" works across visits.
const VISITOR_KEY = 'lh_analytics_visitor_id'

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}

function getVisitorId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let id = window.localStorage.getItem(VISITOR_KEY)
    if (!id) {
      id = crypto.randomUUID()
      window.localStorage.setItem(VISITOR_KEY, id)
    }
    return id
  } catch {
    // localStorage can be blocked (private mode, cookies off) — fall back to empty.
    return ''
  }
}

export async function trackEvent(
  eventName: string,
  orgId: number,
  properties: Record<string, unknown>,
  accessToken: string
): Promise<void> {
  try {
    const url = `${getAPIUrl()}analytics/events`
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        event_name: eventName,
        org_id: orgId,
        session_id: getSessionId(),
        visitor_id: getVisitorId(),
        properties,
      }),
      keepalive: true,
    })
  } catch {
    // Silently swallow — analytics should never break the app
  }
}
