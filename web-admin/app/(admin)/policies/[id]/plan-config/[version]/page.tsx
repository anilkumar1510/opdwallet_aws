'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { RelationshipSelector } from './components/RelationshipSelector';
import { BenefitsConfigTab } from './components/BenefitsConfigTab';
import { WalletConfigTab } from './components/WalletConfigTab';
import { CoverageConfigTab } from './components/CoverageConfigTab';

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

const getInitialConfig = (): ExtendedPlanConfig => ({
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

const getFallbackRelationships = () => [
  { relationshipCode: 'REL002', displayName: 'Spouse', sortOrder: 1 },
  { relationshipCode: 'REL003', displayName: 'Child', sortOrder: 2 },
  { relationshipCode: 'REL004', displayName: 'Father', sortOrder: 3 },
  { relationshipCode: 'REL005', displayName: 'Mother', sortOrder: 4 }
];

// Helper functions for updating config
const updatePrimaryBenefitHelper = (prev: ExtendedPlanConfig, key: string, field: string, value: any) => {
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
};

const updateMemberBenefitHelper = (prev: ExtendedPlanConfig, relationshipCode: string, key: string, field: string, value: any) => {
  const newMemberConfigs = { ...prev.memberConfigs };
  const currentMemberConfig = newMemberConfigs[relationshipCode] || {
    inheritFromPrimary: false,
    benefits: {},
    wallet: {}
  };

  newMemberConfigs[relationshipCode] = {
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
};

const updatePrimaryWalletHelper = (prev: ExtendedPlanConfig, field: string, value: any) => {
  return {
    ...prev,
    wallet: {
      ...prev.wallet,
      [field]: value,
    },
  };
};

const updateMemberWalletHelper = (prev: ExtendedPlanConfig, relationshipCode: string, field: string, value: any) => {
  const newMemberConfigs = { ...prev.memberConfigs };
  const currentMemberConfig = newMemberConfigs[relationshipCode] || {
    inheritFromPrimary: false,
    benefits: {},
    wallet: {}
  };

  newMemberConfigs[relationshipCode] = {
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
};

const updatePrimaryCopayHelper = (prev: ExtendedPlanConfig, field: string, value: any) => {
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
};

const updateMemberCopayHelper = (prev: ExtendedPlanConfig, relationshipCode: string, field: string, value: any) => {
  const newMemberConfigs = { ...prev.memberConfigs };
  const currentMemberConfig = newMemberConfigs[relationshipCode] || {
    inheritFromPrimary: false,
    benefits: {},
    wallet: {}
  };

  newMemberConfigs[relationshipCode] = {
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
};

const updatePrimaryCarryForwardHelper = (prev: ExtendedPlanConfig, field: string, value: any) => {
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
};

const updateMemberCarryForwardHelper = (prev: ExtendedPlanConfig, relationshipCode: string, field: string, value: any) => {
  const newMemberConfigs = { ...prev.memberConfigs };
  const currentMemberConfig = newMemberConfigs[relationshipCode] || {
    inheritFromPrimary: false,
    benefits: {},
    wallet: {}
  };

  newMemberConfigs[relationshipCode] = {
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
};

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
  const [selectedRelationship, setSelectedRelationship] = useState<string>('PRIMARY');
  const [config, setConfig] = useState<ExtendedPlanConfig>(getInitialConfig());

  const loadCategories = useCallback(async () => {
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
  }, []);

  const loadRelationships = useCallback(async () => {
    try {
      setRelationshipsLoading(true);
      const response = await fetch('/api/relationships');
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [DEBUG] Loaded relationships from API:', data);
        setRelationships(data || []);
      }
    } catch (error) {
      console.error('Error loading relationships:', error);
      const fallbackData = getFallbackRelationships();
      console.log('🔍 [DEBUG] Using fallback relationships:', fallbackData);
      setRelationships(fallbackData);
    } finally {
      setRelationshipsLoading(false);
    }
  }, []);

  const loadConfig = useCallback(async () => {
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
  }, [policyId, version]);

  useEffect(() => {
    loadCategories();
    loadRelationships();
    if (!isNew) {
      loadConfig();
    } else {
      setLoading(false);
    }
  }, [policyId, version, isNew, loadCategories, loadRelationships, loadConfig]);

  const logSaveAttempt = () => {
    console.log('🔵 [EDIT SAVE DEBUG] Button clicked - handleSave started');
    console.log('🔵 [EDIT SAVE DEBUG] Policy ID:', policyId);
    console.log('🔵 [EDIT SAVE DEBUG] Version:', version);
    console.log('🔵 [EDIT SAVE DEBUG] Is New:', isNew);
    console.log('🔵 [EDIT SAVE DEBUG] Current config state:', JSON.stringify(config, null, 2));
    console.log('🔵 [EDIT SAVE DEBUG] Categories loaded:', categories.length);
    console.log('🔵 [EDIT SAVE DEBUG] Is Read Only:', isReadOnly);
  };

  const logSaveError = (error: any) => {
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
  };

  const saveNewConfiguration = async () => {
    console.log('🔵 [EDIT SAVE DEBUG] Creating new configuration');
    const result = await planConfigApi.create(policyId, config);
    console.log('🔵 [EDIT SAVE DEBUG] Create result:', result);
    toast.success('Configuration created successfully');
  };

  const updateExistingConfiguration = async () => {
    console.log('🔵 [EDIT SAVE DEBUG] Updating existing configuration');

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
  };

  const handleSave = async () => {
    logSaveAttempt();

    try {
      console.log('🔵 [EDIT SAVE DEBUG] Setting saving state to true');
      setSaving(true);

      if (isNew) {
        await saveNewConfiguration();
      } else {
        await updateExistingConfiguration();
      }

      console.log('🔵 [EDIT SAVE DEBUG] Success toast shown, navigating to plan-config page');
      router.push(`/policies/${policyId}/plan-config`);
      console.log('🔵 [EDIT SAVE DEBUG] Navigation initiated');

    } catch (error: any) {
      logSaveError(error);
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
        return updatePrimaryBenefitHelper(prev, key, field, value);
      } else {
        return updateMemberBenefitHelper(prev, selectedRelationship, key, field, value);
      }
    });
  };

  const updateWallet = (field: string, value: any) => {
    setConfig((prev: ExtendedPlanConfig) => {
      if (selectedRelationship === 'PRIMARY') {
        return updatePrimaryWalletHelper(prev, field, value);
      } else {
        return updateMemberWalletHelper(prev, selectedRelationship, field, value);
      }
    });
  };

  const updateCopay = (field: string, value: any) => {
    setConfig((prev: ExtendedPlanConfig) => {
      if (selectedRelationship === 'PRIMARY') {
        return updatePrimaryCopayHelper(prev, field, value);
      } else {
        return updateMemberCopayHelper(prev, selectedRelationship, field, value);
      }
    });
  };

  const updateCarryForward = (field: string, value: any) => {
    setConfig((prev: ExtendedPlanConfig) => {
      if (selectedRelationship === 'PRIMARY') {
        return updatePrimaryCarryForwardHelper(prev, field, value);
      } else {
        return updateMemberCarryForwardHelper(prev, selectedRelationship, field, value);
      }
    });
  };


  const updateCoveredRelationships = (currentRelationships: string[], relationshipCode: string, enabled: boolean) => {
    if (enabled) {
      return [...currentRelationships, relationshipCode];
    }
    return currentRelationships.filter(code => code !== relationshipCode);
  };

  const initializeMemberConfig = (memberConfigs: any, relationshipCode: string, enabled: boolean) => {
    const newMemberConfigs = { ...memberConfigs };

    if (enabled && !newMemberConfigs[relationshipCode]) {
      newMemberConfigs[relationshipCode] = {
        inheritFromPrimary: true,
        benefits: {},
        wallet: {}
      };
    }

    return newMemberConfigs;
  };

  const toggleRelationship = (relationshipCode: string, enabled: boolean) => {
    setConfig((prev: ExtendedPlanConfig) => {
      const currentRelationships = prev.coveredRelationships || [];
      const newCoveredRelationships = updateCoveredRelationships(currentRelationships, relationshipCode, enabled);
      const newMemberConfigs = initializeMemberConfig(prev.memberConfigs, relationshipCode, enabled);

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

  const createInheritedConfig = (prev: ExtendedPlanConfig, relationshipCode: string) => {
    const newMemberConfigs = { ...prev.memberConfigs };
    const primaryConfig = newMemberConfigs['REL001'] || {};

    newMemberConfigs[relationshipCode] = {
      ...newMemberConfigs[relationshipCode],
      inheritFromPrimary: true,
      benefits: primaryConfig.benefits || prev.benefits || {},
      wallet: primaryConfig.wallet || prev.wallet || {}
    };

    return { ...prev, memberConfigs: newMemberConfigs };
  };

  const createCustomConfig = (prev: ExtendedPlanConfig, relationshipCode: string) => {
    const newMemberConfigs = { ...prev.memberConfigs };

    newMemberConfigs[relationshipCode] = {
      ...newMemberConfigs[relationshipCode],
      inheritFromPrimary: false,
      benefits: {},
      wallet: {}
    };

    return { ...prev, memberConfigs: newMemberConfigs };
  };

  const toggleInheritance = (relationshipCode: string, inherit: boolean) => {
    setConfig((prev: ExtendedPlanConfig) => {
      if (inherit) {
        return createInheritedConfig(prev, relationshipCode);
      } else {
        return createCustomConfig(prev, relationshipCode);
      }
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

      <RelationshipSelector
        selectedRelationship={selectedRelationship}
        onRelationshipChange={setSelectedRelationship}
        relationships={relationships}
        coveredRelationships={config.coveredRelationships || []}
        isCurrentMemberInheriting={isCurrentMemberInheriting()}
        onToggleInheritance={toggleInheritance}
        isReadOnly={isReadOnly}
      />

      <Tabs defaultValue="coverage" className="space-y-4">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="coverage" className="text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:font-semibold">Coverage</TabsTrigger>
          <TabsTrigger value="benefits" className="text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:font-semibold">Benefits</TabsTrigger>
          <TabsTrigger value="wallet" className="text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:font-semibold">Wallet</TabsTrigger>
        </TabsList>

        <TabsContent value="coverage">
          <CoverageConfigTab
            relationships={relationships}
            relationshipsLoading={relationshipsLoading}
            coveredRelationships={config.coveredRelationships || []}
            memberConfigs={config.memberConfigs || {}}
            isReadOnly={isReadOnly}
            onToggleRelationship={toggleRelationship}
            onToggleInheritance={toggleInheritance}
          />
        </TabsContent>

        <TabsContent value="benefits">
          <BenefitsConfigTab
            categories={categories}
            categoriesLoading={categoriesLoading}
            currentBenefits={getCurrentBenefits()}
            isInheriting={isCurrentMemberInheriting()}
            isReadOnly={isReadOnly}
            selectedRelationship={selectedRelationship}
            relationships={relationships}
            onUpdateBenefit={updateBenefit}
          />
        </TabsContent>

        <TabsContent value="wallet">
          <WalletConfigTab
            currentWallet={getCurrentWallet()}
            isInheriting={isCurrentMemberInheriting()}
            isReadOnly={isReadOnly}
            selectedRelationship={selectedRelationship}
            relationships={relationships}
            onUpdateWallet={updateWallet}
            onUpdateCopay={updateCopay}
            onUpdateCarryForward={updateCarryForward}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}