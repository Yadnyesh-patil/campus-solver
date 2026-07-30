'use client'

import React, { useState } from 'react'
import { PaperPlaneIcon, ImageIcon } from '@radix-ui/react-icons'
import { toast } from 'sonner'

interface CommentFormProps {
  onSubmit: (comment: string, file: File | null) => void
}

export function CommentForm({ onSubmit }: CommentFormProps) {
  const [comment, setComment] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() && !file) {
      toast.error('Please enter a comment or attach a file.')
      return
    }

    setIsSubmitting(true)
    
    // Simulate network request
    await new Promise((resolve) => setTimeout(resolve, 600))
    
    onSubmit(comment, file)
    setComment('')
    setFile(null)
    setIsSubmitting(false)
    toast.success('Comment added successfully.')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-[#EAEAEA] rounded-xl p-4 bg-white mt-6">
      <h4 className="font-semibold text-sm mb-3">Add a Comment</h4>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Type your update here..."
        className="w-full min-h-[80px] p-3 border border-[#EAEAEA] rounded-lg text-sm bg-[#F7F6F3] focus:outline-none focus:ring-1 focus:ring-black mb-3 resize-none"
        disabled={isSubmitting}
      />
      <div className="flex items-center justify-between">
        <div>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileChange}
            disabled={isSubmitting}
            accept="image/*,.pdf"
          />
          <label
            htmlFor="file-upload"
            className="flex items-center gap-2 cursor-pointer text-sm text-[#787774] hover:text-[#111111] transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
            <span>{file ? file.name : 'Attach file'}</span>
          </label>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2 bg-[#111111] text-white rounded-lg text-sm font-medium hover:bg-black/80 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <PaperPlaneIcon className="w-4 h-4" />
          <span>{isSubmitting ? 'Posting...' : 'Post Comment'}</span>
        </button>
      </div>
    </form>
  )
}
