'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

interface CoverageConfigTabProps {
  relationships: any[];
  relationshipsLoading: boolean;
  coveredRelationships: string[];
  memberConfigs: any;
  isReadOnly: boolean;
  onToggleRelationship: (relationshipCode: string, enabled: boolean) => void;
  onToggleInheritance: (relationshipCode: string, inherit: boolean) => void;
}

export function CoverageConfigTab({
  relationships,
  relationshipsLoading,
  coveredRelationships,
  memberConfigs,
  isReadOnly,
  onToggleRelationship,
  onToggleInheritance
}: CoverageConfigTabProps) {
  return (
    <Card className="bg-white">
      <CardHeader className="bg-white">
        <CardTitle className="text-gray-900">Coverage Configuration</CardTitle>
        <p className="text-sm text-gray-600">
          Define which relationships are covered under this plan and their individual configurations.
        </p>
      </CardHeader>
      <CardContent className="space-y-6 bg-white">
        {relationshipsLoading ? (
          <div className="text-center py-8 text-gray-600">
            Loading relationships...
          </div>
        ) : relationships.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No relationships found. Please check relationship master data.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <h4 className="font-medium mb-4 text-gray-900">Select Covered Relationships</h4>
              <p className="text-sm text-gray-600 mb-4">
                Choose which family relationships are covered under this plan. Only selected relationships will be available for assignment.
              </p>

              <div className="space-y-3">
                {relationships.map((relationship) => (
                  <div key={relationship.relationshipCode} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {relationship.displayName}
                      </div>
                      <div className="text-sm text-gray-600">
                        Code: {relationship.relationshipCode}
                      </div>
                    </div>
                    <Switch
                      checked={coveredRelationships.includes(relationship.relationshipCode) || false}
                      onCheckedChange={(checked) => onToggleRelationship(relationship.relationshipCode, checked)}
                      disabled={isReadOnly}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-800">
                  <strong>Selected relationships:</strong> {coveredRelationships.length === 0 ? 'None' : coveredRelationships.join(', ')}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Note: Primary Member is always covered and cannot be disabled.
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <h4 className="font-medium mb-4 text-gray-900">Individual Member Configuration</h4>
              <p className="text-sm text-gray-600 mb-4">
                Configure benefits and wallet settings for each covered relationship. You can choose to inherit from primary member or create custom configurations.
              </p>

              {coveredRelationships.length === 0 ? (
                <div className="text-center py-4 text-gray-500 border border-dashed border-gray-300 rounded">
                  Add relationships above to configure individual member settings
                </div>
              ) : (
                <div className="space-y-4">
                  {coveredRelationships.map((relationshipCode) => {
                    const relationship = relationships.find(r => r.relationshipCode === relationshipCode);
                    const memberConfig = memberConfigs?.[relationshipCode];
                    const isInheriting = memberConfig?.inheritFromPrimary !== false;

                    return (
                      <div key={relationshipCode} className="border border-gray-100 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h5 className="font-medium text-gray-900">
                              {relationship?.displayName || relationshipCode}
                            </h5>
                            <div className="text-sm text-gray-500">
                              Code: {relationshipCode}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Inherit from Primary:</span>
                            <Switch
                              checked={isInheriting}
                              onCheckedChange={(checked) => onToggleInheritance(relationshipCode, checked)}
                              disabled={isReadOnly}
                            />
                          </div>
                        </div>

                        {isInheriting && (
                          <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                            ✓ Inheriting all settings from Primary Member
                          </div>
                        )}

                        {!isInheriting && (
                          <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                            ⚙️ Custom configuration - Settings will be defined individually for this relationship
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-sm text-yellow-800">
                      <strong>Note:</strong> Individual configurations for benefits and wallet settings will be available in their respective tabs once relationships are configured here.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
