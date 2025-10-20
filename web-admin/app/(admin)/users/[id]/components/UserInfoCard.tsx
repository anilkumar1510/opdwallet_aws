'use client';

interface UserInfoCardProps {
  user: any;
  isEditing: boolean;
  editedUser: any;
  onEdit: () => void;
  onDelete: () => void;
  onFieldChange: (field: string, value: any) => void;
}

export function UserInfoCard({
  user,
  isEditing,
  editedUser,
  onEdit,
  onDelete,
  onFieldChange
}: UserInfoCardProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center">
          <span className="text-2xl font-semibold text-brand-700">
            {user.name?.firstName?.charAt(0) || '?'}
          </span>
        </div>
        <div>
          {isEditing ? (
            <div className="space-y-2">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={editedUser.name?.firstName || ''}
                  onChange={(e) => onFieldChange('name', {
                    ...editedUser.name,
                    firstName: e.target.value
                  })}
                  className="input w-32"
                  placeholder="First Name"
                />
                <input
                  type="text"
                  value={editedUser.name?.lastName || ''}
                  onChange={(e) => onFieldChange('name', {
                    ...editedUser.name,
                    lastName: e.target.value
                  })}
                  className="input w-32"
                  placeholder="Last Name"
                />
              </div>
              <input
                type="email"
                value={editedUser.email || ''}
                onChange={(e) => onFieldChange('email', e.target.value)}
                className="input w-64"
                placeholder="Email"
              />
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900">{user.name?.fullName}</h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-sm text-gray-500">{user.email}</p>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">ID:</span>
                  <span className="font-mono text-sm font-semibold text-brand-600 bg-brand-50 px-2 py-1 rounded">
                    {user.memberId}
                  </span>
                </div>
              </div>
              {user.relationship !== 'SELF' && (
                <p className="text-sm text-blue-600 mt-1">
                  Primary Member: {user.primaryMemberId}
                </p>
              )}
            </>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {!isEditing && (
          <>
            <button onClick={onEdit} className="btn-primary">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit User
            </button>
            <button onClick={onDelete} className="btn-secondary text-red-600 hover:bg-red-50">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
            <span className={user.status === 'ACTIVE' ? 'badge-success' : 'badge-default'}>
              {user.status}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
