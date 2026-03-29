"use client";

import Link from "next/link";
import { use } from "react";
import { useEventDetail } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, MapPin, Users, Clock, ArrowLeft } from "lucide-react";

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { event, loading, error } = useEventDetail(resolvedParams.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="space-y-4">
        <Link href="/events">
          <Button variant="outline" className="gap-2">
            <ArrowLeft size={16} />
            Back to Events
          </Button>
        </Link>
        <Card>
          <CardContent className="pt-12 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">
              {error || "Event not found"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/events">
        <Button variant="outline" className="gap-2">
          <ArrowLeft size={16} />
          Back to Events
        </Button>
      </Link>

      <div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
          <Calendar className="w-10 h-10" />
          {event.title}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          {event.description}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{event.date}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{event.time || "TBD"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {event.registeredCount || 0}
              {event.maxCapacity && ` / ${event.maxCapacity}`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="font-semibold">Upcoming</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {event.location && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 dark:text-slate-300">
              {event.location}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Event Information</CardTitle>
          <CardDescription>Details about this event</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-slate-700 dark:text-slate-300">
              {event.description}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Created By</h3>
            <p className="text-slate-700 dark:text-slate-300">
              {typeof event.createdBy === "string"
                ? event.createdBy
                : event.createdBy
                  ? `${event.createdBy.firstName} ${event.createdBy.lastName}`
                  : "Not specified"}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Created</h3>
            <p className="text-slate-700 dark:text-slate-300">
              {event.createdAt
                ? new Date(event.createdAt).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
