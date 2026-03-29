"use client";

import { useState } from "react";
import Link from "next/link";
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
import { Calendar, MapPin, Users } from "lucide-react";

export default function EventsPage() {
  const { events, loading, registerEvent } = useEvents();
  const [searchTerm, setSearchTerm] = useState("");
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const now = new Date();
  const upcomingEvents = filteredEvents.filter(
    (event) => new Date(event.startDate) > now,
  );
  const ongoingEvents = filteredEvents.filter(
    (event) =>
      new Date(event.startDate) <= now && new Date(event.endDate) >= now,
  );
  const previousEvents = filteredEvents.filter(
    (event) => new Date(event.endDate) < now,
  );

  const handleRegister = async (eventId: string) => {
    setRegisteringId(eventId);
    setMessage("");

    try {
      await registerEvent(eventId);
      setMessage("Successfully registered for event!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to register");
    } finally {
      setRegisteringId(null);
    }
  };

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-8 h-8" />
          Contests
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Discover and register for upcoming programming contests
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.includes("Successfully")
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
          }`}
        >
          {message}
        </div>
      )}

      <div>
        <Input
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="pt-12 text-center">
            <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              {searchTerm
                ? "No contests match your search"
                : "No contests available yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Card key={event._id || event.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                <CardDescription className="line-clamp-3">
                  {event.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>{event.date}</span>
                  </div>
                  {event.time && (
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>{event.time}</span>
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span>{event.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    <span>{event.registeredCount || 0} registered</span>
                  </div>
                </div>
                <Link
                  href={`/events/${event._id || event.id}`}
                  className="block"
                >
                  <Button className="w-full mb-2" variant="outline">
                    View Details
                  </Button>
                </Link>
                <Button
                  onClick={() => handleRegister(event._id || event.id || "")}
                  disabled={registeringId === (event._id || event.id)}
                  className="w-full"
                >
                  {registeringId === (event._id || event.id)
                    ? "Registering..."
                    : "Register Now"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
