'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

interface AssignPolicyModalProps {
  showModal: boolean;
  policies: any[];
  relationships: any[];
  members: any[];
  planConfigs: any[];
  selectedPolicyId: string;
  selectedRelationshipId: string;
  selectedPrimaryMemberId: string;
  selectedPlanConfigId: string;
  effectiveFrom: string;
  effectiveTo: string;
  onPolicyChange: (policyId: string) => void;
  onRelationshipChange: (relationshipId: string) => void;
  onPrimaryMemberChange: (memberId: string) => void;
  onPlanConfigChange: (configId: string) => void;
  onEffectiveFromChange: (date: string) => void;
  onEffectiveToChange: (date: string) => void;
  onClose: () => void;
  onAssign: () => void;
}

export function AssignPolicyModal({
  showModal,
  policies,
  relationships,
  members,
  planConfigs,
  selectedPolicyId,
  selectedRelationshipId,
  selectedPrimaryMemberId,
  selectedPlanConfigId,
  effectiveFrom,
  effectiveTo,
  onPolicyChange,
  onRelationshipChange,
  onPrimaryMemberChange,
  onPlanConfigChange,
  onEffectiveFromChange,
  onEffectiveToChange,
  onClose,
  onAssign
}: AssignPolicyModalProps) {
  // Primary member search state
  const [primaryMemberSearch, setPrimaryMemberSearch] = useState('');
  const [primaryMemberResults, setPrimaryMemberResults] = useState<any[]>([]);
  const [searchingPrimary, setSearchingPrimary] = useState(false);
  const [selectedPrimaryMember, setSelectedPrimaryMember] = useState<any>(null);

  // Debounced search (300ms delay)
  const debouncedSearchTerm = useDebounce(primaryMemberSearch, 300);

  // Search for primary members when search term changes
  useEffect(() => {
    const searchPrimaryMembers = async () => {
      // Clear results if search term is too short
      if (debouncedSearchTerm.length < 2) {
        setPrimaryMemberResults([]);
        setSearchingPrimary(false);
        return;
      }

      // Don't search if no policy is selected
      if (!selectedPolicyId) {
        setPrimaryMemberResults([]);
        return;
      }

      setSearchingPrimary(true);
      try {
        const response = await fetch(
          `/api/assignments/search-primary-members?policyId=${selectedPolicyId}&search=${encodeURIComponent(debouncedSearchTerm)}`,
          { credentials: 'include' }
        );

        if (response.ok) {
          const results = await response.json();
          setPrimaryMemberResults(results);
        } else {
          setPrimaryMemberResults([]);
        }
      } catch (error) {
        console.error('Failed to search primary members:', error);
        setPrimaryMemberResults([]);
      } finally {
        setSearchingPrimary(false);
      }
    };

    searchPrimaryMembers();
  }, [debouncedSearchTerm, selectedPolicyId]);

  // Reset search when policy changes
  useEffect(() => {
    setPrimaryMemberSearch('');
    setPrimaryMemberResults([]);
    setSelectedPrimaryMember(null);
    onPrimaryMemberChange(''); // Clear parent state
  }, [selectedPolicyId, onPrimaryMemberChange]);

  // Handler for selecting a primary member from search results
  const selectPrimaryMember = (member: any) => {
    setSelectedPrimaryMember(member);
    onPrimaryMemberChange(member.memberId);

    // Format display name
    const memberName = typeof member.name === 'string'
      ? member.name
      : member.name?.fullName ||
        `${member.name?.firstName || ''} ${member.name?.lastName || ''}`.trim() ||
        'Unknown';

    setPrimaryMemberSearch(`${memberName} (${member.memberId})`);
    setPrimaryMemberResults([]);
  };

  if (!showModal) {
    return null;
  }

  return (
    <div className="modal">
      <button
        type="button"
        className="modal-backdrop border-0 p-0 cursor-default"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="text-lg font-semibold">Assign Policy</h3>
        </div>
        <div className="modal-body space-y-4">
          <div>
            <label className="label">Select Policy</label>
            <select
              className="input"
              value={selectedPolicyId}
              onChange={(e) => onPolicyChange(e.target.value)}
            >
              <option value="">Choose a policy...</option>
              {policies.map((policy) => (
                <option key={policy._id} value={policy._id}>
                  {policy.name} - {policy.policyNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Relationship *</label>
            <select
              className="input"
              value={selectedRelationshipId}
              onChange={(e) => onRelationshipChange(e.target.value)}
              required
            >
              <option value="">Choose relationship...</option>
              {relationships.map((rel) => (
                <option key={rel.relationshipCode} value={rel.relationshipCode}>
                  {rel.displayName} ({rel.relationshipCode})
                </option>
              ))}
            </select>
          </div>

          {selectedRelationshipId && selectedRelationshipId !== 'REL001' && (
            <div>
              <label htmlFor="primary-member-search" className="block text-sm font-medium text-gray-700 mb-1">
                Primary Member *
              </label>

              <div className="relative">
                {/* Search Input */}
                <input
                  id="primary-member-search"
                  type="text"
                  placeholder="Search by Member ID, Name, Employee ID, or UHID..."
                  className="input w-full"
                  value={primaryMemberSearch}
                  onChange={(e) => setPrimaryMemberSearch(e.target.value)}
                  autoComplete="off"
                  required
                />

                {/* Loading Spinner */}
                {searchingPrimary && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                  </div>
                )}

                {/* Search Results Dropdown */}
                {Array.isArray(primaryMemberResults) && primaryMemberResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {primaryMemberResults.map((member) => (
                      <button
                        key={member._id}
                        type="button"
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
                        onClick={() => selectPrimaryMember(member)}
                      >
                        <div className="font-medium text-gray-900">
                          {typeof member.name === 'string'
                            ? member.name
                            : member.name?.fullName ||
                              `${member.name?.firstName || ''} ${member.name?.lastName || ''}`.trim() ||
                              'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {member.memberId}
                          {member.employeeId && ` • ${member.employeeId}`}
                          {member.uhid && ` • ${member.uhid}`}
                        </div>
                        {member.email && (
                          <div className="text-xs text-gray-400">{member.email}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* No Results Message */}
                {debouncedSearchTerm.length >= 2 &&
                 !searchingPrimary &&
                 primaryMemberResults.length === 0 &&
                 !selectedPrimaryMember && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg px-4 py-3 text-sm text-gray-500">
                    No primary members found. Try a different search term.
                  </div>
                )}
              </div>

              {/* Selected Member Confirmation */}
              {selectedPrimaryMember && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                  ✓ Selected: {typeof selectedPrimaryMember.name === 'string'
                    ? selectedPrimaryMember.name
                    : selectedPrimaryMember.name?.fullName || 'Unknown'} ({selectedPrimaryMember.memberId})
                </div>
              )}

              <p className="text-xs text-gray-500 mt-1">
                Type at least 2 characters to search for primary members assigned to this policy
              </p>
            </div>
          )}

          {planConfigs.length > 0 && (
            <div>
              <label className="label">Plan Configuration</label>
              <select
                className="input"
                value={selectedPlanConfigId}
                onChange={(e) => onPlanConfigChange(e.target.value)}
              >
                <option value="">Choose plan config...</option>
                {planConfigs.map((config) => (
                  <option key={config._id} value={config._id}>
                    Version {config.version} - {config.status} {config.isCurrent ? '(Current)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Auto-selected active configuration</p>
            </div>
          )}

          <div>
            <label className="label">Effective From *</label>
            <input
              type="date"
              className="input"
              value={effectiveFrom}
              onChange={(e) => onEffectiveFromChange(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Policy coverage start date</p>
          </div>

          <div>
            <label className="label">Effective To *</label>
            <input
              type="date"
              className="input"
              value={effectiveTo}
              onChange={(e) => onEffectiveToChange(e.target.value)}
              min={effectiveFrom}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Policy coverage end date</p>
          </div>
        </div>
        <div className="modal-footer">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={onAssign}
            disabled={!selectedPolicyId || !effectiveFrom || !effectiveTo}
            className="btn-primary"
          >
            Assign Policy
          </button>
        </div>
      </div>
    </div>
  );
}
