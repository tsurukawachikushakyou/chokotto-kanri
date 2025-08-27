/**
 * Next.js 15対応のページプロパティ型定義
 */

export interface BasePageProps {
  params: Promise<Record<string, string>>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export interface PagePropsWithId {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export interface SearchParams {
  search?: string
  status?: string
  area?: string
  skill?: string
  supporter?: string
  service_user?: string
  date_from?: string
  date_to?: string
  skills?: string
  time_slots?: string
  view?: string
  month?: string
  time_slot?: string
}

// 型安全なsearchParamsの解析関数
export function parseSearchParams(searchParams: Record<string, string | string[] | undefined>): SearchParams {
  const getString = (key: string): string | undefined => {
    const value = searchParams[key]
    return typeof value === "string" ? value : undefined
  }

  return {
    search: getString("search"),
    status: getString("status"),
    area: getString("area"),
    skill: getString("skill"),
    supporter: getString("supporter"),
    service_user: getString("service_user"),
    date_from: getString("date_from"),
    date_to: getString("date_to"),
    skills: getString("skills"),
    time_slots: getString("time_slots"),
    view: getString("view"),
    month: getString("month"),
    time_slot: getString("time_slot"),
  }
}