'use client'
import React from 'react'
import Link from 'next/link'
import GeneralWrapperStyled from '@components/Objects/StyledElements/Wrappers/GeneralWrapper'
import { getUriWithOrg } from '@services/config/config'
import {
  getCourseThumbnailMediaDirectory,
  getCollectionThumbnailMediaDirectory,
  getPodcastThumbnailMediaDirectory,
} from '@services/media/media'
import { ShoppingBag, ArrowRight, BookOpen, Mic, Layers } from 'lucide-react'
import { useOrg } from '@components/Contexts/OrgContext'
import { useTranslation } from 'react-i18next'

export interface StoreProduct {
  key: string
  kind: 'course' | 'podcast' | 'collection'
  resource_uuid: string
  name: string
  description: string
  thumbnail_image: string
  price_amount: number
  price_currency: string
}

interface StoreProps {
  orgslug: string
  products: StoreProduct[]
  enabled?: boolean
}

function stripTypePrefix(uuid: string): string {
  return uuid.replace(/^[a-z]+_/, '')
}

function getProductUrl(orgslug: string, product: StoreProduct): string {
  const id = stripTypePrefix(product.resource_uuid)
  switch (product.kind) {
    case 'course': return getUriWithOrg(orgslug, `/course/${id}`)
    case 'podcast': return getUriWithOrg(orgslug, `/podcast/${id}`)
    case 'collection': return getUriWithOrg(orgslug, `/collection/${id}`)
  }
}

function getThumbnailUrl(orgUuid: string, product: StoreProduct): string | null {
  if (!product.thumbnail_image) return null
  switch (product.kind) {
    case 'course':
      return getCourseThumbnailMediaDirectory(orgUuid, product.resource_uuid, product.thumbnail_image)
    case 'podcast':
      return getPodcastThumbnailMediaDirectory(orgUuid, product.resource_uuid, product.thumbnail_image)
    case 'collection':
      return getCollectionThumbnailMediaDirectory(orgUuid, product.resource_uuid, product.thumbnail_image)
  }
}

function productIcon(kind: StoreProduct['kind']) {
  switch (kind) {
    case 'course': return <BookOpen size={15} className="text-indigo-400" />
    case 'podcast': return <Mic size={15} className="text-pink-400" />
    default: return <Layers size={15} className="text-gray-400" />
  }
}

function ProductCard({ product, orgslug, orgUuid }: { product: StoreProduct; orgslug: string; orgUuid: string }) {
  const { t, i18n } = useTranslation()
  const thumbnail = getThumbnailUrl(orgUuid, product)

  return (
    <Link href={getProductUrl(orgslug, product)}>
      <div className="group bg-white rounded-xl nice-shadow overflow-hidden flex flex-col h-full cursor-pointer transition-all duration-200 hover:scale-[1.01]">
        <div className="relative aspect-video overflow-hidden flex items-center justify-center bg-gray-50">
          {thumbnail ? (
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `url(${thumbnail})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          ) : (
            <ShoppingBag size={28} className="text-gray-200" strokeWidth={1.5} />
          )}

          <div className="absolute top-2.5 start-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-0.5">
              {productIcon(product.kind)}
              {t(`store.badge.${product.kind}`)}
            </span>
          </div>
        </div>

        <div className="p-4 flex flex-col flex-1 gap-2">
          <h2 className="font-bold text-base text-gray-900 leading-snug group-hover:text-indigo-700 transition-colors">
            {product.name}
          </h2>
          {product.description && (
            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{product.description}</p>
          )}

          <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
            <div className="text-xl font-black text-gray-900">
              {new Intl.NumberFormat(i18n.language || 'en', {
                style: 'currency',
                currency: product.price_currency,
                maximumFractionDigits: 0,
              }).format(product.price_amount)}
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-xl bg-zinc-800 text-white group-hover:bg-zinc-700 transition-colors">
              {t('store.get_access')}
              <ArrowRight size={13} className="rtl:rotate-180" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

function Store({ orgslug, products, enabled = true }: StoreProps) {
  const { t } = useTranslation()
  const org = useOrg() as any

  if (!enabled) {
    return (
      <div className="w-full">
        <GeneralWrapperStyled>
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-4 nice-shadow">
              <ShoppingBag size={28} className="text-gray-300" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold text-gray-600 mb-2">{t('store.not_available_title')}</h2>
            <p className="text-gray-400 text-sm max-w-sm">
              {t('store.not_available_description')}
            </p>
          </div>
        </GeneralWrapperStyled>
      </div>
    )
  }

  return (
    <div className="w-full">
      <GeneralWrapperStyled>
        <div className="flex items-center gap-3 my-6">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white nice-shadow">
            <ShoppingBag size={18} className="text-gray-800" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{t('store.title')}</h1>
            {org?.name && (
              <p className="text-sm text-gray-400 mt-0.5">{t('store.subtitle', { org: org.name })}</p>
            )}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-4 nice-shadow">
              <ShoppingBag size={28} className="text-gray-300" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold text-gray-600 mb-2">{t('store.empty_title')}</h2>
            <p className="text-gray-400 text-sm max-w-sm">
              {t('store.empty_description')}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-5">
              {t('store.offers_available', { count: products.length })}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((product) => (
                <ProductCard
                  key={product.key}
                  product={product}
                  orgslug={orgslug}
                  orgUuid={org?.org_uuid ?? ''}
                />
              ))}
            </div>
          </>
        )}
      </GeneralWrapperStyled>
    </div>
  )
}

export default Store
