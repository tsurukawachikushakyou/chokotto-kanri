'use client'

import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import { useState } from 'react'
import { updateUrlWithParams } from '@/lib/url-utils'

interface ServiceUserFiltersProps {
  areas: string[]
  initialValues: {
    search?: string
    area?: string
  }
}

export function ServiceUserFilters({ areas, initialValues }: ServiceUserFiltersProps) {
  const router = useRouter()
  
  const [search, setSearch] = useState(initialValues.search || '')
  const [area, setArea] = useState(initialValues.area || 'all')

  const updateFilters = () => {
    const url = updateUrlWithParams('/service-users', {
      search: search.trim(),
      area: area !== 'all' ? area : undefined,
    })
    router.push(url)
  }

  const clearFilters = () => {
    setSearch('')
    setArea('all')
    router.push('/service-users')
  }

  const hasFilters = search.trim() || (area && area !== 'all')

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg border">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium mb-2 block">名前検索</label>
          <Input
            placeholder="利用者名で検索"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && updateFilters()}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">エリア</label>
          <Select value={area} onValueChange={setArea}>
            <SelectTrigger>
              <SelectValue placeholder="すべて" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              {areas.map((areaOption) => (
                <SelectItem key={areaOption} value={areaOption}>
                  {areaOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
