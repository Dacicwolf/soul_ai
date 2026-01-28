import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

// versiunea aplicației – ideal să o muți ulterior într-o constantă globală
const APP_VERSION = '0.9.0';
const APP_STATUS = 'Beta';

export default function About() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-rose-50">
            {/* Header */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100 px-4 py-3"
            >
                <div className="max-w-2xl mx-auto flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Button>
                    <h1 className="font-medium text-gray-800">Despre Soul-AI</h1>
                </div>
            </motion.header>

            {/* Content */}
            <motion.main
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-2xl mx-auto px-6 py-10 space-y-8"
            >
                {/* App description */}
                <section className="space-y-3">
                    <h2 className="text-lg font-medium text-gray-800">
                        Ce este Soul-AI
                    </h2>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        Soul-AI este o aplicație de conversație asistată de inteligență artificială,
                        concepută pentru a oferi un spațiu sigur de reflecție, clarificare emoțională
                        și sprijin conversațional.
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        Aplicația nu înlocuiește terapia, consilierea psihologică sau consultanța
                        medicală. Rolul ei este de companion conversațional și instrument de
                        introspecție.
                    </p>
                </section>

                {/* Author */}
                <section className="space-y-2">
                    <h2 className="text-lg font-medium text-gray-800">
                        Autor
                    </h2>
                    <p className="text-sm text-gray-600">
                        <strong>Theo</strong><br />
                        IT & AI Consultant
                    </p>
                </section>

                {/* Project / Company */}
                <section className="space-y-3">
                    <h2 className="text-lg font-medium text-gray-800">
                        Proiect
                    </h2>
                    <p className="text-sm text-gray-600">
                        <strong>IT on AI</strong>
                    </p>

                    {/* Logo placeholder */}
                    <div className="flex items-center justify-center py-4">
                        {/* aici vei pune logo-ul ITonAI */}
                        <div className="w-32 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-500">
                            ITonAI Logo
                        </div>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed">
                        IT on AI este un proiect independent axat pe dezvoltarea de soluții AI
                        practice, etice și orientate spre utilitate reală.
                    </p>
                </section>

                {/* Version */}
                <section className="pt-6 border-t border-gray-200 space-y-1">
                    <p className="text-xs text-gray-500">
                        Versiune aplicație: <strong>{APP_VERSION}</strong>
                    </p>
                    <p className="text-xs text-gray-500">
                        Status: {APP_STATUS}
                    </p>
                </section>
            </motion.main>
        </div>
    );
}
