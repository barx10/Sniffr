import { describe, it, expect } from 'vitest'
import { extractUrls, extractPhoneNumbers, containsCryptoMention } from '@/lib/extractors'

describe('extractUrls', () => {
  it('finds http and https URLs', () =>
    expect(extractUrls('Visit https://evil.com or http://bad.net')).toEqual(['https://evil.com', 'http://bad.net']))
  it('returns empty for no URLs', () => expect(extractUrls('Hello')).toEqual([]))
})

describe('extractPhoneNumbers', () => {
  it('finds international numbers', () => expect(extractPhoneNumbers('Call +4712345678')).toHaveLength(1))
  it('returns empty', () => expect(extractPhoneNumbers('No numbers')).toHaveLength(0))
})

describe('containsCryptoMention', () => {
  it('detects Bitcoin', () => expect(containsCryptoMention('Send Bitcoin now')).toBe(true))
  it('detects gift card', () => expect(containsCryptoMention('Buy iTunes gift card')).toBe(true))
  it('returns false for clean text', () => expect(containsCryptoMention('Please see attached')).toBe(false))
})
