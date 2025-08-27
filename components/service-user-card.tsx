"use client"

import type { ServiceUser } from "@/lib/types/database"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Edit, Phone, Mail, MapPin } from "lucide-react"

interface ServiceUserCardProps {
  user: ServiceUser
}

export function ServiceUserCard({ user }: ServiceUserCardProps) {
  return (
    <Link href={`/service-users/${user.id}`} className="block transition-transform hover:-translate-y-1">
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-1">
              <p className="font-semibold text-lg">{user.name}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {user.area && (
                  <span className="flex items-center"><MapPin className="mr-1.5 h-3.5 w-3.5" />{user.area}</span>
                )}
                {user.phone && (
                  <span className="flex items-center"><Phone className="mr-1.5 h-3.5 w-3.5" />{user.phone}</span>
                )}
                {user.email && (
                  <span className="flex items-center truncate"><Mail className="mr-1.5 h-3.5 w-3.5" />{user.email}</span>
                )}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem asChild>
                <Link href={`/service-users/${user.id}/edit`}>
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