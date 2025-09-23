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
import { servicesApi, Service } from '@/lib/api/services';
import { toast } from 'sonner';


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
  const [services, setServices] = useState<{ [categoryId: string]: Service[] }>({});
  const [servicesLoading, setServicesLoading] = useState(false);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [relationshipsLoading, setRelationshipsLoading] = useState(true);
  const [config, setConfig] = useState<Partial<PlanConfig>>({
    benefits: {},
    wallet: {
      totalAnnualAmount: 0,
      perClaimLimit: 0,
      copay: { mode: 'PERCENT', value: 0 },
      partialPaymentEnabled: false,
      carryForward: { enabled: false, percent: 0, months: 0 },
      topUpAllowed: false,
    },
    enabledServices: {},
    coveredRelationships: ['SELF'], // Array of enabled relationship codes - SELF is always included
    memberConfigs: {}, // Individual configurations per relationship
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

  // Load services when categories change
  useEffect(() => {
    if (categories.length > 0) {
      loadServicesForEnabledCategories();
    }
  }, [categories, config.benefits]);

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
        setRelationships(data || []);
      }
    } catch (error) {
      console.error('Error loading relationships:', error);
      // Fallback to default relationships
      setRelationships([
        { relationshipCode: 'SELF', displayName: 'Primary Member', sortOrder: 1 },
        { relationshipCode: 'SPOUSE', displayName: 'Spouse', sortOrder: 2 },
        { relationshipCode: 'CHILD', displayName: 'Child', sortOrder: 3 },
        { relationshipCode: 'PARENT', displayName: 'Parent', sortOrder: 4 }
      ]);
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

  const loadServicesForEnabledCategories = async () => {
    console.log('🟢 [SERVICES DEBUG] Loading services for enabled categories');

    if (!config.benefits) {
      console.log('🟢 [SERVICES DEBUG] No benefits configured yet');
      return;
    }

    const enabledCategories = Object.keys(config.benefits).filter(
      categoryId => config.benefits?.[categoryId]?.enabled
    );

    console.log('🟢 [SERVICES DEBUG] Enabled categories:', enabledCategories);

    if (enabledCategories.length === 0) {
      console.log('🟢 [SERVICES DEBUG] No categories enabled, clearing services');
      setServices({});
      return;
    }

    try {
      setServicesLoading(true);
      const servicesData: { [categoryId: string]: Service[] } = {};

      for (const categoryId of enabledCategories) {
        console.log('🟢 [SERVICES DEBUG] Loading services for category:', categoryId);
        try {
          const categoryServices = await servicesApi.getByCategory(categoryId);
          servicesData[categoryId] = categoryServices || [];
          console.log('🟢 [SERVICES DEBUG] Loaded services for', categoryId, ':', categoryServices);
        } catch (error) {
          console.error('🟢 [SERVICES DEBUG] Error loading services for category', categoryId, ':', error);
          servicesData[categoryId] = [];
        }
      }

      console.log('🟢 [SERVICES DEBUG] All services loaded:', servicesData);
      setServices(servicesData);

    } catch (error) {
      console.error('🟢 [SERVICES DEBUG] Error loading services:', error);
      toast.error('Failed to load services');
    } finally {
      setServicesLoading(false);
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
          wallet: config.wallet,
          enabledServices: config.enabledServices,
          coveredRelationships: config.coveredRelationships,
          memberConfigs: config.memberConfigs
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

    } catch (error) {
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
    setConfig(prev => ({
      ...prev,
      benefits: {
        ...prev.benefits,
        [key]: {
          ...prev.benefits?.[key as keyof typeof prev.benefits],
          [field]: value,
        },
      },
    }));
  };

  const updateWallet = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      wallet: {
        ...prev.wallet,
        [field]: value,
      },
    }));
  };

  const updateCopay = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      wallet: {
        ...prev.wallet,
        copay: {
          ...prev.wallet?.copay,
          [field]: value,
        } as any,
      },
    }));
  };

  const updateCarryForward = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      wallet: {
        ...prev.wallet,
        carryForward: {
          ...prev.wallet?.carryForward,
          [field]: value,
        } as any,
      },
    }));
  };

  const updateService = (serviceCode: string, enabled: boolean) => {
    console.log('🟢 [SERVICE UPDATE DEBUG] Updating service:', serviceCode, 'enabled:', enabled);

    setConfig(prev => {
      const newEnabledServices = { ...prev.enabledServices };

      if (enabled) {
        newEnabledServices[serviceCode] = { enabled: true };
      } else {
        delete newEnabledServices[serviceCode];
      }

      console.log('🟢 [SERVICE UPDATE DEBUG] New enabled services:', newEnabledServices);

      return {
        ...prev,
        enabledServices: newEnabledServices,
      };
    });
  };

  const toggleRelationship = (relationshipCode: string, enabled: boolean) => {
    // Prevent disabling SELF relationship
    if (relationshipCode === 'SELF') {
      return;
    }

    setConfig(prev => {
      const currentRelationships = prev.coveredRelationships || ['SELF'];
      const newCoveredRelationships = enabled
        ? [...currentRelationships, relationshipCode]
        : currentRelationships.filter(code => code !== relationshipCode);

      // Ensure SELF is always included
      if (!newCoveredRelationships.includes('SELF')) {
        newCoveredRelationships.unshift('SELF');
      }

      // Initialize member config for newly enabled relationships
      const newMemberConfigs = { ...prev.memberConfigs };
      if (enabled && !newMemberConfigs[relationshipCode]) {
        newMemberConfigs[relationshipCode] = {
          inheritFromPrimary: true, // Default to inheriting from primary
          benefits: {},
          wallet: {},
          enabledServices: {}
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
    setConfig(prev => ({
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
    setConfig(prev => {
      const newMemberConfigs = { ...prev.memberConfigs };

      if (inherit) {
        // Copy primary member configuration
        const primaryConfig = newMemberConfigs['SELF'] || {};
        newMemberConfigs[relationshipCode] = {
          ...newMemberConfigs[relationshipCode],
          inheritFromPrimary: true,
          benefits: primaryConfig.benefits || prev.benefits || {},
          wallet: primaryConfig.wallet || prev.wallet || {},
          enabledServices: primaryConfig.enabledServices || prev.enabledServices || {}
        };
      } else {
        // Set to custom configuration
        newMemberConfigs[relationshipCode] = {
          ...newMemberConfigs[relationshipCode],
          inheritFromPrimary: false,
          benefits: {},
          wallet: {},
          enabledServices: {}
        };
      }

      return {
        ...prev,
        memberConfigs: newMemberConfigs,
      };
    });
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

      <Tabs defaultValue="coverage" className="space-y-4">
        <TabsList className="bg-white">
          <TabsTrigger value="coverage" className="data-[state=active]:bg-white data-[state=active]:text-black">Coverage</TabsTrigger>
          <TabsTrigger value="benefits" className="data-[state=active]:bg-white data-[state=active]:text-black">Benefits</TabsTrigger>
          <TabsTrigger value="wallet" className="data-[state=active]:bg-white data-[state=active]:text-black">Wallet</TabsTrigger>
          <TabsTrigger value="services" className="data-[state=active]:bg-white data-[state=active]:text-black">Services</TabsTrigger>
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
                            checked={relationship.relationshipCode === 'SELF' ? true : (config.coveredRelationships?.includes(relationship.relationshipCode) || false)}
                            onCheckedChange={(checked) => toggleRelationship(relationship.relationshipCode, checked)}
                            disabled={isReadOnly || relationship.relationshipCode === 'SELF'} // SELF is always enabled
                          />
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-sm text-blue-800">
                        <strong>Selected relationships:</strong> {(config.coveredRelationships || []).length === 0 ? 'None' : (config.coveredRelationships || []).join(', ')}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        Note: Primary Member (SELF) is always included and cannot be disabled.
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <h4 className="font-medium mb-4 text-gray-900">Individual Member Configuration</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Configure benefits and wallet settings for each covered relationship. You can choose to inherit from primary member or create custom configurations.
                    </p>

                    {(config.coveredRelationships || ['SELF']).length === 1 ? (
                      <div className="text-center py-4 text-gray-500 border border-dashed border-gray-300 rounded">
                        Add more relationships above to configure individual member settings
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {(config.coveredRelationships || ['SELF']).map((relationshipCode) => {
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

                                {relationshipCode !== 'SELF' && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Inherit from Primary:</span>
                                    <Switch
                                      checked={isInheriting}
                                      onCheckedChange={(checked) => toggleInheritance(relationshipCode, checked)}
                                      disabled={isReadOnly}
                                    />
                                  </div>
                                )}
                              </div>

                              {relationshipCode === 'SELF' && (
                                <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                                  This is the primary member configuration. Other relationships can inherit from this.
                                </div>
                              )}

                              {relationshipCode !== 'SELF' && isInheriting && (
                                <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                                  ✓ Inheriting all settings from Primary Member (SELF)
                                </div>
                              )}

                              {relationshipCode !== 'SELF' && !isInheriting && (
                                <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                                  ⚙️ Custom configuration - Settings will be defined individually for this relationship
                                </div>
                              )}

                              {/* Copy Configuration Button */}
                              {relationshipCode !== 'SELF' && !isInheriting && (
                                <div className="mt-3 flex gap-2">
                                  <button
                                    onClick={() => toggleInheritance(relationshipCode, true)}
                                    className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                    disabled={isReadOnly}
                                  >
                                    Copy from Primary Member
                                  </button>
                                  <button
                                    onClick={() => {
                                      // Copy from spouse if available
                                      const spouseConfig = config.memberConfigs?.['SPOUSE'];
                                      if (spouseConfig && relationshipCode !== 'SPOUSE') {
                                        updateMemberConfig(relationshipCode, 'benefits', spouseConfig.benefits);
                                        updateMemberConfig(relationshipCode, 'wallet', spouseConfig.wallet);
                                        updateMemberConfig(relationshipCode, 'enabledServices', spouseConfig.enabledServices);
                                      }
                                    }}
                                    className="text-sm px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                                    disabled={isReadOnly || !config.memberConfigs?.['SPOUSE'] || relationshipCode === 'SPOUSE'}
                                  >
                                    Copy from Spouse
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="text-sm text-yellow-800">
                            <strong>Note:</strong> Individual configurations for benefits, wallet settings, and services will be available in their respective tabs once relationships are configured here.
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
              <CardTitle className="text-gray-900">Benefits Configuration</CardTitle>
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
                  const benefit = config.benefits?.[category.categoryId as keyof typeof config.benefits];
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
                          </div>
                          <Switch
                            id={`${category.categoryId}-enabled`}
                            checked={benefit?.enabled || false}
                            onCheckedChange={(checked) => updateBenefit(category.categoryId, 'enabled', checked)}
                            disabled={isReadOnly}
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
                                disabled={isReadOnly}
                                placeholder="Enter annual limit"
                                className="bg-white"
                              />
                            </div>

                            <div>
                              <Label htmlFor={`${category.categoryId}-notes`}>Notes</Label>
                              <Textarea
                                id={`${category.categoryId}-notes`}
                                value={benefit.notes || ''}
                                onChange={(e) => updateBenefit(category.categoryId, 'notes', e.target.value)}
                                disabled={isReadOnly}
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
              <CardTitle className="text-gray-900">Wallet Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 bg-white">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="total-amount">Total Annual Amount (₹)</Label>
                  <Input
                    id="total-amount"
                    type="number"
                    value={config.wallet?.totalAnnualAmount || ''}
                    onChange={(e) => updateWallet('totalAnnualAmount', parseInt(e.target.value) || 0)}
                    disabled={isReadOnly}
                    className="bg-white"
                  />
                </div>

                <div>
                  <Label htmlFor="claim-limit">Per Claim Limit (₹)</Label>
                  <Input
                    id="claim-limit"
                    type="number"
                    value={config.wallet?.perClaimLimit || ''}
                    onChange={(e) => updateWallet('perClaimLimit', parseInt(e.target.value) || 0)}
                    disabled={isReadOnly}
                    className="bg-white"
                  />
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="bg-white">
                  <h4 className="font-medium mb-4 text-gray-900">Copay Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="copay-mode">Copay Mode</Label>
                      <Select
                        value={config.wallet?.copay?.mode || 'PERCENT'}
                        onValueChange={(value) => updateCopay('mode', value)}
                        disabled={isReadOnly}
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
                        Copay Value {config.wallet?.copay?.mode === 'PERCENT' ? '(%)' : '(₹)'}
                      </Label>
                      <Input
                        id="copay-value"
                        type="number"
                        value={config.wallet?.copay?.value || ''}
                        onChange={(e) => updateCopay('value', parseInt(e.target.value) || 0)}
                        disabled={isReadOnly}
                        className="bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="partial-payment"
                    checked={config.wallet?.partialPaymentEnabled || false}
                    onCheckedChange={(checked) => updateWallet('partialPaymentEnabled', checked)}
                    disabled={isReadOnly}
                  />
                  <Label htmlFor="partial-payment">Enable Partial Payments</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="topup"
                    checked={config.wallet?.topUpAllowed || false}
                    onCheckedChange={(checked) => updateWallet('topUpAllowed', checked)}
                    disabled={isReadOnly}
                  />
                  <Label htmlFor="topup">Allow Top-ups</Label>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Carry Forward Settings</h4>
                      <Switch
                        checked={config.wallet?.carryForward?.enabled || false}
                        onCheckedChange={(checked) => updateCarryForward('enabled', checked)}
                        disabled={isReadOnly}
                      />
                    </div>

                    {config.wallet?.carryForward?.enabled && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="carry-percent">Carry Forward Percentage (%)</Label>
                          <Input
                            id="carry-percent"
                            type="number"
                            value={config.wallet?.carryForward?.percent || ''}
                            onChange={(e) => updateCarryForward('percent', parseInt(e.target.value) || 0)}
                            disabled={isReadOnly}
                            className="bg-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="carry-months">Valid for (Months)</Label>
                          <Input
                            id="carry-months"
                            type="number"
                            value={config.wallet?.carryForward?.months || ''}
                            onChange={(e) => updateCarryForward('months', parseInt(e.target.value) || 0)}
                            disabled={isReadOnly}
                            className="bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card className="bg-white">
            <CardHeader className="bg-white">
              <CardTitle className="text-gray-900">Services Configuration</CardTitle>
              <p className="text-sm text-gray-600">
                Services are automatically loaded based on enabled categories in the Benefits tab.
              </p>
            </CardHeader>
            <CardContent className="space-y-6 bg-white">
              {servicesLoading ? (
                <div className="text-center py-8 text-gray-600">
                  Loading services...
                </div>
              ) : Object.keys(services).length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  No services available. Please enable categories in the Benefits tab first.
                </div>
              ) : (
                Object.entries(services).map(([categoryId, categoryServices]) => {
                  const category = categories.find(cat => cat.categoryId === categoryId);

                  return (
                    <div key={categoryId} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="bg-white">
                        <div className="mb-4">
                          <h4 className="text-lg font-medium text-gray-900">
                            {category?.name || categoryId}
                          </h4>
                          <div className="text-sm text-gray-500 mt-1">
                            Category ID: {categoryId} • {categoryServices.length} service(s) available
                          </div>
                        </div>

                        {categoryServices.length === 0 ? (
                          <div className="text-center py-4 text-gray-500">
                            No services found for this category.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {categoryServices.map((service) => (
                              <div key={service.code} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <div>
                                      <div className="font-medium text-gray-900">
                                        {service.name}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        Code: {service.code}
                                        {service.description && ` • ${service.description}`}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <Switch
                                  checked={config.enabledServices?.[service.code]?.enabled || false}
                                  onCheckedChange={(checked) => updateService(service.code, checked)}
                                  disabled={isReadOnly}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {Object.keys(services).length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-800">
                    <strong>Total enabled services:</strong> {Object.keys(config.enabledServices || {}).length}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Enabled services: {Object.keys(config.enabledServices || {}).join(', ') || 'None'}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}