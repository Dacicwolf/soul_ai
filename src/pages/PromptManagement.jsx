import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function PromptManagement() {
  const { isAdmin } = useAuth();

  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadPrompts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("prompts")
      .select("*")
      .order("name");

    if (error) {
      console.error(error);
      setError(error.message);
    } else {
      setPrompts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPrompts();
  }, []);

  if (!isAdmin) {
    return (
      <div className="p-6 text-center text-red-600">
        Acces restricționat – doar admin.
      </div>
    );
  }

  const startEdit = (prompt) => {
    setEditingId(prompt.id);
    setEditForm({
      description: prompt.description || "",
      content: prompt.content || "",
      is_active: !!prompt.is_active,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    setSaving(true);
    setError(null);

    const { error } = await supabase
      .from("prompts")
      .update({
        description: editForm.description,
        content: editForm.content,
        is_active: editForm.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingId);

    if (error) {
      console.error(error);
      setError(error.message);
    } else {
      await loadPrompts();
      cancelEdit();
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Se încarcă prompturile…
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Prompt Management</h1>
        <p className="text-gray-500">
          Prompturi de sistem și preseturi conversaționale
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded">
          {error}
        </div>
      )}

      {prompts.map((prompt) => {
        const isEditing = editingId === prompt.id;

        return (
          <Card key={prompt.id}>
            <CardHeader>
              <CardTitle>{prompt.name}</CardTitle>
              {!isEditing && (
                <CardDescription>
                  {prompt.description || "—"}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <Input
                    placeholder="Descriere"
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                  />

                  <Textarea
                    rows={8}
                    value={editForm.content}
                    onChange={(e) =>
                      setEditForm({ ...editForm, content: e.target.value })
                    }
                  />

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={editForm.is_active}
                      onCheckedChange={(val) =>
                        setEditForm({ ...editForm, is_active: !!val })
                      }
                    />
                    <span>Activ</span>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={saveEdit} disabled={saving}>
                      {saving ? "Se salvează…" : "Salvează"}
                    </Button>
                    <Button variant="outline" onClick={cancelEdit}>
                      Renunță
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <pre className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap">
                    {prompt.content}
                  </pre>

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => startEdit(prompt)}
                    >
                      Editează
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
