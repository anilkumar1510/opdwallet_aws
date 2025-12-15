'use client';

import { CugMaster } from '@/lib/api';

interface UserEditFormProps {
  user: any;
  editedUser: any;
  isEditing: boolean;
  isInternalUser: boolean;
  cugs: CugMaster[];
  selectedCugId: string;
  showPasswordField: boolean;
  newPassword: string;
  onFieldChange: (field: string, value: any) => void;
  onCugChange: (cugId: string, cugName: string) => void;
  onPasswordToggle: () => void;
  onPasswordChange: (password: string) => void;
  renderRoleOrRelationshipSelector: () => JSX.Element;
}

export function UserEditForm({
  user,
  editedUser,
  isEditing,
  isInternalUser,
  cugs,
  selectedCugId,
  showPasswordField,
  newPassword,
  onFieldChange,
  onCugChange,
  onPasswordToggle,
  onPasswordChange,
  renderRoleOrRelationshipSelector
}: UserEditFormProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">User ID</p>
          <p className="text-gray-900">{user.userId}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Member ID</p>
          {isEditing ? (
            <input
              type="text"
              value={editedUser.memberId || ''}
              onChange={(e) => onFieldChange('memberId', e.target.value)}
              className="input"
            />
          ) : (
            <p className="font-mono text-gray-900">{user.memberId}</p>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">UHID</p>
          {isEditing ? (
            <input
              type="text"
              value={editedUser.uhid || ''}
              onChange={(e) => onFieldChange('uhid', e.target.value)}
              className="input"
            />
          ) : (
            <p className="font-mono text-gray-900">{user.uhid}</p>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Employee ID</p>
          {isEditing ? (
            <input
              type="text"
              value={editedUser.employeeId || ''}
              onChange={(e) => onFieldChange('employeeId', e.target.value)}
              className="input"
              placeholder="Optional"
            />
          ) : (
            <p className="font-mono text-gray-900">{user.employeeId || '-'}</p>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Phone</p>
          {isEditing ? (
            <input
              type="tel"
              value={
                typeof editedUser.phone === 'object' && editedUser.phone
                  ? `${editedUser.phone.countryCode || '+91'} ${editedUser.phone.number || ''}`
                  : editedUser.phone || ''
              }
              onChange={(e) => onFieldChange('phone', e.target.value)}
              className="input"
              placeholder="+91 1234567890"
            />
          ) : (
            <p className="text-gray-900">
              {typeof user.phone === 'object' && user.phone
                ? `${user.phone.countryCode || '+91'} ${user.phone.number || ''}`
                : user.phone || '-'
              }
            </p>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">
            {isInternalUser ? 'Role' : 'Relationship'}
          </p>
          {renderRoleOrRelationshipSelector()}
        </div>
        {!isInternalUser && editedUser.relationship !== 'SELF' && (
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Primary Member ID</p>
            {isEditing ? (
              <input
                type="text"
                value={editedUser.primaryMemberId || ''}
                onChange={(e) => onFieldChange('primaryMemberId', e.target.value)}
                className="input"
                placeholder="Required for dependents"
              />
            ) : (
              <p className="text-gray-900">{user.primaryMemberId || '-'}</p>
            )}
          </div>
        )}
        {!isInternalUser && (
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Corporate Name</p>
            {isEditing ? (
              <select
                value={selectedCugId || ''}
                onChange={(e) => {
                  const selectedCug = cugs.find(cug => cug._id === e.target.value);
                  onCugChange(e.target.value, selectedCug ? selectedCug.companyName : '');
                }}
                className="input"
              >
                <option value="">Select Corporate Group</option>
                {cugs.map((cug) => (
                  <option key={cug._id} value={cug._id}>
                    {cug.companyName}{cug.shortCode ? ` (${cug.shortCode})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-gray-900">{user.corporateName || '-'}</p>
            )}
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Date of Birth</p>
          {isEditing ? (
            <input
              type="date"
              value={editedUser.dob ? new Date(editedUser.dob).toISOString().split('T')[0] : ''}
              onChange={(e) => onFieldChange('dob', e.target.value)}
              className="input"
            />
          ) : (
            <p className="text-gray-900">{user.dob ? new Date(user.dob).toLocaleDateString() : '-'}</p>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Gender</p>
          {isEditing ? (
            <select
              value={editedUser.gender || ''}
              onChange={(e) => onFieldChange('gender', e.target.value)}
              className="input"
            >
              <option value="">Select</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          ) : (
            <p className="text-gray-900">{user.gender || '-'}</p>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
          {isEditing ? (
            <select
              value={editedUser.status || 'ACTIVE'}
              onChange={(e) => onFieldChange('status', e.target.value)}
              className="input"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          ) : (
            <span className={user.status === 'ACTIVE' ? 'badge-success' : 'badge-default'}>
              {user.status}
            </span>
          )}
        </div>
      </div>

      {/* Password Section (Edit Mode Only) */}
      {isEditing && (
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-700">Password Management</p>
            <button
              type="button"
              onClick={onPasswordToggle}
              className="text-sm text-brand-600 hover:text-brand-700"
            >
              {showPasswordField ? 'Cancel Password Change' : 'Change Password'}
            </button>
          </div>
          {showPasswordField && (
            <div className="max-w-md">
              <input
                type="text"
                value={newPassword}
                onChange={(e) => onPasswordChange(e.target.value)}
                className="input"
                placeholder="Enter new password (min. 8 characters)"
              />
              <p className="text-xs text-gray-500 mt-2">
                Leave empty to keep current password
              </p>
            </div>
          )}
        </div>
      )}

      {/* Address Section */}
      {(user.address || isEditing) && (
        <div className="mt-6 pt-6 border-t">
          <p className="text-sm font-medium text-gray-500 mb-2">Address</p>
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={editedUser.address?.line1 || ''}
                onChange={(e) => onFieldChange('address', {
                  ...editedUser.address,
                  line1: e.target.value
                })}
                className="input"
                placeholder="Address Line 1"
              />
              <input
                type="text"
                value={editedUser.address?.line2 || ''}
                onChange={(e) => onFieldChange('address', {
                  ...editedUser.address,
                  line2: e.target.value
                })}
                className="input"
                placeholder="Address Line 2 (Optional)"
              />
              <input
                type="text"
                value={editedUser.address?.city || ''}
                onChange={(e) => onFieldChange('address', {
                  ...editedUser.address,
                  city: e.target.value
                })}
                className="input"
                placeholder="City"
              />
              <input
                type="text"
                value={editedUser.address?.state || ''}
                onChange={(e) => onFieldChange('address', {
                  ...editedUser.address,
                  state: e.target.value
                })}
                className="input"
                placeholder="State"
              />
              <input
                type="text"
                value={editedUser.address?.pincode || ''}
                onChange={(e) => onFieldChange('address', {
                  ...editedUser.address,
                  pincode: e.target.value
                })}
                className="input"
                placeholder="Pincode"
              />
            </div>
          ) : (
            <p className="text-gray-900">
              {user.address?.line1}
              {user.address?.line2 && `, ${user.address.line2}`}
              <br />
              {user.address?.city}, {user.address?.state} - {user.address?.pincode}
            </p>
          )}
        </div>
      )}
    </>
  );
}
