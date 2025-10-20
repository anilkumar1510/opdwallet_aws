'use client';

interface DependentsTableProps {
  dependents: any[];
  onViewDependent: (dependentId: string) => void;
}

export function DependentsTable({ dependents, onViewDependent }: DependentsTableProps) {
  if (dependents.length === 0) {
    return null;
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Dependents ({dependents.length})
      </h2>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Relationship</th>
              <th>Member ID</th>
              <th>UHID</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {dependents.map((dep) => (
              <tr
                key={dep._id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => onViewDependent(dep._id)}
              >
                <td>
                  <div>
                    <p className="font-medium text-gray-900">{dep.name?.fullName}</p>
                    <p className="text-sm text-gray-500">{dep.email}</p>
                  </div>
                </td>
                <td>
                  <span className="badge-warning">{dep.relationship}</span>
                </td>
                <td className="font-mono text-sm">{dep.memberId}</td>
                <td className="font-mono text-sm">{dep.uhid}</td>
                <td>
                  <span className={dep.status === 'ACTIVE' ? 'badge-success' : 'badge-default'}>
                    {dep.status}
                  </span>
                </td>
                <td>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDependent(dep._id);
                    }}
                    className="btn-ghost p-1 text-xs"
                    title="View Details"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
