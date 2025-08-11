'use client'

import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import { useState } from 'react'
import { updateUrlWithParams } from '@/lib/url-utils'

interface SupporterFiltersProps {
  areas: string[]
  skills: string[]
  initialValues: {
    search?: string
    status?: string
    area?: string
    skill?: string
  }
}

export function SupporterFilters({ areas, skills, initialValues }: SupporterFiltersProps) {
  const router = useRouter()
  
  const [search, setSearch] = useState(initialValues.search || '')
  const [status, setStatus] = useState(initialValues.status || 'all')
  const [area, setArea] = useState(initialValues.area || 'all')
  const [skill, setSkill] = useState(initialValues.skill || 'all')

  const updateFilters = () => {
    const url = updateUrlWithParams('/supporters', {
      search: search.trim(),
      status: status !== 'all' ? status : undefined,
      area: area !== 'all' ? area : undefined,
      skill: skill !== 'all' ? skill : undefined,
    })
    router.push(url)
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('all')
    setArea('all')
    setSkill('all')
    router.push('/supporters')
  }

  const hasFilters = search.trim() || (status && status !== 'all') || (area && area !== 'all') || (skill && skill !== 'all')

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg border">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="text-sm font-medium mb-2 block">名前検索</label>
          <Input
            placeholder="サポーター名で検索"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && updateFilters()}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">ステータス</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="すべて" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="応募受付">応募受付</SelectItem>
              <SelectItem value="面接済み">面接済み</SelectItem>
              <SelectItem value="登録完了">登録完了</SelectItem>
              <SelectItem value="休止中">休止中</SelectItem>
            </SelectContent>
          </Select>
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

        <div>
          <label className="text-sm font-medium mb-2 block">できること</label>
          <Select value={skill} onValueChange={setSkill}>
            <SelectTrigger>
              <SelectValue placeholder="すべて" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              {skills.map((skillOption) => (
                <SelectItem key={skillOption} value={skillOption}>
                  {skillOption}
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
