'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useAchievements } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Award, ArrowLeft, Users } from 'lucide-react';

export default function AdminAchievementsPage() {
  const { user } = useAuth();
  const { achievements, loading } = useAchievements();
  const [searchTerm, setSearchTerm] = useState('');

  if (user?.role !== 'admin') {
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
          <p>Loading achievements...</p>
        </div>
      </div>
    );
  }

  const filteredAchievements = achievements.filter((a) =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.description?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <Award className="w-8 h-8" />
          Achievement Management
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Create and award achievements to members
        </p>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search achievements..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button>Create Achievement</Button>
      </div>

      <div className="grid gap-6">
        {filteredAchievements.map((achievement) => (
          <Card key={achievement._id || achievement.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span>{achievement.title}</span>
                <div className="flex items-center gap-2">
                  {achievement.points && (
                    <span className="text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-3 py-1 rounded-full">
                      {achievement.points} pts
                    </span>
                  )}
                  <span className="text-sm bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full flex items-center gap-1">
                    <Users size={14} />
                    {achievement.awardedTo && Array.isArray(achievement.awardedTo) ? achievement.awardedTo.length : 0}
                  </span>
                </div>
              </CardTitle>
              <CardDescription>{achievement.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Points</p>
                  <p className="text-sm mt-1">{achievement.points || 0} points</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Awards Given</p>
                  <p className="text-sm mt-1">
                    {achievement.awardedTo && Array.isArray(achievement.awardedTo) ? achievement.awardedTo.length : 0} people
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Created</p>
                  <p className="text-sm mt-1">
                    {achievement.createdAt ? new Date(achievement.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm">
                  Edit
                </Button>
                <Button variant="outline" size="sm">
                  Award Achievement
                </Button>
                <Button variant="outline" size="sm">
                  View Recipients
                </Button>
                <Button variant="outline" size="sm" className="text-red-600">
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAchievements.length === 0 && (
        <Card>
          <CardContent className="pt-12 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              {searchTerm ? 'No achievements match your search' : 'No achievements created yet'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
