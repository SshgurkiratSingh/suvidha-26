import React from 'react';
import { motion } from 'framer-motion';
import { Delete, Eraser } from 'lucide-react';

const NumericKeypad = ({ onKeyPress, onBackspace, onClear }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Clear', '0', 'Back'];

  return (
    /* Increased gap and added a more rigid grid-cols-3 */
    <div className="grid grid-cols-3 gap-4 w-full p-2">
      {keys.map((key) => (
        <motion.button
          key={key}
          onMouseDown={(e) => e.preventDefault()} 
          onClick={() => {
            if (key === 'Clear') onClear();
            else if (key === 'Back') onBackspace();
            else onKeyPress(key);
          }}
          whileTap={{ scale: 0.95 }}
          className={`h-20 rounded-2xl text-3xl font-bold shadow-md flex items-center justify-center transition-all border-b-4 active:border-b-0 active:translate-y-1
            ${key === 'Clear' ? 'bg-orange-50 text-orange-600 border-orange-200' : 
              key === 'Back' ? 'bg-gray-100 text-gray-700 border-gray-300' : 
              'bg-white text-[#0A3D62] border-gray-100 active:bg-gray-50'}
          `}
        >
          {key === 'Back' ? <Delete size={32} /> : key === 'Clear' ? <Eraser size={32} /> : key}
        </motion.button>
      ))}
    </div>
  );
};

export default NumericKeypad;