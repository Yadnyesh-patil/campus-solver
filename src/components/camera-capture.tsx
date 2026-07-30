'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Cross2Icon, CameraIcon } from '@radix-ui/react-icons'

interface CameraCaptureProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (file: File, preview: string) => void
}

export function CameraCapture({ isOpen, onClose, onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [mode, setMode] = useState<'photo' | 'video'>('photo')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [preview, setPreview] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<'photo' | 'video'>('photo')
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: mode === 'video',
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error('Camera access denied:', err)
    }
  }, [mode])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
      setPreview(null)
      setIsRecording(false)
      setRecordingTime(0)
    }
    return () => stopCamera()
  }, [isOpen, startCamera, stopCamera])

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
      setPreview(dataUrl)
      setPreviewType('photo')
    }
  }

  const startRecording = () => {
    if (!streamRef.current) return
    chunksRef.current = []
    const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' })
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      setPreview(url)
      setPreviewType('video')
    }
    mediaRecorderRef.current = recorder
    recorder.start()
    setIsRecording(true)
    setRecordingTime(0)
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= 15) {
          stopRecording()
          return 15
        }
        return prev + 1
      })
    }, 1000)
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  const handleConfirm = () => {
    if (!preview) return
    if (previewType === 'photo' && canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
          onCapture(file, preview)
          onClose()
        }
      }, 'image/jpeg', 0.9)
    } else {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      const file = new File([blob], `video-${Date.now()}.webm`, { type: 'video/webm' })
      onCapture(file, preview)
      onClose()
    }
  }

  const handleRetake = () => {
    setPreview(null)
    setRecordingTime(0)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#EAEAEA]">
            <div className="flex gap-2">
              <button
                onClick={() => { setMode('photo'); setPreview(null) }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'photo' ? 'bg-[#111111] text-white' : 'text-[#787774] hover:bg-[#F7F6F3]'
                }`}
              >
                📸 Photo
              </button>
              <button
                onClick={() => { setMode('video'); setPreview(null) }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'video' ? 'bg-[#111111] text-white' : 'text-[#787774] hover:bg-[#F7F6F3]'
                }`}
              >
                🎥 Video
              </button>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[#F7F6F3] rounded-lg transition-colors">
              <Cross2Icon className="w-5 h-5" />
            </button>
          </div>

          {/* Camera/Preview */}
          <div className="relative aspect-video bg-black">
            {preview ? (
              previewType === 'photo' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Captured" className="w-full h-full object-contain" />
              ) : (
                <video src={preview} controls className="w-full h-full object-contain" />
              )
            ) : (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            )}
            <canvas ref={canvasRef} className="hidden" />

            {/* Recording indicator */}
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                REC {recordingTime}s / 15s
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-4 flex items-center justify-center gap-4">
            {!preview ? (
              <>
                {mode === 'photo' ? (
                  <button
                    onClick={takePhoto}
                    className="w-16 h-16 rounded-full bg-[#111111] text-white flex items-center justify-center hover:bg-black transition-all hover:scale-105 shadow-lg"
                  >
                    <CameraIcon className="w-6 h-6" />
                  </button>
                ) : isRecording ? (
                  <button
                    onClick={stopRecording}
                    className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all hover:scale-105 shadow-lg"
                  >
                    <div className="w-5 h-5 rounded-full bg-white" />
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={handleRetake}
                  className="flex-1 py-3 px-4 border border-[#EAEAEA] rounded-lg text-sm font-medium text-[#787774] hover:bg-[#F7F6F3] transition-colors"
                >
                  Retake
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-3 px-4 bg-[#111111] text-white rounded-lg text-sm font-medium hover:bg-black transition-colors"
                >
                  ✅ Use This
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
