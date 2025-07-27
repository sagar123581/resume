import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

function App() {
  const [files, setFiles] = useState({
    resume: null,
    jd: null
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Configure axios for CORS with credentials
  axios.defaults.withCredentials = true;
  axios.defaults.baseURL = 'https://resume-analyzer-bcbc.onrender.com';

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (fileType) => (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      setFiles(prev => ({...prev, [fileType]: e.dataTransfer.files[0]}));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!files.resume || !files.jd) {
      setError('Please upload both resume and job description files');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('resume', files.resume);
    formData.append('jd', files.jd);

    try {
      const response = await axios.post('/api/score', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to analyze documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (fileType) => (e) => {
    if (e.target.files?.[0]) {
      setFiles(prev => ({...prev, [fileType]: e.target.files[0]}));
    }
  };

  const ScoreMeter = ({ score, label }) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    const color = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';

    return (
      <div className="flex flex-col items-center">
        <svg className="w-32 h-32">
          <circle
            className="text-gray-200"
            strokeWidth="10"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="64"
            cy="64"
          />
          <circle
            className="transition-all duration-1000 ease-out"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            stroke={color}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx="64"
            cy="64"
            transform="rotate(-90 64 64)"
          />
          <text
            x="64"
            y="70"
            textAnchor="middle"
            className="text-2xl font-bold"
            fill={color}
          >
            {score}%
          </text>
        </svg>
        <span className="mt-2 text-gray-600 font-medium">{label}</span>
      </div>
    );
  };

  const extractVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 max-w-md w-full"
          >
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <header className="text-center mb-10">
          <motion.h1 
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-gray-800 mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600"
          >
            ATS Resume Analyzer
          </motion.h1>
          <motion.p
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Optimize your resume for Applicant Tracking Systems with AI-powered analysis
          </motion.p>
        </header>

        {/* Upload Form */}
        <main className="bg-white rounded-xl shadow-xl overflow-hidden">
          <motion.form
            onSubmit={handleSubmit}
            className="p-6 md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Resume Upload */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className={`relative border-2 border-dashed rounded-2xl p-6 transition-all duration-300 ${
                  isDragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-300'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop('resume')}
              >
                <div className="flex flex-col items-center justify-center text-center">
                  <svg className="w-12 h-12 text-indigo-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-800 mb-1">Upload Resume</h3>
                  <p className="text-sm text-gray-500 mb-4">PDF or DOCX (max 5MB)</p>
                  <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors duration-300">
                    Browse Files
                    <input 
                      type="file" 
                      onChange={handleFileChange('resume')} 
                      accept=".pdf,.docx"
                      className="hidden"
                    />
                  </label>
                </div>
                {files.resume && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 bg-indigo-50 rounded-lg p-3 flex items-center"
                  >
                    <svg className="w-5 h-5 text-indigo-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700 truncate">{files.resume.name}</span>
                    <button 
                      onClick={() => setFiles(prev => ({...prev, resume: null}))}
                      className="ml-auto text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </motion.div>
                )}
              </motion.div>

              {/* Job Description Upload */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className={`relative border-2 border-dashed rounded-2xl p-6 transition-all duration-300 ${
                  isDragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-300'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop('jd')}
              >
                <div className="flex flex-col items-center justify-center text-center">
                  <svg className="w-12 h-12 text-indigo-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-800 mb-1">Upload Job Description</h3>
                  <p className="text-sm text-gray-500 mb-4">PDF or DOCX (max 5MB)</p>
                  <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors duration-300">
                    Browse Files
                    <input 
                      type="file" 
                      onChange={handleFileChange('jd')} 
                      accept=".pdf,.docx"
                      className="hidden"
                    />
                  </label>
                </div>
                {files.jd && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 bg-indigo-50 rounded-lg p-3 flex items-center"
                  >
                    <svg className="w-5 h-5 text-indigo-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700 truncate">{files.jd.name}</span>
                    <button 
                      onClick={() => setFiles(prev => ({...prev, jd: null}))}
                      className="ml-auto text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading || !files.resume || !files.jd}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-4 px-6 rounded-xl text-lg font-semibold transition-all duration-300 flex items-center justify-center ${
                (!files.resume || !files.jd) ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Calculate ATS Score
                </>
              )}
            </motion.button>
          </motion.form>

          {/* Loading Indicator */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-8 py-6 bg-gray-50 border-t border-gray-200"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="h-full bg-gradient-to-r from-indigo-400 to-purple-500"
                      />
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">Processing...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Results Section */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-8 bg-white rounded-xl shadow-xl overflow-hidden"
            >
              <div className="p-6 md:p-8">
                <div className="text-center mb-10">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Your ATS Analysis Results</h2>
                  <p className="text-gray-600">Based on your resume and the job description</p>
                </div>

                <div className="flex flex-wrap justify-center gap-8 mb-12">
                  <ScoreMeter score={result.score} label="Overall Score" />
                  <ScoreMeter score={result.similarity_score} label="Similarity" />
                  <ScoreMeter score={result.skill_match} label="Skill Match" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  {/* Matched Skills */}
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="bg-green-50 rounded-xl p-6 border border-green-100"
                  >
                    <h3 className="flex items-center text-lg font-semibold text-green-800 mb-4">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Matched Skills
                    </h3>
                    <ul className="space-y-2">
                      {result.matched_skills.slice(0, 10).map((skill, index) => (
                        <motion.li 
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center text-green-700"
                        >
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          {skill}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>

                  {/* Missing Skills */}
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="bg-red-50 rounded-xl p-6 border border-red-100"
                  >
                    <h3 className="flex items-center text-lg font-semibold text-red-800 mb-4">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Missing Skills
                    </h3>
                    <ul className="space-y-2">
                      {result.missing_skills.slice(0, 10).map((skill, index) => (
                        <motion.li 
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center text-red-700"
                        >
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          {skill}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                </div>

                {/* Interview Videos */}
                <div className="mb-12">
                  <h3 className="flex items-center text-xl font-semibold text-gray-800 mb-6">
                    <svg className="w-6 h-6 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2.5a7.5 7.5 0 017.5 7.5v.75a.75.75 0 01-1.5 0V10a6 6 0 00-6-6h-.75a.75.75 0 010-1.5h.75zM10 6A4 4 0 006 10v.75a.75.75 0 01-1.5 0V10a5.5 5.5 0 015.5-5.5h.75a.75.75 0 010-1.5h-.75zM10 15.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                    </svg>
                    Recommended Interview Preparation Videos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {result.interview_videos.map((video, index) => {
                      const videoId = extractVideoId(video[1]);
                      return (
                        <motion.div
                          key={index}
                          whileHover={{ y: -5 }}
                          className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200"
                        >
                          {videoId ? (
                            <div className="relative pt-[56.25%]">
                              <iframe
                                className="absolute top-0 left-0 w-full h-full"
                                src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={video[0]}
                              />
                            </div>
                          ) : (
                            <div className="bg-gray-200 h-40 flex items-center justify-center">
                              <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M6 3l8 5-8 5V3z" />
                              </svg>
                            </div>
                          )}
                          <div className="p-4">
                            <h4 className="font-medium text-gray-800 mb-2 line-clamp-2">{video[0]}</h4>
                            <a 
                              href={video[1]} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                            >
                              Watch on YouTube
                              <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </a>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Suggestions */}
                <div>
                  <h3 className="flex items-center text-xl font-semibold text-gray-800 mb-6">
                    <svg className="w-6 h-6 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Improvement Suggestions
                  </h3>
                  <ul className="space-y-3">
                    {result.suggestions.map((suggestion, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start bg-blue-50 rounded-lg p-4"
                      >
                        <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">{suggestion}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} ATS Resume Analyzer. All rights reserved.</p>
        </footer>
      </motion.div>
    </div>
  );
}

export default App;