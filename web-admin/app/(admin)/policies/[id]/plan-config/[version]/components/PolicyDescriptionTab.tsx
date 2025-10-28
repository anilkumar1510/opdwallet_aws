'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2 } from 'lucide-react';

interface PolicyDescriptionEntry {
  headline: string;
  description: string;
}

interface PolicyDescriptionTabProps {
  inclusions: PolicyDescriptionEntry[];
  exclusions: PolicyDescriptionEntry[];
  isReadOnly: boolean;
  onUpdateInclusions: (inclusions: PolicyDescriptionEntry[]) => void;
  onUpdateExclusions: (exclusions: PolicyDescriptionEntry[]) => void;
}

export function PolicyDescriptionTab({
  inclusions,
  exclusions,
  isReadOnly,
  onUpdateInclusions,
  onUpdateExclusions
}: PolicyDescriptionTabProps) {
  const addInclusion = () => {
    onUpdateInclusions([...inclusions, { headline: '', description: '' }]);
  };

  const updateInclusion = (index: number, field: 'headline' | 'description', value: string) => {
    const updated = [...inclusions];
    updated[index][field] = value;
    onUpdateInclusions(updated);
  };

  const deleteInclusion = (index: number) => {
    const updated = inclusions.filter((_, i) => i !== index);
    onUpdateInclusions(updated);
  };

  const addExclusion = () => {
    onUpdateExclusions([...exclusions, { headline: '', description: '' }]);
  };

  const updateExclusion = (index: number, field: 'headline' | 'description', value: string) => {
    const updated = [...exclusions];
    updated[index][field] = value;
    onUpdateExclusions(updated);
  };

  const deleteExclusion = (index: number) => {
    const updated = exclusions.filter((_, i) => i !== index);
    onUpdateExclusions(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Policy Description</CardTitle>
        <p className="text-sm text-muted-foreground">
          Define what is covered and what is not covered under this policy.
          This information will be displayed to members in their portal.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="inclusions" className="space-y-4">
          <TabsList className="bg-gray-100">
            <TabsTrigger
              value="inclusions"
              className="text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:font-semibold"
            >
              Inclusions
            </TabsTrigger>
            <TabsTrigger
              value="exclusions"
              className="text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:font-semibold"
            >
              Exclusions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inclusions" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Add items that are covered under this policy
              </p>
              {!isReadOnly && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addInclusion}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Inclusion
                </Button>
              )}
            </div>

            {inclusions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No inclusions added yet. Click "Add Inclusion" to get started.
              </div>
            )}

            <div className="space-y-4">
              {inclusions.map((inclusion, index) => (
                <Card key={index} className="border-gray-200">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-4">
                          <div>
                            <Label htmlFor={`inclusion-headline-${index}`}>
                              Headline <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id={`inclusion-headline-${index}`}
                              value={inclusion.headline}
                              onChange={(e) => updateInclusion(index, 'headline', e.target.value)}
                              placeholder="e.g., Doctor Consultations"
                              disabled={isReadOnly}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`inclusion-description-${index}`}>
                              Description <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                              id={`inclusion-description-${index}`}
                              value={inclusion.description}
                              onChange={(e) => updateInclusion(index, 'description', e.target.value)}
                              placeholder="Describe what is covered in detail..."
                              disabled={isReadOnly}
                              rows={3}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        {!isReadOnly && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteInclusion(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="exclusions" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Add items that are NOT covered under this policy
              </p>
              {!isReadOnly && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addExclusion}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Exclusion
                </Button>
              )}
            </div>

            {exclusions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No exclusions added yet. Click "Add Exclusion" to get started.
              </div>
            )}

            <div className="space-y-4">
              {exclusions.map((exclusion, index) => (
                <Card key={index} className="border-gray-200">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-4">
                          <div>
                            <Label htmlFor={`exclusion-headline-${index}`}>
                              Headline <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id={`exclusion-headline-${index}`}
                              value={exclusion.headline}
                              onChange={(e) => updateExclusion(index, 'headline', e.target.value)}
                              placeholder="e.g., Pre-existing Conditions"
                              disabled={isReadOnly}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`exclusion-description-${index}`}>
                              Description <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                              id={`exclusion-description-${index}`}
                              value={exclusion.description}
                              onChange={(e) => updateExclusion(index, 'description', e.target.value)}
                              placeholder="Describe what is NOT covered in detail..."
                              disabled={isReadOnly}
                              rows={3}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        {!isReadOnly && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteExclusion(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
