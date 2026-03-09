import { Card, CardContent } from '@/components/ui/card';
import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="pt-12 pb-8 text-center">
        <div className="flex justify-center mb-4">{icon}</div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
        {description && (
          <p className="text-slate-600 dark:text-slate-400 mb-6">{description}</p>
        )}
        {action && <div className="flex justify-center">{action}</div>}
      </CardContent>
    </Card>
  );
}
