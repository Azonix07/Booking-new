"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Phone, Mail, Plus, Trash2, Loader2, ArrowRight, Sparkles, X } from "lucide-react";

interface CustomField {
  label: string;
  type: "text" | "number" | "email" | "select";
  required: boolean;
  options?: string[];
}

interface CustomerFields {
  nameRequired: boolean;
  phoneRequired: boolean;
  emailRequired: boolean;
  customFields: CustomField[];
}

interface Props {
  data: CustomerFields | null;
  onSave: (data: CustomerFields) => void;
  saving: boolean;
}

const SUGGESTIONS: { label: string; field: CustomField }[] = [
  { label: "Age", field: { label: "Age", type: "number", required: false } },
  { label: "Company", field: { label: "Company", type: "text", required: false } },
  { label: "Notes / special requests", field: { label: "Notes", type: "text", required: false } },
  { label: "Occasion", field: { label: "Occasion", type: "select", required: false, options: ["Birthday", "Anniversary", "Corporate", "Casual"] } },
  { label: "Number of guests", field: { label: "Number of guests", type: "number", required: true } },
];

export default function StepCustomerFields({ data, onSave, saving }: Props) {
  const [fields, setFields] = useState<CustomerFields>(
    data || {
      nameRequired: true,
      phoneRequired: true,
      emailRequired: false,
      customFields: [],
    },
  );

  const addCustomField = () => {
    setFields((prev) => ({
      ...prev,
      customFields: [
        ...prev.customFields,
        { label: "", type: "text", required: false },
      ],
    }));
  };

  const addSuggestion = (suggestion: CustomField) => {
    if (fields.customFields.some((cf) => cf.label.toLowerCase() === suggestion.label.toLowerCase())) return;
    setFields((prev) => ({
      ...prev,
      customFields: [...prev.customFields, { ...suggestion }],
    }));
  };

  const updateCustomField = (index: number, field: Partial<CustomField>) => {
    setFields((prev) => ({
      ...prev,
      customFields: prev.customFields.map((cf, i) =>
        i === index ? { ...cf, ...field } : cf,
      ),
    }));
  };

  const removeCustomField = (index: number) => {
    setFields((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">What info do you need at checkout?</h2>
        <p className="text-muted-foreground mt-1.5">
          Keep it short — the fewer fields, the more bookings.
        </p>
      </div>

      {/* Standard fields */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Standard fields</p>
        <div className="rounded-xl border border-border bg-background divide-y divide-border overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-sm">Full name</p>
                <p className="text-xs text-muted-foreground">{fields.nameRequired ? "Required" : "Optional"}</p>
              </div>
            </div>
            <Switch
              checked={fields.nameRequired}
              onCheckedChange={(c) => setFields((p) => ({ ...p, nameRequired: c }))}
            />
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-sm">Phone number</p>
                <p className="text-xs text-muted-foreground">
                  {fields.phoneRequired ? "Required — for booking confirmations" : "Optional"}
                </p>
              </div>
            </div>
            <Switch
              checked={fields.phoneRequired}
              onCheckedChange={(c) => setFields((p) => ({ ...p, phoneRequired: c }))}
            />
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-sm">Email address</p>
                <p className="text-xs text-muted-foreground">
                  {fields.emailRequired ? "Required — receipts & updates" : "Optional"}
                </p>
              </div>
            </div>
            <Switch
              checked={fields.emailRequired}
              onCheckedChange={(c) => setFields((p) => ({ ...p, emailRequired: c }))}
            />
          </div>
        </div>
      </div>

      {/* Custom fields */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Extra fields</p>
          <span className="text-xs text-muted-foreground">{fields.customFields.length} added</span>
        </div>

        {/* Suggestion chips */}
        {fields.customFields.length < 3 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              Quick add:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => {
                const exists = fields.customFields.some((cf) => cf.label.toLowerCase() === s.label.toLowerCase());
                if (exists) return null;
                return (
                  <button
                    key={s.label}
                    onClick={() => addSuggestion(s.field)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-border text-xs font-medium text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all"
                  >
                    + {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {fields.customFields.map((cf, index) => (
          <Card key={index} className="border-border/60">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Question / label</Label>
                    <Input
                      placeholder="e.g. What's the occasion?"
                      value={cf.label}
                      onChange={(e) => updateCustomField(index, { label: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Answer type</Label>
                    <Select
                      value={cf.type}
                      onValueChange={(v) => updateCustomField(index, { type: v as CustomField["type"] })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="select">Dropdown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 shrink-0"
                  onClick={() => removeCustomField(index)}
                  aria-label="Remove field"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {cf.type === "select" && (
                <div>
                  <Label className="text-xs">Options</Label>
                  <TagInput
                    value={cf.options || []}
                    onChange={(opts) => updateCustomField(index, { options: opts })}
                    placeholder="Type an option and press Enter..."
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <Switch
                  checked={cf.required}
                  onCheckedChange={(c) => updateCustomField(index, { required: c })}
                />
                <Label className="text-xs text-muted-foreground">Customers must answer this</Label>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button variant="outline" onClick={addCustomField} className="w-full rounded-xl border-dashed gap-2">
          <Plus className="h-4 w-4" />
          Add a custom field
        </Button>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => onSave(fields)}
          disabled={saving}
          size="lg"
          className="gap-1.5 rounded-xl shadow-md shadow-primary/20 hover:shadow-primary/30"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </div>
    </div>
  );
}

function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const trimmed = input.trim();
    if (!trimmed || value.includes(trimmed)) {
      setInput("");
      return;
    }
    onChange([...value, trimmed]);
    setInput("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div className="mt-1">
      <div className="flex flex-wrap gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 min-h-[40px] items-center focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:bg-primary/20 rounded"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag();
            } else if (e.key === "Backspace" && !input && value.length > 0) {
              removeTag(value[value.length - 1]);
            }
          }}
          onBlur={addTag}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-muted-foreground"
        />
      </div>
      <p className="text-[11px] text-muted-foreground mt-1">
        Press Enter after each option
      </p>
    </div>
  );
}
