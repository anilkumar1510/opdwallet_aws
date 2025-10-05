'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Save, ArrowLeft } from 'lucide-react';
import { planConfigApi, PlanConfig } from '@/lib/api/plan-config';
import { categoriesApi, Category } from '@/lib/api/categories';
import { toast } from 'sonner';

// Extended type for local state with relationship configurations
interface ExtendedPlanConfig extends Partial<PlanConfig> {
  coveredRelationships?: string[];
  memberConfigs?: {
    [relationshipCode: string]: {
      inheritFromPrimary?: boolean;
      walletAmount?: number;
      perClaimLimit?: number;
      copayPercent?: number;
      benefits?: any;
      wallet?: any;
    };
  };
}

export default function PlanConfigEdit() {
  const params = useParams();
  const router = useRouter();
  const policyId = params.id as string;
  const version = params.version as string;
  const isNew = version === 'new';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [relationshipsLoading, setRelationshipsLoading] = useState(true);
  const [selectedRelationship, setSelectedRelationship] = useState<string>('PRIMARY'); // Default to Primary Member
  const [config, setConfig] = useState<ExtendedPlanConfig>({
    benefits: {},
    wallet: {
      totalAnnualAmount: 0,
      perClaimLimit: 0,
      copay: { mode: 'PERCENT', value: 0 },
      partialPaymentEnabled: false,
      carryForward: { enabled: false, percent: 0, months: 0 },
      topUpAllowed: false,
    },
    coveredRelationships: [],
    memberConfigs: {}
  });

  useEffect(() => {
    loadCategories();
    loadRelationships();
    if (!isNew) {
      loadConfig();
    } else {
      setLoading(false);
    }
  }, [policyId, version]);



  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await categoriesApi.getActive();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadRelationships = async () => {
    try {
      setRelationshipsLoading(true);
      // For now, we'll use a simple fetch - later we'll create a proper API
      const response = await fetch('/api/relationships');
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [DEBUG] Loaded relationships from API:', data);
        setRelationships(data || []);
      }
    } catch (error) {
      console.error('Error loading relationships:', error);
      // Fallback to default relationships (only dependents, no Self)
      const fallbackData = [
        { relationshipCode: 'REL002', displayName: 'Spouse', sortOrder: 1 },
        { relationshipCode: 'REL003', displayName: 'Child', sortOrder: 2 },
        { relationshipCode: 'REL004', displayName: 'Father', sortOrder: 3 },
        { relationshipCode: 'REL005', displayName: 'Mother', sortOrder: 4 }
      ];
      console.log('🔍 [DEBUG] Using fallback relationships:', fallbackData);
      setRelationships(fallbackData);
    } finally {
      setRelationshipsLoading(false);
    }
  };

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await planConfigApi.get(policyId, parseInt(version));
      if (data) {
        setConfig(data);
      }
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };


  const handleSave = async () => {
    console.log('🔵 [EDIT SAVE DEBUG] Button clicked - handleSave started');
    console.log('🔵 [EDIT SAVE DEBUG] Policy ID:', policyId);
    console.log('🔵 [EDIT SAVE DEBUG] Version:', version);
    console.log('🔵 [EDIT SAVE DEBUG] Is New:', isNew);
    console.log('🔵 [EDIT SAVE DEBUG] Current config state:', JSON.stringify(config, null, 2));
    console.log('🔵 [EDIT SAVE DEBUG] Categories loaded:', categories.length);
    console.log('🔵 [EDIT SAVE DEBUG] Is Read Only:', isReadOnly);

    try {
      console.log('🔵 [EDIT SAVE DEBUG] Setting saving state to true');
      setSaving(true);

      if (isNew) {
        console.log('🔵 [EDIT SAVE DEBUG] Creating new configuration');
        const result = await planConfigApi.create(policyId, config);
        console.log('🔵 [EDIT SAVE DEBUG] Create result:', result);
        toast.success('Configuration created successfully');
      } else {
        console.log('🔵 [EDIT SAVE DEBUG] Updating existing configuration');

        // Filter out metadata fields for update - only send allowed fields
        const updateData = {
          benefits: config.benefits,
          wallet: config.wallet
        };

        console.log('🔵 [EDIT SAVE DEBUG] Filtered update data (removing metadata):', JSON.stringify(updateData, null, 2));
        console.log('🔵 [EDIT SAVE DEBUG] Calling planConfigApi.update with:', {
          policyId,
          version: parseInt(version),
          config: updateData
        });

        const result = await planConfigApi.update(policyId, parseInt(version), updateData);
        console.log('🔵 [EDIT SAVE DEBUG] Update result:', result);
        toast.success('Configuration saved successfully');
      }

      console.log('🔵 [EDIT SAVE DEBUG] Success toast shown, navigating to plan-config page');
      router.push(`/admin/policies/${policyId}/plan-config`);
      console.log('🔵 [EDIT SAVE DEBUG] Navigation initiated');

    } catch (error: any) {
      console.error('🔴 [EDIT SAVE DEBUG] Error occurred:', error);
      console.error('🔴 [EDIT SAVE DEBUG] Error details:', {
        message: error?.message,
        status: error?.status,
        response: error?.response,
        stack: error?.stack
      });

      if (error?.response) {
        console.error('🔴 [EDIT SAVE DEBUG] Response error details:', {
          data: error.response.data,
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers
        });
      }

      toast.error('Failed to save configuration');
    } finally {
      console.log('🔵 [EDIT SAVE DEBUG] Setting saving state to false');
      setSaving(false);
      console.log('🔵 [EDIT SAVE DEBUG] handleSave completed');
    }
  };

  const updateBenefit = (key: string, field: string, value: any) => {
    setConfig((prev: ExtendedPlanConfig) => {
      if (selectedRelationship === 'PRIMARY') {
        // Update primary member benefits
        return {
          ...prev,
          benefits: {
            ...prev.benefits,
            [key]: {
              enabled: prev.benefits?.[key]?.enabled || false,
              ...prev.benefits?.[key],
              [field]: value,
            },
          },
        } as ExtendedPlanConfig;
      } else {
        // Update specific relationship member benefits
        const newMemberConfigs = { ...prev.memberConfigs };
        const currentMemberConfig = newMemberConfigs[selectedRelationship] || {
          inheritFromPrimary: false,
          benefits: {},
          wallet: {}
        };

        newMemberConfigs[selectedRelationship] = {
          ...currentMemberConfig,
          benefits: {
            ...currentMemberConfig.benefits,
            [key]: {
              ...currentMemberConfig.benefits?.[key],
              [field]: value,
            },
          },
        };

        return {
          ...prev,
          memberConfigs: newMemberConfigs,
        } as ExtendedPlanConfig;
      }
    });
  };

  const updateWallet = (field: string, value: any) => {
    setConfig((prev: ExtendedPlanConfig) => {
      if (selectedRelationship === 'PRIMARY') {
        // Update primary member wallet
        return {
          ...prev,
          wallet: {
            ...prev.wallet,
            [field]: value,
          },
        };
      } else {
        // Update specific relationship member wallet
        const newMemberConfigs = { ...prev.memberConfigs };
        const currentMemberConfig = newMemberConfigs[selectedRelationship] || {
          inheritFromPrimary: false,
          benefits: {},
          wallet: {}
        };

        newMemberConfigs[selectedRelationship] = {
          ...currentMemberConfig,
          wallet: {
            ...currentMemberConfig.wallet,
            [field]: value,
          },
        };

        return {
          ...prev,
          memberConfigs: newMemberConfigs,
        } as ExtendedPlanConfig;
      }
    });
  };

  const updateCopay = (field: string, value: any) => {
    setConfig((prev: ExtendedPlanConfig) => {
      if (selectedRelationship === 'PRIMARY') {
        // Update primary member copay
        return {
          ...prev,
          wallet: {
            ...prev.wallet,
            copay: {
              ...prev.wallet?.copay,
              [field]: value,
            } as any,
          },
        };
      } else {
        // Update specific relationship member copay
        const newMemberConfigs = { ...prev.memberConfigs };
        const currentMemberConfig = newMemberConfigs[selectedRelationship] || {
          inheritFromPrimary: false,
          benefits: {},
          wallet: {}
        };

        newMemberConfigs[selectedRelationship] = {
          ...currentMemberConfig,
          wallet: {
            ...currentMemberConfig.wallet,
            copay: {
              ...currentMemberConfig.wallet?.copay,
              [field]: value,
            } as any,
          },
        };

        return {
          ...prev,
          memberConfigs: newMemberConfigs,
        } as ExtendedPlanConfig;
      }
    });
  };

  const updateCarryForward = (field: string, value: any) => {
    setConfig((prev: ExtendedPlanConfig) => {
      if (selectedRelationship === 'PRIMARY') {
        // Update primary member carry forward
        return {
          ...prev,
          wallet: {
            ...prev.wallet,
            carryForward: {
              ...prev.wallet?.carryForward,
              [field]: value,
            } as any,
          },
        };
      } else {
        // Update specific relationship member carry forward
        const newMemberConfigs = { ...prev.memberConfigs };
        const currentMemberConfig = newMemberConfigs[selectedRelationship] || {
          inheritFromPrimary: false,
          benefits: {},
          wallet: {}
        };

        newMemberConfigs[selectedRelationship] = {
          ...currentMemberConfig,
          wallet: {
            ...currentMemberConfig.wallet,
            carryForward: {
              ...currentMemberConfig.wallet?.carryForward,
              [field]: value,
            } as any,
          },
        };

        return {
          ...prev,
          memberConfigs: newMemberConfigs,
        } as ExtendedPlanConfig;
      }
    });
  };


  const toggleRelationship = (relationshipCode: string, enabled: boolean) => {
    setConfig((prev: ExtendedPlanConfig) => {
      const currentRelationships = prev.coveredRelationships || [];
      const newCoveredRelationships = enabled
        ? [...currentRelationships, relationshipCode]
        : currentRelationships.filter(code => code !== relationshipCode);

      // Initialize member config for newly enabled relationships
      const newMemberConfigs = { ...prev.memberConfigs };
      if (enabled && !newMemberConfigs[relationshipCode]) {
        newMemberConfigs[relationshipCode] = {
          inheritFromPrimary: true, // Default to inheriting from primary
          benefits: {},
          wallet: {}
        };
      }

      return {
        ...prev,
        coveredRelationships: newCoveredRelationships,
        memberConfigs: newMemberConfigs,
      };
    });
  };

  const updateMemberConfig = (relationshipCode: string, field: string, value: any) => {
    setConfig((prev: ExtendedPlanConfig) => ({
      ...prev,
      memberConfigs: {
        ...prev.memberConfigs,
        [relationshipCode]: {
          ...prev.memberConfigs?.[relationshipCode],
          [field]: value,
        },
      },
    }));
  };

  const toggleInheritance = (relationshipCode: string, inherit: boolean) => {
    setConfig((prev: ExtendedPlanConfig) => {
      const newMemberConfigs = { ...prev.memberConfigs };

      if (inherit) {
        // Copy primary member configuration
        const primaryConfig = newMemberConfigs['REL001'] || {};
        newMemberConfigs[relationshipCode] = {
          ...newMemberConfigs[relationshipCode],
          inheritFromPrimary: true,
          benefits: primaryConfig.benefits || prev.benefits || {},
          wallet: primaryConfig.wallet || prev.wallet || {}
        };
      } else {
        // Set to custom configuration
        newMemberConfigs[relationshipCode] = {
          ...newMemberConfigs[relationshipCode],
          inheritFromPrimary: false,
          benefits: {},
          wallet: {}
        };
      }

      return {
        ...prev,
        memberConfigs: newMemberConfigs,
      };
    });
  };

  // Helper functions to get relationship-specific data
  const getCurrentMemberConfig = () => {
    if (selectedRelationship === 'PRIMARY') {
      return null; // Primary member uses main config
    }
    return config.memberConfigs?.[selectedRelationship];
  };

  const getCurrentBenefits = () => {
    if (selectedRelationship === 'PRIMARY') {
      return config.benefits || {};
    }
    const memberConfig = getCurrentMemberConfig();
    return memberConfig?.benefits || {};
  };

  const getCurrentWallet = () => {
    if (selectedRelationship === 'PRIMARY') {
      return config.wallet || {};
    }
    const memberConfig = getCurrentMemberConfig();
    return memberConfig?.wallet || {};
  };


  const isCurrentMemberInheriting = () => {
    if (selectedRelationship === 'PRIMARY') {
      return false; // Primary member doesn't inherit
    }
    const memberConfig = getCurrentMemberConfig();
    return memberConfig?.inheritFromPrimary !== false; // Default to true
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading configuration...</div>
      </div>
    );
  }

  const isReadOnly = !isNew && config.status === 'PUBLISHED';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">
            {isNew ? 'New Configuration' : `Configuration v${version}`}
          </h1>
          {isReadOnly && (
            <span className="text-sm text-muted-foreground">(Read Only - Published)</span>
          )}
        </div>
        {!isReadOnly && (
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        )}
      </div>

      {/* Relationship Selector - Only show for Benefits and Wallet tabs */}
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
                onValueChange={setSelectedRelationship}
                disabled={isReadOnly}
              >
                <SelectTrigger id="relationship-selector" className="w-48 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* Primary Member Configuration (Always Available) */}
                  <SelectItem value="PRIMARY">
                    Primary Member (REL001)
                  </SelectItem>
                  {/* Show only enabled dependent relationships */}
                  {(config.coveredRelationships || []).map((relationshipCode) => {
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
            {/* Inheritance Toggle for relationships (not for primary) */}
            {selectedRelationship && selectedRelationship !== 'PRIMARY' && (
              <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
                <Label htmlFor="inherit-toggle" className="text-sm font-medium">
                  Inherit from Primary:
                </Label>
                <Switch
                  id="inherit-toggle"
                  checked={isCurrentMemberInheriting()}
                  onCheckedChange={(checked) => toggleInheritance(selectedRelationship, checked)}
                  disabled={isReadOnly}
                />
              </div>
            )}
          </div>
        </div>

        {/* Status indicator */}
        <div className="mt-3 text-sm">
          {selectedRelationship === 'PRIMARY' ? (
            <div className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">
              ⭐ Primary Member Configuration (REL001)
            </div>
          ) : selectedRelationship && isCurrentMemberInheriting() ? (
            <div className="text-green-600 bg-green-50 px-3 py-1 rounded-full inline-block">
              ✓ Inheriting from Primary Member
            </div>
          ) : selectedRelationship ? (
            <div className="text-orange-600 bg-orange-50 px-3 py-1 rounded-full inline-block">
              ⚙️ Custom Configuration
            </div>
          ) : (
            <div className="text-gray-600 bg-gray-50 px-3 py-1 rounded-full inline-block">
              Select a relationship to configure
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="coverage" className="space-y-4">
        <TabsList className="bg-white">
          <TabsTrigger value="coverage" className="data-[state=active]:bg-white data-[state=active]:text-black">Coverage</TabsTrigger>
          <TabsTrigger value="benefits" className="data-[state=active]:bg-white data-[state=active]:text-black">Benefits</TabsTrigger>
          <TabsTrigger value="wallet" className="data-[state=active]:bg-white data-[state=active]:text-black">Wallet</TabsTrigger>
        </TabsList>

        <TabsContent value="coverage">
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
                            checked={config.coveredRelationships?.includes(relationship.relationshipCode) || false}
                            onCheckedChange={(checked) => toggleRelationship(relationship.relationshipCode, checked)}
                            disabled={isReadOnly}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-sm text-blue-800">
                        <strong>Selected relationships:</strong> {(config.coveredRelationships || []).length === 0 ? 'None' : (config.coveredRelationships || []).join(', ')}
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

                    {(config.coveredRelationships || []).length === 0 ? (
                      <div className="text-center py-4 text-gray-500 border border-dashed border-gray-300 rounded">
                        Add relationships above to configure individual member settings
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {(config.coveredRelationships || []).map((relationshipCode) => {
                          const relationship = relationships.find(r => r.relationshipCode === relationshipCode);
                          const memberConfig = config.memberConfigs?.[relationshipCode];
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
                                    onCheckedChange={(checked) => toggleInheritance(relationshipCode, checked)}
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
        </TabsContent>

        <TabsContent value="benefits">
          <Card className="bg-white">
            <CardHeader className="bg-white">
              <CardTitle className="text-gray-900">
                Benefits Configuration
                {selectedRelationship !== 'PRIMARY' && (
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    for {relationships.find(r => r.relationshipCode === selectedRelationship)?.displayName || selectedRelationship}
                  </span>
                )}
              </CardTitle>
              {selectedRelationship !== 'PRIMARY' && isCurrentMemberInheriting() && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                  <div className="text-sm text-green-800">
                    <strong>Note:</strong> This relationship is inheriting benefits from the Primary Member.
                    Turn off "Inherit from Primary" above to create custom benefit configurations.
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6 bg-white">
              {categoriesLoading ? (
                <div className="text-center py-8 text-gray-600">
                  Loading categories...
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  No active categories found. Please create categories first.
                </div>
              ) : (
                categories.map((category) => {
                  const currentBenefits = getCurrentBenefits();
                  const benefit = currentBenefits[category.categoryId];
                  const isInheriting = isCurrentMemberInheriting();
                  const isDisabled = isReadOnly || (selectedRelationship !== 'PRIMARY' && isInheriting);

                  return (
                    <div key={category.categoryId} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="bg-white">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <Label htmlFor={`${category.categoryId}-enabled`} className="text-lg font-medium">
                              {category.name}
                            </Label>
                            <div className="text-sm text-gray-500 mt-1">
                              Category ID: {category.categoryId}
                            </div>
                            {selectedRelationship !== 'PRIMARY' && isInheriting && (
                              <div className="text-xs text-green-600 mt-1">
                                ✓ Inherited from Primary Member
                              </div>
                            )}
                          </div>
                          <Switch
                            id={`${category.categoryId}-enabled`}
                            checked={benefit?.enabled || false}
                            onCheckedChange={(checked) => updateBenefit(category.categoryId, 'enabled', checked)}
                            disabled={isDisabled}
                          />
                        </div>

                        {benefit?.enabled && (
                          <div className="space-y-4 pl-4">
                            <div>
                              <Label htmlFor={`${category.categoryId}-limit`}>Annual Limit (₹)</Label>
                              <Input
                                id={`${category.categoryId}-limit`}
                                type="number"
                                value={benefit.annualLimit || ''}
                                onChange={(e) => updateBenefit(category.categoryId, 'annualLimit', parseInt(e.target.value) || 0)}
                                disabled={isDisabled}
                                placeholder="Enter annual limit"
                                className="bg-white"
                              />
                            </div>

                            {(category as any).isAvailableOnline && (
                              <div className="flex items-center space-x-6">
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id={`${category.categoryId}-online`}
                                    checked={benefit.onlineEnabled || false}
                                    onCheckedChange={(checked) => updateBenefit(category.categoryId, 'onlineEnabled', checked)}
                                    disabled={isDisabled}
                                  />
                                  <Label htmlFor={`${category.categoryId}-online`}>Online</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id={`${category.categoryId}-offline`}
                                    checked={benefit.offlineEnabled || false}
                                    onCheckedChange={(checked) => updateBenefit(category.categoryId, 'offlineEnabled', checked)}
                                    disabled={isDisabled}
                                  />
                                  <Label htmlFor={`${category.categoryId}-offline`}>Offline</Label>
                                </div>
                              </div>
                            )}
                            {!(category as any).isAvailableOnline && (
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id={`${category.categoryId}-offline`}
                                  checked={benefit.offlineEnabled || false}
                                  onCheckedChange={(checked) => updateBenefit(category.categoryId, 'offlineEnabled', checked)}
                                  disabled={isDisabled}
                                />
                                <Label htmlFor={`${category.categoryId}-offline`}>Offline</Label>
                              </div>
                            )}

                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`${category.categoryId}-vas`}
                                checked={benefit.vasEnabled || false}
                                onCheckedChange={(checked) => updateBenefit(category.categoryId, 'vasEnabled', checked)}
                                disabled={isDisabled}
                              />
                              <Label htmlFor={`${category.categoryId}-vas`}>VAS Enabled</Label>
                            </div>

                            <div>
                              <Label htmlFor={`${category.categoryId}-notes`}>Notes</Label>
                              <Textarea
                                id={`${category.categoryId}-notes`}
                                value={benefit.notes || ''}
                                onChange={(e) => updateBenefit(category.categoryId, 'notes', e.target.value)}
                                disabled={isDisabled}
                                placeholder="Additional notes or conditions"
                                rows={2}
                                className="bg-white"
                              />
                            </div>

                            {category.description && (
                              <div className="text-sm text-gray-600 italic">
                                {category.description}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallet">
          <Card className="bg-white">
            <CardHeader className="bg-white">
              <CardTitle className="text-gray-900">
                Wallet Configuration
                {selectedRelationship !== 'PRIMARY' && (
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    for {relationships.find(r => r.relationshipCode === selectedRelationship)?.displayName || selectedRelationship}
                  </span>
                )}
              </CardTitle>
              {selectedRelationship !== 'PRIMARY' && isCurrentMemberInheriting() && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                  <div className="text-sm text-green-800">
                    <strong>Note:</strong> This relationship is inheriting wallet settings from the Primary Member.
                    Turn off "Inherit from Primary" above to create custom wallet configurations.
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6 bg-white">
              {(() => {
                const currentWallet = getCurrentWallet();
                const isInheriting = isCurrentMemberInheriting();
                const isDisabled = isReadOnly || (selectedRelationship !== 'PRIMARY' && isInheriting);

                return (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="total-amount">Total Annual Amount (₹)</Label>
                        <Input
                          id="total-amount"
                          type="number"
                          value={currentWallet?.totalAnnualAmount || ''}
                          onChange={(e) => updateWallet('totalAnnualAmount', parseInt(e.target.value) || 0)}
                          disabled={isDisabled}
                          className="bg-white"
                        />
                        {selectedRelationship !== 'PRIMARY' && isInheriting && (
                          <div className="text-xs text-green-600 mt-1">
                            ✓ Inherited from Primary Member
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="claim-limit">Per Claim Limit (₹)</Label>
                        <Input
                          id="claim-limit"
                          type="number"
                          value={currentWallet?.perClaimLimit || ''}
                          onChange={(e) => updateWallet('perClaimLimit', parseInt(e.target.value) || 0)}
                          disabled={isDisabled}
                          className="bg-white"
                        />
                        {selectedRelationship !== 'PRIMARY' && isInheriting && (
                          <div className="text-xs text-green-600 mt-1">
                            ✓ Inherited from Primary Member
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="bg-white">
                        <h4 className="font-medium mb-4 text-gray-900">Copay Settings</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="copay-mode">Copay Mode</Label>
                            <Select
                              value={currentWallet?.copay?.mode || 'PERCENT'}
                              onValueChange={(value) => updateCopay('mode', value)}
                              disabled={isDisabled}
                            >
                              <SelectTrigger id="copay-mode" className="bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PERCENT">Percentage</SelectItem>
                                <SelectItem value="AMOUNT">Fixed Amount</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="copay-value">
                              Copay Value {currentWallet?.copay?.mode === 'PERCENT' ? '(%)' : '(₹)'}
                            </Label>
                            <Input
                              id="copay-value"
                              type="number"
                              min="0"
                              step={currentWallet?.copay?.mode === 'PERCENT' ? "0.01" : "1"}
                              value={currentWallet?.copay?.value !== undefined ? currentWallet.copay.value : ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                                updateCopay('value', value);
                              }}
                              disabled={isDisabled}
                              className="bg-white"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="partial-payment"
                          checked={currentWallet?.partialPaymentEnabled || false}
                          onCheckedChange={(checked) => updateWallet('partialPaymentEnabled', checked)}
                          disabled={isDisabled}
                        />
                        <Label htmlFor="partial-payment">Enable Partial Payments</Label>
                        {selectedRelationship !== 'PRIMARY' && isInheriting && (
                          <span className="text-xs text-green-600 ml-2">
                            ✓ Inherited
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          id="topup"
                          checked={currentWallet?.topUpAllowed || false}
                          onCheckedChange={(checked) => updateWallet('topUpAllowed', checked)}
                          disabled={isDisabled}
                        />
                        <Label htmlFor="topup">Allow Top-ups</Label>
                        {selectedRelationship !== 'PRIMARY' && isInheriting && (
                          <span className="text-xs text-green-600 ml-2">
                            ✓ Inherited
                          </span>
                        )}
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="bg-white">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-gray-900">Carry Forward Settings</h4>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={currentWallet?.carryForward?.enabled || false}
                                onCheckedChange={(checked) => updateCarryForward('enabled', checked)}
                                disabled={isDisabled}
                              />
                              {selectedRelationship !== 'PRIMARY' && isInheriting && (
                                <span className="text-xs text-green-600">
                                  ✓ Inherited
                                </span>
                              )}
                            </div>
                          </div>

                          {currentWallet?.carryForward?.enabled && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="carry-percent">Carry Forward Percentage (%)</Label>
                                <Input
                                  id="carry-percent"
                                  type="number"
                                  value={currentWallet?.carryForward?.percent || ''}
                                  onChange={(e) => updateCarryForward('percent', parseInt(e.target.value) || 0)}
                                  disabled={isDisabled}
                                  className="bg-white"
                                />
                              </div>
                              <div>
                                <Label htmlFor="carry-months">Valid for (Months)</Label>
                                <Input
                                  id="carry-months"
                                  type="number"
                                  value={currentWallet?.carryForward?.months || ''}
                                  onChange={(e) => updateCarryForward('months', parseInt(e.target.value) || 0)}
                                  disabled={isDisabled}
                                  className="bg-white"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}