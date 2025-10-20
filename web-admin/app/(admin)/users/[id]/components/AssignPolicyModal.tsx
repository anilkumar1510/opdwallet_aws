'use client';

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
              <label className="label">Primary Member ID *</label>
              <select
                className="input"
                value={selectedPrimaryMemberId}
                onChange={(e) => onPrimaryMemberChange(e.target.value)}
                required
              >
                <option value="">Choose primary member...</option>
                {members.filter(m => m.relationship === 'SELF').map((member) => (
                  <option key={member._id} value={member.memberId}>
                    {member.memberId} - {member.name?.fullName}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Required for dependents</p>
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
