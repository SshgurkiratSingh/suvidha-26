import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

// Professional slides focused on core Smart City objectives
const slides = [
  {
    url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=1920',
    title: 'Electricity Services',
    desc: 'Manage power bills and new connections seamlessly.'
  },
  {
    url: 'https://images.unsplash.com/photo-1558449028-b53a39d100fc?auto=format&fit=crop&q=80&w=1920', // New Gas Distribution image
    title: 'Renewable Energy',
    desc: 'Solar panel registration and green energy incentives.'
  },
  {
    url: 'https://images.unsplash.com/photo-1509391366360-feaffa6032d5?auto=format&fit=crop&q=80&w=1920', // Gas Distribution
    title: 'Gas Distribution',
    desc: 'Track consumption and connection management for piped gas.'
  },
  {
    url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=1920', // Sanitation / Waste Management
    title: 'Sanitation & Waste',
    desc: 'Report waste issues and request sanitation services.'
  },
  {
    url: 'https://images.unsplash.com/photo-1521207418485-99c705420785?auto=format&fit=crop&q=80&w=1920', 
    title: 'Water Management',
    desc: 'Monitor water usage and report leakages instantly.'
  }
]

const AttractScreen = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <motion.div 
      className="relative min-h-screen w-full overflow-hidden bg-black cursor-pointer"
      onClick={() => navigate('/language')}
    >
      {/* Background Slideshow with smooth fade transitions */}
      <AnimatePresence mode='wait'>
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${slides[currentSlide].url})` }}
        />
      </AnimatePresence>

      {/* Institutional Branding: Top Bar for MeitY and C-DAC logos */}
      <div className="absolute top-0 w-full p-8 flex justify-between items-start z-20">
        <div className="flex items-center gap-6 bg-white/10 backdrop-blur-lg p-5 rounded-2xl border border-white/20">
          <div className="flex flex-col items-center">
             <div className="h-10 w-20 bg-white/20 flex items-center justify-center text-[10px] text-white rounded font-bold uppercase tracking-wider">MeitY</div>
             <span className="text-[8px] text-white/60 mt-1">Govt of India</span>
          </div>
          <div className="w-[1px] h-10 bg-white/20" />
          <div className="flex flex-col items-center">
             <div className="h-10 w-20 bg-white/20 flex items-center justify-center text-[10px] text-white rounded font-bold uppercase tracking-wider">C-DAC</div>
             <span className="text-[8px] text-white/60 mt-1">Innovation Hub</span>
          </div>
        </div>
        
        <div className="text-right text-white drop-shadow-xl p-4 bg-black/20 rounded-xl backdrop-blur-sm">
          <h2 className="text-3xl font-black tracking-tighter">SUVIDHA 2026</h2>
          <p className="text-xs opacity-70 uppercase tracking-[0.2em]">Smart Urban Helpdesk</p>
        </div>
      </div>

      {/* Central Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-screen px-4">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mb-10"
        >
          <h1 className="text-8xl font-black text-white mb-4 tracking-tighter uppercase drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
            {t('welcomeToSuvidha')}
          </h1>
          <div className="h-1 w-32 bg-blue-500 mx-auto mb-6 rounded-full" />
          <p className="text-4xl text-blue-300 font-bold mb-2">
            {slides[currentSlide].title}
          </p>
          <p className="text-xl text-white/80 font-medium italic">
            {slides[currentSlide].desc}
          </p>
        </motion.div>

        {/* Pulsing Start Button */}
        <motion.div
          animate={{ scale: [1, 1.05, 1], boxShadow: ["0 0 20px rgba(34,197,94,0.2)", "0 0 40px rgba(34,197,94,0.5)", "0 0 20px rgba(34,197,94,0.2)"] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="bg-green-600 hover:bg-green-500 text-white text-3xl font-black px-20 py-8 rounded-2xl transition-all border-b-8 border-green-800"
        >
          {t('touchToStart')}
        </motion.div>
      </div>

      {/* Service Highlights Panel */}
      <div className="absolute bottom-0 w-full grid grid-cols-5 gap-0.5 bg-white/5 backdrop-blur-3xl z-20 border-t border-white/10">
        {['Electricity', 'Solar', 'Gas', 'Sanitation', 'Water'].map((service) => (
          <div key={service} className="py-6 px-2 text-center group hover:bg-white/10 transition-colors cursor-pointer">
            <div className="text-white font-black text-sm uppercase tracking-widest mb-1 group-hover:text-blue-400 transition-colors">{service}</div>
            <div className="text-blue-300/50 text-[10px] uppercase font-bold">Smart Service</div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default AttractScreen