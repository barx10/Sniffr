import { describe, it, expect } from 'vitest'
import { parseEmailHeaders } from '@/lib/checks/headers'

const PASS_HDR = `Authentication-Results: mx.google.com;
  spf=pass dkim=pass dmarc=pass
Received: from mail.legit.com (mail.legit.com [203.0.113.5])`

const FAIL_HDR = `Authentication-Results: mx.google.com;
  spf=fail dkim=none dmarc=fail
Received: from unknown (EHLO bad) (185.220.101.42)`

describe('parseEmailHeaders', () => {
  it('detects spf pass', () => expect(parseEmailHeaders(PASS_HDR).spf).toBe('pass'))
  it('detects dkim pass', () => expect(parseEmailHeaders(PASS_HDR).dkim).toBe('pass'))
  it('detects dmarc pass', () => expect(parseEmailHeaders(PASS_HDR).dmarc).toBe('pass'))
  it('detects spf fail', () => expect(parseEmailHeaders(FAIL_HDR).spf).toBe('fail'))
  it('detects dkim none', () => expect(parseEmailHeaders(FAIL_HDR).dkim).toBe('none'))
  it('extracts IP', () => expect(parseEmailHeaders(FAIL_HDR).originatingIp).toBe('185.220.101.42'))
  it('returns nulls for empty', () => {
    const r = parseEmailHeaders('From: x@y.com')
    expect(r.spf).toBeNull()
    expect(r.originatingIp).toBeNull()
  })
})
