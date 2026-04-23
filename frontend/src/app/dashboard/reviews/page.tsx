"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import type { Review } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Star, MessageSquare, Eye, EyeOff, Send } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ReviewWithMeta extends Review {
  isVisible: boolean;
}

export default function DashboardReviewsPage() {
  const [reviews, setReviews] = useState<ReviewWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    fetchReviews();
  }, [page]);

  async function fetchReviews() {
    try {
      setLoading(true);
      const res = await api.get<any>(`/reviews/dashboard?page=${page}&limit=20`);
      if (res.data) {
        setReviews(res.data.data || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  }

  async function handleReply(reviewId: string) {
    if (!replyText.trim()) return;
    try {
      await api.post(`/reviews/${reviewId}/reply`, { text: replyText });
      setReplyingTo(null);
      setReplyText("");
      fetchReviews();
    } catch {
      // handle silently
    }
  }

  async function toggleVisibility(reviewId: string) {
    try {
      await api.patch(`/reviews/${reviewId}/visibility`, {});
      fetchReviews();
    } catch {
      // handle silently
    }
  }

  function renderStars(rating: number) {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`}
          />
        ))}
      </div>
    );
  }

  function getInitial(name: string) {
    return name?.charAt(0)?.toUpperCase() || "?";
  }

  const avatarColors = [
    "bg-purple-100 text-purple-600",
    "bg-sky-100 text-sky-600",
    "bg-emerald-100 text-emerald-600",
    "bg-rose-100 text-rose-600",
    "bg-amber-100 text-amber-600",
    "bg-indigo-100 text-indigo-600",
  ];

  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reviews" description="Manage customer reviews and replies" />
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse rounded-xl border-border/60">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 bg-muted rounded-full" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded-xl w-1/4" />
                    <div className="h-3 bg-muted rounded-xl w-1/3" />
                  </div>
                </div>
                <div className="h-3 bg-muted rounded-xl w-2/3 mb-2" />
                <div className="h-3 bg-muted rounded-xl w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Reviews" description="Manage customer reviews and replies" />

      {reviews.length === 0 ? (
        <Card className="rounded-xl border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center mb-5">
              <Star className="h-8 w-8 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold">No reviews yet</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              Reviews from your customers will appear here once they complete their bookings and leave feedback.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reviews.map((review, i) => (
            <motion.div
              key={review._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={`rounded-xl border-border/60 ${!review.isVisible ? "opacity-60" : ""}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${avatarColors[i % avatarColors.length]}`}
                      >
                        {getInitial(
                          typeof review.customerId === "object"
                            ? review.customerId.name
                            : "C"
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">
                            {typeof review.customerId === "object"
                              ? review.customerId.name
                              : "Customer"}
                          </CardTitle>
                          {renderStars(review.rating)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {typeof review.serviceId === "object" ? review.serviceId.name : "Service"}{" "}
                          &middot; {formatDate(review.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={review.isVisible ? "default" : "secondary"} className="rounded-xl">
                        {review.isVisible ? (
                          <Eye className="h-3 w-3 mr-1 text-emerald-500" />
                        ) : (
                          <EyeOff className="h-3 w-3 mr-1 text-muted-foreground" />
                        )}
                        {review.isVisible ? "Visible" : "Hidden"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => toggleVisibility(review._id)}
                        title={review.isVisible ? "Hide review" : "Show review"}
                      >
                        {review.isVisible ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-emerald-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {review.comment && (
                    <p className="text-sm leading-relaxed">{review.comment}</p>
                  )}

                  {review.reply?.text ? (
                    <div className="rounded-xl bg-muted/50 p-3 border-l-[3px] border-l-transparent" style={{ borderImage: "linear-gradient(to bottom, hsl(var(--primary)), hsl(var(--primary)/0.3)) 1" }}>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Your reply &middot;{" "}
                        {review.reply.repliedAt
                          ? formatDate(review.reply.repliedAt)
                          : ""}
                      </p>
                      <p className="text-sm">{review.reply.text}</p>
                    </div>
                  ) : replyingTo === review._id ? (
                    <div className="flex gap-2">
                      <Input
                        className="rounded-xl"
                        placeholder="Write a reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleReply(review._id);
                        }}
                      />
                      <Button size="sm" className="rounded-xl" onClick={() => handleReply(review._id)}>
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-xl"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => setReplyingTo(review._id)}
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center text-sm text-muted-foreground px-3">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
