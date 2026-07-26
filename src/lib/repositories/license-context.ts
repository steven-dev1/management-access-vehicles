let _currentLicenseId: string = '';
let _isAdmin: boolean = false;

export function setCurrentLicenseId(id: string) {
  _currentLicenseId = id;
}

export function getCurrentLicenseId(): string {
  if (_isAdmin) return '';
  return _currentLicenseId;
}

export function setIsAdmin(admin: boolean) {
  _isAdmin = admin;
}

export function getIsAdmin(): boolean {
  return _isAdmin;
}
