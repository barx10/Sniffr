import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SettingsModal } from '@/components/settings/SettingsModal'
import { EmailMode } from '@/components/modes/EmailMode'
import { ImageMode } from '@/components/modes/ImageMode'
import { NameMode } from '@/components/modes/NameMode'

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">🐾 Scam Sniffr</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Analyser mistenkelige e-poster, bilder og avsendere</p>
          </div>
          <SettingsModal />
        </div>
        <Tabs defaultValue="email">
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="email">📧 E-post</TabsTrigger>
            <TabsTrigger value="image">🖼️ Bilde / QR</TabsTrigger>
            <TabsTrigger value="name">🔍 Navn</TabsTrigger>
          </TabsList>
          <TabsContent value="email"><EmailMode /></TabsContent>
          <TabsContent value="image"><ImageMode /></TabsContent>
          <TabsContent value="name"><NameMode /></TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
