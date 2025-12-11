import { Camera, Image as ImageIcon, Info, CheckCircle2 } from 'lucide-react'

export function ShopDocumentation() {
    return (
        <div className="space-y-6 max-w-4xl">
            {/* Intro Header */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-400/10 flex items-center justify-center flex-shrink-0">
                        <Camera className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white mb-2">Fotografie Richtlijnen Reconnect Academy</h2>
                        <p className="text-neutral-400">
                            Een complete gids voor het aanleveren van authentieke foto's voor de webshop en website.
                            Goede beelden zijn essentieel voor de uitstraling van je gym.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - Left Column */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Logo Section */}
                    <Section title="1. Logo & Branding" icon={ImageIcon}>
                        <div className="space-y-4">
                            <Requirement
                                label="Logo"
                                size="512 x 512px"
                                format="PNG (Transparant)"
                                description="Wordt gebruikt in de header, footer en op diverse andere plekken."
                            />
                        </div>
                    </Section>

                    {/* Hero Section */}
                    <Section title="2. Hero Banners (Grote sfeerbeelden)" icon={ImageIcon}>
                        <div className="space-y-4">
                            <Requirement
                                label="Homepage Hero"
                                size="1920 x 1080px (16:9)"
                                format="JPG"
                                description="De eerste indruk op de homepage. Zorg voor een energieke, welkome sfeer."
                            />
                            <Requirement
                                label="Call-to-Action Achtergrond"
                                size="1920 x 800px"
                                format="JPG"
                                description="Brede banner voor onderaan de pagina. Mag iets dramatischer of motiverender zijn."
                            />
                        </div>
                    </Section>

                    {/* Disciplines Section */}
                    <Section title="3. Disciplines" icon={ImageIcon}>
                        <p className="text-sm text-neutral-400 mb-4">
                            Voor elke discipline (MMA, Muay Thai, BJJ, Grappling, Wrestling, Boksen) hebben we twee varianten nodig:
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="bg-neutral-900/50 rounded-lg p-4 border border-white/5">
                                <h4 className="text-white font-medium mb-2">Detailpagina Header</h4>
                                <p className="text-xs text-neutral-400 mb-2">Bovenkant van de les-pagina</p>
                                <code className="text-amber-400 text-sm">1920 x 1080px</code>
                            </div>
                            <div className="bg-neutral-900/50 rounded-lg p-4 border border-white/5">
                                <h4 className="text-white font-medium mb-2">Overzichtskaart</h4>
                                <p className="text-xs text-neutral-400 mb-2">In het lessenrooster overzicht</p>
                                <code className="text-amber-400 text-sm">1600 x 1200px</code>
                            </div>
                        </div>
                    </Section>

                    {/* Coaches Section */}
                    <Section title="4. Coach Portretten" icon={ImageIcon}>
                        <div className="space-y-4">
                            <Requirement
                                label="Profielfoto's"
                                size="600 x 600px (Vierkant)"
                                format="JPG"
                                description="Professionele headshots voor Mehdi, Jason, Robby, Snoussi, Ali en Osama. Zorg voor een rustige achtergrond en goede belichting."
                            />
                        </div>
                    </Section>

                    {/* Other Sections */}
                    <Section title="5. Overige Secties" icon={ImageIcon}>
                        <div className="space-y-4">
                            <Requirement
                                label="Beginners Programma"
                                size="700 x 500px"
                                format="JPG"
                                description="Foto voor de beginners info blokken."
                            />
                            <Requirement
                                label="Beginners Landing Pagina"
                                size="800 x 500px"
                                format="JPG"
                                description="Sfeerbeeld specifiek voor de starters pagina."
                            />
                        </div>
                    </Section>

                </div>

                {/* Sidebar - Right Column */}
                <div className="space-y-6">

                    {/* Photography Tips */}
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-amber-300 mb-4 flex items-center gap-2">
                            <Camera className="w-5 h-5" />
                            Fotografie Tips
                        </h3>
                        <ul className="space-y-4">
                            <Tip
                                title="Actiefoto's"
                                text="Gebruik goed licht (daglicht of felle gym verlichting). Zorg voor dynamische shots waarin techniek goed zichtbaar is."
                            />
                            <Tip
                                title="Portretten"
                                text="Zorg voor een benaderbare uitstraling. Gymkledij is prima, maar zorg dat het er professioneel uitziet."
                            />
                            <Tip
                                title="Authenticiteit"
                                text="Gebruik echte leden en coaches. Dat schept vertrouwen bij nieuwe bezoekers."
                            />
                        </ul>
                    </div>

                    {/* Process Steps */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                            Stappenplan
                        </h3>
                        <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-[15px] before:w-0.5 before:bg-white/10">
                            <Step number="1" text="Verzamel al je foto's in hoge resolutie." />
                            <Step number="2" text="Selecteer de beste shots voor elke categorie." />
                            <Step number="3" text="Benoem de bestanden duidelijk (bv. coach-mehdi.jpg)." />
                            <Step number="4" text="Bezorg de bestanden aan je developer of upload ze op de daarvoor bestemde plek." />
                        </div>
                    </div>

                    {/* Help Box */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-blue-300 mb-2 flex items-center gap-2">
                            <Info className="w-5 h-5" />
                            Hulp nodig?
                        </h3>
                        <p className="text-sm text-blue-200/80">
                            Heb je vragen over het formaat of de kwaliteit? Neem contact op met support voordat je de foto's laat maken.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    )
}

function Section({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-neutral-400" />
                </div>
                {title}
            </h3>
            {children}
        </div>
    )
}

function Requirement({ label, size, format, description }: { label: string, size: string, format: string, description: string }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-xl bg-neutral-900/50 border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex-1">
                <h4 className="text-white font-medium mb-1">{label}</h4>
                <p className="text-sm text-neutral-400 leading-relaxed mb-2">{description}</p>
                <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 rounded-md bg-neutral-800 text-xs text-neutral-300 font-mono border border-white/5">
                        {size}
                    </span>
                    <span className="px-2 py-1 rounded-md bg-neutral-800 text-xs text-neutral-300 font-mono border border-white/5">
                        {format}
                    </span>
                </div>
            </div>
        </div>
    )
}

function Tip({ title, text }: { title: string, text: string }) {
    return (
        <li className="flex gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
            <div>
                <strong className="block text-amber-200 text-sm font-medium mb-0.5">{title}</strong>
                <span className="text-sm text-amber-100/70">{text}</span>
            </div>
        </li>
    )
}

function Step({ number, text }: { number: string, text: string }) {
    return (
        <div className="relative pl-10">
            <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-neutral-800 border-2 border-neutral-900 flex items-center justify-center text-sm font-bold text-white z-10 shadow-lg">
                {number}
            </div>
            <p className="text-sm text-neutral-300 pt-1.5">{text}</p>
        </div>
    )
}
