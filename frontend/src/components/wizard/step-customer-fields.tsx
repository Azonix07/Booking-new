"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Phone, Mail, Plus, Trash2, Loader2 } from "lucide-react";

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
        <h2 className="text-2xl font-bold">Customer information</h2>
        <p className="text-muted-foreground mt-1">
          What details do you need from customers when they book?
        </p>
      </div>

      {/* Default fields */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">Standard Fields</p>
        <Card>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Full Name</p>
                  <p className="text-xs text-muted-foreground">Always collected</p>
                </div>
              </div>
              <Switch
                checked={fields.nameRequired}
                onCheckedChange={(c) => setFields((p) => ({ ...p, nameRequired: c }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Phone Number</p>
                  <p className="text-xs text-muted-foreground">For booking confirmations</p>
                </div>
              </div>
              <Switch
                checked={fields.phoneRequired}
                onCheckedChange={(c) => setFields((p) => ({ ...p, phoneRequired: c }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Email Address</p>
                  <p className="text-xs text-muted-foreground">For receipts and updates</p>
                </div>
              </div>
              <Switch
                checked={fields.emailRequired}
                onCheckedChange={(c) => setFields((p) => ({ ...p, emailRequired: c }))}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom fields */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">Custom Fields</p>

        {fields.customFields.map((cf, index) => (
          <Card key={index}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Field Label</Label>
                    <Input
                      placeholder="e.g. Age, Organization"
                      value={cf.label}
                      onChange={(e) => updateCustomField(index, { label: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Type</Label>
                    <Select
                      value={cf.type}
                      onValueChange={(v) => updateCustomField(index, { type: v as CustomField["type"] })}
                    >
                      <SelectTrigger>
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
                  <div className="flex items-end gap-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={cf.required}
                        onCheckedChange={(c) => updateCustomField(index, { required: c })}
                      />
                      <Label className="text-xs">Required</Label>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-5 text-destructive hover:text-destructive"
                  onClick={() => removeCustomField(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {cf.type === "select" && (
                <div className="mt-2">
                  <Label className="text-xs">Options (comma-separated)</Label>
                  <Input
                    placeholder="Option 1, Option 2, Option 3"
                    value={cf.options?.join(", ") || ""}
                    onChange={(e) =>
                      updateCustomField(index, {
                        options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean),
                      })
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        <Button variant="outline" onClick={addCustomField} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Field
        </Button>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => onSave(fields)} disabled={saving} size="lg">
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Continue
        </Button>
      </div>
    </div>
  );
}
