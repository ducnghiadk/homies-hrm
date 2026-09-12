import type { AuthUser } from '@/store/auth-store';

export const EmployeeService = {
  getEmployees(_currentUser?: unknown): AuthUser[] {
    return [];
  },
  getEmployeeById(_id: string, _currentUser?: unknown): AuthUser | null {
    return null;
  }
};
