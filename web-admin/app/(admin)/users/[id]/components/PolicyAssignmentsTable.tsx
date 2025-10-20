'use client';

interface PolicyAssignmentsTableProps {
  assignments: any[];
  onAssignPolicy: () => void;
  onUnassignPolicy: (assignment: any) => void;
}

export function PolicyAssignmentsTable({
  assignments,
  onAssignPolicy,
  onUnassignPolicy
}: PolicyAssignmentsTableProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Policy Assignments</h2>
        <button
          onClick={onAssignPolicy}
          className="btn-primary text-sm"
        >
          Assign Policy
        </button>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No policy assignments yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Assignment ID</th>
                <th>Policy Name</th>
                <th>Policy Number</th>
                <th>Effective From</th>
                <th>Effective To</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment: any) => (
                <tr key={assignment._id}>
                  <td className="font-mono text-xs">{assignment.assignmentId}</td>
                  <td className="font-medium">
                    {assignment.policyId?.name || 'N/A'}
                    <div className="text-xs text-gray-500">
                      {assignment.policyId?.description || ''}
                    </div>
                  </td>
                  <td className="font-mono text-sm">
                    {assignment.policyId?.policyNumber || 'N/A'}
                  </td>
                  <td>
                    {assignment.effectiveFrom
                      ? new Date(assignment.effectiveFrom).toLocaleDateString()
                      : 'N/A'
                    }
                  </td>
                  <td>
                    {assignment.effectiveTo
                      ? new Date(assignment.effectiveTo).toLocaleDateString()
                      : 'Ongoing'
                    }
                  </td>
                  <td>
                    <span className={assignment.isActive ? 'badge-success' : 'badge-default'}>
                      {assignment.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    {assignment.isActive && (
                      <button
                        onClick={() => onUnassignPolicy(assignment)}
                        className="btn-ghost text-sm text-red-600 hover:text-red-700"
                        title="Unassign Policy"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Unassign
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
