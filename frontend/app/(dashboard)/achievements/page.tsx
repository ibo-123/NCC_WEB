'use client';

import Link from 'next/link';
import { useAchievements } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award } from 'lucide-react';

export default function AchievementsPage() {
  const { achievements, loading } = useAchievements();

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="w-8 h-8" />
          Achievements
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Explore achievements and track your progress
        </p>
      </div>

      {achievements.length === 0 ? (
        <Card>
          <CardContent className="pt-12 text-center">
            <Award className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              No achievements available yet
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((achievement) => (
            <Card key={achievement._id || achievement.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="line-clamp-2">{achievement.title}</CardTitle>
                  {achievement.points && (
                    <span className="ml-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-semibold rounded-full whitespace-nowrap">
                      {achievement.points} pts
                    </span>
                  )}
                </div>
                <CardDescription className="line-clamp-3">{achievement.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                {achievement.awardedTo && Array.isArray(achievement.awardedTo) && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Awarded to: {achievement.awardedTo.length} {achievement.awardedTo.length === 1 ? 'person' : 'people'}
                    </p>
                  </div>
                )}
                <Link href={`/achievements/${achievement._id || achievement.id}`}>
                  <Button className="w-full">View Details</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
