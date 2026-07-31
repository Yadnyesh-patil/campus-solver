'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { CameraCapture } from '@/components/camera-capture'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { SLA_HOURS } from '@/lib/types'
import { DuplicateDetector } from '@/components/duplicate-detector'

type VoiceState = 'idle' | 'listening' | 'processing' | 'result' | 'editing'

interface AIPrediction {
  category: string
  priority: string
  department: string
  urgency_score: number
  summary: string
  title?: string
  description?: string
  sentiment: string
  suggested_action: string
}

export default function VoiceSubmitPage() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const { transcript, isListening, isSupported, start, stop, reset } = useSpeechRecognition()
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [aiResult, setAiResult] = useState<AIPrediction | null>(null)
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    category: '',
    building: '',
    room: '',
    priority: '',
  })
  const [showCamera, setShowCamera] = useState(false)
  const [capturedImages, setCapturedImages] = useState<string[]>([])
  const [isDuplicate, setIsDuplicate] = useState(false)

  const handleStartListening = () => {
    reset()
    start()
    setVoiceState('listening')
  }

  const handleStopListening = () => {
    stop()
    if (transcript.length > 10) {
      setVoiceState('processing')
      analyzeWithAI(transcript)
    } else {
      toast.error('Please speak for a bit longer so we can understand your issue.')
      setVoiceState('idle')
    }
  }

  const analyzeWithAI = async (text: string) => {
    try {
      const res = await fetch('/api/ai/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: text.slice(0, 100),
          description: text,
        }),
      })
      const data = await res.json()

      if (data.success) {
        setAiResult(data.prediction)
        setEditData({
          title: data.prediction.title || data.prediction.summary || text.slice(0, 80),
          description: data.prediction.description || text,
          category: data.prediction.category,
          building: '',
          room: '',
          priority: data.prediction.priority,
        })
      } else {
        throw new Error('AI unavailable')
      }
    } catch {
      // Smart keyword-based fallback
      const lowerText = text.toLowerCase()
      let category = 'other'
      let department = 'General Administration'
      let priority = 'medium'
      let urgency = 5
      let sentiment = 'frustrated'

      if (lowerText.includes('fire') || lowerText.includes('smoke') || lowerText.includes('burn') || lowerText.includes('emergency')) {
        category = 'other'; department = 'Fire & Safety'; priority = 'critical'; urgency = 10; sentiment = 'panicked'
      } else if (lowerText.includes('fan') || lowerText.includes('light') || lowerText.includes('switch') || lowerText.includes('electric') || lowerText.includes('power')) {
        category = 'electricity'; department = 'Electrical Maintenance'; priority = 'high'; urgency = 7
      } else if (lowerText.includes('water') || lowerText.includes('tap') || lowerText.includes('leak') || lowerText.includes('pipe') || lowerText.includes('plumb')) {
        category = 'water'; department = 'Water Supply & Plumbing'; priority = 'high'; urgency = 8
      } else if (lowerText.includes('wifi') || lowerText.includes('internet') || lowerText.includes('network') || lowerText.includes('router')) {
        category = 'internet'; department = 'IT/Network'; priority = 'high'; urgency = 7
      } else if (lowerText.includes('hostel') || lowerText.includes('room') || lowerText.includes('bed') || lowerText.includes('furniture') || lowerText.includes('chair')) {
        category = 'hostel'; department = 'Hostel Management'; priority = 'medium'; urgency = 6
      } else if (lowerText.includes('food') || lowerText.includes('mess') || lowerText.includes('canteen') || lowerText.includes('kitchen')) {
        category = 'mess'; department = 'Mess/Canteen'; priority = 'medium'; urgency = 5
      } else if (lowerText.includes('security') || lowerText.includes('theft') || lowerText.includes('safe')) {
        category = 'security'; department = 'Campus Security'; priority = 'critical'; urgency = 9
      }

      // Extract building/room from text
      const roomMatch = lowerText.match(/room\s*(\d+)/)
      const buildingMatch = lowerText.match(/(hostel\s*[a-c]|block\s*[a-c])/i)

      const fallback: AIPrediction = {
        category,
        priority,
        department,
        urgency_score: urgency,
        summary: text.slice(0, 80),
        sentiment,
        suggested_action: `Assign to ${department} for immediate inspection`,
      }
      setAiResult(fallback)
      setEditData({
        title: text.slice(0, 80),
        description: text,
        category,
        building: buildingMatch ? buildingMatch[1].replace(/\s+/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '',
        room: roomMatch ? roomMatch[1] : '',
        priority,
      })
    } finally {
      setVoiceState('result')
    }
  }

  const handleSubmit = async () => {
    if (isDuplicate) {
      toast.error('This complaint is already post. Spam complaints are removed.')
      return
    }
    if (!user) { toast.error('You must be logged in'); return }
    const supabase = createClient()
    
    // Calculate SLA deadline
    const priority = editData.priority || 'medium'
    const hoursToAdd = SLA_HOURS[priority as keyof typeof SLA_HOURS] || 48
    const slaDeadline = new Date(Date.now() + hoursToAdd * 60 * 60 * 1000).toISOString()
    
    const { data, error } = await supabase.from('complaints').insert({
      title: editData.title,
      description: editData.description,
      category: editData.category,
      priority: editData.priority,
      status: 'submitted',
      student_id: user.id,
      building: editData.building,
      room_number: editData.room || null,
      ai_category: aiResult?.category || null,
      ai_priority: aiResult?.priority || null,
      ai_summary: aiResult?.summary || null,
      ai_sentiment_score: aiResult?.urgency_score || null,
      ai_metadata: aiResult ? { sentiment: aiResult.sentiment, department: aiResult.department, suggested_action: aiResult.suggested_action } : {},
      image_urls: capturedImages,
      sla_deadline: slaDeadline,
    }).select().single()
    
    if (error) {
      toast.error('Failed to submit complaint: ' + error.message)
      return
    }
    
    if (data) {
      await supabase.from('complaint_logs').insert({
        complaint_id: data.id,
        user_id: user.id,
        action: 'status_change',
        new_value: 'submitted',
        comment: 'Complaint submitted via voice by student',
      })
    }
    
    toast.success('Complaint submitted successfully!', { description: `ID: ${data?.id?.slice(0,8)}... — We will notify you once assigned.` })
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  const handleEdit = () => {
    setVoiceState('editing')
  }

  const handleStartOver = () => {
    reset()
    setAiResult(null)
    setVoiceState('idle')
  }

  const CATEGORIES = ['hostel', 'electricity', 'water', 'internet', 'transport', 'mess', 'library', 'classroom', 'faculty', 'examination', 'sports', 'medical', 'security', 'other']
  const BUILDINGS = ['Hostel A', 'Hostel B', 'Hostel C', 'Academic Block A', 'Academic Block B', 'Library Building', 'Sports Complex', 'Medical Center', 'Main Canteen', 'Admin Block', 'Computer Center', 'Workshop']

  return (
    <DashboardLayout role="student" userName={profile?.full_name || 'Student'} userEmail={profile?.email || ''}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-[#111111] tracking-tight mb-2">Voice Complaint</h1>
          <p className="text-[#787774]">Speak your issue and AI will handle the rest.</p>
        </div>

        <AnimatePresence mode="wait">
          {/* IDLE STATE */}
          {voiceState === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-xl border border-[#EAEAEA] p-8 md:p-12 text-center"
            >
              {!isSupported ? (
                <div className="py-8">
                  <p className="text-lg font-medium text-[#111111] mb-2">Voice input not supported</p>
                  <p className="text-sm text-[#787774]">Please use Chrome or Edge for voice features.</p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <p className="text-sm text-[#787774] mb-4">Tap the microphone and describe your issue</p>
                    <p className="text-xs text-[#787774] italic">&quot;The ceiling fan in my room 402 Hostel B is making a grinding noise...&quot;</p>
                  </div>
                  <button
                    onClick={handleStartListening}
                    className="w-24 h-24 rounded-full bg-[#111111] text-white flex items-center justify-center mx-auto hover:bg-black hover:scale-105 transition-all shadow-lg"
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="1" width="6" height="11" rx="3" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  </button>
                  <p className="mt-4 text-xs text-[#787774]">Click to start recording</p>
                </>
              )}
            </motion.div>
          )}

          {/* LISTENING STATE */}
          {voiceState === 'listening' && (
            <motion.div
              key="listening"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl border border-[#EAEAEA] p-8 md:p-12 text-center"
            >
              <div className="mb-6">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                  <div className="absolute inset-2 rounded-full bg-red-500/30 animate-pulse" />
                  <button
                    onClick={handleStopListening}
                    className="relative w-24 h-24 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm font-medium text-red-500 animate-pulse">● Recording... Tap to stop</p>
              </div>

              <div className="min-h-[100px] bg-[#F7F6F3] rounded-xl p-4 text-left">
                <p className="text-xs font-medium text-[#787774] mb-2 uppercase tracking-wider">Live Transcript</p>
                <p className="text-[#111111] leading-relaxed">
                  {transcript || <span className="text-[#787774] italic">Listening...</span>}
                </p>
              </div>
            </motion.div>
          )}

          {/* PROCESSING STATE */}
          {voiceState === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-xl border border-[#EAEAEA] p-8 md:p-12 text-center"
            >
              <div className="w-16 h-16 border-4 border-[#EAEAEA] border-t-[#111111] rounded-full animate-spin mx-auto mb-6" />
              <p className="text-lg font-medium text-[#111111] mb-2">AI is analyzing your complaint...</p>
              <p className="text-sm text-[#787774]">Extracting category, location, and priority</p>
            </motion.div>
          )}

          {/* RESULT STATE */}
          {voiceState === 'result' && aiResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-xl border border-[#EAEAEA] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[#111111]">AI Analysis Complete</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-[#787774] uppercase tracking-wider mb-1">Title</p>
                    <p className="font-medium text-[#111111]">{editData.title}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#787774] uppercase tracking-wider mb-1">Your Words</p>
                    <p className="text-sm text-[#111111] bg-[#F7F6F3] p-3 rounded-lg">{editData.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#EAEAEA]">
                    <div>
                      <p className="text-xs font-medium text-[#787774] uppercase tracking-wider mb-1">Category</p>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium capitalize bg-[#F7F6F3] border border-[#EAEAEA]">{aiResult.category}</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#787774] uppercase tracking-wider mb-1">Priority</p>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium capitalize ${
                        aiResult.priority === 'critical' ? 'bg-red-100 text-red-800' :
                        aiResult.priority === 'high' ? 'bg-[#FDEBEC] text-red-700' :
                        aiResult.priority === 'medium' ? 'bg-[#FBF3DB] text-amber-800' :
                        'bg-[#EDF3EC] text-green-700'
                      }`}>{aiResult.priority}</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#787774] uppercase tracking-wider mb-1">Department</p>
                      <p className="text-sm font-medium text-[#111111]">{aiResult.department}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#787774] uppercase tracking-wider mb-1">Sentiment</p>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium capitalize ${
                        aiResult.sentiment === 'frustrated' ? 'bg-[#FDEBEC] text-red-700' :
                        aiResult.sentiment === 'angry' ? 'bg-red-100 text-red-800' :
                        aiResult.sentiment === 'urgent' ? 'bg-amber-100 text-amber-800' :
                        'bg-[#EDF3EC] text-green-700'
                      }`}>{aiResult.sentiment}</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-[#EAEAEA]">
                    <p className="text-xs font-medium text-[#787774] uppercase tracking-wider mb-1">Urgency Score</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-[#EAEAEA] rounded-full h-3">
                        <div className={`h-3 rounded-full transition-all ${
                          aiResult.urgency_score >= 8 ? 'bg-red-500' :
                          aiResult.urgency_score >= 5 ? 'bg-amber-500' :
                          'bg-green-500'
                        }`} style={{ width: `${aiResult.urgency_score * 10}%` }} />
                      </div>
                      <span className="text-lg font-bold text-[#111111]">{aiResult.urgency_score}/10</span>
                    </div>
                  </div>
                </div>

                {/* Evidence Upload Section */}
                <div className="pt-3 border-t border-[#EAEAEA]">
                  <p className="text-xs font-medium text-[#787774] uppercase tracking-wider mb-3">Evidence (Optional)</p>
                  {capturedImages.length > 0 && (
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {capturedImages.map((img, i) => (
                        <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#EAEAEA]">
                          <img src={img} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                          <button
                            onClick={() => setCapturedImages(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full text-white text-xs flex items-center justify-center hover:bg-black"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCamera(true)}
                      className="flex-1 py-2.5 border border-dashed border-[#EAEAEA] rounded-lg text-sm text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111] transition-colors flex items-center justify-center gap-2"
                    >
                      📸 Live Camera
                    </button>
                    <label className="flex-1 py-2.5 border border-dashed border-[#EAEAEA] rounded-lg text-sm text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111] transition-colors flex items-center justify-center gap-2 cursor-pointer">
                      📁 Upload File
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = e.target.files
                          if (files) {
                            Array.from(files).forEach(file => {
                              const url = URL.createObjectURL(file)
                              setCapturedImages(prev => [...prev, url])
                            })
                            toast.success(`${files.length} file(s) added`)
                          }
                          e.target.value = ''
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <DuplicateDetector
                title={editData.title}
                description={editData.description}
                onStatusChange={(status) => setIsDuplicate(status)}
              />

              <div className="flex gap-3">
                <button
                  onClick={handleStartOver}
                  className="flex-1 py-3 px-4 border border-[#EAEAEA] rounded-lg text-sm font-medium text-[#787774] hover:bg-[#F7F6F3] transition-colors"
                >
                  Start Over
                </button>
                <button
                  onClick={handleEdit}
                  className="flex-1 py-3 px-4 border border-[#111111] rounded-lg text-sm font-medium text-[#111111] hover:bg-[#F7F6F3] transition-colors"
                >
                  ✏️ Edit Details
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-3 px-4 bg-[#111111] text-white rounded-lg text-sm font-medium hover:bg-black transition-colors"
                >
                  ✅ Submit
                </button>
              </div>
            </motion.div>
          )}

          {/* Camera Modal */}
          <CameraCapture
            isOpen={showCamera}
            onCapture={(_file, preview) => {
              setCapturedImages(prev => [...prev, preview])
              setShowCamera(false)
              toast.success('Evidence captured!')
            }}
            onClose={() => setShowCamera(false)}
          />

          {/* EDITING STATE */}
          {voiceState === 'editing' && (
            <motion.div
              key="editing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-xl border border-[#EAEAEA] p-6 space-y-5"
            >
              <h3 className="text-lg font-semibold text-[#111111]">Edit Complaint Details</h3>
              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1.5">Title</label>
                <input
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#EAEAEA] focus:outline-none focus:border-[#111111] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111111] mb-1.5">Description</label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#EAEAEA] focus:outline-none focus:border-[#111111] transition-colors resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#111111] mb-1.5">Category</label>
                  <select
                    value={editData.category}
                    onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-[#EAEAEA] focus:outline-none focus:border-[#111111] transition-colors bg-white capitalize"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111111] mb-1.5">Priority</label>
                  <select
                    value={editData.priority}
                    onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-[#EAEAEA] focus:outline-none focus:border-[#111111] transition-colors bg-white capitalize"
                  >
                    {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111111] mb-1.5">Building</label>
                  <select
                    value={editData.building}
                    onChange={(e) => setEditData({ ...editData, building: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-[#EAEAEA] focus:outline-none focus:border-[#111111] transition-colors bg-white"
                  >
                    <option value="">Select building</option>
                    {BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111111] mb-1.5">Room (Optional)</label>
                  <input
                    value={editData.room}
                    onChange={(e) => setEditData({ ...editData, room: e.target.value })}
                    placeholder="E.g., Room 402"
                    className="w-full px-3 py-2.5 rounded-lg border border-[#EAEAEA] focus:outline-none focus:border-[#111111] transition-colors"
                  />
                </div>
              </div>

              <DuplicateDetector
                title={editData.title}
                description={editData.description}
                onStatusChange={(status) => setIsDuplicate(status)}
              />

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setVoiceState('result')}
                  className="flex-1 py-3 px-4 border border-[#EAEAEA] rounded-lg text-sm font-medium text-[#787774] hover:bg-[#F7F6F3] transition-colors"
                >
                  Back to Review
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-3 px-4 bg-[#111111] text-white rounded-lg text-sm font-medium hover:bg-black transition-colors"
                >
                  Submit Complaint
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  )
}
