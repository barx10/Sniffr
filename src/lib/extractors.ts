export function extractUrls(text: string): string[] {
  return [...text.matchAll(/https?:\/\/[^\s<>"{}|\\^`[\]]+/gi)].map(m => m[0])
}

export function extractPhoneNumbers(text: string): string[] {
  return (text.match(/\+?[\d\s\-().]{7,20}\d/g) ?? [])
    .filter(m => { const d = m.replace(/\D/g,''); return d.length >= 7 && d.length <= 15 })
}

const CRYPTO_KW = ['bitcoin','btc','ethereum','eth','crypto','usdt','tether',
  'itunes gift card','google play card','amazon gift card','gift card','prepaid card']

export function containsCryptoMention(text: string): boolean {
  const t = text.toLowerCase()
  return CRYPTO_KW.some(k => t.includes(k))
}
