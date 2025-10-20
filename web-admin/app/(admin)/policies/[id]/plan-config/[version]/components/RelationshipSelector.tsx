'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface RelationshipSelectorProps {
  selectedRelationship: string;
  onRelationshipChange: (value: string) => void;
  relationships: any[];
  coveredRelationships: string[];
  isCurrentMemberInheriting: boolean;
  onToggleInheritance: (relationshipCode: string, inherit: boolean) => void;
  isReadOnly: boolean;
}

export function RelationshipSelector({
  selectedRelationship,
  onRelationshipChange,
  relationships,
  coveredRelationships,
  isCurrentMemberInheriting,
  onToggleInheritance,
  isReadOnly
}: RelationshipSelectorProps) {
  const renderStatusIndicator = () => {
    if (selectedRelationship === 'PRIMARY') {
      return (
        <div className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">
          ⭐ Primary Member Configuration (REL001)
        </div>
      );
    }

    if (selectedRelationship && isCurrentMemberInheriting) {
      return (
        <div className="text-green-600 bg-green-50 px-3 py-1 rounded-full inline-block">
          ✓ Inheriting from Primary Member
        </div>
      );
    }

    if (selectedRelationship) {
      return (
        <div className="text-orange-600 bg-orange-50 px-3 py-1 rounded-full inline-block">
          ⚙️ Custom Configuration
        </div>
      );
    }

    return (
      <div className="text-gray-600 bg-gray-50 px-3 py-1 rounded-full inline-block">
        Select a relationship to configure
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Configure for Relationship</h3>
          <p className="text-sm text-gray-600">
            Select the relationship to configure benefits and wallet. Coverage settings are managed in the Coverage tab.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="relationship-selector" className="text-sm font-medium">
              Relationship:
            </Label>
            <Select
              value={selectedRelationship}
              onValueChange={onRelationshipChange}
              disabled={isReadOnly}
            >
              <SelectTrigger id="relationship-selector" className="w-48 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRIMARY">
                  Primary Member (REL001)
                </SelectItem>
                {coveredRelationships.map((relationshipCode) => {
                  const relationship = relationships.find(r => r.relationshipCode === relationshipCode);
                  return (
                    <SelectItem key={relationshipCode} value={relationshipCode}>
                      {relationship?.displayName || relationshipCode} ({relationshipCode})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          {selectedRelationship && selectedRelationship !== 'PRIMARY' && (
            <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
              <Label htmlFor="inherit-toggle" className="text-sm font-medium">
                Inherit from Primary:
              </Label>
              <Switch
                id="inherit-toggle"
                checked={isCurrentMemberInheriting}
                onCheckedChange={(checked) => onToggleInheritance(selectedRelationship, checked)}
                disabled={isReadOnly}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 text-sm">
        {renderStatusIndicator()}
      </div>
    </div>
  );
}
