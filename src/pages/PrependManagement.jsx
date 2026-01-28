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

export default function PrependManagement() {
  const { isAdmin } = useAuth();

  const [prepends, setPrepends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadPrepends = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("prepends")
      .select("*")
      .order("trigger_name");

    if (error) {
      console.error(error);
      setError(error.message);
    } else {
      setPrepends(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPrepends();
  }, []);

  if (!isAdmin) {
    return (
      <div className="p-6 text-center text-red-600">
        Acces restricționat – doar admin.
      </div>
    );
  }

  const startEdit = (prepend) => {
    setEditingId(prepend.id);
    setEditForm({
      trigger_name: prepend.trigger_name,
      keywords: prepend.keywords?.join(", ") || "",
      prompt: prepend.prompt || "",
      is_active: !!prepend.is_active,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    setSaving(true);
    setError(null);

    const keywordsArray = editForm.keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const { error } = await supabase
      .from("prepends")
      .update({
        trigger_name: editForm.trigger_name,
        keywords: keywordsArray,
        prompt: editForm.prompt,
        is_active: editForm.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingId);

    if (error) {
      console.error(error);
      setError(error.message);
    } else {
      await loadPrepends();
      cancelEdit();
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Se încarcă prependurile…
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Prepend Management</h1>
        <p className="text-gray-500">
          Reguli automate declanșate de răspunsuri scurte sau tipare
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded">
          {error}
        </div>
      )}

      {prepends.map((prepend) => {
        const isEditing = editingId === prepend.id;

        return (
          <Card key={prepend.id}>
            <CardHeader>
              <CardTitle>{prepend.trigger_name}</CardTitle>
              {!isEditing && (
                <CardDescription>
                  {prepend.keywords?.length || 0} keywords
                </CardDescription>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <Input
                    value={editForm.trigger_name}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        trigger_name: e.target.value,
                      })
                    }
                    placeholder="Trigger name"
                  />

                  <Input
                    value={editForm.keywords}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        keywords: e.target.value,
                      })
                    }
                    placeholder="keywords separate prin virgulă"
                  />

                  <Textarea
                    rows={8}
                    value={editForm.prompt}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        prompt: e.target.value,
                      })
                    }
                  />

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={editForm.is_active}
                      onCheckedChange={(val) =>
                        setEditForm({
                          ...editForm,
                          is_active: !!val,
                        })
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
                  <div className="text-sm text-gray-600">
                    <strong>Keywords:</strong>{" "}
                    {prepend.keywords?.join(", ") || "—"}
                  </div>

                  <pre className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap">
                    {prepend.prompt}
                  </pre>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {prepend.is_active ? "Activ" : "Inactiv"}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => startEdit(prepend)}
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
