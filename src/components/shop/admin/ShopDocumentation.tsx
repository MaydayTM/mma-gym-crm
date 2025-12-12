import { Camera, Image as ImageIcon, Info, CheckCircle2, ShoppingBag, Globe, Video, Box, Palette, FileType } from 'lucide-react'
import { useState } from 'react'

export function ShopDocumentation() {
    const [activeTab, setActiveTab] = useState<'shop' | 'website'>('shop')

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Intro Header */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-400/10 flex items-center justify-center flex-shrink-0">
                        <Camera className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white mb-2">Fotografie & Media Richtlijnen</h2>
                        <p className="text-neutral-400">
                            Een complete gids voor het aanleveren van content voor de Reconnect Academy.
                            Kies hieronder voor welke omgeving je richtlijnen zoekt.
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-neutral-900/50 border border-white/5 rounded-xl">
                <button
                    onClick={() => setActiveTab('shop')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'shop'
                        ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                        : "text-neutral-400 hover:text-white hover:bg-white/5"
                        }`}
                >
                    <ShoppingBag className="w-4 h-4" />
                    Webshop
                </button>
                <button
                    onClick={() => setActiveTab('website')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'website'
                        ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                        : "text-neutral-400 hover:text-white hover:bg-white/5"
                        }`}
                >
                    <Globe className="w-4 h-4" />
                    Website & CRM
                </button>
            </div>

            {activeTab === 'shop' ? <ShopGuidelines /> : <WebsiteGuidelines />}
        </div>
    )
}

