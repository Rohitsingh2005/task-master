import { parseJSON, readList, writeJSON } from './storage'

export const NOTES_KEY = 'notes'

const nowIso = () => new Date().toISOString()

export const normalizeNote = (note) => ({
  ...note,
  id: note.id ?? crypto.randomUUID(),
  title: note.title ?? '',
  content: note.content ?? '',
  favorite: Boolean(note.favorite),
  pinned: Boolean(note.pinned),
  deleted: Boolean(note.deleted),
  ticketId: note.ticketId ?? null,
  createdAt: note.createdAt ?? nowIso(),
  updatedAt: note.updatedAt ?? note.createdAt ?? nowIso(),
})

export const parseNotes = (raw) => {
  const value = parseJSON(raw, [])

  return Array.isArray(value) ? value.map(normalizeNote) : []
}

export const getNotes = () => readList(NOTES_KEY).map(normalizeNote)

export const saveNotes = (notes) => {
  writeJSON(NOTES_KEY, notes)
}

export const createNote = (fields = {}) => {
  const now = nowIso()

  const note = normalizeNote({
    title: '',
    content: '',
    ...fields,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  })

  saveNotes([note, ...getNotes()])

  return note
}

export const updateNote = (id, changes) => {
  saveNotes(
    getNotes().map((note) =>
      note.id === id ? { ...note, ...changes, updatedAt: nowIso() } : note
    )
  )
}

export const deleteNoteForever = (id) => {
  const notes = getNotes()
  const index = notes.findIndex((note) => note.id === id)

  if (index === -1) {
    return null
  }

  const [note] = notes.splice(index, 1)
  saveNotes(notes)

  return { note, index }
}

export const emptyTrash = () => {
  const notes = getNotes()
  const removed = notes.filter((note) => note.deleted)

  saveNotes(notes.filter((note) => !note.deleted))

  return removed
}

export const restoreNotes = (removedNotes) => {
  const existingIds = new Set(getNotes().map((note) => note.id))

  saveNotes([
    ...getNotes(),
    ...removedNotes.filter((note) => !existingIds.has(note.id)),
  ])
}

