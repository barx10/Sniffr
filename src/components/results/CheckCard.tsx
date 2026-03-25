'use client'
import { useState } from 'react'
import type { CheckResult } from '@/lib/types'
import { CheckCircle2, AlertTriangle, XCircle, MinusCircle, ChevronDown, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const HELP: Record<string, string> = {
  'safe-browsing':  'Googles Safe Browsing API sjekker alle URLer i meldingen mot en database over kjente phishing-sider, skadevare og andre nettrusler. En treff betyr at lenken aktivt brukes i angrep.',
  'domain-age':     'Nye domener (under 6 måneder) brukes ofte til svindel fordi de er billige å registrere og lett å bytte. Scammere forlater domenet etter kort tid. Et etablert domene er et godt tegn.',
  'emailrep':       'EmailRep.io sjekker avsenderens e-postadresse mot svindeldatabaser og vurderer omdømmet basert på aktivitetshistorikk, rapporteringer og om adressen er knyttet til kjente tjenester.',
  'lookalike':      'Phishing-avsendere registrerer domener som ligner kjente merkevarer — f.eks. paypa1.com eller micros0ft.com. Denne sjekken oppdager slike typosquatting-domener i meldingen.',
  'crypto-flag':    'Legitime avsendere ber aldri om betaling via kryptovaluta eller gavekort. Forespørsler om dette er blant de sterkeste enkeltindikatorene for svindel — umulig å reversere og vanskelig å spore.',
  'phone-numbers':  'Telefonnumre i meldingen kan brukes til vishing (telefon-phishing). Scammere ber deg ringe dem for å flytte kommunikasjonen vekk fra sporbare kanaler.',
  'headers':        'SPF, DKIM og DMARC er tekniske standarder for e-postautentisering. Feil i disse betyr at e-posten kan være forfalsket — sendt av noen som utgir seg for å være avsenderen.',
  'ai-analysis':    'En stor språkmodell analyserer tone, hastverk, usannsynlige løfter, grammatikk og andre mønstre typiske for svindelmeldinger — basert på alle de andre sjekkene samlet.',
  'reverse-image':  'Bing søker etter dette bildet på tvers av millioner av nettsider. Hvis bildet dukker opp på mange ulike profiler eller steder, er det sannsynligvis et stjålet profilbilde.',
  'qr-url-safety':  'URLen skjult bak QR-koden sjekkes mot Googles Safe Browsing for kjente phishing- eller skadevaresider. QR-koder brukes av scammere nettopp fordi lenken er usynlig for avsløring.',
}

const S = {
  pass:  { Icon: CheckCircle2, iconCls: 'text-emerald-500', strip: 'bg-emerald-500/50', label: 'OK',       labelCls: 'text-emerald-400' },
  warn:  { Icon: AlertTriangle, iconCls: 'text-amber-500',  strip: 'bg-amber-500/60',   label: 'Advarsel', labelCls: 'text-amber-400'   },
  fail:  { Icon: XCircle,       iconCls: 'text-red-500',    strip: 'bg-red-500/70',     label: 'Feil',     labelCls: 'text-red-400'     },
  error: { Icon: MinusCircle,   iconCls: 'text-zinc-500',   strip: 'bg-zinc-600/40',    label: 'Feil',     labelCls: 'text-zinc-500'    },
}

export function CheckCard({ check, index }: { check: CheckResult; index: number }) {
  const [open, setOpen] = useState(false)
  const { Icon, iconCls, strip, label, labelCls } = S[check.status]
  const helpText = HELP[check.id]

  return (
    <div
      className={cn(
        'rounded-lg bg-white/[0.025] border border-white/[0.06] animate-fade-in-up overflow-hidden',
        helpText && 'cursor-pointer select-none'
      )}
      style={{ animationDelay: `${index * 45}ms` }}
      onClick={() => helpText && setOpen(v => !v)}
    >
      <div className="flex items-start gap-3 py-3 px-3">
        <div className={cn('w-0.5 min-h-[1.75rem] rounded-full self-stretch flex-shrink-0', strip)} />
        <Icon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', iconCls)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold">{check.label}</span>
              {helpText && (
                <HelpCircle className={cn(
                  'w-3 h-3 text-muted-foreground/50 transition-colors',
                  open && 'text-amber-500/70'
                )} />
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={cn('text-xs font-bold tracking-[0.08em] uppercase', labelCls)}>
                {label}
              </span>
              {helpText && (
                <ChevronDown className={cn(
                  'w-3.5 h-3.5 text-muted-foreground/40 transition-transform duration-200',
                  open && 'rotate-180'
                )} />
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{check.detail}</p>
        </div>
      </div>

      {helpText && open && (
        <div className="px-3 pb-3 pl-[calc(0.75rem+0.125rem+1rem+0.75rem)]">
          <div className="text-xs text-muted-foreground leading-relaxed bg-white/[0.04] border border-white/[0.07] rounded-md px-3 py-2.5">
            {helpText}
          </div>
        </div>
      )}
    </div>
  )
}
