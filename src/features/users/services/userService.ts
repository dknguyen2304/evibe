import { User } from '@/lib/db/entities/User';
import { UserCreate } from '@/features/users/schemas/userSchema';
import { getUserRepository } from '@/lib/db';

/**
 * Get all users
 */
export async function getAllUsers() {
  try {
    const userRepo = await getUserRepository();
    const users = userRepo.find();
    return { success: true, data: users };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { success: false, error: 'Failed to fetch users' };
  }
}

/**
 * Get user by ID
 */
export async function getUserById(id: string) {
  try {
    const userRepo = await getUserRepository();
    const user = await userRepo.findOne({
      where: { id },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    return { success: true, data: user };
  } catch (error) {
    console.error('Error fetching user:', error);
    return { success: false, error: 'Failed to fetch user' };
  }
}

/**
 * Create a new user
 */
export async function createUser(userData: UserCreate) {
  try {
    const userRepo = await getUserRepository();
    // Check if user already exists
    const existingUser = await userRepo.findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      return { success: false, error: 'Email already in use' };
    }

    // Create new user
    const newUser = userRepo.create(userData);

    // Save to database
    await userRepo.save(newUser);

    return { success: true, data: newUser };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: 'Failed to create user' };
  }
}

/**
 * Update a user
 */
export async function updateUser(id: string, userData: Partial<UserCreate>) {
  try {
    const userRepo = await getUserRepository();
    // Check if user exists
    const user = await userRepo.findOne({
      where: { id },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Check email uniqueness if trying to update email
    if (userData.email && userData.email !== user.email) {
      const existingUser = await userRepo.findOne({
        where: { email: userData.email },
      });

      if (existingUser) {
        return { success: false, error: 'Email already in use' };
      }
    }

    // Update user
    const updatedUser = await userRepo.save({
      ...user,
      ...userData,
    });

    return { success: true, data: updatedUser };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: 'Failed to update user' };
  }
}

/**
 * Delete a user
 */
export async function deleteUser(id: string) {
  try {
    const userRepo = await getUserRepository();
    // Check if user exists
    const user = await userRepo.findOne({
      where: { id },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Delete user
    await userRepo.remove(user);

    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: 'Failed to delete user' };
  }
}
