"use client"

import { Heart, MessageCircle, Share } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { SocialPost } from "@/lib/redux/slices/socialFeedSlice"
import Image from "next/image"

interface SocialFeedCardProps {
  post: SocialPost
  onLike: () => void
}

export function SocialFeedCard({ post, onLike }: SocialFeedCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={post.user.avatar || "/placeholder.svg"} alt={post.user.name} />
            <AvatarFallback>{post.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{post.user.name}</div>
            <div className="text-xs text-muted-foreground">
              @{post.user.username} · {post.timestamp}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <p className="mb-3">{post.content}</p>
        {post.image && (
          <div className="relative h-60 w-full rounded-md overflow-hidden mb-2">
            <Image src={post.image || "/placeholder.svg"} alt="Post image" fill className="object-cover" />
          </div>
        )}
      </CardContent>
      <CardFooter className="p-2 border-t flex justify-between">
        <Button
          variant="ghost"
          size="sm"
          className={`flex items-center gap-1 ${post.liked ? "text-red-500" : ""}`}
          onClick={onLike}
        >
          <Heart className={`h-4 w-4 ${post.liked ? "fill-red-500" : ""}`} />
          <span>{post.likes}</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center gap-1">
          <MessageCircle className="h-4 w-4" />
          <span>{post.comments}</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center gap-1">
          <Share className="h-4 w-4" />
          <span>Share</span>
        </Button>
      </CardFooter>
    </Card>
  )
}
