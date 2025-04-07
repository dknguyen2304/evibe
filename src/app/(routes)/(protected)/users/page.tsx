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

interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  createdAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminUsers() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    // Check if user is admin
    if (!isLoading && (!user || !user.roles.includes('admin'))) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  const fetchUsers = async (page = 1, searchTerm = '') => {
    try {
      setIsLoadingUsers(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }

      const response = await fetch(`/api/users?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (user && user.roles.includes('admin')) {
      fetchUsers(pagination.page, search);
    }
  }, [user, pagination.page]);

  const handleSearch = () => {
    fetchUsers(1, search);
  };

  const handleDelete = async (id: string) => {
    // Prevent deleting yourself
    if (id === user?.id) {
      alert('You cannot delete your own account');
      return;
    }

    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        // Refresh the user list
        fetchUsers(pagination.page, search);
      } else {
        console.error('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
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
        <h1 className='text-2xl font-bold'>User Management</h1>
        <Button onClick={() => router.push('/admin/users/new')}>Add New User</Button>
      </div>

      <div className='flex mb-4'>
        <Input
          placeholder='Search users...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='max-w-sm mr-2'
        />
        <Button onClick={handleSearch}>Search</Button>
      </div>

      {isLoadingUsers ? (
        <div className='text-center py-4'>Loading users...</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length > 0 ? (
                users.map((userItem) => (
                  <TableRow key={userItem.id}>
                    <TableCell className='font-medium'>{userItem.name}</TableCell>
                    <TableCell>{userItem.email}</TableCell>
                    <TableCell>{userItem.roles.join(', ')}</TableCell>
                    <TableCell>{new Date(userItem.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className='flex space-x-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => router.push(`/admin/users/${userItem.id}`)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant='destructive'
                          size='sm'
                          onClick={() => handleDelete(userItem.id)}
                          disabled={userItem.id === user.id}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className='text-center'>
                    No users found
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
                    onClick={() => fetchUsers(Math.max(1, pagination.page - 1), search)}
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
                        onClick={() => fetchUsers(page, search)}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      fetchUsers(Math.min(pagination.totalPages, pagination.page + 1), search)
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
