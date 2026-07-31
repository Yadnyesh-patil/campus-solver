'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseSpeechRecognitionReturn {
  transcript: string
  isListening: boolean
  isSupported: boolean
  start: () => void
  stop: () => void
  reset: () => void
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      setIsSupported(true)
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-IN'

      recognition.onresult = (event: any) => {
        let final = ''
        let interim = ''
        for (let i = 0; i < event.results.length; i++) {
          const text = event.results[i][0].transcript.trim()
          if (event.results[i].isFinal) {
            final += text + ' '
          } else {
            // Overwrite interim instead of concatenating. 
            // This fixes an Android Chrome bug where interim results are appended as new items.
            interim = text + ' '
          }
        }
        setTranscript((final + interim).trim())
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        if (event.error !== 'no-speech') {
          setIsListening(false)
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }
  }, [])

  const start = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('')
      recognitionRef.current.start()
      setIsListening(true)
    }
  }, [isListening])

  const stop = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [isListening])

  const reset = useCallback(() => {
    setTranscript('')
    if (isListening) stop()
  }, [isListening, stop])

  return { transcript, isListening, isSupported, start, stop, reset }
}
