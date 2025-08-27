"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Edit, Phone, Mail, MapPin, Wrench } from "lucide-react"

// ★ 修正点: page.tsxから渡される型と完全に一致させる
interface SupporterForCard {
  id: string
  name: string
  phone: string | null
  email: string | null
  area: string | null
  status: string | null
  // created_at はカードに表示しないが、page.tsxから渡されるので型に含める
  created_at: string
  supporter_skills: Array<{
    skills: {
      name: string
    }
  }>
}

interface SupporterCardProps {
  supporter: SupporterForCard
}

const statusColors = {
  応募受付: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  面接済み: 'bg-blue-100 text-blue-800 border-blue-200',
  登録完了: 'bg-green-100 text-green-800 border-green-200',
  休止中: 'bg-gray-100 text-gray-800 border-gray-200',
} as const

export function SupporterCard({ supporter }: SupporterCardProps) {
  return (
    <Link href={`/supporters/${supporter.id}`} className="block transition-transform hover:-translate-y-1">
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 overflow-hidden">
            <div className="flex-1 space-y-2 overflow-hidden">
              <div className="flex items-center gap-3 flex-wrap">
                <p className="font-semibold text-lg truncate">{supporter.name}</p>
                <Badge className={statusColors[supporter.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
                    {supporter.status || 'N/A'}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {supporter.area && (
                  <span className="flex items-center"><MapPin className="mr-1.5 h-3.5 w-3.5" />{supporter.area}</span>
                )}
                {supporter.phone && (
                  <span className="flex items-center"><Phone className="mr-1.5 h-3.5 w-3.5" />{supporter.phone}</span>
                )}
                {supporter.email && (
                  <span className="flex items-center truncate"><Mail className="mr-1.5 h-3.5 w-3.5" />{supporter.email}</span>
                )}
              </div>
              {supporter.supporter_skills.length > 0 && (
                <div className="flex items-start text-sm text-muted-foreground pt-1">
                    <Wrench className="mr-1.5 h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <div className="flex flex-wrap gap-1">
                        {supporter.supporter_skills.slice(0, 4).map((ss, index) => (
                        <Badge key={index} variant="secondary" className="font-normal">
                            {ss.skills.name}
                        </Badge>
                        ))}
                        {supporter.supporter_skills.length > 4 && (
                        <Badge variant="secondary" className="font-normal">
                            +{supporter.supporter_skills.length - 4}
                        </Badge>
                        )}
                    </div>
                </div>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem asChild>
                <Link href={`/supporters/${supporter.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  編集
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>
    </Link>
  )
}