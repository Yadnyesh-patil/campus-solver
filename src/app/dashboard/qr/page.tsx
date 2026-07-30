'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { QRCodeSVG } from 'qrcode.react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DownloadIcon, Cross2Icon, LayersIcon } from '@radix-ui/react-icons'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'

const BUILDINGS = [
  'Hostel A', 'Hostel B', 'Hostel C', 
  'Academic Block A', 'Academic Block B', 
  'Library Building', 'Sports Complex', 
  'Medical Center', 'Main Canteen', 
  'Admin Block', 'Computer Center', 'Workshop'
]

export default function QRCodeGeneratorPage() {
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null)
  const [roomNumber, setRoomNumber] = useState('')
  
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://campussolver.vitbhopal.ac.in'
  
  const qrUrl = selectedBuilding 
    ? `${origin}/dashboard/submit?building=${encodeURIComponent(selectedBuilding)}${roomNumber ? `&room=${encodeURIComponent(roomNumber)}` : ''}`
    : ''

  const handleDownload = () => {
    const svg = document.getElementById('qr-code-svg')
    if (!svg) return
    
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width + 80 // Add padding
      canvas.height = img.height + 120 // Add padding and space for text
      
      if (ctx) {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        ctx.drawImage(img, 40, 40)
        
        ctx.fillStyle = '#111111'
        ctx.font = 'bold 24px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(selectedBuilding || '', canvas.width / 2, canvas.height - 40)
        
        if (roomNumber) {
          ctx.font = '16px sans-serif'
          ctx.fillStyle = '#787774'
          ctx.fillText(`Room: ${roomNumber}`, canvas.width / 2, canvas.height - 15)
        }
      }
      
      const pngFile = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.download = `QR-${selectedBuilding}${roomNumber ? `-${roomNumber}` : ''}.png`
      downloadLink.href = pngFile
      downloadLink.click()
      
      toast.success('QR Code downloaded successfully')
    }
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  const { profile } = useAuth();

  return (
    <DashboardLayout role="student" userName={profile?.full_name || 'Student'} userEmail={profile?.email || ''}>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#111111]">Location QR Generator</h1>
          <p className="text-[#787774] mt-1">Generate scan-to-submit QR codes for campus locations.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {BUILDINGS.map((building) => (
                <motion.div
                  whileHover={{ y: -2 }}
                  key={building}
                  onClick={() => setSelectedBuilding(building)}
                  className={`cursor-pointer bg-white rounded-xl border p-5 shadow-sm transition-colors ${
                    selectedBuilding === building ? 'border-[#111111] ring-1 ring-[#111111]' : 'border-[#EAEAEA] hover:border-[#787774]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${selectedBuilding === building ? 'bg-[#111111] text-white' : 'bg-[#F7F6F3] text-[#111111]'}`}>
                        <LayersIcon className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-sm text-[#111111]">{building}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="md:col-span-1">
            <AnimatePresence mode="wait">
              {selectedBuilding ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white rounded-xl border border-[#EAEAEA] p-6 shadow-sm sticky top-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-[#111111]">Configure QR</h3>
                    <button 
                      onClick={() => {
                        setSelectedBuilding(null)
                        setRoomNumber('')
                      }}
                      className="p-1.5 hover:bg-[#F7F6F3] rounded-md text-[#787774]"
                    >
                      <Cross2Icon className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    <div>
                      <label className="block text-xs font-medium text-[#787774] mb-1.5 uppercase tracking-wider">Building</label>
                      <div className="w-full px-3 py-2 bg-[#F7F6F3] border border-[#EAEAEA] rounded-md text-sm text-[#111111]">
                        {selectedBuilding}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-[#787774] mb-1.5 uppercase tracking-wider">Room / Area (Optional)</label>
                      <input
                        type="text"
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        placeholder="e.g. 402, Ground Floor"
                        className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#111111] focus:border-[#111111] transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center p-6 bg-[#F7F6F3] border border-[#EAEAEA] rounded-xl mb-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                      <QRCodeSVG
                        id="qr-code-svg"
                        value={qrUrl}
                        size={180}
                        bgColor={"#ffffff"}
                        fgColor={"#111111"}
                        level={"Q"}
                        includeMargin={false}
                      />
                    </div>
                    <div className="mt-4 text-center">
                      <p className="font-medium text-[#111111]">{selectedBuilding}</p>
                      {roomNumber && <p className="text-sm text-[#787774]">{roomNumber}</p>}
                    </div>
                  </div>

                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center space-x-2 bg-[#111111] text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-[#222222] transition-colors"
                  >
                    <DownloadIcon className="w-4 h-4" />
                    <span>Download QR Card</span>
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-[#F7F6F3] rounded-xl border border-dashed border-[#EAEAEA] p-10 flex flex-col items-center justify-center text-center h-full min-h-[400px]"
                >
                  <LayersIcon className="w-8 h-8 text-[#787774] mb-3" />
                  <h3 className="font-medium text-[#111111] mb-1">Select a Building</h3>
                  <p className="text-sm text-[#787774]">Choose a building from the grid to generate its QR code.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
