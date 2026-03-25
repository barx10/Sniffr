import { describe, it, expect } from 'vitest'
import { detectLookalikeDomains, extractDomains } from '@/lib/checks/lookalike'

describe('extractDomains', () => {
  it('extracts from URLs', () => {
    expect(extractDomains('https://paypa1.com/login')).toEqual(['paypa1.com'])
  })
  it('extracts from email addresses', () => {
    expect(extractDomains('no-reply@netflix-billing.io')).toEqual(['netflix-billing.io'])
  })
  it('returns empty for plain text', () => {
    expect(extractDomains('Hello world')).toEqual([])
  })
})

describe('detectLookalikeDomains', () => {
  it('flags numeric substitution', () => expect(detectLookalikeDomains(['paypa1.com'])).toHaveLength(1))
  it('flags hyphenated brand', () => expect(detectLookalikeDomains(['netflix-billing.com'])).toHaveLength(1))
  it('passes legitimate domains', () => expect(detectLookalikeDomains(['google.com'])).toHaveLength(0))
  it('passes paypal itself', () => expect(detectLookalikeDomains(['paypal.com'])).toHaveLength(0))
})
