'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { z } from 'zod'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DuplicateDetector } from '@/components/duplicate-detector'
import { CameraCapture } from '@/components/camera-capture'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { SLA_HOURS } from '@/lib/types'
import { 
  ArrowLeftIcon, ArrowRightIcon, UploadIcon, Cross2Icon, 
  CheckIcon, InfoCircledIcon, ImageIcon
} from '@radix-ui/react-icons'

const CATEGORY_CONFIG = [
  { id: 'hostel', label: 'Hostel' },
  { id: 'electricity', label: 'Electricity' },
  { id: 'water', label: 'Water' },
  { id: 'internet', label: 'Internet' },
  { id: 'transport', label: 'Transport' },
  { id: 'mess', label: 'Mess / Food' },
  { id: 'library', label: 'Library' },
  { id: 'classroom', label: 'Classroom' },
  { id: 'faculty', label: 'Faculty' },
  { id: 'examination', label: 'Examination' },
  { id: 'sports', label: 'Sports' },
  { id: 'medical', label: 'Medical' },
  { id: 'security', label: 'Security' },
  { id: 'other', label: 'Other' },
]

const PRIORITY_CONFIG = [
  { id: 'low', label: 'Low', desc: 'Can be resolved in a few days', color: 'bg-[#EDF3EC]', border: 'border-[#EDF3EC]' },
  { id: 'medium', label: 'Medium', desc: 'Needs attention soon', color: 'bg-[#FBF3DB]', border: 'border-[#FBF3DB]' },
  { id: 'high', label: 'High', desc: 'Urgent, impacts daily life', color: 'bg-[#FDEBEC]', border: 'border-[#FDEBEC]' },
  { id: 'critical', label: 'Critical', desc: 'Emergency situation', color: 'bg-[#FDEBEC] border-red-200', border: 'border-red-200' },
]

const BUILDINGS = [
  'Hostel A', 'Hostel B', 'Hostel C', 
  'Academic Block A', 'Academic Block B', 
  'Library Building', 'Sports Complex', 
  'Medical Center', 'Main Canteen', 
  'Admin Block', 'Computer Center', 'Workshop'
]

const complaintSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  description: z.string().min(30, 'Description must be at least 30 characters'),
  category: z.enum(['hostel', 'electricity', 'water', 'internet', 'transport', 'mess', 'library', 'classroom', 'faculty', 'examination', 'sports', 'medical', 'security', 'other'] as const),
  building: z.string().min(1, 'Please select a building'),
  room_number: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical'] as const),
  images: z.array(z.any()).max(3, 'Maximum 3 images allowed').optional(),
})

type FormData = z.infer<typeof complaintSchema>

