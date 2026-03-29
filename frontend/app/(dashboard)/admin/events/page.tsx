"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useEvents } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar, ArrowLeft, Users, MapPin } from "lucide-react";

export default function AdminEventsPage() {
  const { user } = useAuth();
  const { events, loading } = useEvents();
  const [searchTerm, setSearchTerm] = useState("");

  if (user?.role !== "admin") {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400 text-lg font-semibold">
          You don't have permission to access this page
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  const filteredEvents = events.filter(
    (e) =>
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <Link href="/admin">
        <Button variant="outline" className="gap-2">
          <ArrowLeft size={16} />
          Back to Admin
        </Button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-8 h-8" />
          Event Management
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Organize and manage programming contests and events
        </p>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Link href="/admin/events/create">
          <Button>Create Event</Button>
        </Link>
      </div>

      <div className="grid gap-6">
        {filteredEvents.map((event) => (
          <Card key={event._id || event.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span>{event.title}</span>
                <span className="text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-3 py-1 rounded-full flex items-center gap-1">
                  <Users size={14} />
                  {event.registeredCount || 0}
                  {event.maxCapacity && `/${event.maxCapacity}`}
                </span>
              </CardTitle>
              <CardDescription>{event.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Date
                  </p>
                  <p className="text-sm mt-1">{event.date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Time
                  </p>
                  <p className="text-sm mt-1">{event.time || "TBD"}</p>
                </div>
                {event.location && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Location
                    </p>
                    <p className="text-sm mt-1 flex items-center gap-1">
                      <MapPin size={14} />
                      {event.location}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Registrations
                  </p>
                  <p className="text-sm mt-1">
                    {event.registeredCount || 0} registered
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm">
                  Edit
                </Button>
                <Button variant="outline" size="sm">
                  View Registrations
                </Button>
                <Button variant="outline" size="sm">
                  Attendance
                </Button>
                <Button variant="outline" size="sm" className="text-red-600">
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <Card>
          <CardContent className="pt-12 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              {searchTerm
                ? "No events match your search"
                : "No events created yet"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
