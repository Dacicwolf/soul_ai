import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { motion } from 'framer-motion';

const DEFAULT_PREPENDS = [
  {
    trigger_name: 'RESPINGERE',
    keywords: ['nu cred că ajută asta', 'nu are sens', 'nu funcționează'],
    prompt: `UTILIZATORUL EXPRIMĂ RESPINGERE SAU NEÎNCREDERE.
Răspunde scurt, fără scuze, fără explicații.
NU te justifica.
Pune o singură întrebare.
Folosește EXACT această replică:
„Înțeleg. Ce anume simți că nu ajută acum?"`,
    is_active: true
  },
  {
    trigger_name: 'TACERE',
    keywords: ['nu știu ce să zic', '...'],
    prompt: `UTILIZATORUL EXPRIMĂ BLOCAJ SAU TĂCERE.
NU pune întrebări.
Răspunsul are maximum 2 propoziții.
Folosește EXACT:
„E în regulă. Putem sta puțin aici, fără grabă."`,
    is_active: true
  },
  {
    trigger_name: 'FURIE',
    keywords: ['m-am săturat de tot', 'nu mai suport', 'mă enervează tot'],
    prompt: `UTILIZATORUL EXPRIMĂ FURIE SAU DESCĂRCARE EMOȚIONALĂ.
NU valida excesiv.
NU escalada.
Pune o singură întrebare.
Folosește EXACT:
„Sună ca multă tensiune. Ce te-a adus în punctul ăsta?"`,
    is_active: true
  },
  {
    trigger_name: 'AUTO_MINIMALIZARE',
    keywords: ['probabil exagerez', 'nu e mare lucru', 'poate sunt eu prea sensibil'],
    prompt: `UTILIZATORUL SE AUTO-MINIMALIZEAZĂ.
NU contrazice.
NU valida excesiv.
Pune o singură întrebare.
Folosește EXACT:
„Ce te face să spui asta?"`,
    is_active: true
  },
  {
    trigger_name: 'EPUIZARE',
    keywords: ['nu mai pot', 'sunt terminat', 'sunt terminată', 'simt că cedez'],
    prompt: `UTILIZATORUL EXPRIMĂ EPUIZARE.
NU escalada la criză.
NU menționa resurse externe.
Pune o singură întrebare de clarificare.
Folosește EXACT:
„Sună foarte greu. Ce înseamnă «nu mai pot» pentru tine acum?"`,
    is_active: true
  }
];

export default function PrependManagement() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [newKeyword, setNewKeyword] = useState('');

  const { data: prepends, isLoading } = useQuery({
    queryKey: ['prepends'],
    queryFn: async () => {
      const result = await base44.entities.PrependPrompts.list();
      return result;
    },
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PrependPrompts.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prepends'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PrependPrompts.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prepends'] });
      setEditingId(null);
      setEditForm({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PrependPrompts.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prepends'] });
    },
  });

  const handleInitializeDefaults = async () => {
    for (const prepend of DEFAULT_PREPENDS) {
      await createMutation.mutateAsync(prepend);
    }
  };

  const handleEdit = (prepend) => {
    setEditingId(prepend.id);
    setEditForm({ ...prepend });
  };

  const handleSave = () => {
    updateMutation.mutate({
      id: editingId,
      data: editForm
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && editForm.keywords) {
      setEditForm({
        ...editForm,
        keywords: [...editForm.keywords, newKeyword.trim()]
      });
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (index) => {
    setEditForm({
      ...editForm,
      keywords: editForm.keywords.filter((_, i) => i !== index)
    });
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
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Prepend Management</h1>
          <p className="text-gray-500">Configurează trigger-ele și prepend prompturile pentru răspunsuri contextualizate</p>
        </motion.div>

        {prepends.length === 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <p className="text-gray-600 mb-4">Nu există prepend-uri configurate. Vrei să inițializezi cu valorile default?</p>
              <Button onClick={handleInitializeDefaults} className="bg-indigo-600 hover:bg-indigo-700">
                Inițializează Prepend-uri Default
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {prepends.map((prepend) => (
            <motion.div
              key={prepend.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{prepend.trigger_name}</CardTitle>
                      <CardDescription>
                        {editingId === prepend.id ? 'Editare în curs' : `${prepend.keywords.length} keywords`}
                      </CardDescription>
                    </div>
                    {editingId !== prepend.id && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(prepend)}
                        >
                          Editează
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(prepend.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {editingId === prepend.id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Nume Trigger
                        </label>
                        <Input
                          value={editForm.trigger_name}
                          onChange={(e) => setEditForm({ ...editForm, trigger_name: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Keywords
                        </label>
                        <div className="flex gap-2 mb-2">
                          <Input
                            placeholder="Adaugă keyword nou"
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                          />
                          <Button onClick={handleAddKeyword} size="sm">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {editForm.keywords?.map((keyword, index) => (
                            <div
                              key={index}
                              className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                            >
                              {keyword}
                              <button onClick={() => handleRemoveKeyword(index)}>
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Prepend Prompt
                        </label>
                        <Textarea
                          value={editForm.prompt}
                          onChange={(e) => setEditForm({ ...editForm, prompt: e.target.value })}
                          rows={8}
                          className="font-mono text-sm"
                        />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={handleCancel}>
                          Anulează
                        </Button>
                        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                          <Save className="w-4 h-4 mr-2" />
                          Salvează
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Keywords:</div>
                        <div className="flex flex-wrap gap-2">
                          {prepend.keywords.map((keyword, index) => (
                            <span
                              key={index}
                              className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Prepend Prompt:</div>
                        <pre className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 whitespace-pre-wrap">
                          {prepend.prompt}
                        </pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}