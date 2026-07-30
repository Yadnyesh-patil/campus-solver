'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cross2Icon, StarFilledIcon, StarIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';

interface StudentCloseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  complaintTitle: string;
  onConfirmClose: (rating: number, feedback: string) => void;
  onReopen: () => void;
}

export function StudentCloseDialog({
  isOpen,
  onClose,
  complaintTitle,
  onConfirmClose,
  onReopen
}: StudentCloseDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmClose = async () => {
    if (rating === 0) {
      toast.error('Please provide a rating before closing.');
      return;
    }
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    onConfirmClose(rating, feedback);
    setIsSubmitting(false);
    toast.success('Complaint closed successfully. Thank you for your feedback!');
    onClose();
  };

  const handleReopen = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    onReopen();
    setIsSubmitting(false);
    toast.success('Complaint has been reopened.');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-xl shadow-xl border border-[#EAEAEA] w-full max-w-md overflow-hidden pointer-events-auto flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#EAEAEA]">
                <h3 className="font-semibold text-[#111111]">Verify Resolution</h3>
                <button
                  onClick={onClose}
                  className="p-1 rounded-md hover:bg-[#F7F6F3] text-[#787774] transition-colors"
                >
                  <Cross2Icon className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto">
                <div className="mb-6">
                  <p className="text-sm text-[#787774] mb-1">Complaint</p>
                  <p className="font-medium text-[#111111] line-clamp-2">{complaintTitle}</p>
                </div>

                <div className="text-center mb-6">
                  <h4 className="text-lg font-medium text-[#111111] mb-2">
                    Was your issue resolved satisfactorily?
                  </h4>
                  <p className="text-sm text-[#787774]">
                    The technician marked this issue as resolved. Please confirm or reopen if you need further assistance.
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex justify-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="p-1 transition-transform hover:scale-110 focus:outline-none"
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        onClick={() => setRating(star)}
                      >
                        {star <= (hoveredRating || rating) ? (
                          <StarFilledIcon className="w-8 h-8 text-amber-500" />
                        ) : (
                          <StarIcon className="w-8 h-8 text-[#EAEAEA]" />
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-xs text-[#787774] font-medium h-4">
                    {rating > 0 ? ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating - 1] : 'Select a rating'}
                  </p>
                </div>

                <div className="mb-2">
                  <label htmlFor="feedback" className="block text-sm font-medium text-[#111111] mb-2">
                    Feedback (Optional)
                  </label>
                  <textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Tell us about your experience..."
                    className="w-full min-h-[100px] p-3 text-sm rounded-lg border border-[#EAEAEA] bg-[#F7F6F3] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EAEAEA] resize-y transition-colors"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-[#EAEAEA] bg-[#F7F6F3] flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleReopen}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 text-sm font-medium text-[#111111] bg-white border border-[#EAEAEA] rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#EAEAEA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  No, Reopen
                </button>
                <button
                  onClick={handleConfirmClose}
                  disabled={isSubmitting || rating === 0}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Closing...' : 'Yes, Close Complaint'}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