export default function SubmitComplaintPage() {
  const router = useRouter()
  const { user, profile, role, isLoading: authLoading } = useAuth()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<Partial<FormData>>({
    title: '',
    description: '',
    category: undefined,
    building: '',
    room_number: '',
    priority: undefined,
    images: [],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [imagesPreview, setImagesPreview] = useState<string[]>([])
  const [showCamera, setShowCamera] = useState(false)
  
  const [aiResult, setAiResult] = useState<any>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [isDuplicate, setIsDuplicate] = useState(false)

  useEffect(() => {
    if (step === 3 && formData.title && formData.description) {
      setAiLoading(true)
      fetch('/api/ai/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
        }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setAiResult(data.prediction)
          } else {
            // API returned error, use fallback
            setAiResult({
              category: formData.category || 'other',
              priority: formData.priority || 'medium',
              department: 'Hostel Management',
              urgency_score: 7,
              summary: `${formData.title} - requires attention from the maintenance team`,
              sentiment: 'frustrated',
              suggested_action: 'Assign to maintenance staff for immediate inspection',
            })
          }
          setAiLoading(false)
        })
        .catch(() => {
          // Fallback mock data if AI service is unavailable
          setAiResult({
            category: formData.category || 'other',
            priority: formData.priority || 'medium',
            department: 'Hostel Management',
            urgency_score: 7,
            summary: `${formData.title} - requires attention from the maintenance team`,
            sentiment: 'frustrated',
            suggested_action: 'Assign to maintenance staff for immediate inspection',
          })
          setAiLoading(false)
        })
    }
  }, [step, formData.title, formData.description, formData.category, formData.priority])
  
  const validateStep1 = () => {
    if (isDuplicate) {
      toast.error('This complaint is already post. Spam complaints are removed.')
      return false
    }
    const newErrors: Record<string, string> = {}
    if (!formData.title || formData.title.length < 10) newErrors.title = 'Title must be at least 10 characters'
    if (!formData.description || formData.description.length < 30) newErrors.description = 'Description must be at least 30 characters'
    if (!formData.category) newErrors.category = 'Please select a category'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.building) newErrors.building = 'Please select a building'
    if (!formData.priority) newErrors.priority = 'Please select a priority'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2)
    else if (step === 2 && validateStep2()) setStep(3)
  }

  const handlePrev = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async () => {
    if (!user) { toast.error('You must be logged in'); return }
    const supabase = createClient()
    
    // Calculate SLA deadline
    const priority = formData.priority || 'medium'
    const hoursToAdd = SLA_HOURS[priority as keyof typeof SLA_HOURS] || 48
    const slaDeadline = new Date(Date.now() + hoursToAdd * 60 * 60 * 1000).toISOString()
    
    const { data, error } = await supabase.from('complaints').insert({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      priority: formData.priority,
      status: 'submitted',
      student_id: user.id,
      building: formData.building,
      room_number: formData.room_number || null,
      ai_category: aiResult?.category || null,
      ai_priority: aiResult?.priority || null,
      ai_summary: aiResult?.summary || null,
      ai_sentiment_score: aiResult?.urgency_score || null,
      ai_metadata: aiResult ? { sentiment: aiResult.sentiment, department: aiResult.department, suggested_action: aiResult.suggested_action } : {},
      image_urls: [],
      sla_deadline: slaDeadline,
    }).select().single()
    
    if (error) {
      toast.error('Failed to submit complaint: ' + error.message)
      return
    }
    
    // Create initial log entry
    if (data) {
      await supabase.from('complaint_logs').insert({
        complaint_id: data.id,
        user_id: user.id,
        action: 'status_change',
        new_value: 'submitted',
        comment: 'Complaint submitted by student',
      })
    }
    
    toast.success('Complaint submitted successfully!', { description: `ID: ${data?.id?.slice(0,8)}... — We will notify you once assigned.` })
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      const validFiles = files.filter(f => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type))
      
      if (validFiles.length + (formData.images?.length || 0) > 3) {
        toast.error('Maximum 3 images allowed')
        return
      }

      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...validFiles]
      }))

      const newPreviews = validFiles.map(f => URL.createObjectURL(f))
      setImagesPreview(prev => [...prev, ...newPreviews])
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => {
      const newImages = [...(prev.images || [])]
      newImages.splice(index, 1)
      return { ...prev, images: newImages }
    })
    setImagesPreview(prev => {
      const newPreviews = [...prev]
      URL.revokeObjectURL(newPreviews[index])
      newPreviews.splice(index, 1)
      return newPreviews
    })
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      z: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      z: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0
    })
  }

  return (
    <DashboardLayout role="student" userName={profile?.full_name || 'Student'} userEmail={profile?.email || ''}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-[#111111] tracking-tight mb-4">
            Submit a Complaint
          </h1>
          
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3].map(num => (
              <div 
                key={num} 
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  step >= num ? 'bg-[#111111]' : 'bg-[#EAEAEA]'
                }`}
              />
            ))}
          </div>
          <p className="text-sm font-medium text-[#787774]">Step {step} of 3</p>
        </div>

        <div className="bg-white rounded-xl border border-[#EAEAEA] p-6 md:p-8 min-h-[500px] flex flex-col relative overflow-hidden">
          <AnimatePresence mode="wait" custom={step}>
            <motion.div
              key={step}
              custom={step}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeOut' as const }}
              className="flex-1 flex flex-col"
            >
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-[#111111] mb-1">Complaint Details</h2>
                    <p className="text-sm text-[#787774]">Provide clear information so we can help you faster.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111111] mb-1.5">Title <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => {
                        setFormData({...formData, title: e.target.value})
                        if(errors.title) setErrors({...errors, title: ''})
                      }}
                      placeholder="E.g., Water leakage in bathroom"
                      className={`w-full px-3 py-2.5 rounded-lg border ${errors.title ? 'border-red-500' : 'border-[#EAEAEA]'} focus:outline-none focus:border-[#111111] transition-colors`}
                    />
                    {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111111] mb-1.5 flex justify-between">
                      <span>Description <span className="text-red-500">*</span></span>
                      <span className="text-[#787774] font-normal">{formData.description?.length || 0} chars</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => {
                        setFormData({...formData, description: e.target.value})
                        if(errors.description) setErrors({...errors, description: ''})
                      }}
                      placeholder="Provide detailed description of the issue..."
                      rows={4}
                      className={`w-full px-3 py-2.5 rounded-lg border ${errors.description ? 'border-red-500' : 'border-[#EAEAEA]'} focus:outline-none focus:border-[#111111] transition-colors resize-none`}
                    />
                    {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                  </div>

                  <DuplicateDetector
                    title={formData.title || ''}
                    description={formData.description || ''}
                    onStatusChange={(hasDuplicate) => setIsDuplicate(hasDuplicate)}
                  />

                  <div>
                    <label className="block text-sm font-medium text-[#111111] mb-3">Category <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {CATEGORY_CONFIG.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setFormData({...formData, category: cat.id as any})
                            if(errors.category) setErrors({...errors, category: ''})
                          }}
                          className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                            formData.category === cat.id
                              ? 'border-[#111111] bg-[#F7F6F3] text-[#111111]'
                              : 'border-[#EAEAEA] text-[#787774] hover:border-[#111111]/30 hover:bg-[#F7F6F3]'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                    {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-[#111111] mb-1">Location & Priority</h2>
                    <p className="text-sm text-[#787774]">Where is the issue and how urgent is it?</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#111111] mb-1.5">Building <span className="text-red-500">*</span></label>
                      <select
                        value={formData.building}
                        onChange={(e) => {
                          setFormData({...formData, building: e.target.value})
                          if(errors.building) setErrors({...errors, building: ''})
                        }}
                        className={`w-full px-3 py-2.5 rounded-lg border ${errors.building ? 'border-red-500' : 'border-[#EAEAEA]'} focus:outline-none focus:border-[#111111] transition-colors bg-white`}
                      >
                        <option value="">Select a building</option>
                        {BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                      {errors.building && <p className="text-xs text-red-500 mt-1">{errors.building}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#111111] mb-1.5">Room/Floor (Optional)</label>
                      <input
                        type="text"
                        value={formData.room_number}
                        onChange={(e) => setFormData({...formData, room_number: e.target.value})}
                        placeholder="E.g., Room 302, 3rd Floor"
                        className="w-full px-3 py-2.5 rounded-lg border border-[#EAEAEA] focus:outline-none focus:border-[#111111] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111111] mb-3">Priority Level <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {PRIORITY_CONFIG.map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setFormData({...formData, priority: p.id as any})
                            if(errors.priority) setErrors({...errors, priority: ''})
                          }}
                          className={`p-4 rounded-lg border text-left transition-all ${
                            formData.priority === p.id
                              ? `border-[#111111] ${p.color}`
                              : 'border-[#EAEAEA] bg-white hover:bg-[#F7F6F3]'
                          }`}
                        >
                          <p className={`font-medium text-[#111111] capitalize mb-1 ${formData.priority === p.id ? 'font-semibold' : ''}`}>{p.label}</p>
                          <p className="text-xs text-[#787774]">{p.desc}</p>
                        </button>
                      ))}
                    </div>
                    {errors.priority && <p className="text-xs text-red-500 mt-1">{errors.priority}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111111] mb-1.5">Evidence Images (Max 3)</label>
                    <div className="flex gap-3 mb-3">
                      <button
                        type="button"
                        onClick={() => setShowCamera(true)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#111111] text-white rounded-lg text-sm font-medium hover:bg-black transition-colors"
                      >
                        📸 Take Photo / Video
                      </button>
                    </div>
                    <div className="border-2 border-dashed border-[#EAEAEA] rounded-xl p-6 text-center hover:bg-[#F7F6F3] transition-colors relative">
                      <input 
                        type="file" 
                        accept=".jpg,.jpeg,.png,.webp" 
                        multiple 
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center justify-center pointer-events-none">
                        <UploadIcon className="w-6 h-6 text-[#787774] mb-2" />
                        <p className="text-sm font-medium text-[#111111]">Click or drag images here</p>
                        <p className="text-xs text-[#787774] mt-1">JPG, PNG or WEBP (Max 3)</p>
                      </div>
                    </div>
                    
                    {imagesPreview.length > 0 && (
                      <div className="flex gap-3 mt-4">
                        {imagesPreview.map((src, idx) => (
                          <div key={idx} className="relative w-20 h-20 rounded-lg border border-[#EAEAEA] overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="Preview" className="w-full h-full object-cover" />
                            <button 
                              onClick={() => removeImage(idx)}
                              className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black transition-colors"
                            >
                              <Cross2Icon className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-[#111111] mb-1">Review & Submit</h2>
                    <p className="text-sm text-[#787774]">Please double-check your information before submitting.</p>
                  </div>

                  <div className="bg-[#F7F6F3] rounded-xl p-5 border border-[#EAEAEA] space-y-4">
                    <div>
                      <p className="text-xs font-medium text-[#787774] mb-1 uppercase tracking-wider">Title</p>
                      <p className="font-medium text-[#111111]">{formData.title}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs font-medium text-[#787774] mb-1 uppercase tracking-wider">Description</p>
                      <p className="text-sm text-[#111111] whitespace-pre-wrap">{formData.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#EAEAEA]">
                      <div>
                        <p className="text-xs font-medium text-[#787774] mb-1 uppercase tracking-wider">Category</p>
                        <p className="text-sm font-medium capitalize text-[#111111]">{formData.category}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[#787774] mb-1 uppercase tracking-wider">Location</p>
                        <p className="text-sm font-medium text-[#111111]">{formData.building} {formData.room_number ? `(${formData.room_number})` : ''}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[#787774] mb-1 uppercase tracking-wider">Priority</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize bg-white border border-[#EAEAEA]">
                          {formData.priority}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[#787774] mb-1 uppercase tracking-wider">Attachments</p>
                        <p className="text-sm font-medium flex items-center gap-1.5 text-[#111111]">
                          <ImageIcon className="w-3.5 h-3.5" />
                          {formData.images?.length || 0} images
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#EAEAEA] p-5 relative overflow-hidden bg-white">
                    <div className="flex items-center gap-2 mb-4">
                      <InfoCircledIcon className="w-4 h-4 text-[#787774]" />
                      <h3 className="text-sm font-semibold text-[#111111]">AI Analysis</h3>
                      {aiLoading && <span className="text-xs text-[#787774] animate-pulse">Analyzing...</span>}
                    </div>
                    {aiLoading ? (
                      <div className="space-y-3">
                        <div className="h-4 bg-[#F7F6F3] rounded w-3/4 animate-pulse" />
                        <div className="h-4 bg-[#F7F6F3] rounded w-1/2 animate-pulse" />
                        <div className="h-4 bg-[#F7F6F3] rounded w-2/3 animate-pulse" />
                      </div>
                    ) : aiResult ? (
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-[#787774] uppercase tracking-wider mb-1">Summary</p>
                          <p className="text-sm text-[#111111]">{aiResult.summary}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#EAEAEA]">
                          <div>
                            <p className="text-xs font-medium text-[#787774] uppercase tracking-wider mb-1">Predicted Dept</p>
                            <p className="text-sm font-medium text-[#111111]">{aiResult.department}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-[#787774] uppercase tracking-wider mb-1">Sentiment</p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                              aiResult.sentiment === 'frustrated' ? 'bg-[#FDEBEC] text-red-700' :
                              aiResult.sentiment === 'angry' ? 'bg-red-100 text-red-800' :
                              aiResult.sentiment === 'urgent' ? 'bg-amber-100 text-amber-800' :
                              'bg-[#EDF3EC] text-green-700'
                            }`}>{aiResult.sentiment}</span>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-[#787774] uppercase tracking-wider mb-1">Urgency Score</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-[#EAEAEA] rounded-full h-2">
                                <div className={`h-2 rounded-full transition-all ${
                                  aiResult.urgency_score >= 8 ? 'bg-red-500' :
                                  aiResult.urgency_score >= 5 ? 'bg-amber-500' :
                                  'bg-green-500'
                                }`} style={{ width: `${aiResult.urgency_score * 10}%` }} />
                              </div>
                              <span className="text-sm font-semibold text-[#111111]">{aiResult.urgency_score}/10</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-[#787774] uppercase tracking-wider mb-1">Suggested Action</p>
                            <p className="text-sm text-[#111111]">{aiResult.suggested_action}</p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="pt-6 mt-auto flex items-center justify-between border-t border-[#EAEAEA]">
            <button
              onClick={handlePrev}
              disabled={step === 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                step === 1 
                  ? 'text-[#EAEAEA] cursor-not-allowed' 
                  : 'text-[#111111] hover:bg-[#F7F6F3] border border-[#EAEAEA]'
              }`}
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back
            </button>
            
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2 bg-[#111111] text-white rounded-lg text-sm font-medium hover:bg-black transition-colors"
              >
                Next Step
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-6 py-2 bg-[#111111] text-white rounded-lg text-sm font-medium hover:bg-black transition-colors"
              >
                <CheckIcon className="w-4 h-4" />
                Submit Complaint
              </button>
            )}
          </div>
        </div>
      </div>
      <CameraCapture
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={(file, previewUrl) => {
          setFormData(prev => ({
            ...prev,
            images: [...(prev.images || []), file]
          }))
          setImagesPreview(prev => [...prev, previewUrl])
          toast.success('Evidence captured!')
        }}
      />
    </DashboardLayout>
  )
}
