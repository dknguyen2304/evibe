'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { useAuth } from '@/shared/hooks/use-auth';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: { id: string; name: string; description: string }[];
}

export default function AdminRoles() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  useEffect(() => {
    // Check if user is admin
    if (!isLoading && (!user || !user.roles.includes('admin'))) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  const fetchRoles = async () => {
    try {
      setIsLoadingRoles(true);

      const response = await fetch('/api/roles', {
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      } else {
        console.error('Failed to fetch roles');
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setIsLoadingRoles(false);
    }
  };

  useEffect(() => {
    if (user && user.roles.includes('admin')) {
      fetchRoles();
    }
  }, [user]);

  const handleDelete = async (id: string, name: string) => {
    // Prevent deleting built-in roles
    if (['admin', 'user'].includes(name)) {
      alert('Cannot delete built-in roles');
      return;
    }

    if (!confirm('Are you sure you want to delete this role?')) {
      return;
    }

    try {
      const response = await fetch(`/api/roles/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().token}`,
        },
      });

      if (response.ok) {
        // Refresh the role list
        fetchRoles();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete role');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
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
        <h1 className='text-2xl font-bold'>Role Management</h1>
        <Button onClick={() => router.push('/admin/roles/new')}>Add New Role</Button>
      </div>

      {isLoadingRoles ? (
        <div className='text-center py-4'>Loading roles...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length > 0 ? (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className='font-medium'>{role.name}</TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>
                    <div className='flex flex-wrap gap-1'>
                      {role.permissions.map((permission) => (
                        <span key={permission.id} className='bg-gray-100 px-2 py-1 rounded text-xs'>
                          {permission.name}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='flex space-x-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => router.push(`/admin/roles/${role.id}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={() => handleDelete(role.id, role.name)}
                        disabled={['admin', 'user'].includes(role.name)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className='text-center'>
                  No roles found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
