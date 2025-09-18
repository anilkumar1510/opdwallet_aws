import { PolicyQueryParams } from './types'

export function buildQueryString(params: PolicyQueryParams): string {
  console.log('[DEBUG buildQueryString] Input params:', params)
  const searchParams = new URLSearchParams()

  if (params.page) {
    searchParams.set('page', params.page.toString())
    console.log('[DEBUG buildQueryString] Added page:', params.page)
  }
  // Skip pageSize, sortBy, sortDir - backend doesn't support them yet
  // if (params.pageSize) {
  //   searchParams.set('pageSize', params.pageSize.toString())
  //   console.log('[DEBUG buildQueryString] Added pageSize:', params.pageSize)
  // }
  if (params.q) {
    searchParams.set('q', params.q)
    console.log('[DEBUG buildQueryString] Added q:', params.q)
  }
  if (params.dateFrom) {
    searchParams.set('dateFrom', params.dateFrom)
    console.log('[DEBUG buildQueryString] Added dateFrom:', params.dateFrom)
  }
  if (params.dateTo) {
    searchParams.set('dateTo', params.dateTo)
    console.log('[DEBUG buildQueryString] Added dateTo:', params.dateTo)
  }
  // if (params.sortBy) {
  //   searchParams.set('sortBy', params.sortBy)
  //   console.log('[DEBUG buildQueryString] Added sortBy:', params.sortBy)
  // }
  // if (params.sortDir) {
  //   searchParams.set('sortDir', params.sortDir)
  //   console.log('[DEBUG buildQueryString] Added sortDir:', params.sortDir)
  // }

  // Handle multi-select filters
  if (params.status) {
    const statuses = Array.isArray(params.status) ? params.status : [params.status]
    console.log('[DEBUG buildQueryString] Processing statuses:', statuses)
    statuses.forEach(s => searchParams.append('status', s))
  }

  if (params.ownerPayer) {
    const payers = Array.isArray(params.ownerPayer) ? params.ownerPayer : [params.ownerPayer]
    console.log('[DEBUG buildQueryString] Processing ownerPayers:', payers)
    payers.forEach(p => searchParams.append('ownerPayer', p))
  }

  const result = searchParams.toString()
  console.log('[DEBUG buildQueryString] Final query string:', result)
  return result
}

export function parseQueryParams(searchParams: URLSearchParams): PolicyQueryParams {
  const params: PolicyQueryParams = {}

  const page = searchParams.get('page')
  if (page) params.page = parseInt(page, 10)

  const pageSize = searchParams.get('pageSize')
  if (pageSize) params.pageSize = parseInt(pageSize, 10)

  const q = searchParams.get('q')
  if (q) params.q = q

  const dateFrom = searchParams.get('dateFrom')
  if (dateFrom) params.dateFrom = dateFrom

  const dateTo = searchParams.get('dateTo')
  if (dateTo) params.dateTo = dateTo

  const sortBy = searchParams.get('sortBy')
  if (sortBy) params.sortBy = sortBy as PolicyQueryParams['sortBy']

  const sortDir = searchParams.get('sortDir')
  if (sortDir) params.sortDir = sortDir as PolicyQueryParams['sortDir']

  // Handle multi-select filters
  const statuses = searchParams.getAll('status')
  if (statuses.length > 0) params.status = statuses

  const payers = searchParams.getAll('ownerPayer')
  if (payers.length > 0) params.ownerPayer = payers

  return params
}

export function getDefaultParams(): PolicyQueryParams {
  return {
    page: 1
    // Temporarily disable these until backend supports them
    // pageSize: 20,
    // sortBy: 'updatedAt',
    // sortDir: 'desc'
  }
}