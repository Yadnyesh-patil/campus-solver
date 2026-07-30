export type UserRole = 'student' | 'staff' | 'admin'

export type ComplaintStatus = 
  | 'submitted' 
  | 'verified' 
  | 'assigned' 
  | 'in_progress' 
  | 'resolved' 
  | 'closed' 
  | 'rejected'

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'critical'

export type ComplaintCategory = 
  | 'hostel' | 'electricity' | 'water' | 'internet' 
  | 'transport' | 'mess' | 'library' | 'classroom' 
  | 'faculty' | 'examination' | 'sports' | 'medical' 
  | 'security' | 'other'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  department?: string
  avatar_url?: string
  created_at: string
}

export interface Department {
  id: string
  name: string
  description: string
  head_user_id?: string
  is_active: boolean
}

export interface Complaint {
  id: string
  title: string
  description: string
  category: ComplaintCategory
  priority: ComplaintPriority
  status: ComplaintStatus
  student_id: string
  assigned_dept_id?: string
  assigned_staff_id?: string
  building: string
  room_number?: string
  ai_category?: string
  ai_priority?: string
  ai_summary?: string
  ai_sentiment_score?: number
  ai_metadata?: Record<string, unknown>
  image_urls: string[]
  sla_deadline?: string
  is_escalated: boolean
  escalated_at?: string
  created_at: string
  updated_at: string
  resolved_at?: string
  closed_at?: string
  closed_by_student: boolean
  // Joined fields
  student?: User
  assigned_department?: Department
  assigned_staff?: User
}

export interface ComplaintLog {
  id: string
  complaint_id: string
  user_id: string
  action: 'status_change' | 'comment' | 'assignment' | 'escalation' | 'closed_by_student'
  old_value?: string
  new_value?: string
  comment?: string
  attachment_urls: string[]
  created_at: string
  user?: User
}

export interface Notification {
  id: string
  user_id: string
  complaint_id?: string
  type: 'status_update' | 'assignment' | 'escalation' | 'sla_warning' | 'closed'
  title: string
  message: string
  is_read: boolean
  created_at: string
}

// SLA deadlines by priority (in hours)
export const SLA_HOURS: Record<ComplaintPriority, number> = {
  low: 72,
  medium: 48,
  high: 24,
  critical: 6,
}

// Category display config
export const CATEGORY_CONFIG: Record<ComplaintCategory, { label: string; icon: string }> = {
  hostel: { label: 'Hostel', icon: 'home' },
  electricity: { label: 'Electricity', icon: 'lightning-bolt' },
  water: { label: 'Water', icon: 'droplet' },
  internet: { label: 'Internet', icon: 'globe' },
  transport: { label: 'Transport', icon: 'car' },
  mess: { label: 'Mess/Canteen', icon: 'utensils' },
  library: { label: 'Library', icon: 'book' },
  classroom: { label: 'Classroom', icon: 'presentation' },
  faculty: { label: 'Faculty', icon: 'person' },
  examination: { label: 'Examination', icon: 'file-text' },
  sports: { label: 'Sports', icon: 'trophy' },
  medical: { label: 'Medical', icon: 'heart' },
  security: { label: 'Security', icon: 'shield' },
  other: { label: 'Other', icon: 'dots-horizontal' },
}

// Status display config
export const STATUS_CONFIG: Record<ComplaintStatus, { label: string; color: string; bgColor: string }> = {
  submitted: { label: 'Submitted', color: '#1F6C9F', bgColor: '#E1F3FE' },
  verified: { label: 'Verified', color: '#346538', bgColor: '#EDF3EC' },
  assigned: { label: 'Assigned', color: '#956400', bgColor: '#FBF3DB' },
  in_progress: { label: 'In Progress', color: '#956400', bgColor: '#FBF3DB' },
  resolved: { label: 'Resolved', color: '#346538', bgColor: '#EDF3EC' },
  closed: { label: 'Closed', color: '#787774', bgColor: '#F7F6F3' },
  rejected: { label: 'Rejected', color: '#9F2F2D', bgColor: '#FDEBEC' },
}

export const PRIORITY_CONFIG: Record<ComplaintPriority, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Low', color: '#346538', bgColor: '#EDF3EC' },
  medium: { label: 'Medium', color: '#956400', bgColor: '#FBF3DB' },
  high: { label: 'High', color: '#9F2F2D', bgColor: '#FDEBEC' },
  critical: { label: 'Critical', color: '#FFFFFF', bgColor: '#DC2626' },
}
