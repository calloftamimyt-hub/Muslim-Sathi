import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Plus, Search, Trash2, Edit3, X, Save } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocalStorage } from 'usehooks-ts';
import { motion, AnimatePresence } from 'motion/react';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export function NotesView({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();
  const [notes, setNotes] = useLocalStorage<Note[]>('muslim-sathi-notes', []);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      if (isAdding) {
        setIsAdding(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAdding]);

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes.sort((a, b) => b.updatedAt - a.updatedAt);
    const lowerQuery = searchQuery.toLowerCase();
    return notes
      .filter(note => note.title.toLowerCase().includes(lowerQuery) || note.content.toLowerCase().includes(lowerQuery))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, searchQuery]);

  const handleAddClick = () => {
    setEditingNote(null);
    setTitleInput('');
    setContentInput('');
    window.history.pushState({ tab: 'notes', internal: true }, '', '');
    setIsAdding(true);
  };

  const handleEditClick = (note: Note) => {
    setEditingNote(note);
    setTitleInput(note.title);
    setContentInput(note.content);
    window.history.pushState({ tab: 'notes', internal: true }, '', '');
    setIsAdding(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNoteToDelete(id);
  };

  const confirmDelete = () => {
    if (noteToDelete) {
      setNotes(prev => prev.filter(n => n.id !== noteToDelete));
      setNoteToDelete(null);
    }
  };

  const handleSave = () => {
    if (!titleInput.trim() && !contentInput.trim()) {
      window.history.back();
      return;
    }

    const now = Date.now();
    if (editingNote) {
      setNotes(prev => prev.map(n => n.id === editingNote.id ? {
        ...n,
        title: titleInput.trim() || 'Untitled',
        content: contentInput.trim(),
        updatedAt: now
      } : n));
    } else {
      const newNote: Note = {
        id: Math.random().toString(36).substring(2, 9),
        title: titleInput.trim() || 'Untitled',
        content: contentInput.trim(),
        createdAt: now,
        updatedAt: now
      };
      setNotes(prev => [newNote, ...prev]);
    }
    window.history.back();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 pt-safe sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Notes
            </h1>
          </div>
          <button
            onClick={handleAddClick}
            className="p-2 -mr-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-slate-900 dark:text-white placeholder-slate-500 outline-none focus:outline-none focus:ring-0 transition-shadow"
            />
          </div>
        </div>
      </div>

      {/* Notes Grid */}
      <div className="p-4">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
              <Edit3 className="w-10 h-10 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No notes found
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Click the plus (+) icon above to add a new note.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <AnimatePresence>
              {filteredNotes.map(note => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => handleEditClick(note)}
                  className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col cursor-pointer hover:shadow-md transition-shadow h-48"
                >
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2 line-clamp-2">
                    {note.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-4 flex-grow mb-3 whitespace-pre-wrap">
                    {note.content}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-400">
                      {formatDate(note.updatedAt)}
                    </span>
                    <button
                      onClick={(e) => handleDeleteClick(e, note.id)}
                      className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col"
          >
            <div className="pt-safe bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="w-10"></div> {/* Spacer to keep title centered if needed, or just let it flex */}
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingNote ? 'Edit Note' : 'New Note'}
                </h2>
                <button
                  onClick={handleSave}
                  className="p-2 -mr-2 rounded-full hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                >
                  <Save className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              <input
                type="text"
                placeholder="Title"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                className="w-full text-2xl font-bold bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 px-0"
              />
              <textarea
                placeholder="Write your note here..."
                value={contentInput}
                onChange={(e) => setContentInput(e.target.value)}
                className="w-full flex-1 resize-none bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-slate-700 dark:text-slate-300 placeholder-slate-400 px-0 text-lg leading-relaxed"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {noteToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
            onClick={() => setNoteToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-xl"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Delete Note
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Are you sure you want to delete this note? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setNoteToDelete(null)}
                  className="px-4 py-2 rounded-xl font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-xl font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
