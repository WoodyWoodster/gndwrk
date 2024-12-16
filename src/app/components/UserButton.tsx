'use client'

import { useClerk, useUser } from '@clerk/nextjs'
import { LogOut, Settings } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function UserButton() {
  const { user } = useUser()
  const { signOut } = useClerk()

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarImage
            src={user.imageUrl}
            alt={user.fullName ?? 'User avatar'}
          />
          <AvatarFallback>{user.firstName?.charAt(0) ?? 'U'}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px]">
        <div className="flex items-center gap-3 p-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={user.imageUrl}
              alt={user.fullName ?? 'User avatar'}
            />
            <AvatarFallback>{user.firstName?.charAt(0) ?? 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-0.5">
            <p className="text-sm font-medium">{user.fullName}</p>
            <p className="text-xs text-muted-foreground">
              {user.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <a href="/user-profile" className="flex w-full items-center">
            <Settings className="mr-2 h-4 w-4" />
            Manage account
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => signOut()}
          className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
