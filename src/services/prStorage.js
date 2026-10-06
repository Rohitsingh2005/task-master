import { parseJSON, readList, writeJSON } from './storage'

export const PRS_KEY = 'pullRequests'

export const PR_AREAS = ['frontend', 'backend']

export const PR_LINK_TYPES = ['PR', 'Jira', 'GitHub', 'GitLab', 'Other']

export const PR_STATUSES = ['pending', 'comment', 'ready to merge', 'merged']

const nowIso = () => new Date().toISOString()

const createId = () => crypto.randomUUID()

export const createEmptyPR = (ticketId = null) => ({
  id: createId(),
  branchName: '',
  links: [],
  status: 'pending',
  ticketId,
  createdAt: nowIso(),
  updatedAt: nowIso(),
})

export const createPRLink = () => ({
  id: createId(),
  area: 'frontend',
  type: 'PR',
  url: '',
})

export const normalizePR = (pr) => ({
  ...pr,
  id: pr.id ?? createId(),
  branchName: pr.branchName ?? '',
  status: PR_STATUSES.includes(pr.status) ? pr.status : 'pending',
  ticketId: pr.ticketId ?? null,
  createdAt: pr.createdAt ?? nowIso(),
  updatedAt: pr.updatedAt ?? pr.createdAt ?? nowIso(),
  links: Array.isArray(pr.links)
    ? pr.links.map((link) => ({
        ...link,
        id: link.id ?? createId(),
        area: PR_AREAS.includes(link.area) ? link.area : 'frontend',
        type: PR_LINK_TYPES.includes(link.type) ? link.type : 'Other',
        url: link.url ?? '',
      }))
    : [],
})

export const parsePRs = (raw) => {
  const value = parseJSON(raw, [])

  return Array.isArray(value) ? value.map(normalizePR) : []
}

export const getPRs = () => readList(PRS_KEY).map(normalizePR)

export const savePRs = (prs) => {
  writeJSON(PRS_KEY, prs)
}

export const addPR = (draft) => {
  const now = nowIso()

  const pr = normalizePR({
    ...draft,
    branchName: draft.branchName.trim(),
    links: draft.links.map((link) => ({ ...link, url: link.url.trim() })),
    createdAt: now,
    updatedAt: now,
  })

  savePRs([pr, ...getPRs()])

  return pr
}

export const updatePR = (id, changes) => {
  let previous = null
  let updated = null

  const prs = getPRs().map((pr) => {
    if (pr.id !== id) {
      return pr
    }

    previous = pr
    updated = { ...pr, ...changes, updatedAt: nowIso() }

    return updated
  })

  if (updated) {
    savePRs(prs)
  }

  return { previous, updated }
}

export const deletePR = (id) => {
  const prs = getPRs()
  const index = prs.findIndex((pr) => pr.id === id)

  if (index === -1) {
    return null
  }

  const [pr] = prs.splice(index, 1)
  savePRs(prs)

  return { pr, index }
}

export const restorePR = ({ pr, index }) => {
  const prs = getPRs().filter((item) => item.id !== pr.id)
  prs.splice(Math.min(index, prs.length), 0, pr)
  savePRs(prs)
}

export const formatPRStatus = (status = '') =>
  String(status)
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
