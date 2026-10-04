'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@components/ui/button'
import { Badge } from '@components/ui/badge'
import {
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchOpenAPISpec } from '@services/api_tokens/api_tokens'

interface OpenAPIPath {
  [method: string]: {
    summary?: string
    description?: string
    tags?: string[]
    parameters?: Array<{
      name: string
      in: string
      required?: boolean
      schema?: any
      description?: string
    }>
    requestBody?: {
      content?: {
        'application/json'?: {
          schema?: any
        }
      }
    }
    responses?: {
      [code: string]: {
        description?: string
        content?: any
      }
    }
  }
}

interface OpenAPISpec {
  openapi: string
  info: {
    title: string
    version: string
    description?: string
  }
  paths: {
    [path: string]: OpenAPIPath
  }
  components?: {
    schemas?: {
      [name: string]: any
    }
  }
}

interface EndpointGroup {
  tag: string
  endpoints: Array<{
    path: string
    method: string
    summary: string
    description?: string
    parameters?: any[]
    requestBody?: any
    responses?: any
  }>
}

const METHOD_COLORS: Record<string, string> = {
  get: 'bg-blue-100 text-blue-800',
  post: 'bg-green-100 text-green-800',
  put: 'bg-yellow-100 text-yellow-800',
  patch: 'bg-orange-100 text-orange-800',
  delete: 'bg-red-100 text-red-800',
}

// Priority order: tags listed here appear first (in this order), rest sorted alphabetically
const TAG_ORDER: string[] = ['admin']

// API tokens are restricted to these resource types only
// The tags here should match OpenAPI tags (case-insensitive)
const ALLOWED_API_TAGS = [
  'admin',
  'courses',
  'activities',
  'coursechapters',
  'chapters',
  'collections',
  'certifications',
  'usergroups',
  'user-groups',
  'payments',
  'search',
]

interface APIDocumentationProps {
  searchQuery: string
}

