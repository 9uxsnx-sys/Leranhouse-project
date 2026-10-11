export interface MailProvider {
  name: string
  url: string
}

const PROVIDERS: { domains: string[]; provider: MailProvider }[] = [
  {
    domains: ['gmail.com', 'googlemail.com'],
    provider: { name: 'Gmail', url: 'https://mail.google.com' },
  },
  {
    domains: ['outlook.com', 'hotmail.com', 'live.com', 'msn.com'],
    provider: { name: 'Outlook', url: 'https://outlook.live.com/mail' },
  },
  {
    domains: ['yahoo.com', 'ymail.com', 'rocketmail.com'],
    provider: { name: 'Yahoo Mail', url: 'https://mail.yahoo.com' },
  },
  {
    domains: ['icloud.com', 'me.com', 'mac.com'],
    provider: { name: 'iCloud Mail', url: 'https://www.icloud.com/mail' },
  },
  {
    domains: ['proton.me', 'protonmail.com', 'pm.me'],
    provider: { name: 'Proton Mail', url: 'https://mail.proton.me' },
  },
  {
    domains: ['zoho.com'],
    provider: { name: 'Zoho Mail', url: 'https://mail.zoho.com' },
  },
  {
    domains: ['aol.com'],
    provider: { name: 'AOL Mail', url: 'https://mail.aol.com' },
  },
  {
    domains: ['yandex.ru', 'yandex.com', 'ya.ru'],
    provider: { name: 'Yandex Mail', url: 'https://mail.yandex.com' },
  },
  {
    domains: ['gmx.com', 'gmx.de', 'gmx.net'],
    provider: { name: 'GMX', url: 'https://www.gmx.com' },
  },
  {
    domains: ['mail.ru', 'inbox.ru', 'bk.ru', 'list.ru'],
    provider: { name: 'Mail.ru', url: 'https://e.mail.ru' },
  },
  {
    domains: ['qq.com'],
    provider: { name: 'QQ Mail', url: 'https://mail.qq.com' },
  },
  {
    domains: ['163.com'],
    provider: { name: '163 Mail', url: 'https://mail.163.com' },
  },
  {
    domains: ['126.com'],
    provider: { name: '126 Mail', url: 'https://mail.126.com' },
  },
  {
    domains: ['naver.com'],
    provider: { name: 'Naver Mail', url: 'https://mail.naver.com' },
  },
]

/**
 * Resolves the public webmail login URL for a given email address.
 * Returns null for unknown / corporate domains so callers can
 * simply hide the "open inbox" affordance.
 */
export function getMailProvider(email: string): MailProvider | null {
  const domain = email.split('@')[1]?.trim().toLowerCase()
  if (!domain) return null
  return PROVIDERS.find((entry) => entry.domains.includes(domain))?.provider ?? null
}
