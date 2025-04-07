// src/app/admin/movies/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/shared/ui/pagination';
import { useAuth } from '@/shared/hooks/use-auth';

interface Movie {
  id: string;
  title: string;
  type: string;
  releaseYear: number;
  viewCount: number;
  isFeatured: boolean;
  createdAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminMovies() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState('');
  const [isLoadingMovies, setIsLoadingMovies] = useState(true);

  useEffect(() => {
    // Check if user is admin
    if (!isLoading && (!user || !user.roles.includes('admin'))) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  const fetchMovies = async (page = 1, searchTerm = '') => {
    try {
      setIsLoadingMovies(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }

      const response = await fetch(`/api/movies?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMovies(data.data);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch movies');
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setIsLoadingMovies(false);
    }
  };

  useEffect(() => {
    if (user && user.roles.includes('admin')) {
      fetchMovies(pagination.page, search);
    }
  }, [user, pagination.page]);

  const handleSearch = () => {
    fetchMovies(1, search);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this movie?')) {
      return;
    }

    try {
      const response = await fetch(`/api/movies/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        // Refresh the movie list
        fetchMovies(pagination.page, search);
      } else {
        console.error('Failed to delete movie');
      }
    } catch (error) {
      console.error('Error deleting movie:', error);
    }
  };

  if (isLoading || !user) {
    return <div className='flex justify-center items-center min-h-screen'>Loading...</div>;
  }

  if (!user.roles.includes('admin')) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className='container mx-auto p-4'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>Movie Management</h1>
        <Button onClick={() => router.push('/admin/movies/new')}>Add New Movie</Button>
      </div>

      <div className='flex mb-4'>
        <Input
          placeholder='Search movies...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='max-w-sm mr-2'
        />
        <Button onClick={handleSearch}>Search</Button>
      </div>

      {isLoadingMovies ? (
        <div className='text-center py-4'>Loading movies...</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Added Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movies.length > 0 ? (
                movies.map((movie) => (
                  <TableRow key={movie.id}>
                    <TableCell className='font-medium'>{movie.title}</TableCell>
                    <TableCell>{movie.type}</TableCell>
                    <TableCell>{movie.releaseYear}</TableCell>
                    <TableCell>{movie.viewCount}</TableCell>
                    <TableCell>{movie.isFeatured ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{new Date(movie.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className='flex space-x-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => router.push(`/admin/movies/${movie.id}`)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant='destructive'
                          size='sm'
                          onClick={() => handleDelete(movie.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className='text-center'>
                    No movies found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {pagination.totalPages > 1 && (
            <Pagination className='mt-4'>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => fetchMovies(Math.max(1, pagination.page - 1), search)}
                    className={pagination.page <= 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>

                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show current page, first, last, and pages around current
                    return (
                      page === 1 ||
                      page === pagination.totalPages ||
                      Math.abs(page - pagination.page) <= 1
                    );
                  })
                  .map((page, index, array) => (
                    <PaginationItem key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <PaginationItem>
                          <PaginationLink>...</PaginationLink>
                        </PaginationItem>
                      )}
                      <PaginationLink
                        isActive={page === pagination.page}
                        onClick={() => fetchMovies(page, search)}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      fetchMovies(Math.min(pagination.totalPages, pagination.page + 1), search)
                    }
                    className={
                      pagination.page >= pagination.totalPages
                        ? 'pointer-events-none opacity-50'
                        : ''
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}