const APIDocumentation: React.FC<APIDocumentationProps> = ({ searchQuery }) => {
  const [spec, setSpec] = useState<OpenAPISpec | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadSpec()
  }, [])

  const loadSpec = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchOpenAPISpec()
      setSpec(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load API documentation')
      toast.error(err.message || 'Failed to load API documentation')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Resolve a $ref pointer like "#/components/schemas/Foo" to the actual schema object.
   */
  const resolveRef = (schema: any, depth: number = 0): any => {
    if (!schema || !spec || depth > 8) return schema

    if (schema.$ref) {
      const refPath = schema.$ref.replace('#/', '').split('/')
      let resolved: any = spec
      for (const part of refPath) {
        resolved = resolved?.[part]
      }
      return resolveRef(resolved, depth + 1)
    }

    // Resolve allOf by merging
    if (schema.allOf) {
      const merged: any = { type: 'object', properties: {}, required: [] }
      for (const sub of schema.allOf) {
        const resolved = resolveRef(sub, depth + 1)
        if (resolved?.properties) {
          Object.assign(merged.properties, resolved.properties)
        }
        if (resolved?.required) {
          merged.required.push(...resolved.required)
        }
      }
      return merged
    }

    // Resolve items in arrays
    if (schema.type === 'array' && schema.items) {
      return { ...schema, items: resolveRef(schema.items, depth + 1) }
    }

    return schema
  }

  /**
   * Get a short type label from a schema for display.
   */
  const getSchemaTypeLabel = (schema: any): string => {
    if (!schema) return ''
    const resolved = resolveRef(schema, 0)
    if (!resolved) return ''

    if (resolved.title) return resolved.title

    if (schema.$ref) {
      const parts = schema.$ref.split('/')
      return parts[parts.length - 1]
    }

    if (resolved.type === 'array') {
      const itemLabel = resolved.items?.$ref
        ? resolved.items.$ref.split('/').pop()
        : resolved.items?.title || resolved.items?.type || 'item'
      return `${itemLabel}[]`
    }

    return resolved.type || 'object'
  }

  const getEndpointGroups = (specData: OpenAPISpec): EndpointGroup[] => {
    const groups: Record<string, EndpointGroup['endpoints']> = {}

    // Helper to check if a tag is allowed for API tokens
    const isAllowedTag = (tag: string): boolean => {
      const normalizedTag = tag.toLowerCase().replace(/[^a-z]/g, '')
      return ALLOWED_API_TAGS.some(
        (allowed) => normalizedTag === allowed.toLowerCase().replace(/[^a-z]/g, '')
      )
    }

    Object.entries(specData.paths || {}).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, details]) => {
        if (['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
          const tag = details.tags?.[0] || 'Other'

          // Only include endpoints with allowed tags
          if (!isAllowedTag(tag)) {
            return
          }

          if (!groups[tag]) {
            groups[tag] = []
          }
          groups[tag].push({
            path,
            method: method.toUpperCase(),
            summary: details.summary || path,
            description: details.description,
            parameters: details.parameters,
            requestBody: details.requestBody,
            responses: details.responses,
          })
        }
      })
    })

    return Object.entries(groups)
      .map(([tag, endpoints]) => ({ tag, endpoints }))
      .sort((a, b) => {
        const aIdx = TAG_ORDER.indexOf(a.tag.toLowerCase())
        const bIdx = TAG_ORDER.indexOf(b.tag.toLowerCase())
        // Priority tags come first
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
        if (aIdx !== -1) return -1
        if (bIdx !== -1) return 1
        // Rest sorted alphabetically
        return a.tag.localeCompare(b.tag)
      })
  }

  const filterEndpoints = (groups: EndpointGroup[]): EndpointGroup[] => {
    if (!searchQuery.trim()) return groups

    const query = searchQuery.toLowerCase()
    return groups
      .map((group) => ({
        ...group,
        endpoints: group.endpoints.filter(
          (ep) =>
            ep.path.toLowerCase().includes(query) ||
            ep.summary.toLowerCase().includes(query) ||
            ep.method.toLowerCase().includes(query) ||
            group.tag.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.endpoints.length > 0)
  }

  const toggleEndpoint = (key: string) => {
    const newExpanded = new Set(expandedEndpoints)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedEndpoints(newExpanded)
  }

  if (loading) {
    return (
      <div className="pb-4">
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="animate-spin text-gray-400 mr-2" size={24} />
          <span className="text-gray-500">Loading API documentation...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="pb-4">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={loadSpec} variant="outline">
            <RefreshCw size={16} className="mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!spec) return null

  const groups = filterEndpoints(getEndpointGroups(spec))

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <div key={group.tag} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          {/* Group Header */}
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-5">{group.tag}</h3>

          {/* Endpoints List */}
          <div className="space-y-2">
            {group.endpoints.map((endpoint, idx) => {
              const epKey = `${endpoint.method}-${endpoint.path}-${idx}`
              const isExpanded = expandedEndpoints.has(epKey)

              return (
                <div key={epKey} className="rounded-xl bg-gray-50 shadow-borders-base overflow-hidden">
                  {/* Endpoint Container (clickable) */}
                  <div
                    onClick={() => toggleEndpoint(epKey)}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <Badge
                      className={`${
                        METHOD_COLORS[endpoint.method.toLowerCase()] || 'bg-gray-100 text-gray-700'
                      } text-xs font-mono min-w-[60px] justify-center shrink-0`}
                    >
                      {endpoint.method}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{endpoint.summary}</p>
                      <p className="text-xs text-gray-400 font-mono truncate">{endpoint.path}</p>
                    </div>
                    <ChevronRight
                      size={16}
                      className={`text-gray-400 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </div>

                  {/* Expanded Details */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isExpanded ? 'max-h-[2000px]' : 'max-h-0'
                    }`}
                  >
                    <div className="border-t border-gray-100 bg-gray-50">
                      <div className="px-4 py-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                        {/* Description */}
                        {endpoint.description && (
                          <p className="text-sm text-gray-600">{endpoint.description}</p>
                        )}

                        {/* Parameters */}
                        {endpoint.parameters && endpoint.parameters.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Parameters</h4>
                            <div className="bg-white rounded-lg border border-gray-100 divide-y divide-gray-100">
                              {endpoint.parameters.map((param: any) => (
                                <div key={param.name} className="flex items-center gap-3 px-3 py-2">
                                  <code className="text-sm text-gray-800 font-medium">{param.name}</code>
                                  <Badge variant="outline" className="text-xs">{param.in}</Badge>
                                  {param.required && (
                                    <span className="text-xs text-red-500">required</span>
                                  )}
                                  <span className="text-xs text-gray-400 ml-auto">
                                    {param.schema?.type || 'any'}
                                  </span>
                                  {param.description && (
                                    <span className="text-xs text-gray-500 truncate max-w-[200px]">{param.description}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Request Body Schema */}
                        {endpoint.method !== 'GET' && endpoint.requestBody?.content?.['application/json']?.schema && (() => {
                          const bodySchema = resolveRef(endpoint.requestBody.content['application/json'].schema)
                          return (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Request Body
                                <span className="font-mono text-gray-400 ml-2">
                                  {getSchemaTypeLabel(endpoint.requestBody.content['application/json'].schema)}
                                </span>
                              </h4>
                              {bodySchema?.properties && (
                                <div className="bg-white rounded-lg border border-gray-100 divide-y divide-gray-100">
                                  {Object.entries(bodySchema.properties).map(([key, prop]: [string, any]) => {
                                    const resolvedProp = resolveRef(prop)
                                    const isRequired = bodySchema.required?.includes(key)
                                    return (
                                      <div key={key} className="flex items-center gap-3 px-3 py-2">
                                        <code className="text-sm text-gray-800 font-medium">{key}</code>
                                        {isRequired && <span className="text-xs text-red-500">required</span>}
                                        <span className="text-xs text-gray-400 ml-auto">{resolvedProp?.type || 'any'}</span>
                                        {resolvedProp?.description && (
                                          <span className="text-xs text-gray-500 truncate max-w-[200px]">{resolvedProp.description}</span>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })()}

                        {/* Response Schemas */}
                        {endpoint.responses && Object.keys(endpoint.responses).length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Responses</h4>
                            <div className="space-y-2">
                              {Object.entries(endpoint.responses).map(([code, res]: [string, any]) => {
                                const responseSchema = res?.content?.['application/json']?.schema
                                const resolvedSchema = responseSchema ? resolveRef(responseSchema) : null
                                return (
                                  <div key={code} className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                                    <div className="flex items-center gap-2 px-3 py-2">
                                      <Badge
                                        className={`text-xs ${
                                          code.startsWith('2')
                                            ? 'bg-green-100 text-green-800'
                                            : code.startsWith('4')
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-gray-100 text-gray-800'
                                        }`}
                                      >
                                        {code}
                                      </Badge>
                                      <span className="text-xs text-gray-600">{res.description || ''}</span>
                                      {responseSchema && (
                                        <span className="text-xs text-gray-400 font-mono ml-auto">
                                          {getSchemaTypeLabel(responseSchema)}
                                        </span>
                                      )}
                                    </div>
                                    {resolvedSchema?.properties && (
                                      <div className="px-3 pb-2 space-y-1">
                                        {Object.entries(resolvedSchema.properties).map(([key, prop]: [string, any]) => {
                                          const resolvedProp = resolveRef(prop)
                                          return (
                                            <div key={key} className="flex items-center gap-2 text-xs">
                                              <code className="text-gray-700">{key}</code>
                                              <span className="text-gray-400">{resolvedProp?.type || 'any'}</span>
                                              {resolvedProp?.description && (
                                                <span className="text-gray-500 truncate">- {resolvedProp.description}</span>
                                              )}
                                            </div>
                                          )
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {groups.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">No endpoints found matching your search.</p>
        </div>
      )}
    </div>
  )
}

export default APIDocumentation
