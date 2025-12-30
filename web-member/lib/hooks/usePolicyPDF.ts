import { useState } from 'react';
import { generatePolicyPDF } from '../utils/pdfGenerator';

export function usePolicyPDF() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePDF = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      // Fetch user profile data with policy and wallet information
      const profileResponse = await fetch('/api/member/profile', {
        credentials: 'include',
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to fetch profile data');
      }

      const profileData = await profileResponse.json();

      // Fetch wallet data
      const walletResponse = await fetch('/api/wallet/balance', {
        credentials: 'include',
      });

      if (!walletResponse.ok) {
        throw new Error('Failed to fetch wallet data');
      }

      const walletData = await walletResponse.json();

      // Extract policy information
      const user = profileData.user;
      // IMPORTANT: assignments are at profileData.assignments, not user.assignments
      const assignments = profileData.assignments;

      // Find the assignment for the current user (not just the first one)
      const userIdStr = user._id?.toString() || user.id?.toString();
      const assignment = assignments?.find((a: any) => {
        const assignmentUserIdStr = a.userId?.toString();
        return assignmentUserIdStr === userIdStr;
      });

      // The policy object is at assignment.assignment
      const policyAssignment = assignment?.assignment;

      if (!policyAssignment) {
        throw new Error('No policy found for this user');
      }

      // The actual policy details are in policyAssignment.policyId
      const policy = policyAssignment.policyId || policyAssignment;

      // Format policy holder name
      const policyHolder = user.name
        ? `${user.name.firstName} ${user.name.lastName}`.trim()
        : user.fullName || 'N/A';

      // Calculate age if DOB is available
      let age: number | undefined;
      if (user.dateOfBirth || user.dob) {
        const dob = new Date(user.dateOfBirth || user.dob);
        const today = new Date();
        age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
      }

      // Format valid till date
      const validTillDate = policyAssignment?.effectiveTo ||
                           policy?.effectiveTo;

      const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      };

      const validTill = validTillDate ? formatDate(validTillDate) : 'N/A';

      // Extract corporate name
      const corporate = policy.companyName ||
                       policy.company ||
                       user.corporateName ||
                       'Individual';

      // Prepare wallet data
      const totalWallet = {
        allocated: walletData.totalBalance?.allocated || 0,
        current: walletData.totalBalance?.current || 0,
        consumed: walletData.totalBalance?.consumed || 0,
      };

      // Prepare category balances
      const categoryBalances = (walletData.categories || []).map((cat: any) => ({
        categoryCode: cat.categoryCode || cat.code,
        categoryName: cat.name || cat.categoryName,
        allocated: cat.allocated || cat.total || 0,
        current: cat.current || cat.available || 0,
        consumed: cat.consumed || 0,
        isUnlimited: cat.isUnlimited || false,
      }));

      // Prepare health benefits
      const healthBenefits = (profileData.healthBenefits || []).map((benefit: any) => ({
        categoryCode: benefit.categoryCode,
        name: benefit.name,
        description: benefit.description || '',
      }));

      // Co-pay details (if available)
      const copayDetails = policy.copayPercentage
        ? `Co-pay: ${policy.copayPercentage}% of transaction amount`
        : undefined;

      // Generate PDF
      generatePolicyPDF({
        policy: {
          policyNumber: policy.policyNumber || 'N/A',
          policyHolder,
          age,
          corporate,
          validTill,
        },
        totalWallet,
        categoryBalances,
        healthBenefits,
        copayDetails,
      });

    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setError(err.message || 'Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generatePDF,
    isGenerating,
    error,
  };
}
