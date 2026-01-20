'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Eye, Trash2, CheckCircle, Send } from 'lucide-react';
import { planConfigApi, PlanConfig } from '@/lib/api/plan-config';
import { categoriesApi, Category } from '@/lib/api/categories';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function PlanConfigList() {
  const params = useParams();
  const router = useRouter();
  const policyId = params.id as string;

  const [configs, setConfigs] = useState<PlanConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfig, setDeleteConfig] = useState<PlanConfig | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await categoriesApi.getActive();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }, []);

  const loadConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await planConfigApi.getAll(policyId);
      setConfigs(data || []);
    } catch (error) {
      console.error('Error loading configs:', error);
      toast.error('Failed to load plan configurations');
    } finally {
      setLoading(false);
    }
  }, [policyId]);

  useEffect(() => {
    loadConfigs();
    loadCategories();
  }, [policyId, loadConfigs, loadCategories]);

  const handleCreate = () => {
    router.push(`/policies/${policyId}/plan-config/new`);
  };

  const handleEdit = (version: number) => {
    router.push(`/policies/${policyId}/plan-config/${version}`);
  };

  const handlePublish = async (version: number) => {
    try {
      await planConfigApi.publish(policyId, version);
      toast.success('Configuration published successfully');
      loadConfigs();
    } catch (error: any) {
      console.error('Publish error:', error);
      const errorMessage = error?.message || 'Failed to publish configuration';
      toast.error(errorMessage);
    }
  };

  const handleSetCurrent = async (version: number) => {
    try {
      await planConfigApi.setCurrent(policyId, version);
      toast.success('Configuration set as current');
      loadConfigs();
    } catch (error: any) {
      console.error('Set current error:', error);
      const errorMessage = error?.message || 'Failed to set as current';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfig) return;

    try {
      await planConfigApi.delete(policyId, deleteConfig.version);
      toast.success(`Configuration v${deleteConfig.version} deleted successfully`);
      setDeleteConfig(null);
      loadConfigs();
    } catch (error: any) {
      console.error('Delete error:', error);
      setDeleteConfig(null); // Close the dialog

      // Extract error message
      const errorMessage = error?.message || 'Failed to delete configuration';

      // Show specific error messages based on the error content
      if (errorMessage.includes('published configuration that is current')) {
        toast.error('Cannot delete a published configuration that is current. Please set another version as current first.');
      } else if (errorMessage.includes('assigned') || errorMessage.includes('user(s)') || errorMessage.includes('users')) {
        toast.error('Unable to delete this policy version because it is currently assigned to one or more users. Please unassign the version before deleting.');
      } else if (errorMessage.includes('Cannot delete')) {
        toast.error(errorMessage);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const getStatusBadge = (status: string, isCurrent: boolean) => {
    if (isCurrent) {
      return <Badge className="bg-green-500">Current</Badge>;
    }
    if (status === 'PUBLISHED') {
      return <Badge className="bg-blue-500">Published</Badge>;
    }
    return <Badge variant="secondary">Draft</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading configurations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Plan Configurations</h1>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Configuration
        </Button>
      </div>

      <Card className="bg-white">
        <CardHeader className="bg-white">
          <CardTitle className="text-gray-900">Version History</CardTitle>
        </CardHeader>
        <CardContent className="bg-white">
          {configs.length === 0 ? (
            <div className="text-center py-8 text-gray-600 bg-white">
              No configurations yet. Create your first configuration to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Benefits</TableHead>
                  <TableHead>Wallet Amount</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Modified</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config) => (
                  <TableRow key={config._id}>
                    <TableCell className="font-medium">v{config.version}</TableCell>
                    <TableCell>
                      {getStatusBadge(config.status, config.isCurrent)}
                    </TableCell>
                    <TableCell>
                      {Object.entries(config.benefits || {})
                        .filter(([_, b]) => b?.enabled)
                        .map(([categoryId]) => {
                          const category = categories.find(c => c.categoryId === categoryId);
                          return category ? category.name : categoryId;
                        })
                        .join(', ') || 'None'}
                    </TableCell>
                    <TableCell>
                      {config.wallet?.totalAnnualAmount
                        ? `₹${config.wallet.totalAnnualAmount.toLocaleString()}`
                        : 'Not set'}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        let count = 0;
                        const benefits = config.benefits || {};

                        // Count allowed specialties in consultation categories
                        if ((benefits as any).CAT001?.allowedSpecialties?.length) {
                          count += (benefits as any).CAT001.allowedSpecialties.length;
                        }
                        if ((benefits as any).CAT005?.allowedSpecialties?.length) {
                          count += (benefits as any).CAT005.allowedSpecialties.length;
                        }

                        // Count allowed lab service categories
                        if ((benefits as any).CAT003?.allowedLabServiceCategories?.length) {
                          count += (benefits as any).CAT003.allowedLabServiceCategories.length;
                        }
                        if ((benefits as any).CAT004?.allowedLabServiceCategories?.length) {
                          count += (benefits as any).CAT004.allowedLabServiceCategories.length;
                        }

                        // Count dental, vision, wellness
                        if ((benefits as any).CAT006?.allowedServiceCodes?.length) {
                          count += (benefits as any).CAT006.allowedServiceCodes.length;
                        }
                        if ((benefits as any).CAT007?.allowedServiceCodes?.length) {
                          count += (benefits as any).CAT007.allowedServiceCodes.length;
                        }
                        // CAT008 (wellness) uses ahcPackageId instead of allowedServiceCodes
                        if ((benefits as any).CAT008?.enabled && (benefits as any).CAT008?.ahcPackageId) {
                          count += 1;
                        }

                        return count || 0;
                      })()}
                    </TableCell>
                    <TableCell>
                      {new Date(config.updatedAt || '').toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {config.status === 'DRAFT' ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(config.version)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePublish(config.version)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeleteConfig(config)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(config.version)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {!config.isCurrent && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSetCurrent(config.version)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeleteConfig(config)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteConfig} onOpenChange={() => setDeleteConfig(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete version {deleteConfig?.version}?
              {deleteConfig?.isCurrent && (
                <span className="block mt-2 text-amber-600 font-medium">
                  ⚠️ This is the current configuration. Deletion will be blocked if this policy is assigned to any users.
                </span>
              )}
              <span className="block mt-2 text-gray-600">
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}