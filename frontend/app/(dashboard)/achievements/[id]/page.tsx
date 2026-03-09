'use client';

import Link from 'next/link';
import { useAchievements } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, ArrowLeft } from 'lucide-react';

export default function AchievementDetailPage({ params }: { params: { id: string } }) {
  const { achievements, loading } = useAchievements();
  const achievement = achievements.find((a) => (a._id || a.id) === params.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading achievement...</p>
        </div>
      </div>
    );
  }

  if (!achievement) {
    return (
      <div className="space-y-4">
        <Link href="/achievements">
          <Button variant="outline" className="gap-2">
            <ArrowLeft size={16} />
            Back to Achievements
          </Button>
        </Link>
        <Card>
          <CardContent className="pt-12 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">Achievement not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/achievements">
        <Button variant="outline" className="gap-2">
          <ArrowLeft size={16} />
          Back to Achievements
        </Button>
      </Link>

      <div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
          <Award className="w-10 h-10" />
          {achievement.title}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">{achievement.description}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{achievement.points || 0}</div>
            <p className="text-sm text-slate-600 dark:text-slate-400">points awarded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recipients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {achievement.awardedTo && Array.isArray(achievement.awardedTo) ? achievement.awardedTo.length : 0}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">people have earned this</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Rarity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {achievement.awardedTo && Array.isArray(achievement.awardedTo) && achievement.awardedTo.length <= 10
                ? 'Rare'
                : 'Common'}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">achievement level</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Achievement Details</CardTitle>
          <CardDescription>Full information about this achievement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-slate-700 dark:text-slate-300">{achievement.description}</p>
          </div>

          {achievement.awardedTo && Array.isArray(achievement.awardedTo) && achievement.awardedTo.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Recent Recipients</h3>
              <div className="space-y-2">
                {achievement.awardedTo.slice(0, 10).map((recipient: any, idx: number) => (
                  <div key={idx} className="text-sm text-slate-700 dark:text-slate-300 p-2 bg-slate-100 dark:bg-slate-800 rounded">
                    {typeof recipient === 'string' ? recipient : `${recipient.firstName} ${recipient.lastName}`}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-2">Created</h3>
            <p className="text-slate-700 dark:text-slate-300">
              {achievement.createdAt ? new Date(achievement.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
