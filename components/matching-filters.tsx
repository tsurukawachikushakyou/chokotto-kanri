'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
// Card, CardContent, CardHeader, CardTitle は削除
import { Search, X } from 'lucide-react'
import { useState } from 'react'
import { updateUrlWithParams } from '@/lib/url-utils'

interface MatchingFiltersProps {
  skills: Array<{ id: string; name: string; category: string | null }>
  timeSlots: Array<{ id: string; display_name: string; day_of_week: number }>
  initialValues: {
    skills?: string
    time_slots?: string
  }
}

export function MatchingFilters({ skills, timeSlots, initialValues }: MatchingFiltersProps) {
  const router = useRouter()
  
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    initialValues.skills ? initialValues.skills.split(',') : []
  )
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>(
    initialValues.time_slots ? initialValues.time_slots.split(',') : []
  )

  const updateFilters = () => {
    const url = updateUrlWithParams('/matching', {
      skills: selectedSkills.length > 0 ? selectedSkills.join(',') : undefined,
      time_slots: selectedTimeSlots.length > 0 ? selectedTimeSlots.join(',') : undefined,
    })
    router.push(url)
  }

  const clearFilters = () => {
    setSelectedSkills([])
    setSelectedTimeSlots([])
    router.push('/matching')
  }

  const handleSkillChange = (skillId: string, checked: boolean) => {
    if (checked) {
      setSelectedSkills([...selectedSkills, skillId])
    } else {
      setSelectedSkills(selectedSkills.filter(id => id !== skillId))
    }
  }

  const handleTimeSlotChange = (timeSlotId: string, checked: boolean) => {
    if (checked) {
      setSelectedTimeSlots([...selectedTimeSlots, timeSlotId])
    } else {
      setSelectedTimeSlots(selectedTimeSlots.filter(id => id !== timeSlotId))
    }
  }

  const hasFilters = selectedSkills.length > 0 || selectedTimeSlots.length > 0

  // スキルをカテゴリ別にグループ化
  const skillsByCategory = skills.reduce((acc, skill) => {
    const category = skill.category || 'その他'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(skill)
    return acc
  }, {} as Record<string, typeof skills>)

  return (
    <div className="space-y-6"> {/* この外側のdivは残し、親のgrid gapで調整 */}
      {/* スキル選択 */}
      <div> {/* Cardの代わりにdivを使用 */}
        <h3 className="text-lg font-semibold mb-4">サポート内容選択</h3> {/* CardTitleの代わりにh3 */}
        <div className="space-y-4"> {/* CardContentのspace-y-4を維持 */}
          {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
            <div key={category}>
              <h4 className="font-medium mb-2">{category}</h4>
              <div className="grid grid-cols-1 gap-2">
                {categorySkills.map((skill) => (
                  <div key={skill.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`skill-${skill.id}`}
                      checked={selectedSkills.includes(skill.id)}
                      onCheckedChange={(checked) => handleSkillChange(skill.id, checked as boolean)}
                    />
                    <Label htmlFor={`skill-${skill.id}`} className="text-sm">
                      {skill.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 活動可能時間選択 */}
      <div> {/* Cardの代わりにdivを使用 */}
        <h3 className="text-lg font-semibold mb-4">活動可能時間選択</h3> {/* CardTitleの代わりにh3 */}
        <div> {/* CardContentの代わりにdivを使用 */}
          <div className="grid grid-cols-1 gap-2">
            {timeSlots.map((timeSlot) => (
              <div key={timeSlot.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`time-slot-${timeSlot.id}`}
                  checked={selectedTimeSlots.includes(timeSlot.id)}
                  onCheckedChange={(checked) => handleTimeSlotChange(timeSlot.id, checked as boolean)}
                />
                <Label htmlFor={`time-slot-${timeSlot.id}`} className="text-sm">
                  {timeSlot.display_name}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={updateFilters} disabled={!hasFilters}>
          <Search className="mr-2 h-4 w-4" />
          検索 ({selectedSkills.length + selectedTimeSlots.length}件選択中)
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
