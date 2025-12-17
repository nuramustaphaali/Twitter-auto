import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile, Tweet, PostStatus, Tone, NotificationItem } from './types';
import { generateTweetIdeas, generateAutoTweet } from './services/geminiService';
import { Icons, MOCK_INTERESTS } from './constants';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { Toast } from './components/Toast';

// ----- Subcomponents for App Structure -----

const ConnectStep = ({ onConnect, isConnecting }: { onConnect: () => void, isConnecting: boolean }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
    <div className="max-w-md w-full space-y-8 text-center">
      <div>
        <div className="mx-auto h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center animate-bounce-slow">
          <Icons.Robot className="h-10 w-10 text-indigo-600" />
        </div>
        <h2 className="mt-6 text-3xl font-extrabold text-slate-900">TweetFlow AI</h2>
        <p className="mt-2 text-sm text-slate-600">
          Automate your X presence with intelligent content generation.
        </p>
      </div>
      <Card className="p-8">
        <p className="mb-6 text-slate-600">
          Connect your account to start generating content based on your interests.
        </p>
        <Button 
          onClick={onConnect} 
          isLoading={isConnecting}
          className="w-full flex items-center justify-center gap-2 bg-black hover:bg-slate-800"
        >
          <Icons.Twitter className="h-5 w-5" />
          {isConnecting ? 'Connecting...' : 'Connect with X'}
        </Button>
      </Card>
    </div>
  </div>
);

const NavItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-md transition-colors ${
      active 
        ? 'bg-indigo-50 text-indigo-700' 
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    <Icon className={`h-5 w-5 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
    <span>{label}</span>
  </button>
);

const App: React.FC = () => {
  // --- State ---
  const [view, setView] = useState<'dashboard' | 'create' | 'queue' | 'settings'>('dashboard');
  
  const [user, setUser] = useState<UserProfile>({
    handle: '@alex_dev',
    name: 'Alex Developer',
    avatarUrl: 'https://picsum.photos/seed/alex/200',
    isConnected: false,
    interests: ['React', 'AI', 'Startup'],
    language: 'English',
    preferredTone: Tone.PROFESSIONAL,
    autoPilot: false,
  });

  const [posts, setPosts] = useState<Tweet[]>([]);
  const [generatedOptions, setGeneratedOptions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [newInterest, setNewInterest] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Refs for auto-pilot interval
  const autoPilotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Helpers ---

  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // --- Effects ---
  
  // Simulate fetching initial data
  useEffect(() => {
    if (user.isConnected) {
      setPosts([
        {
          id: '1',
          content: 'Just deployed my first React 18 app! The concurrent features are game-changing. #ReactJS #WebDev',
          status: PostStatus.POSTED,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          likes: 42,
          retweets: 5
        },
        {
          id: '2',
          content: 'AI is not replacing developers, it is augmenting them. Learning to prompt is the new syntax. #AI #Coding',
          status: PostStatus.SCHEDULED,
          scheduledTime: new Date(Date.now() + 3600000).toISOString(),
          createdAt: new Date().toISOString()
        }
      ]);
    }
  }, [user.isConnected]);

  // Auto-Pilot Logic
  useEffect(() => {
    if (user.autoPilot && user.isConnected) {
      if (!autoPilotIntervalRef.current) {
        addNotification("Auto-Pilot engaged. AI will post periodically.", "success");
        // Simulate an auto-post every 15 seconds for demonstration purposes
        // In a real app, this would be cron-job based or much longer intervals
        autoPilotIntervalRef.current = setInterval(async () => {
          try {
            const tweetContent = await generateAutoTweet(user.interests, user.language, user.preferredTone);
            const newPost: Tweet = {
              id: Date.now().toString(),
              content: tweetContent,
              status: PostStatus.POSTED,
              createdAt: new Date().toISOString(),
              likes: 0,
              retweets: 0
            };
            setPosts(prev => [newPost, ...prev]);
            addNotification("Auto-Pilot just posted a new tweet!", "success");
          } catch (e) {
            console.error(e);
          }
        }, 10000); 
      }
    } else {
      if (autoPilotIntervalRef.current) {
        clearInterval(autoPilotIntervalRef.current);
        autoPilotIntervalRef.current = null;
        addNotification("Auto-Pilot disengaged.", "info");
      }
    }

    return () => {
      if (autoPilotIntervalRef.current) {
        clearInterval(autoPilotIntervalRef.current);
      }
    };
  }, [user.autoPilot, user.isConnected, user.interests, user.language, user.preferredTone, addNotification]);

  // --- Handlers ---

  const handleConnect = () => {
    setIsConnecting(true);
    // Simulate API handshake
    setTimeout(() => {
      setUser(prev => ({ ...prev, isConnected: true }));
      setIsConnecting(false);
      addNotification("Successfully connected to Twitter account @alex_dev", "success");
    }, 1500);
  };

  const handleGenerate = async () => {
    if (user.interests.length === 0) {
      addNotification("Please add at least one interest topic first.", "error");
      return;
    }
    setIsGenerating(true);
    setGeneratedOptions([]); 
    const results = await generateTweetIdeas(user.interests, user.language, user.preferredTone);
    
    // Handle case where API might return an error string in array
    if (results.length > 0 && results[0].includes("Error")) {
       addNotification("Failed to generate ideas. Check API Key.", "error");
    } else {
       setGeneratedOptions(results);
       addNotification("Generated new content ideas!", "success");
    }
    setIsGenerating(false);
  };

  const handleSchedule = (content: string) => {
    const newPost: Tweet = {
      id: Date.now().toString(),
      content,
      status: PostStatus.SCHEDULED,
      createdAt: new Date().toISOString(),
      scheduledTime: new Date(Date.now() + 7200000).toISOString() // +2 hours
    };
    setPosts(prev => [newPost, ...prev]);
    // Remove specifically this tweet from options
    setGeneratedOptions(prev => prev.filter(t => t !== content));
    addNotification("Tweet scheduled for later.", "success");
    setView('queue');
  };

  const handlePostNow = (content: string) => {
    const newPost: Tweet = {
      id: Date.now().toString(),
      content,
      status: PostStatus.POSTED,
      createdAt: new Date().toISOString(),
      likes: 0,
      retweets: 0
    };
    setPosts(prev => [newPost, ...prev]);
    setGeneratedOptions(prev => prev.filter(t => t !== content));
    addNotification("Published successfully!", "success");
    setView('dashboard');
  };

  const handleDeletePost = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
    addNotification("Post removed.", "info");
  };

  const handleAddInterest = () => {
    if (newInterest && !user.interests.includes(newInterest)) {
      setUser(prev => ({ ...prev, interests: [...prev.interests, newInterest] }));
      setNewInterest('');
      addNotification(`Added topic: ${newInterest}`, "success");
    }
  };

  const removeInterest = (interest: string) => {
    setUser(prev => ({ ...prev, interests: prev.interests.filter(i => i !== interest) }));
  };

  const toggleAutoPilot = () => {
    setUser(prev => ({...prev, autoPilot: !prev.autoPilot}));
  };

  // --- Render Logic ---

  if (!user.isConnected) {
    return (
      <>
        <ConnectStep onConnect={handleConnect} isConnecting={isConnecting} />
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
          {notifications.map(n => (
            <Toast key={n.id} notification={n} onClose={removeNotification} />
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex-shrink-0 md:h-screen sticky top-0 z-10">
        <div className="p-6 flex items-center space-x-3 border-b border-slate-100">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <Icons.Robot className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold text-slate-900">TweetFlow</span>
        </div>
        
        <div className="p-4 space-y-1">
          <NavItem icon={Icons.Home} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <NavItem icon={Icons.Sparkles} label="Create Post" active={view === 'create'} onClick={() => setView('create')} />
          <NavItem icon={Icons.Calendar} label="Queue" active={view === 'queue'} onClick={() => setView('queue')} />
          <NavItem icon={Icons.Settings} label="Settings" active={view === 'settings'} onClick={() => setView('settings')} />
        </div>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-3">
            <img src={user.avatarUrl} alt="User" className="h-10 w-10 rounded-full border border-slate-200" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.handle}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full relative">
        
        {/* Header */}
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-900">
            {view === 'dashboard' && 'Dashboard'}
            {view === 'create' && 'Generate Content'}
            {view === 'queue' && 'Content Queue'}
            {view === 'settings' && 'Account Settings'}
          </h1>
          
          <div className="flex items-center space-x-4 w-full sm:w-auto">
             {/* Auto Pilot Toggle */}
             <div className="flex items-center justify-between space-x-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm w-full sm:w-auto">
                <div className="flex items-center space-x-2">
                  <div className={`relative inline-flex h-3 w-3 rounded-full ${user.autoPilot ? 'bg-green-500' : 'bg-slate-300'}`}>
                    {user.autoPilot && <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"></span>}
                  </div>
                  <span className="text-sm font-medium text-slate-600">Auto-Pilot</span>
                </div>
                <button 
                  onClick={toggleAutoPilot} 
                  className={`text-xs font-bold px-3 py-1 rounded-md transition-colors ${user.autoPilot ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}
                >
                  {user.autoPilot ? 'STOP' : 'START'}
                </button>
             </div>
             <div className="hidden md:block">
               <Button variant="primary" onClick={() => setView('create')}>
                 <Icons.Plus className="-ml-1 mr-1 h-4 w-4" aria-hidden="true" />
                 New
               </Button>
             </div>
          </div>
        </header>

        {/* Dashboard View */}
        {view === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-l-4 border-l-indigo-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Queued Posts</p>
                    <p className="text-3xl font-bold text-slate-900">{posts.filter(p => p.status === PostStatus.SCHEDULED).length}</p>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-full">
                    <Icons.Calendar className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
              </Card>
              <Card className="border-l-4 border-l-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Posted</p>
                    <p className="text-3xl font-bold text-slate-900">{posts.filter(p => p.status === PostStatus.POSTED).length}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-full">
                    <Icons.Check className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </Card>
              <Card className="border-l-4 border-l-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Active Interests</p>
                    <p className="text-3xl font-bold text-slate-900">{user.interests.length}</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-full">
                    <Icons.Sparkles className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </Card>
            </div>

            <h2 className="text-lg font-medium text-slate-900 pt-4">Recent Activity</h2>
            <div className="space-y-4 pb-20">
              {posts.length > 0 ? (
                posts.slice(0, 8).map(post => (
                  <Card key={post.id} className="transition hover:shadow-md border-l-4 border-l-transparent hover:border-l-indigo-400">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-4">
                        <div className="flex items-center space-x-2 mb-2">
                           <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                            ${post.status === PostStatus.POSTED ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {post.status.toLowerCase()}
                          </span>
                          <span className="text-xs text-slate-400">{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-800 text-base whitespace-pre-wrap leading-relaxed">{post.content}</p>
                      </div>
                    </div>
                    {post.status === PostStatus.POSTED && (
                      <div className="mt-4 pt-3 border-t border-slate-50 flex items-center text-xs text-slate-500 space-x-6">
                        <span className="flex items-center"><span className="font-semibold text-slate-700 mr-1">{post.likes || 0}</span> Likes</span>
                        <span className="flex items-center"><span className="font-semibold text-slate-700 mr-1">{post.retweets || 0}</span> Reposts</span>
                      </div>
                    )}
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400 bg-white rounded-lg border border-dashed border-slate-300">
                  <p>No posts yet. Go to Create to get started!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create View */}
        {view === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <Card title="Configuration">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Tone</label>
                    <select 
                      value={user.preferredTone}
                      onChange={(e) => setUser(prev => ({...prev, preferredTone: e.target.value as Tone}))}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                    >
                      {Object.values(Tone).map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Language</label>
                    <input 
                      type="text" 
                      value={user.language} 
                      onChange={(e) => setUser(prev => ({...prev, language: e.target.value}))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Active Topics</label>
                    <div className="flex flex-wrap gap-2">
                      {user.interests.map(interest => (
                        <span key={interest} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button 
                    onClick={handleGenerate} 
                    isLoading={isGenerating} 
                    className="w-full flex justify-center gap-2"
                  >
                    <Icons.Sparkles className="h-4 w-4" />
                    Generate Ideas
                  </Button>
                </div>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-6">
              {generatedOptions.length > 0 ? (
                generatedOptions.map((tweet, idx) => (
                  <Card key={idx} className="border-indigo-100 shadow-sm hover:shadow-md transition">
                    <div className="space-y-4">
                      <textarea 
                        className="w-full border-0 focus:ring-0 p-0 text-slate-800 text-lg resize-none bg-transparent"
                        rows={3}
                        defaultValue={tweet}
                      />
                      <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                        <Button variant="secondary" onClick={() => handleSchedule(tweet)} className="text-xs">
                          <Icons.Calendar className="h-4 w-4 mr-2" />
                          Schedule
                        </Button>
                        <Button onClick={() => handlePostNow(tweet)} className="text-xs">
                          <Icons.Send className="h-4 w-4 mr-2" />
                          Post Now
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="h-64 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 bg-white">
                  <Icons.Sparkles className="h-12 w-12 mb-2 text-slate-300" />
                  <p>Click "Generate Ideas" to let AI create content for you.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Queue View */}
        {view === 'queue' && (
          <div className="space-y-6">
             {posts.filter(p => p.status === PostStatus.SCHEDULED).length === 0 ? (
               <div className="text-center py-16 bg-white rounded-lg border border-dashed border-slate-200">
                 <div className="mx-auto h-12 w-12 text-slate-300">
                   <Icons.Calendar className="h-full w-full" />
                 </div>
                 <h3 className="mt-2 text-sm font-medium text-slate-900">No queued posts</h3>
                 <p className="mt-1 text-sm text-slate-500">Get started by creating a new post.</p>
                 <div className="mt-6">
                   <Button onClick={() => setView('create')}>
                     <Icons.Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                     New Post
                   </Button>
                 </div>
               </div>
             ) : (
                posts.filter(p => p.status === PostStatus.SCHEDULED).map(post => (
                  <Card key={post.id} className="relative group">
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 text-sm text-slate-500 mb-2">
                          <Icons.Calendar className="h-4 w-4 text-indigo-500" />
                          <span className="font-medium text-indigo-600">Scheduled for {post.scheduledTime ? new Date(post.scheduledTime).toLocaleString() : 'Soon'}</span>
                        </div>
                        <p className="text-slate-800 text-lg">{post.content}</p>
                      </div>
                      <div className="ml-4 flex flex-col space-y-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDeletePost(post.id)}
                          className="text-slate-400 hover:text-red-500 transition p-2 hover:bg-red-50 rounded-full"
                          title="Delete post"
                        >
                          <Icons.Trash className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))
             )}
          </div>
        )}

        {/* Settings View */}
        {view === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <Card title="Profile Information">
              <div className="flex items-center space-x-4 mb-6">
                <img src={user.avatarUrl} alt="Avatar" className="h-16 w-16 rounded-full ring-2 ring-indigo-100" />
                <div>
                  <h3 className="text-lg font-medium text-slate-900">{user.name}</h3>
                  <p className="text-slate-500">{user.handle}</p>
                </div>
                <div className="flex-1 text-right">
                   <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                     <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                     Connected
                   </span>
                </div>
              </div>
            </Card>

            <Card title="Content Preferences">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Interests & Topics</label>
                  <p className="text-sm text-slate-500 mb-3">The AI uses these topics to generate relevant content for your audience.</p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {user.interests.map(interest => (
                      <span key={interest} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                        {interest}
                        <button 
                          onClick={() => removeInterest(interest)}
                          className="ml-2 text-indigo-600 hover:text-indigo-900 focus:outline-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddInterest()}
                      placeholder="Add new topic (e.g., 'Web3')"
                      className="flex-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full rounded-md sm:text-sm border-gray-300 border px-3 py-2"
                    />
                    <Button onClick={handleAddInterest} variant="secondary">Add</Button>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-xs text-slate-400 mb-2">Suggested topics:</p>
                    <div className="flex flex-wrap gap-2">
                      {MOCK_INTERESTS.filter(i => !user.interests.includes(i)).slice(0, 5).map(suggestion => (
                        <button 
                          key={suggestion}
                          onClick={() => {
                            if (!user.interests.includes(suggestion)) {
                              setUser(prev => ({...prev, interests: [...prev.interests, suggestion]}));
                              addNotification(`Added topic: ${suggestion}`, "success");
                            }
                          }}
                          className="text-xs border border-slate-200 rounded-full px-2 py-1 text-slate-500 hover:bg-slate-50 hover:border-indigo-300 transition-colors"
                        >
                          + {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Default Language</label>
                    <input 
                      type="text"
                      value={user.language}
                      onChange={(e) => setUser(prev => ({...prev, language: e.target.value}))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-slate-700">Default Tone</label>
                    <select 
                      value={user.preferredTone}
                      onChange={(e) => setUser(prev => ({...prev, preferredTone: e.target.value as Tone}))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      {Object.values(Tone).map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Toast Notifications Container */}
        <div className="fixed bottom-4 right-4 z-50 space-y-2 w-full max-w-sm px-4 md:px-0">
          {notifications.map(n => (
            <Toast key={n.id} notification={n} onClose={removeNotification} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default App;