function ShopGuidelines() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">

                {/* Product Images */}
                <Section title="1. Product Afbeeldingen" icon={ShoppingBag}>
                    <div className="space-y-4">
                        <CompactRequirement
                            label="Hoofdafbeelding (Featured)"
                            specs={[
                                { label: "Afmeting", value: "1200 x 1200 px" },
                                { label: "Verhouding", value: "1:1 (Vierkant)" },
                                { label: "Formaat", value: "WebP / JPEG" },
                                { label: "Max grootte", value: "500 KB" }
                            ]}
                            description="De primaire foto op productkaarten en de shoppagina. Gebruik bij voorkeur een witte of transparante achtergrond."
                        />
                        <CompactRequirement
                            label="Product Galerij"
                            specs={[
                                { label: "Afmeting", value: "1200 x 1500 px" },
                                { label: "Verhouding", value: "4:5 (Portret)" },
                                { label: "Aantal", value: "Min. 3, aanbevolen 5-8" }
                            ]}
                            description="Gedetailleerde weergave op de productpagina. Zorg voor verschillende hoeken: Front, Back, Side, Detail en Context."
                        />
                    </div>
                </Section>

                {/* Banners */}
                <Section title="2. Banners" icon={ImageIcon}>
                    <div className="space-y-4">
                        <CompactRequirement
                            label="Hero Banner (Bovenkant)"
                            specs={[
                                { label: "Desktop", value: "1920 x 600 px (16:5)" },
                                { label: "Mobile", value: "750 x 800 px (1:1)" },
                                { label: "Max grootte", value: "800 KB" }
                            ]}
                            description="Houd de tekst in de centrale 60% van de breedte voor leesbaarheid op alle schermen."
                        />
                        <CompactRequirement
                            label="Promo & Categorie Banners"
                            specs={[
                                { label: "Promo", value: "1920 x 400 px (~5:1)" },
                                { label: "Categorie", value: "1200 x 300 px (4:1)" }
                            ]}
                            description="Sfeerbeelden tussen secties of bovenaan een categoriepagina."
                        />
                    </div>
                </Section>

                {/* Categories & Collections */}
                <Section title="3. Categorieën & Collecties" icon={Box}>
                    <div className="space-y-4">
                        <CompactRequirement
                            label="Category Cards"
                            specs={[
                                { label: "Afmeting", value: "600 x 800 px" },
                                { label: "Verhouding", value: "3:4 (Portret)" },
                                { label: "Max grootte", value: "300 KB" }
                            ]}
                            description="Foto's voor de 'Shop by Category' sectie."
                        />
                        <CompactRequirement
                            label="Collection Hero"
                            specs={[
                                { label: "Afmeting", value: "800 x 1000 px" },
                                { label: "Verhouding", value: "4:5" }
                            ]}
                            description="Lifestyle en sfeerbeelden voor collectie-uitlichtingen."
                        />
                    </div>
                </Section>

                {/* Special Content */}
                <Section title="4. Video & 3D" icon={Video}>
                    <div className="space-y-4">
                        <CompactRequirement
                            label="Product Video"
                            specs={[
                                { label: "Resolutie", value: "1080p (Min.)" },
                                { label: "Formaat", value: "MP4 (H.264)" },
                                { label: "Duur", value: "Max 30s" },
                                { label: "Grootte", value: "Max 10 MB" }
                            ]}
                            description="Korte sfeervideo's. Gebruik embeds (YouTube/Vimeo) voor langere content."
                        />
                        <CompactRequirement
                            label="3D Mock-up / Feature"
                            specs={[
                                { label: "Afmeting", value: "1200 x 800 px" },
                                { label: "Verhouding", value: "3:2" },
                                { label: "Formaat", value: "PNG (Transparant)" }
                            ]}
                            description="Voor speciale product features (bv. handschoenen) met dramatische belichting."
                        />
                    </div>
                </Section>

            </div>

            {/* Sidebar */}
            <div className="space-y-6">

                {/* Naming Convention */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <FileType className="w-5 h-5 text-amber-400" />
                        Bestandsnaamgeving
                    </h3>
                    <div className="bg-neutral-900 rounded-lg p-3 text-xs font-mono text-neutral-300 mb-4 border border-white/5 break-all">
                        [product-slug]-[type]-[nummer].[ext]
                    </div>
                    <ul className="space-y-2 text-sm text-neutral-400">
                        <li className="flex gap-2 text-xs">
                            <span className="text-green-400">✓</span>
                            reconnect-hoodie-zwart-front-01.webp
                        </li>
                        <li className="flex gap-2 text-xs">
                            <span className="text-green-400">✓</span>
                            shop-hero-banner-winter-2025.jpg
                        </li>
                    </ul>
                </div>

                {/* Color Profile */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Palette className="w-5 h-5 text-amber-400" />
                        Kleuren & Export
                    </h3>
                    <ul className="space-y-3">
                        <SpecItem label="Profiel" value="sRGB" />
                        <SpecItem label="JPEG Kwaliteit" value="80-85%" />
                        <SpecItem label="WebP Kwaliteit" value="80%" />
                        <SpecItem label="PNG" value="Alleen transparant" />
                    </ul>
                </div>

                {/* Tools */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-amber-300 mb-4 flex items-center gap-2">
                        <Info className="w-5 h-5" />
                        Tools & Resources
                    </h3>
                    <div className="space-y-4 text-sm">
                        <div>
                            <strong className="text-amber-200 block mb-1">Gratis</strong>
                            <ul className="list-disc list-inside text-amber-100/70 space-y-1">
                                <li>Squoosh (WebP conversie)</li>
                                <li>TinyPNG (Compressie)</li>
                                <li>Remove.bg (Transparantie)</li>
                            </ul>
                        </div>
                        <div>
                            <strong className="text-amber-200 block mb-1">Pro</strong>
                            <ul className="list-disc list-inside text-amber-100/70 space-y-1">
                                <li>Adobe Photoshop</li>
                                <li>Figma</li>
                                <li>Blender (3D)</li>
                            </ul>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

function WebsiteGuidelines() {
    return (
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
                <Section title="2. Hero Banners" icon={ImageIcon}>
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
    )
}

function Section({ title, icon: Icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) {
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

function CompactRequirement({ label, specs, description }: { label: string, specs: { label: string, value: string }[], description: string }) {
    return (
        <div className="p-4 rounded-xl bg-neutral-900/50 border border-white/5 hover:border-white/10 transition-colors">
            <h4 className="text-white font-medium mb-2">{label}</h4>
            <div className="grid grid-cols-2 gap-3 mb-3">
                {specs.map((spec, i) => (
                    <div key={i}>
                        <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-0.5">{spec.label}</div>
                        <div className="text-xs text-neutral-200 font-mono">{spec.value}</div>
                    </div>
                ))}
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed border-t border-white/5 pt-2 mt-2">{description}</p>
        </div>
    )
}

function SpecItem({ label, value }: { label: string, value: string }) {
    return (
        <li className="flex justify-between items-center text-sm border-b border-white/5 last:border-0 pb-2 last:pb-0">
            <span className="text-neutral-400">{label}</span>
            <span className="text-white font-mono bg-neutral-800 px-2 py-0.5 rounded text-xs">{value}</span>
        </li>
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
