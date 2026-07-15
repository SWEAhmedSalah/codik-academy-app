export const APP_CONSTANTS = {
  ROUTES: {
    LOGIN: '/login',
    ADMIN: '/admin',
    STUDENT: '/student'
  },
  STORAGE_KEYS: {
    USER_SESSION: 'user_session'
  },
  VALIDATION: {
    MIN_PASSWORD_LENGTH: 6,
    GITHUB_URL_PATTERN: /^https:\/\/github\.com\/.+/
  }
} as const;

export enum SessionStatus {
  DRAFT = 'Draft',
  PUBLISHED = 'Published'
}

export enum StudentSessionStatus {
  UPCOMING = 'Upcoming',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed'
}

export enum SubmissionStatus {
  PENDING = 'Pending',
  ACCEPTED = 'Accepted',
  NEEDS_REWORK = 'Needs Rework'
}

export enum UserRole {
  ADMIN = 'admin',
  STUDENT = 'student'
}

export const ERROR_MESSAGES = {
  LOGIN_FAILED: 'Invalid email or password',
  UNAUTHORIZED: 'You are not authorized to access this page',
  SESSION_EXPIRED: 'Your session has expired. Please login again',
  NETWORK_ERROR: 'Network error. Please check your connection',
  SUBMISSION_FAILED: 'Failed to submit. Please try again',
  LOAD_FAILED: 'Failed to load data. Please refresh the page'
} as const;

export const SUCCESS_MESSAGES = {
  SESSION_ADDED: 'Session added successfully! 🎉',
  SESSION_UPDATED: 'Session updated successfully! ✏️',
  SESSION_DELETED: 'Session deleted successfully! 🗑️',
  SUBMISSION_SUCCESS: 'Assignment submitted successfully! 🎉',
  STATUS_UPDATED: 'Status updated successfully! ✅'
} as const;

