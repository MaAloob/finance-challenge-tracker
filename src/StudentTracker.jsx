import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Award, TrendingUp, BookOpen, DollarSign, Target, Lock, Upload, X, File } from 'lucide-react';

const SUPABASE_URL = 'https://utvddvfqsmieiyrutsxo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0dmRkdmZxc21pZWl5cnV0c3hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMDE3MzgsImV4cCI6MjA5OTg3NzczOH0.xEczZ6H7J4mem2pkDrJSr7CiT6XyLxsof51ASKX-2oU';
const COHORT = 'cohort_2'; // This tracker instance is for Cohort 2

const FinanceChallengeTracker = () => {
  const [completedDays, setCompletedDays] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [fileUploads, setFileUploads] = useState({});
  const [earnings, setEarnings] = useState(0);
  const [showSubmissionModal, setShowSubmissionModal] = useState(null);
  const [tempSubmissions, setTempSubmissions] = useState({});
  const [tempFiles, setTempFiles] = useState({});
  const [registered, setRegistered] = useState(false);
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [showStartForm, setShowStartForm] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [settingsError, setSettingsError] = useState(false);

  const phases = [
    { phase: 1, name: "Foundation", description: "Money Identity & Awareness", days: [
      { day: 1, title: "Financial Reality Check", tasks: ["Track expenses", "Download money app", "Identify money leak"], submissions: ["Expense list screenshot", "App screenshot", "Biggest money leak"] },
      { day: 2, title: "Scarcity Pattern Breakdown", tasks: ["List 10 transactions", "Categorize spending", "ChatGPT analysis"], submissions: ["Categorized spending screenshot", "3 waste patterns", "Money identity summary"] },
      { day: 3, title: "Scarcity Detox", tasks: ["Turn off app notifications", "₦0 spend for 24hrs", "Parental money influence"], submissions: ["Notifications off screenshot", "Did you break the rule?", "Parent influence notes"] },
      { day: 4, title: "Biblical Stewardship", tasks: ["Read Luke 16:10-11, Proverbs 21:5", "Stewardship reflection", "₦100k allocation"], submissions: ["Written reflection", "₦100k breakdown", "Commitment prayer"] },
      { day: 5, title: "Financial Baseline & Vision", tasks: ["Calculate income vs expenses", "Set 90-day target", "Watch wealth video"], submissions: ["Income/expense numbers", "Expense to cut", "3 new beliefs"] }
    ]},
    { phase: 2, name: "Skill Discovery", description: "Finding Your Money-Making Skill", days: [
      { day: 6, title: "Online Skill Exposure", tasks: ["Watch income model videos", "List 5 skills"], submissions: ["4 income models explained", "5 interesting skills"] },
      { day: 7, title: "Skill Breakdown", tasks: ["Choose 5 skills", "Identify buyers"], submissions: ["5 skills with buyer + problem"] },
      { day: 8, title: "AI Skill Matching", tasks: ["ChatGPT skill analysis", "Get 3 recommendations"], submissions: ["ChatGPT recommendations screenshot"] },
      { day: 9, title: "Skill Demand Validation", tasks: ["Research Fiverr/Upwork", "Check prices"], submissions: ["Marketplace screenshot", "Price range"] },
      { day: 10, title: "Skill Commitment", tasks: ["Choose ONE skill", "Write positioning"], submissions: ["My ONE skill is...", "Positioning statement"] },
      { day: 11, title: "Learning Path Setup", tasks: ["Find 3 resources", "Learning schedule"], submissions: ["Resource links", "Schedule screenshot"] }
    ]},
    { phase: 3, name: "Income Paths", description: "Positioning & Strategy", days: [
      { day: 12, title: "Service Model", tasks: ["Create 3 tiers", "Price each"], submissions: ["3 service tiers"] },
      { day: 13, title: "Affiliate Marketing", tasks: ["Research 2 programs"], submissions: ["2 affiliate programs"] },
      { day: 14, title: "Business Models", tasks: ["List 3 problems", "Match to skill"], submissions: ["Problem-skill match"] },
      { day: 15, title: "Content Creation", tasks: ["Choose brand type", "Pick platform"], submissions: ["Platform", "5 content ideas", "Profile screenshot"] },
      { day: 16, title: "Income Path Decision", tasks: ["Choose primary path", "Write ₦10k plan"], submissions: ["Income path", "₦10k plan"] },
      { day: 17, title: "First Post", tasks: ["Create content", "Post it"], submissions: ["Post screenshot/link"] },
      { day: 18, title: "Visibility Strategy", tasks: ["Study 3 creators"], submissions: ["3 creator breakdowns"] }
    ]},
    { phase: 4, name: "Monetization", description: "Marketing & First Sales", days: [
      { day: 19, title: "Marketing Funnel", tasks: ["Draw funnel", "Audience pain"], submissions: ["Funnel drawing photo/screenshot"] },
      { day: 20, title: "Pricing Strategy", tasks: ["Research prices", "Create offer"], submissions: ["Complete offer details"] },
      { day: 21, title: "Outreach Day", tasks: ["Send 5 DMs", "Track responses"], submissions: ["Message screenshots (hide names)"] },
      { day: 22, title: "Handle Rejection", tasks: ["Review feedback", "Rewrite offer"], submissions: ["Improved offer"] },
      { day: 23, title: "Income Tracker", tasks: ["Create tracker", "Set milestones"], submissions: ["Tracker screenshot"] },
      { day: 24, title: "Testimonial System", tasks: ["Draft request", "Proof folder"], submissions: ["Request message", "Proof folder screenshot"] }
    ]},
    { phase: 5, name: "Money Management", description: "Systems & Investing", days: [
      { day: 25, title: "4 Bucket Budget", tasks: ["Create buckets", "Assign percentages"], submissions: ["4 buckets + percentages"] },
      { day: 26, title: "Saving Automation", tasks: ["Setup auto-save", "₦500 weekly"], submissions: ["Savings setup screenshot"] },
      { day: 27, title: "Spending Control", tasks: ["Daily limit", "Remove subscription"], submissions: ["Daily limit set", "Subscription removed screenshot"] },
      { day: 28, title: "Investing Basics", tasks: ["Watch video", "Explain stocks"], submissions: ["Video title", "Investing vs gambling explanation"] },
      { day: 29, title: "Stewardship Check", tasks: ["Re-read Matthew 25", "Money lesson"], submissions: ["Stewardship lesson", "Mindset shift reflection"] }
    ]},
    { phase: 6, name: "Systems & Next Steps", description: "90-Day Plan", days: [
      { day: 30, title: "Skill Audit", tasks: ["Rate skill 1-10", "Income action"], submissions: ["Skill rating", "Action proof screenshot"] },
      { day: 31, title: "90-Day Plan", tasks: ["What worked", "3-month plan"], submissions: ["Review notes", "90-day plan screenshot"] },
      { day: 32, title: "Final Declaration", tasks: ["Write commitment", "Prayer"], submissions: ["Final declaration screenshot", "Prayer written", "Partner name"] }
    ]}
  ];

  // Load local progress (device-specific view only — source of truth is Supabase)
  useEffect(() => {
    const saved = localStorage.getItem('challengeProgress_' + COHORT);
    if (saved) {
      const data = JSON.parse(saved);
      setCompletedDays(data.completedDays || []);
      setSubmissions(data.submissions || {});
      setFileUploads(data.fileUploads || {});
      setEarnings(data.earnings || 0);
      setEmail(data.email || '');
      setUserName(data.userName || '');
      setRegistered(!!data.email);
    }
    fetchCohortStartDate();
  }, []);

  useEffect(() => {
    if (registered) {
      localStorage.setItem('challengeProgress_' + COHORT, JSON.stringify({
        completedDays, submissions, fileUploads, earnings, email, userName
      }));
    }
  }, [completedDays, submissions, fileUploads, earnings, email, userName, registered]);

  const fetchCohortStartDate = async () => {
    setLoadingSettings(true);
    setSettingsError(false);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/cohort_settings?cohort=eq.${COHORT}&select=start_date`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        setStartDate(data[0].start_date);
      } else {
        setStartDate(null);
      }
    } catch (err) {
      console.error('Error fetching cohort settings:', err);
      setSettingsError(true);
    } finally {
      setLoadingSettings(false);
    }
  };

  const insertSubmission = async (payload) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/submissions`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });
      return res.ok;
    } catch (err) {
      console.error('Error inserting to Supabase:', err);
      return false;
    }
  };

  const startChallenge = async () => {
    if (!tempName.trim() || !tempEmail.trim()) {
      alert('Please enter your name and email');
      return;
    }
    setUserName(tempName);
    setEmail(tempEmail);
    setRegistered(true);
    setShowStartForm(false);

    await insertSubmission({
      cohort: COHORT,
      user_name: tempName,
      email: tempEmail,
      day: 0,
      day_title: 'Registration',
      completed: true,
      submissions: {},
      files: {},
      earnings: 0
    });
  };

  const getCurrentDay = () => {
    if (!startDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
    return Math.min(Math.max(diffDays + 1, 0), 32);
  };

  const daysUnlocked = getCurrentDay();
  const isDayUnlocked = (dayNumber) => startDate && dayNumber <= daysUnlocked && daysUnlocked > 0;

  const handleFileUpload = (submissionIdx, file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setTempFiles({
        ...tempFiles,
        [submissionIdx]: { name: file.name, type: file.type, data: reader.result, size: file.size }
      });
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (submissionIdx) => {
    const newFiles = { ...tempFiles };
    delete newFiles[submissionIdx];
    setTempFiles(newFiles);
  };

  const openSubmissionModal = (day) => {
    if (!isDayUnlocked(day)) return;
    setShowSubmissionModal(day);
    const dayData = phases.flatMap(p => p.days).find(d => d.day === day);
    const existingSubs = submissions[day] || {};
    const existingFiles = fileUploads[day] || {};
    const initSubs = {};
    dayData.submissions.forEach((sub, idx) => { initSubs[idx] = existingSubs[idx] || ''; });
    setTempSubmissions(initSubs);
    setTempFiles(existingFiles);
  };

  const saveSubmissions = async () => {
    setIsSubmitting(true);
    const day = showSubmissionModal;
    const dayData = phases.flatMap(p => p.days).find(d => d.day === day);

    const success = await insertSubmission({
      cohort: COHORT,
      user_name: userName,
      email: email,
      day: day,
      day_title: dayData?.title,
      completed: true,
      submissions: tempSubmissions,
      files: Object.keys(tempFiles).reduce((acc, key) => {
        acc[key] = { name: tempFiles[key].name, type: tempFiles[key].type, size: tempFiles[key].size, data: tempFiles[key].data };
        return acc;
      }, {}),
      earnings: earnings
    });

    if (success) {
      setSubmissions({ ...submissions, [day]: tempSubmissions });
      setFileUploads({ ...fileUploads, [day]: tempFiles });
      if (!completedDays.includes(day)) setCompletedDays([...completedDays, day]);
      setShowSubmissionModal(null);
      setTempSubmissions({});
      setTempFiles({});
    } else {
      alert('⚠️ Could not save your submission. Please check your internet connection and try again.');
    }
    setIsSubmitting(false);
  };

  const logout = () => {
    if (!confirm('Switch account? Your progress is safely saved on the server — this just clears this device\'s view.')) return;
    localStorage.removeItem('challengeProgress_' + COHORT);
    setRegistered(false);
    setCompletedDays([]);
    setSubmissions({});
    setFileUploads({});
    setEarnings(0);
    setEmail('');
    setUserName('');
    setTempName('');
    setTempEmail('');
    setShowStartForm(false);
  };

  const totalDays = 32;
  const completionRate = Math.round((completedDays.length / totalDays) * 100);

  // Waiting for admin to set the cohort start date
  if (!loadingSettings && !startDate && !settingsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-lg text-center border-2 border-pink-200">
          <Target className="w-16 h-16 text-pink-600 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-3">32-Day Money Challenge</h1>
          <p className="text-gray-600 mb-2">Facilitated by Ifeoluwa Adebayo</p>
          <div className="bg-gray-900 text-white rounded-xl p-4 mt-6">
            <p className="font-medium">⏳ This cohort hasn't started yet.</p>
            <p className="text-sm opacity-80 mt-1">Please check back once your facilitator announces the start date.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!registered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-2xl border-2 border-pink-200">
          <Target className="w-20 h-20 text-pink-600 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 text-center">32-Day Money Challenge</h1>
          <p className="text-xl text-gray-600 mb-2 text-center">Money, Mindset & Online Income</p>
          <p className="text-sm text-pink-600 mb-8 text-center font-medium">Facilitated by Ifeoluwa Adebayo</p>

          <div className="bg-pink-50 rounded-xl p-6 mb-8 border border-pink-200">
            <h3 className="font-bold text-lg mb-3 text-gray-900">🎯 What You'll Achieve:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2"><span className="text-pink-600 mt-1">✓</span><span>Master money mindset & eliminate scarcity</span></li>
              <li className="flex items-start gap-2"><span className="text-pink-600 mt-1">✓</span><span>Discover a profitable online skill</span></li>
              <li className="flex items-start gap-2"><span className="text-pink-600 mt-1">✓</span><span>Create your first income stream</span></li>
              <li className="flex items-start gap-2"><span className="text-pink-600 mt-1">✓</span><span>Build sustainable money system</span></li>
              <li className="flex items-start gap-2"><span className="text-pink-600 mt-1">✓</span><span>Launch your 90-day income plan</span></li>
            </ul>
          </div>

          {startDate && (
            <div className="bg-gray-900 text-white rounded-xl p-4 mb-6 text-center">
              <p className="text-sm font-medium">🗓️ Cohort started: {new Date(startDate).toLocaleDateString()}</p>
              <p className="text-xs mt-1 opacity-80">Day {daysUnlocked} is currently available</p>
            </div>
          )}

          {!showStartForm ? (
            <button onClick={() => setShowStartForm(true)} className="w-full bg-gradient-to-r from-pink-600 to-pink-500 text-white text-xl font-bold py-4 rounded-xl hover:from-pink-700 hover:to-pink-600 shadow-lg">
              Start Challenge 🚀
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900">Your Name</label>
                <input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} placeholder="Enter full name" className="w-full p-3 border-2 border-pink-200 rounded-lg focus:border-pink-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900">Email</label>
                <input type="email" value={tempEmail} onChange={(e) => setTempEmail(e.target.value)} placeholder="your@email.com" className="w-full p-3 border-2 border-pink-200 rounded-lg focus:border-pink-500 focus:outline-none" />
              </div>
              <button onClick={startChallenge} className="w-full bg-gradient-to-r from-pink-600 to-pink-500 text-white font-bold py-3 rounded-xl hover:from-pink-700 hover:to-pink-600">
                Begin Now! 🚀
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-pink-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Target className="w-10 h-10 text-pink-600" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">32-Day Challenge</h1>
                <p className="text-gray-600">Welcome {userName}!</p>
                <p className="text-xs text-pink-600">By Ifeoluwa Adebayo</p>
              </div>
            </div>
            <button onClick={logout} className="text-xs text-gray-500 hover:text-pink-600 underline">
              Not {userName}? Switch account
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-pink-50 rounded-xl p-4 border border-pink-200">
              <div className="flex items-center gap-2 mb-1"><CheckCircle2 className="w-5 h-5 text-pink-600" /><span className="text-sm text-gray-700">Completed</span></div>
              <p className="text-2xl font-bold text-pink-600">{completedDays.length}/32</p>
            </div>
            <div className="bg-gray-900 text-white rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-5 h-5" /><span className="text-sm">Progress</span></div>
              <p className="text-2xl font-bold">{completionRate}%</p>
            </div>
            <div className="bg-pink-50 rounded-xl p-4 border border-pink-200">
              <div className="flex items-center gap-2 mb-1"><BookOpen className="w-5 h-5 text-pink-600" /><span className="text-sm text-gray-700">Current Day</span></div>
              <p className="text-2xl font-bold text-pink-600">{daysUnlocked}/32</p>
            </div>
            <div className="bg-gray-900 text-white rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1"><DollarSign className="w-5 h-5" /><span className="text-sm">Earned</span></div>
              <p className="text-xl font-bold">₦{earnings.toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm font-bold text-pink-600">{completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-gradient-to-r from-pink-600 to-pink-500 h-3 rounded-full transition-all" style={{ width: `${completionRate}%` }} />
            </div>
          </div>
        </div>

        {phases.map((phase) => (
          <div key={phase.phase} className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${phase.days.every(d => completedDays.includes(d.day)) ? 'bg-pink-600' : 'bg-gray-900'}`}>
                {phase.phase}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">Phase {phase.phase}: {phase.name}</h2>
                <p className="text-gray-600 text-sm">{phase.description}</p>
              </div>
            </div>

            <div className="space-y-3">
              {phase.days.map((day) => {
                const isUnlocked = isDayUnlocked(day.day);
                const isCompleted = completedDays.includes(day.day);
                const hasFiles = fileUploads[day.day] && Object.keys(fileUploads[day.day]).length > 0;

                return (
                  <div key={day.day} className={`border-2 rounded-xl p-4 ${!isUnlocked ? 'border-gray-200 bg-gray-50 opacity-60' : isCompleted ? 'border-pink-300 bg-pink-50' : 'border-pink-200 bg-white'}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {!isUnlocked ? <Lock className="w-6 h-6 text-gray-400" /> : isCompleted ? <CheckCircle2 className="w-6 h-6 text-pink-600" /> : <Circle className="w-6 h-6 text-pink-600" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-bold text-gray-900">Day {day.day}</span>
                          {!isUnlocked && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">Locked</span>}
                          {isUnlocked && day.day === daysUnlocked && !isCompleted && <span className="text-xs bg-pink-600 text-white px-2 py-1 rounded-full animate-pulse">Available Now!</span>}
                          {isCompleted && <span className="text-xs bg-pink-600 text-white px-2 py-1 rounded-full">✓ Complete</span>}
                          {hasFiles && <span className="text-xs bg-gray-900 text-white px-2 py-1 rounded-full">📎 {Object.keys(fileUploads[day.day]).length} file(s)</span>}
                        </div>
                        <h3 className="font-semibold mb-2 text-gray-900">{day.title}</h3>
                        {isUnlocked && (
                          <>
                            <div className="mb-3">
                              <p className="text-xs font-semibold text-gray-600 mb-1">Tasks:</p>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {day.tasks.map((task, idx) => (
                                  <li key={idx} className="flex gap-2"><span className="text-pink-600">•</span><span>{task}</span></li>
                                ))}
                              </ul>
                            </div>
                            <button onClick={() => openSubmissionModal(day.day)} className={`text-sm px-4 py-2 rounded-lg font-medium ${isCompleted ? 'bg-pink-600 text-white hover:bg-pink-700' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
                              {isCompleted ? '✏️ View/Edit Submission' : '📤 Submit Work'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {completedDays.length === 32 && (
          <div className="bg-gradient-to-r from-pink-600 to-pink-500 rounded-2xl p-8 text-center text-white border-2 border-pink-700">
            <Award className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">🎉 Challenge Complete!</h2>
            <p className="text-xl mb-4">Congratulations {userName}!</p>
            <p className="text-lg">You've completed all 32 days! 🚀</p>
          </div>
        )}

        {showSubmissionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 my-8 border-2 border-pink-200 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Day {showSubmissionModal} Submissions</h3>
              <div className="space-y-4 mb-6">
                {phases.flatMap(p => p.days).find(d => d.day === showSubmissionModal)?.submissions.map((sub, idx) => (
                  <div key={idx} className="border-2 border-pink-100 rounded-lg p-4">
                    <label className="block text-sm font-semibold mb-2 text-gray-900">{idx + 1}. {sub}</label>
                    <textarea value={tempSubmissions[idx] || ''} onChange={(e) => setTempSubmissions({...tempSubmissions, [idx]: e.target.value})} placeholder="Enter your text response..." className="w-full h-20 p-3 border-2 border-pink-200 rounded-lg resize-none focus:border-pink-500 focus:outline-none mb-2" />
                    <label className="flex-1 cursor-pointer block">
                      <div className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-pink-300 rounded-lg hover:bg-pink-50 transition-colors">
                        <Upload className="w-5 h-5 text-pink-600" />
                        <span className="text-sm text-pink-600 font-medium">{tempFiles[idx] ? 'Change File' : 'Upload Screenshot/File'}</span>
                      </div>
                      <input type="file" accept="image/*,.pdf,.doc,.docx" onChange={(e) => e.target.files[0] && handleFileUpload(idx, e.target.files[0])} className="hidden" />
                    </label>
                    {tempFiles[idx] && (
                      <div className="mt-2 p-2 bg-pink-50 rounded-lg border border-pink-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <File className="w-5 h-5 text-pink-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{tempFiles[idx].name}</p>
                            <p className="text-xs text-gray-500">{(tempFiles[idx].size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <button onClick={() => removeFile(idx)} className="p-1 hover:bg-pink-200 rounded"><X className="w-4 h-4 text-gray-600" /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={saveSubmissions} disabled={isSubmitting} className="flex-1 bg-pink-600 text-white py-3 rounded-lg font-medium hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? 'Saving...' : '✅ Submit & Mark Complete'}
                </button>
                <button onClick={() => { setShowSubmissionModal(null); setTempSubmissions({}); setTempFiles({}); }} disabled={isSubmitting} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceChallengeTracker;