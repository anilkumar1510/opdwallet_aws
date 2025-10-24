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
      <CardContent className="bg-white p-0">
        {relationshipsLoading ? (
          <div className="text-center py-8 text-gray-600">
            Loading relationships...
          </div>
        ) : relationships.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No relationships found. Please check relationship master data.
          </div>
        ) : (
          <div>
            {/* Coverage Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Relationship
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                      Covered
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-40">
                      Inherit from Primary
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Configuration Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {relationships.map((relationship, index) => {
                    const isRelationshipCovered = coveredRelationships.includes(relationship.relationshipCode);
                    const memberConfig = memberConfigs?.[relationship.relationshipCode];
                    const isInheriting = memberConfig?.inheritFromPrimary !== false;
                    const isPrimary = relationship.relationshipCode === 'PRIMARY';

                    return (
                      <tr key={relationship.relationshipCode} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{relationship.displayName}</div>
                            <div className="text-xs text-gray-600">Code: {relationship.relationshipCode}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isPrimary ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Always Covered
                            </span>
                          ) : (
                            <Switch
                              id={`${relationship.relationshipCode}-covered`}
                              checked={isRelationshipCovered}
                              onCheckedChange={(checked) => onToggleRelationship(relationship.relationshipCode, checked)}
                              disabled={isReadOnly}
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isPrimary ? (
                            <span className="text-xs text-gray-500">N/A</span>
                          ) : isRelationshipCovered ? (
                            <Switch
                              id={`${relationship.relationshipCode}-inherit`}
                              checked={isInheriting}
                              onCheckedChange={(checked) => onToggleInheritance(relationship.relationshipCode, checked)}
                              disabled={isReadOnly}
                            />
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isPrimary ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Primary Configuration
                            </span>
                          ) : !isRelationshipCovered ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              Not Covered
                            </span>
                          ) : isInheriting ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              ✓ Inheriting from Primary
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                              ⚙️ Custom Configuration
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary Section */}
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Total Relationships:</span>
                  <span className="text-sm font-medium text-gray-900">{relationships.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Covered Relationships:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {coveredRelationships.length + 1} (including Primary)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Custom Configurations:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {coveredRelationships.filter(code => memberConfigs?.[code]?.inheritFromPrimary === false).length}
                  </span>
                </div>
              </div>

              {coveredRelationships.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-xs text-blue-800">
                    <strong>Active Coverage:</strong> PRIMARY{coveredRelationships.length > 0 && ', ' + coveredRelationships.join(', ')}
                  </div>
                </div>
              )}

              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="text-xs text-amber-800">
                  <strong>Note:</strong> Individual benefit and wallet configurations are available in their respective tabs.
                  Custom configurations allow you to set specific benefits and limits for each relationship type.
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
