// src/app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { useAuth } from '@/shared/hooks/use-auth';

interface DashboardStats {
  totalMovies: number;
  totalUsers: number;
  totalViews: number;
  recentMovies: any[];
  popularMovies: any[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    debugger;
    // Check if user is admin
    if (!isLoading && (!user || !user.roles.includes('admin'))) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          console.error('Failed to fetch dashboard stats');
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    if (user && user.roles.includes('admin')) {
      fetchStats();
    }
  }, [user]);

  if (isLoading || !user) {
    return <div className='flex justify-center items-center min-h-screen'>Loading...</div>;
  }

  if (!user.roles.includes('admin')) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className='container mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-6'>Admin Dashboard</h1>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Total Movies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {isLoadingStats ? 'Loading...' : stats?.totalMovies || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {isLoadingStats ? 'Loading...' : stats?.totalUsers || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {isLoadingStats ? 'Loading...' : stats?.totalViews || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue='recent' className='w-full'>
        <TabsList>
          <TabsTrigger value='recent'>Recent Movies</TabsTrigger>
          <TabsTrigger value='popular'>Popular Movies</TabsTrigger>
        </TabsList>

        <TabsContent value='recent'>
          <Card>
            <CardHeader>
              <CardTitle>Recently Added Movies</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div>Loading...</div>
              ) : stats?.recentMovies && stats.recentMovies.length > 0 ? (
                <div className='space-y-4'>
                  {stats.recentMovies.map((movie) => (
                    <div key={movie.id} className='flex items-center space-x-4'>
                      <div className='w-16 h-16 bg-gray-200 rounded overflow-hidden'>
                        {movie.posterUrl && (
                          <img
                            src={movie.posterUrl}
                            alt={movie.title}
                            className='w-full h-full object-cover'
                          />
                        )}
                      </div>
                      <div>
                        <h3 className='font-medium'>{movie.title}</h3>
                        <p className='text-sm text-gray-500'>
                          Added {new Date(movie.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>No recent movies found</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='popular'>
          <Card>
            <CardHeader>
              <CardTitle>Popular Movies</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div>Loading...</div>
              ) : stats?.popularMovies && stats.popularMovies.length > 0 ? (
                <div className='space-y-4'>
                  {stats.popularMovies.map((movie) => (
                    <div key={movie.id} className='flex items-center space-x-4'>
                      <div className='w-16 h-16 bg-gray-200 rounded overflow-hidden'>
                        {movie.posterUrl && (
                          <img
                            src={movie.posterUrl}
                            alt={movie.title}
                            className='w-full h-full object-cover'
                          />
                        )}
                      </div>
                      <div>
                        <h3 className='font-medium'>{movie.title}</h3>
                        <p className='text-sm text-gray-500'>{movie.viewCount} views</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>No popular movies found</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
