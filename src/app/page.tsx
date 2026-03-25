import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SettingsModal } from '@/components/settings/SettingsModal'
import { EmailMode } from '@/components/modes/EmailMode'
import { ImageMode } from '@/components/modes/ImageMode'
import { NameMode } from '@/components/modes/NameMode'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Top accent line */}
      <div className="fixed top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent z-50" />

      <div className="max-w-2xl mx-auto px-5 pt-10 pb-20">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="relative w-7 h-7 flex-shrink-0">
                <div className="absolute inset-0 bg-amber-500/20 border border-amber-500/40"
                  style={{ transform: 'rotate(45deg)', borderRadius: '3px' }} />
                <div className="absolute inset-1.5 bg-amber-500"
                  style={{ transform: 'rotate(45deg)', borderRadius: '2px' }} />
              </div>
              <h1 className="font-display text-2xl font-extrabold tracking-[0.08em] uppercase">
                Sniffr
              </h1>
            </div>
            <p className="text-sm text-muted-foreground pl-10">
              Analyser mistenkelige meldinger, bilder og avsendere
            </p>
          </div>
          <SettingsModal />
        </div>

        {/* Main card */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Tabs defaultValue="email" className="w-full">
            <div className="border-b border-border px-1">
              <TabsList className="h-auto bg-transparent gap-0 p-0 rounded-none w-full justify-start">
                {[
                  { value: 'email', label: 'Melding' },
                  { value: 'image', label: 'Bilde / QR' },
                  { value: 'name',  label: 'Avsender' },
                ].map(({ value, label }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:text-amber-400 data-[state=active]:bg-transparent bg-transparent text-muted-foreground hover:text-foreground transition-colors px-5 py-4 text-xs font-semibold tracking-[0.08em] uppercase"
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="email" className="mt-0"><EmailMode /></TabsContent>
              <TabsContent value="image" className="mt-0"><ImageMode /></TabsContent>
              <TabsContent value="name"  className="mt-0"><NameMode /></TabsContent>
            </div>
          </Tabs>
        </div>

        <p className="text-center text-xs text-muted-foreground/50 mt-8">
          API-nøkler lagres lokalt i nettleseren — aldri server-side
        </p>
      </div>
    </main>
  )
}
