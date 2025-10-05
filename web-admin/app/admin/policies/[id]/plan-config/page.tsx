'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    loadConfigs();
    loadCategories();
  }, [policyId]);

  const loadCategories = async () => {
    try {
      const response = await categoriesApi.getActive();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadConfigs = async () => {
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
  };

  const handleCreate = () => {
    router.push(`/admin/policies/${policyId}/plan-config/new`);
  };

  const handleEdit = (version: number) => {
    router.push(`/admin/policies/${policyId}/plan-config/${version}`);
  };

  const handlePublish = async (version: number) => {
    try {
      await planConfigApi.publish(policyId, version);
      toast.success('Configuration published successfully');
      loadConfigs();
    } catch (error) {
      toast.error('Failed to publish configuration');
    }
  };

  const handleSetCurrent = async (version: number) => {
    try {
      await planConfigApi.setCurrent(policyId, version);
      toast.success('Configuration set as current');
      loadConfigs();
    } catch (error) {
      toast.error('Failed to set as current');
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

      // Check if it's a conflict error (assignment check failed)
      if (error?.message?.includes('assigned to') || error?.message?.includes('Cannot delete')) {
        toast.error(error.message || 'Cannot delete configuration - it is assigned to users');
      } else if (error?.message?.includes('current configuration')) {
        toast.error('Cannot delete current configuration that has active user assignments');
      } else {
        toast.error('Failed to delete configuration');
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
                    <TableCell>{(config as any).enabledServices?.length || 0}</TableCell>
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