'use client'

import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import { useState } from 'react'
import { updateUrlWithParams } from '@/lib/url-utils'

interface ActivityFiltersProps {
  supporters: Array<{ id: string; name: string }>
  serviceUsers: Array<{ id: string; name: string }>
  statuses: Array<{ id: string; name: string }>
  initialValues: {
    search?: string
    supporter?: string
    service_user?: string
    status?: string
    date_from?: string
    date_to?: string
  }
}

export function ActivityFilters({ supporters, serviceUsers, statuses, initialValues }: ActivityFiltersProps) {
  const router = useRouter()
  
  const [search, setSearch] = useState(initialValues.search || '')
  const [supporter, setSupporter] = useState(initialValues.supporter || 'all')
  const [serviceUser, setServiceUser] = useState(initialValues.service_user || 'all')
  const [status, setStatus] = useState(initialValues.status || 'all')
  const [dateFrom, setDateFrom] = useState(initialValues.date_from || '')
  const [dateTo, setDateTo] = useState(initialValues.date_to || '')

  const updateFilters = () => {
    const url = updateUrlWithParams('/activities', {
      search: search.trim(),
      supporter: supporter !== 'all' ? supporter : undefined,
      service_user: serviceUser !== 'all' ? serviceUser : undefined,
      status: status !== 'all' ? status : undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    })
    router.push(url)
  }

  const clearFilters = () => {
    setSearch('')
    setSupporter('all')
    setServiceUser('all')
    setStatus('all')
    setDateFrom('')
    setDateTo('')
    router.push('/activities')
  }

  const hasFilters = search.trim() || (supporter && supporter !== 'all') || (serviceUser && serviceUser !== 'all') || (status && status !== 'all') || dateFrom || dateTo

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg border">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="text-sm font-medium mb-2 block">キーワード検索</label>
          <Input
            placeholder="サポーター名、利用者名、スキル名で検索"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && updateFilters()}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">サポーター</label>
          <Select value={supporter} onValueChange={setSupporter}>
            <SelectTrigger>
              <SelectValue placeholder="すべて" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              {supporters.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">利用者</label>
          <Select value={serviceUser} onValueChange={setServiceUser}>
            <SelectTrigger>
              <SelectValue placeholder="すべて" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              {serviceUsers.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">ステータス</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="すべて" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">開始日</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">終了日</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={updateFilters}>
          <Search className="mr-2 h-4 w-4" />
          検索
        </Button>
        {hasFilters && (
          <Button variant="outline" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            クリア
          </Button>
        )}
      </div>
    </div>
  )
}
