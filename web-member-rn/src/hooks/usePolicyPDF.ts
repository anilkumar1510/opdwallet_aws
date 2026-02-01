import { useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
// Note: pdfGenerator is imported dynamically only on web to avoid native crashes

interface WalletCategory {
  categoryCode: string;
  name: string;
  available: number;
  total: number;
  consumed?: number;
  isUnlimited?: boolean;
}

interface WalletBalance {
  totalBalance: {
    allocated: number;
    current: number;
    consumed: number;
  };
  categories: WalletCategory[];
}

interface ProfileData {
  user: {
    _id: string;
    name?: {
      firstName: string;
      lastName: string;
    };
    fullName?: string;
    dateOfBirth?: string;
    dob?: string;
    corporateName?: string;
  };
  assignments?: Array<{
    userId: string;
    assignment: {
      effectiveTo?: string;
      policyId?: {
        policyNumber?: string;
        companyName?: string;
        company?: string;
        effectiveTo?: string;
        copayPercentage?: number;
      };
    };
  }>;
  healthBenefits?: Array<{
    categoryCode: string;
    name: string;
    description?: string;
  }>;
}

export function usePolicyPDF() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePDF = useCallback(async (
    profileData: ProfileData | null,
    walletData: WalletBalance | null
  ) => {
    // Only works on web platform (jsPDF requires browser APIs)
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Not Available',
        'PDF download is only available on web. Please use the web version to download your policy document.'
      );
      return;
    }

    if (!profileData) {
      const msg = 'Profile data not available. Please try again.';
      Alert.alert('Error', msg);
      setError(msg);
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      console.log('[PolicyPDF] Generating PDF with data:', { profileData, walletData });

      // Extract user info
      const user = profileData.user;
      const assignments = profileData.assignments;

      // Find the assignment for the current user
      const userIdStr = user._id?.toString();
      const assignment = assignments?.find((a: any) => {
        const assignmentUserIdStr = a.userId?.toString();
        return assignmentUserIdStr === userIdStr;
      });

      // The policy object is at assignment.assignment
      const policyAssignment = assignment?.assignment;
      // Cast to any to handle dynamic policy structure
      const policy: any = policyAssignment?.policyId || policyAssignment;

      // Format policy holder name
      const policyHolder = user.name
        ? `${user.name.firstName} ${user.name.lastName}`.trim()
        : user.fullName || 'N/A';

      // Calculate age if DOB is available
      let age: number | undefined;
      if (user.dateOfBirth || user.dob) {
        const dob = new Date(user.dateOfBirth || user.dob!);
        const today = new Date();
        age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
      }

      // Format valid till date
      const validTillDate = policyAssignment?.effectiveTo || policy?.effectiveTo;

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
      const corporate = policy?.companyName ||
                       policy?.company ||
                       user.corporateName ||
                       'Individual';

      // Prepare wallet data
      const totalWallet = {
        allocated: walletData?.totalBalance?.allocated || 0,
        current: walletData?.totalBalance?.current || 0,
        consumed: walletData?.totalBalance?.consumed || 0,
      };

      // Prepare category balances
      const categoryBalances = (walletData?.categories || []).map((cat: WalletCategory) => ({
        categoryCode: cat.categoryCode,
        categoryName: cat.name,
        allocated: cat.total || 0,
        current: cat.available || 0,
        consumed: cat.consumed || (cat.total - cat.available) || 0,
        isUnlimited: cat.isUnlimited || false,
      }));

      // Prepare health benefits
      const healthBenefits = (profileData.healthBenefits || []).map((benefit: any) => ({
        categoryCode: benefit.categoryCode,
        name: benefit.name,
        description: benefit.description || '',
      }));

      // Co-pay details (if available)
      const copayDetails = policy?.copayPercentage
        ? `Co-pay: ${policy.copayPercentage}% of transaction amount`
        : undefined;

      // Dynamically import pdfGenerator only on web
      const { generatePolicyPDF } = await import('../lib/utils/pdfGenerator');

      // Generate PDF
      generatePolicyPDF({
        policy: {
          policyNumber: policy?.policyNumber || 'N/A',
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

      console.log('[PolicyPDF] PDF generated successfully');

    } catch (err: any) {
      console.error('[PolicyPDF] Error generating PDF:', err);
      const errorMessage = err.message || 'Failed to generate PDF';
      setError(errorMessage);

      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    generatePDF,
    isGenerating,
    error,
  };
}
