'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Calendar, User, Send, Loader2, Sparkles } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    username: string;
  };
}

export default function ForumsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  async function loadPosts() {
    try {
      const res = await fetch('/api/forums');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/forums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });

      if (res.ok) {
        setTitle('');
        setContent('');
        loadPosts(); // refresh list
      }
    } catch (err) {
      console.error('Failed to submit post:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Title Header */}
      <section className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
          <MessageSquare className="h-7 w-7 text-purple-400" /> Strategy Forums
        </h1>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          Share kiting kiting strategies, deck guides, and discuss balance updates with the community.
        </p>
      </section>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Discussion Board List (2 Cols) */}
        <div className="md:col-span-2 space-y-6">
          {/* Categories select tabs */}
          <div className="flex gap-2 border-b border-white/5 pb-3 overflow-x-auto">
            {['All', 'Strategy', 'Clan Wars', 'Deck Feedback', 'Patch Notes'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/35'
                    : 'bg-black/40 text-gray-400 border border-white/5 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-6 w-6 text-purple-400 animate-spin mb-2" />
              <p className="text-xs text-gray-400">Loading board topics...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="glass-panel text-center p-8 rounded-xl border border-white/5">
              <p className="text-gray-400 text-sm">No topics have been posted yet. Be the first to start a conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="glass-panel p-5 rounded-xl border border-white/5 hover:border-white/10 transition-colors shadow">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-extrabold text-white text-base hover:text-purple-300 cursor-pointer transition-colors">
                      {post.title}
                    </h3>
                    <span className="text-[10px] text-gray-500 shrink-0 font-medium">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-2 leading-relaxed whitespace-pre-wrap line-clamp-3">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5 text-[10px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" /> @{post.author.username}
                    </span>
                    <span>•</span>
                    <span className="text-purple-400 font-semibold">General Discussion</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Post Form Sidebar (1 Col) */}
        <div className="space-y-6">
          <section className="glass-panel p-6 rounded-xl border border-white/5 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold tracking-wider uppercase text-gray-400 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-gold" /> Start a Discussion
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase text-gray-400 mb-1">Thread Title</label>
                <input
                  type="text"
                  placeholder="e.g. Balloon pulling ranges"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={submitting}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase text-gray-400 mb-1">Message Content</label>
                <textarea
                  placeholder="Share details of your kiting kiting tactic or deck recommendations..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={submitting}
                  rows={5}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !title.trim() || !content.trim()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" /> Post Thread
                  </>
                )}
              </button>
            </form>
          </section>
        </div>

      </div>
    </div>
  );
}
