import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Heart } from 'lucide-react';

export default function ChatBubble({ message, isUser, isTyping }) {
  if (isTyping) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end gap-2"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-md">
          <Heart className="w-4 h-4 text-white" fill="white" fillOpacity={0.3} />
        </div>
        <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
          <div className="flex gap-1.5">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
              className="w-2 h-2 rounded-full bg-indigo-300"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
              className="w-2 h-2 rounded-full bg-indigo-400"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
              className="w-2 h-2 rounded-full bg-indigo-500"
            />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-md flex-shrink-0">
          <Heart className="w-4 h-4 text-white" fill="white" fillOpacity={0.3} />
        </div>
      )}
      <div
        className={`max-w-[80%] px-4 py-3 ${
          isUser
            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl rounded-br-md shadow-md'
            : 'bg-white rounded-2xl rounded-bl-md shadow-sm border border-gray-100'
        }`}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed">{message}</p>
        ) : (
          <ReactMarkdown 
            className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none [&>p]:my-0"
            components={{
              p: ({ children }) => <p className="my-1">{children}</p>,
              strong: ({ children }) => <span className="font-semibold text-gray-800">{children}</span>,
            }}
          >
            {message}
          </ReactMarkdown>
        )}
      </div>
    </motion.div>
  );
}