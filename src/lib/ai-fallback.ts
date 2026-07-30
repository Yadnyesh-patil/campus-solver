import { AIPrediction } from '@/hooks/use-ai'

export const FALLBACK_PREDICTIONS: Record<string, AIPrediction> = {
  'water': {
    category: 'water',
    priority: 'high',
    department: 'Water Supply',
    urgency_score: 8,
    summary: 'Water supply or leakage issue requiring maintenance attention.',
    sentiment: 'urgent',
    suggested_action: 'Dispatch plumbing team to inspect and fix the issue.',
  },
  'electricity': {
    category: 'electricity',
    priority: 'critical',
    department: 'Electrical Maintenance',
    urgency_score: 9,
    summary: 'Power outage or electrical issue that needs immediate resolution.',
    sentiment: 'frustrated',
    suggested_action: 'Send electrician for immediate inspection to prevent hazards.',
  },
  'hostel': {
    category: 'hostel',
    priority: 'medium',
    department: 'Hostel Management',
    urgency_score: 6,
    summary: 'Hostel facility related concern reported by a resident.',
    sentiment: 'neutral',
    suggested_action: 'Notify hostel warden for verification and resolution.',
  },
  'internet': {
    category: 'internet',
    priority: 'high',
    department: 'IT/Network',
    urgency_score: 7,
    summary: 'Network connectivity or Wi-Fi issue affecting academic work.',
    sentiment: 'frustrated',
    suggested_action: 'Check network logs for the reported location and reset router if needed.',
  },
  'mess': {
    category: 'mess',
    priority: 'high',
    department: 'Mess Committee',
    urgency_score: 8,
    summary: 'Food quality or hygiene issue reported in the dining facility.',
    sentiment: 'angry',
    suggested_action: 'Mess supervisor should inspect the food quality immediately.',
  },
  'cleaning': {
    category: 'other',
    priority: 'medium',
    department: 'Housekeeping',
    urgency_score: 5,
    summary: 'Cleanliness or hygiene issue in campus premises.',
    sentiment: 'neutral',
    suggested_action: 'Assign housekeeping staff to clean the specified area.',
  },
  'default': {
    category: 'other',
    priority: 'medium',
    department: 'General Administration',
    urgency_score: 5,
    summary: 'General campus grievance requiring administrative review.',
    sentiment: 'neutral',
    suggested_action: 'Review and assign to the appropriate specific department.',
  }
}

export function getFallbackPrediction(title: string, description: string): AIPrediction {
  const text = (title + ' ' + description).toLowerCase()
  
  if (text.includes('water') || text.includes('leak') || text.includes('pipe') || text.includes('plumb')) {
    return FALLBACK_PREDICTIONS.water
  }
  if (text.includes('electric') || text.includes('power') || text.includes('light') || text.includes('fan') || text.includes('shock')) {
    return FALLBACK_PREDICTIONS.electricity
  }
  if (text.includes('wifi') || text.includes('wi-fi') || text.includes('internet') || text.includes('network') || text.includes('connection')) {
    return FALLBACK_PREDICTIONS.internet
  }
  if (text.includes('food') || text.includes('mess') || text.includes('dining') || text.includes('meal') || text.includes('canteen')) {
    return FALLBACK_PREDICTIONS.mess
  }
  if (text.includes('room') || text.includes('hostel') || text.includes('warden') || text.includes('bed')) {
    return FALLBACK_PREDICTIONS.hostel
  }
  if (text.includes('clean') || text.includes('sweep') || text.includes('garbage') || text.includes('dust') || text.includes('washroom') || text.includes('toilet')) {
    return FALLBACK_PREDICTIONS.cleaning
  }
  
  return FALLBACK_PREDICTIONS.default
}
