import React, { useState, useRef } from 'react';
import './App.css';

/*
  NoteEase Main Container
  Features:
    - Create, edit, delete notes
    - Search notes by text
    - Filter notes by category/tag
    - Floating Action Button for new note
    - Responsive, light, modern UI with custom colors

  Theme:
    - Light theme
    - Primary: #4A90E2 (blue)
    - Secondary: #FFFFFF (white)
    - Accent: #F5A623 (orange)
*/

// --- Helper components ---

// PUBLIC_INTERFACE
function SearchBar({ value, onChange }) {
  /** Top search bar to filter notes by keyword */
  return (
    <div className="noteease-searchbar">
      <input
        type="text"
        placeholder="Search notes..."
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-label="Search notes"
      />
      <span className="noteease-searchbar-icon" role="img" aria-label="Search">🔍</span>
    </div>
  );
}

// PUBLIC_INTERFACE
function CategoryFilter({ categories, selected, onSelect }) {
  /** Categories/Tags above note list */
  return (
    <div className="noteease-categories">
      <button
        className={`category-chip${selected === '' ? ' active' : ''}`}
        onClick={() => onSelect('')}
      >
        All
      </button>
      {categories.map(cat => (
        <button
          key={cat}
          className={`category-chip${selected === cat ? ' active' : ''}`}
          onClick={() => onSelect(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

// PUBLIC_INTERFACE
function NoteList({ notes, onSelect, onDelete }) {
  /** Displays notes with title + snippet. Allows open/edit and delete. */
  return (
    <div className="noteease-note-list">
      {notes.length === 0 && (
        <div className="noteease-empty-message">No notes found.</div>
      )}
      {notes.map(note => (
        <div className="noteease-note-card" key={note.id} tabIndex={0}>
          <div className="note-card-body" onClick={() => onSelect(note)}>
            <div className="note-card-title">{note.title || <em>(Untitled)</em>}</div>
            <div className="note-card-snippet">{note.content ? note.content.slice(0, 60) + (note.content.length > 60 ? '...' : '') : <em>(No content)</em>}</div>
            {note.category && <span className="note-card-category">{note.category}</span>}
          </div>
          <button
            className="note-card-delete"
            title="Delete"
            onClick={e => {e.stopPropagation(); onDelete(note.id);}}
          >
            <span role="img" aria-label="Delete">🗑️</span>
          </button>
        </div>
      ))}
    </div>
  );
}

// PUBLIC_INTERFACE
function NoteEditor({ open, note, categories, onSave, onCancel }) {
  /*
    Modal for creating/editing a note
    - note: {id, title, content, category}, null for new
  */
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [category, setCategory] = useState(note?.category || '');

  // For reset when switching between notes
  React.useEffect(() => {
    setTitle(note?.title || '');
    setContent(note?.content || '');
    setCategory(note?.category || '');
  }, [note, open]);

  if (!open) return null;

  return (
    <div className="noteease-modal-bg" tabIndex={-1} aria-modal="true" role="dialog">
      <div className="noteease-modal">
        <h2>{note && note.id ? 'Edit' : 'New'} Note</h2>
        <input
          autoFocus
          type="text"
          value={title}
          placeholder="Title"
          onChange={e => setTitle(e.target.value)}
          className="noteease-modal-title"
        />
        <textarea
          value={content}
          placeholder="Type your note here..."
          onChange={e => setContent(e.target.value)}
          rows={8}
        />
        <div className="noteease-modal-options">
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="modal-category-input"
          >
            <option value="">No Category</option>
            {/* Existing categories first */}
            {categories.filter(c => c && c !== category).map(cat =>
              <option value={cat} key={cat}>{cat}</option>
            )}
            {/* If current category is new and not empty add it */}
            {category && !categories.includes(category) &&
              <option value={category}>{category}</option>
            }
          </select>
          <button
            className="modal-save-btn"
            onClick={() => {
              const data = { id: note?.id, title: title.trim(), content: content.trim(), category: category.trim() };
              onSave(data);
            }}
            disabled={title.trim() === '' && content.trim() === ''}
          >
            Save
          </button>
          <button className="modal-cancel-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function FloatingActionButton({ onClick }) {
  return (
    <button className="noteease-fab" title="Add Note" onClick={onClick} aria-label="Add Note">
      <span className="fab-plus">+</span>
    </button>
  );
}

// --- Main NoteEase Container ---

// PUBLIC_INTERFACE
function NoteEaseMainContainer() {
  /*
    Main container for the NoteEase App
    Handles note CRUD, filtering and layout.
  */

  // Notes state: {id, title, content, category}
  const [notes, setNotes] = useState([
    // Example notes for demo
    { id: 1, title: 'Welcome to NoteEase!', content: 'Start jotting quick notes, ideas, or lists.', category: 'General' },
    { id: 2, title: 'Shopping List', content: '- Milk\n- Bread\n- Cheese', category: 'Personal' },
    { id: 3, title: 'Work Tasks', content: '1. Email John\n2. Finish the report', category: 'Work' }
  ]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  // Generate new note id (auto-increment on front)
  const nextNoteId = useRef(4);

  // Gather unique categories from all notes
  const allCategories = Array.from(new Set(notes.map(note => note.category).filter(Boolean)));

  // Filtered notes (by search & category)
  const filteredNotes = notes.filter(note => {
    const matchesCat = categoryFilter ? note.category === categoryFilter : true;
    const matchesSearch = search
      ? (note.title && note.title.toLowerCase().includes(search.toLowerCase())) ||
        (note.content && note.content.toLowerCase().includes(search.toLowerCase()))
      : true;
    return matchesCat && matchesSearch;
  });

  // Add or update note in state
  const handleSaveNote = (noteData) => {
    if (noteData.id) {
      // Edit existing
      setNotes(ns => ns.map(n =>
        n.id === noteData.id
          ? { ...n, ...noteData }
          : n
      ));
    } else {
      // Add new
      setNotes(ns => [
        {
          id: nextNoteId.current++,
          ...noteData
        },
        ...ns
      ]);
    }
    setEditorOpen(false);
    setEditingNote(null);
  };

  // Start editing an existing note
  const handleEditNote = (note) => {
    setEditorOpen(true);
    setEditingNote(note);
  };

  // Delete note by id
  const handleDeleteNote = (noteId) => {
    setNotes(ns => ns.filter(n => n.id !== noteId));
    if (editingNote && editingNote.id === noteId) {
      setEditorOpen(false);
      setEditingNote(null);
    }
  };

  // Start creating a new note
  const handleNewNote = () => {
    setEditorOpen(true);
    setEditingNote(null);
  };

  // Cancel edit/create
  const handleCancelEditor = () => {
    setEditorOpen(false);
    setEditingNote(null);
  };

  return (
    <div className="noteease-main-bg">
      <header className="noteease-header">
        <div className="noteease-app-title">
          <span className="logo-symbol">📝</span> NoteEase
        </div>
      </header>
      <main className="noteease-main">
        <SearchBar value={search} onChange={setSearch} />
        <CategoryFilter
          categories={allCategories}
          selected={categoryFilter}
          onSelect={setCategoryFilter}
        />
        <NoteList
          notes={filteredNotes}
          onSelect={handleEditNote}
          onDelete={handleDeleteNote}
        />
        <FloatingActionButton onClick={handleNewNote} />
        <NoteEditor
          open={editorOpen}
          note={editingNote}
          categories={allCategories}
          onSave={handleSaveNote}
          onCancel={handleCancelEditor}
        />
      </main>
      <footer className="noteease-footer">
        <span>&copy; {new Date().getFullYear()} NoteEase</span>
      </footer>
    </div>
  );
}

// --- App Wrapper ---

function App() {
  return <NoteEaseMainContainer />;
}

export default App;
