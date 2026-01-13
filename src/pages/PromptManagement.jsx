import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Save, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DEFAULT_GENERAL_PROMPT = `Ești un asistent AI de suport emoțional și claritate mentală.
Nu ești psiholog, nu pui diagnostice și nu oferi tratament medical.
Rolul tău este să ajuți utilizatorul să-și înțeleagă mai bine starea,
să-și ordoneze gândurile și să identifice pași mici, realiști.

Vorbești calm, matur, empatic, fără clișee motivaționale.
Nu judeci, nu iei partea nimănui, nu dai verdicte.
Pui întrebări deschise și ajuți utilizatorul să reflecteze.

Dacă utilizatorul este foarte agitat, încetinești conversația.
Dacă utilizatorul caută soluții rapide, îl ajuți să le structureze.

Tonul tău este echilibrat: empatic, dar sobru.
Ești cald fără a fi excesiv emoțional.
Ești clar și calm, fără limbaj rigid sau tehnic.

Nu folosești emoji.
Nu folosești clișee motivaționale.
Nu exagerezi validarea emoțională.`;

export default function PromptManagement() {
  const [generalPrompt, setGeneralPrompt] = useState(DEFAULT_GENERAL_PROMPT);
  const [adultStresatPrompt, setAdultStresatPrompt] = useState('');
  const [parintePrompt, setParintePrompt] = useState('');
  const [tanarPrompt, setTanarPrompt] = useState('');
  const [selectedMode, setSelectedMode] = useState('adult_stresat');
  const [showPreview, setShowPreview] = useState(true);
  
  const queryClient = useQueryClient();

  // Load existing prompts
  const { data: prompts, isLoading } = useQuery({
    queryKey: ['aiPrompts'],
    queryFn: async () => {
      const result = await base44.entities.AIPrompts.list();
      return result.length > 0 ? result[0] : null;
    },
    initialData: null,
  });

  useEffect(() => {
    if (prompts) {
      setGeneralPrompt(prompts.general_prompt || DEFAULT_GENERAL_PROMPT);
      setAdultStresatPrompt(prompts.adult_stresat_prompt || '');
      setParintePrompt(prompts.parinte_prompt || '');
      setTanarPrompt(prompts.tanar_prompt || '');
    }
  }, [prompts]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (prompts?.id) {
        return await base44.entities.AIPrompts.update(prompts.id, data);
      } else {
        return await base44.entities.AIPrompts.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiPrompts'] });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      general_prompt: generalPrompt,
      adult_stresat_prompt: adultStresatPrompt,
      parinte_prompt: parintePrompt,
      tanar_prompt: tanarPrompt,
    });
  };

  const getCombinedPrompt = () => {
    const modePrompts = {
      adult_stresat: adultStresatPrompt,
      parinte: parintePrompt,
      tanar: tanarPrompt,
    };
    
    const specificPrompt = modePrompts[selectedMode];
    return `${generalPrompt}\n\n${specificPrompt ? `--- CONTEXT SPECIFIC ---\n${specificPrompt}` : '(Nu există prompt specific pentru acest mod)'}`;
  };

  const modeLabels = {
    adult_stresat: 'Adult stresat',
    parinte: 'Părinte',
    tanar: 'Tânăr'
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-rose-50 flex items-center justify-center">
        <div className="text-gray-500">Se încarcă...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-rose-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Prompturi AI</h1>
              <p className="text-gray-500 text-sm">Configurează personalitatea companion-ului</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side - Edit prompts */}
          <div className="space-y-6">
            {/* Prompt General */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Prompt General</span>
                  <span className="text-xs font-normal text-gray-500 bg-indigo-50 px-2 py-1 rounded">Bază</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={generalPrompt}
                  onChange={(e) => setGeneralPrompt(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                  placeholder="Introdu promptul general..."
                />
              </CardContent>
            </Card>

            {/* Adult Stresat */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Adult Stresat</span>
                  <span className="text-xs font-normal text-gray-500 bg-blue-50 px-2 py-1 rounded">Specific</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={adultStresatPrompt}
                  onChange={(e) => setAdultStresatPrompt(e.target.value)}
                  className="min-h-[120px] font-mono text-sm"
                  placeholder="Prompt specific pentru adulți stresați..."
                />
              </CardContent>
            </Card>

            {/* Părinte */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Prompt Părinte</span>
                  <span className="text-xs font-normal text-gray-500 bg-rose-50 px-2 py-1 rounded">Specific</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={parintePrompt}
                  onChange={(e) => setParintePrompt(e.target.value)}
                  className="min-h-[120px] font-mono text-sm"
                  placeholder="Prompt specific pentru părinți..."
                />
              </CardContent>
            </Card>

            {/* Tânăr */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Prompt Tânăr</span>
                  <span className="text-xs font-normal text-gray-500 bg-amber-50 px-2 py-1 rounded">Specific</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={tanarPrompt}
                  onChange={(e) => setTanarPrompt(e.target.value)}
                  className="min-h-[120px] font-mono text-sm"
                  placeholder="Prompt specific pentru tineri..."
                />
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              size="lg"
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white py-6"
            >
              <Save className="w-5 h-5 mr-2" />
              {saveMutation.isPending ? 'Se salvează...' : 'Salvează prompturile'}
            </Button>
          </div>

          {/* Right side - Preview */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Verificare Prompt</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? (
                      <><EyeOff className="w-4 h-4 mr-2" /> Ascunde</>
                    ) : (
                      <><Eye className="w-4 h-4 mr-2" /> Arată</>
                    )}
                  </Button>
                </div>
              </CardHeader>
              {showPreview && (
                <CardContent>
                  <div className="mb-4">
                    <Label className="text-sm text-gray-600 mb-2 block">Alege modul pentru previzualizare:</Label>
                    <Tabs value={selectedMode} onValueChange={setSelectedMode} className="w-full">
                      <TabsList className="w-full grid grid-cols-3">
                        <TabsTrigger value="adult_stresat" className="text-xs">Adult</TabsTrigger>
                        <TabsTrigger value="parinte" className="text-xs">Părinte</TabsTrigger>
                        <TabsTrigger value="tanar" className="text-xs">Tânăr</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                    <div className="mb-3">
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                        Mod selectat: {modeLabels[selectedMode]}
                      </span>
                    </div>
                    <pre className="whitespace-pre-wrap text-xs text-gray-700 leading-relaxed font-mono">
                      {getCombinedPrompt()}
                    </pre>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <strong>Info:</strong> Acesta este promptul final care va fi trimis către AI când un utilizator alege modul "{modeLabels[selectedMode]}".
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}